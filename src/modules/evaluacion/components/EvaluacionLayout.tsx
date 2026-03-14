import { useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  FileText,
  Shield,
  BarChart3,
  Settings,
  X,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { EvaluacionNavbar } from './EvaluacionNavbar';
import { EvaluacionProvider, useEvaluacionContext } from '../context/EvaluacionContext';

const NAV_ITEMS = [
  { to: '/evaluacion', icon: LayoutDashboard, label: 'Tablero' },
  { to: '/evaluacion/instituciones', icon: Building2, label: 'Instituciones' },
  { to: '/evaluacion/proa', icon: ClipboardCheck, label: 'PROA' },
  { to: '/evaluacion/formularios', icon: FileText, label: 'Formularios' },
  { to: '/evaluacion/ias', icon: Shield, label: 'IAS' },
  { to: '/evaluacion/reportes', icon: BarChart3, label: 'Reportes' },
  { to: '/evaluacion/configuracion', icon: Settings, label: 'Configuración' },
] as const;

function EvaluacionShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { hospitals, selectedHospitalId, setSelectedHospitalId } = useEvaluacionContext();
  const { profile } = useAuth();

  const initials =
    profile?.avatar_initials ?? (profile?.full_name?.slice(0, 2).toUpperCase() ?? 'US');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 flex flex-col transition-transform duration-300
          md:static md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-700">
          <Activity className="w-7 h-7 text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-tight truncate">Infectus</p>
            <p className="text-gray-400 text-xs leading-tight truncate">Evaluación PROA</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-gray-400 hover:text-white md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/evaluacion'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-gray-700 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {profile?.full_name ?? 'Usuario'}
            </p>
            <p className="text-gray-400 text-xs truncate">{profile?.role ?? ''}</p>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar with hospital selector */}
        <EvaluacionNavbar
          hospitals={hospitals}
          selectedHospitalId={selectedHospitalId}
          onHospitalChange={setSelectedHospitalId}
          onMenuOpen={() => setSidebarOpen(true)}
        />

        {/* Page content via Outlet */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export function EvaluacionLayout() {
  return (
    <EvaluacionProvider>
      <EvaluacionShell />
    </EvaluacionProvider>
  );
}
