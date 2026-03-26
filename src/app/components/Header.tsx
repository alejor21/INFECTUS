import { useState, useEffect, useRef } from 'react';
import { Bell, Menu, Activity, PlayCircle, Sun, Moon, Loader2, ChevronRight, Building2, Calendar, LogOut, BookOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useHospitalContext } from '../../contexts/HospitalContext';
import { useAlertBadge } from '../../hooks/useAlerts';
import { useTheme } from '../../contexts/ThemeContext';
import { ActiveFilters } from './ActiveFilters';
import { signOut } from '../../lib/supabase/auth';

const DATE_RANGE_LABELS: Record<'1m' | '6m' | '12m' | 'all', string> = {
  '1m': '1M',
  '6m': '6M',
  '12m': '12M',
  'all': 'Todo',
};

// Breadcrumb mapping
const BREADCRUMBS: Record<string, { label: string; parent?: string }> = {
  '/dashboard': { label: 'Dashboard' },
  '/hospitales': { label: 'Hospitales' },
  '/pacientes': { label: 'Pacientes' },
  '/evaluacion': { label: 'Evaluaciones' },
  '/indicadores-proa': { label: 'Analíticas' },
  '/consumo-antibioticos': { label: 'Antibióticos', parent: 'Analíticas' },
  '/resistencias': { label: 'Resistencias', parent: 'Analíticas' },
  '/comparativa': { label: 'Comparativa', parent: 'Análisis' },
  '/calculadora-ddd': { label: 'Calculadora DDD', parent: 'Análisis' },
  '/reportes': { label: 'Reportes', parent: 'Análisis' },
  '/alertas': { label: 'Alertas' },
  '/configuracion': { label: 'Configuración' },
};

interface HeaderProps {
  onMenuOpen: () => void;
  onStartTour?: () => void;
}

export function Header({ onMenuOpen, onStartTour }: HeaderProps) {
  const {
    selectedHospitalObj,
    dateRange,
    setDateRange,
  } = useHospitalContext();
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

  // Close user menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (dateMenuRef.current && !dateMenuRef.current.contains(e.target as Node)) {
        setShowDateMenuMobile(false);
      }
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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
  }, [showUserMenu, showDateMenuMobile]);

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

  // Build breadcrumb with paths
  const currentPage = BREADCRUMBS[pathname];
  const breadcrumbItems: { label: string; path?: string }[] = [];
  if (currentPage?.parent) {
    // Try to find parent path (parent pages are usually Analíticas, Análisis, etc.)
    if (currentPage.parent === 'Analíticas') {
      breadcrumbItems.push({ label: currentPage.parent, path: '/indicadores-proa' });
    } else if (currentPage.parent === 'Análisis') {
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
      toast.error('Error al cerrar sesión');
      setIsSigningOut(false);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 fixed top-0 right-0 left-0 lg:left-64 z-20">
      <div className="h-auto lg:min-h-[88px] px-4 lg:px-6 flex flex-col lg:flex-row lg:items-center lg:justify-between py-4 gap-3">

        {/* Left section: hamburger (mobile) + breadcrumb + active filters */}
        <div className="flex flex-col gap-2 flex-1">
          {/* Top row: hamburger + breadcrumb */}
          <div className="flex items-center gap-3">
            {/* Mobile: hamburger button */}
            <button
              onClick={onMenuOpen}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile branding */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm text-gray-900 dark:text-white">INFECTUS</span>
            </div>

            {/* Desktop: Breadcrumb */}
            <nav className="hidden lg:flex items-center gap-2 text-sm">
              {breadcrumbItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {idx > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                  {item.path && idx < breadcrumbItems.length - 1 ? (
                    <button
                      onClick={() => navigate(item.path!)}
                      className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors underline"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span className={idx === breadcrumbItems.length - 1
                      ? 'font-medium text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'}>
                      {item.label}
                    </span>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Active Filters - show on desktop and mobile */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-3">
              {selectedHospitalObj && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-lg text-sm font-medium">
                  <Building2 className="w-4 h-4" />
                  <span>{selectedHospitalObj.name}</span>
                </div>
              )}
              <ActiveFilters
                hospital={selectedHospitalObj?.name}
                dateRange={dateRange}
                className="text-xs"
              />
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Date range pills — desktop only */}
          <div className="hidden lg:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['1m', '6m', '12m', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  dateRange === r
                    ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {DATE_RANGE_LABELS[r]}
              </button>
            ))}
          </div>

          {/* Date range dropdown — mobile only */}
          <div className="relative lg:hidden" ref={dateMenuRef}>
            <button
              onClick={() => setShowDateMenuMobile((v) => !v)}
              className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              title="Rango de fecha"
            >
              <Calendar className="w-5 h-5" />
            </button>

            {showDateMenuMobile && (
              <div className="absolute right-0 top-12 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg py-2 z-50">
                {(['1m', '6m', '12m', 'all'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setDateRange(r);
                      setShowDateMenuMobile(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      dateRange === r
                        ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {DATE_RANGE_LABELS[r]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          {onStartTour && (
            <button
              onClick={onStartTour}
              className="hidden lg:inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
              title="Abrir guía rápida"
            >
              <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Guía rápida
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <button
            onClick={() => navigate('/alertas')}
            className="relative p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title="Ver alertas"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadAlerts > 9 ? '9+' : unreadAlerts}
              </span>
            )}
          </button>

          {/* User avatar with dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-semibold">
                {initials}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {profile?.full_name ?? 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {profile?.email ?? ''}
                  </p>
                </div>
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/configuracion'); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Ver perfil
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); onStartTour?.(); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <PlayCircle className="w-4 h-4 text-teal-600" />
                  Abrir guía rápida
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    void handleSignOut();
                  }}
                  disabled={isSigningOut}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                >
                  {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
