import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  ChevronRight,
  Loader2,
  LogOut,
  Menu,
  Moon,
  PlayCircle,
  Sun,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useHospitalContext } from '../../contexts/HospitalContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAlertBadge } from '../../hooks/useAlerts';
import { signOut } from '../../lib/supabase/auth';
import { ActiveFilters } from './ActiveFilters';

const DATE_RANGE_LABELS: Record<'1m' | '6m' | '12m' | 'all', string> = {
  '1m': '1M',
  '6m': '6M',
  '12m': '12M',
  all: 'Todo',
};

const BREADCRUMBS: Record<string, { label: string; parent?: string }> = {
  '/dashboard': { label: 'Dashboard' },
  '/hospitales': { label: 'Hospitales' },
  '/pacientes': { label: 'Pacientes' },
  '/evaluacion': { label: 'Evaluaciones' },
  '/indicadores-proa': { label: 'Analiticas' },
  '/consumo-antibioticos': { label: 'Antibioticos', parent: 'Analiticas' },
  '/resistencias': { label: 'Resistencias', parent: 'Analiticas' },
  '/comparativa': { label: 'Comparativa', parent: 'Analisis' },
  '/calculadora-ddd': { label: 'Calculadora DDD', parent: 'Analisis' },
  '/reportes': { label: 'Reportes', parent: 'Analisis' },
  '/alertas': { label: 'Alertas' },
  '/configuracion': { label: 'Configuracion' },
};

interface HeaderProps {
  onMenuOpen: () => void;
  onStartTour?: () => void;
}

export function Header({ onMenuOpen, onStartTour }: HeaderProps) {
  const { selectedHospitalObj, dateRange, setDateRange } = useHospitalContext();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDateMenuMobile, setShowDateMenuMobile] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const dateMenuRef = useRef<HTMLDivElement>(null);
  const unreadAlerts = useAlertBadge();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }

      if (dateMenuRef.current && !dateMenuRef.current.contains(event.target as Node)) {
        setShowDateMenuMobile(false);
      }
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
        setShowDateMenuMobile(false);
      }
    };

    if (showUserMenu || showDateMenuMobile) {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKeydown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [showDateMenuMobile, showUserMenu]);

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

  const currentPage = BREADCRUMBS[pathname];
  const breadcrumbItems: { label: string; path?: string }[] = [];

  if (currentPage?.parent) {
    if (currentPage.parent === 'Analiticas') {
      breadcrumbItems.push({ label: currentPage.parent, path: '/indicadores-proa' });
    } else if (currentPage.parent === 'Analisis') {
      breadcrumbItems.push({ label: currentPage.parent, path: '/reportes' });
    }
  }

  if (currentPage) {
    breadcrumbItems.push({ label: currentPage.label });
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

  return (
    <header className="fixed left-0 right-0 top-0 z-20 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 lg:left-64">
      <div className="flex h-auto flex-col gap-3 px-4 py-4 lg:min-h-[88px] lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuOpen}
              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">INFECTUS</span>
            </div>

            <nav className="hidden items-center gap-2 text-sm lg:flex">
              {breadcrumbItems.map((item, index) => (
                <div key={`${item.label}-${index}`} className="flex items-center gap-2">
                  {index > 0 ? <ChevronRight className="h-4 w-4 text-gray-400" /> : null}
                  {item.path && index < breadcrumbItems.length - 1 ? (
                    <button
                      onClick={() => navigate(item.path)}
                      className="text-teal-600 underline transition-colors hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span
                      className={
                        index === breadcrumbItems.length - 1
                          ? 'font-medium text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400'
                      }
                    >
                      {item.label}
                    </span>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="hidden lg:block">
            <div className="flex items-center gap-3">
              {selectedHospitalObj ? (
                <div className="inline-flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                  <Building2 className="h-4 w-4" />
                  <span>{selectedHospitalObj.name}</span>
                </div>
              ) : null}
              <ActiveFilters hospital={selectedHospitalObj?.name} dateRange={dateRange} className="text-xs" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800 lg:flex">
            {(['1m', '6m', '12m', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  dateRange === range
                    ? 'bg-white text-teal-600 shadow-sm dark:bg-gray-700 dark:text-teal-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {DATE_RANGE_LABELS[range]}
              </button>
            ))}
          </div>

          <div className="relative lg:hidden" ref={dateMenuRef}>
            <button
              onClick={() => setShowDateMenuMobile((value) => !value)}
              className="rounded-lg p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              title="Rango de fecha"
            >
              <Calendar className="h-5 w-5" />
            </button>

            {showDateMenuMobile ? (
              <div className="absolute right-0 top-12 z-50 w-40 rounded-lg border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                {(['1m', '6m', '12m', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setDateRange(range);
                      setShowDateMenuMobile(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                      dateRange === range
                        ? 'bg-teal-50 font-medium text-teal-600 dark:bg-teal-900/30 dark:text-teal-400'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    {DATE_RANGE_LABELS[range]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {onStartTour ? (
            <button
              onClick={onStartTour}
              className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800 lg:inline-flex"
              title="Abrir guia rapida"
            >
              <BookOpen className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Guia rapida
            </button>
          ) : null}

          <button
            onClick={toggleTheme}
            className="rounded-lg p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button
            onClick={() => navigate('/alertas')}
            className="relative rounded-lg p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            title="Ver alertas"
          >
            <Bell className="h-5 w-5" />
            {unreadAlerts > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadAlerts > 9 ? '9+' : unreadAlerts}
              </span>
            ) : null}
          </button>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu((value) => !value)}
              className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                {initials}
              </div>
            </button>

            {showUserMenu ? (
              <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                <div className="border-b border-gray-100 px-4 py-2 dark:border-gray-800">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {profile?.full_name ?? 'Usuario'}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{profile?.email ?? ''}</p>
                </div>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/configuracion');
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Ver perfil
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onStartTour?.();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <PlayCircle className="h-4 w-4 text-teal-600" />
                  Abrir guia rapida
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    void handleSignOut();
                  }}
                  disabled={isSigningOut}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                  Cerrar sesion
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
