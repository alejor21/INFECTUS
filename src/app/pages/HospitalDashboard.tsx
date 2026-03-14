import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Upload, Loader2, Brain, Calendar, Database,
  BarChart2, CheckSquare, Square, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import { getSupabaseClient } from '../../lib/supabase/client';
import { callAI } from '../../lib/ai/aiClient';
import { processAndSaveExcel } from '../../modules/excel/excelProcessor';
import type { MonthMetrics, HospitalMonthlyMetric, HospitalExcelUpload } from '../../modules/excel/excelProcessor';
import { useAuth } from '../../contexts/AuthContext';

const COLORS = [
  '#0F8B8D', '#5C6BC0', '#EF5350', '#FFA726', '#26A69A',
  '#7E57C2', '#EC407A', '#66BB6A', '#FF7043', '#29B6F6',
];

interface HospitalInfo {
  id: string;
  name: string;
  city: string;
  department: string;
  beds: number | null;
  is_active: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────

function EmptyState({ onUpload }: { onUpload: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
        <Database className="w-10 h-10 text-indigo-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Sin datos cargados</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        Este hospital aún no tiene datos. Sube un Excel para ver métricas, gráficos y análisis IA.
      </p>
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors min-h-[44px]"
      >
        <Upload className="w-4 h-4" />
        Subir Excel
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) onUpload(e.target.files[0]); }}
      />
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color: '#0B3C5D' }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// Horizontal bar chart (antibiotics, microorganisms)
function HBarChart({ data, color = '#0F8B8D' }: { data: Array<{ name: string; count: number }>; color?: string }) {
  const topped = data.slice(0, 8);
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, topped.length * 36)}>
      <BarChart data={topped} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" fill={color} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Pie chart (services)
function ServicePieChart({ data }: { data: Array<{ name: string; count: number }> }) {
  const topped = data.slice(0, 6);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={topped} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
          {topped.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Monthly evolution line chart (row_count per month)
function EvolutionChart({ data }: { data: Array<{ month: string; registros: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="registros" stroke="#0F8B8D" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export function HospitalDashboard() {
  const { hospitalId = '' } = useParams<{ hospitalId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [hospital, setHospital] = useState<HospitalInfo | null>(null);
  const [months, setMonths] = useState<HospitalMonthlyMetric[]>([]);
  const [upload, setUpload] = useState<HospitalExcelUpload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Upload
  const updateRef = useRef<HTMLInputElement>(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);

  // AI
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // Comparison mode
  const [showComparison, setShowComparison] = useState(false);
  const [comparedMonths, setComparedMonths] = useState<string[]>([]);

  const initialMonthSet = useRef(false);

  const loadData = useCallback(async () => {
    if (!hospitalId) return;
    setLoading(true);
    const supabase = getSupabaseClient();
    const [
      { data: hosp },
      { data: monthData },
      { data: uploadData },
    ] = await Promise.all([
      supabase
        .from('hospitals')
        .select('id,name,city,department,beds,is_active')
        .eq('id', hospitalId)
        .single(),
      supabase
        .from('hospital_monthly_metrics')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('month', { ascending: true }),
      supabase
        .from('hospital_excel_uploads')
        .select('id,hospital_id,file_name,file_size,uploaded_at,processed,total_rows,months_found,ai_summary')
        .eq('hospital_id', hospitalId)
        .maybeSingle(),
    ]);

    setHospital(hosp as HospitalInfo | null);
    const metricRows = (monthData ?? []) as HospitalMonthlyMetric[];
    setMonths(metricRows);
    setUpload(uploadData as HospitalExcelUpload | null);

    if (!initialMonthSet.current && metricRows.length > 0) {
      initialMonthSet.current = true;
      setSelectedMonth(metricRows[metricRows.length - 1].month);
    }
    setLoading(false);
  }, [hospitalId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExcelFile = async (file: File) => {
    if (!hospitalId || !user) return;
    setUploadingExcel(true);
    toast.info('Procesando Excel...');
    const result = await processAndSaveExcel(hospitalId, file, user.id);
    if (result.success) {
      toast.success(`Excel procesado: ${result.monthsFound.length} mes${result.monthsFound.length !== 1 ? 'es' : ''}, ${result.totalRows} registros`);
      initialMonthSet.current = false;
      setAiResponse(null);
      await loadData();
    } else {
      toast.error(result.error ?? 'Error al procesar el Excel');
    }
    setUploadingExcel(false);
  };

  const handleAIAnalysis = async () => {
    const currentData = months.find((m) => m.month === selectedMonth);
    if (!currentData || !hospital) return;
    const { metrics } = currentData;

    const antibStr = metrics.topAntibiotics?.slice(0, 5).map((a) => `${a.name} (${a.count})`).join(', ') ?? 'N/D';
    const microStr = metrics.topMicroorganisms?.slice(0, 5).map((m) => `${m.name} (${m.count})`).join(', ') ?? 'N/D';
    const servStr = metrics.topServices?.slice(0, 5).map((s) => `${s.name} (${s.count})`).join(', ') ?? 'N/D';

    const prompt = `Eres un experto en PROA e infectología en Colombia.
Analiza estos datos del mes ${currentData.month_label} del hospital ${hospital.name}:
- Registros: ${currentData.row_count}
- Top antibióticos: ${antibStr}
- Top microorganismos: ${microStr}
- Top servicios: ${servStr}
${metrics.totalDDD ? `- Total DDD: ${metrics.totalDDD.toFixed(2)}` : ''}

Proporciona:
1. Resumen ejecutivo (3 oraciones)
2. Hallazgos principales (3 bullets)
3. Alertas o patrones preocupantes
4. Recomendaciones concretas (3 bullets)
Responde en español, tono profesional médico.`;

    setAiLoading(true);
    setAiResponse(null);
    try {
      const response = await callAI([{ role: 'user', content: prompt }], { maxTokens: 1024 });
      setAiResponse(response.content);
    } catch {
      toast.error('El servicio de IA no está disponible en este momento');
    } finally {
      setAiLoading(false);
    }
  };

  const toggleComparisonMonth = (month: string) => {
    setComparedMonths((prev) => {
      if (prev.includes(month)) return prev.filter((m) => m !== month);
      if (prev.length >= 4) { toast.info('Máximo 4 meses para comparar'); return prev; }
      return [...prev, month];
    });
  };

  // Derived data
  const currentMonthData = months.find((m) => m.month === selectedMonth) ?? null;
  const currentMetrics: MonthMetrics | null = currentMonthData?.metrics ?? null;

  const evolutionData = months.map((m) => ({ month: m.month_label, registros: m.row_count }));

  // Comparison chart data: row_count per month for selected comparison months
  const comparisonSource = showComparison && comparedMonths.length > 0
    ? months.filter((m) => comparedMonths.includes(m.month))
    : months;

  const comparisonChartData = comparisonSource.map((m) => ({
    month: m.month_label,
    registros: m.row_count,
    ...(m.metrics.topAntibiotics ? { topAntibiotic: m.metrics.topAntibiotics[0]?.count ?? 0 } : {}),
  }));

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Hospital no encontrado.</p>
        <button onClick={() => navigate('/hospitales')} className="mt-4 text-indigo-600 text-sm underline">
          Volver a hospitales
        </button>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="p-4 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigate('/hospitales')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Hospitales</span>
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold" style={{ color: '#0B3C5D' }}>{hospital.name}</span>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-500">Dashboard</span>
      </div>

      {/* Page header */}
      <div className="flex flex-wrap items-start gap-4 mb-6 justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-0.5" style={{ color: '#0B3C5D' }}>
            {hospital.name}
          </h1>
          <p className="text-sm text-gray-500">{hospital.city}, {hospital.department}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {months.length > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
                <BarChart2 className="w-3 h-3" />
                {months.length} mes{months.length !== 1 ? 'es' : ''} de datos
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
                Sin datos
              </span>
            )}
            {upload && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Actualizado {new Date(upload.uploaded_at).toLocaleDateString('es-CO')}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => updateRef.current?.click()}
            disabled={uploadingExcel}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors min-h-[44px] disabled:opacity-50"
          >
            {uploadingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {uploadingExcel ? 'Procesando...' : 'Actualizar Excel'}
          </button>
          {months.length > 0 && (
            <button
              onClick={() => setShowComparison((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl min-h-[44px] transition-colors border ${
                showComparison
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Comparar meses
            </button>
          )}
        </div>
      </div>

      <input
        ref={updateRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleExcelFile(e.target.files[0]); }}
      />

      {/* No data: upload zone */}
      {months.length === 0 ? (
        <EmptyState onUpload={handleExcelFile} />
      ) : (
        <>
          {/* Month selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {months.map((m) => (
              <button
                key={m.month}
                onClick={() => { setSelectedMonth(m.month); setAiResponse(null); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] border ${
                  selectedMonth === m.month
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {m.month_label}
              </button>
            ))}
          </div>

          {/* ── Comparison mode ────────────────────────────────────────────── */}
          {showComparison && (
            <div className="bg-white border border-indigo-200 rounded-xl p-5 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Selecciona hasta 4 meses para comparar</h3>
              <div className="flex flex-wrap gap-2 mb-5">
                {months.map((m) => {
                  const selected = comparedMonths.includes(m.month);
                  return (
                    <button
                      key={m.month}
                      onClick={() => toggleComparisonMonth(m.month)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors min-h-[36px] ${
                        selected ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {selected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      {m.month_label}
                    </button>
                  );
                })}
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                  {comparedMonths.length >= 2 ? 'Comparativa de registros' : 'Evolución de registros (todos los meses)'}
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={comparisonChartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="registros" name="Registros" fill="#0F8B8D" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Monthly KPI cards ─────────────────────────────────────────── */}
          {currentMonthData && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KpiCard label="Registros este mes" value={currentMonthData.row_count.toLocaleString()} />
                <KpiCard label="Columnas detectadas" value={currentMetrics?.columns.length ?? 0} />
                <KpiCard label="Período" value={currentMonthData.month_label} />
                {currentMetrics?.topAntibiotics ? (
                  <KpiCard
                    label="Antibióticos únicos"
                    value={currentMetrics.topAntibiotics.length}
                    sub="distintos en el mes"
                  />
                ) : currentMetrics?.totalDDD !== undefined ? (
                  <KpiCard label="Total DDD" value={currentMetrics.totalDDD.toFixed(1)} sub="dosis diarias definidas" />
                ) : (
                  <KpiCard label="Total meses" value={months.length} sub="en el historial" />
                )}
              </div>

              {/* ── Charts ──────────────────────────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                {/* Chart 1: Top Antibióticos */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Top Antibióticos</h4>
                  {currentMetrics?.topAntibiotics && currentMetrics.topAntibiotics.length > 0 ? (
                    <HBarChart data={currentMetrics.topAntibiotics} color="#0F8B8D" />
                  ) : (
                    <p className="text-sm text-gray-400 py-8 text-center">No se detectó columna de antibióticos</p>
                  )}
                </div>

                {/* Chart 2: Top Microorganismos */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Top Microorganismos</h4>
                  {currentMetrics?.topMicroorganisms && currentMetrics.topMicroorganisms.length > 0 ? (
                    <HBarChart data={currentMetrics.topMicroorganisms} color="#7E57C2" />
                  ) : (
                    <p className="text-sm text-gray-400 py-8 text-center">No se detectó columna de microorganismos</p>
                  )}
                </div>

                {/* Chart 3: Top Servicios */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Top Servicios</h4>
                  {currentMetrics?.topServices && currentMetrics.topServices.length > 0 ? (
                    <ServicePieChart data={currentMetrics.topServices} />
                  ) : (
                    <p className="text-sm text-gray-400 py-8 text-center">No se detectó columna de servicios</p>
                  )}
                </div>

                {/* Chart 4: Evolución mensual */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Evolución mensual (registros)</h4>
                  <EvolutionChart data={evolutionData} />
                </div>
              </div>

              {/* ── Numeric summary table ───────────────────────────────── */}
              {currentMetrics && Object.keys(currentMetrics.numericSummary).length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-6">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                    <h4 className="text-sm font-semibold text-gray-700">Resumen de columnas numéricas</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Columna', 'Mínimo', 'Máximo', 'Promedio', 'Total'].map((h) => (
                            <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {Object.entries(currentMetrics.numericSummary).map(([col, stats]) => (
                          <tr key={col} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2.5 text-sm font-medium text-gray-800">{col}</td>
                            <td className="px-4 py-2.5 text-sm text-gray-600">{stats.min.toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-sm text-gray-600">{stats.max.toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-sm text-gray-600">{stats.avg.toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-sm text-gray-600">{stats.sum.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── AI Analysis ──────────────────────────────────────────── */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-500" />
                    <h4 className="text-sm font-semibold text-gray-700">
                      Análisis IA — {currentMonthData.month_label}
                    </h4>
                  </div>
                  <button
                    onClick={handleAIAnalysis}
                    disabled={aiLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-xl transition-colors min-h-[44px]"
                  >
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                    {aiLoading ? 'Analizando...' : 'Analizar con IA'}
                  </button>
                </div>

                {aiResponse ? (
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed text-sm bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                    {aiResponse}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    Haz clic en "Analizar con IA" para obtener un análisis profesional de los datos del mes seleccionado.
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
