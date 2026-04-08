import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartEmptyState } from './ChartEmptyState';

interface ServicioDistributionChartProps {
  data: { servicio: string; count: number }[];
  loading?: boolean;
}

export function ServicioDistributionChart({ data, loading }: ServicioDistributionChartProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse"></div>
        <div className="h-80 animate-pulse">
          <div className="space-y-4">
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded"></div>
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded w-5/6"></div>
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Limit to top 10 servicios for readability
  const chartData = data.slice(0, 10).map((d) => ({ 
    name: d.servicio, 
    value: d.count 
  }));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        Distribución por Servicio Hospitalario
      </h3>
      <div className="h-80">
        {chartData.length === 0 ? (
          <ChartEmptyState message="No hay servicios registrados" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
              <XAxis
                type="number"
                stroke="#6B7280"
                className="dark:stroke-gray-400"
                style={{ fontSize: '12px' }}
                label={{ 
                  value: 'Número de evaluaciones', 
                  position: 'insideBottom', 
                  offset: -5, 
                  style: { fontSize: '12px', fill: '#6B7280' } 
                }}
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
                formatter={(value: number) => [`${value} evaluaciones`, 'Cantidad']}
              />
              <Bar dataKey="value" fill="#3B82F6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
