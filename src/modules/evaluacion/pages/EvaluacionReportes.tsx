import { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Filter,
  FileText,
  Activity,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';
import { useEvaluacionContext } from '../context/EvaluacionContext';
import { getEvaluations } from '../lib/evaluacion';
import type { ProaEvaluation } from '../lib/evaluacion';

type PeriodFilter = '3m' | '6m' | '12m' | 'all';

const LEVEL_COLORS: Record<string, string> = {
  avanzado:   '#16a34a',
  basico:     '#d97706',
  inadecuado: '#dc2626',
};

function buildMonthlyTrend(evals: ProaEvaluation[]): { mes: string; pct: number }[] {
  const groups: Record<string, number[]> = {};
  evals.forEach((e) => {
    const [year, month] = e.evaluation_date.split('-');
    const key = `${year}-${month}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(Math.round((e.total_score / 61) * 100));
  });
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, scores]) => {
      const [, month] = key.split('-');
      const months = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      return {
        mes: months[parseInt(month)] ?? month,
        pct: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
      };
    });
}

function buildLevelDist(evals: ProaEvaluation[]): { name: string; value: number; color: string }[] {
  const counts: Record<string, number> = { avanzado: 0, basico: 0, inadecuado: 0 };
  evals.forEach((e) => { if (e.level) counts[e.level] = (counts[e.level] ?? 0) + 1; });
  return [
    { name: 'Avanzado',   value: counts.avanzado,   color: LEVEL_COLORS.avanzado },
    { name: 'Básico',     value: counts.basico,      color: LEVEL_COLORS.basico },
    { name: 'Inadecuado', value: counts.inadecuado,  color: LEVEL_COLORS.inadecuado },
  ].filter((d) => d.value > 0);
}

function filterByPeriod(evals: ProaEvaluation[], period: PeriodFilter): ProaEvaluation[] {
  if (period === 'all') return evals;
  const months = { '3m': 3, '6m': 6, '12m': 12 }[period];
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return evals.filter((e) => new Date(e.evaluation_date) >= cutoff);
}

export function EvaluacionReportes() {
  const navigate = useNavigate();
  const { selectedHospitalId } = useEvaluacionContext();
  const [evaluations, setEvaluations] = useState<ProaEvaluation[]>([]);
  const [loading, setLoading]         = useState(false);
  const [period, setPeriod]           = useState<PeriodFilter>('12m');

  useEffect(() => {
    if (!selectedHospitalId) { setEvaluations([]); return; }
    setLoading(true);
    getEvaluations(selectedHospitalId)
      .then(setEvaluations)
      .finally(() => setLoading(false));
  }, [selectedHospitalId]);

  const filtered   = filterByPeriod(evaluations, period);
  const avgScore   = filtered.length > 0
    ? Math.round(filtered.reduce((s, e) => s + e.total_score, 0) / filtered.length)
    : 0;
  const avgPct     = Math.round((avgScore / 61) * 100);
  const bestScore  = filtered.length > 0 ? Math.max(...filtered.map((e) => e.total_score)) : 0;
  const monthlyTrend = buildMonthlyTrend(filtered);
  const levelDist    = buildLevelDist(filtered);

  return (
    <>
      {/* Back button */}
      <div className="px-8 pt-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] mb-2">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Volver</span>
        </button>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Reportes</h2>
            <p className="text-sm text-slate-500 mt-1">Análisis y visualización de evaluaciones PROA</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            {(['3m', '6m', '12m', 'all'] as PeriodFilter[]).map((p) => {
              const label = { '3m': '3M', '6m': '6M', '12m': '12M', all: 'Todo' }[p];
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                    period === p ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        {!selectedHospitalId ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <BarChart3 className="w-16 h-16 text-gray-200" />
            <p className="text-base font-semibold text-gray-600">Selecciona un hospital</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : evaluations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <FileText className="w-16 h-16 text-gray-200" />
            <p className="text-base font-semibold text-gray-600">Sin evaluaciones registradas</p>
            <p className="text-sm text-gray-400">Registra evaluaciones PROA para visualizar reportes aquí</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Evaluaciones',    value: filtered.length,        color: 'indigo' },
                { label: 'Puntaje Promedio', value: `${avgScore}/61`,      color: 'green' },
                { label: '% Cumplimiento',  value: `${avgPct}%`,           color: 'blue' },
                { label: 'Mejor Puntaje',   value: `${bestScore}/61`,      color: 'purple' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                  <p className="text-sm text-slate-500 mb-1">{label}</p>
                  <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
              {/* Monthly Trend */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Tendencia Mensual</h3>
                    <p className="text-sm text-slate-500 mt-1">% de cumplimiento promedio por mes</p>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                {monthlyTrend.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Sin datos suficientes</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(v: number) => [`${v}%`, 'Cumplimiento']} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="pct" stroke="#4f46e5" strokeWidth={3} dot={{ fill: '#4f46e5', r: 5 }} activeDot={{ r: 7 }} name="Cumplimiento" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Level Distribution */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Distribución por Nivel</h3>
                    <p className="text-sm text-slate-500 mt-1">Avanzado / Básico / Inadecuado</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                {levelDist.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Sin datos</div>
                ) : (
                  <div className="flex items-center gap-8">
                    <ResponsiveContainer width="50%" height={200}>
                      <RePieChart>
                        <Pie data={levelDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" labelLine={false}>
                          {levelDist.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [v, 'evaluaciones']} />
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-3">
                      {levelDist.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm text-slate-600">{item.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-800">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Score by Evaluation (bar chart) */}
            {filtered.length > 1 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Puntajes por Sección</h3>
                    <p className="text-sm text-slate-500 mt-1">Últimas {Math.min(filtered.length, 10)} evaluaciones</p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={filtered.slice(0, 10).reverse().map((e, i) => ({
                    name: `E${i + 1}`,
                    Pre: e.pre_score,
                    Ejecución: e.exec_score,
                    Evaluación: e.eval_score,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Pre" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Ejecución" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Evaluación" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
