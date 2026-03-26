import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  ClipboardCheck,
  Calendar,
  Shield,
  FileSpreadsheet,
  Building2,
  BarChart3,
  AlertTriangle,
  Calculator,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useHospitalContext } from '../../contexts/HospitalContext';
import { getSupabaseClient } from '../../lib/supabase/client';
import { WelcomeModal, shouldShowWelcome } from '../components/WelcomeModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  evalCount: number;
  lastEval: { created_at: string; status: string } | null;
  proaLevel: string | null;
  excelMonths: number;
  recentEvals: RecentEval[];
}

interface RecentEval {
  id: string;
  hospital_name: string | null;
  status: string;
  created_at: string;
  progress_pct: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return `Buenos días, ${name} 👋`;
  if (hour >= 12 && hour < 18) return `Buenas tardes, ${name} 👋`;
  return `Buenas noches, ${name} 👋`;
}

function relativeDate(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return `Hace ${Math.floor(diffDays / 30)} meses`;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  borrador: {
    label: 'Borrador',
    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  completada: {
    label: 'Completada',
    cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  archivada: {
    label: 'Archivada',
    cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  },
};

const LEVEL_BADGE: Record<string, { label: string; cls: string; iconCls: string }> = {
  avanzado: {
    label: 'Avanzado',
    cls: 'text-green-600 dark:text-green-400',
    iconCls: 'text-green-500',
  },
  basico: {
    label: 'Básico',
    cls: 'text-yellow-600 dark:text-yellow-400',
    iconCls: 'text-yellow-500',
  },
  inadecuado: {
    label: 'Inadecuado',
    cls: 'text-red-600 dark:text-red-400',
    iconCls: 'text-red-500',
  },
};

// ─── Module explanation data ──────────────────────────────────────────────────

interface ModuleCard {
  Icon: React.ComponentType<{ className?: string }>;
  iconCls: string;
  bgCls: string;
  title: string;
  desc: string;
}

const MODULE_CARDS: ModuleCard[] = [
  {
    Icon: ClipboardCheck,
    iconCls: 'text-teal-500',
    bgCls: 'bg-teal-50 dark:bg-teal-900/20',
    title: 'Evaluación PROA',
    desc: 'Responde 61 preguntas organizadas en categorías. Puedes subir documentos como evidencia. Al finalizar obtienes un puntaje y nivel (Avanzado/Básico/Inadecuado) con recomendaciones automáticas.',
  },
  {
    Icon: FileSpreadsheet,
    iconCls: 'text-emerald-500',
    bgCls: 'bg-emerald-50 dark:bg-emerald-900/20',
    title: 'Carga de Excel',
    desc: 'Sube un Excel con tus datos de intervenciones. Infectus detecta automáticamente los meses y extrae métricas: top antibióticos, microorganismos, servicios y más.',
  },
  {
    Icon: BarChart3,
    iconCls: 'text-blue-500',
    bgCls: 'bg-blue-50 dark:bg-blue-900/20',
    title: 'Analíticas con IA',
    desc: 'Usa inteligencia artificial para analizar tus datos mes a mes. Obtén resúmenes ejecutivos, alertas y recomendaciones basadas en evidencia clínica.',
  },
  {
    Icon: Shield,
    iconCls: 'text-violet-500',
    bgCls: 'bg-violet-50 dark:bg-violet-900/20',
    title: 'Indicadores PROA',
    desc: 'Monitorea los indicadores clave del programa: consumo de antibióticos, tasa de adherencia a guías, porcentaje de cultivos previos al antibiótico.',
  },
  {
    Icon: FileText,
    iconCls: 'text-rose-500',
    bgCls: 'bg-rose-50 dark:bg-rose-900/20',
    title: 'Reportes PDF',
    desc: 'Exporta evaluaciones y analíticas en formato PDF profesional para compartir con la dirección médica o entes reguladores.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { selectedHospitalObj } = useHospitalContext();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // Show welcome modal only once per user — never again after dismissed
  useEffect(() => {
    const id = profile?.id;
    if (id && shouldShowWelcome(id)) {
      setShowWelcome(true);
    }
  }, [profile?.id]);

  const loadStats = useCallback(async (hospitalId: string) => {
    setDataLoading(true);
    try {
      const supabase = getSupabaseClient();

      const [
        { count: evalCount },
        { data: lastEvalRaw },
        { data: proaRaw },
        { count: excelCount },
        { data: recentRaw },
      ] = await Promise.all([
        supabase
          .from('evaluaciones')
          .select('*', { count: 'exact', head: true })
          .eq('hospital_id', hospitalId),
        supabase
          .from('evaluaciones')
          .select('created_at, status')
          .eq('hospital_id', hospitalId)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('proa_evaluations')
          .select('level')
          .eq('hospital_id', hospitalId)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('hospital_monthly_metrics')
          .select('*', { count: 'exact', head: true })
          .eq('hospital_id', hospitalId),
        supabase
          .from('evaluaciones')
          .select('id, hospital_name, status, created_at, progress_pct')
          .eq('hospital_id', hospitalId)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const lastEvalRow = (lastEvalRaw as Record<string, unknown>[] | null)?.[0];
      const proaRow = (proaRaw as Record<string, unknown>[] | null)?.[0];

      const recentEvals: RecentEval[] = (
        (recentRaw as Record<string, unknown>[] | null) ?? []
      ).map((row) => ({
        id: row.id as string,
        hospital_name: (row.hospital_name ?? null) as string | null,
        status: row.status as string,
        created_at: row.created_at as string,
        progress_pct: row.progress_pct != null ? Number(row.progress_pct) : null,
      }));

      setStats({
        evalCount: evalCount ?? 0,
        lastEval: lastEvalRow
          ? {
              created_at: lastEvalRow.created_at as string,
              status: lastEvalRow.status as string,
            }
          : null,
        proaLevel: proaRow ? ((proaRow.level ?? null) as string | null) : null,
        excelMonths: excelCount ?? 0,
        recentEvals,
      });
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedHospitalObj) {
      setStats(null);
      setDataLoading(false);
      return;
    }
    void loadStats(selectedHospitalObj.id);
  }, [selectedHospitalObj, loadStats]);

  // ── Derived values ───────────────────────────────────────────────────────
  const hasHospital = !!selectedHospitalObj;
  const hasNoData =
    hasHospital && !dataLoading && stats !== null && stats.evalCount === 0 && stats.excelMonths === 0;

  const firstName = profile?.full_name?.split(' ')[0] || 'Doctor';

  const level = stats?.proaLevel ?? null;
  const levelConf = level !== null ? (LEVEL_BADGE[level] ?? null) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* Welcome modal — shown only on first login, never again */}
      {showWelcome && profile?.id && (
        <WelcomeModal
          userId={profile.id}
          onDismiss={() => setShowWelcome(false)}
        />
      )}

      {/* ─── SECTION 1 — WELCOME BANNER ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {getGreeting(firstName)}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {selectedHospitalObj 
              ? `${selectedHospitalObj.name} — aquí está el resumen de hoy`
              : 'Bienvenido a Infectus — tu plataforma PROA'
            }
          </p>
        </div>

        {hasHospital && (
          <button
            onClick={() => navigate('/evaluacion')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Nueva Evaluación
          </button>
        )}
      </div>

      {!hasHospital && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <span className="font-semibold">Selecciona un hospital</span> en el menú lateral
            para ver tus métricas personalizadas.
          </p>
        </div>
      )}

      {/* ─── SECTION 2 — KPI CARDS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1 — Evaluaciones */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-3">
            <ClipboardCheck className="w-5 h-5 text-teal-600" />
          </div>
          <p
            className={`text-3xl font-bold text-gray-900 dark:text-white ${
              dataLoading ? 'opacity-40 animate-pulse' : ''
            }`}
          >
            {dataLoading ? '—' : hasHospital ? String(stats?.evalCount ?? '—') : '—'}
          </p>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            Evaluaciones
          </p>
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 dark:text-gray-500">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400">Este mes</span>
          </div>
        </div>

        {/* Card 2 — Última evaluación */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <p
            className={`text-xl font-bold text-gray-900 dark:text-white leading-tight ${
              dataLoading ? 'opacity-40 animate-pulse' : ''
            }`}
          >
            {dataLoading
              ? '—'
              : hasHospital
                ? stats?.lastEval
                  ? relativeDate(stats.lastEval.created_at)
                  : 'Sin evaluaciones'
                : '—'}
          </p>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            Última evaluación
          </p>
          {hasHospital && stats?.lastEval && (
            <div className="mt-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[stats.lastEval.status]?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_BADGE[stats.lastEval.status]?.label ?? stats.lastEval.status}
              </span>
            </div>
          )}
        </div>

        {/* Card 3 — Nivel PROA */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center mb-3">
            <Shield
              className={`w-5 h-5 ${levelConf ? levelConf.iconCls : 'text-violet-600'}`}
            />
          </div>
          <p
            className={`text-2xl font-bold ${
              dataLoading
                ? 'opacity-40 animate-pulse text-gray-900 dark:text-white'
                : levelConf
                  ? levelConf.cls
                  : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {dataLoading
              ? '—'
              : hasHospital
                ? levelConf
                  ? levelConf.label
                  : 'Sin datos'
                : '—'}
          </p>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            Nivel PROA
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Última evaluación</p>
        </div>

        {/* Card 4 — Meses de datos Excel */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          </div>
          <p
            className={`text-3xl font-bold text-gray-900 dark:text-white ${
              dataLoading ? 'opacity-40 animate-pulse' : ''
            }`}
          >
            {dataLoading ? '—' : hasHospital ? String(stats?.excelMonths ?? '—') : '—'}
          </p>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            Meses cargados
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Datos desde Excel</p>
        </div>
      </div>

      {/* ─── SECTION 3 — GETTING STARTED (only when hospital selected but no data) */}
      {hasNoData && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            🚀 Empieza en 3 pasos
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Sigue esta guía para configurar tu programa PROA
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Step 1 */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 pt-7">
              <span className="absolute -top-3 left-5 w-7 h-7 bg-teal-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                1
              </span>
              <Building2 className="w-10 h-10 text-teal-500 mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Configura tu hospital
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                Asegúrate de tener tu hospital seleccionado arriba y que tenga la información
                completa: nombre, ciudad, número de camas.
              </p>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Completado
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 pt-7">
              <span className="absolute -top-3 left-5 w-7 h-7 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                2
              </span>
              <FileSpreadsheet className="w-10 h-10 text-emerald-500 mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Carga tus datos históricos
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                Sube un archivo Excel con los datos de intervenciones PROA. Puede contener
                múltiples meses — Infectus los detecta automáticamente.
              </p>
              <button
                onClick={() => navigate('/hospitales')}
                className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors"
              >
                Subir Excel →
              </button>
            </div>

            {/* Step 3 */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 pt-7">
              <span className="absolute -top-3 left-5 w-7 h-7 bg-violet-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                3
              </span>
              <ClipboardCheck className="w-10 h-10 text-violet-500 mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Realiza tu primera evaluación PROA
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                Evalúa tu programa usando los 61 criterios estandarizados. Puedes guardar como
                borrador y retomar cuando quieras.
              </p>
              <button
                onClick={() => navigate('/evaluacion')}
                className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors"
              >
                Nueva Evaluación →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SECTION 4 — QUICK ACTIONS ─────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

          <button
            onClick={() => navigate('/evaluacion')}
            className="group p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110">
              <ClipboardCheck className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Nueva Evaluación PROA
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Evalúa los 61 criterios del programa PROA
            </p>
          </button>

          <button
            onClick={() =>
              selectedHospitalObj
                ? navigate(`/hospitales/${selectedHospitalObj.id}/dashboard`)
                : navigate('/reportes')
            }
            className="group p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Ver Analíticas
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Métricas y tendencias de tu hospital
            </p>
          </button>

          <button
            onClick={() => navigate('/hospitales')}
            className="group p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110">
              <Building2 className="w-5 h-5 text-violet-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Gestionar Hospitales
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Agregar o configurar instituciones
            </p>
          </button>

          <button
            onClick={() => navigate('/evaluacion/ias')}
            className="group p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Registrar IAS
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Registrar infección asociada a atención
            </p>
          </button>

          <button
            onClick={() => navigate('/calculadora-ddd')}
            className="group p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110">
              <Calculator className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Calculadora DDD
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Calcular Dosis Diarias Definidas
            </p>
          </button>

          <button
            onClick={() => navigate('/reportes')}
            className="group p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110">
              <FileText className="w-5 h-5 text-rose-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Generar Reporte
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Exportar reportes en PDF
            </p>
          </button>
        </div>
      </div>

      {/* ─── SECTION 5 — HOW IT WORKS (collapsible) ────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <button
          onClick={() => setModulesOpen((v) => !v)}
          className="w-full flex items-center justify-between p-5 text-left min-h-[44px] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            📚 ¿Cómo funciona Infectus?
          </h2>
          {modulesOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
          )}
        </button>

        {modulesOpen && (
          <div className="border-t border-gray-100 dark:border-gray-800 px-5 pt-4 pb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {MODULE_CARDS.map((mod) => (
                <div key={mod.title} className="flex gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${mod.bgCls}`}
                  >
                    <mod.Icon className={`w-5 h-5 ${mod.iconCls}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {mod.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── SECTION 6 — RECENT ACTIVITY ───────────────────────────────────── */}
      {hasHospital && !dataLoading && stats && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Actividad reciente
          </h2>

          {stats.recentEvals.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <ClipboardCheck className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                No hay actividad reciente
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                ¡Crea tu primera evaluación para comenzar!
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
              {stats.recentEvals.map((ev) => {
                const statusConf = STATUS_BADGE[ev.status] ?? {
                  label: ev.status,
                  cls: 'bg-gray-100 text-gray-600',
                };
                return (
                  <button
                    key={ev.id}
                    onClick={() => navigate('/evaluacion')}
                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left min-h-[44px]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                      <ClipboardCheck className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        Evaluación PROA
                        {ev.hospital_name && (
                          <span className="text-gray-500 dark:text-gray-400 font-normal">
                            {' '}— {ev.hospital_name}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {relativeDate(ev.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusConf.cls}`}
                      >
                        {statusConf.label}
                      </span>
                      {ev.progress_pct != null && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {ev.progress_pct}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
