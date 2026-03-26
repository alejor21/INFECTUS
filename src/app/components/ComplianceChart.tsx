import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartEmptyState, ChartLoadingState } from './ChartEmptyState';

interface ComplianceChartProps {
  data: { month: string; rate: number }[];
  loading?: boolean;
}

export function ComplianceChart({ data, loading }: ComplianceChartProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        Evolución del cumplimiento
      </h3>
      <div className="h-80">
        {loading ? (
          <ChartLoadingState message="Calculando cumplimiento..." />
        ) : data.length === 0 ? (
          <ChartEmptyState message="Sin datos para este período" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F8B8D" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0F8B8D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="month"
                stroke="#6B7280"
                tick={{ fontSize: 11 }}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="#6B7280"
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                label={{
                  value: '% Cumplimiento',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: '12px', fill: '#6B7280' },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value}%`, 'Cumplimiento']}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#0F8B8D"
                fillOpacity={1}
                fill="url(#colorCompliance)"
                name="Cumplimiento"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
