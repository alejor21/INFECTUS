import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Building2,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAnalyticsData } from '../../hooks/useAnalyticsData';
import {
  getAdherenciaAnalysis,
  getConductasAnalysis,
  getServicioAnalysis,
  getTipoIntervencionAnalysis,
} from '../../lib/analytics/proaCommittee';
import { exportAllChartsAsPNG, exportChartAsPNG, exportChartsPDF } from '../../utils/exportCharts';
import { useHospitalContext } from '../../contexts/HospitalContext';
import { EmptyState } from '../components/EmptyState';
import { IndicatorCard } from '../components/IndicatorCard';
import { InfoTooltip } from '../components/Tooltip';
import { ProaReportModal } from '../components/ProaReportModal';
import { AdherenciaChart } from '../components/charts/proa/AdherenciaChart';
import { ConductasChart } from '../components/charts/proa/ConductasChart';
import { DistribucionServicioChart } from '../components/charts/proa/DistribucionServicioChart';
import { TipoIntervencionCommitteeChart } from '../components/charts/proa/TipoIntervencionCommitteeChart';

export function IndicadoresPROA() {
  const navigate = useNavigate();
  const { selectedHospitalObj, hospitalsLoading } = useHospitalContext();
  const [selectedMes, setSelectedMes] = useState<number | null>(null);
  const [selectedAnio, setSelectedAnio] = useState<number | null>(null);
  const [compareMes, setCompareMes] = useState<number | null>(null);
  const [compareAnio, setCompareAnio] = useState<number | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const { data, mesesDisponibles, loading, error, refetch } = useAnalyticsData(
    selectedHospitalObj?.id,
    selectedMes,
    selectedAnio,
  );
  const {
    data: dataCompare,
    loading: loadingCompare,
  } = useAnalyticsData(compareMes !== null ? selectedHospitalObj?.id : null, compareMes, compareAnio);

  useEffect(() => {
    setSelectedMes(null);
    setSelectedAnio(null);
    setCompareMes(null);
    setCompareAnio(null);
  }, [selectedHospitalObj?.id]);

  useEffect(() => {
    if (mesesDisponibles.length > 0 && selectedMes === null && selectedAnio === null) {
      setSelectedMes(mesesDisponibles[0].mes);
      setSelectedAnio(mesesDisponibles[0].anio);
    }
  }, [mesesDisponibles, selectedMes, selectedAnio]);

  useEffect(() => {
    if (compareMes === selectedMes && compareAnio === selectedAnio) {
      setCompareMes(null);
      setCompareAnio(null);
    }
  }, [compareMes, compareAnio, selectedMes, selectedAnio]);

  const chartSubtitle = `${selectedHospitalObj?.name ?? 'Hospital'} (n=${data?.totalEvaluaciones ?? 0})`;
  const adherenciaAnalysis = useMemo(
    () => getAdherenciaAnalysis(data?.adherenciaData ?? { adheridos: 0, noAdheridos: 0, total: 0 }),
    [data?.adherenciaData],
  );
  const conductasAnalysis = useMemo(() => getConductasAnalysis(data?.conductasData ?? []), [data?.conductasData]);
  const servicioAnalysis = useMemo(() => getServicioAnalysis(data?.servicioData ?? []), [data?.servicioData]);
  const tipoAnalysis = useMemo(() => getTipoIntervencionAnalysis(data?.tipoData ?? []), [data?.tipoData]);
  const compareChartSubtitle = `${selectedHospitalObj?.name ?? 'Hospital'} (n=${dataCompare?.totalEvaluaciones ?? 0})`;
  const compareAdherenciaAnalysis = useMemo(
    () => getAdherenciaAnalysis(dataCompare?.adherenciaData ?? { adheridos: 0, noAdheridos: 0, total: 0 }),
    [dataCompare?.adherenciaData],
  );
  const compareConductasAnalysis = useMemo(
    () => getConductasAnalysis(dataCompare?.conductasData ?? []),
    [dataCompare?.conductasData],
  );
  const compareServicioAnalysis = useMemo(
    () => getServicioAnalysis(dataCompare?.servicioData ?? []),
    [dataCompare?.servicioData],
  );
  const compareTipoAnalysis = useMemo(
    () => getTipoIntervencionAnalysis(dataCompare?.tipoData ?? []),
    [dataCompare?.tipoData],
  );

  const committeePdfData = useMemo(
    () => ({
      charts: [
        {
          id: 'proa-chart-tipo-intervencion',
          title: 'Tipo de Intervenciones PROA',
          analysis: tipoAnalysis,
        },
        {
          id: 'proa-chart-servicio',
          title: 'Intervenciones por Servicio',
          analysis: servicioAnalysis,
        },
        {
          id: 'proa-chart-conductas',
          title: 'Conductas de Infectologia por Servicio',
          analysis: conductasAnalysis,
        },
        {
          id: 'proa-chart-adherencia',
          title: 'Adherencia a las Intervenciones',
          analysis: adherenciaAnalysis,
        },
      ],
    }),
    [adherenciaAnalysis, conductasAnalysis, servicioAnalysis, tipoAnalysis],
  );

  async function handleIndividualExport(elementId: string, chartLabel: string) {
    const hospitalName = selectedHospitalObj?.name ?? 'Hospital';
    const periodLabel = data?.periodoLabel ?? 'Todos los datos';
    await exportChartAsPNG(elementId, `${hospitalName}_${chartLabel}_${periodLabel}`);
  }

  async function handleExportAllCharts() {
    const hospitalName = selectedHospitalObj?.name ?? 'Hospital';
    const periodLabel = data?.periodoLabel ?? 'Todos los datos';
    await exportAllChartsAsPNG(hospitalName, periodLabel);
  }

  async function handleExportPdf() {
    const hospitalName = selectedHospitalObj?.name ?? 'Hospital';
    const periodLabel = data?.periodoLabel ?? 'Todos los datos';
    await exportChartsPDF(hospitalName, periodLabel, committeePdfData);
  }

  if (hospitalsLoading || loading) {
    return <AnalyticsSkeleton />;
  }

  if (!selectedHospitalObj) {
    return (
      <div className="p-8">
        <div className="mb-8 flex items-center gap-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analiticas PROA</h1>
          <InfoTooltip content="Reportes automaticos basados en tus evaluaciones PROA" />
        </div>
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
          <EmptyState
            icon={Building2}
            title="Sin hospital seleccionado"
            description="Selecciona o crea un hospital para consultar las analiticas del programa PROA."
            action={{ label: 'Ir a hospitales', onClick: () => navigate('/hospitales') }}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="mb-8 flex items-center gap-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analiticas PROA</h1>
          <InfoTooltip content="Reportes automaticos basados en tus evaluaciones PROA" />
        </div>
        <div className="rounded-2xl border border-dashed border-red-200 bg-white p-8 text-center dark:border-red-900/50 dark:bg-gray-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="mb-8 flex items-center gap-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analiticas PROA</h1>
          <InfoTooltip content="Reportes automaticos basados en tus evaluaciones PROA" />
        </div>
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
          <EmptyState
            icon={FileSpreadsheet}
            title="Sin datos para este periodo"
            description="Sube el Excel PROA para ver las analiticas del hospital seleccionado."
            action={{ label: 'Subir Excel', onClick: () => navigate('/hospitales') }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <ProaReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        initialHospitalId={selectedHospitalObj.id}
        initialScope="hospital"
      />

      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analiticas PROA</h1>
          <InfoTooltip content="Reportes automaticos basados en tus evaluaciones PROA" />
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedHospitalObj.name} - {selectedHospitalObj.city}, {selectedHospitalObj.department}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          {selectedHospitalObj.name} - {data.periodoLabel} - {data.totalEvaluaciones} evaluaciones
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Graficas del Comite PROA</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Las 4 graficas estandar del informe mensual PROA
          </p>
        </div>

        <div className="flex flex-col gap-3 xl:items-end">
          {mesesDisponibles.length >= 2 ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Periodo</span>
                <select
                  value={selectedMes !== null && selectedAnio !== null ? `${selectedAnio}-${selectedMes}` : ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (!value) {
                      setSelectedMes(null);
                      setSelectedAnio(null);
                      return;
                    }

                    const [nextAnio, nextMes] = value.split('-').map(Number);
                    setSelectedAnio(nextAnio);
                    setSelectedMes(nextMes);
                  }}
                  className="bg-transparent outline-none"
                >
                  <option value="">Todos los meses</option>
                  {mesesDisponibles.map((periodo) => (
                    <option key={`${periodo.anio}-${periodo.mes}`} value={`${periodo.anio}-${periodo.mes}`}>
                      {periodo.label} ({periodo.count} evaluaciones)
                    </option>
                  ))}
                </select>
              </label>

              <label className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Comparar con</span>
                <select
                  value={compareMes !== null && compareAnio !== null ? `${compareAnio}-${compareMes}` : ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (!value) {
                      setCompareMes(null);
                      setCompareAnio(null);
                      return;
                    }

                    const [nextAnio, nextMes] = value.split('-').map(Number);
                    setCompareAnio(nextAnio);
                    setCompareMes(nextMes);
                  }}
                  className="bg-transparent outline-none"
                >
                  <option value="">Comparar con...</option>
                  {mesesDisponibles
                    .filter((periodo) => !(periodo.mes === selectedMes && periodo.anio === selectedAnio))
                    .map((periodo) => (
                      <option key={`${periodo.anio}-${periodo.mes}`} value={`${periodo.anio}-${periodo.mes}`}>
                        {periodo.label} ({periodo.count} evaluaciones)
                      </option>
                    ))}
                </select>
              </label>
            </div>
          ) : mesesDisponibles.length === 1 ? (
            <span className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
              {mesesDisponibles[0].label} ({mesesDisponibles[0].count} evaluaciones)
            </span>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void handleExportAllCharts();
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Download className="h-4 w-4" />
              Exportar todas como PNG
            </button>
            <button
              type="button"
              onClick={() => {
                void handleExportPdf();
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <FileText className="h-4 w-4" />
              Exportar PDF
            </button>
            <button
              type="button"
              onClick={() => {
                setIsReportModalOpen(true);
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
            >
              <BarChart3 className="h-4 w-4" />
              Generar PowerPoint
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TipoIntervencionCommitteeChart
          cardId="proa-chart-tipo-intervencion"
          title="Tipo de Intervenciones PROA"
          subtitle={chartSubtitle}
          data={data.tipoData}
          analysis={tipoAnalysis}
          isLoading={loading}
          onExport={() => {
            void handleIndividualExport('proa-chart-tipo-intervencion', 'TipoIntervencion');
          }}
        />
        <DistribucionServicioChart
          cardId="proa-chart-servicio"
          title="Intervenciones por Servicio"
          subtitle={chartSubtitle}
          data={data.servicioData}
          analysis={servicioAnalysis}
          isLoading={loading}
          onExport={() => {
            void handleIndividualExport('proa-chart-servicio', 'PorServicio');
          }}
        />
        <ConductasChart
          cardId="proa-chart-conductas"
          title="Conductas de Infectologia por Servicio"
          subtitle={chartSubtitle}
          data={data.conductasData}
          analysis={conductasAnalysis}
          isLoading={loading}
          onExport={() => {
            void handleIndividualExport('proa-chart-conductas', 'Conductas');
          }}
        />
        <AdherenciaChart
          cardId="proa-chart-adherencia"
          title="Adherencia a las Intervenciones"
          subtitle={chartSubtitle}
          data={data.adherenciaData}
          analysis={adherenciaAnalysis}
          isLoading={loading}
          onExport={() => {
            void handleIndividualExport('proa-chart-adherencia', 'Adherencia');
          }}
        />
      </div>

      {compareMes !== null && dataCompare ? (
        <div className="mb-8 space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Comparativa por mes</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {data.periodoLabel} vs {dataCompare.periodoLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-lg bg-teal-50 px-4 py-2 text-center text-sm font-medium text-teal-700 dark:bg-teal-900/20 dark:text-teal-200">
                {data.periodoLabel} (n={data.totalEvaluaciones})
              </div>
              <TipoIntervencionCommitteeChart
                cardId="proa-compare-current-tipo-intervencion"
                title="Tipo de Intervenciones PROA"
                subtitle={chartSubtitle}
                data={data.tipoData}
                analysis={tipoAnalysis}
                isLoading={false}
                onExport={() => {}}
                chartHeightClassName="h-56"
                showExportButton={false}
                showAnalysis={false}
              />
              <DistribucionServicioChart
                cardId="proa-compare-current-servicio"
                title="Intervenciones por Servicio"
                subtitle={chartSubtitle}
                data={data.servicioData}
                analysis={servicioAnalysis}
                isLoading={false}
                onExport={() => {}}
                chartHeightClassName="h-56"
                showExportButton={false}
                showAnalysis={false}
              />
              <ConductasChart
                cardId="proa-compare-current-conductas"
                title="Conductas de Infectologia por Servicio"
                subtitle={chartSubtitle}
                data={data.conductasData}
                analysis={conductasAnalysis}
                isLoading={false}
                onExport={() => {}}
                chartHeightClassName="h-56"
                showExportButton={false}
                showAnalysis={false}
              />
              <AdherenciaChart
                cardId="proa-compare-current-adherencia"
                title="Adherencia a las Intervenciones"
                subtitle={chartSubtitle}
                data={data.adherenciaData}
                analysis={adherenciaAnalysis}
                isLoading={false}
                onExport={() => {}}
                chartHeightClassName="h-56"
                showExportButton={false}
                showAnalysis={false}
              />
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-orange-50 px-4 py-2 text-center text-sm font-medium text-orange-700 dark:bg-orange-900/20 dark:text-orange-200">
                {dataCompare.periodoLabel} (n={dataCompare.totalEvaluaciones})
              </div>
              <TipoIntervencionCommitteeChart
                cardId="proa-compare-target-tipo-intervencion"
                title="Tipo de Intervenciones PROA"
                subtitle={compareChartSubtitle}
                data={dataCompare.tipoData}
                analysis={compareTipoAnalysis}
                isLoading={loadingCompare}
                onExport={() => {}}
                chartHeightClassName="h-56"
                showExportButton={false}
                showAnalysis={false}
              />
              <DistribucionServicioChart
                cardId="proa-compare-target-servicio"
                title="Intervenciones por Servicio"
                subtitle={compareChartSubtitle}
                data={dataCompare.servicioData}
                analysis={compareServicioAnalysis}
                isLoading={loadingCompare}
                onExport={() => {}}
                chartHeightClassName="h-56"
                showExportButton={false}
                showAnalysis={false}
              />
              <ConductasChart
                cardId="proa-compare-target-conductas"
                title="Conductas de Infectologia por Servicio"
                subtitle={compareChartSubtitle}
                data={dataCompare.conductasData}
                analysis={compareConductasAnalysis}
                isLoading={loadingCompare}
                onExport={() => {}}
                chartHeightClassName="h-56"
                showExportButton={false}
                showAnalysis={false}
              />
              <AdherenciaChart
                cardId="proa-compare-target-adherencia"
                title="Adherencia a las Intervenciones"
                subtitle={compareChartSubtitle}
                data={dataCompare.adherenciaData}
                analysis={compareAdherenciaAnalysis}
                isLoading={loadingCompare}
                onExport={() => {}}
                chartHeightClassName="h-56"
                showExportButton={false}
                showAnalysis={false}
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Indicador</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
                    {data.periodoLabel}
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
                    {dataCompare.periodoLabel}
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
                    Diferencia
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: 'Total evaluaciones',
                    v1: data.totalEvaluaciones,
                    v2: dataCompare.totalEvaluaciones,
                    fmt: (value: number) => String(value),
                    mejora: (diff: number) => diff > 0,
                  },
                  {
                    label: '% Aprobación',
                    v1: data.pctAprobacion,
                    v2: dataCompare.pctAprobacion,
                    fmt: (value: number) => `${value}%`,
                    mejora: (diff: number) => diff > 0,
                  },
                  {
                    label: '% Cultivos previos',
                    v1: data.pctCultivos,
                    v2: dataCompare.pctCultivos,
                    fmt: (value: number) => `${value}%`,
                    mejora: (diff: number) => diff > 0,
                  },
                  {
                    label: '% Terapia empírica',
                    v1: data.pctEmpirica,
                    v2: dataCompare.pctEmpirica,
                    fmt: (value: number) => `${value}%`,
                    mejora: (diff: number) => diff > 0,
                  },
                ].map((row) => {
                  const diff = Number((row.v1 - row.v2).toFixed(1));
                  const isPositive = diff > 0;
                  const isNeutral = diff === 0;
                  const isMejora = row.mejora(diff);
                  const diffColor = isNeutral
                    ? 'text-gray-400'
                    : isMejora
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-500 dark:text-red-400';
                  const arrow = isNeutral ? '=' : isPositive ? '↑' : '↓';

                  return (
                    <tr
                      key={row.label}
                      className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.label}</td>
                      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white">
                        {row.fmt(row.v1)}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white">
                        {row.fmt(row.v2)}
                      </td>
                      <td className={`px-4 py-3 text-center font-semibold ${diffColor}`}>
                        {isNeutral ? '—' : `${isPositive ? '+' : ''}${row.fmt(diff)} ${arrow}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => {
              setCompareMes(null);
              setCompareAnio(null);
            }}
            className="text-sm text-gray-500 underline transition-colors hover:text-gray-700 dark:hover:text-gray-300"
          >
            Cerrar comparativa
          </button>
        </div>
      ) : loadingCompare && compareMes !== null ? (
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div />
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-56 rounded-xl bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <IndicatorCard
          icon={FileSpreadsheet}
          title="Total evaluaciones"
          value={data.totalEvaluaciones}
          unit="casos"
          target="Periodo activo"
          status="progress"
          description="Total de evaluaciones PROA registradas para el periodo seleccionado."
        />
        <IndicatorCard
          icon={TrendingUp}
          title="Aprobacion terapeutica"
          value={data.pctAprobacion}
          unit="%"
          target="80"
          status={data.pctAprobacion >= 80 ? 'achieved' : 'progress'}
          description="Proporcion de terapias aprobadas o alineadas con la recomendacion del equipo PROA."
        />
        <IndicatorCard
          icon={AlertCircle}
          title="Cultivos previos"
          value={data.pctCultivos}
          unit="%"
          target="80"
          status={data.pctCultivos >= 80 ? 'achieved' : 'progress'}
          description="Mide si hubo toma de cultivos previa al inicio del tratamiento antimicrobiano."
        />
        <IndicatorCard
          icon={BarChart3}
          title="Terapia empirica apropiada"
          value={data.pctEmpirica}
          unit="%"
          target="80"
          status={data.pctEmpirica >= 80 ? 'achieved' : 'progress'}
          description="Evalua si el tratamiento empirico inicial fue adecuado para el escenario clinico registrado."
        />
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="h-8 w-64 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-72 rounded-xl bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
    </div>
  );
}
