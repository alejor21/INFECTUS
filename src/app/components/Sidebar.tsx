import {
  LayoutDashboard,
  Activity,
  Pill,
  Shield,
  FileText,
  Settings,
  Building2,
  GitCompare,
  Bell,
  X,
  UserRound,
  Calculator,
  ClipboardCheck,
  BarChart3,
  LogOut,
  ChevronDown,
  Globe,
  Loader2,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useState } from 'react';
import { useAlertBadge } from '../../hooks/useAlerts';
import { useAuth } from '../../contexts/AuthContext';
import { useHospitalContext } from '../../contexts/HospitalContext';
import { signOut } from '../../lib/supabase/auth';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

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
          title: 'Ver métricas y resumen del programa PROA',
        },
        {
          icon: BarChart3,
          label: 'Analíticas',
          path: '/indicadores-proa',
          title: 'Analíticas y métricas del programa',
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
          label: 'Configuración',
          path: '/configuracion',
          title: 'Configuración del sistema',
        },
      ],
    },
    {
      label: 'ANÁLISIS',
      items: [
        {
          icon: Pill,
          label: 'Antibióticos',
          path: '/consumo-antibioticos',
          title: 'Consumo de antibióticos (DDD/DOT)',
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
          title: 'Comparar métricas',
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
    if (location.pathname === path) return true;
    if (path.length > 1 && location.pathname.startsWith(path + '/')) return true;
    return false;
  }

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch {
      toast.error('Error al cerrar sesión');
      setIsSigningOut(false);
    }
  };

  const initials =
    profile?.avatar_initials ??
    (profile?.full_name
      ? profile.full_name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : '?');

  const roleLabels: Record<string, string> = {
    administrador: 'Administrador',
    infectologo: 'Infectólogo',
    medico: 'Médico',
    visor: 'Visor',
  };

  return (
    <aside
      className={`w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen fixed left-0 top-0 z-40 transition-transform duration-300 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div className="flex items-center justify-between w-full">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">
              INFECTUS
            </span>
          </Link>

          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hospital Selector */}
      <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <button
            onClick={() => setShowHospitalDropdown(!showHospitalDropdown)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 transition-colors"
          >
            {selectedHospitalObj ? (
              <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
            ) : (
              <Globe className="w-4 h-4 text-gray-400 shrink-0" />
            )}
            <span className="flex-1 text-left text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
              {selectedHospitalObj?.name ?? 'Todos los hospitales'}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showHospitalDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showHospitalDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowHospitalDropdown(false)} />
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg overflow-hidden z-20 max-h-64 overflow-y-auto">
                <button
                  onClick={() => { setSelectedHospitalObj(null); setShowHospitalDropdown(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    !selectedHospitalObj ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  <span className="font-medium">Todos los hospitales</span>
                </button>
                {hospitals.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => { setSelectedHospitalObj(h); setShowHospitalDropdown(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      selectedHospitalObj?.id === h.id ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <div className="text-left truncate">
                      <div className="font-medium truncate">{h.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">{h.city}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {navGroups.map((group, groupIdx) => (
          <div key={group.label} className={groupIdx > 0 ? 'mt-6' : ''}>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide px-3 mb-2">
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
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      active
                        ? 'bg-teal-600/10 text-teal-600 dark:text-teal-400 border-l-2 border-teal-600 ml-0'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 shrink-0 ${active ? '' : 'group-hover:scale-105 transition-transform'}`} />
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {badge > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 shrink-0">
        <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {profile?.full_name ?? 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {roleLabels[profile?.role ?? ''] ?? profile?.role ?? '—'}
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-800"
            title="Cerrar sesión"
          >
            {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
