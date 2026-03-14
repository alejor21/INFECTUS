import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Search, Trash2, UserRound, Stethoscope, Pencil, X } from 'lucide-react';
import { useHospitalContext } from '../../contexts/HospitalContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
  getFollowups,
  createFollowup,
  updateFollowup,
  deleteFollowup,
  getFollowupCounts,
} from '../../lib/supabase/patients';
import type { Patient, TreatmentFollowup } from '../../lib/supabase/patients';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function genderLabel(g: Patient['gender']): string {
  if (g === 'M') return 'Masculino';
  if (g === 'F') return 'Femenino';
  if (g === 'otro') return 'Otro';
  return '—';
}

const STATUS_META: Record<Patient['status'], { label: string; className: string; style?: React.CSSProperties }> = {
  activo:    { label: 'Activo',    className: 'bg-blue-100 text-blue-700' },
  mejorado:  { label: 'Mejorado',  className: 'bg-green-100 text-green-700' },
  empeorado: { label: 'Empeorado', className: 'bg-red-100 text-red-700' },
  alta:      { label: 'Alta',      className: 'text-white', style: { backgroundColor: '#0F8B8D' } },
  fallecido: { label: 'Fallecido', className: 'bg-gray-100 text-gray-700' },
};

const OUTCOME_META: Record<NonNullable<TreatmentFollowup['outcome']>, { label: string; className: string; style?: React.CSSProperties }> = {
  mejorado:   { label: 'Mejorado',    className: 'bg-green-100 text-green-700' },
  sin_cambio: { label: 'Sin cambio',  className: 'bg-yellow-100 text-yellow-700' },
  empeorado:  { label: 'Empeorado',   className: 'bg-red-100 text-red-700' },
  alta:       { label: 'Alta',        className: 'text-white', style: { backgroundColor: '#0F8B8D' } },
  fallecido:  { label: 'Fallecido',   className: 'bg-gray-100 text-gray-700' },
};

function StatusBadge({ status }: { status: Patient['status'] }) {
  const m = STATUS_META[status];
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${m.className}`} style={m.style}>
      {m.label}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: TreatmentFollowup['outcome'] }) {
  if (!outcome) return <span className="text-xs text-gray-400">—</span>;
  const m = OUTCOME_META[outcome];
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${m.className}`} style={m.style}>
      {m.label}
    </span>
  );
}

// ─── Form types ───────────────────────────────────────────────────────────────

interface PatientFormState {
  patient_code: string;
  full_name: string;
  age: string;
  gender: '' | 'M' | 'F' | 'otro';
  admission_date: string;
  discharge_date: string;
  status: Patient['status'];
  notes: string;
}

interface FollowupFormState {
  intervention_date: string;
  antibiotic: string;
  dose: string;
  route: string;
  outcome: '' | NonNullable<TreatmentFollowup['outcome']>;
  notes: string;
}

function emptyPatientForm(): PatientFormState {
  return { patient_code: '', full_name: '', age: '', gender: '', admission_date: '', discharge_date: '', status: 'activo', notes: '' };
}

function emptyFollowupForm(): FollowupFormState {
  return {
    intervention_date: new Date().toISOString().split('T')[0],
    antibiotic: '',
    dose: '',
    route: '',
    outcome: '',
    notes: '',
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Pacientes() {
  const { selectedHospitalObj } = useHospitalContext();
  const { user, isAdmin, isInfectologo } = useAuth();
  const canEdit = isAdmin || isInfectologo;

  // ── List state ──────────────────────────────────────────────────────────────
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [followupCounts, setFollowupCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<PatientFormState>(emptyPatientForm);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ── Detail state ────────────────────────────────────────────────────────────
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [followups, setFollowups] = useState<TreatmentFollowup[]>([]);
  const [followupsLoading, setFollowupsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<PatientFormState>(emptyPatientForm);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSaved, setEditSaved] = useState(false);
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [followupForm, setFollowupForm] = useState<FollowupFormState>(emptyFollowupForm);
  const [followupSaving, setFollowupSaving] = useState(false);
  const [followupError, setFollowupError] = useState('');
  const [editingFollowupId, setEditingFollowupId] = useState<string | null>(null);
  const [editFollowupForm, setEditFollowupForm] = useState<FollowupFormState>(emptyFollowupForm);
  const [followupDeleteConfirmId, setFollowupDeleteConfirmId] = useState<string | null>(null);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadPatients = useCallback(async () => {
    if (!selectedHospitalObj) return;
    setLoading(true);
    const [data, counts] = await Promise.all([
      getPatients(selectedHospitalObj.id),
      getFollowupCounts(selectedHospitalObj.id),
    ]);
    setPatients(data);
    setFollowupCounts(counts);
    setLoading(false);
  }, [selectedHospitalObj]);

  const loadFollowups = useCallback(async (patientId: string) => {
    setFollowupsLoading(true);
    const data = await getFollowups(patientId);
    setFollowups(data);
    setFollowupsLoading(false);
  }, []);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  useEffect(() => {
    if (selectedPatient) loadFollowups(selectedPatient.id);
  }, [selectedPatient, loadFollowups]);

  // ── List actions ────────────────────────────────────────────────────────────

  const openDetail = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditMode(false);
    setEditForm(emptyPatientForm());
    setEditSaved(false);
    setEditError('');
    setShowFollowupForm(false);
    setFollowupForm(emptyFollowupForm());
    setEditingFollowupId(null);
    setFollowupDeleteConfirmId(null);
  };

  const backToList = () => {
    setSelectedPatient(null);
    setFollowups([]);
    setEditMode(false);
  };

  const handleAddPatient = async () => {
    if (!selectedHospitalObj) return;
    if (!addForm.patient_code.trim()) {
      setAddError('El código de paciente es obligatorio.');
      return;
    }
    setAddSaving(true);
    setAddError('');
    const { error } = await createPatient({
      hospital_id: selectedHospitalObj.id,
      patient_code: addForm.patient_code.trim(),
      full_name: addForm.full_name.trim() || null,
      age: addForm.age ? parseInt(addForm.age, 10) : null,
      gender: addForm.gender || null,
      admission_date: addForm.admission_date || null,
      discharge_date: null,
      status: addForm.status,
      notes: addForm.notes.trim() || null,
    });
    setAddSaving(false);
    if (error) {
      setAddError(error.message);
    } else {
      setAddForm(emptyPatientForm());
      setShowAddForm(false);
      await loadPatients();
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    await deletePatient(patientId);
    setDeleteConfirmId(null);
    await loadPatients();
  };

  // ── Detail actions ──────────────────────────────────────────────────────────

  const startEdit = () => {
    if (!selectedPatient) return;
    setEditForm({
      patient_code: selectedPatient.patient_code,
      full_name: selectedPatient.full_name ?? '',
      age: selectedPatient.age != null ? String(selectedPatient.age) : '',
      gender: selectedPatient.gender ?? '',
      admission_date: selectedPatient.admission_date ?? '',
      discharge_date: selectedPatient.discharge_date ?? '',
      status: selectedPatient.status,
      notes: selectedPatient.notes ?? '',
    });
    setEditMode(true);
    setEditSaved(false);
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!selectedPatient) return;
    setEditSaving(true);
    setEditError('');
    const { error } = await updatePatient(selectedPatient.id, {
      patient_code: editForm.patient_code.trim(),
      full_name: editForm.full_name.trim() || null,
      age: editForm.age ? parseInt(editForm.age, 10) : null,
      gender: editForm.gender || null,
      admission_date: editForm.admission_date || null,
      discharge_date: editForm.discharge_date || null,
      status: editForm.status,
      notes: editForm.notes.trim() || null,
    });
    setEditSaving(false);
    if (error) {
      setEditError(error.message);
    } else {
      const updated: Patient = {
        ...selectedPatient,
        patient_code: editForm.patient_code.trim(),
        full_name: editForm.full_name.trim() || null,
        age: editForm.age ? parseInt(editForm.age, 10) : null,
        gender: editForm.gender || null,
        admission_date: editForm.admission_date || null,
        discharge_date: editForm.discharge_date || null,
        status: editForm.status,
        notes: editForm.notes.trim() || null,
      };
      setSelectedPatient(updated);
      setEditMode(false);
      setEditSaved(true);
      await loadPatients();
    }
  };

  const handleQuickStatus = async (newStatus: Patient['status']) => {
    if (!selectedPatient) return;
    await updatePatient(selectedPatient.id, { status: newStatus });
    setSelectedPatient({ ...selectedPatient, status: newStatus });
    setPatients((prev) => prev.map((p) => p.id === selectedPatient.id ? { ...p, status: newStatus } : p));
  };

  const handleAddFollowup = async () => {
    if (!selectedPatient || !selectedHospitalObj) return;
    if (!followupForm.intervention_date) {
      setFollowupError('La fecha de intervención es obligatoria.');
      return;
    }
    setFollowupSaving(true);
    setFollowupError('');
    const { error } = await createFollowup({
      patient_id: selectedPatient.id,
      hospital_id: selectedHospitalObj.id,
      intervention_date: followupForm.intervention_date,
      antibiotic: followupForm.antibiotic.trim() || null,
      dose: followupForm.dose.trim() || null,
      route: followupForm.route.trim() || null,
      outcome: followupForm.outcome || null,
      notes: followupForm.notes.trim() || null,
      recorded_by: user?.id ?? null,
    });
    setFollowupSaving(false);
    if (error) {
      setFollowupError(error.message);
    } else {
      setFollowupForm(emptyFollowupForm());
      setShowFollowupForm(false);
      await Promise.all([loadFollowups(selectedPatient.id), loadPatients()]);
    }
  };

  const startEditFollowup = (f: TreatmentFollowup) => {
    setEditingFollowupId(f.id);
    setEditFollowupForm({
      intervention_date: f.intervention_date,
      antibiotic: f.antibiotic ?? '',
      dose: f.dose ?? '',
      route: f.route ?? '',
      outcome: f.outcome ?? '',
      notes: f.notes ?? '',
    });
  };

  const handleSaveFollowup = async () => {
    if (!editingFollowupId || !selectedPatient) return;
    await updateFollowup(editingFollowupId, {
      intervention_date: editFollowupForm.intervention_date,
      antibiotic: editFollowupForm.antibiotic.trim() || null,
      dose: editFollowupForm.dose.trim() || null,
      route: editFollowupForm.route.trim() || null,
      outcome: editFollowupForm.outcome || null,
      notes: editFollowupForm.notes.trim() || null,
    });
    setEditingFollowupId(null);
    await loadFollowups(selectedPatient.id);
  };

  const handleDeleteFollowup = async (followupId: string) => {
    await deleteFollowup(followupId);
    setFollowupDeleteConfirmId(null);
    if (selectedPatient) {
      await Promise.all([loadFollowups(selectedPatient.id), loadPatients()]);
    }
  };

  const filteredPatients = patients.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.patient_code.toLowerCase().includes(q) ||
      (p.full_name ?? '').toLowerCase().includes(q)
    );
  });

  // ── No hospital selected ────────────────────────────────────────────────────

  if (!selectedHospitalObj) {
    return (
      <div className="p-4 lg:p-8 flex flex-col items-center justify-center min-h-[400px]">
        <UserRound className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-600 mb-1">Ningún hospital seleccionado</h2>
        <p className="text-sm text-gray-400 text-center max-w-sm">
          Selecciona un hospital desde la barra superior para ver sus fichas de pacientes.
        </p>
      </div>
    );
  }

  // ── VIEW B — Patient detail ──────────────────────────────────────────────────

  if (selectedPatient) {
    return (
      <div className="p-4 lg:p-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-3 mb-4 lg:mb-8">
          <button
            onClick={backToList}
            className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Pacientes</span>
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold" style={{ color: '#0B3C5D' }}>
            {selectedPatient.full_name ?? selectedPatient.patient_code}
          </span>
        </div>

        {/* Patient info card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 mb-6">
          {/* Card header */}
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#0B3C5D' }}>
                {selectedPatient.patient_code}
                {selectedPatient.full_name && (
                  <span className="ml-2 text-base font-normal text-gray-600">
                    — {selectedPatient.full_name}
                  </span>
                )}
              </h2>
            </div>
            {canEdit && !editMode && (
              <button
                onClick={startEdit}
                className="flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-h-[40px]"
              >
                <Pencil className="w-4 h-4" />
                <span>Editar</span>
              </button>
            )}
          </div>

          {editSaved && !editMode && (
            <p className="text-sm text-green-600 mb-4">Cambios guardados correctamente.</p>
          )}

          {editMode ? (
            /* ── Edit form ── */
            <div>
              {editError && <p className="text-sm text-red-600 mb-3">{editError}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Código paciente *</label>
                  <input
                    value={editForm.patient_code}
                    onChange={(e) => setEditForm((f) => ({ ...f, patient_code: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nombre completo</label>
                  <input
                    value={editForm.full_name}
                    onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Edad</label>
                  <input
                    type="number"
                    value={editForm.age}
                    onChange={(e) => setEditForm((f) => ({ ...f, age: e.target.value }))}
                    min="0"
                    max="150"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Género</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value as PatientFormState['gender'] }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                  >
                    <option value="">— Seleccionar —</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha ingreso</label>
                  <input
                    type="date"
                    value={editForm.admission_date}
                    onChange={(e) => setEditForm((f) => ({ ...f, admission_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha alta / egreso</label>
                  <input
                    type="date"
                    value={editForm.discharge_date}
                    onChange={(e) => setEditForm((f) => ({ ...f, discharge_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as Patient['status'] }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                  >
                    {(Object.keys(STATUS_META) as Patient['status'][]).map((s) => (
                      <option key={s} value={s}>{STATUS_META[s].label}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveEdit}
                  disabled={editSaving}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 min-h-[40px]"
                  style={{ backgroundColor: '#0F8B8D' }}
                >
                  {editSaving ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[40px]"
                >
                  <X className="w-4 h-4" />
                  <span>Cancelar</span>
                </button>
              </div>
            </div>
          ) : (
            /* ── Read-only info grid ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Edad</p>
                <p className="text-sm font-medium text-gray-900">{selectedPatient.age ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Género</p>
                <p className="text-sm font-medium text-gray-900">{genderLabel(selectedPatient.gender)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Estado actual</p>
                {canEdit ? (
                  <select
                    value={selectedPatient.status}
                    onChange={(e) => handleQuickStatus(e.target.value as Patient['status'])}
                    className="text-sm font-medium border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:border-gray-400 bg-white"
                  >
                    {(Object.keys(STATUS_META) as Patient['status'][]).map((s) => (
                      <option key={s} value={s}>{STATUS_META[s].label}</option>
                    ))}
                  </select>
                ) : (
                  <StatusBadge status={selectedPatient.status} />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Fecha ingreso</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(selectedPatient.admission_date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Fecha alta / egreso</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(selectedPatient.discharge_date)}</p>
              </div>
              {selectedPatient.notes && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <p className="text-xs text-gray-500 mb-0.5">Notas</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedPatient.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Followups section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Section header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold" style={{ color: '#0B3C5D' }}>
              Seguimiento de Tratamientos
            </h3>
            {canEdit && (
              <button
                onClick={() => { setShowFollowupForm((v) => !v); setFollowupForm(emptyFollowupForm()); setFollowupError(''); }}
                className="flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg min-h-[40px] transition-colors"
                style={{ backgroundColor: '#0F8B8D' }}
              >
                <Plus className="w-4 h-4" />
                <span>Agregar seguimiento</span>
              </button>
            )}
          </div>

          {/* Add followup form */}
          {showFollowupForm && canEdit && (
            <div className="px-4 lg:px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Nueva entrada de seguimiento</h4>
              {followupError && <p className="text-sm text-red-600 mb-3">{followupError}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha intervención *</label>
                  <input
                    type="date"
                    value={followupForm.intervention_date}
                    onChange={(e) => setFollowupForm((f) => ({ ...f, intervention_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Resultado</label>
                  <select
                    value={followupForm.outcome}
                    onChange={(e) => setFollowupForm((f) => ({ ...f, outcome: e.target.value as FollowupFormState['outcome'] }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                  >
                    <option value="">— Seleccionar —</option>
                    <option value="mejorado">Mejorado</option>
                    <option value="sin_cambio">Sin cambio</option>
                    <option value="empeorado">Empeorado</option>
                    <option value="alta">Alta</option>
                    <option value="fallecido">Fallecido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Antibiótico</label>
                  <input
                    type="text"
                    value={followupForm.antibiotic}
                    onChange={(e) => setFollowupForm((f) => ({ ...f, antibiotic: e.target.value }))}
                    placeholder="Amoxicilina"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Dosis</label>
                  <input
                    type="text"
                    value={followupForm.dose}
                    onChange={(e) => setFollowupForm((f) => ({ ...f, dose: e.target.value }))}
                    placeholder="500 mg c/8h"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Vía administración</label>
                  <input
                    type="text"
                    value={followupForm.route}
                    onChange={(e) => setFollowupForm((f) => ({ ...f, route: e.target.value }))}
                    placeholder="Oral"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                    value={followupForm.notes}
                    onChange={(e) => setFollowupForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    placeholder="Observaciones clínicas..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddFollowup}
                  disabled={followupSaving}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 min-h-[40px]"
                  style={{ backgroundColor: '#0F8B8D' }}
                >
                  {followupSaving ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={() => { setShowFollowupForm(false); setFollowupError(''); }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[40px]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Followups list */}
          <div className="divide-y divide-gray-100">
            {followupsLoading ? (
              <p className="px-4 lg:px-6 py-8 text-sm text-gray-500 text-center">
                Cargando seguimientos...
              </p>
            ) : followups.length === 0 ? (
              <div className="py-12 flex flex-col items-center">
                <Stethoscope className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-500">No hay seguimientos registrados</p>
                {canEdit && (
                  <p className="text-xs text-gray-400 mt-1">
                    Haz clic en "+ Agregar seguimiento" para registrar el primero.
                  </p>
                )}
              </div>
            ) : (
              followups.map((f) => {
                if (editingFollowupId === f.id) {
                  /* ── Inline edit form ── */
                  return (
                    <div key={f.id} className="px-4 lg:px-6 py-4 bg-gray-50">
                      <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">
                        Editar seguimiento
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
                          <input
                            type="date"
                            value={editFollowupForm.intervention_date}
                            onChange={(e) => setEditFollowupForm((ef) => ({ ...ef, intervention_date: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Resultado</label>
                          <select
                            value={editFollowupForm.outcome}
                            onChange={(e) => setEditFollowupForm((ef) => ({ ...ef, outcome: e.target.value as FollowupFormState['outcome'] }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                          >
                            <option value="">— Seleccionar —</option>
                            <option value="mejorado">Mejorado</option>
                            <option value="sin_cambio">Sin cambio</option>
                            <option value="empeorado">Empeorado</option>
                            <option value="alta">Alta</option>
                            <option value="fallecido">Fallecido</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Antibiótico</label>
                          <input
                            type="text"
                            value={editFollowupForm.antibiotic}
                            onChange={(e) => setEditFollowupForm((ef) => ({ ...ef, antibiotic: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Dosis</label>
                          <input
                            type="text"
                            value={editFollowupForm.dose}
                            onChange={(e) => setEditFollowupForm((ef) => ({ ...ef, dose: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Vía administración</label>
                          <input
                            type="text"
                            value={editFollowupForm.route}
                            onChange={(e) => setEditFollowupForm((ef) => ({ ...ef, route: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
                          <textarea
                            value={editFollowupForm.notes}
                            onChange={(e) => setEditFollowupForm((ef) => ({ ...ef, notes: e.target.value }))}
                            rows={2}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleSaveFollowup}
                          className="px-4 py-2 text-sm font-medium text-white rounded-lg min-h-[36px]"
                          style={{ backgroundColor: '#0F8B8D' }}
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingFollowupId(null)}
                          className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[36px]"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  );
                }

                /* ── Followup card ── */
                const isConfirming = followupDeleteConfirmId === f.id;
                return (
                  <div key={f.id} className="px-4 lg:px-6 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatDate(f.intervention_date)}
                        </span>
                        <OutcomeBadge outcome={f.outcome} />
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-1 shrink-0">
                          {isConfirming ? (
                            <span className="flex items-center gap-2">
                              <span className="text-xs text-red-600 whitespace-nowrap">¿Eliminar?</span>
                              <button
                                onClick={() => handleDeleteFollowup(f.id)}
                                className="px-2 py-0.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                              >
                                Sí
                              </button>
                              <button
                                onClick={() => setFollowupDeleteConfirmId(null)}
                                className="px-2 py-0.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                              >
                                No
                              </button>
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditFollowup(f)}
                                className="p-1.5 text-gray-400 hover:text-gray-700 rounded transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setFollowupDeleteConfirmId(f.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {(f.antibiotic || f.dose || f.route) && (
                      <p className="text-sm text-gray-600 mb-1">
                        {[f.antibiotic, f.dose, f.route].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {f.notes && (
                      <p className="text-sm text-gray-500 whitespace-pre-wrap">{f.notes}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW A — Patient list ────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 lg:mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#0B3C5D' }}>
            Fichas de Pacientes
          </h1>
          <p className="text-sm text-gray-500">{selectedHospitalObj.name}</p>
        </div>
        {canEdit && (
          <button
            onClick={() => { setShowAddForm((v) => !v); setAddForm(emptyPatientForm()); setAddError(''); }}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors min-h-[44px]"
            style={{ backgroundColor: '#0F8B8D' }}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Paciente</span>
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && canEdit && (
        <div className="mb-6 p-4 lg:p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Nuevo paciente</h4>
          {addError && <p className="text-sm text-red-600 mb-3">{addError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Código paciente *</label>
              <input
                type="text"
                value={addForm.patient_code}
                onChange={(e) => setAddForm((f) => ({ ...f, patient_code: e.target.value }))}
                placeholder="PAC-001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                type="text"
                value={addForm.full_name}
                onChange={(e) => setAddForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Juan García López"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Edad</label>
              <input
                type="number"
                value={addForm.age}
                onChange={(e) => setAddForm((f) => ({ ...f, age: e.target.value }))}
                placeholder="45"
                min="0"
                max="150"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Género</label>
              <select
                value={addForm.gender}
                onChange={(e) => setAddForm((f) => ({ ...f, gender: e.target.value as PatientFormState['gender'] }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
              >
                <option value="">— Seleccionar —</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha ingreso</label>
              <input
                type="date"
                value={addForm.admission_date}
                onChange={(e) => setAddForm((f) => ({ ...f, admission_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Estado inicial</label>
              <select
                value={addForm.status}
                onChange={(e) => setAddForm((f) => ({ ...f, status: e.target.value as Patient['status'] }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
              >
                {(Object.keys(STATUS_META) as Patient['status'][]).map((s) => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                value={addForm.notes}
                onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Observaciones clínicas..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddPatient}
              disabled={addSaving}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 min-h-[40px]"
              style={{ backgroundColor: '#0F8B8D' }}
            >
              {addSaving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setAddForm(emptyPatientForm()); setAddError(''); }}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[40px]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código o nombre..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-gray-400 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">Cargando pacientes...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="py-16 flex flex-col items-center">
            <UserRound className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">
              {search ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
            </p>
            {!search && canEdit && (
              <p className="text-xs text-gray-400 mt-1">
                Haz clic en &ldquo;+ Nuevo Paciente&rdquo; para agregar el primero.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Edad</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Género</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">F. Ingreso</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Seguim.</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPatients.map((p) => {
                  const isConfirming = deleteConfirmId === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{p.patient_code}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.full_name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.age ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 hidden sm:table-cell">{genderLabel(p.gender)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 hidden sm:table-cell whitespace-nowrap">{formatDate(p.admission_date)}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">{followupCounts[p.id] ?? 0}</td>
                      <td className="px-4 py-3 text-right">
                        {isConfirming ? (
                          <span className="flex items-center justify-end gap-2">
                            <span className="text-xs text-red-600 whitespace-nowrap">¿Eliminar?</span>
                            <button
                              onClick={() => handleDeletePatient(p.id)}
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
                          <span className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openDetail(p)}
                              className="px-3 py-1.5 text-xs font-medium text-white rounded-lg whitespace-nowrap"
                              style={{ backgroundColor: '#0F8B8D' }}
                            >
                              Ver ficha
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => setDeleteConfirmId(p.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                title="Eliminar paciente"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
