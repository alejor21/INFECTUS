import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ChartEmptyState, ChartLoadingState } from './ChartEmptyState';

interface QualityMetricsChartProps {
  metrics: { name: string; value: number; target: number }[];
  loading?: boolean;
}

export function QualityMetricsChart({ metrics, loading }: QualityMetricsChartProps) {
  const chartData = metrics.map((metric) => ({
    indicator: metric.name,
    actual: metric.value,
    objetivo: metric.target,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Radar de calidad clínica</h3>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Resume en una sola vista si las decisiones antimicrobianas se mantienen dentro del estándar esperado.
      </p>

      <div className="h-80">
        {loading ? (
          <ChartLoadingState message="Calculando métricas de calidad..." />
        ) : chartData.length === 0 ? (
          <ChartEmptyState message="Sin datos para este período" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="indicator" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Radar
                name="Hospital"
                dataKey="actual"
                stroke="#0F8B8D"
                fill="#0F8B8D"
                fillOpacity={0.5}
                strokeWidth={2}
              />
              <Radar
                name="Meta"
                dataKey="objetivo"
                stroke="#0B3C5D"
                fill="#0B3C5D"
                fillOpacity={0.2}
                strokeDasharray="5 5"
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
