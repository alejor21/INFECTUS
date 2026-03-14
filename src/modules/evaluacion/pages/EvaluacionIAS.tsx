import { useState } from 'react';
import {
  Syringe,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Plus,
  Loader2,
  X,
  Trash2,
  Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useIAS } from '../hooks/useIAS';
import { useEvaluacionContext } from '../context/EvaluacionContext';
import { usePermissions } from '../../../contexts/AuthContext';
import type { IASRegistroInsert, IASEstado } from '../types';

type StatusFilter = 'todos' | IASEstado;

const TIPO_IAAS_OPTIONS = [
  'IAAS-ITS (Infección Tracto Urinario)',
  'IAAS-NAV (Neumonía Asociada Ventilador)',
  'IAAS-BSI (Bacteriemia)',
  'IAAS-ISQ (Infección Sitio Quirúrgico)',
  'IAAS-CAUTI',
  'IAAS-CLABSI',
  'Otra',
];

interface FormState {
  cama: string;
  servicio: string;
  tipo_iaas: string;
  microorganismo: string;
  fecha: string;
  observaciones: string;
}

const today = new Date().toISOString().split('T')[0];
const EMPTY_FORM: FormState = {
  cama: '', servicio: '', tipo_iaas: '', microorganismo: '', fecha: today, observaciones: '',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const STATUS_CONFIG: Record<IASEstado, { label: string; className: string }> = {
  activo:      { label: 'Activo',     className: 'bg-red-50 text-red-700 border-red-200' },
  seguimiento: { label: 'Seguimiento', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  resuelto:    { label: 'Resuelto',   className: 'bg-green-50 text-green-700 border-green-200' },
};

export function EvaluacionIAS() {
  const navigate = useNavigate();
  const { selectedHospitalId } = useEvaluacionContext();
  const { registros, loading, create, update, remove } = useIAS(selectedHospitalId);
  const { canCreate, canEdit, canDelete } = usePermissions();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [showModal, setShowModal]       = useState(false);
  const [form, setForm]                 = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting]     = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  const filtered = statusFilter === 'todos' ? registros : registros.filter((r) => r.estado === statusFilter);
  const activos      = registros.filter((r) => r.estado === 'activo').length;
  const seguimiento  = registros.filter((r) => r.estado === 'seguimiento').length;
  const resueltos    = registros.filter((r) => r.estado === 'resuelto').length;

  const handleSubmit = async () => {
    if (!selectedHospitalId) return;
    if (!form.tipo_iaas.trim()) {
      toast.error('El tipo de IAAS es obligatorio');
      return;
    }
    setSubmitting(true);
    const payload: IASRegistroInsert = {
      hospital_id: selectedHospitalId,
      paciente: null,
      cama: form.cama.trim() || null,
      servicio: form.servicio.trim() || null,
      tipo_iaas: form.tipo_iaas,
      microorganismo: form.microorganismo.trim() || null,
      fecha: form.fecha,
      estado: 'activo',
      observaciones: form.observaciones.trim() || null,
      created_by: null,
    };
    try {
      await create(payload);
      toast.success('Registro IAS creado');
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch {
      toast.error('Error al crear el registro');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await remove(id);
      setConfirmDeleteId(null);
      toast.success('Registro eliminado');
    } catch {
      toast.error('Error al eliminar el registro');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateEstado = async (id: string, estado: IASEstado) => {
    try {
      await update(id, { estado });
      toast.success('Estado actualizado');
    } catch {
      toast.error('Error al actualizar el estado');
    }
  };

  const setField = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      {/* Back button */}
      <div className="px-8 pt-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] mb-2">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Volver</span>
        </button>
      </div>

      {/* Hero header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 border-b border-purple-800 px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Syringe className="w-9 h-9 text-white" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">IAS</h2>
              <p className="text-purple-100 mt-1">Infecciones Asociadas a la Atención en Salud</p>
            </div>
          </div>
          {selectedHospitalId && canCreate && (
            <button
              onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl px-4 min-h-[44px] transition-colors border border-white/30"
            >
              <Plus className="w-4 h-4" />
              Nuevo Registro
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total registros', value: registros.length },
            { label: 'Activos',         value: activos },
            { label: 'En seguimiento',  value: seguimiento },
            { label: 'Resueltos',       value: resueltos },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 backdrop-blur-sm rounded-lg px-5 py-4 border border-white/20">
              <p className="text-purple-100 text-sm mb-1">{label}</p>
              <p className="text-3xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        {!selectedHospitalId ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <Syringe className="w-16 h-16 text-gray-200" />
            <p className="text-base font-semibold text-gray-600">Selecciona un hospital</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Status filter tabs */}
            <div className="flex items-center gap-2 mb-6">
              {(['todos', 'activo', 'seguimiento', 'resuelto'] as StatusFilter[]).map((s) => {
                const labels: Record<StatusFilter, string> = { todos: 'Todos', activo: 'Activos', seguimiento: 'Seguimiento', resuelto: 'Resueltos' };
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                      statusFilter === s ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {labels[s]}
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <Activity className="w-16 h-16 text-gray-200" />
                <p className="text-base font-semibold text-gray-600">Sin registros IAS</p>
                {canCreate && (
                  <button onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl px-4 min-h-[44px] transition-colors">
                    <Plus className="w-4 h-4" />
                    Crear primer registro
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((r) => {
                  const isConfirming = confirmDeleteId === r.id;
                  const isDeleting   = deletingId === r.id;
                  const statusCfg    = STATUS_CONFIG[r.estado];
                  return (
                    <div key={r.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {r.tipo_iaas ?? 'Sin tipo'}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {r.cama && <span className="text-xs text-slate-400">Cama: {r.cama}</span>}
                            {r.servicio && <span className="text-xs text-slate-400">• {r.servicio}</span>}
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ml-2 shrink-0 ${statusCfg.className}`}>
                          {statusCfg.label}
                        </span>
                      </div>

                      {r.microorganismo && (
                        <p className="text-xs text-purple-700 bg-purple-50 rounded px-2 py-1 mb-3 font-mono">
                          {r.microorganismo}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(r.fecha)}
                      </div>

                      {isConfirming ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                          <p className="text-sm text-red-700 font-medium text-center mb-2">¿Eliminar registro?</p>
                          <div className="flex gap-2">
                            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 min-h-[44px] border border-gray-200 text-gray-600 text-sm font-medium rounded-lg">No</button>
                            <button onClick={() => handleDelete(r.id)} disabled={isDeleting} className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-medium rounded-lg transition-colors">
                              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                              {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {canEdit && r.estado === 'activo' && (
                            <button onClick={() => handleUpdateEstado(r.id, 'seguimiento')} className="flex-1 min-h-[44px] text-xs border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors">
                              En seguimiento
                            </button>
                          )}
                          {canEdit && r.estado === 'seguimiento' && (
                            <button onClick={() => handleUpdateEstado(r.id, 'resuelto')} className="flex-1 min-h-[44px] text-xs border border-green-200 text-green-700 hover:bg-green-50 rounded-lg transition-colors">
                              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                              Marcar resuelto
                            </button>
                          )}
                          {r.estado === 'resuelto' && (
                            <div className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] text-xs text-green-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Resuelto
                            </div>
                          )}
                          {canDelete && (
                            <button onClick={() => setConfirmDeleteId(r.id)} className="w-10 h-10 flex items-center justify-center border border-red-200 text-red-400 hover:bg-red-50 rounded-lg min-h-[44px]">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-800">Nuevo Registro IAS</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de IAAS *</label>
                <select value={form.tipo_iaas} onChange={setField('tipo_iaas')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">Seleccionar tipo...</option>
                  {TIPO_IAAS_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Cama</label>
                  <input value={form.cama} onChange={setField('cama')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" placeholder="Ej. 12A" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fecha</label>
                  <input type="date" value={form.fecha} onChange={setField('fecha')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Servicio</label>
                <input value={form.servicio} onChange={setField('servicio')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" placeholder="UCI, Urgencias, Pediatría..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Microorganismo</label>
                <input value={form.microorganismo} onChange={setField('microorganismo')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-300" placeholder="Klebsiella pneumoniae BLEE" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Observaciones</label>
                <textarea value={form.observaciones} onChange={setField('observaciones')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" rows={3} placeholder="Observaciones clínicas..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 min-h-[44px] border border-gray-200 text-gray-600 text-sm font-medium rounded-xl">Cancelar</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 min-h-[44px] bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm font-medium rounded-xl transition-colors">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Silence unused import warnings
const _AlertTriangle = AlertTriangle;
void _AlertTriangle;
