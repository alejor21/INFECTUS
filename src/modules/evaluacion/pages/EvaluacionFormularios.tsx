import { useState } from 'react';
import {
  FileText,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Loader2,
  X,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useFormularios } from '../hooks/useFormularios';
import { useEvaluacionContext } from '../context/EvaluacionContext';
import { usePermissions } from '../../../contexts/AuthContext';
import type { FormularioInsert, FormularioCategoria } from '../types';

type TabFilter = 'todos' | 'PROA' | 'IAS';

interface FormState {
  nombre: string;
  categoria: FormularioCategoria;
  descripcion: string;
  pendientes: string;
}

const EMPTY_FORM: FormState = { nombre: '', categoria: 'PROA', descripcion: '', pendientes: '0' };

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function EvaluacionFormularios() {
  const navigate = useNavigate();
  const { selectedHospitalId } = useEvaluacionContext();
  const { formularios, loading, create, remove } = useFormularios(selectedHospitalId);
  const { canCreate, canDelete } = usePermissions();

  const [tab, setTab]                         = useState<TabFilter>('todos');
  const [showModal, setShowModal]             = useState(false);
  const [form, setForm]                       = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting]           = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId]           = useState<string | null>(null);

  const filtered        = tab === 'todos' ? formularios : formularios.filter((f) => f.categoria === tab);
  const totalEnviados   = formularios.reduce((s, f) => s + f.enviados, 0);
  const totalPendientes = formularios.reduce((s, f) => s + f.pendientes, 0);
  const totalActivos    = formularios.filter((f) => f.estado === 'activo').length;

  const handleSubmit = async () => {
    if (!selectedHospitalId || !form.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setSubmitting(true);
    const payload: FormularioInsert = {
      hospital_id: selectedHospitalId,
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      descripcion: form.descripcion.trim() || null,
      estado: 'activo',
      enviados: 0,
      pendientes: parseInt(form.pendientes) || 0,
    };
    try {
      await create(payload);
      toast.success('Formulario creado');
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch {
      toast.error('Error al crear el formulario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await remove(id);
      setConfirmDeleteId(null);
      toast.success('Formulario eliminado');
    } catch {
      toast.error('Error al eliminar el formulario');
    } finally {
      setDeletingId(null);
    }
  };

  const setField = (k: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      {/* Back button */}
      <div className="px-8 pt-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] mb-2">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Volver</span>
        </button>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Formularios</h2>
            <p className="text-sm text-slate-500 mt-1">Plantillas y registros de cumplimiento</p>
          </div>
          {selectedHospitalId && canCreate && (
            <button onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl px-4 min-h-[44px] transition-colors">
              <Plus className="w-4 h-4" />
              Nuevo Formulario
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        {!selectedHospitalId ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <FileText className="w-16 h-16 text-gray-200" />
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
              {[
                { label: 'Total formularios', value: formularios.length,  color: 'indigo', Icon: FileText },
                { label: 'Completados',        value: totalEnviados,       color: 'green',  Icon: CheckCircle2 },
                { label: 'Pendientes',         value: totalPendientes,     color: 'amber',  Icon: Clock },
                { label: 'Activos',            value: totalActivos,        color: 'indigo', Icon: FileText },
              ].map(({ label, value, color, Icon }) => (
                <div key={label} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">{label}</p>
                      <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
                    </div>
                    <div className={`w-12 h-12 bg-${color}-50 rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 text-${color}-600`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tab filter */}
            <div className="flex items-center gap-2 mb-6">
              {(['todos', 'PROA', 'IAS'] as TabFilter[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                    tab === t ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t === 'todos' ? 'Todos' : t}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <FileText className="w-16 h-16 text-gray-200" />
                <p className="text-base font-semibold text-gray-600">Sin formularios</p>
                {canCreate && (
                  <button onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl px-4 min-h-[44px] transition-colors">
                    <Plus className="w-4 h-4" />
                    Crear primer formulario
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filtered.map((f) => {
                  const isConfirming = confirmDeleteId === f.id;
                  const isDeleting   = deletingId === f.id;
                  const catColor = f.categoria === 'PROA'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200';
                  return (
                    <div key={f.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-semibold text-slate-800">{f.nombre}</h4>
                              {f.estado === 'borrador' && (
                                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">Borrador</span>
                              )}
                            </div>
                            {f.descripcion && <p className="text-sm text-slate-500 line-clamp-2">{f.descripcion}</p>}
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ml-2 shrink-0 ${catColor}`}>{f.categoria}</span>
                        </div>

                        <div className="flex items-center gap-6 mb-4">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="font-semibold text-green-600">{f.enviados}</span> completados
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span className="font-semibold text-amber-600">{f.pendientes}</span> pendientes
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(f.updated_at.split('T')[0])}
                          </div>
                          {isConfirming ? (
                            <div className="flex gap-2">
                              <button onClick={() => setConfirmDeleteId(null)} className="px-3 min-h-[36px] border border-gray-200 text-gray-600 text-xs font-medium rounded-lg">Cancelar</button>
                              <button onClick={() => handleDelete(f.id)} disabled={isDeleting} className="flex items-center gap-1 px-3 min-h-[36px] bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors">
                                {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                                Eliminar
                              </button>
                            </div>
                          ) : (
                            canDelete ? (
                              <button onClick={() => setConfirmDeleteId(f.id)} className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-red-500 rounded-lg min-h-[44px] min-w-[44px] transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : null
                          )}
                        </div>
                      </div>
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
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-800">Nuevo Formulario</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
                <input value={form.nombre} onChange={setField('nombre')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Nombre del formulario" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Categoría</label>
                  <select value={form.categoria} onChange={setField('categoria')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    <option value="PROA">PROA</option>
                    <option value="IAS">IAS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Pendientes</label>
                  <input type="number" value={form.pendientes} onChange={setField('pendientes')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" min="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
                <textarea value={form.descripcion} onChange={setField('descripcion')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" rows={3} placeholder="Descripción del formulario..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 min-h-[44px] border border-gray-200 text-gray-600 text-sm font-medium rounded-xl">Cancelar</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-xl transition-colors">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
