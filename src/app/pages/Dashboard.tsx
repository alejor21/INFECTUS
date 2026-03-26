import { useEffect, useState, type ComponentType } from 'react';
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
  Plus,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useHospitalContext } from '../../contexts/HospitalContext';
import { WelcomeModal, shouldShowWelcome } from '../components/WelcomeModal';
import { useDashboardStats } from '../../hooks/useDashboardStats';

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return `Buenos días, ${name}`;
  if (hour >= 12 && hour < 18) return `Buenas tardes, ${name}`;
  return `Buenas noches, ${name}`;
}

function relativeDate(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (diffDays <= 0) return 'Hoy';
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

interface ModuleCard {
  Icon: ComponentType<{ className?: string }>;
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
    desc: 'Responde los criterios del programa, guarda borradores y obtén un nivel con recomendaciones automáticas.',
  },
  {
    Icon: FileSpreadsheet,
    iconCls: 'text-emerald-500',
    bgCls: 'bg-emerald-50 dark:bg-emerald-900/20',
    title: 'Carga de Excel',
    desc: 'Sube tus intervenciones y deja que Infectus detecte meses, servicios y métricas sin reprocesar manualmente.',
  },
  {
    Icon: BarChart3,
    iconCls: 'text-blue-500',
    bgCls: 'bg-blue-50 dark:bg-blue-900/20',
    title: 'Analíticas',
    desc: 'Consulta tendencias, cumplimiento y uso de antimicrobianos por periodo, servicio y tipo de intervención.',
  },
  {
    Icon: Shield,
    iconCls: 'text-violet-500',
    bgCls: 'bg-violet-50 dark:bg-violet-900/20',
    title: 'Indicadores PROA',
    desc: 'Monitorea adherencia terapéutica, cultivos previos y otros indicadores clave del programa.',
  },
  {
    Icon: FileText,
    iconCls: 'text-rose-500',
    bgCls: 'bg-rose-50 dark:bg-rose-900/20',
    title: 'Reportes',
    desc: 'Exporta información lista para compartir con comités clínicos, dirección médica o auditorías internas.',
  },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { selectedHospitalObj } = useHospitalContext();
  const { stats, loading: dataLoading, error, refresh } = useDashboardStats(selectedHospitalObj?.id ?? null);

  const [modulesOpen, setModulesOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const id = profile?.id;
    if (id && shouldShowWelcome(id)) {
      setShowWelcome(true);
    }
  }, [profile?.id]);

  const hasHospital = !!selectedHospitalObj;
  const hasNoData = hasHospital && !dataLoading && !error && stats !== null && stats.evalCount === 0 && stats.excelMonths === 0;
  const firstName = profile?.full_name?.split(' ')[0] || 'Doctor';
  const level = stats?.proaLevel ?? null;
  const levelConf = level ? (LEVEL_BADGE[level] ?? null) : null;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      {showWelcome && profile?.id && <WelcomeModal userId={profile.id} onDismiss={() => setShowWelcome(false)} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {getGreeting(firstName)}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {selectedHospitalObj
              ? `${selectedHospitalObj.name} · aquí está el resumen de hoy`
              : 'Bienvenido a Infectus · selecciona un hospital para empezar'}
          </p>
        </div>

        {hasHospital && (
          <button
            onClick={() => navigate('/evaluacion')}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-teal-700 hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            Nueva evaluación
          </button>
        )}
      </div>

      {!hasHospital && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-900/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <span className="font-semibold">Primero selecciona un hospital</span> desde el menú lateral para ver tus métricas y actividad.
          </p>
        </div>
      )}

      {hasHospital && error && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">No se pudo cargar el dashboard</p>
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
          <button
            onClick={() => void refresh()}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-900/40"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/30">
            <ClipboardCheck className="h-5 w-5 text-teal-600" />
          </div>
          <p className={`text-3xl font-bold text-gray-900 dark:text-white ${dataLoading ? 'animate-pulse opacity-40' : ''}`}>
            {dataLoading ? '—' : hasHospital ? String(stats?.evalCount ?? '—') : '—'}
          </p>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">Evaluaciones</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400">Este mes</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <p className={`text-xl font-bold leading-tight text-gray-900 dark:text-white ${dataLoading ? 'animate-pulse opacity-40' : ''}`}>
            {dataLoading ? '—' : hasHospital ? (stats?.lastEval ? relativeDate(stats.lastEval.created_at) : 'Sin evaluaciones') : '—'}
          </p>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">Última evaluación</p>
          {hasHospital && stats?.lastEval && (
            <div className="mt-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[stats.lastEval.status]?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_BADGE[stats.lastEval.status]?.label ?? stats.lastEval.status}
              </span>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/30">
            <Shield className={`h-5 w-5 ${levelConf ? levelConf.iconCls : 'text-violet-600'}`} />
          </div>
          <p
            className={`text-2xl font-bold ${
              dataLoading
                ? 'animate-pulse text-gray-900 opacity-40 dark:text-white'
                : levelConf
                  ? levelConf.cls
                  : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {dataLoading ? '—' : hasHospital ? (levelConf ? levelConf.label : 'Sin datos') : '—'}
          </p>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">Nivel PROA</p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Última evaluación</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
          </div>
          <p className={`text-3xl font-bold text-gray-900 dark:text-white ${dataLoading ? 'animate-pulse opacity-40' : ''}`}>
            {dataLoading ? '—' : hasHospital ? String(stats?.excelMonths ?? '—') : '—'}
          </p>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">Meses cargados</p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Datos desde Excel</p>
        </div>
      </div>

      {hasNoData && (
        <div>
          <h2 className="mb-1 text-xl font-semibold text-gray-900 dark:text-white">Empieza en 3 pasos</h2>
          <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">Sigue esta guía para configurar tu programa PROA.</p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="relative rounded-2xl border border-gray-200 bg-white p-5 pt-7 dark:border-gray-800 dark:bg-gray-900">
              <span className="absolute -top-3 left-5 flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white shadow-sm">
                1
              </span>
              <Building2 className="mb-3 h-10 w-10 text-teal-500" />
              <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">Configura tu hospital</h3>
              <p className="mb-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Asegúrate de tener completa la información principal del hospital antes de empezar a registrar datos.
              </p>
              <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Completado
              </div>
            </div>

            <div className="relative rounded-2xl border border-gray-200 bg-white p-5 pt-7 dark:border-gray-800 dark:bg-gray-900">
              <span className="absolute -top-3 left-5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-sm">
                2
              </span>
              <FileSpreadsheet className="mb-3 h-10 w-10 text-emerald-500" />
              <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">Carga tus datos históricos</h3>
              <p className="mb-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Sube un archivo Excel con las intervenciones PROA para generar analíticas y seguimiento por periodo.
              </p>
              <button
                onClick={() => navigate('/hospitales')}
                className="text-sm font-medium text-teal-600 transition-colors hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
              >
                Subir Excel →
              </button>
            </div>

            <div className="relative rounded-2xl border border-gray-200 bg-white p-5 pt-7 dark:border-gray-800 dark:bg-gray-900">
              <span className="absolute -top-3 left-5 flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white shadow-sm">
                3
              </span>
              <ClipboardCheck className="mb-3 h-10 w-10 text-violet-500" />
              <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">Realiza tu primera evaluación</h3>
              <p className="mb-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Registra tu evaluación PROA y continúa el seguimiento desde el listado de evaluaciones.
              </p>
              <button
                onClick={() => navigate('/evaluacion')}
                className="text-sm font-medium text-teal-600 transition-colors hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
              >
                Nueva evaluación →
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Acciones rápidas</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <button
            onClick={() => navigate('/evaluacion')}
            className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-teal-700"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 transition-transform duration-200 group-hover:scale-110 dark:bg-teal-900/30">
              <ClipboardCheck className="h-5 w-5 text-teal-600" />
            </div>
            <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">Nueva evaluación PROA</p>
            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">Registra una evaluación del programa.</p>
          </button>

          <button
            onClick={() => (selectedHospitalObj ? navigate(`/hospitales/${selectedHospitalObj.id}/dashboard`) : navigate('/reportes'))}
            className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 transition-transform duration-200 group-hover:scale-110 dark:bg-blue-900/30">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">Ver analíticas</p>
            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">Consulta tendencias y métricas del hospital.</p>
          </button>

          <button
            onClick={() => navigate('/hospitales')}
            className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-violet-700"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 transition-transform duration-200 group-hover:scale-110 dark:bg-violet-900/30">
              <Building2 className="h-5 w-5 text-violet-600" />
            </div>
            <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">Gestionar hospitales</p>
            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">Agrega, edita o revisa instituciones.</p>
          </button>

          <button
            onClick={() => navigate('/evaluacion/ias')}
            className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-amber-700"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 transition-transform duration-200 group-hover:scale-110 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">Registrar IAAS</p>
            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">Registra infecciones asociadas a la atención.</p>
          </button>

          <button
            onClick={() => navigate('/calculadora-ddd')}
            className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-700"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 transition-transform duration-200 group-hover:scale-110 dark:bg-emerald-900/30">
              <Calculator className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">Calculadora DDD</p>
            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">Apoya cálculos manuales de dosis definidas.</p>
          </button>

          <button
            onClick={() => navigate('/reportes')}
            className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-rose-700"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 transition-transform duration-200 group-hover:scale-110 dark:bg-rose-900/30">
              <FileText className="h-5 w-5 text-rose-600" />
            </div>
            <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">Generar reporte</p>
            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">Exporta reportes en PDF.</p>
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <button
          onClick={() => setModulesOpen((value) => !value)}
          className="flex min-h-[44px] w-full items-center justify-between p-5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">¿Cómo funciona Infectus?</h2>
          {modulesOpen ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-gray-400" />
          )}
        </button>

        {modulesOpen && (
          <div className="border-t border-gray-100 px-5 pb-5 pt-4 dark:border-gray-800">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {MODULE_CARDS.map((moduleCard) => (
                <div key={moduleCard.title} className="flex gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${moduleCard.bgCls}`}>
                    <moduleCard.Icon className={`h-5 w-5 ${moduleCard.iconCls}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{moduleCard.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{moduleCard.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {hasHospital && !dataLoading && stats && (
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Actividad reciente</h2>

          {stats.recentEvals.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                <ClipboardCheck className="h-8 w-8 text-gray-400" />
              </div>
              <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">No hay actividad reciente</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Crea tu primera evaluación para comenzar.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:divide-gray-800">
              {stats.recentEvals.map((evaluation) => {
                const statusConf = STATUS_BADGE[evaluation.status] ?? {
                  label: evaluation.status,
                  cls: 'bg-gray-100 text-gray-600',
                };

                return (
                  <button
                    key={evaluation.id}
                    onClick={() => navigate('/evaluacion')}
                    className="flex min-h-[44px] w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/30">
                      <ClipboardCheck className="h-5 w-5 text-teal-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        Evaluación PROA
                        {evaluation.hospital_name && (
                          <span className="font-normal text-gray-500 dark:text-gray-400"> · {evaluation.hospital_name}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{relativeDate(evaluation.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusConf.cls}`}>
                        {statusConf.label}
                      </span>
                      {evaluation.progress_pct != null && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">{evaluation.progress_pct}%</span>
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
