import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ResistanceTrendChartProps {
  data: { month: string; ecoli: number; kpneu: number; mrsa: number; pseudo: number }[];
}

export function ResistanceTrendChart({ data }: ResistanceTrendChartProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-6" style={{ color: '#0B3C5D' }}>
        Evolución temporal de resistencias
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
              label={{ value: '% Resistencia', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#6B7280' } }}
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
            <Line type="monotone" dataKey="ecoli" stroke="#0B3C5D" strokeWidth={2} name="E. coli BLEE+" dot={{ r: 4 }} />
            <Line type="monotone" dataKey="kpneu" stroke="#0F8B8D" strokeWidth={2} name="K. pneumoniae BLEE+" dot={{ r: 4 }} />
            <Line type="monotone" dataKey="mrsa" stroke="#F59E0B" strokeWidth={2} name="MRSA" dot={{ r: 4 }} />
            <Line type="monotone" dataKey="pseudo" stroke="#DC2626" strokeWidth={2} name="P. aerug. MDR" dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
