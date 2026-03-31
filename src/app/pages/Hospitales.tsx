import { useState, useCallback, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Plus,
  Building2,
  FileSpreadsheet,
  Trash2,
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  LayoutDashboard,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useHospitalContext } from '../../contexts/HospitalContext';
import { useAuth, usePermissions } from '../../contexts/AuthContext';
import {
  updateHospital,
  deleteHospital,
  saveHospitalFile,
  deleteHospitalFileData,
} from '../../lib/supabase/hospitals';
import type { Hospital, HospitalFile } from '../../lib/supabase/hospitals';
import { getSupabaseClient } from '../../lib/supabase/client';
import { parseInterventionFile } from '../../lib/parsers/excelParser';
import { upsertInterventions } from '../../lib/supabase/queries/interventions';
import { toast } from 'sonner';
import { processAndSaveExcel } from '../../modules/excel/excelProcessor';
import { useHospitalFiles } from '../../hooks/useHospitalFiles';
import { useHospitalUploadStatuses } from '../../hooks/useHospitalUploadStatuses';
import { getCurrentMonthValue } from '../../lib/analytics/proaPeriods';
import { EmptyState } from '../components/EmptyState';
import { ProaReportModal } from '../components/ProaReportModal';
import { InfoTooltip } from '../components/Tooltip';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface PendingFile {
  id: string;
  file: File;
  month: number;
  year: number;
  status: 'idle' | 'uploading' | 'done' | 'error';
  message: string;
  aiWarning?: string; // set when AI normalization was unavailable
}

interface ReportPromptState {
  hospitalId: string;
  month: string;
  message: string;
}

function filesInRange(
  files: HospitalFile[],
  range: '1m' | '6m' | '12m' | 'all',
): HospitalFile[] {
  if (range === 'all') return files;
  if (range === '1m') {
    // Most recent file by uploaded_at
    const sorted = [...files].sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
    return sorted.length > 0 ? [sorted[0]] : [];
  }
  const now = new Date();
  const currentYM = now.getFullYear() * 12 + now.getMonth();
  const months = range === '6m' ? 6 : 12;
  return files.filter((f) => {
    const fileYM = f.year * 12 + (f.month - 1);
    return currentYM - fileYM < months;
  });
}

function formatUploadDate(ts: string): string {
  const d = new Date(ts);
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

interface HospitalFormValues {
  name: string;
  city: string;
  department: string;
  beds: string;
  contactEmail: string;
}

function validateHospitalForm({
  name,
  city,
  department,
  beds,
  contactEmail,
}: HospitalFormValues): string | null {
  if (!name.trim() || !city.trim() || !department.trim()) {
    return 'Nombre, ciudad y departamento son obligatorios.';
  }

  if (beds.trim()) {
    const bedsValue = Number(beds);
    if (!Number.isInteger(bedsValue) || bedsValue < 0) {
      return 'El número de camas debe ser un entero mayor o igual a cero.';
    }
  }

  if (contactEmail.trim() && !isValidEmail(contactEmail.trim())) {
    return 'Ingresa un correo de contacto válido.';
  }

  return null;
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function toMonthValue(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function Hospitales() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canCreate, canDelete } = usePermissions();
  const {
    hospitals,
    setSelectedHospitalObj,
    refreshHospitals,
    hospitalsLoading,
    hospitalsError,
    dateRange,
    setDateRange,
  } = useHospitalContext();

  // View state
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [activeHospital, setActiveHospital] = useState<Hospital | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'files'>('info');

  // Add hospital form (VIEW A)
  const [showAddForm, setShowAddForm] = useState(false);
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [addName, setAddName] = useState('');
  const [addCity, setAddCity] = useState('');
  const [addDept, setAddDept] = useState('');
  const [addBeds, setAddBeds] = useState('');
  const [addContactName, setAddContactName] = useState('');
  const [addContactEmail, setAddContactEmail] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit form state (VIEW B — Información tab)
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editBeds, setEditBeds] = useState('');
  const [editContactName, setEditContactName] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editSaving, setEditSaving] = useState(false);
  const [editSaved, setEditSaved] = useState(false);
  const [editError, setEditError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // File management state (VIEW B — Archivos tab)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [reportPrompt, setReportPrompt] = useState<ReportPromptState | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Excel upload for new hospital form
  const [addExcelFile, setAddExcelFile] = useState<File | null>(null);
  const [addExcelProcessing, setAddExcelProcessing] = useState(false);
  const addExcelRef = useRef<HTMLInputElement>(null);

  // Excel update on existing hospital cards
  const updateExcelRef = useRef<HTMLInputElement>(null);
  const [updateTargetId, setUpdateTargetId] = useState<string | null>(null);
  const [updatingExcelId, setUpdatingExcelId] = useState<string | null>(null);

  const {
    files: activeHospitalFiles,
    loading: activeFilesLoading,
    error: activeFilesError,
    refresh: refreshActiveFiles,
  } = useHospitalFiles(activeHospital?.id ?? null);
  const {
    statuses: uploadStatuses,
    refresh: refreshUploadStatuses,
  } = useHospitalUploadStatuses(hospitals.map((hospital) => hospital.id));

  const filteredHospitals = useMemo(() => {
    const query = normalizeText(hospitalSearch.trim());

    if (!query) {
      return hospitals;
    }

    return hospitals.filter((hospital) =>
      [
        hospital.name,
        hospital.city,
        hospital.department,
        hospital.contact_name ?? '',
        hospital.contact_email ?? '',
      ].some((value) => normalizeText(value).includes(query)),
    );
  }, [hospitalSearch, hospitals]);

  const openDetail = useCallback((h: Hospital) => {
    setSelectedHospitalObj(h);
    setActiveHospital(h);
    setEditName(h.name);
    setEditCity(h.city);
    setEditDept(h.department);
    setEditBeds(h.beds != null ? String(h.beds) : '');
    setEditContactName(h.contact_name ?? '');
    setEditContactEmail(h.contact_email ?? '');
    setEditIsActive(h.is_active);
    setEditSaved(false);
    setEditError('');
    setShowDeleteConfirm(false);
    setPendingFiles([]);
    setDeleteConfirmId(null);
    setReportPrompt(null);
    setActiveTab('info');
    setView('detail');
  }, [setSelectedHospitalObj]);

  const backToList = useCallback(() => {
    setView('list');
    setActiveHospital(null);
    setPendingFiles([]);
    setDeleteConfirmId(null);
    setReportPrompt(null);
  }, []);

  // ── VIEW A: add hospital ──────────────────────────────────────────────────

  const resetAddForm = () => {
    setAddName(''); setAddCity(''); setAddDept('');
    setAddBeds(''); setAddContactName(''); setAddContactEmail('');
    setAddError(''); setAddExcelFile(null);
  };

  const handleAddHospital = async () => {
    if (!user?.id) {
      setAddError('Debes iniciar sesion para crear hospitales.');
      return;
    }

    const validationError = validateHospitalForm({
      name: addName,
      city: addCity,
      department: addDept,
      beds: addBeds,
      contactEmail: addContactEmail,
    });

    if (validationError) {
      setAddError(validationError);
      return;
    }

    setAddSaving(true);
    setAddError('');

    try {
      const { data: newHospital, error } = await getSupabaseClient()
        .from('hospitals')
        .insert({
          name: addName.trim(),
          city: addCity.trim(),
          department: addDept.trim(),
          beds: addBeds ? parseInt(addBeds, 10) : null,
          contact_name: addContactName.trim() || null,
          contact_email: addContactEmail.trim().toLowerCase() || null,
          is_active: true,
          user_id: user.id,
        })
        .select('*')
        .single();

      if (error) {
        setAddError(error.message);
        return;
      }

      if (addExcelFile && newHospital?.id && user?.id) {
        setAddExcelProcessing(true);
        toast.info('Procesando Excel...');
        const result = await processAndSaveExcel(newHospital.id, addExcelFile, user.id);
        if (result.success) {
          toast.success(`Hospital creado y Excel procesado: ${result.monthsFound.length} mes${result.monthsFound.length !== 1 ? 'es' : ''}, ${result.totalRows} registros.`);
          await refreshUploadStatuses();
        } else {
          toast.error(result.error ?? 'Error al procesar el Excel.');
        }
        setAddExcelProcessing(false);
      }

      await refreshHospitals();
      toast.success('Hospital guardado correctamente.');
      resetAddForm();
      setShowAddForm(false);
    } finally {
      setAddSaving(false);
    }
  };

  // ── VIEW B: save edits ────────────────────────────────────────────────────

  const handleSaveEdit = async () => {
    if (!activeHospital) return;

    const validationError = validateHospitalForm({
      name: editName,
      city: editCity,
      department: editDept,
      beds: editBeds,
      contactEmail: editContactEmail,
    });

    if (validationError) {
      setEditError(validationError);
      return;
    }

    setEditSaving(true);
    setEditError('');

    try {
      const { error } = await updateHospital(activeHospital.id, {
        name: editName.trim(),
        city: editCity.trim(),
        department: editDept.trim(),
        beds: editBeds ? parseInt(editBeds, 10) : null,
        contact_name: editContactName.trim() || null,
        contact_email: editContactEmail.trim().toLowerCase() || null,
        is_active: editIsActive,
      });

      if (error) {
        setEditError(error.message);
        return;
      }

      setEditSaved(true);
      setActiveHospital({
        ...activeHospital,
        name: editName.trim(),
        city: editCity.trim(),
        department: editDept.trim(),
        beds: editBeds ? parseInt(editBeds, 10) : null,
        contact_name: editContactName.trim() || null,
        contact_email: editContactEmail.trim().toLowerCase() || null,
        is_active: editIsActive,
      });
      await refreshHospitals();
      toast.success('Hospital actualizado correctamente.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeHospital) return;
    setDeleting(true);

    try {
      const { error } = await deleteHospital(activeHospital.id);
      if (error) {
        toast.error(error.message);
        return;
      }

      await refreshHospitals();
      toast.success('Hospital eliminado correctamente.');
      backToList();
    } finally {
      setDeleting(false);
    }
  };

  // ── VIEW B: file upload ───────────────────────────────────────────────────

  const addPendingFiles = (files: FileList | File[]) => {
    const now = new Date();
    const incomingFiles = Array.from(files);
    const invalidFiles = incomingFiles.filter((file) => !/\.(xlsx|xls|csv)$/i.test(file.name));

    if (invalidFiles.length > 0) {
      toast.error('Solo se permiten archivos Excel o CSV.');
    }

    const existingKeys = new Set(
      pendingFiles.map((pendingFile) => `${pendingFile.file.name}-${pendingFile.file.size}`),
    );

    const newItems: PendingFile[] = incomingFiles
      .filter((file) => /\.(xlsx|xls|csv)$/i.test(file.name))
      .filter((file) => {
        const fileKey = `${file.name}-${file.size}`;
        if (existingKeys.has(fileKey)) {
          return false;
        }

        existingKeys.add(fileKey);
        return true;
      })
      .map((file) => ({
        id: Math.random().toString(36).slice(2),
        file,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        status: 'idle',
        message: '',
      }));

    if (newItems.length === 0 && incomingFiles.length > 0 && invalidFiles.length !== incomingFiles.length) {
      toast.error('Esos archivos ya estaban en la cola.');
      return;
    }

    setPendingFiles((prev) => [...prev, ...newItems]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addPendingFiles(e.dataTransfer.files);
  };

  const handleUploadFile = async (pendingId: string) => {
    if (!activeHospital) return;
    const pf = pendingFiles.find((p) => p.id === pendingId);
    if (!pf) return;

    setPendingFiles((prev) =>
      prev.map((p) => (p.id === pendingId ? { ...p, status: 'uploading', message: 'Analizando archivo...' } : p)),
    );

    try {
      const { valid, errors, aiWarning } = await parseInterventionFile(pf.file);
      if (valid.length === 0) {
        throw new Error(errors.length > 0 ? errors[0].message : 'Sin registros válidos en el archivo.');
      }

      const recordsWithHospital = valid.map((record) => ({ ...record, hospitalName: activeHospital.name }));
      const { inserted, error: uploadError } = await upsertInterventions(recordsWithHospital);
      if (uploadError) throw new Error(uploadError);

      await saveHospitalFile({
        hospital_id: activeHospital.id,
        file_name: pf.file.name,
        month: pf.month,
        year: pf.year,
        record_count: inserted,
        uploaded_by: user?.id ?? null,
      });

      await refreshActiveFiles();
      await refreshUploadStatuses();
      window.dispatchEvent(new CustomEvent('infectus:data-updated'));

      setPendingFiles((prev) =>
        prev.map((p) =>
          p.id === pendingId
            ? { ...p, status: 'done', message: `${inserted} registros cargados`, aiWarning }
            : p,
        ),
      );
      setReportPrompt({
        hospitalId: activeHospital.id,
        month: toMonthValue(pf.year, pf.month),
        message: `${inserted} registros listos para generar el reporte del comite.`,
      });
      toast.success(`${inserted} registros cargados correctamente.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setPendingFiles((prev) =>
        prev.map((p) => (p.id === pendingId ? { ...p, status: 'error', message: msg } : p)),
      );
      toast.error(msg);
    }
  };

  const removePending = (id: string) => {
    setPendingFiles((prev) => prev.filter((p) => p.id !== id));
  };

  // Delete a hospital file AND its associated intervention records
  const handleDeleteFileConfirmed = async (fileId: string) => {
    const f = activeHospitalFiles.find((hf) => hf.id === fileId);
    if (!f || !activeHospital) return;

    const { error } = await deleteHospitalFileData(
      activeHospital.id,
      activeHospital.name,
      fileId,
      f.month,
      f.year,
    );

    if (error) {
      toast.error(error.message);
      return;
    }

    await refreshActiveFiles();
    await refreshUploadStatuses();
    window.dispatchEvent(new CustomEvent('infectus:data-updated'));
    setDeleteConfirmId(null);
    toast.success('Archivo eliminado correctamente.');
  };

  const handleUpdateExcel = async (file: File, hospitalId: string) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesion para actualizar archivos Excel.');
      return;
    }
    setUpdatingExcelId(hospitalId);
    toast.info('Procesando Excel...');
    const result = await processAndSaveExcel(hospitalId, file, user.id);
    if (result.success) {
      toast.success(`Excel actualizado: ${result.monthsFound.length} mes${result.monthsFound.length !== 1 ? 'es' : ''}, ${result.totalRows} registros.`);
      await refreshUploadStatuses();
      setReportPrompt({
        hospitalId,
        month: result.monthsFound[result.monthsFound.length - 1] ?? getCurrentMonthValue(),
        message: `Excel actualizado con ${result.totalRows} registros. Ya puedes generar el reporte del mes.`,
      });
    } else {
      toast.error(result.error ?? 'Error al procesar el Excel.');
    }
    setUpdatingExcelId(null);
    setUpdateTargetId(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: VIEW A — Hospital list
  // ─────────────────────────────────────────────────────────────────────────

  if (view === 'list') {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 lg:mb-8">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gestion de hospitales</h1>
              <InfoTooltip content="Gestiona los hospitales donde aplicas el Programa PROA" />
            </div>
            <p className="text-gray-500 text-sm">Crea hospitales, carga archivos Excel y revisa el estado de la informacion institucional.</p>
          </div>
          {canCreate && (
            <button
              onClick={() => { resetAddForm(); setShowAddForm((v) => !v); }}
              className="flex min-h-[44px] items-center space-x-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
            >
              <Plus className="w-4 h-4" />
              <span>Crear hospital</span>
            </button>
          )}
        </div>

        <div className="mb-6 rounded-2xl border border-teal-100 bg-teal-50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-900">Que hacer aqui primero</p>
              <p className="mt-1 text-sm text-teal-700">
                Crea el hospital, sube el Excel del periodo y luego entra al dashboard del hospital para revisar indicadores y archivos cargados.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium text-teal-700">
              <span className="rounded-full border border-teal-200 bg-white px-3 py-1">1. Crear hospital</span>
              <span className="rounded-full border border-teal-200 bg-white px-3 py-1">2. Subir Excel</span>
              <span className="rounded-full border border-teal-200 bg-white px-3 py-1">3. Revisar dashboard</span>
            </div>
          </div>
        </div>

        {hospitals.length > 0 && (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <input
                  value={hospitalSearch}
                  onChange={(event) => setHospitalSearch(event.target.value)}
                  placeholder="Buscar por hospital, ciudad, departamento o responsable"
                  className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                />
              </label>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2">
                <p className="text-xs text-gray-500">Hospitales visibles</p>
                <p className="text-sm font-semibold text-gray-900">{filteredHospitals.length}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2">
                <p className="text-xs text-gray-500">Con datos Excel</p>
                <p className="text-sm font-semibold text-gray-900">
                  {filteredHospitals.filter((hospital) => Boolean(uploadStatuses[hospital.id])).length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Inline Add Form */}
        {showAddForm && (
          <div className="mb-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Nuevo hospital</h3>
            {addError && <p className="text-sm text-red-600 mb-3">{addError}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Nombre *</label>
                <input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-400"
                  placeholder="Hospital General Central"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Ciudad *</label>
                <input
                  value={addCity}
                  onChange={(e) => setAddCity(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-400"
                  placeholder="Bogotá"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Departamento *</label>
                <input
                  value={addDept}
                  onChange={(e) => setAddDept(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-400"
                  placeholder="Cundinamarca"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Camas</label>
                <input
                  type="number"
                  value={addBeds}
                  onChange={(e) => setAddBeds(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-400"
                  placeholder="150"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Nombre contacto</label>
                <input
                  value={addContactName}
                  onChange={(e) => setAddContactName(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-400"
                  placeholder="Dr. Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Email contacto</label>
                <input
                  type="email"
                  value={addContactEmail}
                  onChange={(e) => setAddContactEmail(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-400"
                  placeholder="contacto@hospital.com"
                />
              </div>
            </div>

            {/* Optional Excel upload */}
            <div
              className={`mt-4 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                addExcelFile ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
              }`}
              onClick={() => addExcelRef.current?.click()}
            >
              <FileSpreadsheet className={`w-7 h-7 mx-auto mb-1.5 ${addExcelFile ? 'text-indigo-500' : 'text-gray-300'}`} />
              <p className="text-sm font-medium text-gray-700">
                {addExcelFile ? addExcelFile.name : 'Subir Excel con datos históricos (opcional)'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">.xlsx, .xls — puede contener múltiples meses</p>
              <input
                ref={addExcelRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => setAddExcelFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={handleAddHospital}
                disabled={addSaving || addExcelProcessing}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-teal-700"
              >
                {(addSaving || addExcelProcessing) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {addSaving ? 'Guardando...' : addExcelProcessing ? 'Procesando Excel...' : 'Crear hospital'}
              </button>
              <button
                onClick={() => { setShowAddForm(false); resetAddForm(); }}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Hospital cards grid */}
        {hospitalsLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`hospital-skeleton-${index}`}
                className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 h-5 w-2/3 rounded bg-gray-200" />
                <div className="mb-6 h-4 w-1/2 rounded bg-gray-100" />
                <div className="mb-3 h-4 w-full rounded bg-gray-100" />
                <div className="mb-3 h-4 w-5/6 rounded bg-gray-100" />
                <div className="mt-6 flex gap-2">
                  <div className="h-10 w-24 rounded-lg bg-gray-100" />
                  <div className="h-10 w-24 rounded-lg bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : hospitalsError ? (
          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-base font-semibold text-red-700">No se pudieron cargar tus hospitales</p>
                <p className="mt-1 text-sm text-red-600">{hospitalsError}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void refreshHospitals();
                }}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : hospitals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
            <EmptyState
              icon={Building2}
              title="Aún no tienes hospitales registrados"
              description="Crea tu primer hospital para empezar a cargar archivos y registrar evaluaciones PROA."
              action={canCreate ? { label: 'Crear mi primer hospital', onClick: () => setShowAddForm(true) } : undefined}
            />
          </div>
        ) : filteredHospitals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
            <EmptyState
              icon={Building2}
              title="No hay hospitales con esa búsqueda"
              description="Ajusta el texto de búsqueda para volver a ver hospitales registrados."
              action={{ label: 'Limpiar búsqueda', onClick: () => setHospitalSearch('') }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHospitals.map((h) => (
              <div
                key={h.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base leading-tight">{h.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {h.city}, {h.department}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ml-2 shrink-0 ${
                      h.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {h.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {h.beds != null && (
                  <p className="text-xs text-gray-500 mb-1">{h.beds} camas</p>
                )}

                {/* Excel status badge */}
                {uploadStatuses[h.id] ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
                      ✓ Excel cargado · {uploadStatuses[h.id].months_found.length} mes{uploadStatuses[h.id].months_found.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
                      Sin datos Excel
                    </span>
                  </div>
                )}

                <div className="mt-auto pt-4 flex flex-col sm:flex-row gap-2">
                  {/* Actualizar Excel */}
                  <button
                    onClick={() => { setUpdateTargetId(h.id); updateExcelRef.current?.click(); }}
                    disabled={updatingExcelId === h.id}
                    className="w-full sm:flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {updatingExcelId === h.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{updatingExcelId === h.id ? 'Procesando...' : 'Subir Excel'}</span>
                  </button>
                  <button
                    onClick={() => navigate(`/hospitales/${h.id}/dashboard`)}
                    className="flex w-full items-center justify-center space-x-1 rounded-lg bg-teal-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-teal-700 sm:flex-1"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Ver Dashboard</span>
                  </button>
                  <button
                    onClick={() => openDetail(h)}
                    className="w-full sm:flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Gestionar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Hidden input for updating Excel on existing hospital cards */}
      <input
        ref={updateExcelRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && updateTargetId) handleUpdateExcel(file, updateTargetId);
          e.target.value = '';
        }}
      />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: VIEW B — Hospital detail
  // ─────────────────────────────────────────────────────────────────────────

  const filteredFiles = filesInRange(activeHospitalFiles, dateRange);
  const totalRecordsInRange = filteredFiles.reduce((sum, f) => sum + f.record_count, 0);
  const totalRecordsAll = activeHospitalFiles.reduce((sum, f) => sum + f.record_count, 0);

  // Date span for summary bar
  const sortedForSpan = [...filteredFiles].sort(
    (a, b) => (a.year * 12 + a.month) - (b.year * 12 + b.month),
  );
  const earliest = sortedForSpan[0];
  const latest = sortedForSpan[sortedForSpan.length - 1];
  const dateSpan =
    earliest && latest
      ? `${MONTH_NAMES[earliest.month - 1].slice(0, 3)} ${earliest.year} — ${MONTH_NAMES[latest.month - 1].slice(0, 3)} ${latest.year}`
      : '—';

  const RANGE_LABELS: Record<'1m' | '6m' | '12m' | 'all', string> = {
    '1m': 'Último mes',
    '6m': '6 meses',
    '12m': '12 meses',
    'all': 'Todos',
  };

  return (
    <>
      <ProaReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        initialHospitalId={reportPrompt?.hospitalId ?? activeHospital?.id}
        initialMonth={reportPrompt?.month}
        initialScope="hospital"
      />

      <div className="p-4 lg:p-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-3 mb-4 lg:mb-8">
          <button
            onClick={backToList}
            className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Hospitales</span>
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          {activeHospital?.name}
        </span>
        </div>

      {/* Tabs */}
        <div className="flex space-x-1 mb-6 border-b border-gray-200">
        {(['info', 'files'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'info' ? 'Información' : 'Archivos Excel'}
          </button>
        ))}
        </div>

      {/* ── TAB: Información ── */}
        {activeTab === 'info' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm max-w-2xl">
          {editError && <p className="text-sm text-red-600 mb-4">{editError}</p>}
          {editSaved && (
            <p className="text-sm text-green-600 mb-4">Cambios guardados correctamente.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Nombre</label>
              <input
                value={editName}
                onChange={(e) => { setEditName(e.target.value); setEditSaved(false); }}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Ciudad</label>
              <input
                value={editCity}
                onChange={(e) => { setEditCity(e.target.value); setEditSaved(false); }}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Departamento</label>
              <input
                value={editDept}
                onChange={(e) => { setEditDept(e.target.value); setEditSaved(false); }}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Camas</label>
              <input
                type="number"
                value={editBeds}
                onChange={(e) => { setEditBeds(e.target.value); setEditSaved(false); }}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Nombre contacto</label>
              <input
                value={editContactName}
                onChange={(e) => { setEditContactName(e.target.value); setEditSaved(false); }}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Email contacto</label>
              <input
                type="email"
                value={editContactEmail}
                onChange={(e) => { setEditContactEmail(e.target.value); setEditSaved(false); }}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-400"
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center space-x-3 mb-6">
            <button
              onClick={() => { setEditIsActive((v) => !v); setEditSaved(false); }}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                editIsActive ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform ${
                  editIsActive ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-700">Hospital activo</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleSaveEdit}
              disabled={editSaving}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-teal-700"
            >
              {editSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>

            {canDelete && (
              <div className="ml-auto">
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar hospital</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-red-600">
                      ¿Eliminar? Esta acción no se puede deshacer
                    </span>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleting ? 'Eliminando...' : 'Confirmar'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Archivos Excel ── */}
        {activeTab === 'files' && (
        <div className="max-w-3xl">

          {/* ── TOP: Drop zone ── */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 lg:p-10 text-center cursor-pointer transition-colors mb-4 ${
              isDragging
                ? 'border-teal-400 bg-teal-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
            }`}
          >
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-base font-medium text-gray-700">
              Arrastra tus archivos Excel o CSV aquí
            </p>
            <p className="text-sm text-gray-400 mt-1">
              o{' '}
              <span className="text-teal-600 underline">
                haz clic para seleccionar
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-2">Acepta .xlsx y .csv • Sin límite de archivos</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files) addPendingFiles(e.target.files); }}
            />
          </div>

          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">Como usar esta carga</p>
            <p className="mt-1 text-sm text-blue-700">
              Agrega los archivos del periodo, revisa mes y ano antes de subirlos y luego confirma la carga.
              La tabla inferior solo muestra archivos del rango seleccionado.
            </p>
          </div>
          {/* ── Queue of pending files ── */}
          {reportPrompt ? (
            <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-teal-900">Carga completada</p>
                  <p className="mt-1 text-sm text-teal-700">{reportPrompt.message}</p>
                </div>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                >
                  Generar PowerPoint del mes
                </button>
              </div>
            </div>
          ) : null}

          {pendingFiles.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl mb-6 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Archivos pendientes
                  </span>
                  <p className="mt-1 text-xs text-gray-400">
                    {pendingFiles.filter((pendingFile) => pendingFile.status === 'idle').length} listos para cargar
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {pendingFiles.some((pendingFile) => pendingFile.status === 'idle') && (
                    <button
                      onClick={() => {
                        pendingFiles
                          .filter((pendingFile) => pendingFile.status === 'idle')
                          .forEach((pendingFile) => {
                            void handleUploadFile(pendingFile.id);
                          });
                      }}
                      className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700"
                    >
                      Cargar todo
                    </button>
                  )}
                  <span className="text-xs text-gray-400">{pendingFiles.length} archivo{pendingFiles.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              {pendingFiles.map((pf) => (
                <div
                  key={pf.id}
                  className="flex flex-wrap items-center gap-2 px-3 lg:px-4 py-3 border-b border-gray-100 last:border-0"
                >
                  <FileSpreadsheet className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700 flex-1 min-w-0 truncate" title={pf.file.name}>
                    {pf.file.name}
                  </span>

                  {/* Month selector */}
                  <select
                    value={pf.month}
                    disabled={pf.status !== 'idle'}
                    onChange={(e) =>
                      setPendingFiles((prev) =>
                        prev.map((p) =>
                          p.id === pf.id ? { ...p, month: parseInt(e.target.value, 10) } : p,
                        ),
                      )
                    }
                    className="text-xs border border-gray-300 rounded px-2 py-1 outline-none shrink-0"
                  >
                    {MONTH_NAMES.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>

                  {/* Year input */}
                  <input
                    type="number"
                    value={pf.year}
                    disabled={pf.status !== 'idle'}
                    onChange={(e) =>
                      setPendingFiles((prev) =>
                        prev.map((p) =>
                          p.id === pf.id ? { ...p, year: parseInt(e.target.value, 10) } : p,
                        ),
                      )
                    }
                    className="text-xs border border-gray-300 rounded px-2 py-1 w-20 outline-none shrink-0"
                  />

                  {/* Status / upload button */}
                  {pf.status === 'idle' && (
                    <button
                      onClick={() => handleUploadFile(pf.id)}
                      className="shrink-0 rounded-lg bg-teal-600 px-3 py-1 text-xs font-medium text-white hover:bg-teal-700"
                    >
                      Cargar
                    </button>
                  )}
                  {pf.status === 'uploading' && (
                    <Loader2 className="w-4 h-4 text-teal-600 animate-spin shrink-0" />
                  )}
                  {pf.status === 'done' && (
                    <span className="flex items-center space-x-1 text-xs text-green-600 shrink-0">
                      <CheckCircle className="w-4 h-4" />
                      <span>{pf.message}</span>
                    </span>
                  )}
                  {pf.status === 'error' && (
                    <span
                      className="flex items-center space-x-1 text-xs text-red-600 shrink-0 max-w-[180px] truncate"
                      title={pf.message}
                    >
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span className="truncate">{pf.message}</span>
                    </span>
                  )}

                  {/* AI warning badge — shown when AI normalization was unavailable */}
                  {pf.aiWarning && (
                    <span
                      className="flex items-center space-x-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 shrink-0"
                      title={pf.aiWarning}
                    >
                      <span>⚠</span>
                      <span className="hidden sm:inline">IA no disponible</span>
                    </span>
                  )}

                  {/* Remove from queue */}
                  <button
                    onClick={() => removePending(pf.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                    title="Quitar de la cola"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── BOTTOM: Uploaded files ── */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Section header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Archivos cargados
                </span>
                <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                  {activeHospitalFiles.length}
                </span>
              </div>

              {/* Date range filter buttons */}
              <div className="flex items-center gap-1 flex-wrap">
                {(['1m', '6m', '12m', 'all'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setDateRange(r)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors border ${
                      dateRange === r
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {RANGE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>

            {/* Table or empty state */}
            {activeFilesLoading ? (
              <div className="flex flex-col items-center py-12">
                <Loader2 className="mb-3 h-10 w-10 animate-spin text-gray-300" />
                <p className="text-sm font-medium text-gray-500">Cargando archivos del hospital...</p>
              </div>
            ) : activeFilesError ? (
              <div className="flex flex-col items-center py-12">
                <XCircle className="mb-3 h-10 w-10 text-red-300" />
                <p className="text-sm font-medium text-red-600">{activeFilesError}</p>
              </div>
            ) : activeHospitalFiles.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <Upload className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-500">
                  No hay archivos cargados para este hospital
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Usa la zona de arrastre de arriba para subir archivos
                </p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <FileSpreadsheet className="mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">
                  No hay archivos en el periodo seleccionado
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Cambia el rango o carga un archivo correspondiente a ese periodo.
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mes</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Año</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Nombre archivo</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Registros</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Fecha carga</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredFiles.map((f) => {
                    const isConfirming = deleteConfirmId === f.id;
                    return (
                      <tr
                        key={f.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-700">{MONTH_NAMES[f.month - 1]}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{f.year}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-[180px] truncate hidden sm:table-cell" title={f.file_name}>
                          {f.file_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-right font-medium">
                          {f.record_count.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap hidden sm:table-cell">
                          {formatUploadDate(f.uploaded_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isConfirming ? (
                            <span className="flex items-center justify-end space-x-2">
                              <span className="text-xs text-red-600 whitespace-nowrap">¿Eliminar?</span>
                              <button
                                onClick={() => handleDeleteFileConfirmed(f.id)}
                                className="px-2 py-0.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                              >
                                Sí
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-0.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                              >
                                No
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(f.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                              title="Eliminar archivo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Summary bar */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  <span className="font-medium text-gray-700">{filteredFiles.length}</span> archivo{filteredFiles.length !== 1 ? 's' : ''}
                  {' '}·{' '}
                  <span className="font-medium text-gray-700">{totalRecordsInRange.toLocaleString()}</span> registros en rango
                  {filteredFiles.length !== activeHospitalFiles.length && (
                    <span className="text-gray-400"> (de {totalRecordsAll.toLocaleString()} totales)</span>
                  )}
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {dateSpan}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
