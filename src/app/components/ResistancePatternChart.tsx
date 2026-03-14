import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ResistancePatternChartProps {
  data: { organismo: string; blee: number; carba: number; mrsa: number }[];
}

export function ResistancePatternChart({ data }: ResistancePatternChartProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-6" style={{ color: '#0B3C5D' }}>
        Patrones de resistencia por microorganismo
      </h3>
      <div className="h-80">
        {data.length === 0 ? (
          <p className="text-gray-600 text-sm text-center pt-32">Sin datos disponibles</p>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="organismo"
              stroke="#6B7280"
              style={{ fontSize: '11px' }}
              angle={-15}
              textAnchor="end"
              height={80}
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
            <Bar dataKey="blee" fill="#F59E0B" name="BLEE+" radius={[8, 8, 0, 0]} />
            <Bar dataKey="carba" fill="#DC2626" name="Carbapenemasa" radius={[8, 8, 0, 0]} />
            <Bar dataKey="mrsa" fill="#0B3C5D" name="MRSA" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
