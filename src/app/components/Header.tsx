import { useState, useEffect, useRef } from 'react';
import { Globe, Building2, Bell, Menu, Activity, PlayCircle, Home, Loader2, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useHospitalContext } from '../../contexts/HospitalContext';
import { signOut } from '../../lib/supabase/auth';
import { useAlertBadge } from '../../hooks/useAlerts';
import { useTheme } from '../../contexts/ThemeContext';

const DATE_RANGE_LABELS: Record<'1m' | '6m' | '12m' | 'all', string> = {
  '1m': '1M',
  '6m': '6M',
  '12m': '12M',
  'all': 'Todo',
};

interface HeaderProps {
  onMenuOpen: () => void;
  onStartTour?: () => void;
}

export function Header({ onMenuOpen, onStartTour }: HeaderProps) {
  const {
    selectedHospitalObj,
    setSelectedHospitalObj,
    hospitals,
    dateRange,
    setDateRange,
  } = useHospitalContext();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHospitalMenu, setShowHospitalMenu] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const hospitalMenuRef = useRef<HTMLDivElement>(null);
  const unreadAlerts = useAlertBadge();

  // Close hospital dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (hospitalMenuRef.current && !hospitalMenuRef.current.contains(e.target as Node)) {
        setShowHospitalMenu(false);
      }
    };
    if (showHospitalMenu) {
      document.addEventListener('mousedown', handler);
    }
    return () => { document.removeEventListener('mousedown', handler); };
  }, [showHospitalMenu]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      localStorage.removeItem('infectus-onboarding-complete');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Error al cerrar sesión. Inténtalo de nuevo.');
      setIsSigningOut(false);
    }
  };

  const displayName = profile?.full_name ?? '—';
  const roleLabel: Record<string, string> = {
    administrador: 'Admin',
    infectologo: 'Infectólogo',
    medico: 'Médico',
    visor: 'Visitante',
  };
  const roleBadgeCls: Record<string, string> = {
    administrador: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    infectologo: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    medico: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    visor: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  };
  const roleKey = profile?.role ?? '';
  const displayRoleLabel = roleLabel[roleKey] ?? roleKey;
  const displayRoleCls = roleBadgeCls[roleKey] ?? roleBadgeCls.visor;
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

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 fixed top-0 right-0 left-0 lg:left-64 z-20">
      <div className="h-full px-4 lg:px-8 flex items-center justify-between">

        {/* Left section: Home button + hamburger (mobile) + hospital switcher (desktop) */}
        <div className="flex items-center gap-2">
          {pathname !== '/' && (
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors min-h-[44px] min-w-[44px]"
              title="Inicio"
              aria-label="Inicio"
            >
              <Home className="w-5 h-5" />
            </button>
          )}

          {/* Mobile: hamburger button (hidden on desktop) */}
          <button
            onClick={onMenuOpen}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop: hospital switcher dropdown (hidden on mobile) */}
          <div className="hidden lg:block relative" ref={hospitalMenuRef}>
          <button
            onClick={() => setShowHospitalMenu((v) => !v)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {selectedHospitalObj ? (
              <>
                <Building2 className="w-4 h-4 shrink-0" style={{ color: '#0F8B8D' }} />
                <span className="text-sm font-medium max-w-[200px] truncate" style={{ color: '#0F8B8D' }}>
                  {selectedHospitalObj.name}
                </span>
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm font-medium text-gray-500">Todos los hospitales</span>
              </>
            )}
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showHospitalMenu && (
            <div className="absolute left-0 top-full mt-1 min-w-[240px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 z-50">
              {/* All hospitals */}
              <button
                onClick={() => { setSelectedHospitalObj(null); setShowHospitalMenu(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                  !selectedHospitalObj ? 'border-l-2 border-teal-500' : 'border-l-2 border-transparent'
                }`}
              >
                <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                <span
                  className={!selectedHospitalObj ? 'font-semibold' : 'text-gray-700'}
                  style={!selectedHospitalObj ? { color: '#0F8B8D' } : {}}
                >
                  Todos los hospitales
                </span>
              </button>

              {hospitals.length > 0 && <div className="border-t border-gray-100 my-1" />}

              {hospitals.map((h) => (
                <button
                  key={h.id}
                  onClick={() => { setSelectedHospitalObj(h); setShowHospitalMenu(false); }}
                  className={`w-full flex items-start space-x-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                    selectedHospitalObj?.id === h.id ? 'border-l-2 border-teal-500' : 'border-l-2 border-transparent'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <div className="text-left">
                    <div
                      className={selectedHospitalObj?.id === h.id ? 'font-semibold' : 'text-gray-700'}
                      style={selectedHospitalObj?.id === h.id ? { color: '#0F8B8D' } : {}}
                    >
                      {h.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{h.city}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          </div>
        </div>{/* End left section */}

        {/* Mobile: Infectus branding (hidden on desktop) */}
        <div className="lg:hidden flex items-center space-x-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#0B3C5D' }}
          >
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base" style={{ color: '#0B3C5D' }}>Infectus</span>
        </div>

        {/* Right — date range pills (desktop only) + bell + user avatar */}
        <div className="flex items-center space-x-2 lg:space-x-3">
          {/* Date range pill group — desktop only */}
          <div className="hidden lg:flex items-center bg-gray-100 rounded-lg p-0.5">
            {(['1m', '6m', '12m', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  dateRange === r ? 'text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
                style={dateRange === r ? { backgroundColor: '#0F8B8D' } : {}}
              >
                {DATE_RANGE_LABELS[r]}
              </button>
            ))}
          </div>

          {/* Bell icon — alerts shortcut */}
          <button
            onClick={() => navigate('/alertas')}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Ver alertas"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts > 0 && (
              <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                {unreadAlerts > 9 ? '9+' : unreadAlerts}
              </span>
            )}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* User profile with dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="flex items-center space-x-2 lg:space-x-3 px-2 lg:px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors min-h-[44px]"
            >
              {/* Name and role — desktop only */}
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{displayName}</span>
                {roleKey && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${displayRoleCls}`}>
                    {displayRoleLabel}
                  </span>
                )}
              </div>
              <div
                className="w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                style={{ backgroundColor: '#0F8B8D' }}
              >
                {initials}
              </div>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-14 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 z-50">
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Mi perfil
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); onStartTour?.(); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <PlayCircle className="w-4 h-4 shrink-0" style={{ color: '#0F8B8D' }} />
                    Ver tour de bienvenida
                  </button>
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSigningOut && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                    {isSigningOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
