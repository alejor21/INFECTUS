import { useNavigate } from 'react-router';
import { Activity, BarChart3, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function Launcher() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const roleCapitalized = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex flex-col">
      {/* Top Section */}
      <div className="flex flex-col items-center pt-10 pb-6 md:pt-16 md:pb-12">
        <div className="flex items-center gap-3">
          <Activity className="w-10 h-10 text-teal-600" />
          <span className="text-4xl font-bold text-teal-600">Infectus</span>
        </div>
        <p className="text-gray-400 text-sm tracking-wider uppercase mt-2">
          Sistema Integrado de Gestión Hospitalaria PROA
        </p>
        <h1 className="text-2xl font-semibold text-gray-700 mt-6">
          Hola, {profile?.full_name ?? 'Usuario'} 👋
        </h1>
        {roleCapitalized && (
          <span className="bg-teal-100 text-teal-700 text-xs font-medium px-3 py-1 rounded-full mt-2">
            {roleCapitalized}
          </span>
        )}
      </div>

      {/* Module Selector */}
      <div className="flex flex-col items-center mt-12">
        <p className="text-xs text-gray-400 uppercase tracking-widest text-center mb-10">
          ¿A qué módulo deseas ingresar?
        </p>
        <div className="flex flex-col gap-6 justify-center items-center md:flex-row md:gap-8 flex-wrap">
          {/* Card 1 — Analytics PROA */}
          <div
            className="flex flex-col items-center gap-4 cursor-pointer group"
            onClick={() => navigate('/dashboard')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') navigate('/dashboard');
            }}
            aria-label="Ingresar a Analytics PROA"
          >
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white shadow-lg border-2 border-transparent group-hover:border-teal-400 group-hover:shadow-xl group-hover:shadow-teal-100 transition-all duration-300 flex items-center justify-center">
              <BarChart3 className="w-14 h-14 text-teal-500 group-hover:text-teal-600 group-hover:scale-110 transition-all duration-300" />
            </div>
            <span className="text-base font-semibold text-gray-700 group-hover:text-teal-600 transition-colors">
              Analytics PROA
            </span>
            <span className="text-xs text-gray-400">Dashboard · Reportes · IA</span>
          </div>

          {/* Card 2 — Evaluación PROA */}
          <div
            className="flex flex-col items-center gap-4 cursor-pointer group"
            onClick={() => navigate('/evaluacion')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') navigate('/evaluacion');
            }}
            aria-label="Ingresar a Evaluación PROA"
          >
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white shadow-lg border-2 border-transparent group-hover:border-indigo-400 group-hover:shadow-xl group-hover:shadow-indigo-100 transition-all duration-300 flex items-center justify-center">
              <ClipboardCheck className="w-14 h-14 text-indigo-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all duration-300" />
            </div>
            <span className="text-base font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors">
              Evaluación PROA
            </span>
            <span className="text-xs text-gray-400">Kanban · Instituciones · Formularios · IAS · Reportes</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-300 text-center mt-16 pb-8">
        v1.0.2 • © 2026 Infectus
      </p>
    </div>
  );
}
