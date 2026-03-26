import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartEmptyState, ChartLoadingState } from './ChartEmptyState';

interface ConsumptionByServiceChartProps {
  data: { service: string; ddd: number }[];
  loading?: boolean;
}

export function ConsumptionByServiceChart({ data, loading }: ConsumptionByServiceChartProps) {
  const chartData = data.map((item) => ({ servicio: item.service, ddd: item.ddd }));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        Días de terapia por servicio hospitalario
      </h3>
      <div className="h-80">
        {loading ? (
          <ChartLoadingState message="Procesando servicios..." />
        ) : chartData.length === 0 ? (
          <ChartEmptyState message="Sin datos para este período" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="servicio"
                stroke="#6B7280"
                tick={{ fontSize: 11 }}
                angle={-15}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#6B7280"
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
                formatter={(value: number) => [`${value} días`, 'Total']}
              />
              <Bar dataKey="ddd" fill="#0F8B8D" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
