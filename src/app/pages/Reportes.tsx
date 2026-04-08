import { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  Clock,
  Copy,
  Download,
  FileDown,
  Loader2,
  MessageCircle,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useGroqReports } from '../../hooks/useGroqReports';
import { generatePDFReport } from '../../lib/pdf/generatePDF';
import { deleteReport, getSavedReports, saveReport } from '../../lib/supabase/savedReports';
import type { SavedReport } from '../../lib/supabase/savedReports';
import { EmptyState } from '../components/EmptyState';
import { InfoTooltip } from '../components/Tooltip';
import { useHospitalContext } from '../components/Layout';

const REPORT_TYPE_LABELS: Record<SavedReport['report_type'], string> = {
  ejecutivo: 'Ejecutivo',
  alertas: 'Alertas IA',
  chat: 'Conversacion',
};

const DATE_RANGE_LABELS: Record<'1m' | '6m' | '12m' | 'all', string> = {
  '1m': 'Ultimo mes',
  '6m': 'Ultimos 6 meses',
  '12m': 'Ultimo ano',
  all: 'Todos los datos',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ReportSectionProps {
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
  iconWrapperClassName: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

function ReportSection({
  icon: Icon,
  iconClassName,
  iconWrapperClassName,
  title,
  description,
  children,
}: ReportSectionProps) {
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-200 p-6 dark:border-gray-800">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconWrapperClassName}`}>
            <Icon className={`h-5 w-5 ${iconClassName}`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function SectionNoData() {
  return (
    <EmptyState
      icon={Building2}
      title="Sin datos clinicos para este periodo"
      description="Primero carga un Excel PROA o registra evaluaciones para generar reportes utiles."
    />
  );
}

export function Reportes() {
  const { selectedHospital, selectedHospitalObj, dateRange } = useHospitalContext();
  const { user } = useAuth();
  const hospital = selectedHospital || undefined;
  const dateRangeLabel = DATE_RANGE_LABELS[dateRange];

  const {
    kpis,
    records,
    top5Antibiotics,
    mrsaRate,
    bleeRate,
    carbapenemaseRate,
    loading: analyticsLoading,
  } = useAnalytics({ months: 6, hospital });

  const topServices = [...new Set(records.map((record) => (record.servicio ?? '').trim()).filter(Boolean))].slice(0, 5);

  const snapshot = {
    hospital: selectedHospital || '',
    period: dateRangeLabel,
    totalRecords: records.length,
    therapeuticAdequacy: kpis.therapeuticAdequacy,
    guidelineCompliance: kpis.guidelineCompliance,
    antibioticUseRate: kpis.antibioticUseRate,
    iaasRate: kpis.iaasRate,
    top5Antibiotics,
    topServices,
    mrsaRate,
    bleeRate,
    carbapenemaseRate,
    records,
  };

  const {
    generateExecutiveReport,
    generateAlerts,
    chat,
    loading: aiLoading,
    error: aiError,
  } = useGroqReports(snapshot);

  const [executiveReport, setExecutiveReport] = useState('');
  const [alertsReport, setAlertsReport] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [historialFilter, setHistorialFilter] = useState<'all' | SavedReport['report_type']>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadSavedReports = useCallback(async () => {
    try {
      const data = await getSavedReports(selectedHospitalObj?.id);
      setSavedReports(data);
    } catch {
      toast.error('No fue posible cargar el historial de reportes.');
    }
  }, [selectedHospitalObj?.id]);

  useEffect(() => {
    void loadSavedReports();
  }, [loadSavedReports]);

  const handleGenerateReport = async () => {
    try {
      const result = await generateExecutiveReport();
      if (!result) {
        return;
      }

      setExecutiveReport(result);
      await saveReport({
        hospital_id: selectedHospitalObj?.id ?? null,
        hospital_name: selectedHospital || 'Todos los hospitales',
        report_type: 'ejecutivo',
        title: `Reporte ejecutivo - ${new Date().toLocaleDateString('es-CO')}`,
        content: result,
        date_range: dateRangeLabel,
        records_count: records.length,
        created_by: (user as { id?: string } | null)?.id ?? null,
      });
      await loadSavedReports();
      toast.success('Reporte ejecutivo generado correctamente.');
    } catch {
      toast.error('No fue posible generar el reporte ejecutivo.');
    }
  };

  const handleGenerateAlerts = async () => {
    try {
      const result = await generateAlerts();
      if (!result) {
        return;
      }

      setAlertsReport(result);
      await saveReport({
        hospital_id: selectedHospitalObj?.id ?? null,
        hospital_name: selectedHospital || 'Todos los hospitales',
        report_type: 'alertas',
        title: `Alertas epidemiologicas - ${new Date().toLocaleDateString('es-CO')}`,
        content: result,
        date_range: dateRangeLabel,
        records_count: records.length,
        created_by: (user as { id?: string } | null)?.id ?? null,
      });
      await loadSavedReports();
      toast.success('Alertas generadas correctamente.');
    } catch {
      toast.error('No fue posible generar las alertas.');
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) {
      return;
    }

    const question = chatInput.trim();
    setChatInput('');
    setChatHistory((prev) => [...prev, { role: 'user' as const, content: question }].slice(-10));

    try {
      const answer = await chat(question);
      if (!answer) {
        return;
      }

      setChatHistory((prev) => [...prev, { role: 'assistant' as const, content: answer }].slice(-10));
    } catch {
      toast.error('No fue posible consultar al asistente.');
    }
  };

  const handleSaveChat = async () => {
    if (chatHistory.length === 0) {
      return;
    }

    const content = chatHistory
      .map((message) => `[${message.role === 'user' ? 'Usuario' : 'Asistente'}]\n${message.content}`)
      .join('\n\n---\n\n');

    try {
      await saveReport({
        hospital_id: selectedHospitalObj?.id ?? null,
        hospital_name: selectedHospital || 'Todos los hospitales',
        report_type: 'chat',
        title: `Conversacion PROA - ${new Date().toLocaleDateString('es-CO')}`,
        content,
        date_range: dateRangeLabel,
        records_count: records.length,
        created_by: (user as { id?: string } | null)?.id ?? null,
      });
      await loadSavedReports();
      toast.success('Conversacion guardada correctamente.');
    } catch {
      toast.error('No fue posible guardar la conversacion.');
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Contenido copiado al portapapeles.');
    } catch {
      toast.error('No fue posible copiar el contenido.');
    }
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Archivo descargado correctamente.');
  };

  const handleDownloadPDF = () => {
    generatePDFReport({
      hospitalName: selectedHospitalObj?.name ?? 'Todos los hospitales',
      dateRangeLabel,
      generatedAt: new Date().toLocaleString('es-CO'),
      totalIntervenciones: records.length,
      adecuacionTerapeutica:
        records.length > 0
          ? (records.filter((record) => record.aproboTerapia === 'SI').length / records.length) * 100
          : 0,
      hospitalActivo: selectedHospitalObj?.name ?? 'General',
      alertasActivas: records.filter((record) => record.aproboTerapia !== 'SI').length,
      executiveReport,
      alerts: alertsReport,
      records,
    });
    toast.success('PDF generado correctamente.');
  };

  const handleDeleteReport = async (id: string) => {
    try {
      await deleteReport(id);
      setDeleteConfirmId(null);
      if (expandedId === id) {
        setExpandedId(null);
      }
      await loadSavedReports();
      toast.success('Reporte eliminado correctamente.');
    } catch {
      toast.error('No fue posible eliminar el reporte.');
    }
  };

  const alertasActivas = records.filter(
    (record) => (record.aproboTerapia ?? '').trim().toUpperCase() !== 'SI',
  ).length;

  const noData = records.length === 0 && !analyticsLoading;
  const filteredReports =
    historialFilter === 'all'
      ? savedReports
      : savedReports.filter((report) => report.report_type === historialFilter);

  const typeIcon = (type: SavedReport['report_type']) => {
    if (type === 'ejecutivo') {
      return <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />;
    }

    if (type === 'alertas') {
      return <Zap className="h-4 w-4 text-amber-500" />;
    }

    return <MessageCircle className="h-4 w-4 text-slate-700 dark:text-slate-300" />;
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 lg:mb-8">
        <div className="mb-2 flex items-center gap-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reportes IA</h1>
          <InfoTooltip content="Genera resumentes clinicos, alertas y consultas guiadas a partir de los datos PROA cargados." />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {selectedHospitalObj?.name ?? 'Todos los hospitales'} · {dateRangeLabel}
        </p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Usa esta vista para obtener un resumen ejecutivo, detectar alertas y resolver preguntas clinicas sobre el programa.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:mb-8 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Total intervenciones</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{records.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Hospital activo</p>
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {selectedHospital || 'Todos'}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Adecuacion terapeutica</p>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{kpis.therapeuticAdequacy}%</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Alertas activas</p>
          <p className="text-2xl font-bold text-amber-600">{alertasActivas}</p>
        </div>
      </div>

      <ReportSection
        icon={Sparkles}
        iconWrapperClassName="bg-teal-100 dark:bg-teal-900/30"
        iconClassName="text-teal-600 dark:text-teal-400"
        title="Reporte ejecutivo PROA"
        description="Resume hallazgos utiles para comites clinicos, seguimiento del mes y comunicacion con la direccion."
      >
        {noData ? (
          <SectionNoData />
        ) : (
          <>
            <button
              onClick={handleGenerateReport}
              disabled={aiLoading}
              className="mb-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {aiLoading ? 'Analizando datos...' : 'Generar reporte con IA'}
            </button>

            {aiError ? <p className="mb-3 text-sm text-red-500">{aiError}</p> : null}

            {executiveReport ? (
              <div>
                <div className="mb-3 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/50">
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs text-gray-800 dark:text-gray-200 sm:text-sm">
                    {executiveReport}
                  </pre>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => void handleCopy(executiveReport)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar reporte
                  </button>
                  <button
                    onClick={() => handleDownload(executiveReport, 'Reporte_Ejecutivo_PROA.txt')}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Download className="h-4 w-4" />
                    Descargar .txt
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-3 py-1.5 text-sm text-rose-700 transition-colors hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/30"
                  >
                    <FileDown className="h-4 w-4" />
                    Descargar PDF
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </ReportSection>

      <ReportSection
        icon={Zap}
        iconWrapperClassName="bg-amber-100 dark:bg-amber-900/30"
        iconClassName="text-amber-600 dark:text-amber-400"
        title="Alertas epidemiologicas IA"
        description="Prioriza patrones de riesgo, cambios de comportamiento y hallazgos que ameritan revision inmediata."
      >
        {noData ? (
          <SectionNoData />
        ) : (
          <>
            <button
              onClick={handleGenerateAlerts}
              disabled={aiLoading}
              className="mb-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-slate-800 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {aiLoading ? 'Analizando alertas...' : 'Analizar alertas'}
            </button>

            {aiError ? <p className="mb-3 text-sm text-red-500">{aiError}</p> : null}

            {alertsReport ? (
              <div className="max-h-80 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                <pre className="whitespace-pre-wrap break-words font-mono text-xs text-gray-800 dark:text-gray-200 sm:text-sm">
                  {alertsReport}
                </pre>
              </div>
            ) : null}
          </>
        )}
      </ReportSection>

      <ReportSection
        icon={MessageCircle}
        iconWrapperClassName="bg-slate-100 dark:bg-slate-800"
        iconClassName="text-slate-700 dark:text-slate-300"
        title="Asistente PROA"
        description="Haz preguntas puntuales sobre uso de antimicrobianos, resistencia o comportamiento del periodo cargado."
      >
        {noData ? (
          <SectionNoData />
        ) : (
          <>
            {chatHistory.length > 0 ? (
              <div className="mb-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                {chatHistory.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                        message.role === 'user'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                      }`}
                    >
                      <pre className="whitespace-pre-wrap break-words font-sans">{message.content}</pre>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start">
              <textarea
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void handleChat();
                  }
                }}
                placeholder="Ej: Cual es el servicio con mayor resistencia? Como reducir el uso de meropenem?"
                rows={2}
                className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none transition-colors focus:border-teal-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
              <button
                onClick={() => void handleChat()}
                disabled={aiLoading || !chatInput.trim()}
                className="min-h-[44px] rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Consultar'}
              </button>
            </div>

            {chatHistory.length > 0 ? (
              <button
                onClick={() => void handleSaveChat()}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <Clock className="h-4 w-4" />
                Guardar conversacion
              </button>
            ) : null}

            {aiError ? <p className="mt-2 text-sm text-red-500">{aiError}</p> : null}
          </>
        )}
      </ReportSection>

      <ReportSection
        icon={Clock}
        iconWrapperClassName="bg-gray-100 dark:bg-gray-800"
        iconClassName="text-gray-600 dark:text-gray-300"
        title="Historial de reportes"
        description="Consulta, copia, descarga o elimina reportes guardados automaticamente para este hospital."
      >
        <div className="mb-5 flex flex-wrap gap-2">
          {(['all', 'ejecutivo', 'alertas', 'chat'] as const).map((filterValue) => (
            <button
              key={filterValue}
              onClick={() => setHistorialFilter(filterValue)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                historialFilter === filterValue
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {filterValue === 'all'
                ? `Todos (${savedReports.length})`
                : `${REPORT_TYPE_LABELS[filterValue]} (${savedReports.filter((report) => report.report_type === filterValue).length})`}
            </button>
          ))}
        </div>

        {filteredReports.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No hay reportes guardados"
            description="Genera un reporte ejecutivo, alertas o una conversacion para ver historial aqui."
          />
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-start gap-3 p-4">
                  <div className="mt-0.5 shrink-0">{typeIcon(report.report_type)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">{report.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {report.hospital_name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(report.created_at).toLocaleDateString('es-CO')}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
                        {report.date_range}
                      </span>
                      <span className="text-xs text-gray-400">{report.records_count} registros</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                      className="rounded-lg p-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      title={expandedId === report.id ? 'Ocultar contenido' : 'Ver contenido'}
                    >
                      {expandedId === report.id ? '▲' : '▼'}
                    </button>
                    <button
                      onClick={() => void handleCopy(report.content)}
                      className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                      title="Copiar"
                    >
                      <Copy className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDownload(report.content, `${report.title.replace(/\s+/g, '_')}.txt`)}
                      className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                      title="Descargar"
                    >
                      <Download className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    {deleteConfirmId === report.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => void handleDeleteReport(report.id)}
                          className="rounded-lg bg-red-500 px-2 py-1 text-xs text-white transition-colors hover:bg-red-600"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(report.id)}
                        className="rounded-lg p-1.5 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>

                {expandedId === report.id ? (
                  <div className="max-h-80 overflow-y-auto border-t border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/50">
                    <pre className="whitespace-pre-wrap break-words font-mono text-xs text-gray-700 dark:text-gray-200">
                      {report.content}
                    </pre>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </ReportSection>
    </div>
  );
}
