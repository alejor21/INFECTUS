import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ConsumptionTrendChartProps {
  data: { month: string; ddd: number }[];
}

export function ConsumptionTrendChart({ data }: ConsumptionTrendChartProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-6" style={{ color: '#0B3C5D' }}>
        Tendencia de consumo por familia
      </h3>
      <div className="h-80">
        {data.length === 0 ? (
          <p className="text-gray-600 text-sm text-center pt-32">Sin datos disponibles</p>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="month"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6B7280"
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
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="beta" stroke="#0B3C5D" strokeWidth={2} name="Betalactámicos" dot={{ r: 4 }} />
            <Line type="monotone" dataKey="quinolonas" stroke="#0F8B8D" strokeWidth={2} name="Quinolonas" dot={{ r: 4 }} />
            <Line type="monotone" dataKey="carba" stroke="#F59E0B" strokeWidth={2} name="Carbapenémicos" dot={{ r: 4 }} />
            <Line type="monotone" dataKey="otros" stroke="#8DD3D5" strokeWidth={2} name="Otros" dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
