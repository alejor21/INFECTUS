import { Pill, TrendingDown, Building2 } from 'lucide-react';
import { ConsumptionTrendChart } from '../components/ConsumptionTrendChart';
import { ConsumptionByServiceChart } from '../components/ConsumptionByServiceChart';
import { AntibioticFamilyChart } from '../components/AntibioticFamilyChart';
import { ConsumptionHeatmap } from '../components/ConsumptionHeatmap';
import { DetailedConsumptionTable } from '../components/DetailedConsumptionTable';
import { KPICard } from '../components/KPICard';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useHospitalContext } from '../components/Layout';

const DATE_RANGE_LABEL: Record<'1m' | '6m' | '12m' | 'all', string> = {
  '1m': 'Último mes',
  '6m': 'Últimos 6 meses',
  '12m': 'Último año',
  'all': 'Todos los datos',
};

export function ConsumoAntibioticos() {
  const { selectedHospitalObj, hospitals, dateRange } = useHospitalContext();
  const { kpis, monthlyConsumption, top5Antibiotics, records, loading, avgTherapyDays } = useAnalytics();

  const consumptionByService = records
    .reduce((acc, record) => {
      const service = (record.servicio ?? '').trim();
      if (!service) return acc;

      const days01 = parseFloat(record.diasTerapiaMed01) || 0;
      const days02 = parseFloat(record.diasTerapiaMed02) || 0;
      const existing = acc.find((item) => item.service === service);

      if (existing) {
        existing.ddd += days01 + days02;
      } else {
        acc.push({ service, ddd: days01 + days02 });
      }

      return acc;
    }, [] as { service: string; ddd: number }[])
    .map((item) => ({ ...item, ddd: Math.round(item.ddd * 100) / 100 }))
    .sort((a, b) => b.ddd - a.ddd);

  const uniqueAntibiotics = new Set(
    records.flatMap((record) => [record.antibiotico01, record.antibiotico02].filter((value) => (value ?? '').trim())),
  ).size;
  const uniqueServices = new Set(records.map((record) => (record.servicio ?? '').trim()).filter(Boolean)).size;

  const heatmapData = (() => {
    const map = new Map<string, number>();

    for (const record of records) {
      const service = (record.servicio ?? '').trim();
      const days01 = parseFloat(record.diasTerapiaMed01) || 0;
      const days02 = parseFloat(record.diasTerapiaMed02) || 0;

      for (const [antibioticValue, days] of [
        [record.antibiotico01, days01],
        [record.antibiotico02, days02],
      ] as [string, number][]) {
        const antibiotic = (antibioticValue ?? '').trim();

        if (!antibiotic || !service || days === 0) continue;

        const key = `${antibiotic}||${service}`;
        map.set(key, (map.get(key) ?? 0) + days);
      }
    }

    return Array.from(map.entries()).map(([key, value]) => {
      const [antibiotic, service] = key.split('||');
      return { antibiotic, service, value: Math.round(value * 100) / 100 };
    });
  })();

  const consumptionSparkline = monthlyConsumption.map((item) => item.ddd);

  return (
    <div className={loading ? 'p-8 opacity-50' : 'p-8'}>
      <div className="mb-8">
        <h1 className="mb-1 text-3xl font-bold text-slate-900 dark:text-white">Consumo de antibióticos</h1>
        {selectedHospitalObj ? (
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedHospitalObj.name} · {selectedHospitalObj.city}, {selectedHospitalObj.department}
          </p>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Vista general · Todos los hospitales ({hospitals.length} hospitales, {records.length} registros)
          </p>
        )}
        <p className="mt-0.5 text-xs text-gray-400">{DATE_RANGE_LABEL[dateRange]}</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Días promedio de terapia"
          value={String(Math.round(avgTherapyDays * 10) / 10)}
          unit="días"
          trend={-18.1}
          trendPositive={true}
          sparklineData={consumptionSparkline}
        />
        <KPICard
          title="Prescripciones activas"
          value={String(records.length)}
          unit="pacientes"
          trend={-10.8}
          trendPositive={true}
          sparklineData={consumptionSparkline}
        />
        <KPICard
          title="Adecuación terapéutica"
          value={String(kpis.therapeuticAdequacy)}
          unit="%"
          trend={-4.3}
          trendPositive={true}
          sparklineData={consumptionSparkline}
        />
        <KPICard
          title="Cumplimiento de guías"
          value={String(kpis.guidelineCompliance)}
          unit="%"
          trend={-6.1}
          trendPositive={true}
          sparklineData={consumptionSparkline}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-600">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Antibióticos diferentes</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{uniqueAntibiotics}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-700">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Servicios activos</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{uniqueServices}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <TrendingDown className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Reducción vs 2025</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">-18.1%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ConsumptionTrendChart data={monthlyConsumption} loading={loading} />
        <ConsumptionByServiceChart data={consumptionByService} loading={loading} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AntibioticFamilyChart data={top5Antibiotics.map((item) => ({ family: item.name, count: item.count }))} />
        <ConsumptionHeatmap data={heatmapData} />
      </div>

      <DetailedConsumptionTable records={records} />
    </div>
  );
}
