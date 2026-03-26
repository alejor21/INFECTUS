import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartEmptyState, ChartLoadingState } from './ChartEmptyState';

interface ConsumptionTrendChartProps {
  data: { month: string; ddd: number }[];
  loading?: boolean;
}

export function ConsumptionTrendChart({ data, loading }: ConsumptionTrendChartProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        Evolución de días de terapia
      </h3>
      <div className="h-80">
        {loading ? (
          <ChartLoadingState message="Procesando tendencia temporal..." />
        ) : data.length === 0 ? (
          <ChartEmptyState message="Sin datos para este período" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
              <XAxis
                dataKey="month"
                stroke="#6B7280"
                className="dark:stroke-gray-400"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke="#6B7280"
                className="dark:stroke-gray-400"
                tick={{ fontSize: 12 }}
                label={{
                  value: 'Días de terapia',
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
                formatter={(value: number) => [`${value} días`, 'Promedio']}
              />
              <Line
                type="monotone"
                dataKey="ddd"
                stroke="#0F8B8D"
                strokeWidth={3}
                name="Días de terapia"
                dot={{ r: 4, fill: '#0F8B8D' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
