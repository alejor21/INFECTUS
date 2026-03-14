import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface QualityMetricsChartProps {
  metrics: { name: string; value: number; target: number }[];
}

export function QualityMetricsChart({ metrics }: QualityMetricsChartProps) {
  const chartData = metrics.map((d) => ({
    indicator: d.name,
    actual: d.value,
    objetivo: d.target,
  }));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-6" style={{ color: '#0B3C5D' }}>
        Radar de métricas de calidad
      </h3>
      <div className="h-80">
        {chartData.length === 0 ? (
          <p className="text-gray-600 text-sm text-center pt-32">Sin datos disponibles</p>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis
              dataKey="indicator"
              style={{ fontSize: '12px', fill: '#6B7280' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              style={{ fontSize: '11px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Radar
              name="Valor actual"
              dataKey="actual"
              stroke="#0F8B8D"
              fill="#0F8B8D"
              fillOpacity={0.5}
              strokeWidth={2}
            />
            <Radar
              name="Objetivo"
              dataKey="objetivo"
              stroke="#0B3C5D"
              fill="#0B3C5D"
              fillOpacity={0.2}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </RadarChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
