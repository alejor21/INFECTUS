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
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useAlertBadge } from '../../hooks/useAlerts';

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
  const unreadAlerts = useAlertBadge();

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
          icon: Building2,
          label: 'Hospitales',
          path: '/hospitales',
          title: 'Gestionar hospitales e instituciones',
        },
        {
          icon: UserRound,
          label: 'Pacientes',
          path: '/pacientes',
          title: 'Gestionar pacientes registrados',
        },
      ],
    },
    {
      label: 'PROGRAMA PROA',
      items: [
        {
          icon: ClipboardCheck,
          label: 'Evaluación PROA',
          path: '/evaluacion',
          title: 'Evaluar el programa PROA con 61 criterios estandarizados',
        },
        {
          icon: Activity,
          label: 'Indicadores PROA',
          path: '/indicadores-proa',
          title: 'Monitorear indicadores clave del programa PROA',
        },
        {
          icon: Pill,
          label: 'Consumo Antibióticos',
          path: '/consumo-antibioticos',
          title: 'Análisis del consumo de antibióticos (DDD/DOT)',
        },
        {
          icon: Shield,
          label: 'Resistencias',
          path: '/resistencias',
          title: 'Perfil institucional de resistencia bacteriana',
        },
      ],
    },
    {
      label: 'ANÁLISIS',
      items: [
        {
          icon: GitCompare,
          label: 'Comparativa',
          path: '/comparativa',
          title: 'Comparar métricas entre hospitales o períodos',
        },
        {
          icon: Calculator,
          label: 'Calculadora DDD',
          path: '/calculadora-ddd',
          title: 'Calcular Dosis Diarias Definidas para cualquier antibiótico',
        },
        {
          icon: FileText,
          label: 'Reportes',
          path: '/reportes',
          title: 'Generar y exportar reportes en PDF',
        },
        {
          icon: Bell,
          label: 'Alertas',
          path: '/alertas',
          title: 'Alertas y notificaciones del sistema',
          badge: unreadAlerts,
        },
      ],
    },
    {
      label: 'SISTEMA',
      items: [
        {
          icon: Settings,
          label: 'Configuración',
          path: '/configuracion',
          title: 'Configuración del hospital y programa PROA',
        },
      ],
    },
  ];

  const TOUR_IDS: Record<string, string> = {
    '/dashboard': 'tour-dashboard',
    '/hospitales': 'tour-hospitales',
    '/pacientes': 'tour-pacientes',
    '/calculadora-ddd': 'tour-calculadora',
    '/alertas': 'tour-alertas',
    '/reportes': 'tour-reportes',
  };

  function itemIsActive(path: string): boolean {
    if (location.pathname === path) return true;
    if (path.length > 1 && location.pathname.startsWith(path + '/')) return true;
    return false;
  }

  return (
    <aside
      className={`w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen fixed left-0 top-0 z-40 transition-transform duration-300 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Logo + mobile close button */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#0B3C5D' }}
            >
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl" style={{ color: '#0B3C5D' }}>
              Infectus
            </span>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto space-y-1">
        {navGroups.map((group, groupIdx) => (
          <div key={group.label} className={groupIdx > 0 ? 'pt-3' : ''}>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
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
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] ${
                      active
                        ? 'text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    style={active ? { backgroundColor: '#0F8B8D' } : {}}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {badge > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold leading-none">
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

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
        <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
          v1.0.2 • © 2026 Infectus
        </div>
      </div>
    </aside>
  );
}
