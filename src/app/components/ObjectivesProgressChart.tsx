import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartEmptyState, ChartLoadingState } from './ChartEmptyState';

interface ObjectivesProgressChartProps {
  objectives: { name: string; current: number; target: number }[];
  loading?: boolean;
}

export function ObjectivesProgressChart({ objectives, loading }: ObjectivesProgressChartProps) {
  const chartData = objectives.map((objective) => ({
    name: objective.name,
    actual: objective.current,
    objetivo: objective.target,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        Progreso frente a metas clínicas
      </h3>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Compara el comportamiento actual del hospital con las metas de referencia del programa PROA.
      </p>

      <div className="h-80">
        {loading ? (
          <ChartLoadingState message="Preparando metas clínicas..." />
        ) : chartData.length === 0 ? (
          <ChartEmptyState message="Sin datos para este período" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="horizontal">
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
              <XAxis type="number" stroke="#6B7280" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" stroke="#6B7280" tick={{ fontSize: 11 }} width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="actual" radius={[0, 8, 8, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`objective-cell-${entry.name}-${index}`}
                    fill={entry.actual >= entry.objetivo ? '#0F8B8D' : '#F59E0B'}
                  />
                ))}
              </Bar>
              <Bar dataKey="objetivo" fill="#E5E7EB" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-teal-600"></div>
          <span className="text-gray-600 dark:text-gray-400">Meta alcanzada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-amber-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Requiere seguimiento</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-gray-300 dark:bg-gray-600"></div>
          <span className="text-gray-600 dark:text-gray-400">Meta de referencia</span>
        </div>
      </div>
    </div>
  );
}
