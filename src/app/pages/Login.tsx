import { useState, useEffect } from 'react';
import { Navigate } from 'react-router';
import { toast } from 'sonner';
import { Activity, Eye, EyeOff, Sun, Moon, Loader2, Check } from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

type Mode = 'login' | 'register' | 'reset';

const REMEMBER_KEY = 'infectus-remembered-email';

const INPUT_CLS =
  'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors';

const INPUT_PR_CLS =
  'w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors';

export function Login() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<Mode>('login');

  // Shared
  const [email, setEmail] = useState('');

  // Login
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Register
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'medico' | 'visor'>('medico');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Reset
  const [resetSent, setResetSent] = useState(false);

  const [loading, setLoading] = useState(false);

  // Pre-fill remembered email on mount
  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_KEY);
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  // Redirect authenticated users away from login
  if (user) return <Navigate to="/" replace />;

  function switchMode(m: Mode) {
    setMode(m);
    setPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setResetSent(false);
    setRegisterSuccess(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSelectedRole('medico');
  }

  // ─── Handlers ──────────────────────────────────────────────────────────────

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
    const { error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error('Correo o contraseña incorrectos');
    }
    // On success: onAuthStateChange fires → sets user → LoginRoute redirects
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    setPasswordError('');
    setLoading(true);
    const { error } = await getSupabaseClient().auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: selectedRole } },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setRegisterSuccess(true);
      setTimeout(() => switchMode('login'), 3000);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setResetSent(true);
    }
  }

  // ─── Small sub-components (inline to keep single file rule) ────────────────

  const LabelText = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {children}
    </label>
  );

  const EyeToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  const SubmitBtn = ({ label, loadingLabel }: { label: string; loadingLabel: string }) => (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 min-h-[44px] transition-colors"
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {loading ? loadingLabel : label}
    </button>
  );

  const BackBtn = () => (
    <button
      type="button"
      onClick={() => switchMode('login')}
      className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors py-2"
    >
      ← Volver al inicio de sesión
    </button>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  const modeTitle: Record<Mode, string> = {
    login: 'Bienvenido a Infectus',
    register: 'Crear cuenta',
    reset: 'Recuperar contraseña',
  };

  const modeSubtitle: Record<Mode, string> = {
    login: 'Inicia sesión para continuar',
    register: 'Crea tu cuenta de Infectus',
    reset: 'Te enviaremos un enlace de recuperación',
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Theme toggle — top-right corner */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-gray-800 shadow text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        aria-label="Cambiar tema"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Card */}
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
        {/* Logo + heading */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-3">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
            {modeTitle[mode]}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">
            {modeSubtitle[mode]}
          </p>
        </div>

        {/* ── LOGIN FORM ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <LabelText>Correo electrónico</LabelText>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@hospital.com"
                className={INPUT_CLS}
              />
            </div>

            <div>
              <LabelText>Contraseña</LabelText>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={INPUT_PR_CLS}
                />
                <EyeToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Recordar mi sesión
              </label>
              <button
                type="button"
                onClick={() => switchMode('reset')}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <SubmitBtn label="Iniciar sesión" loadingLabel="Iniciando..." />

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
              >
                Regístrate aquí
              </button>
            </p>
          </form>
        )}

        {/* ── REGISTER FORM ── */}
        {mode === 'register' && (
          <>
            {registerSuccess ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  ✅ Cuenta creada. Revisa tu correo para confirmar tu cuenta.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                  Redirigiendo al inicio de sesión...
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <LabelText>Nombre completo</LabelText>
                  <input
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Dr. Juan García"
                    className={INPUT_CLS}
                  />
                </div>

                <div>
                  <LabelText>Tipo de acceso</LabelText>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('medico')}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedRole === 'medico'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                      }`}
                    >
                      <span className="text-2xl">👨‍⚕️</span>
                      <p className="font-semibold text-sm mt-1 text-gray-900 dark:text-white">Médico</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Acceso completo</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('visor')}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedRole === 'visor'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                      }`}
                    >
                      <span className="text-2xl">👁️</span>
                      <p className="font-semibold text-sm mt-1 text-gray-900 dark:text-white">Visitante</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Solo lectura</p>
                    </button>
                  </div>
                </div>

                <div>
                  <LabelText>Correo electrónico</LabelText>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@hospital.com"
                    className={INPUT_CLS}
                  />
                </div>

                <div>
                  <LabelText>Contraseña</LabelText>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                      }}
                      required
                      placeholder="Mínimo 8 caracteres"
                      className={INPUT_PR_CLS}
                    />
                    <EyeToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                  </div>
                </div>

                <div>
                  <LabelText>Confirmar contraseña</LabelText>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordError('');
                      }}
                      required
                      placeholder="••••••••"
                      className={INPUT_PR_CLS}
                    />
                    <EyeToggle
                      show={showConfirmPassword}
                      onToggle={() => setShowConfirmPassword((v) => !v)}
                    />
                  </div>
                  {passwordError && (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{passwordError}</p>
                  )}
                </div>

                <SubmitBtn label="Crear cuenta" loadingLabel="Creando cuenta..." />
                <BackBtn />
              </form>
            )}
          </>
        )}

        {/* ── RESET PASSWORD FORM ── */}
        {mode === 'reset' && (
          <>
            {resetSent ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  ✅ Enlace enviado
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Te enviamos un enlace de recuperación a{' '}
                  <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>.
                  Revisa tu bandeja de entrada.
                </p>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  ← Volver al inicio de sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <LabelText>Correo electrónico</LabelText>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@hospital.com"
                    className={INPUT_CLS}
                  />
                </div>

                <SubmitBtn label="Enviar enlace de recuperación" loadingLabel="Enviando..." />
                <BackBtn />
              </form>
            )}
          </>
        )}
      </div>

      <p className="absolute bottom-4 text-center text-xs text-gray-400 dark:text-gray-600 w-full">
        Infectus PROA · Sistema de Optimización de Antimicrobianos
      </p>
    </div>
  );
}
