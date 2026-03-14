import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { month: 'Ago 2025', prescripcion: 82, profilaxis: 88, desescalada: 71 },
  { month: 'Sep 2025', prescripcion: 83, profilaxis: 89, desescalada: 73 },
  { month: 'Oct 2025', prescripcion: 85, profilaxis: 90, desescalada: 74 },
  { month: 'Nov 2025', prescripcion: 84, profilaxis: 91, desescalada: 75 },
  { month: 'Dic 2025', prescripcion: 86, profilaxis: 90, desescalada: 76 },
  { month: 'Ene 2026', prescripcion: 87, profilaxis: 92, desescalada: 77 },
  { month: 'Feb 2026', prescripcion: 87, profilaxis: 91, desescalada: 77 },
];

interface ComplianceChartProps {
  complianceRate: number;
}

export function ComplianceChart({ complianceRate }: ComplianceChartProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-6" style={{ color: '#0B3C5D' }}>
        Evolución del cumplimiento de indicadores
      </h3>
      <div className="h-80">
        {complianceRate === 0 ? (
          <p className="text-gray-600 text-sm text-center pt-32">Sin datos disponibles</p>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPrescripcion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0B3C5D" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#0B3C5D" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorProfilaxis" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0F8B8D" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#0F8B8D" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorDesescalada" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8DD3D5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8DD3D5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="month"
              stroke="#6B7280"
              style={{ fontSize: '11px' }}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              domain={[60, 100]}
              label={{ value: '% Cumplimiento', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#6B7280' } }}
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
            <Area
              type="monotone"
              dataKey="prescripcion"
              stroke="#0B3C5D"
              fillOpacity={1}
              fill="url(#colorPrescripcion)"
              name="Prescripción adecuada"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="profilaxis"
              stroke="#0F8B8D"
              fillOpacity={1}
              fill="url(#colorProfilaxis)"
              name="Profilaxis quirúrgica"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="desescalada"
              stroke="#8DD3D5"
              fillOpacity={1}
              fill="url(#colorDesescalada)"
              name="Desescalada terapéutica"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
