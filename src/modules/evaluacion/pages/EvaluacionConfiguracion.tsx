import {
  User,
  Bell,
  Shield,
  Database,
  Mail,
  Globe,
  Lock,
  ArrowLeft,
  Loader2,
  Check,
  Cloud,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useConfiguracion } from '../hooks/useConfiguracion';
import { useEvaluacionContext } from '../context/EvaluacionContext';
import type { ConfiguracionUpdate } from '../types';

type NavSection = 'perfil' | 'notificaciones' | 'preferencias';

export function EvaluacionConfiguracion() {
  const navigate = useNavigate();
  const { selectedHospitalId } = useEvaluacionContext();
  const { config, loading, saveStatus, debouncedSave, saveImmediate } =
    useConfiguracion(selectedHospitalId);

  const activeSection: NavSection = 'perfil';

  const handleChange = (updates: ConfiguracionUpdate) => {
    debouncedSave(updates);
  };

  const handleSaveNow = async () => {
    if (!config) return;
    try {
      await saveImmediate({
        nombre_programa:         config.nombre_programa,
        responsable:             config.responsable,
        email_notificaciones:    config.email_notificaciones,
        notif_email:             config.notif_email,
        notif_alertas:           config.notif_alertas,
        notif_cumplimiento:      config.notif_cumplimiento,
        notif_semanal:           config.notif_semanal,
        zona_horaria:            config.zona_horaria,
      });
      toast.success('Configuración guardada');
    } catch {
      toast.error('Error al guardar la configuración');
    }
  };

  const navItems: { id: NavSection; Icon: React.ElementType; label: string }[] = [
    { id: 'perfil',           Icon: User,     label: 'Perfil del Programa' },
    { id: 'notificaciones',   Icon: Bell,     label: 'Notificaciones' },
    { id: 'preferencias',     Icon: Globe,    label: 'Preferencias' },
  ];

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
            <h2 className="text-2xl font-semibold text-slate-800">Configuración</h2>
            <p className="text-sm text-slate-500 mt-1">Administración del programa PROA</p>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === 'saving' && (
              <span className="text-sm text-slate-400 flex items-center gap-1.5">
                <Cloud className="w-4 h-4" /> Guardando...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-sm text-green-600 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Cambios guardados
              </span>
            )}
            <button
              onClick={handleSaveNow}
              disabled={!selectedHospitalId || saveStatus === 'saving'}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-xl px-4 min-h-[44px] transition-colors"
            >
              {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Guardar Cambios
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-slate-50">
        {!selectedHospitalId ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <Shield className="w-16 h-16 text-gray-200" />
            <p className="text-base font-semibold text-gray-600">Selecciona un hospital</p>
            <p className="text-sm text-gray-400">para acceder a su configuración</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto p-8">
            <div className="grid grid-cols-3 gap-8">
              {/* Sidebar Navigation */}
              <div className="col-span-1">
                <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-8">
                  <nav className="space-y-1">
                    {navItems.map(({ id, Icon, label }) => (
                      <button
                        key={id}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg min-h-[44px] text-sm ${
                          activeSection === id
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{label}</span>
                      </button>
                    ))}
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 min-h-[44px] text-sm">
                      <Shield className="w-5 h-5" />
                      <span>Seguridad</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 min-h-[44px] text-sm">
                      <Database className="w-5 h-5" />
                      <span>Datos</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 min-h-[44px] text-sm">
                      <Lock className="w-5 h-5" />
                      <span>Privacidad</span>
                    </button>
                  </nav>
                </div>
              </div>

              {/* Settings Content */}
              <div className="col-span-2 space-y-6">
                {/* Program Profile */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-6 py-5 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800">Información del Programa</h3>
                    <p className="text-sm text-slate-500 mt-1">Datos del programa PROA institucional</p>
                  </div>
                  <div className="p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Nombre del Programa
                      </label>
                      <input
                        value={config?.nombre_programa ?? ''}
                        onChange={(e) => handleChange({ nombre_programa: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        placeholder="PROA Institucional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Responsable del Programa
                      </label>
                      <input
                        value={config?.responsable ?? ''}
                        onChange={(e) => handleChange({ responsable: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        placeholder="Dr. Juan Pérez"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Email de Notificaciones
                      </label>
                      <input
                        type="email"
                        value={config?.email_notificaciones ?? ''}
                        onChange={(e) => handleChange({ email_notificaciones: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        placeholder="proa@hospital.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-6 py-5 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800">Notificaciones</h3>
                    <p className="text-sm text-slate-500 mt-1">Configura cómo deseas recibir actualizaciones</p>
                  </div>
                  <div className="p-6 space-y-5">
                    {[
                      {
                        key: 'notif_email' as const,
                        Icon: Mail,
                        title: 'Notificaciones por Email',
                        desc: 'Recibe actualizaciones por correo',
                      },
                      {
                        key: 'notif_alertas' as const,
                        Icon: Bell,
                        title: 'Alertas de Tareas Pendientes',
                        desc: 'Avisos de vencimientos próximos',
                      },
                      {
                        key: 'notif_cumplimiento' as const,
                        Icon: Shield,
                        title: 'Alertas de Cumplimiento',
                        desc: 'Notificaciones de ítems críticos',
                      },
                      {
                        key: 'notif_semanal' as const,
                        Icon: Database,
                        title: 'Reportes Semanales',
                        desc: 'Resumen semanal de actividades',
                      },
                    ].map(({ key, Icon, title, desc }, idx, arr) => (
                      <div key={key}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <Icon className="w-5 h-5 text-slate-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-slate-800 text-sm">{title}</p>
                              <p className="text-sm text-slate-500">{desc}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleChange({ [key]: !(config?.[key] ?? false) })}
                            className={`relative w-11 h-6 rounded-full transition-colors min-h-[36px] min-w-[44px] flex items-center ${
                              config?.[key] ? 'bg-indigo-600' : 'bg-slate-200'
                            }`}
                          >
                            <span
                              className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                config?.[key] ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                        {idx < arr.length - 1 && <div className="mt-5 border-t border-slate-100" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preferences */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-6 py-5 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800">Preferencias del Sistema</h3>
                    <p className="text-sm text-slate-500 mt-1">Personaliza la experiencia</p>
                  </div>
                  <div className="p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Zona Horaria
                      </label>
                      <select
                        value={config?.zona_horaria ?? 'America/Bogota'}
                        onChange={(e) => handleChange({ zona_horaria: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      >
                        <option value="America/Bogota">GMT-5 (Bogotá)</option>
                        <option value="America/Lima">GMT-5 (Lima)</option>
                        <option value="America/Mexico_City">GMT-6 (Ciudad de México)</option>
                        <option value="America/Buenos_Aires">GMT-3 (Buenos Aires)</option>
                        <option value="America/Santiago">GMT-3 (Santiago)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
