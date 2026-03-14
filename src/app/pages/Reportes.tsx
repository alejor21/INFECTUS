import { useCallback, useEffect, useState } from 'react';
import {
  Sparkles,
  Zap,
  MessageCircle,
  Copy,
  Download,
  FileDown,
  Loader2,
  Clock,
  Trash2,
} from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useHospitalContext } from '../components/Layout';
import { useGroqReports } from '../../hooks/useGroqReports';
import { generatePDFReport } from '../../lib/pdf/generatePDF';
import { useAuth } from '../../contexts/AuthContext';
import {
  getSavedReports,
  saveReport,
  deleteReport,
} from '../../lib/supabase/savedReports';
import type { SavedReport } from '../../lib/supabase/savedReports';

const REPORT_TYPE_LABELS: Record<SavedReport['report_type'], string> = {
  ejecutivo: 'Ejecutivo',
  alertas: 'Alertas IA',
  chat: 'Conversación',
};

export function Reportes() {
  const { selectedHospital, selectedHospitalObj, dateRange } = useHospitalContext();
  const { user } = useAuth();
  const hospital = selectedHospital || undefined;

  const {
    kpis,
    records,
    top5Antibiotics,
    mrsaRate,
    bleeRate,
    carbapenemaseRate,
    loading: analyticsLoading,
  } = useAnalytics({ months: 6, hospital });

  const topServices = [
    ...new Set(records.map((r) => (r.servicio ?? '').trim()).filter(Boolean)),
  ].slice(0, 5);

  const snapshot = {
    hospital: selectedHospital || '',
    period: 'Últimos 6 meses',
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

  const { generateExecutiveReport, generateAlerts, chat, loading: aiLoading, error: aiError } =
    useGroqReports(snapshot);

  const [executiveReport, setExecutiveReport] = useState('');
  const [alertsReport, setAlertsReport] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  // Historial state
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [historialFilter, setHistorialFilter] = useState<'all' | SavedReport['report_type']>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const DATE_RANGE_LABELS: Record<'1m' | '6m' | '12m' | 'all', string> = {
    '1m': 'Último mes',
    '6m': 'Últimos 6 meses',
    '12m': 'Último año',
    'all': 'Todos los datos',
  };

  const loadSavedReports = useCallback(async () => {
    const data = await getSavedReports(selectedHospitalObj?.id);
    setSavedReports(data);
  }, [selectedHospitalObj?.id]);

  useEffect(() => {
    loadSavedReports();
  }, [loadSavedReports]);

  const handleGenerateReport = async () => {
    const result = await generateExecutiveReport();
    if (result) {
      setExecutiveReport(result);
      await saveReport({
        hospital_id: selectedHospitalObj?.id ?? null,
        hospital_name: selectedHospital || 'Todos los hospitales',
        report_type: 'ejecutivo',
        title: `Reporte Ejecutivo — ${new Date().toLocaleDateString('es-CO')}`,
        content: result,
        date_range: DATE_RANGE_LABELS[dateRange],
        records_count: records.length,
        created_by: (user as { id?: string } | null)?.id ?? null,
      });
      loadSavedReports();
    }
  };

  const handleGenerateAlerts = async () => {
    const result = await generateAlerts();
    if (result) {
      setAlertsReport(result);
      await saveReport({
        hospital_id: selectedHospitalObj?.id ?? null,
        hospital_name: selectedHospital || 'Todos los hospitales',
        report_type: 'alertas',
        title: `Alertas Epidemiológicas — ${new Date().toLocaleDateString('es-CO')}`,
        content: result,
        date_range: DATE_RANGE_LABELS[dateRange],
        records_count: records.length,
        created_by: (user as { id?: string } | null)?.id ?? null,
      });
      loadSavedReports();
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const question = chatInput.trim();
    setChatInput('');
    setChatHistory((prev) => [...prev, { role: 'user' as const, content: question }].slice(-10));
    const answer = await chat(question);
    if (answer) {
      setChatHistory((prev) => [...prev, { role: 'assistant' as const, content: answer }].slice(-10));
    }
  };

  const handleSaveChat = async () => {
    if (chatHistory.length === 0) return;
    const content = chatHistory
      .map((m) => `[${m.role === 'user' ? 'Usuario' : 'Asistente'}]\n${m.content}`)
      .join('\n\n---\n\n');
    await saveReport({
      hospital_id: selectedHospitalObj?.id ?? null,
      hospital_name: selectedHospital || 'Todos los hospitales',
      report_type: 'chat',
      title: `Conversación PROA — ${new Date().toLocaleDateString('es-CO')}`,
      content,
      date_range: DATE_RANGE_LABELS[dateRange],
      records_count: records.length,
      created_by: (user as { id?: string } | null)?.id ?? null,
    });
    loadSavedReports();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    generatePDFReport({
      hospitalName: selectedHospitalObj?.name ?? 'Todos los hospitales',
      dateRangeLabel: DATE_RANGE_LABELS[dateRange],
      generatedAt: new Date().toLocaleString('es-CO'),
      totalIntervenciones: records.length,
      adecuacionTerapeutica:
        records.length > 0
          ? (records.filter((r) => r.aproboTerapia === 'SI').length / records.length) * 100
          : 0,
      hospitalActivo: selectedHospitalObj?.name ?? 'General',
      alertasActivas: records.filter((r) => r.aproboTerapia !== 'SI').length,
      executiveReport: executiveReport,
      alerts: alertsReport,
      records,
    });
  };

  const handleDeleteReport = async (id: string) => {
    await deleteReport(id);
    setDeleteConfirmId(null);
    if (expandedId === id) setExpandedId(null);
    loadSavedReports();
  };

  const alertasActivas = records.filter(
    (r) => (r.aproboTerapia ?? '').trim().toUpperCase() !== 'SI',
  ).length;

  const noData = records.length === 0 && !analyticsLoading;

  const filteredReports =
    historialFilter === 'all'
      ? savedReports
      : savedReports.filter((r) => r.report_type === historialFilter);

  const typeIcon = (type: SavedReport['report_type']) => {
    if (type === 'ejecutivo') return <Sparkles className="w-4 h-4" style={{ color: '#0F8B8D' }} />;
    if (type === 'alertas') return <Zap className="w-4 h-4 text-amber-500" />;
    return <MessageCircle className="w-4 h-4" style={{ color: '#0B3C5D' }} />;
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Page title */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#0B3C5D' }}>
          Reportes IA
        </h1>
        <p className="text-gray-600">
          Generación inteligente de informes PROA con análisis de IA
        </p>
      </div>

      {/* Section D — Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Total intervenciones</p>
          <p className="text-2xl font-bold" style={{ color: '#0B3C5D' }}>{records.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Hospital activo</p>
          <p className="text-sm font-semibold truncate" style={{ color: '#0B3C5D' }}>
            {selectedHospital || 'Todos'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Adecuación terapéutica</p>
          <p className="text-2xl font-bold" style={{ color: '#0F8B8D' }}>
            {kpis.therapeuticAdequacy}%
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Alertas activas</p>
          <p className="text-2xl font-bold text-amber-600">{alertasActivas}</p>
        </div>
      </div>

      {/* Section A — Executive Report */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#0F8B8D' }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: '#0B3C5D' }}>
                Reporte Ejecutivo PROA
              </h2>
              <p className="text-sm text-gray-500">
                Genera un análisis completo con IA basado en los datos cargados
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {noData ? (
            <p className="text-sm text-gray-400 italic">
              Sin datos cargados — sube un archivo Excel primero
            </p>
          ) : (
            <>
              <button
                onClick={handleGenerateReport}
                disabled={aiLoading}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto px-5 py-2 rounded-lg text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed mb-4"
                style={{ backgroundColor: '#0F8B8D' }}
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analizando datos...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generar reporte con IA</span>
                  </>
                )}
              </button>
              {aiError && <p className="text-sm text-red-500 mb-3">{aiError}</p>}
              {executiveReport && (
                <div>
                  <div className="max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 border border-gray-200 mb-3">
                    <pre className="font-mono text-xs sm:text-sm text-gray-800 whitespace-pre-wrap break-words">
                      {executiveReport}
                    </pre>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      onClick={() => handleCopy(executiveReport)}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">Copiar reporte</span>
                    </button>
                    <button
                      onClick={() => handleDownload(executiveReport, 'Reporte_Ejecutivo_PROA.txt')}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">Descargar .txt</span>
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm border border-rose-300 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <FileDown className="w-4 h-4 text-rose-600" />
                      <span className="text-rose-700">Descargar PDF</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Section B — Intelligent Alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-100">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: '#0B3C5D' }}>
                Alertas Epidemiológicas IA
              </h2>
              <p className="text-sm text-gray-500">Detección automática de patrones de riesgo</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {noData ? (
            <p className="text-sm text-gray-400 italic">
              Sin datos cargados — sube un archivo Excel primero
            </p>
          ) : (
            <>
              <button
                onClick={handleGenerateAlerts}
                disabled={aiLoading}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto px-5 py-2 rounded-lg text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed mb-4"
                style={{ backgroundColor: '#0B3C5D' }}
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analizando alertas...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Analizar alertas</span>
                  </>
                )}
              </button>
              {aiError && <p className="text-sm text-red-500 mb-3">{aiError}</p>}
              {alertsReport && (
                <div className="max-h-80 overflow-y-auto bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <pre className="font-mono text-xs sm:text-sm text-gray-800 whitespace-pre-wrap break-words">
                    {alertsReport}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Section C — PROA Assistant */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#0B3C5D' }}
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: '#0B3C5D' }}>
                Asistente PROA
              </h2>
              <p className="text-sm text-gray-500">
                Consulta inteligente sobre los datos del programa
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {noData ? (
            <p className="text-sm text-gray-400 italic">
              Sin datos cargados — sube un archivo Excel primero
            </p>
          ) : (
            <>
              {chatHistory.length > 0 && (
                <div className="max-h-80 overflow-y-auto mb-4 space-y-3 pr-1">
                  {chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${
                          msg.role === 'user' ? 'text-white' : 'bg-gray-100 text-gray-800'
                        }`}
                        style={msg.role === 'user' ? { backgroundColor: '#0F8B8D' } : {}}
                      >
                        <pre className="whitespace-pre-wrap break-words font-sans">{msg.content}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleChat();
                    }
                  }}
                  placeholder="Ej: ¿Cuál es el servicio con mayor resistencia? ¿Cómo reducir el uso de meropenem?"
                  rows={2}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
                />
                <button
                  onClick={handleChat}
                  disabled={aiLoading || !chatInput.trim()}
                  className="px-4 py-2 rounded-lg text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px] sm:w-auto"
                  style={{ backgroundColor: '#0F8B8D' }}
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Consultar'}
                </button>
              </div>
              {chatHistory.length > 0 && (
                <button
                  onClick={handleSaveChat}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <Clock className="w-4 h-4 text-gray-500" />
                  Guardar conversación
                </button>
              )}
              {aiError && <p className="text-sm text-red-500 mt-2">{aiError}</p>}
            </>
          )}
        </div>
      </div>

      {/* Section E — Historial de reportes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: '#0B3C5D' }}>
                Historial de reportes
              </h2>
              <p className="text-sm text-gray-500">
                Reportes generados y guardados automáticamente
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {/* Type filter */}
          <div className="flex flex-wrap gap-2 mb-5">
            {(['all', 'ejecutivo', 'alertas', 'chat'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setHistorialFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  historialFilter === f
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={historialFilter === f ? { backgroundColor: '#0B3C5D' } : {}}
              >
                {f === 'all'
                  ? `Todos (${savedReports.length})`
                  : `${REPORT_TYPE_LABELS[f]} (${savedReports.filter((r) => r.report_type === f).length})`}
              </button>
            ))}
          </div>

          {filteredReports.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-6 text-center">
              No hay reportes guardados para este filtro
            </p>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  {/* Card header */}
                  <div className="flex items-start gap-3 p-4">
                    <div className="mt-0.5 shrink-0">{typeIcon(report.report_type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{report.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {report.hospital_name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(report.created_at).toLocaleDateString('es-CO')}
                        </span>
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {report.date_range}
                        </span>
                        <span className="text-xs text-gray-400">
                          {report.records_count} registros
                        </span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-xs text-gray-600"
                        title={expandedId === report.id ? 'Ocultar' : 'Ver'}
                      >
                        {expandedId === report.id ? '▲' : '▼'}
                      </button>
                      <button
                        onClick={() => handleCopy(report.content)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Copiar"
                      >
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        onClick={() =>
                          handleDownload(
                            report.content,
                            `${report.title.replace(/\s+/g, '_')}.txt`,
                          )
                        }
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Descargar"
                      >
                        <Download className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      {deleteConfirmId === report.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(report.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {expandedId === report.id && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4 max-h-80 overflow-y-auto">
                      <pre className="font-mono text-xs text-gray-700 whitespace-pre-wrap break-words">
                        {report.content}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
