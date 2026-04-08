import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartEmptyState } from './ChartEmptyState';

interface ApprovalByServicioChartProps {
  data: { servicio: string; aprobadas: number; rechazadas: number }[];
  loading?: boolean;
}

export function ApprovalByServicioChart({ data, loading }: ApprovalByServicioChartProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse"></div>
        <div className="h-80 animate-pulse">
          <div className="space-y-4">
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded"></div>
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded w-5/6"></div>
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded w-4/6"></div>
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded w-3/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Limit to top 10 servicios for readability
  const chartData = data.slice(0, 10);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        Aprobación vs Rechazo por Servicio
      </h3>
      <div className="h-80">
        {chartData.length === 0 ? (
          <ChartEmptyState message="No hay datos de aprobación disponibles" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
              <XAxis 
                type="number" 
                stroke="#6B7280"
                className="dark:stroke-gray-400"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                dataKey="servicio"
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
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Bar 
                dataKey="aprobadas" 
                name="Aprobadas" 
                fill="#10B981" 
                radius={[0, 4, 4, 0]}
                stackId="a"
              />
              <Bar 
                dataKey="rechazadas" 
                name="Rechazadas" 
                fill="#EF4444" 
                radius={[0, 4, 4, 0]}
                stackId="a"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
