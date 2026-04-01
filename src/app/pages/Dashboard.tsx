import { useEffect, useState, type ComponentType } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useHospitalContext } from '../../contexts/HospitalContext';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { getCurrentMonthValue } from '../../lib/analytics/proaPeriods';
import { EmptyState } from '../components/EmptyState';
import { ProaReportModal } from '../components/ProaReportModal';
import { InfoTooltip } from '../components/Tooltip';
import { WelcomeModal, shouldShowWelcome } from '../components/WelcomeModal';
import { AdherenciaChart } from '../components/charts/proa/AdherenciaChart';
import { ConductasChart } from '../components/charts/proa/ConductasChart';
import { DistribucionServicioChart } from '../components/charts/proa/DistribucionServicioChart';
import { TipoIntervencionCommitteeChart } from '../components/charts/proa/TipoIntervencionCommitteeChart';

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return `Buenos dias, ${name}`;
  if (hour >= 12 && hour < 18) return `Buenas tardes, ${name}`;
  return `Buenas noches, ${name}`;
}

function relativeDate(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (diffDays <= 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} dias`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return `Hace ${Math.floor(diffDays / 30)} meses`;
}

interface RecommendedAction {
  title: string;
  description: string;
  label: string;
  onClick: () => void;
}

interface KpiCardProps {
  label: string;
  value: number | string;
  color?: 'default' | 'green' | 'orange';
}

interface ModuleCard {
  Icon: ComponentType<{ className?: string }>;
  iconCls: string;
  bgCls: string;
  title: string;
  desc: string;
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

const MODULE_CARDS: ModuleCard[] = [
  {
    Icon: ClipboardCheck,
    iconCls: 'text-teal-500',
    bgCls: 'bg-teal-50 dark:bg-teal-900/20',
    title: 'Evaluacion PROA',
    desc: 'Registra cada intervencion, guarda borradores y sigue los casos que requieren respuesta clinica.',
  },
  {
    Icon: FileSpreadsheet,
    iconCls: 'text-emerald-500',
    bgCls: 'bg-emerald-50 dark:bg-emerald-900/20',
    title: 'Carga de Excel',
    desc: 'Sube el archivo del periodo para generar metricas, tendencias y alertas sin digitacion manual.',
  },
  {
    Icon: BarChart3,
    iconCls: 'text-blue-500',
    bgCls: 'bg-blue-50 dark:bg-blue-900/20',
    title: 'Analiticas',
    desc: 'Consulta tendencias, cumplimiento y uso de antimicrobianos por servicio, periodo y tipo de intervencion.',
  },
  {
    Icon: FileText,
    iconCls: 'text-rose-500',
    bgCls: 'bg-rose-50 dark:bg-rose-900/20',
    title: 'Reportes',
    desc: 'Exporta informacion lista para comites clinicos, direccion medica o auditorias internas.',
  },
];

function KpiCard({ label, value, color = 'default' }: KpiCardProps) {
  const valueClassName =
    color === 'green'
      ? 'text-green-600 dark:text-green-400'
      : color === 'orange'
        ? 'text-orange-500 dark:text-orange-400'
        : 'text-gray-900 dark:text-white';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${valueClassName}`}>{value}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    hospitalsLoading,
    selectedHospitalObj,
    availableMonths,
    monthsLoading,
    selectedMonth,
    selectedMonthValue,
    setSelectedMonthValue,
  } = useHospitalContext();
  const { stats, loading: dataLoading, error, refetch } = useDashboardStats(
    selectedHospitalObj?.id ?? null,
    selectedMonth?.mes ?? null,
    selectedMonth?.anio ?? null,
  );

  const [modulesOpen, setModulesOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    const id = profile?.id;
    if (id && shouldShowWelcome(id)) {
      setShowWelcome(true);
    }
  }, [profile?.id]);

  const hasHospital = Boolean(selectedHospitalObj);
  const isLoading = hospitalsLoading || monthsLoading || dataLoading;
  const hasNoData = hasHospital && !isLoading && stats === null;
  const firstName = profile?.full_name?.split(' ')[0] || 'Doctor';
  const currentMonth = selectedMonthValue ?? getCurrentMonthValue();
  const currentMonthCount = selectedMonth?.count ?? 0;

  const recommendedAction: RecommendedAction = !hasHospital
    ? {
        title: 'Primero define tu hospital de trabajo',
        description: 'Crea la institucion o selecciona una existente para que el tablero muestre datos clinicos reales.',
        label: 'Ir a hospitales',
        onClick: () => navigate('/hospitales'),
      }
    : hasNoData
      ? {
          title: 'Carga el Excel PROA del periodo',
          description: 'Con el archivo mensual obtendras metricas automaticas, tendencias y alertas basicas sin digitacion manual.',
          label: 'Subir Excel',
          onClick: () => navigate('/hospitales'),
        }
      : {
          title: 'Continua el seguimiento clinico',
          description: 'Revisa la actividad reciente o registra una nueva evaluacion si hay intervenciones pendientes del dia.',
          label: 'Nueva evaluacion',
          onClick: () => navigate('/evaluacion'),
        };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      {showWelcome && profile?.id ? <WelcomeModal userId={profile.id} onDismiss={() => setShowWelcome(false)} /> : null}
      <ProaReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        initialHospitalId={selectedHospitalObj?.id}
        initialMonth={currentMonth}
        initialScope="hospital"
      />

      {isLoading ? (
        <DashboardSkeleton />
      ) : !hasHospital ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
          <EmptyState
            icon={Building2}
            title="No tienes hospitales registrados"
            description="Crea tu primer hospital para comenzar a usar INFECTUS."
            action={{ label: 'Crear hospital', onClick: () => navigate('/hospitales') }}
          />
        </div>
      ) : error && !stats ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 bg-white p-8 text-center dark:border-red-900/40 dark:bg-gray-900">
          <span className="text-5xl">⚠️</span>
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={() => void refetch()}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white transition-all duration-200 hover:bg-teal-700"
          >
            Reintentar
          </button>
        </div>
      ) : hasNoData ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
          <EmptyState
            icon={ClipboardCheck}
            title={`Sin datos para ${selectedHospitalObj?.name ?? 'este hospital'}`}
            description="Sube el Excel PROA del mes para ver las analíticas en el dashboard."
            action={{ label: 'Subir Excel', onClick: () => navigate('/hospitales') }}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {getGreeting(firstName)}
                </h1>
                <InfoTooltip content="Resumen general de las evaluaciones del mes actual" />
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {selectedHospitalObj
                  ? `${selectedHospitalObj.name} - ${selectedMonth?.label ?? stats?.periodoLabel ?? 'Sin periodo'} - ${stats?.totalEvaluaciones ?? 0} evaluaciones`
                  : ''}
              </p>
            </div>

            {availableMonths.length > 0 ? (
              <select
                value={selectedMonthValue ?? ''}
                onChange={(event) => setSelectedMonthValue(event.target.value || null)}
                className="min-h-[44px] rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-teal-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                {availableMonths.map((monthOption) => (
                  <option key={monthOption.value} value={monthOption.value}>
                    {monthOption.label} ({monthOption.count} eval)
                  </option>
                ))}
              </select>
            ) : null}

            <button
              onClick={() => navigate('/evaluacion')}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-teal-700 hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              Nueva evaluacion
            </button>
          </div>

          {error ? (
            <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">No se pudo actualizar todo el dashboard</p>
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
              <button
                onClick={() => void refetch()}
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-900/40"
              >
                Reintentar
              </button>
            </div>
          ) : null}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-300">
                  Siguiente paso recomendado
                </p>
                <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{recommendedAction.title}</h2>
                <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
                  {recommendedAction.description}
                </p>
              </div>
              <button
                onClick={recommendedAction.onClick}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-teal-700"
              >
                {recommendedAction.label}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Total evaluaciones" value={stats?.totalEvaluaciones ?? 0} />
            <KpiCard
              label="% Aprobación"
              value={`${stats?.pctAprobacion ?? 0}%`}
              color={(stats?.pctAprobacion ?? 0) >= 80 ? 'green' : 'orange'}
            />
            <KpiCard label="% Cultivos previos" value={`${stats?.pctCultivos ?? 0}%`} />
            <KpiCard label="% Terapia empírica" value={`${stats?.pctEmpirica ?? 0}%`} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TipoIntervencionCommitteeChart
              data={stats?.tipoData ?? []}
              hospitalName={selectedHospitalObj?.name ?? 'Hospital'}
              showAnalysis={false}
              showExportButton={false}
              chartHeightClassName="h-56"
            />
            <DistribucionServicioChart
              data={stats?.servicioData ?? []}
              hospitalName={selectedHospitalObj?.name ?? 'Hospital'}
              showAnalysis={false}
              showExportButton={false}
              chartHeightClassName="h-56"
            />
            <ConductasChart
              data={stats?.conductasData ?? []}
              hospitalName={selectedHospitalObj?.name ?? 'Hospital'}
              showAnalysis={false}
              showExportButton={false}
              chartHeightClassName="h-56"
            />
            <AdherenciaChart
              data={stats?.adherenciaData ?? { adheridos: 0, noAdheridos: 0, total: 0 }}
              hospitalName={selectedHospitalObj?.name ?? 'Hospital'}
              showAnalysis={false}
              showExportButton={false}
              chartHeightClassName="h-56"
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-300">
                  Reporte mensual
                </p>
                <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  Generar reporte del comite
                </h2>
                <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
                  Genera el PowerPoint y PDF del informe mensual PROA listo para presentar en comite.
                </p>
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  Basado en {currentMonthCount} evaluacion{currentMonthCount === 1 ? '' : 'es'} del periodo actual
                </p>
              </div>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-teal-700"
              >
                Generar reporte
              </button>
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Tareas frecuentes</h2>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Accesos directos para las acciones que el equipo clinico usa con mas frecuencia.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <button
                onClick={() => navigate('/evaluacion')}
                className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-teal-700"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 transition-transform duration-200 group-hover:scale-110 dark:bg-teal-900/30">
                  <ClipboardCheck className="h-5 w-5 text-teal-600" />
                </div>
                <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">Nueva evaluacion PROA</p>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  Registra una intervencion individual y continua el seguimiento clinico.
                </p>
              </button>

              <button
                onClick={() => navigate('/indicadores-proa')}
                className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 transition-transform duration-200 group-hover:scale-110 dark:bg-blue-900/30">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">Ver analiticas</p>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  Consulta indicadores, tendencias y comportamiento por servicio.
                </p>
              </button>

              <button
                onClick={() => navigate('/hospitales')}
                className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-violet-700"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 transition-transform duration-200 group-hover:scale-110 dark:bg-violet-900/30">
                  <Building2 className="h-5 w-5 text-violet-600" />
                </div>
                <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">Gestionar hospitales</p>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  Edita datos institucionales, cambia el hospital activo y carga archivos del programa.
                </p>
              </button>

              <button
                onClick={() => navigate('/evaluacion/ias')}
                className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-amber-700"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 transition-transform duration-200 group-hover:scale-110 dark:bg-amber-900/30">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">Registrar IAAS</p>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  Documenta infecciones asociadas a la atencion cuando requieras seguimiento adicional.
                </p>
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <button
              onClick={() => setModulesOpen((value) => !value)}
              className="flex min-h-[44px] w-full items-center justify-between p-5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Como usar Infectus en la practica diaria</h2>
              {modulesOpen ? (
                <ChevronUp className="h-5 w-5 shrink-0 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0 text-gray-400" />
              )}
            </button>

            {modulesOpen ? (
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
            ) : null}
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Actividad reciente</h2>

            {stats && stats.recentEvals.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                  <ClipboardCheck className="h-8 w-8 text-gray-400" />
                </div>
                <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">No hay actividad reciente</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Crea tu primera evaluacion para comenzar.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
                {stats?.recentEvals.map((evaluation) => {
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
                          Evaluacion PROA
                          {evaluation.hospital_name ? (
                            <span className="font-normal text-gray-500 dark:text-gray-400"> - {evaluation.hospital_name}</span>
                          ) : null}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{relativeDate(evaluation.created_at)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusConf.cls}`}>
                          {statusConf.label}
                        </span>
                        {evaluation.progress_pct != null ? (
                          <span className="text-xs text-gray-400 dark:text-gray-500">{evaluation.progress_pct}%</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
