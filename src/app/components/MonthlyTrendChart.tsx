import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartEmptyState } from './ChartEmptyState';

interface MonthlyTrendChartProps {
  data: { month: string; ddd: number }[];
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        Tendencia mensual de consumo antibiótico
      </h3>
      <div className="h-80">
        {data.length === 0 ? (
          <ChartEmptyState message="No hay datos de consumo disponibles" />
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="month"
              stroke="#6B7280"
              className="dark:stroke-gray-400"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6B7280"
              className="dark:stroke-gray-400"
              style={{ fontSize: '12px' }}
              label={{ value: 'DDD/100 camas-día', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#6B7280' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              className="dark:bg-gray-800 dark:border-gray-600"
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="ddd"
              stroke="#0F8B8D"
              strokeWidth={3}
              name="DDD/100 camas-día"
              dot={{ fill: '#0F8B8D', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
