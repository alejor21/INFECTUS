import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#0B3C5D', '#0F8B8D', '#F59E0B', '#8DD3D5', '#5A7D9A', '#B8D4D6', '#D1D5DB'];

interface AntibioticFamilyChartProps {
  data: { family: string; count: number }[];
}

export function AntibioticFamilyChart({ data }: AntibioticFamilyChartProps) {
  const chartData = data.map((d, i) => ({
    name: d.family,
    value: d.count,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-6" style={{ color: '#0B3C5D' }}>
        Distribución por familia de antibióticos
      </h3>
      <div className="h-80">
        {chartData.length === 0 ? (
          <p className="text-gray-600 text-sm text-center pt-32">Sin datos disponibles</p>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
