import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartEmptyState } from './ChartEmptyState';

interface TopAntibioticsChartProps {
  data: { name: string; count: number }[];
}

export function TopAntibioticsChart({ data }: TopAntibioticsChartProps) {
  const chartData = data.map((d) => ({ name: d.name, value: d.count }));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        Top 5 antibióticos más utilizados
      </h3>
      <div className="h-80">
        {chartData.length === 0 ? (
          <ChartEmptyState message="No hay antibióticos registrados" />
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
            <XAxis
              type="number"
              stroke="#6B7280"
              className="dark:stroke-gray-400"
              style={{ fontSize: '12px' }}
              label={{ value: 'DDD/100 camas-día', position: 'insideBottom', offset: -5, style: { fontSize: '12px', fill: '#6B7280' } }}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#6B7280"
              className="dark:stroke-gray-400"
              style={{ fontSize: '12px' }}
              width={120}
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
            <Bar dataKey="value" fill="#0F8B8D" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
