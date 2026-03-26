import { useEffect, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router';
import { toast } from 'sonner';
import {
  Activity,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Loader2,
  Check,
  Mail,
  Lock,
  BarChart3,
  FileSpreadsheet,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { sendPasswordReset, signIn, signUp } from '../../lib/supabase/auth';

type Mode = 'login' | 'register' | 'reset';

const REMEMBER_KEY = 'infectus-remembered-email';

const INPUT_CLASSNAME =
  'w-full rounded-xl border border-gray-300 bg-white py-3 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500';

export function Login() {
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'medico' | 'visor'>('medico');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_KEY);
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Validando sesión...</p>
        </div>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  function resetTransientState() {
    setPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setAuthError('');
    setResetSent(false);
    setRegisterSuccess(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSelectedRole('medico');
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    resetTransientState();
  }

  function normalizeErrorMessage(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
    if (lower.includes('email not confirmed')) return 'Debes confirmar tu correo antes de iniciar sesión.';
    if (lower.includes('user already registered')) return 'Ese correo ya está registrado.';
    return message;
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setAuthError('');

    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, email.trim().toLowerCase());
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      const { error } = await signIn(email, password);

      if (error) {
        const message = normalizeErrorMessage(error.message);
        setAuthError(message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError('');

    if (password.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }

    setPasswordError('');
    setLoading(true);

    try {
      await signUp(email, password, fullName, selectedRole);
      setRegisterSuccess(true);
      toast.success('Cuenta creada. Revisa tu correo para confirmarla.');
      window.setTimeout(() => switchMode('login'), 3000);
    } catch (errorValue: unknown) {
      const message = errorValue instanceof Error ? normalizeErrorMessage(errorValue.message) : 'No se pudo crear la cuenta.';
      setAuthError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setAuthError('');

    try {
      const { error } = await sendPasswordReset(email, `${window.location.origin}/reset-password`);

      if (error) {
        const message = normalizeErrorMessage(error.message);
        setAuthError(message);
        toast.error(message);
      } else {
        setResetSent(true);
        toast.success('Enlace de recuperación enviado.');
      }
    } finally {
      setLoading(false);
    }
  }

  const features = [
    {
      icon: BarChart3,
      title: 'Analíticas automáticas desde tu Excel PROA',
      description: 'Genera métricas y tendencias en segundos.',
    },
    {
      icon: FileSpreadsheet,
      title: 'Registro digital de evaluaciones',
      description: 'Centraliza el seguimiento del programa PROA.',
    },
    {
      icon: Users,
      title: 'Reportes para todo tu equipo médico',
      description: 'Comparte hallazgos con rapidez y contexto clínico.',
    },
  ];

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-teal-800 via-teal-700 to-teal-600 lg:flex lg:w-[60%]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white" />
          <div className="absolute bottom-0 right-0 h-[420px] w-[420px] translate-x-1/4 translate-y-1/4 rounded-full bg-white" />
        </div>

        <div className="relative z-10 flex w-full flex-col justify-center px-12 py-12 lg:px-20">
          <div className="mb-12 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">INFECTUS</span>
          </div>

          <h1 className="mb-4 text-4xl font-bold leading-tight text-white lg:text-5xl">
            Optimiza el uso de antimicrobianos en tu institución
          </h1>
          <p className="mb-12 max-w-md text-lg text-white/80">
            Centraliza evaluaciones, analíticas y reportes del programa PROA en un solo lugar.
          </p>

          <div className="space-y-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-white/70">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col bg-white dark:bg-gray-950">
        <div className="absolute right-4 top-4">
          <button
            onClick={toggleTheme}
            className="rounded-xl bg-gray-100 p-2.5 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 pb-4 pt-8 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">INFECTUS</span>
        </div>

        <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {mode === 'login' && 'Bienvenido de vuelta'}
                {mode === 'register' && 'Crear cuenta'}
                {mode === 'reset' && 'Recuperar contraseña'}
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {mode === 'login' && 'Ingresa tus credenciales para continuar'}
                {mode === 'register' && 'Crea tu cuenta para comenzar'}
                {mode === 'reset' && 'Te enviaremos un enlace para restablecer tu acceso'}
              </p>
            </div>

            {authError && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                {authError}
              </div>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Correo electrónico</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setAuthError('');
                      }}
                      required
                      placeholder="tu@hospital.com"
                      className={`${INPUT_CLASSNAME} pl-11 pr-4`}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setAuthError('');
                      }}
                      required
                      placeholder="••••••••"
                      className={`${INPUT_CLASSNAME} pl-11 pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      tabIndex={-1}
                      className="absolute right-3.5 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center p-2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    Recordar correo
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-sm font-medium text-teal-600 transition-colors hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-teal-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </button>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  ¿No tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="font-semibold text-teal-600 transition-colors hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                  >
                    Regístrate aquí
                  </button>
                </p>
              </form>
            )}

            {mode === 'register' && (
              <>
                {registerSuccess ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Cuenta creada</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Revisa tu correo para confirmar tu acceso.</p>
                    <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">Volviendo al inicio de sesión...</p>
                  </div>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre completo</label>
                      <input
                        type="text"
                        autoComplete="name"
                        value={fullName}
                        onChange={(event) => {
                          setFullName(event.target.value);
                          setAuthError('');
                        }}
                        required
                        placeholder="Dra. Ana García"
                        className={`${INPUT_CLASSNAME} px-4`}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de acceso</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedRole('medico')}
                          className={`rounded-xl border-2 p-4 text-left transition-all ${
                            selectedRole === 'medico'
                              ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50'
                              : 'border-gray-200 hover:border-teal-300 dark:border-gray-700'
                          }`}
                        >
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Médico</p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Registro y consulta</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRole('visor')}
                          className={`rounded-xl border-2 p-4 text-left transition-all ${
                            selectedRole === 'visor'
                              ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50'
                              : 'border-gray-200 hover:border-teal-300 dark:border-gray-700'
                          }`}
                        >
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Visor</p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Solo lectura</p>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Correo electrónico</label>
                      <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setAuthError('');
                        }}
                        required
                        placeholder="tu@hospital.com"
                        className={`${INPUT_CLASSNAME} px-4`}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={password}
                          onChange={(event) => {
                            setPassword(event.target.value);
                            setPasswordError('');
                            setAuthError('');
                          }}
                          required
                          placeholder="Mínimo 8 caracteres"
                          className={`${INPUT_CLASSNAME} px-4 pr-12`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          tabIndex={-1}
                          className="absolute right-3.5 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center p-2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar contraseña</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(event) => {
                            setConfirmPassword(event.target.value);
                            setPasswordError('');
                            setAuthError('');
                          }}
                          required
                          placeholder="••••••••"
                          className={`${INPUT_CLASSNAME} px-4 pr-12`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((value) => !value)}
                          tabIndex={-1}
                          className="absolute right-3.5 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center p-2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                          aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {passwordError && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{passwordError}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-teal-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>

                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="w-full py-2 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Volver al inicio de sesión
                    </button>
                  </form>
                )}
              </>
            )}

            {mode === 'reset' && (
              <>
                {resetSent ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Enlace enviado</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Revisa tu bandeja de entrada en <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>.
                    </p>
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="mt-6 text-sm font-medium text-teal-600 transition-colors hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                    >
                      Volver al inicio de sesión
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleReset} className="space-y-5">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Correo electrónico</label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(event) => {
                            setEmail(event.target.value);
                            setAuthError('');
                          }}
                          required
                          placeholder="tu@hospital.com"
                          className={`${INPUT_CLASSNAME} pl-11 pr-4`}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-teal-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                    </button>

                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="w-full py-2 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Volver al inicio de sesión
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>

        <div className="py-4 text-center text-xs text-gray-400 dark:text-gray-600">
          INFECTUS PROA · Sistema de Optimización de Antimicrobianos
        </div>
      </div>
    </div>
  );
}
