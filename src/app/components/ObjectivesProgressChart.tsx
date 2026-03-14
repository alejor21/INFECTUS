import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface ObjectivesProgressChartProps {
  objectives: { name: string; current: number; target: number }[];
}

export function ObjectivesProgressChart({ objectives }: ObjectivesProgressChartProps) {
  const chartData = objectives.map((d) => ({
    name: d.name,
    actual: d.current,
    objetivo: d.target,
  }));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-6" style={{ color: '#0B3C5D' }}>
        Progreso vs Objetivos PROA
      </h3>
      <div className="h-80">
        {chartData.length === 0 ? (
          <p className="text-gray-600 text-sm text-center pt-32">Sin datos disponibles</p>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              type="number"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#6B7280"
              style={{ fontSize: '11px' }}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="actual" radius={[0, 8, 8, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.actual >= entry.objetivo ? '#0F8B8D' : '#F59E0B'}
                />
              ))}
            </Bar>
            <Bar dataKey="objetivo" fill="#E5E7EB" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>
      <div className="mt-4 flex items-center justify-center space-x-6 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#0F8B8D' }}></div>
          <span className="text-gray-600">Objetivo alcanzado</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span className="text-gray-600">Por debajo del objetivo</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-gray-300"></div>
          <span className="text-gray-600">Meta establecida</span>
        </div>
      </div>
    </div>
  );
}
