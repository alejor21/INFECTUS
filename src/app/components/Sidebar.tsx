import { useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GitCompare,
  Globe,
  LayoutDashboard,
  Loader2,
  LogOut,
  Pill,
  Settings,
  Shield,
  X,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useHospitalContext } from '../../contexts/HospitalContext';
import { useAlertBadge } from '../../hooks/useAlerts';
import { signOut } from '../../lib/supabase/auth';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  title: string;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobileOpen = false, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const unreadAlerts = useAlertBadge();
  const { profile } = useAuth();
  const { selectedHospitalObj, setSelectedHospitalObj, hospitals } = useHospitalContext();

  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const navGroups: NavGroup[] = [
    {
      label: 'PRINCIPAL',
      items: [
        {
          icon: LayoutDashboard,
          label: 'Dashboard',
          path: '/dashboard',
          title: 'Ver metricas y resumen del programa PROA',
        },
        {
          icon: BarChart3,
          label: 'Analiticas',
          path: '/indicadores-proa',
          title: 'Analiticas y metricas del programa',
        },
        {
          icon: ClipboardCheck,
          label: 'Evaluaciones',
          path: '/evaluacion',
          title: 'Evaluaciones PROA',
        },
        {
          icon: Building2,
          label: 'Hospitales',
          path: '/hospitales',
          title: 'Gestionar hospitales e instituciones',
        },
        {
          icon: Settings,
          label: 'Configuracion',
          path: '/configuracion',
          title: 'Configuracion del sistema',
        },
      ],
    },
    {
      label: 'ANALISIS',
      items: [
        {
          icon: Pill,
          label: 'Antibioticos',
          path: '/consumo-antibioticos',
          title: 'Consumo de antibioticos (DDD/DOT)',
        },
        {
          icon: Shield,
          label: 'Resistencias',
          path: '/resistencias',
          title: 'Perfil de resistencia bacteriana',
        },
        {
          icon: GitCompare,
          label: 'Comparativa',
          path: '/comparativa',
          title: 'Comparar metricas',
        },
        {
          icon: ClipboardList,
          label: 'PROA',
          path: '/plantilla-proa',
          title: 'Registro y plantilla PROA',
        },
        {
          icon: FileText,
          label: 'Reportes',
          path: '/reportes',
          title: 'Generar reportes',
        },
        {
          icon: Bell,
          label: 'Alertas',
          path: '/alertas',
          title: 'Alertas del sistema',
          badge: unreadAlerts,
        },
      ],
    },
  ];

  const TOUR_IDS: Record<string, string> = {
    '/dashboard': 'tour-dashboard',
    '/hospitales': 'tour-hospitales',
    '/evaluacion': 'tour-evaluaciones',
    '/indicadores-proa': 'tour-analytics',
    '/configuracion': 'tour-configuracion',
    '/reportes': 'tour-reportes',
  };

  function itemIsActive(path: string): boolean {
    if (location.pathname === path) {
      return true;
    }

    if (path.length > 1 && location.pathname.startsWith(`${path}/`)) {
      return true;
    }

    return false;
  }

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch {
      toast.error('Error al cerrar sesion');
      setIsSigningOut(false);
    }
  };

  const initials =
    profile?.avatar_initials ??
    (profile?.full_name
      ? profile.full_name
          .split(' ')
          .map((name) => name[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : '?');

  const roleLabels: Record<string, string> = {
    administrador: 'Administrador',
    infectologo: 'Infectologo',
    medico: 'Medico',
    visor: 'Visor',
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-950 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="flex h-16 items-center border-b border-gray-200 px-5 dark:border-gray-800">
        <div className="flex w-full items-center justify-between">
          <Link to="/dashboard" className="group flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 shadow-sm transition-shadow group-hover:shadow-md">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">INFECTUS</span>
          </Link>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
            aria-label="Cerrar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 px-3 py-3 dark:border-gray-800">
        <div className="relative">
          <button
            onClick={() => setShowHospitalDropdown((value) => !value)}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            {selectedHospitalObj ? (
              <Building2 className="h-4 w-4 shrink-0 text-teal-600" />
            ) : (
              <Globe className="h-4 w-4 shrink-0 text-gray-400" />
            )}
            <span className="flex-1 truncate text-left text-sm font-medium text-gray-700 dark:text-gray-200">
              {selectedHospitalObj?.name ?? 'Todos los hospitales'}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${showHospitalDropdown ? 'rotate-180' : ''}`}
            />
          </button>

          {showHospitalDropdown ? (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowHospitalDropdown(false)} />
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
                <button
                  onClick={() => {
                    setSelectedHospitalObj(null);
                    setShowHospitalDropdown(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    !selectedHospitalObj
                      ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Globe className="h-4 w-4 shrink-0" />
                  <span className="font-medium">Todos los hospitales</span>
                </button>

                {hospitals.map((hospital) => (
                  <button
                    key={hospital.id}
                    onClick={() => {
                      setSelectedHospitalObj(hospital);
                      setShowHospitalDropdown(false);
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedHospitalObj?.id === hospital.id
                        ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Building2 className="h-4 w-4 shrink-0" />
                    <div className="truncate text-left">
                      <div className="truncate font-medium">{hospital.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">{hospital.city}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group, groupIndex) => (
          <div key={group.label} className={groupIndex > 0 ? 'mt-6' : ''}>
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {group.label}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const active = itemIsActive(item.path);
                const badge = item.badge ?? 0;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    id={TOUR_IDS[item.path]}
                    title={item.title}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                      active
                        ? 'ml-0 border-l-2 border-teal-600 bg-teal-600/10 text-teal-600 dark:text-teal-400'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200'
                    }`}
                  >
                    <item.icon
                      className={`h-5 w-5 shrink-0 ${active ? '' : 'transition-transform group-hover:scale-105'}`}
                    />
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    {badge > 0 ? (
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-gray-200 p-3 dark:border-gray-800">
        <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {profile?.full_name ?? 'Usuario'}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {roleLabels[profile?.role ?? ''] ?? profile?.role ?? '-'}
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-800"
            title="Cerrar sesion"
          >
            {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Cerrar sesion
          </button>
        </div>
      </div>
    </aside>
  );
}
