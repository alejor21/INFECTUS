import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  BarChart3,
  Building2,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useProaCharts } from '../../hooks/useProaCharts';
import {
  getAdherenciaAnalysis,
  getCommitteeHospitalLabel,
  getConductasAnalysis,
  getServicioAnalysis,
  getTipoIntervencionAnalysis,
} from '../../lib/analytics/proaCommittee';
import {
  COMMITTEE_RANGE_LABEL,
  filterRecordsByCommitteeRange,
  parseCommitteeDate,
  type CommitteeRange,
} from '../../lib/analytics/proaPeriods';
import { exportAllChartsAsPNG, exportChartAsPNG, exportChartsPDF } from '../../utils/exportCharts';
import type { InterventionRecord } from '../../types';
import { AdherenciaChart } from '../components/charts/proa/AdherenciaChart';
import { ConductasChart } from '../components/charts/proa/ConductasChart';
import { DistribucionServicioChart } from '../components/charts/proa/DistribucionServicioChart';
import { TipoIntervencionCommitteeChart } from '../components/charts/proa/TipoIntervencionCommitteeChart';
import { BenchmarkComparisonChart } from '../components/BenchmarkComparisonChart';
import { ComplianceChart } from '../components/ComplianceChart';
import { EmptyState } from '../components/EmptyState';
import { IndicatorCard } from '../components/IndicatorCard';
import { IndicatorsTable } from '../components/IndicatorsTable';
import type { ProaIndicatorRow } from '../components/IndicatorsTable';
import { useHospitalContext } from '../components/Layout';
import { ObjectivesProgressChart } from '../components/ObjectivesProgressChart';
import { ProaReportModal } from '../components/ProaReportModal';
import { QualityMetricsChart } from '../components/QualityMetricsChart';
import { InfoTooltip } from '../components/Tooltip';

function pct(count: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((count / total) * 10000) / 100;
}

function latestDateLabel(records: InterventionRecord[]): string {
  let latest: Date | null = null;

  for (const record of records) {
    const trimmed = (record.fecha ?? '').trim();
    const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const ymd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    let parsedDate: Date | null = null;

    if (dmy) {
      parsedDate = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    } else if (ymd) {
      parsedDate = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    }

    if (parsedDate && !Number.isNaN(parsedDate.getTime()) && (!latest || parsedDate > latest)) {
      latest = parsedDate;
    }
  }

  if (!latest) {
    return 'Sin fecha';
  }

  const day = String(latest.getDate()).padStart(2, '0');
  const month = String(latest.getMonth() + 1).padStart(2, '0');

  return `${day}/${month}/${latest.getFullYear()}`;
}

const DATE_RANGE_LABEL: Record<'1m' | '6m' | '12m' | 'all', string> = {
  '1m': 'Ultimo mes',
  '6m': 'Ultimos 6 meses',
  '12m': 'Ultimo ano',
  all: 'Todos los datos',
};

function getStatusText(value: number, objective: number, lowIsBetter = false): string {
  if (lowIsBetter) {
    if (value <= objective) {
      return 'Comportamiento esperado';
    }

    if (value <= objective + 2) {
      return 'Vigilar';
    }

    return 'Requiere revision';
  }

  if (value >= objective) {
    return 'Comportamiento esperado';
  }

  if (value >= objective - 10) {
    return 'Vigilar';
  }

  return 'Requiere revision';
}

export function IndicadoresPROA() {
  const navigate = useNavigate();
  const { allRawRecords, dateRange, hospitals, selectedHospitalObj } = useHospitalContext();
  const { kpis, monthlyCompliance, records, loading, cultivosPreRate, avgTherapyDays } = useAnalytics();

  const [committeeHospitalId, setCommitteeHospitalId] = useState<string>(selectedHospitalObj?.id ?? 'all');
  const [committeeRange, setCommitteeRange] = useState<CommitteeRange>(dateRange);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const totalRecords = records.length;
  const actualizacion = latestDateLabel(records);
  const noHospitalSelected = !selectedHospitalObj;
  const noAnalyticsData = selectedHospitalObj && !loading && totalRecords === 0;

  useEffect(() => {
    setCommitteeHospitalId(selectedHospitalObj?.id ?? 'all');
  }, [selectedHospitalObj?.id]);

  useEffect(() => {
    setCommitteeRange(dateRange);
  }, [dateRange]);

  const committeeSourceRecords = useMemo(
    () => filterRecordsByCommitteeRange(allRawRecords, committeeRange),
    [allRawRecords, committeeRange],
  );

  const committeeScopedRecords = useMemo(() => {
    if (committeeHospitalId === 'all') {
      return committeeSourceRecords;
    }

    const selectedCommitteeHospital = hospitals.find((hospital) => hospital.id === committeeHospitalId);
    if (!selectedCommitteeHospital) {
      return committeeSourceRecords;
    }

    return committeeSourceRecords.filter((record) => record.hospitalName === selectedCommitteeHospital.name);
  }, [committeeHospitalId, committeeSourceRecords, hospitals]);

  const committeeHospitalName = committeeHospitalId === 'all'
    ? null
    : hospitals.find((hospital) => hospital.id === committeeHospitalId)?.name ?? null;

  const {
    adherenciaData,
    conductasData,
    isLoading: proaChartsLoading,
    servicioData,
    tipoData,
  } = useProaCharts({
    evaluaciones: committeeSourceRecords,
    hospitalId: committeeHospitalId === 'all' ? undefined : committeeHospitalId,
  });

  const committeeSubtitle = `${getCommitteeHospitalLabel(committeeHospitalName)} (n=${committeeScopedRecords.length})`;
  const committeePeriodLabel = COMMITTEE_RANGE_LABEL[committeeRange];
  const adherenciaAnalysis = useMemo(() => getAdherenciaAnalysis(adherenciaData), [adherenciaData]);
  const conductasAnalysis = useMemo(() => getConductasAnalysis(conductasData), [conductasData]);
  const servicioAnalysis = useMemo(() => getServicioAnalysis(servicioData), [servicioData]);
  const tipoAnalysis = useMemo(() => getTipoIntervencionAnalysis(tipoData), [tipoData]);
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

  const proa003 = pct(
    records.filter((record) => (record.tipoIntervencion ?? '').trim().toUpperCase() === 'IC').length,
    totalRecords,
  );
  const proa004 = pct(
    records.filter((record) => (record.conductaGeneral ?? '').toUpperCase().includes('DESESCALONA')).length,
    totalRecords,
  );
  const proa007 = pct(
    records.filter((record) => (record.ajustePorCultivo ?? '').trim().toUpperCase() === 'SI').length,
    totalRecords,
  );

  const benchmarkData = [
    { name: 'Adecuacion terapeutica', value: kpis.therapeuticAdequacy, benchmark: 85 },
    { name: 'Terapia empirica apropiada', value: kpis.guidelineCompliance, benchmark: 85 },
    { name: 'Cultivos previos', value: cultivosPreRate, benchmark: 80 },
    { name: 'Ajuste por cultivo', value: proa007, benchmark: 75 },
  ];

  const proaRows: ProaIndicatorRow[] = [
    {
      codigo: 'PROA-001',
      indicador: 'Tasa de prescripcion adecuada',
      valor: Math.round(kpis.therapeuticAdequacy * 10) / 10,
      objetivo: 85,
      unidad: '%',
      tendencia: kpis.therapeuticAdequacy >= 85 ? 'up' : 'down',
      frecuencia: 'Mensual',
      ultimaActualizacion: actualizacion,
    },
    {
      codigo: 'PROA-002',
      indicador: 'Dias promedio de terapia',
      valor: Math.round(avgTherapyDays * 10) / 10,
      objetivo: 7,
      unidad: 'dias',
      lowIsBetter: true,
      tendencia: avgTherapyDays <= 7 ? 'up' : 'down',
      frecuencia: 'Mensual',
      ultimaActualizacion: actualizacion,
    },
    {
      codigo: 'PROA-003',
      indicador: 'Interconsultas a infectologia',
      valor: proa003,
      objetivo: 90,
      unidad: '%',
      tendencia: proa003 >= 90 ? 'up' : 'down',
      frecuencia: 'Mensual',
      ultimaActualizacion: actualizacion,
    },
    {
      codigo: 'PROA-004',
      indicador: 'Desescalada terapeutica',
      valor: proa004,
      objetivo: 70,
      unidad: '%',
      tendencia: proa004 >= 70 ? 'up' : 'down',
      frecuencia: 'Mensual',
      ultimaActualizacion: actualizacion,
    },
    {
      codigo: 'PROA-005',
      indicador: 'Terapia empirica apropiada',
      valor: Math.round(kpis.guidelineCompliance * 10) / 10,
      objetivo: 85,
      unidad: '%',
      tendencia: kpis.guidelineCompliance >= 85 ? 'up' : 'down',
      frecuencia: 'Mensual',
      ultimaActualizacion: actualizacion,
    },
    {
      codigo: 'PROA-006',
      indicador: 'Cultivos previos al inicio',
      valor: cultivosPreRate,
      objetivo: 80,
      unidad: '%',
      tendencia: cultivosPreRate >= 80 ? 'up' : 'down',
      frecuencia: 'Mensual',
      ultimaActualizacion: actualizacion,
    },
    {
      codigo: 'PROA-007',
      indicador: 'Ajuste por cultivo',
      valor: proa007,
      objetivo: 75,
      unidad: '%',
      tendencia: proa007 >= 75 ? 'up' : 'down',
      frecuencia: 'Mensual',
      ultimaActualizacion: actualizacion,
    },
  ];

  const clinicalInsights = [
    {
      title: 'Aprobacion terapeutica',
      value: `${Math.round(kpis.therapeuticAdequacy * 10) / 10}%`,
      status: getStatusText(kpis.therapeuticAdequacy, 85),
      description: 'Mide cuantas prescripciones quedaron alineadas con la recomendacion del equipo PROA.',
    },
    {
      title: 'Cultivos previos',
      value: `${cultivosPreRate}%`,
      status: getStatusText(cultivosPreRate, 80),
      description: 'Ayuda a validar si la toma de muestras ocurre antes de iniciar antimicrobianos.',
    },
    {
      title: 'Duracion promedio',
      value: `${Math.round(avgTherapyDays * 10) / 10} dias`,
      status: getStatusText(avgTherapyDays, 7, true),
      description: 'Resume si el tiempo total de terapia se mantiene dentro del rango esperado del programa.',
    },
  ];

  async function handleIndividualExport(elementId: string, chartLabel: string) {
    const scope = getCommitteeHospitalLabel(committeeHospitalName);
    await exportChartAsPNG(elementId, `${scope}_${chartLabel}_${committeePeriodLabel}`);
  }

  async function handleExportAllCharts() {
    const scope = getCommitteeHospitalLabel(committeeHospitalName);
    await exportAllChartsAsPNG(scope, committeePeriodLabel);
  }

  async function handleExportPdf() {
    const scope = getCommitteeHospitalLabel(committeeHospitalName);
    await exportChartsPDF(scope, committeePeriodLabel, committeePdfData);
  }

  if (noHospitalSelected) {
    return (
      <div className="p-8">
        <div className="mb-8 flex items-center gap-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analiticas PROA</h1>
          <InfoTooltip content="Reportes automaticos basados en tus evaluaciones PROA" />
        </div>
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
          <EmptyState
            icon={Building2}
            title="Primero selecciona o crea un hospital para comenzar"
            description="Selecciona un hospital activo para consultar las analiticas del programa PROA."
            action={{ label: 'Crear hospital', onClick: () => navigate('/hospitales') }}
          />
        </div>
      </div>
    );
  }

  if (noAnalyticsData) {
    return (
      <div className="p-8">
        <div className="mb-8 flex items-center gap-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analiticas PROA</h1>
          <InfoTooltip content="Reportes automaticos basados en tus evaluaciones PROA" />
        </div>
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
          <EmptyState
            icon={FileSpreadsheet}
            title="Sin datos para el periodo seleccionado"
            description="Sube un archivo Excel o registra evaluaciones para ver las analiticas de este hospital."
            action={{ label: 'Subir Excel', onClick: () => navigate('/hospitales') }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={loading ? 'p-8 opacity-50' : 'p-8'}>
      <ProaReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        initialHospitalId={committeeHospitalId === 'all' ? undefined : committeeHospitalId}
        initialScope={committeeHospitalId === 'all' ? 'global' : 'hospital'}
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
          Basado en {records.length} evaluaciones - {DATE_RANGE_LABEL[dateRange]}
        </p>
      </div>

      <div className="mb-8 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/30">
        <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
        <div>
          <h4 className="mb-1 font-semibold text-blue-900 dark:text-blue-200">Como leer esta pantalla</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Aqui ves los indicadores mas utiles para decidir si el uso de antimicrobianos va en la direccion esperada.
            Ultima actualizacion disponible: {actualizacion}.
          </p>
        </div>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        {clinicalInsights.map((insight) => (
          <div
            key={insight.title}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{insight.title}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{insight.value}</p>
            <p className="mt-2 text-sm font-medium text-teal-600 dark:text-teal-300">{insight.status}</p>
            <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{insight.description}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <IndicatorCard
          icon={Target}
          title="Aprobacion terapeutica"
          value={kpis.therapeuticAdequacy}
          unit="%"
          target="85"
          status={kpis.therapeuticAdequacy >= 85 ? 'achieved' : 'progress'}
          description="Proporcion de terapias aprobadas o alineadas con el criterio del equipo PROA."
        />
        <IndicatorCard
          icon={TrendingUp}
          title="Duracion promedio de terapia"
          value={Math.round(avgTherapyDays * 10) / 10}
          unit="dias"
          target="7"
          status={avgTherapyDays <= 7 ? 'achieved' : 'warning'}
          description="Promedio de duracion de terapia registrado por evaluacion en el periodo analizado."
        />
        <IndicatorCard
          icon={CheckCircle2}
          title="Interconsultas a infectologia"
          value={proa003}
          unit="%"
          target="90"
          status={proa003 >= 90 ? 'achieved' : 'progress'}
          description="Proporcion de casos con tipo de intervencion IC."
        />
        <IndicatorCard
          icon={Award}
          title="Desescalada terapeutica"
          value={proa004}
          unit="%"
          target="70"
          status={proa004 >= 70 ? 'achieved' : 'progress'}
          description="Casos donde se registro desescalada segun la conducta general."
        />
        <IndicatorCard
          icon={BarChart3}
          title="Terapia empirica apropiada"
          value={kpis.guidelineCompliance}
          unit="%"
          target="85"
          status={kpis.guidelineCompliance >= 85 ? 'achieved' : 'progress'}
          description="Evalua si el tratamiento inicial fue adecuado para el escenario clinico registrado."
        />
        <IndicatorCard
          icon={AlertCircle}
          title="Ajuste por cultivo"
          value={proa007}
          unit="%"
          target="75"
          status={proa007 >= 75 ? 'achieved' : proa007 >= 60 ? 'progress' : 'warning'}
          description="Mide cuantos tratamientos fueron ajustados cuando ya existian resultados microbiologicos."
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ComplianceChart data={monthlyCompliance} loading={loading} />
        <QualityMetricsChart
          loading={loading}
          metrics={[
            { name: 'Adecuacion', value: kpis.therapeuticAdequacy, target: 90 },
            { name: 'Cumplimiento', value: kpis.guidelineCompliance, target: 85 },
            { name: 'Cultivos previos', value: cultivosPreRate, target: 80 },
          ]}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ObjectivesProgressChart
          loading={loading}
          objectives={[
            { name: 'Dias promedio de terapia', current: avgTherapyDays, target: 7 },
            { name: 'Adecuacion terapeutica', current: kpis.therapeuticAdequacy, target: 90 },
          ]}
        />
        <BenchmarkComparisonChart data={benchmarkData} loading={loading} />
      </div>

      <IndicatorsTable rows={proaRows} />

      <div className="mt-10 border-t border-gray-200 pt-10 dark:border-gray-800">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Graficas del Comite PROA</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Las 4 graficas estandar del informe mensual PROA
            </p>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Hospital</span>
                <select
                  value={committeeHospitalId}
                  onChange={(event) => setCommitteeHospitalId(event.target.value)}
                  className="bg-transparent outline-none"
                >
                  <option value="all">Global</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Periodo</span>
                <select
                  value={committeeRange}
                  onChange={(event) => setCommitteeRange(event.target.value as CommitteeRange)}
                  className="bg-transparent outline-none"
                >
                  {Object.entries(COMMITTEE_RANGE_LABEL).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <TipoIntervencionCommitteeChart
            cardId="proa-chart-tipo-intervencion"
            title="Tipo de Intervenciones PROA"
            subtitle={committeeSubtitle}
            data={tipoData}
            analysis={tipoAnalysis}
            isLoading={proaChartsLoading}
            onExport={() => {
              void handleIndividualExport('proa-chart-tipo-intervencion', 'TipoIntervencion');
            }}
          />
          <DistribucionServicioChart
            cardId="proa-chart-servicio"
            title="Intervenciones por Servicio"
            subtitle={committeeSubtitle}
            data={servicioData}
            analysis={servicioAnalysis}
            isLoading={proaChartsLoading}
            onExport={() => {
              void handleIndividualExport('proa-chart-servicio', 'PorServicio');
            }}
          />
          <ConductasChart
            cardId="proa-chart-conductas"
            title="Conductas de Infectologia por Servicio"
            subtitle={committeeSubtitle}
            data={conductasData}
            analysis={conductasAnalysis}
            isLoading={proaChartsLoading}
            onExport={() => {
              void handleIndividualExport('proa-chart-conductas', 'Conductas');
            }}
          />
          <AdherenciaChart
            cardId="proa-chart-adherencia"
            title="Adherencia a las Intervenciones"
            subtitle={committeeSubtitle}
            data={adherenciaData}
            analysis={adherenciaAnalysis}
            isLoading={proaChartsLoading}
            onExport={() => {
              void handleIndividualExport('proa-chart-adherencia', 'Adherencia');
            }}
          />
        </div>
      </div>
    </div>
  );
}
