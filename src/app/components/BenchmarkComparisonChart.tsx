import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartEmptyState, ChartLoadingState } from './ChartEmptyState';

interface BenchmarkComparisonChartProps {
  data: { name: string; value: number; benchmark: number }[];
  loading?: boolean;
}

export function BenchmarkComparisonChart({ data, loading }: BenchmarkComparisonChartProps) {
  const chartData = data.map((item) => ({
    categoria: item.name,
    hospital: item.value,
    meta: item.benchmark,
  }));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        Comparativa contra meta PROA
      </h3>
      <div className="h-80">
        {loading ? (
          <ChartLoadingState message="Preparando comparativa..." />
        ) : chartData.length === 0 ? (
          <ChartEmptyState message="Sin datos para este período" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="categoria"
                stroke="#6B7280"
                tick={{ fontSize: 11 }}
                angle={-15}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#6B7280"
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                label={{
                  value: '% Cumplimiento',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: '12px', fill: '#6B7280' },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value}%`, 'Valor']}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="hospital" fill="#0B3C5D" name="Valor actual" radius={[8, 8, 0, 0]} />
              <Bar dataKey="meta" fill="#0F8B8D" name="Meta" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
