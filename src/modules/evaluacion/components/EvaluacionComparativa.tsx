import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Award, TrendingUp, TrendingDown, AlertTriangle, Minus } from 'lucide-react';
import type { ProaEvaluation } from '../lib/evaluacion';

interface EvaluacionComparativaProps {
  evaluations: ProaEvaluation[];
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const LEVEL_CONFIG = {
  avanzado: { label: 'Avanzado', className: 'bg-green-100 text-green-700 border-green-200' },
  basico: { label: 'Básico', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  inadecuado: { label: 'Inadecuado', className: 'bg-red-100 text-red-700 border-red-200' },
};

export function EvaluacionComparativa({ evaluations }: EvaluacionComparativaProps) {
  const sorted = useMemo(
    () =>
      [...evaluations].sort(
        (a, b) =>
          new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime(),
      ),
    [evaluations],
  );

  const lineData = useMemo(
    () => sorted.map((e) => ({ date: formatShort(e.evaluation_date), total: e.total_score })),
    [sorted],
  );

  const barData = useMemo(
    () =>
      sorted.map((e) => ({
        date: formatShort(e.evaluation_date),
        Pre: e.pre_score,
        'Ejec.': e.exec_score,
        'Eval.': e.eval_score,
      })),
    [sorted],
  );

  const bestEval = useMemo(
    () => sorted.reduce((b, e) => (e.total_score > b.total_score ? e : b), sorted[0]),
    [sorted],
  );

  const mostRecent = sorted[sorted.length - 1];
  const prevEval = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
  const delta = prevEval !== null ? mostRecent.total_score - prevEval.total_score : 0;

  const weakestSection = useMemo(() => {
    const totalPre = sorted.reduce((s, e) => s + e.pre_score, 0);
    const maxPre = sorted.reduce((s, e) => s + e.pre_max, 0);
    const totalExec = sorted.reduce((s, e) => s + e.exec_score, 0);
    const maxExec = sorted.reduce((s, e) => s + e.exec_max, 0);
    const totalEval = sorted.reduce((s, e) => s + e.eval_score, 0);
    const maxEval = sorted.reduce((s, e) => s + e.eval_max, 0);

    const sections = [
      { label: 'Pre-implementación', pct: maxPre > 0 ? totalPre / maxPre : 0 },
      { label: 'Ejecución', pct: maxExec > 0 ? totalExec / maxExec : 0 },
      { label: 'Evaluación', pct: maxEval > 0 ? totalEval / maxEval : 0 },
    ];
    return sections.reduce((w, s) => (s.pct < w.pct ? s : w), sections[0]);
  }, [sorted]);

  if (evaluations.length < 2) return null;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
      {/* Insights Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Best Score */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
          <Award className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
          <p className="text-xs text-gray-500 mb-0.5">Mejor puntaje</p>
          <p className="text-2xl font-bold text-gray-800">{bestEval.total_score}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatShort(bestEval.evaluation_date)}</p>
        </div>

        {/* Most Recent */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
          <Award className="w-5 h-5 text-indigo-500 mx-auto mb-1.5" />
          <p className="text-xs text-gray-500 mb-0.5">Última evaluación</p>
          <p className="text-2xl font-bold text-gray-800">{mostRecent.total_score}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatShort(mostRecent.evaluation_date)}</p>
        </div>

        {/* Delta */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
          {delta > 0 ? (
            <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1.5" />
          ) : delta < 0 ? (
            <TrendingDown className="w-5 h-5 text-red-500 mx-auto mb-1.5" />
          ) : (
            <Minus className="w-5 h-5 text-gray-400 mx-auto mb-1.5" />
          )}
          <p className="text-xs text-gray-500 mb-0.5">Variación reciente</p>
          <p
            className={`text-2xl font-bold ${
              delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            {delta > 0 ? '+' : ''}
            {delta}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">vs. anterior</p>
        </div>

        {/* Weakest Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
          <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1.5" />
          <p className="text-xs text-gray-500 mb-0.5">Sección más débil</p>
          <p className="text-sm font-bold text-gray-700 leading-tight">{weakestSection.label}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {Math.round(weakestSection.pct * 100)}% cumplimiento
          </p>
        </div>
      </div>

      {/* Line Chart — score evolution */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Evolución del puntaje total
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={lineData} margin={{ top: 8, right: 24, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 61]} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: number | string) => [`${value} pts`, 'Total']}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <ReferenceLine
              y={56}
              stroke="#16a34a"
              strokeDasharray="4 4"
              label={{
                value: 'Avanzado (56)',
                position: 'insideTopRight',
                fontSize: 10,
                fill: '#16a34a',
              }}
            />
            <ReferenceLine
              y={31}
              stroke="#d97706"
              strokeDasharray="4 4"
              label={{
                value: 'Básico (31)',
                position: 'insideTopRight',
                fontSize: 10,
                fill: '#d97706',
              }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#4f46e5"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#4f46e5' }}
              activeDot={{ r: 6 }}
              name="Puntaje total"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart — section breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Desglose por sección</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top: 8, right: 24, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Pre" fill="#818cf8" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Ejec." fill="#2dd4bf" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Eval." fill="#a78bfa" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-700 p-4 border-b border-gray-100">
          Tabla comparativa
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-2.5 font-medium">Fecha</th>
                <th className="text-center px-3 py-2.5 font-medium">Evaluador</th>
                <th className="text-center px-3 py-2.5 font-medium">Pre</th>
                <th className="text-center px-3 py-2.5 font-medium">Ejec.</th>
                <th className="text-center px-3 py-2.5 font-medium">Eval.</th>
                <th className="text-center px-3 py-2.5 font-medium">Total</th>
                <th className="text-center px-3 py-2.5 font-medium">Nivel</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => {
                const isBest = e.id === bestEval.id;
                const level = e.level ?? 'inadecuado';
                const levelCfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.inadecuado;
                return (
                  <tr
                    key={e.id}
                    className={`border-t border-gray-100 ${isBest ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-4 py-3 text-gray-700">{formatDate(e.evaluation_date)}</td>
                    <td className="px-3 py-3 text-center text-xs text-gray-500">
                      {e.evaluator_name ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-600">
                      {e.pre_score}/{e.pre_max}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-600">
                      {e.exec_score}/{e.exec_max}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-600">
                      {e.eval_score}/{e.eval_max}
                    </td>
                    <td
                      className={`px-3 py-3 text-center font-bold ${
                        isBest ? 'text-indigo-700' : 'text-gray-800'
                      }`}
                    >
                      {e.total_score}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${levelCfg.className}`}
                      >
                        {levelCfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
