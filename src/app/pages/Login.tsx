import { useState, useEffect } from 'react';
import { Navigate } from 'react-router';
import { toast } from 'sonner';
import { Activity, Eye, EyeOff, Sun, Moon, Loader2, Check, Mail, Lock, BarChart3, FileSpreadsheet, Users } from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

type Mode = 'login' | 'register' | 'reset';

const REMEMBER_KEY = 'infectus-remembered-email';

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

  // ─── Render ─────────────────────────────────────────────────────────────────

  const features = [
    {
      icon: BarChart3,
      title: 'Analíticas automáticas',
      description: 'Genera métricas desde tu Excel en segundos',
    },
    {
      icon: FileSpreadsheet,
      title: 'Gestión del Programa PROA',
      description: 'Evaluaciones y seguimiento integral',
    },
    {
      icon: Users,
      title: 'Reportes para tu equipo',
      description: 'Comparte insights con todo el personal médico',
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/4 translate-y-1/4" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-20 py-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">INFECTUS</span>
          </div>

          {/* Tagline */}
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            Optimiza el uso de<br />antimicrobianos
          </h1>
          <p className="text-lg text-white/80 mb-12 max-w-md">
            La plataforma líder para programas PROA en hospitales colombianos
          </p>

          {/* Features */}
          <div className="space-y-6">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-white" />
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

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-950">
        {/* Theme toggle - top right */}
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-center gap-3 pt-8 pb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">INFECTUS</span>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {mode === 'login' && 'Bienvenido de vuelta'}
                {mode === 'register' && 'Crear cuenta'}
                {mode === 'reset' && 'Recuperar contraseña'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {mode === 'login' && 'Ingresa tus credenciales para continuar'}
                {mode === 'register' && 'Crea tu cuenta para comenzar'}
                {mode === 'reset' && 'Te enviaremos un enlace de recuperación'}
              </p>
            </div>

            {/* ── LOGIN FORM ── */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="tu@hospital.com"
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-3 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    Recordar sesión
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </button>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  ¿No tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="text-teal-600 dark:text-teal-400 font-semibold hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
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
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      ¡Cuenta creada!
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Revisa tu correo para confirmar tu cuenta.
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                      Redirigiendo al inicio de sesión...
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="Dr. Juan García"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Tipo de acceso
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedRole('medico')}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            selectedRole === 'medico'
                              ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50'
                              : 'border-gray-200 dark:border-gray-700 hover:border-teal-300'
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
                              ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50'
                              : 'border-gray-200 dark:border-gray-700 hover:border-teal-300'
                          }`}
                        >
                          <span className="text-2xl">👁️</span>
                          <p className="font-semibold text-sm mt-1 text-gray-900 dark:text-white">Visitante</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Solo lectura</p>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="tu@hospital.com"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                          required
                          placeholder="Mínimo 8 caracteres"
                          className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          tabIndex={-1}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Confirmar contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                          required
                          placeholder="••••••••"
                          className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          tabIndex={-1}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {passwordError && (
                        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{passwordError}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors py-2"
                    >
                      ← Volver al inicio de sesión
                    </button>
                  </form>
                )}
              </>
            )}

            {/* ── RESET PASSWORD FORM ── */}
            {mode === 'reset' && (
              <>
                {resetSent ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Enlace enviado
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Revisa tu bandeja de entrada en <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="mt-6 text-sm text-teal-600 dark:text-teal-400 font-medium hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                    >
                      ← Volver al inicio de sesión
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleReset} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Correo electrónico
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                          <Mail className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="tu@hospital.com"
                          className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors py-2"
                    >
                      ← Volver al inicio de sesión
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="py-4 text-center text-xs text-gray-400 dark:text-gray-600">
          INFECTUS PROA · Sistema de Optimización de Antimicrobianos
        </div>
      </div>
    </div>
  );
}
