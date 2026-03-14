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
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useAlertBadge } from '../../hooks/useAlerts';

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobileOpen = false, onClose }: SidebarProps) {
  const location = useLocation();
  const unreadAlerts = useAlertBadge();

  const navigationItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Building2, label: 'Hospitales', path: '/hospitales' },
    { icon: UserRound, label: 'Pacientes', path: '/pacientes' },
    { icon: GitCompare, label: 'Comparativa', path: '/comparativa' },
    { icon: Calculator, label: 'Calculadora DDD', path: '/calculadora-ddd' },
    { icon: Activity, label: 'Indicadores PROA', path: '/indicadores-proa' },
    { icon: Pill, label: 'Consumo de Antibióticos', path: '/consumo-antibioticos' },
    { icon: Shield, label: 'Resistencias', path: '/resistencias' },
    { icon: FileText, label: 'Reportes', path: '/reportes' },
    { icon: Bell, label: 'Alertas', path: '/alertas', badge: unreadAlerts },
    { icon: Settings, label: 'Configuración', path: '/configuracion' },
  ] as const;

  const TOUR_IDS: Record<string, string> = {
    '/': 'tour-dashboard',
    '/hospitales': 'tour-hospitales',
    '/pacientes': 'tour-pacientes',
    '/calculadora-ddd': 'tour-calculadora',
    '/alertas': 'tour-alertas',
    '/reportes': 'tour-reportes',
  };

  return (
    <aside
      className={`w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-40 transition-transform duration-300 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Logo + mobile close button */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 shrink-0">
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

          {/* X close button — only visible on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === '/' && location.pathname === '/');
          const badge = 'badge' in item ? item.badge : 0;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              id={TOUR_IDS[item.path]}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] ${
                isActive ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={isActive ? { backgroundColor: '#0F8B8D' } : {}}
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
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 shrink-0">
        <div className="text-xs text-gray-500 text-center">v1.0.2 • © 2026 Infectus</div>
      </div>
    </aside>
  );
}
