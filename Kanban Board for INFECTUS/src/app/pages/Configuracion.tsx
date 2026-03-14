import { Settings, User, Bell, Shield, Database, Mail, Globe, Lock, Save } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';

export function Configuracion() {
  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Configuración</h2>
            <p className="text-sm text-slate-500 mt-1">
              Administración del sistema y preferencias
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-5xl mx-auto p-8">
          <div className="grid grid-cols-3 gap-8">
            {/* Sidebar Navigation */}
            <div className="col-span-1">
              <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-8">
                <nav className="space-y-1">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-700 font-medium">
                    <User className="w-5 h-5" />
                    <span className="text-sm">Perfil</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50">
                    <Bell className="w-5 h-5" />
                    <span className="text-sm">Notificaciones</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm">Seguridad</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50">
                    <Database className="w-5 h-5" />
                    <span className="text-sm">Datos</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50">
                    <Globe className="w-5 h-5" />
                    <span className="text-sm">Preferencias</span>
                  </button>
                </nav>
              </div>
            </div>

            {/* Main Settings Content */}
            <div className="col-span-2 space-y-6">
              {/* Profile Settings */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-6 py-5 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800">Información del Perfil</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Actualiza tu información personal
                  </p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                        Nombre
                      </Label>
                      <Input
                        id="firstName"
                        defaultValue="Juan"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                        Apellido
                      </Label>
                      <Input
                        id="lastName"
                        defaultValue="Pérez"
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                      Correo Electrónico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue="juan.perez@infectus.com"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="role" className="text-sm font-medium text-slate-700">
                      Cargo
                    </Label>
                    <Input
                      id="role"
                      defaultValue="Coordinador PROA"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="institution" className="text-sm font-medium text-slate-700">
                      Institución Principal
                    </Label>
                    <Input
                      id="institution"
                      defaultValue="Institución 1 - Bogotá"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-6 py-5 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800">Notificaciones</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Configura cómo deseas recibir actualizaciones
                  </p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-slate-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-800 text-sm">Notificaciones por Email</p>
                        <p className="text-sm text-slate-500">Recibe actualizaciones por correo</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 text-slate-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-800 text-sm">Alertas de Tareas Pendientes</p>
                        <p className="text-sm text-slate-500">Avisos de vencimientos próximos</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-slate-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-800 text-sm">Alertas de Cumplimiento</p>
                        <p className="text-sm text-slate-500">Notificaciones de instituciones críticas</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <Database className="w-5 h-5 text-slate-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-800 text-sm">Reportes Semanales</p>
                        <p className="text-sm text-slate-500">Resumen semanal de actividades</p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-6 py-5 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800">Seguridad</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Administra la seguridad de tu cuenta
                  </p>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <Label htmlFor="currentPassword" className="text-sm font-medium text-slate-700">
                      Contraseña Actual
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="••••••••"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPassword" className="text-sm font-medium text-slate-700">
                      Nueva Contraseña
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                      Confirmar Contraseña
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="mt-1.5"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-slate-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-800 text-sm">Autenticación de Dos Factores</p>
                        <p className="text-sm text-slate-500">Agrega una capa extra de seguridad</p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              {/* System Settings */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-6 py-5 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800">Preferencias del Sistema</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Personaliza la experiencia de la plataforma
                  </p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">Idioma</p>
                      <p className="text-sm text-slate-500">Español</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Cambiar
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">Zona Horaria</p>
                      <p className="text-sm text-slate-500">GMT-5 (Bogotá)</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Cambiar
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">Formato de Fecha</p>
                      <p className="text-sm text-slate-500">DD MMM YYYY</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Cambiar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
