import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Upload, Loader2, Brain, Calendar, Database,
  BarChart2, CheckSquare, Square, RefreshCw, Download, FileDown,
  TrendingUp, Activity, FileSpreadsheet, X,
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
  '#0D9488', '#3B82F6', '#EF4444', '#F59E0B', '#10B981',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4',
];

interface HospitalInfo {
  id: string;
  name: string;
  city: string;
  department: string;
  beds: number | null;
  is_active: boolean;
}

interface EvaluationMetricRow {
  id: string;
  mes: number | null;
  anio: number | null;
  fecha: string | null;
  servicio: string | null;
  diagnostico: string | null;
  antibiotico_01: string | null;
  antibiotico_02: string | null;
  edad: number | null;
  dias_terapia_01: number | null;
  dias_terapia_02: number | null;
  cod_diagnostico: string | null;
  nombre_paciente: string | null;
  cama: string | null;
  observaciones: string | null;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function parseEvaluationMonth(row: EvaluationMetricRow): { year: number; month: number } | null {
  if (row.anio && row.mes) {
    return { year: row.anio, month: row.mes };
  }

  if (!row.fecha) {
    return null;
  }

  const parsedDate = new Date(row.fecha);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return {
    year: parsedDate.getFullYear(),
    month: parsedDate.getMonth() + 1,
  };
}

function topFrequent(map: Map<string, number>, limit: number): Array<{ name: string; count: number }> {
  return Array.from(map.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function calculateMetricsFromEvaluaciones(rows: EvaluationMetricRow[]): MonthMetrics {
  if (rows.length === 0) {
    return { totalRows: 0, columns: [], numericSummary: {}, topValues: {} };
  }

  const analyticsRows = rows.map((row) => ({
    servicio: row.servicio,
    diagnostico: row.diagnostico,
    antibiotico_01: row.antibiotico_01,
    antibiotico_02: row.antibiotico_02,
    edad: row.edad,
    dias_terapia_01: row.dias_terapia_01,
    dias_terapia_02: row.dias_terapia_02,
    cod_diagnostico: row.cod_diagnostico,
    nombre_paciente: row.nombre_paciente,
    cama: row.cama,
    observaciones: row.observaciones,
  }));

  const columns = Object.keys(analyticsRows[0]);
  const numericAccum: Record<string, { min: number; max: number; sum: number; count: number }> = {};
  const valueMaps: Record<string, Map<string, number>> = {};
  const antibioticMap = new Map<string, number>();

  for (const column of columns) {
    valueMaps[column] = new Map();
  }

  for (const row of analyticsRows) {
    for (const column of columns) {
      const value = row[column as keyof typeof row];
      if (value === null || value === undefined || value === '') {
        continue;
      }

      if (typeof value === 'number' && !Number.isNaN(value)) {
        const accumulator = numericAccum[column];
        if (!accumulator) {
          numericAccum[column] = { min: value, max: value, sum: value, count: 1 };
        } else {
          accumulator.min = Math.min(accumulator.min, value);
          accumulator.max = Math.max(accumulator.max, value);
          accumulator.sum += value;
          accumulator.count += 1;
        }
        continue;
      }

      const stringValue = String(value).trim();
      if (!stringValue) {
        continue;
      }

      valueMaps[column].set(stringValue, (valueMaps[column].get(stringValue) ?? 0) + 1);
      if (column === 'antibiotico_01' || column === 'antibiotico_02') {
        antibioticMap.set(stringValue, (antibioticMap.get(stringValue) ?? 0) + 1);
      }
    }
  }

  const numericSummary: MonthMetrics['numericSummary'] = {};
  for (const [column, accumulator] of Object.entries(numericAccum)) {
    numericSummary[column] = {
      min: accumulator.min,
      max: accumulator.max,
      avg: accumulator.count > 0 ? accumulator.sum / accumulator.count : 0,
      sum: accumulator.sum,
    };
  }

  const topValues: MonthMetrics['topValues'] = {};
  for (const column of columns) {
    const map = valueMaps[column];
    if (map.size > 0) {
      topValues[column] = Array.from(map.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));
    }
  }

  const metrics: MonthMetrics = {
    totalRows: rows.length,
    columns,
    numericSummary,
    topValues,
  };

  if (antibioticMap.size > 0) {
    metrics.topAntibiotics = topFrequent(antibioticMap, 10);
  }

  const serviceMap = valueMaps.servicio;
  if (serviceMap && serviceMap.size > 0) {
    metrics.topServices = topFrequent(serviceMap, 10);
  }

  const diagnosisMap = valueMaps.diagnostico;
  if (diagnosisMap && diagnosisMap.size > 0) {
    metrics.topDiagnoses = topFrequent(diagnosisMap, 10);
  }

  return metrics;
}

function buildHospitalMonthlyMetrics(
  hospitalId: string,
  rows: EvaluationMetricRow[],
): HospitalMonthlyMetric[] {
  const groupedRows = new Map<string, EvaluationMetricRow[]>();

  for (const row of rows) {
    const parsedMonth = parseEvaluationMonth(row);
    if (!parsedMonth) {
      continue;
    }

    const monthKey = `${parsedMonth.year}-${String(parsedMonth.month).padStart(2, '0')}`;
    const existingRows = groupedRows.get(monthKey) ?? [];
    existingRows.push(row);
    groupedRows.set(monthKey, existingRows);
  }

  return Array.from(groupedRows.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, monthRows]) => {
      const [yearValue, monthValue] = month.split('-').map((value) => Number.parseInt(value, 10));
      return {
        id: `${hospitalId}-${month}`,
        hospital_id: hospitalId,
        upload_id: null,
        month,
        month_label: `${MONTH_NAMES[monthValue - 1] ?? String(monthValue)} ${yearValue}`,
        metrics: calculateMetricsFromEvaluaciones(monthRows),
        row_count: monthRows.length,
        created_at: monthRows[monthRows.length - 1]?.fecha ?? new Date().toISOString(),
      };
    });
}

// ─── Sub-components ───────────────────────────────────────────────────────

function EmptyState({ onUpload }: { onUpload: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-4">
        <Database className="w-10 h-10 text-teal-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sin datos cargados</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        Este hospital aún no tiene datos. Sube un Excel para ver métricas, gráficos y análisis IA.
      </p>
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md min-h-[44px]"
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

function KpiCard({ label, value, sub, icon: Icon, color = 'teal' }: { 
  label: string; 
  value: string | number; 
  sub?: string; 
  icon?: React.ComponentType<{ className?: string }>;
  color?: 'teal' | 'blue' | 'violet' | 'emerald';
}) {
  const colorClasses = {
    teal: 'bg-teal-50 dark:bg-teal-900/30 text-teal-600',
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600',
    violet: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600',
  };
  
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {Icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// Horizontal bar chart (antibiotics, microorganisms)
function HBarChart({ data, color = '#0D9488', title }: { data: Array<{ name: string; count: number }>; color?: string; title?: string }) {
  const topped = data.slice(0, 8);
  return (
    <div>
      <ResponsiveContainer width="100%" height={Math.max(200, topped.length * 36)}>
        <BarChart data={topped} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
          <Bar dataKey="count" fill={color} radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {topped.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-700 dark:text-gray-300">{topped[0].name}</span> es el más frecuente con {topped[0].count} registros
          </p>
        </div>
      )}
    </div>
  );
}

// Pie chart (services)
function ServicePieChart({ data }: { data: Array<{ name: string; count: number }> }) {
  const topped = data.slice(0, 6);
  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie 
            data={topped} 
            dataKey="count" 
            nameKey="name" 
            cx="50%" 
            cy="50%" 
            outerRadius={90} 
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} 
            labelLine={false}
          >
            {topped.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      {topped.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {topped.length} servicios distintos registrados en el período
          </p>
        </div>
      )}
    </div>
  );
}

// Monthly evolution line chart (row_count per month)
function EvolutionChart({ data }: { data: Array<{ month: string; registros: number }> }) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
          <Line type="monotone" dataKey="registros" stroke="#0D9488" strokeWidth={2} dot={{ r: 4, fill: '#0D9488' }} />
        </LineChart>
      </ResponsiveContainer>
      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tendencia de {data.length} {data.length === 1 ? 'mes' : 'meses'} de datos históricos
          </p>
        </div>
      )}
    </div>
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
      { data: evaluationData },
      { data: uploadData },
    ] = await Promise.all([
      supabase
        .from('hospitals')
        .select('id,name,city,department,beds,is_active')
        .eq('id', hospitalId)
        .single(),
      supabase
        .from('evaluaciones')
        .select(
          [
            'id',
            'mes',
            'anio',
            'fecha',
            'servicio',
            'diagnostico',
            'antibiotico_01',
            'antibiotico_02',
            'edad',
            'dias_terapia_01',
            'dias_terapia_02',
            'cod_diagnostico',
            'nombre_paciente',
            'cama',
            'observaciones',
          ].join(','),
        )
        .eq('hospital_id', hospitalId)
        .order('anio', { ascending: true })
        .order('mes', { ascending: true })
        .order('fecha', { ascending: true }),
      supabase
        .from('hospital_excel_uploads')
        .select('id,hospital_id,user_id,filename,periodo,mes,anio,total_filas,filas_validas,filas_error,estado,errores,created_at,updated_at')
        .eq('hospital_id', hospitalId)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    setHospital(hosp as HospitalInfo | null);
    const metricRows = buildHospitalMonthlyMetrics(hospitalId, (evaluationData ?? []) as EvaluationMetricRow[]);
    setMonths(metricRows);
    const latestUpload = ((uploadData ?? []) as HospitalExcelUpload[])[0] ?? null;
    setUpload(latestUpload);

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
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando analíticas...</p>
        </div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Database className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Hospital no encontrado</p>
        <button 
          onClick={() => navigate('/hospitales')} 
          className="mt-4 text-teal-600 dark:text-teal-400 text-sm font-medium hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
        >
          ← Volver a hospitales
        </button>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Analíticas PROA
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {hospital.name} · {hospital.city}, {hospital.department}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {months.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-800">
                <Activity className="w-3 h-3" />
                {months.length} {months.length === 1 ? 'mes' : 'meses'} de datos
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full border border-amber-200 dark:border-amber-800">
                Sin datos
              </span>
            )}
            {upload && (
              <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Actualizado {new Date(upload.created_at).toLocaleDateString('es-CO')}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {months.length > 0 && (
            <>
              <button
                onClick={() => toast.info('Función de exportación próximamente')}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 min-h-[44px]"
              >
                <FileDown className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={() => toast.info('Función de exportación próximamente')}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
            </>
          )}
          <button
            onClick={() => updateRef.current?.click()}
            disabled={uploadingExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md min-h-[44px]"
          >
            {uploadingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {uploadingExcel ? 'Procesando...' : months.length > 0 ? 'Actualizar Excel' : 'Subir Excel'}
          </button>
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
          {/* Month selector with filters */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Seleccionar período</h3>
              {showComparison && (
                <button
                  onClick={() => {
                    setShowComparison(false);
                    setComparedMonths([]);
                  }}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Salir de comparación
                </button>
              )}
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {months.map((m) => (
                <button
                  key={m.month}
                  onClick={() => { setSelectedMonth(m.month); setAiResponse(null); }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 min-h-[44px] ${
                    selectedMonth === m.month
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {m.month_label}
                  <span className="ml-2 text-xs opacity-75">({m.row_count})</span>
                </button>
              ))}
            </div>

            {months.length > 1 && !showComparison && (
              <button
                onClick={() => setShowComparison(true)}
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                Comparar períodos
              </button>
            )}
          </div>

          {/* ── Comparison mode ────────────────────────────────────────────── */}
          {showComparison && (
            <div className="bg-white dark:bg-gray-900 border border-teal-200 dark:border-teal-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Selecciona hasta 4 meses para comparar</h3>
              <div className="flex flex-wrap gap-2 mb-5">
                {months.map((m) => {
                  const selected = comparedMonths.includes(m.month);
                  return (
                    <button
                      key={m.month}
                      onClick={() => toggleComparisonMonth(m.month)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 min-h-[36px] ${
                        selected 
                          ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-400 dark:border-teal-600 text-teal-700 dark:text-teal-300' 
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {selected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      {m.month_label}
                    </button>
                  );
                })}
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                  {comparedMonths.length >= 2 ? 'Comparativa de registros' : 'Evolución de registros (todos los meses)'}
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={comparisonChartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                    <Bar dataKey="registros" name="Registros" fill="#0D9488" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Monthly KPI cards ─────────────────────────────────────────── */}
          {currentMonthData && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard 
                  label="Registros este mes" 
                  value={currentMonthData.row_count.toLocaleString()} 
                  icon={Activity}
                  color="teal"
                  sub={`Período ${currentMonthData.month_label}`}
                />
                <KpiCard 
                  label="Antibióticos únicos" 
                  value={currentMetrics?.topAntibiotics?.length ?? 0} 
                  icon={FileSpreadsheet}
                  color="blue"
                  sub="distintos en el mes"
                />
                <KpiCard 
                  label="Servicios registrados" 
                  value={currentMetrics?.topServices?.length ?? 0} 
                  icon={BarChart2}
                  color="violet"
                  sub="áreas del hospital"
                />
                <KpiCard 
                  label="Columnas detectadas" 
                  value={currentMetrics?.columns.length ?? 0}
                  icon={Database}
                  color="emerald"
                  sub="campos en el Excel"
                />
              </div>

              {/* ── Charts Grid 2x2 ──────────────────────────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Chart 1: Top Antibióticos */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">Top Antibióticos</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Los 8 más utilizados</p>
                    </div>
                  </div>
                  {currentMetrics?.topAntibiotics && currentMetrics.topAntibiotics.length > 0 ? (
                    <HBarChart data={currentMetrics.topAntibiotics} color="#0D9488" />
                  ) : (
                    <div className="py-12 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <FileSpreadsheet className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">No se detectó columna de antibióticos</p>
                    </div>
                  )}
                </div>

                {/* Chart 2: Top Microorganismos */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">Top Microorganismos</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Patógenos más frecuentes</p>
                    </div>
                  </div>
                  {currentMetrics?.topMicroorganisms && currentMetrics.topMicroorganisms.length > 0 ? (
                    <HBarChart data={currentMetrics.topMicroorganisms} color="#8B5CF6" />
                  ) : (
                    <div className="py-12 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Database className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">No se detectó columna de microorganismos</p>
                    </div>
                  )}
                </div>

                {/* Chart 3: Top Servicios */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">Distribución por Servicio</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Áreas del hospital</p>
                    </div>
                  </div>
                  {currentMetrics?.topServices && currentMetrics.topServices.length > 0 ? (
                    <ServicePieChart data={currentMetrics.topServices} />
                  ) : (
                    <div className="py-12 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <BarChart2 className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">No se detectó columna de servicios</p>
                    </div>
                  )}
                </div>

                {/* Chart 4: Evolución mensual */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">Evolución Temporal</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Registros por mes</p>
                    </div>
                  </div>
                  <EvolutionChart data={evolutionData} />
                </div>
              </div>

              {/* ── Numeric summary table ───────────────────────────────── */}
              {currentMetrics && Object.keys(currentMetrics.numericSummary).length > 0 && (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">Resumen de columnas numéricas</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Estadísticas de campos numéricos detectados</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          {['Columna', 'Mínimo', 'Máximo', 'Promedio', 'Total'].map((h) => (
                            <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {Object.entries(currentMetrics.numericSummary).map(([col, stats]) => (
                          <tr key={col} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">{col}</td>
                            <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{stats.min.toFixed(2)}</td>
                            <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{stats.max.toFixed(2)}</td>
                            <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{stats.avg.toFixed(2)}</td>
                            <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{stats.sum.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── AI Analysis ──────────────────────────────────────────── */}
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 border border-teal-200 dark:border-teal-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                        Análisis con IA
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Insights del período {currentMonthData.month_label}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleAIAnalysis}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md min-h-[44px]"
                  >
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                    {aiLoading ? 'Analizando...' : aiResponse ? 'Analizar de nuevo' : 'Analizar con IA'}
                  </button>
                </div>

                {aiResponse ? (
                  <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-sm bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
                    {aiResponse}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center">
                      <Brain className="w-8 h-8 text-teal-600" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                      Obtén un análisis profesional generado por IA que incluye resumen ejecutivo, 
                      hallazgos principales, alertas y recomendaciones concretas
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
