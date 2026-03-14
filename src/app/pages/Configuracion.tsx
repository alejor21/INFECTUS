import { Settings, User, Bell, Database, Shield, Mail, Building2, Target, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useDataManagement } from '../../hooks/useDataManagement';
import { useAuth } from '../../contexts/AuthContext';
import { getAllProfiles, updateProfile, signUp } from '../../lib/supabase/auth';

export function Configuracion() {
  const [activeTab, setActiveTab] = useState('general');
  const [hospitalName, setHospitalName] = useState('Hospital General Central');
  const { uploadFile, status, result, error } = useFileUpload();
  const {
    hospitals: hospitalStats,
    loading: statsLoading,
    deleteHospital,
    deleteAll,
    deleteStatus,
    deleteError,
  } = useDataManagement();

  // Usuarios tab state
  const { isAdmin, profile: currentProfile } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState('medico');
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('medico');
  const [editActive, setEditActive] = useState(true);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    getAllProfiles().then((data) => {
      setProfiles(data);
      setLoadingProfiles(false);
    });
  }, []);

  const handleAddUser = async () => {
    if (!addName.trim() || !addEmail.trim() || !addPassword.trim()) return;
    setAddLoading(true);
    setAddError(null);
    const { error } = await signUp(addEmail, addPassword, addName, addRole);
    if (error) {
      setAddError(error.message);
      setAddLoading(false);
      return;
    }
    setAddLoading(false);
    setShowAddForm(false);
    setAddName('');
    setAddEmail('');
    setAddPassword('');
    setAddRole('medico');
    getAllProfiles().then(setProfiles);
  };

  const handleSaveEdit = async (userId: string) => {
    setEditLoading(true);
    await updateProfile(userId, { role: editRole as any, is_active: editActive });
    setEditLoading(false);
    setEditingId(null);
    getAllProfiles().then(setProfiles);
  };

  function formatTimestamp(ts: string): string {
    if (!ts) return '—';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'usuarios', label: 'Usuarios', icon: User },
    { id: 'objetivos', label: 'Objetivos PROA', icon: Target },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'integracion', label: 'Integración', icon: Database },
  ];

  return (
    <div className="p-4 lg:p-8">
      {/* Page title */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#0B3C5D' }}>
          Configuración
        </h1>
        <p className="text-gray-600">
          Administración del sistema y parámetros del Programa PROA
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 bg-white rounded-xl shadow-sm border border-gray-200 p-2 lg:p-4 h-fit">
          <nav className="flex lg:flex-col overflow-x-auto gap-1 pb-1 lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 lg:w-full items-center space-x-2 lg:space-x-3 px-3 lg:px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                style={activeTab === tab.id ? { backgroundColor: '#0F8B8D' } : {}}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Hospital Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-6" style={{ color: '#0B3C5D' }}>
                  Información del Hospital
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del hospital
                    </label>
                    <input
                      type="text"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      style={{ focusRing: '#0F8B8D' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código de centro
                    </label>
                    <input
                      type="text"
                      defaultValue="HGC-2026"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de camas
                    </label>
                    <input
                      type="number"
                      defaultValue="450"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Región
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50">
                      <option>Región Central</option>
                      <option>Región Norte</option>
                      <option>Región Sur</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* System Settings */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-6" style={{ color: '#0B3C5D' }}>
                  Configuración del Sistema
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <p className="font-medium text-gray-900">Actualizaciones automáticas</p>
                      <p className="text-sm text-gray-600">Actualizar datos diariamente a las 6:00 AM</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-opacity-30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-opacity-100" style={{ backgroundColor: '#0F8B8D' }}></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <p className="font-medium text-gray-900">Alertas de resistencia</p>
                      <p className="text-sm text-gray-600">Notificar cuando se detecten patrones críticos</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-opacity-30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-opacity-100" style={{ backgroundColor: '#0F8B8D' }}></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-gray-900">Modo avanzado</p>
                      <p className="text-sm text-gray-600">Mostrar opciones adicionales de análisis</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-opacity-30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-opacity-100" style={{ backgroundColor: '#0F8B8D' }}></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button className="px-6 py-3 rounded-lg font-medium text-white transition-opacity hover:opacity-90" style={{ backgroundColor: '#0F8B8D' }}>
                  Guardar cambios
                </button>
              </div>
            </div>
          )}

          {activeTab === 'usuarios' && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold" style={{ color: '#0B3C5D' }}>
                  Gestión de Usuarios
                </h3>
                {isAdmin && (
                  <button
                    onClick={() => { setShowAddForm((v) => !v); setAddError(null); }}
                    className="px-4 py-2 rounded-lg font-medium text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#0F8B8D' }}
                  >
                    + Agregar usuario
                  </button>
                )}
              </div>

              {/* Inline add form */}
              {showAddForm && isAdmin && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Nuevo usuario</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Nombre completo</label>
                      <input
                        type="text"
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        placeholder="Dr. Juan García"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={addEmail}
                        onChange={(e) => setAddEmail(e.target.value)}
                        placeholder="correo@hospital.com"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Contraseña temporal</label>
                      <input
                        type="password"
                        value={addPassword}
                        onChange={(e) => setAddPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Rol</label>
                      <select
                        value={addRole}
                        onChange={(e) => setAddRole(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                      >
                        <option value="medico">Médico</option>
                        <option value="infectologo">Infectólogo</option>
                        <option value="administrador">Administrador</option>
                      </select>
                    </div>
                  </div>
                  {addError && <p className="text-xs text-red-600 mb-3">{addError}</p>}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleAddUser}
                      disabled={addLoading}
                      className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-60"
                      style={{ backgroundColor: '#0F8B8D' }}
                    >
                      {addLoading ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      onClick={() => { setShowAddForm(false); setAddError(null); }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {loadingProfiles ? (
                <p className="text-sm text-gray-500 py-4">Cargando usuarios...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden sm:table-cell">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rol</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                        {isAdmin && <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {profiles.map((p: any) => {
                        const isCurrentUser = currentProfile?.id === p.id;
                        const avatarInitials = (
                          p.avatar_initials ??
                          (p.full_name
                            ? p.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                            : '?')
                        ).toUpperCase();

                        if (editingId === p.id && isAdmin) {
                          return (
                            <tr key={p.id} className="bg-gray-50">
                              <td className="px-6 py-4" colSpan={2}>
                                <span className="text-sm font-medium text-gray-900">{p.full_name}</span>
                                <span className="text-xs text-gray-500 ml-2 hidden sm:inline">{p.email}</span>
                              </td>
                              <td className="px-6 py-4">
                                <select
                                  value={editRole}
                                  onChange={(e) => setEditRole(e.target.value)}
                                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none"
                                >
                                  <option value="medico">Médico</option>
                                  <option value="infectologo">Infectólogo</option>
                                  <option value="administrador">Administrador</option>
                                </select>
                              </td>
                              <td className="px-6 py-4">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editActive}
                                    onChange={(e) => setEditActive(e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div
                                    className="w-9 h-5 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"
                                    style={{ backgroundColor: editActive ? '#0F8B8D' : '#D1D5DB' }}
                                  />
                                </label>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleSaveEdit(p.id)}
                                    disabled={editLoading}
                                    className="px-3 py-1 text-xs font-medium text-white rounded-lg disabled:opacity-60"
                                    style={{ backgroundColor: '#0F8B8D' }}
                                  >
                                    {editLoading ? '...' : 'Guardar'}
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="px-3 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr
                            key={p.id}
                            className={`hover:bg-gray-50 ${isCurrentUser ? 'border-l-4' : ''}`}
                            style={isCurrentUser ? { borderLeftColor: '#0F8B8D' } : {}}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                                  style={{ backgroundColor: '#0F8B8D' }}
                                >
                                  {avatarInitials}
                                </div>
                                <span className="font-medium text-gray-900">{p.full_name || '—'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">{p.email || '—'}</td>
                            <td className="px-6 py-4">
                              {p.role === 'administrador' ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-md text-white" style={{ backgroundColor: '#0F8B8D' }}>Administrador</span>
                              ) : p.role === 'infectologo' ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-700">Infectólogo</span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700">Médico</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {p.is_active !== false ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-700">Activo</span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium rounded-md bg-red-100 text-red-700">Inactivo</span>
                              )}
                            </td>
                            {isAdmin && (
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => {
                                    setEditingId(p.id);
                                    setEditRole(p.role ?? 'medico');
                                    setEditActive(p.is_active !== false);
                                  }}
                                  className="text-sm font-medium hover:opacity-80"
                                  style={{ color: '#0F8B8D' }}
                                >
                                  Editar
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'objetivos' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-6" style={{ color: '#0B3C5D' }}>
                  Objetivos del Programa PROA
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tasa de prescripción adecuada (%)
                      </label>
                      <input
                        type="number"
                        defaultValue="85"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reducción de consumo DDD (%)
                      </label>
                      <input
                        type="number"
                        defaultValue="10"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Interconsultas realizadas (%)
                      </label>
                      <input
                        type="number"
                        defaultValue="90"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Desescalada terapéutica (%)
                      </label>
                      <input
                        type="number"
                        defaultValue="70"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profilaxis quirúrgica adecuada (%)
                      </label>
                      <input
                        type="number"
                        defaultValue="95"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Suspensión oportuna (%)
                      </label>
                      <input
                        type="number"
                        defaultValue="75"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="px-6 py-3 rounded-lg font-medium text-white transition-opacity hover:opacity-90" style={{ backgroundColor: '#0F8B8D' }}>
                  Actualizar objetivos
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notificaciones' && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-6" style={{ color: '#0B3C5D' }}>
                Configuración de Notificaciones
              </h3>
              <div className="space-y-4">
                <div className="flex items-start justify-between py-4 border-b border-gray-200">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 mt-1" style={{ color: '#0F8B8D' }} />
                    <div>
                      <p className="font-medium text-gray-900">Alertas de resistencia</p>
                      <p className="text-sm text-gray-600">Recibir email cuando se detecten patrones críticos de resistencia</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-opacity-30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-opacity-100" style={{ backgroundColor: '#0F8B8D' }}></div>
                  </label>
                </div>
                <div className="flex items-start justify-between py-4 border-b border-gray-200">
                  <div className="flex items-start space-x-3">
                    <Bell className="w-5 h-5 mt-1" style={{ color: '#0F8B8D' }} />
                    <div>
                      <p className="font-medium text-gray-900">Reportes mensuales</p>
                      <p className="text-sm text-gray-600">Recibir resumen ejecutivo al inicio de cada mes</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-opacity-30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-opacity-100" style={{ backgroundColor: '#0F8B8D' }}></div>
                  </label>
                </div>
                <div className="flex items-start justify-between py-4 border-b border-gray-200">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 mt-1" style={{ color: '#0F8B8D' }} />
                    <div>
                      <p className="font-medium text-gray-900">Incumplimiento de objetivos</p>
                      <p className="text-sm text-gray-600">Notificar cuando los indicadores estén por debajo del objetivo</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-opacity-30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-opacity-100" style={{ backgroundColor: '#0F8B8D' }}></div>
                  </label>
                </div>
                <div className="flex items-start justify-between py-4">
                  <div className="flex items-start space-x-3">
                    <Building2 className="w-5 h-5 mt-1" style={{ color: '#0F8B8D' }} />
                    <div>
                      <p className="font-medium text-gray-900">Actualizaciones del sistema</p>
                      <p className="text-sm text-gray-600">Recibir notificaciones sobre nuevas funcionalidades</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-opacity-30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-opacity-100" style={{ backgroundColor: '#0F8B8D' }}></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integracion' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-6" style={{ color: '#0B3C5D' }}>
                  Integración con Sistemas Externos
                </h3>
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100">
                          <Database className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Sistema HIS</p>
                          <p className="text-sm text-gray-600">Hospital Information System</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Conectado
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Sincronización automática de datos de prescripciones y pacientes
                    </p>
                    <button className="text-sm font-medium hover:opacity-80" style={{ color: '#0F8B8D' }}>
                      Configurar conexión
                    </button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100">
                          <Database className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">LIS - Laboratorio</p>
                          <p className="text-sm text-gray-600">Laboratory Information System</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Conectado
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Importación de resultados de cultivos y antibiogramas
                    </p>
                    <button className="text-sm font-medium hover:opacity-80" style={{ color: '#0F8B8D' }}>
                      Configurar conexión
                    </button>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      disabled={status === 'parsing' || status === 'uploading'}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadFile(f, hospitalName);
                        e.target.value = '';
                      }}
                    />
                    {(status === 'parsing' || status === 'uploading') && (
                      <p className="text-xs text-gray-500 mt-2">
                        {status === 'parsing' ? 'Procesando archivo...' : 'Subiendo datos...'}
                      </p>
                    )}
                    {status === 'success' && result && (
                      <p className="text-xs text-green-700 mt-2">
                        {result.inserted} registros importados, {result.skipped} omitidos
                        {result.errors.length > 0 && `, ${result.errors.length} con errores`}
                      </p>
                    )}
                    {status === 'error' && error && (
                      <p className="text-xs text-red-600 mt-2">Error: {error}</p>
                    )}
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg opacity-60">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
                          <Database className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Sistema de Farmacia</p>
                          <p className="text-sm text-gray-600">Pharmacy Management System</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        Desconectado
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Control de dispensación y stock de antibióticos
                    </p>
                    <button className="text-sm font-medium hover:opacity-80" style={{ color: '#0F8B8D' }}>
                      Configurar conexión
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Management */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-6" style={{ color: '#0B3C5D' }}>
                  Gestión de datos
                </h3>

                {deleteStatus === 'error' && deleteError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    Error: {deleteError}
                  </div>
                )}

                {deleteStatus === 'success' && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                    Datos eliminados correctamente.
                  </div>
                )}

                {statsLoading ? (
                  <p className="text-sm text-gray-500">Cargando datos...</p>
                ) : hospitalStats.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay datos cargados en el sistema.</p>
                ) : (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hospital</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Registros</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Última carga</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {hospitalStats.map((h) => (
                          <tr key={h.hospitalName} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{h.hospitalName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{h.recordCount.toLocaleString('es-ES')}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{formatTimestamp(h.lastUpload)}</td>
                            <td className="px-4 py-3">
                              <button
                                disabled={deleteStatus === 'deleting'}
                                onClick={() => {
                                  if (window.confirm(`¿Eliminar todos los registros de "${h.hospitalName}"? Esta acción no se puede deshacer.`)) {
                                    deleteHospital(h.hospitalName);
                                  }
                                }}
                                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Eliminar</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {!statsLoading && hospitalStats.length > 0 && (
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      disabled={deleteStatus === 'deleting'}
                      onClick={() => {
                        if (window.confirm('¿Eliminar TODOS los datos del sistema? Esta acción es irreversible y borrará los registros de todos los hospitales.')) {
                          deleteAll();
                        }
                      }}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{deleteStatus === 'deleting' ? 'Eliminando...' : 'Eliminar todos los datos'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
