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
  const { kpis, monthlyConsumption, top5Antibiotics, records, loading } = useAnalytics();

  // Group records by servicio, summing DDD per service
  const consumptionByService = records
    .reduce((acc, r) => {
      const service = (r.servicio ?? '').trim();
      if (!service) return acc;
      const d1 = parseFloat(r.diasTerapiaMed01) || 0;
      const d2 = parseFloat(r.diasTerapiaMed02) || 0;
      const existing = acc.find((x) => x.service === service);
      if (existing) {
        existing.ddd += d1 + d2;
      } else {
        acc.push({ service, ddd: d1 + d2 });
      }
      return acc;
    }, [] as { service: string; ddd: number }[])
    .map((x) => ({ ...x, ddd: Math.round(x.ddd * 100) / 100 }))
    .sort((a, b) => b.ddd - a.ddd);

  // Unique antibiotic and service counts
  const uniqueAntibiotics = new Set(
    records.flatMap((r) => [r.antibiotico01, r.antibiotico02].filter((a) => (a ?? '').trim())),
  ).size;
  const uniqueServices = new Set(records.map((r) => (r.servicio ?? '').trim()).filter(Boolean)).size;

  // Heatmap: antibiotic × service → total therapy days
  const heatmapData = (() => {
    const map = new Map<string, number>();
    for (const r of records) {
      const service = (r.servicio ?? '').trim();
      const d1 = parseFloat(r.diasTerapiaMed01) || 0;
      const d2 = parseFloat(r.diasTerapiaMed02) || 0;
      for (const [ab, days] of [
        [r.antibiotico01, d1],
        [r.antibiotico02, d2],
      ] as [string, number][]) {
        const antibiotic = (ab ?? '').trim();
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

  const consumptionSparkline = monthlyConsumption.map((x) => x.ddd);

  return (
    <div className={loading ? 'p-8 opacity-50' : 'p-8'}>
      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: '#0B3C5D' }}>
          Consumo de Antibióticos
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

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Consumo total DDD"
          value={String(kpis.antibioticUseRate)}
          unit="DDD/100 camas-día"
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0F8B8D' }}>
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Antibióticos diferentes</p>
              <p className="text-2xl font-bold" style={{ color: '#0B3C5D' }}>{uniqueAntibiotics}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0B3C5D' }}>
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Servicios activos</p>
              <p className="text-2xl font-bold" style={{ color: '#0B3C5D' }}>{uniqueServices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100">
              <TrendingDown className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Reducción vs 2025</p>
              <p className="text-2xl font-bold text-green-600">-18.1%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ConsumptionTrendChart data={monthlyConsumption} />
        <ConsumptionByServiceChart data={consumptionByService} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AntibioticFamilyChart data={top5Antibiotics.map((x) => ({ family: x.name, count: x.count }))} />
        <ConsumptionHeatmap data={heatmapData} />
      </div>

      {/* Detailed Table */}
      <DetailedConsumptionTable records={records} />
    </div>
  );
}
