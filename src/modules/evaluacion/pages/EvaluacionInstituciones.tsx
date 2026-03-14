import { useState } from 'react';
import {
  Building2,
  MapPin,
  Bed,
  TrendingUp,
  Phone,
  AlertCircle,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useInstituciones } from '../hooks/useInstituciones';
import { useEvaluacionContext } from '../context/EvaluacionContext';
import { usePermissions } from '../../../contexts/AuthContext';
import type { Institucion, InstitucionInsert } from '../types';

const TIPO_OPTIONS = ['IPS', 'ESE', 'EPS', 'Clínica', 'Otro'];
const NIVEL_OPTIONS = ['I', 'II', 'III', 'IV'];

interface FormState {
  nombre: string;
  ciudad: string;
  tipo: string;
  nivel: string;
  camas: string;
  telefono: string;
  email: string;
}

const EMPTY_FORM: FormState = {
  nombre: '', ciudad: '', tipo: 'IPS', nivel: 'II', camas: '0', telefono: '', email: '',
};

function institucionToForm(i: Institucion): FormState {
  return {
    nombre: i.nombre,
    ciudad: i.ciudad ?? '',
    tipo: i.tipo,
    nivel: i.nivel,
    camas: String(i.camas),
    telefono: i.telefono ?? '',
    email: i.email ?? '',
  };
}

export function EvaluacionInstituciones() {
  const navigate = useNavigate();
  const { selectedHospitalId } = useEvaluacionContext();
  const { instituciones, loading, create, update, remove, toggleActivo } =
    useInstituciones(selectedHospitalId);
  const { canCreate, canEdit, canDelete } = usePermissions();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalActivas   = instituciones.filter((i) => i.activo).length;
  const totalInactivas = instituciones.filter((i) => !i.activo).length;
  const totalCamas     = instituciones.reduce((s, i) => s + i.camas, 0);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (inst: Institucion) => {
    setEditingId(inst.id);
    setForm(institucionToForm(inst));
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingId(null); };

  const handleSubmit = async () => {
    if (!selectedHospitalId || !form.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setSubmitting(true);
    const payload: InstitucionInsert = {
      hospital_id: selectedHospitalId,
      nombre: form.nombre.trim(),
      ciudad: form.ciudad.trim() || null,
      tipo: form.tipo,
      nivel: form.nivel,
      camas: parseInt(form.camas) || 0,
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      activo: true,
    };
    try {
      if (editingId) {
        await update(editingId, payload);
        toast.success('Institución actualizada');
      } else {
        await create(payload);
        toast.success('Institución creada');
      }
      closeModal();
    } catch {
      toast.error('Error al guardar la institución');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await remove(id);
      setConfirmDeleteId(null);
      toast.success('Institución eliminada');
    } catch {
      toast.error('Error al eliminar la institución');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActivo = async (inst: Institucion) => {
    try {
      await toggleActivo(inst.id, !inst.activo);
      toast.success(inst.activo ? 'Institución desactivada' : 'Institución activada');
    } catch {
      toast.error('Error al cambiar el estado');
    }
  };

  const setField = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      {/* Back button */}
      <div className="px-8 pt-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Volver</span>
        </button>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Instituciones</h2>
            <p className="text-sm text-slate-500 mt-1">Gestión de instituciones vinculadas</p>
          </div>
          {selectedHospitalId && canCreate && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl px-4 min-h-[44px] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Institución
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        {!selectedHospitalId ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <Building2 className="w-16 h-16 text-gray-200" />
            <p className="text-base font-semibold text-gray-600">Selecciona un hospital</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <KpiCard label="Total" value={instituciones.length} Icon={Building2} colorClass="indigo" />
              <KpiCard label="Activas" value={totalActivas} Icon={TrendingUp} colorClass="green" />
              <KpiCard label="Inactivas" value={totalInactivas} Icon={AlertCircle} colorClass="amber" />
              <KpiCard label="Total camas" value={totalCamas} Icon={Bed} colorClass="purple" />
            </div>

            {/* List */}
            {instituciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <Building2 className="w-16 h-16 text-gray-200" />
                <p className="text-base font-semibold text-gray-600">Sin instituciones registradas</p>
                {canCreate && (
                  <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl px-4 min-h-[44px] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar primera institución
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {instituciones.map((inst) => {
                  const isDeleting   = deletingId === inst.id;
                  const isConfirming = confirmDeleteId === inst.id;
                  return (
                    <div key={inst.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-50 to-slate-50 px-6 py-5 border-b border-slate-200">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                              <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-base font-semibold text-slate-800">{inst.nombre}</h3>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                {inst.ciudad && (
                                  <span className="flex items-center gap-1 text-xs text-slate-500">
                                    <MapPin className="w-3.5 h-3.5" />{inst.ciudad}
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-xs text-slate-500">
                                  <Bed className="w-3.5 h-3.5" />{inst.camas} camas
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            inst.activo
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {inst.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>

                      <div className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4">
                          <div><span className="text-slate-400">Tipo: </span>{inst.tipo}</div>
                          <div><span className="text-slate-400">Nivel: </span>{inst.nivel}</div>
                          {inst.telefono && (
                            <div className="flex items-center gap-1 col-span-2">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />{inst.telefono}
                            </div>
                          )}
                        </div>

                        {isConfirming ? (
                          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                            <p className="text-sm text-red-700 font-medium text-center mb-2">¿Eliminar institución?</p>
                            <div className="flex gap-2">
                              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 min-h-[44px] border border-gray-200 text-gray-600 text-sm font-medium rounded-lg">No</button>
                              <button
                                onClick={() => handleDelete(inst.id)}
                                disabled={isDeleting}
                                className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-medium rounded-lg transition-colors"
                              >
                                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {canEdit && (
                              <button
                                onClick={() => handleToggleActivo(inst)}
                                className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm rounded-lg transition-colors"
                              >
                                {inst.activo
                                  ? <ToggleRight className="w-4 h-4 text-green-500" />
                                  : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                                {inst.activo ? 'Desactivar' : 'Activar'}
                              </button>
                            )}
                            {canEdit && (
                              <button onClick={() => openEdit(inst)} className="w-11 h-11 flex items-center justify-center border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg min-h-[44px]">
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={() => setConfirmDeleteId(inst.id)} className="w-11 h-11 flex items-center justify-center border border-red-200 text-red-500 hover:bg-red-50 rounded-lg min-h-[44px]">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-800">{editingId ? 'Editar Institución' : 'Nueva Institución'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
                <input value={form.nombre} onChange={setField('nombre')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Nombre de la institución" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Ciudad</label>
                  <input value={form.ciudad} onChange={setField('ciudad')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Ciudad" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Camas</label>
                  <input type="number" value={form.camas} onChange={setField('camas')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" min="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                  <select value={form.tipo} onChange={setField('tipo')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    {TIPO_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nivel</label>
                  <select value={form.nivel} onChange={setField('nivel')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    {NIVEL_OPTIONS.map((n) => <option key={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono</label>
                <input value={form.telefono} onChange={setField('telefono')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="+57 300 0000000" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input type="email" value={form.email} onChange={setField('email')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="contacto@institución.com" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 min-h-[44px] border border-gray-200 text-gray-600 text-sm font-medium rounded-xl">Cancelar</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function KpiCard({
  label, value, Icon, colorClass,
}: {
  label: string;
  value: number;
  Icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className={`text-3xl font-bold text-${colorClass}-600`}>{value}</p>
        </div>
        <div className={`w-12 h-12 bg-${colorClass}-50 rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${colorClass}-600`} />
        </div>
      </div>
    </div>
  );
}
