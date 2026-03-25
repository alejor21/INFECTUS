import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChartEmptyState } from './ChartEmptyState';

interface ConductaDistributionChartProps {
  data: { conducta: string; count: number }[];
  loading?: boolean;
}

const COLORS = ['#0F8B8D', '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6'];

export function ConductaDistributionChart({ data, loading }: ConductaDistributionChartProps) {
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
    name: d.conducta, 
    value: d.count 
  }));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        Distribución de Conductas Generales
      </h3>
      <div className="h-80">
        {chartData.length === 0 ? (
          <ChartEmptyState message="No hay conductas registradas" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
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
