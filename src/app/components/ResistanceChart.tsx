import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ResistanceChartProps {
  data: { servicio: string; ecoli: number; kpneumoniae: number; pseudomonas: number }[];
}

export function ResistanceChart({ data }: ResistanceChartProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-6" style={{ color: '#0B3C5D' }}>
        Resistencia bacteriana por servicio hospitalario
      </h3>
      <div className="h-80">
        {data.length === 0 ? (
          <p className="text-gray-600 text-sm text-center pt-32">Sin datos disponibles</p>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="servicio"
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
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Bar dataKey="ecoli" fill="#0B3C5D" name="E. coli" radius={[8, 8, 0, 0]} />
            <Bar dataKey="kpneumoniae" fill="#0F8B8D" name="K. pneumoniae" radius={[8, 8, 0, 0]} />
            <Bar dataKey="pseudomonas" fill="#8DD3D5" name="P. aeruginosa" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
