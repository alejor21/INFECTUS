import { useState, useRef, useEffect } from 'react';
import { ClipboardCheck, Globe, Building2, Home, ChevronDown, Menu, LogOut, Loader2, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import { signOut } from '../../../lib/supabase/auth';
import type { Hospital } from '../../../lib/supabase/hospitals';
import { useTheme } from '../../../contexts/ThemeContext';

interface EvaluacionNavbarProps {
  hospitals: Hospital[];
  selectedHospitalId: string | null;
  onHospitalChange: (id: string | null) => void;
  onMenuOpen?: () => void;
}

export function EvaluacionNavbar({
  hospitals,
  selectedHospitalId,
  onHospitalChange,
  onMenuOpen,
}: EvaluacionNavbarProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId) ?? null;

  const displayName = profile?.full_name ?? '—';
  const displayRole = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : '—';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

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

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shrink-0 z-20">
      {/* Left: hamburger (mobile) + brand */}
      <div className="flex items-center gap-2.5">
        {onMenuOpen && (
          <button
            onClick={onMenuOpen}
            className="md:hidden text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <ClipboardCheck className="w-6 h-6 text-indigo-600 shrink-0" />
        <span className="text-xl font-bold text-indigo-600">Evaluación PROA</span>
      </div>

      {/* Center: hospital selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors min-h-[44px]"
        >
          {selectedHospital ? (
            <>
              <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="text-sm font-medium text-indigo-600 max-w-[200px] truncate">
                {selectedHospital.name}
              </span>
            </>
          ) : (
            <>
              <Globe className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm font-medium text-gray-500">
                Seleccionar hospital
              </span>
            </>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        </button>

        {showDropdown && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 min-w-[260px] bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
            <button
              onClick={() => {
                onHospitalChange(null);
                setShowDropdown(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                !selectedHospitalId
                  ? 'border-l-2 border-indigo-500'
                  : 'border-l-2 border-transparent'
              }`}
            >
              <Globe className="w-4 h-4 text-gray-400 shrink-0" />
              <span
                className={
                  !selectedHospitalId ? 'font-semibold text-indigo-600' : 'text-gray-700'
                }
              >
                Todos los hospitales
              </span>
            </button>

            {hospitals.length > 0 && <div className="border-t border-gray-100 my-1" />}

            {hospitals.map((h) => (
              <button
                key={h.id}
                onClick={() => {
                  onHospitalChange(h.id);
                  setShowDropdown(false);
                }}
                className={`w-full flex items-start gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                  selectedHospitalId === h.id
                    ? 'border-l-2 border-indigo-500'
                    : 'border-l-2 border-transparent'
                }`}
              >
                <Building2 className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <div className="text-left">
                  <div
                    className={
                      selectedHospitalId === h.id
                        ? 'font-semibold text-indigo-600'
                        : 'text-gray-700'
                    }
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

      {/* Right: user info + Theme toggle + Home + Logout */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{displayName}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{displayRole}</span>
        </div>
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 min-h-[44px] min-w-[44px]"
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors min-h-[44px] min-w-[44px]"
          title="Volver al inicio"
          aria-label="Volver al inicio"
        >
          <Home className="w-5 h-5" />
        </button>
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors min-h-[44px] min-w-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          {isSigningOut ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <LogOut className="w-5 h-5" />
          )}
        </button>
      </div>
    </header>
  );
}
