import {
  AlertCircle,
  Award,
  BarChart3,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { BenchmarkComparisonChart } from '../components/BenchmarkComparisonChart';
import { ComplianceChart } from '../components/ComplianceChart';
import { EmptyState } from '../components/EmptyState';
import { IndicatorCard } from '../components/IndicatorCard';
import { IndicatorsTable } from '../components/IndicatorsTable';
import type { ProaIndicatorRow } from '../components/IndicatorsTable';
import { InfoTooltip } from '../components/Tooltip';
import { ObjectivesProgressChart } from '../components/ObjectivesProgressChart';
import { QualityMetricsChart } from '../components/QualityMetricsChart';
import { useHospitalContext } from '../components/Layout';
import { useAnalytics } from '../../hooks/useAnalytics';
import type { InterventionRecord } from '../../types';

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
  '1m': 'Último mes',
  '6m': 'Últimos 6 meses',
  '12m': 'Último año',
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

    return 'Requiere revisión';
  }

  if (value >= objective) {
    return 'Comportamiento esperado';
  }

  if (value >= objective - 10) {
    return 'Vigilar';
  }

  return 'Requiere revisión';
}

export function IndicadoresPROA() {
  const navigate = useNavigate();
  const { selectedHospitalObj, dateRange } = useHospitalContext();
  const { kpis, monthlyCompliance, records, loading, cultivosPreRate, avgTherapyDays } = useAnalytics();

  const totalRecords = records.length;
  const actualizacion = latestDateLabel(records);
  const noHospitalSelected = !selectedHospitalObj;
  const noAnalyticsData = selectedHospitalObj && !loading && totalRecords === 0;

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
    { name: 'Adecuación terapéutica', value: kpis.therapeuticAdequacy, benchmark: 85 },
    { name: 'Terapia empírica apropiada', value: kpis.guidelineCompliance, benchmark: 85 },
    { name: 'Cultivos previos', value: cultivosPreRate, benchmark: 80 },
    { name: 'Ajuste por cultivo', value: proa007, benchmark: 75 },
  ];

  const proaRows: ProaIndicatorRow[] = [
    {
      codigo: 'PROA-001',
      indicador: 'Tasa de prescripción adecuada',
      valor: Math.round(kpis.therapeuticAdequacy * 10) / 10,
      objetivo: 85,
      unidad: '%',
      tendencia: kpis.therapeuticAdequacy >= 85 ? 'up' : 'down',
      frecuencia: 'Mensual',
      ultimaActualizacion: actualizacion,
    },
    {
      codigo: 'PROA-002',
      indicador: 'Días promedio de terapia',
      valor: Math.round(avgTherapyDays * 10) / 10,
      objetivo: 7,
      unidad: 'días',
      lowIsBetter: true,
      tendencia: avgTherapyDays <= 7 ? 'up' : 'down',
      frecuencia: 'Mensual',
      ultimaActualizacion: actualizacion,
    },
    {
      codigo: 'PROA-003',
      indicador: 'Interconsultas a infectología',
      valor: proa003,
      objetivo: 90,
      unidad: '%',
      tendencia: proa003 >= 90 ? 'up' : 'down',
      frecuencia: 'Mensual',
      ultimaActualizacion: actualizacion,
    },
    {
      codigo: 'PROA-004',
      indicador: 'Desescalada terapéutica',
      valor: proa004,
      objetivo: 70,
      unidad: '%',
      tendencia: proa004 >= 70 ? 'up' : 'down',
      frecuencia: 'Mensual',
      ultimaActualizacion: actualizacion,
    },
    {
      codigo: 'PROA-005',
      indicador: 'Terapia empírica apropiada',
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
      title: 'Aprobación terapéutica',
      value: `${Math.round(kpis.therapeuticAdequacy * 10) / 10}%`,
      status: getStatusText(kpis.therapeuticAdequacy, 85),
      description: 'Mide cuántas prescripciones quedaron alineadas con la recomendación del equipo PROA.',
    },
    {
      title: 'Cultivos previos',
      value: `${cultivosPreRate}%`,
      status: getStatusText(cultivosPreRate, 80),
      description: 'Ayuda a validar si la toma de muestras ocurre antes de iniciar antimicrobianos.',
    },
    {
      title: 'Duración promedio',
      value: `${Math.round(avgTherapyDays * 10) / 10} días`,
      status: getStatusText(avgTherapyDays, 7, true),
      description: 'Resume si el tiempo total de terapia se mantiene dentro del rango esperado del programa.',
    },
  ];

  if (noHospitalSelected) {
    return (
      <div className="p-8">
        <div className="mb-8 flex items-center gap-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analíticas PROA</h1>
          <InfoTooltip content="Reportes automáticos basados en tus evaluaciones PROA" />
        </div>
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
          <EmptyState
            icon={Building2}
            title="Primero selecciona o crea un hospital para comenzar"
            description="Selecciona un hospital activo para consultar las analíticas del programa PROA."
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analíticas PROA</h1>
          <InfoTooltip content="Reportes automáticos basados en tus evaluaciones PROA" />
        </div>
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
          <EmptyState
            icon={FileSpreadsheet}
            title="Sin datos para el período seleccionado"
            description="Sube un archivo Excel o registra evaluaciones para ver las analíticas de este hospital."
            action={{ label: 'Subir Excel', onClick: () => navigate('/hospitales') }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={loading ? 'p-8 opacity-50' : 'p-8'}>
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analíticas PROA</h1>
          <InfoTooltip content="Reportes automáticos basados en tus evaluaciones PROA" />
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedHospitalObj.name} · {selectedHospitalObj.city}, {selectedHospitalObj.department}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          Basado en {records.length} evaluaciones · {DATE_RANGE_LABEL[dateRange]}
        </p>
      </div>

      <div className="mb-8 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/30">
        <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
        <div>
          <h4 className="mb-1 font-semibold text-blue-900 dark:text-blue-200">Cómo leer esta pantalla</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Aquí ves los indicadores más útiles para decidir si el uso de antimicrobianos va en la dirección
            esperada. Última actualización disponible: {actualizacion}.
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
          title="Aprobación terapéutica"
          value={kpis.therapeuticAdequacy}
          unit="%"
          target="85"
          status={kpis.therapeuticAdequacy >= 85 ? 'achieved' : 'progress'}
          description="Proporción de terapias aprobadas o alineadas con el criterio del equipo PROA."
        />
        <IndicatorCard
          icon={TrendingUp}
          title="Duración promedio de terapia"
          value={Math.round(avgTherapyDays * 10) / 10}
          unit="días"
          target="7"
          status={avgTherapyDays <= 7 ? 'achieved' : 'warning'}
          description="Promedio de duración de terapia registrado por evaluación en el período analizado."
        />
        <IndicatorCard
          icon={CheckCircle2}
          title="Interconsultas a infectología"
          value={proa003}
          unit="%"
          target="90"
          status={proa003 >= 90 ? 'achieved' : 'progress'}
          description="Proporción de casos con tipo de intervención IC."
        />
        <IndicatorCard
          icon={Award}
          title="Desescalada terapéutica"
          value={proa004}
          unit="%"
          target="70"
          status={proa004 >= 70 ? 'achieved' : 'progress'}
          description="Casos donde se registró desescalada según la conducta general."
        />
        <IndicatorCard
          icon={BarChart3}
          title="Terapia empírica apropiada"
          value={kpis.guidelineCompliance}
          unit="%"
          target="85"
          status={kpis.guidelineCompliance >= 85 ? 'achieved' : 'progress'}
          description="Evalúa si el tratamiento inicial fue adecuado para el escenario clínico registrado."
        />
        <IndicatorCard
          icon={AlertCircle}
          title="Ajuste por cultivo"
          value={proa007}
          unit="%"
          target="75"
          status={proa007 >= 75 ? 'achieved' : proa007 >= 60 ? 'progress' : 'warning'}
          description="Mide cuántos tratamientos fueron ajustados cuando ya existían resultados microbiológicos."
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ComplianceChart data={monthlyCompliance} loading={loading} />
        <QualityMetricsChart
          loading={loading}
          metrics={[
            { name: 'Adecuación', value: kpis.therapeuticAdequacy, target: 90 },
            { name: 'Cumplimiento', value: kpis.guidelineCompliance, target: 85 },
            { name: 'Cultivos previos', value: cultivosPreRate, target: 80 },
          ]}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ObjectivesProgressChart
          loading={loading}
          objectives={[
            { name: 'Días promedio de terapia', current: avgTherapyDays, target: 7 },
            { name: 'Adecuación terapéutica', current: kpis.therapeuticAdequacy, target: 90 },
          ]}
        />
        <BenchmarkComparisonChart data={benchmarkData} loading={loading} />
      </div>

      <IndicatorsTable rows={proaRows} />
    </div>
  );
}
