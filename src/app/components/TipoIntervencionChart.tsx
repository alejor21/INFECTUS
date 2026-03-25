import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChartEmptyState } from './ChartEmptyState';

interface TipoIntervencionChartProps {
  data: { tipo: string; count: number }[];
  loading?: boolean;
}

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

export function TipoIntervencionChart({ data, loading }: TipoIntervencionChartProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse"></div>
        <div className="h-80 flex items-center justify-center">
          <div className="w-64 h-64 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
        </div>
      </div>
    );
  }

  const chartData = data.map((d) => ({ 
    name: d.tipo, 
    value: d.count 
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
        Tipos de Intervención
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Total: {total} intervenciones
      </p>
      <div className="h-80">
        {chartData.length === 0 ? (
          <ChartEmptyState message="No hay tipos de intervención registrados" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                className="dark:bg-gray-800 dark:border-gray-600"
                formatter={(value: number) => [`${value} registros`, 'Cantidad']}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
