import { Target, TrendingUp, AlertCircle, CheckCircle2, Award, BarChart3 } from 'lucide-react';
import { IndicatorCard } from '../components/IndicatorCard';
import { ComplianceChart } from '../components/ComplianceChart';
import { QualityMetricsChart } from '../components/QualityMetricsChart';
import { ObjectivesProgressChart } from '../components/ObjectivesProgressChart';
import { IndicatorsTable } from '../components/IndicatorsTable';
import type { ProaIndicatorRow } from '../components/IndicatorsTable';
import { BenchmarkComparisonChart } from '../components/BenchmarkComparisonChart';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useHospitalContext } from '../components/Layout';
import type { InterventionRecord } from '../../types';

function pct(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 10000) / 100;
}

function latestDateLabel(records: InterventionRecord[]): string {
  let latest: Date | null = null;
  for (const r of records) {
    const trimmed = (r.fecha ?? '').trim();
    const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const ymd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    let d: Date | null = null;
    if (dmy) d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    else if (ymd) d = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    if (d && !isNaN(d.getTime()) && (!latest || d > latest)) latest = d;
  }
  if (!latest) return '—';
  const dd = String(latest.getDate()).padStart(2, '0');
  const mm = String(latest.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${latest.getFullYear()}`;
}

const DATE_RANGE_LABEL: Record<'1m' | '6m' | '12m' | 'all', string> = {
  '1m': 'Último mes',
  '6m': 'Últimos 6 meses',
  '12m': 'Último año',
  'all': 'Todos los datos',
};

export function IndicadoresPROA() {
  const { selectedHospitalObj, hospitals, dateRange } = useHospitalContext();
  const { kpis, monthlyCompliance, records, loading } = useAnalytics();

  const latestComplianceRate = monthlyCompliance[monthlyCompliance.length - 1]?.rate ?? 0;

  const n = records.length;
  const actualizacion = latestDateLabel(records);

  const proa003 = pct(records.filter((r) => (r.tipoIntervencion ?? '').trim().toUpperCase() === 'IC').length, n);
  const proa004 = pct(records.filter((r) => (r.conductaGeneral ?? '').toUpperCase().includes('DESESCALONA')).length, n);
  const proa006 = pct(records.filter((r) => (r.cultivosPrevios ?? '').trim().toUpperCase() === 'SI').length, n);
  const proa007 = pct(records.filter((r) => (r.ajustePorCultivo ?? '').trim().toUpperCase() === 'SI').length, n);

  const proaRows: ProaIndicatorRow[] = [
    { codigo: 'PROA-001', indicador: 'Tasa de prescripción adecuada',   valor: Math.round(kpis.therapeuticAdequacy * 10) / 10, objetivo: 85, tendencia: kpis.therapeuticAdequacy >= 85 ? 'up' : 'down', frecuencia: 'Mensual', ultimaActualizacion: actualizacion },
    { codigo: 'PROA-002', indicador: 'Reducción de consumo DDD',         valor: Math.round(kpis.antibioticUseRate * 10) / 10,   objetivo: 40, tendencia: kpis.antibioticUseRate >= 40  ? 'up' : 'down', frecuencia: 'Mensual', ultimaActualizacion: actualizacion },
    { codigo: 'PROA-003', indicador: 'Interconsultas a infectología',    valor: proa003, objetivo: 90, tendencia: proa003 >= 90 ? 'up' : 'down', frecuencia: 'Mensual', ultimaActualizacion: actualizacion },
    { codigo: 'PROA-004', indicador: 'Desescalada terapéutica',          valor: proa004, objetivo: 70, tendencia: proa004 >= 70 ? 'up' : 'down', frecuencia: 'Mensual', ultimaActualizacion: actualizacion },
    { codigo: 'PROA-005', indicador: 'Terapia empírica apropiada',       valor: Math.round(kpis.guidelineCompliance * 10) / 10, objetivo: 85, tendencia: kpis.guidelineCompliance >= 85 ? 'up' : 'down', frecuencia: 'Mensual', ultimaActualizacion: actualizacion },
    { codigo: 'PROA-006', indicador: 'Cultivos previos al inicio',       valor: proa006, objetivo: 80, tendencia: proa006 >= 80 ? 'up' : 'down', frecuencia: 'Mensual', ultimaActualizacion: actualizacion },
    { codigo: 'PROA-007', indicador: 'Ajuste por cultivo',               valor: proa007, objetivo: 75, tendencia: proa007 >= 75 ? 'up' : 'down', frecuencia: 'Mensual', ultimaActualizacion: actualizacion },
  ];

  return (
    <div className={loading ? 'p-8 opacity-50' : 'p-8'}>
      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: '#0B3C5D' }}>
          Indicadores PROA
        </h1>
        {selectedHospitalObj ? (
          <p className="text-sm font-medium text-gray-700">
            {selectedHospitalObj.name} · {selectedHospitalObj.city}, {selectedHospitalObj.department}
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            Vista general — Todos los hospitales ({hospitals.length} hospitales, {records.length} registros)
          </p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">{DATE_RANGE_LABEL[dateRange]}</p>
      </div>

      {/* Alert Banner */}
      <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <h4 className="font-semibold text-blue-900 mb-1">Actualización de indicadores</h4>
          <p className="text-sm text-blue-700">
            Los datos se actualizan diariamente a las 06:00 AM. Última actualización: {actualizacion}
          </p>
        </div>
      </div>

      {/* Indicator Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <IndicatorCard
          icon={Target}
          title="Tasa de prescripción adecuada"
          value={kpis.therapeuticAdequacy}
          unit="%"
          target="85"
          status={kpis.therapeuticAdequacy >= 85 ? 'achieved' : 'progress'}
          description="Porcentaje de prescripciones que cumplen con las guías clínicas establecidas"
        />
        <IndicatorCard
          icon={TrendingUp}
          title="Reducción de consumo DDD"
          value={kpis.antibioticUseRate}
          unit="%"
          target="40"
          status={kpis.antibioticUseRate >= 40 ? 'achieved' : 'progress'}
          description="Disminución en el consumo de antibióticos comparado con el trimestre anterior"
        />
        <IndicatorCard
          icon={CheckCircle2}
          title="Interconsultas a infectología"
          value={proa003}
          unit="%"
          target="90"
          status={proa003 >= 90 ? 'achieved' : 'progress'}
          description="Proporción de casos con tipo de intervención IC"
        />
        <IndicatorCard
          icon={Award}
          title="Desescalada terapéutica"
          value={proa004}
          unit="%"
          target="70"
          status={proa004 >= 70 ? 'achieved' : 'progress'}
          description="Casos donde se realizó desescalada según resultados microbiológicos"
        />
        <IndicatorCard
          icon={BarChart3}
          title="Terapia empírica apropiada"
          value={kpis.guidelineCompliance}
          unit="%"
          target="85"
          status={kpis.guidelineCompliance >= 85 ? 'achieved' : 'progress'}
          description="Cumplimiento de terapia empírica apropiada"
        />
        <IndicatorCard
          icon={AlertCircle}
          title="Ajuste por cultivo"
          value={proa007}
          unit="%"
          target="75"
          status={proa007 >= 75 ? 'achieved' : proa007 >= 60 ? 'progress' : 'warning'}
          description="Porcentaje de tratamientos ajustados según resultados de cultivo"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ComplianceChart complianceRate={latestComplianceRate} />
        <QualityMetricsChart
          metrics={[
            { name: 'Adecuación', value: kpis.therapeuticAdequacy, target: 90 },
            { name: 'Cumplimiento', value: kpis.guidelineCompliance, target: 85 },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ObjectivesProgressChart
          objectives={[
            { name: 'Tasa antibióticos', current: kpis.antibioticUseRate, target: 40 },
            { name: 'Adecuación terapéutica', current: kpis.therapeuticAdequacy, target: 90 },
          ]}
        />
        <BenchmarkComparisonChart data={[]} />
      </div>

      {/* Detailed Indicators Table */}
      <IndicatorsTable rows={proaRows} />
    </div>
  );
}
