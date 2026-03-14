import { useState } from 'react';
import {
  Shield,
  Activity,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Plus,
  Loader2,
  X,
  Trash2,
  Calendar,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { usePROA } from '../hooks/usePROA';
import { useEvaluacionContext } from '../context/EvaluacionContext';
import { usePermissions } from '../../../contexts/AuthContext';
import type { ProaIntervencionInsert, IntervenciónTipo } from '../types';

type TipoFilter = 'todos' | IntervenciónTipo;

interface FormState {
  servicio: string;
  tipo: IntervenciónTipo;
  antibiotico: string;
  diagnostico: string;
  aprobado: string;
  fecha: string;
  observaciones: string;
}

const today = new Date().toISOString().split('T')[0];
const EMPTY_FORM: FormState = {
  servicio: '', tipo: 'preautorizacion', antibiotico: '', diagnostico: '',
  aprobado: 'true', fecha: today, observaciones: '',
};

const TIPO_LABELS: Record<IntervenciónTipo, string> = {
  preautorizacion: 'Preautorización',
  auditoria:       'Auditoría',
  educacion:       'Educación',
  otro:            'Otro',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function EvaluacionPROA() {
  const navigate = useNavigate();
  const { selectedHospitalId } = useEvaluacionContext();
  const { intervenciones, loading, create, remove } = usePROA(selectedHospitalId);
  const { canCreate, canDelete } = usePermissions();

  const [tipoFilter, setTipoFilter]           = useState<TipoFilter>('todos');
  const [showModal, setShowModal]             = useState(false);
  const [form, setForm]                       = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting]           = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId]           = useState<string | null>(null);

  const filtered   = tipoFilter === 'todos' ? intervenciones : intervenciones.filter((i) => i.tipo === tipoFilter);
  const aprobadas  = intervenciones.filter((i) => i.aprobado === true).length;
  const rechazadas = intervenciones.filter((i) => i.aprobado === false).length;
  const tasaAprob  = intervenciones.length > 0 ? Math.round((aprobadas / intervenciones.length) * 100) : 0;

  const handleSubmit = async () => {
    if (!selectedHospitalId) return;
    setSubmitting(true);
    const payload: ProaIntervencionInsert = {
      hospital_id: selectedHospitalId,
      paciente: null,
      servicio: form.servicio.trim() || null,
      tipo: form.tipo,
      antibiotico: form.antibiotico.trim() || null,
      diagnostico: form.diagnostico.trim() || null,
      aprobado: form.aprobado === 'true' ? true : form.aprobado === 'false' ? false : null,
      observaciones: form.observaciones.trim() || null,
      fecha: form.fecha,
      created_by: null,
    };
    try {
      await create(payload);
      toast.success('Intervención registrada');
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch {
      toast.error('Error al registrar la intervención');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await remove(id);
      setConfirmDeleteId(null);
      toast.success('Intervención eliminada');
    } catch {
      toast.error('Error al eliminar la intervención');
    } finally {
      setDeletingId(null);
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
      <header className="bg-gradient-to-r from-indigo-600 to-indigo-700 border-b border-indigo-800 px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Shield className="w-9 h-9 text-white" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">PROA</h2>
              <p className="text-indigo-100 mt-1">Programa de Optimización de Antimicrobianos</p>
            </div>
          </div>
          {selectedHospitalId && canCreate && (
            <button onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl px-4 min-h-[44px] transition-colors border border-white/30">
              <Plus className="w-4 h-4" />
              Nueva Intervención
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total intervenciones', value: intervenciones.length },
            { label: 'Aprobadas',            value: aprobadas },
            { label: 'Rechazadas',           value: rechazadas },
            { label: 'Tasa aprobación',      value: `${tasaAprob}%` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 backdrop-blur-sm rounded-lg px-5 py-4 border border-white/20">
              <p className="text-indigo-100 text-sm mb-1">{label}</p>
              <p className="text-3xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        {!selectedHospitalId ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <Shield className="w-16 h-16 text-gray-200" />
            <p className="text-base font-semibold text-gray-600">Selecciona un hospital</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Tipo filter tabs */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              {(['todos', 'preautorizacion', 'auditoria', 'educacion', 'otro'] as TipoFilter[]).map((t) => {
                const label = t === 'todos' ? 'Todos' : TIPO_LABELS[t as IntervenciónTipo];
                return (
                  <button
                    key={t}
                    onClick={() => setTipoFilter(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                      tipoFilter === t ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <Activity className="w-16 h-16 text-gray-200" />
                <p className="text-base font-semibold text-gray-600">Sin intervenciones registradas</p>
                {canCreate && (
                  <button onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl px-4 min-h-[44px] transition-colors">
                    <Plus className="w-4 h-4" />
                    Nueva intervención
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((interv) => {
                  const isConfirming = confirmDeleteId === interv.id;
                  const isDeleting   = deletingId === interv.id;
                  return (
                    <div key={interv.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {TIPO_LABELS[interv.tipo]}
                            </span>
                          </div>
                          {interv.servicio && (
                            <p className="text-sm text-slate-600 mt-1">{interv.servicio}</p>
                          )}
                        </div>
                        {interv.aprobado !== null && (
                          <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ml-2 shrink-0 ${
                            interv.aprobado
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {interv.aprobado
                              ? <><ThumbsUp className="w-3 h-3" /> Aprobado</>
                              : <><ThumbsDown className="w-3 h-3" /> Rechazado</>}
                          </span>
                        )}
                      </div>

                      {interv.antibiotico && (
                        <p className="text-xs text-indigo-700 bg-indigo-50 rounded px-2 py-1 mb-3 font-mono">
                          {interv.antibiotico}
                        </p>
                      )}
                      {interv.diagnostico && (
                        <p className="text-xs text-slate-500 mb-3 italic">{interv.diagnostico}</p>
                      )}

                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(interv.fecha)}
                      </div>

                      {isConfirming ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                          <p className="text-sm text-red-700 font-medium text-center mb-2">¿Eliminar intervención?</p>
                          <div className="flex gap-2">
                            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 min-h-[44px] border border-gray-200 text-gray-600 text-sm font-medium rounded-lg">No</button>
                            <button onClick={() => handleDelete(interv.id)} disabled={isDeleting} className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-medium rounded-lg transition-colors">
                              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                              {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          {canDelete && (
                            <button onClick={() => setConfirmDeleteId(interv.id)} className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-red-500 rounded-lg min-h-[44px] min-w-[44px] transition-colors">
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
              <h3 className="text-base font-semibold text-gray-800">Nueva Intervención PROA</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tipo *</label>
                  <select value={form.tipo} onChange={setField('tipo')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    {(['preautorizacion', 'auditoria', 'educacion', 'otro'] as IntervenciónTipo[]).map((t) => (
                      <option key={t} value={t}>{TIPO_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fecha</label>
                  <input type="date" value={form.fecha} onChange={setField('fecha')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Servicio</label>
                <input value={form.servicio} onChange={setField('servicio')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="UCI, Urgencias..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Antibiótico</label>
                <input value={form.antibiotico} onChange={setField('antibiotico')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Meropenem 1g IV..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Diagnóstico</label>
                <input value={form.diagnostico} onChange={setField('diagnostico')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Neumonía asociada al ventilador..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Resultado</label>
                <select value={form.aprobado} onChange={setField('aprobado')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  <option value="true">Aprobado</option>
                  <option value="false">Rechazado</option>
                  <option value="">Sin determinar</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Observaciones</label>
                <textarea value={form.observaciones} onChange={setField('observaciones')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" rows={3} placeholder="Observaciones clínicas..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 min-h-[44px] border border-gray-200 text-gray-600 text-sm font-medium rounded-xl">Cancelar</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-xl transition-colors">
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

// Silence unused import warning
const _AlertTriangle = AlertTriangle;
const _CheckCircle2 = CheckCircle2;
const _TrendingUp = TrendingUp;
void _AlertTriangle; void _CheckCircle2; void _TrendingUp;
