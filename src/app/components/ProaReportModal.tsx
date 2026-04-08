import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Copy, Download, FileImage, FileText, Loader2, Presentation, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useHospitalContext } from '../../contexts/HospitalContext';
import { useProaCharts } from '../../hooks/useProaCharts';
import {
  getAdherenciaAnalysis,
  getCommitteeHospitalLabel,
  getConductasAnalysis,
  getServicioAnalysis,
  getTipoIntervencionAnalysis,
} from '../../lib/analytics/proaCommittee';
import {
  filterRecordsByMonth,
  formatMonthLabel,
  getCurrentMonthValue,
  getLatestMonthValue,
} from '../../lib/analytics/proaPeriods';
import { exportAllChartsAsPNG } from '../../utils/exportCharts';
import { exportPDF, type PDFReportInput } from '../../utils/exportPDF';
import { exportPowerPoint } from '../../utils/exportPowerPoint';
import { generateProaReport, type ReportComparisonRow } from '../../utils/generateProaReport';
import { EmptyState } from './EmptyState';
import { AdherenciaChart } from './charts/proa/AdherenciaChart';
import { ConductasChart } from './charts/proa/ConductasChart';
import { DistribucionServicioChart } from './charts/proa/DistribucionServicioChart';
import { TipoIntervencionCommitteeChart } from './charts/proa/TipoIntervencionCommitteeChart';

type ReportScope = 'hospital' | 'global';

interface ProaReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialHospitalId?: string;
  initialMonth?: string;
  initialScope?: ReportScope;
  mesComparar?: string;
  tablaComparativa?: ReportComparisonRow[];
}

const PREVIEW_CHARTS = [
  { id: 'proa-report-preview-tipo', filename: 'TipoIntervencion', dataChart: 'tipo-intervencion' },
  { id: 'proa-report-preview-servicio', filename: 'PorServicio', dataChart: 'por-servicio' },
  { id: 'proa-report-preview-conductas', filename: 'Conductas', dataChart: 'conductas' },
  { id: 'proa-report-preview-adherencia', filename: 'Adherencia', dataChart: 'adherencia' },
] as const;

function getDefaultAuthors(fullName: string | null | undefined, role: string | null | undefined): string {
  if (!fullName) {
    return 'Equipo PROA';
  }

  return `${fullName} - ${role ?? 'Equipo PROA'}`;
}

function pct(value: number, total: number): number {
  return total === 0 ? 0 : Math.round((value / total) * 1000) / 10;
}

function isYes(value: string | null | undefined): boolean {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') === 'si';
}

export function ProaReportModal({
  isOpen,
  onClose,
  initialHospitalId,
  initialMonth,
  initialScope = 'hospital',
  mesComparar,
  tablaComparativa,
}: ProaReportModalProps) {
  const { profile } = useAuth();
  const { allRawRecords, hospitals, selectedHospitalObj } = useHospitalContext();
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState(selectedHospitalObj?.id ?? '');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [scope, setScope] = useState<ReportScope>(initialScope);
  const [authorsText, setAuthorsText] = useState(getDefaultAuthors(profile?.full_name, profile?.role));
  const [includePptx, setIncludePptx] = useState(true);
  const [includePdf, setIncludePdf] = useState(true);
  const [includePng, setIncludePng] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [exporting, setExporting] = useState<'pdf' | 'ppt' | 'all' | null>(null);
  const [reportText, setReportText] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fallbackHospitalId = selectedHospitalObj?.id ?? hospitals[0]?.id ?? '';
    const nextHospitalId = initialHospitalId ?? fallbackHospitalId;
    const sourceForLatestMonth = nextHospitalId
      ? allRawRecords.filter((record) =>
        record.hospitalId
          ? record.hospitalId === nextHospitalId
          : record.hospitalName === hospitals.find((hospital) => hospital.id === nextHospitalId)?.name,
      )
      : allRawRecords;

    setSelectedHospitalId(nextHospitalId);
    setScope(initialScope);
    setSelectedMonth(initialMonth ?? getLatestMonthValue(sourceForLatestMonth));
    setAuthorsText(getDefaultAuthors(profile?.full_name, profile?.role));
    setIncludePptx(true);
    setIncludePdf(true);
    setIncludePng(true);
    setIsGenerating(false);
    setProgressText('');
    setExporting(null);
    setReportText('');
    setReportLoading(false);
  }, [
    allRawRecords,
    hospitals,
    initialHospitalId,
    initialMonth,
    initialScope,
    isOpen,
    profile?.full_name,
    profile?.role,
    selectedHospitalObj?.id,
  ]);

  const monthRecords = useMemo(
    () => filterRecordsByMonth(allRawRecords, selectedMonth),
    [allRawRecords, selectedMonth],
  );

  const effectiveHospitalId = scope === 'global' ? 'all' : selectedHospitalId;
  const selectedHospitalName = effectiveHospitalId === 'all'
    ? null
    : hospitals.find((hospital) => hospital.id === effectiveHospitalId)?.name ?? null;

  const scopedRecords = useMemo(() => {
    if (effectiveHospitalId === 'all') {
      return monthRecords;
    }

    if (!selectedHospitalName) {
      return [];
    }

    return monthRecords.filter((record) =>
      record.hospitalId
        ? record.hospitalId === effectiveHospitalId
        : record.hospitalName === selectedHospitalName,
    );
  }, [effectiveHospitalId, monthRecords, selectedHospitalName]);

  const { adherenciaData, conductasData, servicioData, tipoData, isLoading, isEmpty } = useProaCharts({
    evaluaciones: monthRecords,
    hospitalId: effectiveHospitalId === 'all' ? undefined : effectiveHospitalId,
  });

  const hospitalLabel = getCommitteeHospitalLabel(selectedHospitalName);
  const periodLabel = formatMonthLabel(selectedMonth);
  const subtitle = `${scope === 'global' ? 'Todos los hospitales' : hospitalLabel} (n=${scopedRecords.length})`;
  const adherenciaAnalysis = useMemo(() => getAdherenciaAnalysis(adherenciaData), [adherenciaData]);
  const conductasAnalysis = useMemo(() => getConductasAnalysis(conductasData), [conductasData]);
  const servicioAnalysis = useMemo(() => getServicioAnalysis(servicioData), [servicioData]);
  const tipoAnalysis = useMemo(() => getTipoIntervencionAnalysis(tipoData), [tipoData]);

  const authors = useMemo(() => {
    const lines = authorsText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    return lines.length > 0 ? lines : ['Equipo PROA'];
  }, [authorsText]);

  const comparisonData = useMemo(() => {
    if (initialMonth !== selectedMonth) {
      return {
        mesComparar: undefined,
        tablaComparativa: undefined,
      };
    }

    return {
      mesComparar,
      tablaComparativa,
    };
  }, [initialMonth, mesComparar, selectedMonth, tablaComparativa]);

  const kpis = useMemo(
    () => [
      { label: 'Evaluaciones', value: String(scopedRecords.length) },
      { label: 'Aprobacion', value: `${pct(adherenciaData.adheridos, adherenciaData.total)}%` },
      {
        label: 'Cultivos previos',
        value: `${pct(scopedRecords.filter((record) => isYes(record.cultivosPrevios)).length, scopedRecords.length)}%`,
      },
      {
        label: 'Terapia empirica',
        value: `${pct(scopedRecords.filter((record) => isYes(record.terapiaEmpricaApropiada)).length, scopedRecords.length)}%`,
      },
    ],
    [adherenciaData.adheridos, adherenciaData.total, scopedRecords],
  );

  useEffect(() => {
    if (!isOpen || isEmpty || scopedRecords.length === 0) {
      setReportText('');
      setReportLoading(false);
      return;
    }

    let cancelled = false;
    setReportLoading(true);

    void generateProaReport({
      hospitalNombre: scope === 'global' ? 'Todos los hospitales' : hospitalLabel,
      mes: periodLabel,
      totalEvaluaciones: scopedRecords.length,
      tipoAnalisis: tipoAnalysis,
      servicioAnalisis: servicioAnalysis,
      conductaAnalisis: conductasAnalysis,
      adherenciaAnalisis: adherenciaAnalysis,
      mesComparar: comparisonData.mesComparar,
      tablaComparativa: comparisonData.tablaComparativa,
    }).then((text) => {
      if (!cancelled) {
        setReportText(text);
        setReportLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    adherenciaAnalysis,
    comparisonData.mesComparar,
    comparisonData.tablaComparativa,
    conductasAnalysis,
    hospitalLabel,
    isEmpty,
    isOpen,
    periodLabel,
    scopedRecords.length,
    scope,
    servicioAnalysis,
    tipoAnalysis,
  ]);

  async function handleCopyText() {
    if (!reportText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(reportText);
      toast.success('Texto del reporte copiado');
    } catch {
      toast.error('No fue posible copiar el texto del reporte.');
    }
  }

  async function buildReportInput(): Promise<PDFReportInput> {
    const hospitalNombre = scope === 'global' ? 'Todos los hospitales' : hospitalLabel;
    const reporteTextoIA = reportText || (await generateProaReport({
      hospitalNombre,
      mes: periodLabel,
      totalEvaluaciones: scopedRecords.length,
      tipoAnalisis: tipoAnalysis,
      servicioAnalisis: servicioAnalysis,
      conductaAnalisis: conductasAnalysis,
      adherenciaAnalisis: adherenciaAnalysis,
      mesComparar: comparisonData.mesComparar,
      tablaComparativa: comparisonData.tablaComparativa,
    }));

    return {
      hospitalNombre,
      mes: periodLabel,
      totalEvaluaciones: scopedRecords.length,
      reporteTextoIA,
      mesComparar: comparisonData.mesComparar,
      tablaComparativa: comparisonData.tablaComparativa,
      rootElement: previewRef.current,
      kpis,
      authors,
    };
  }

  async function handleExportPDF() {
    if (scopedRecords.length === 0 || isEmpty) {
      toast.error('No hay datos para generar el PDF del periodo seleccionado.');
      return;
    }

    setExporting('pdf');
    try {
      const reportInput = await buildReportInput();
      await exportPDF(reportInput);
    } finally {
      setExporting(null);
    }
  }

  async function handleExportPowerPoint() {
    if (scopedRecords.length === 0 || isEmpty) {
      toast.error('No hay datos para generar el PowerPoint del periodo seleccionado.');
      return;
    }

    setExporting('ppt');
    try {
      const reportInput = await buildReportInput();
      await exportPowerPoint(reportInput);
    } finally {
      setExporting(null);
    }
  }

  async function handleGenerateReport() {
    if (!includePptx && !includePdf && !includePng) {
      toast.error('Selecciona al menos un formato de descarga.');
      return;
    }

    if (scopedRecords.length === 0 || isEmpty) {
      toast.error('No hay datos para generar el reporte del periodo seleccionado.');
      return;
    }

    const reportHospitalName = scope === 'global' ? 'Todos los hospitales' : hospitalLabel;
    const loadingToastId = toast.loading('Generando reporte del comite PROA...');
    setIsGenerating(true);
    setExporting('all');

    try {
      setProgressText('Generando graficas... (1/3)');
      await new Promise((resolve) => window.setTimeout(resolve, 80));

      setProgressText('Creando reportes... (2/3)');
      const reportInput = await buildReportInput();

      if (includePptx) {
        await exportPowerPoint(reportInput);
      }

      if (includePdf) {
        await exportPDF(reportInput);
      }

      setProgressText('Preparando descarga... (3/3)');
      if (includePng) {
        await exportAllChartsAsPNG(
          reportHospitalName,
          periodLabel,
          PREVIEW_CHARTS.map((chart) => ({ id: chart.id, filename: chart.filename })),
        );
      }

      toast.success('Reporte generado. Revisa tu carpeta de descargas.', { id: loadingToastId });
      setIsGenerating(false);
      setExporting(null);
      setProgressText('');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible generar el reporte.';
      toast.error(message, { id: loadingToastId });
      setIsGenerating(false);
      setExporting(null);
      setProgressText('');
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Generar Reporte del Comite PROA</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Configura el alcance y descarga el informe mensual listo para comite.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/40">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Parametros del reporte</h3>

              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Hospital</span>
                  <select
                    value={selectedHospitalId}
                    onChange={(event) => setSelectedHospitalId(event.target.value)}
                    disabled={scope === 'global'}
                    className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-teal-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  >
                    {hospitals.map((hospital) => (
                      <option key={hospital.id} value={hospital.id}>
                        {hospital.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Periodo</span>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-teal-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  />
                </label>

                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Alcance</legend>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                      <input
                        type="radio"
                        name="scope"
                        checked={scope === 'hospital'}
                        onChange={() => setScope('hospital')}
                        className="h-4 w-4 text-teal-600"
                      />
                      <span>Solo este hospital</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                      <input
                        type="radio"
                        name="scope"
                        checked={scope === 'global'}
                        onChange={() => setScope('global')}
                        className="h-4 w-4 text-teal-600"
                      />
                      <span>Global (todos los hospitales)</span>
                    </label>
                  </div>
                </fieldset>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Autores</span>
                  <textarea
                    value={authorsText}
                    onChange={(event) => setAuthorsText(event.target.value)}
                    rows={5}
                    placeholder={'Dr. Juan Perez - Infectologo\nDra. Ana Garcia - Epidemiologa\nQF Carlos Lopez'}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none transition-colors focus:border-teal-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/40">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Opciones de exportacion</h3>
              <div className="mt-4 space-y-2">
                <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={includePptx}
                    onChange={(event) => setIncludePptx(event.target.checked)}
                    className="h-4 w-4 rounded text-teal-600"
                  />
                  <Presentation className="h-4 w-4 text-teal-600" />
                  <span>PowerPoint (.pptx)</span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={includePdf}
                    onChange={(event) => setIncludePdf(event.target.checked)}
                    className="h-4 w-4 rounded text-teal-600"
                  />
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>PDF</span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={includePng}
                    onChange={(event) => setIncludePng(event.target.checked)}
                    className="h-4 w-4 rounded text-teal-600"
                  />
                  <FileImage className="h-4 w-4 text-emerald-600" />
                  <span>Imagenes PNG (4 archivos)</span>
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4 dark:border-teal-900/40 dark:bg-teal-950/30">
              <p className="text-sm font-semibold text-teal-900 dark:text-teal-200">Resumen seleccionado</p>
              <p className="mt-1 text-sm text-teal-700 dark:text-teal-300">
                {scope === 'global' ? 'Todos los hospitales' : hospitalLabel} - {periodLabel}
              </p>
              <p className="mt-2 text-xs text-teal-700 dark:text-teal-300">
                Basado en {scopedRecords.length} evaluacion{scopedRecords.length === 1 ? '' : 'es'} del periodo.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Vista previa de las graficas</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Revisa rapidamente la informacion que se descargara en el reporte.
              </p>
            </div>

            {isEmpty ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
                <EmptyState
                  icon={BarChart3}
                  title="Sin datos para este reporte"
                  description="Ajusta el hospital o el mes para generar la vista previa de las graficas."
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div ref={previewRef} className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <div data-chart={PREVIEW_CHARTS[0].dataChart}>
                    <TipoIntervencionCommitteeChart
                      cardId={PREVIEW_CHARTS[0].id}
                      title="Tipo de Intervenciones PROA"
                      subtitle={subtitle}
                      data={tipoData}
                      analysis={tipoAnalysis}
                      isLoading={isLoading}
                      onExport={() => {}}
                      chartHeightClassName="h-48"
                      showExportButton={false}
                      showAnalysis={false}
                    />
                  </div>
                  <div data-chart={PREVIEW_CHARTS[1].dataChart}>
                    <DistribucionServicioChart
                      cardId={PREVIEW_CHARTS[1].id}
                      title="Intervenciones por Servicio"
                      subtitle={subtitle}
                      data={servicioData}
                      analysis={servicioAnalysis}
                      isLoading={isLoading}
                      onExport={() => {}}
                      chartHeightClassName="h-48"
                      showExportButton={false}
                      showAnalysis={false}
                    />
                  </div>
                  <div data-chart={PREVIEW_CHARTS[2].dataChart}>
                    <ConductasChart
                      cardId={PREVIEW_CHARTS[2].id}
                      title="Conductas de Infectologia por Servicio"
                      subtitle={subtitle}
                      data={conductasData}
                      analysis={conductasAnalysis}
                      isLoading={isLoading}
                      onExport={() => {}}
                      chartHeightClassName="h-48"
                      showExportButton={false}
                      showAnalysis={false}
                    />
                  </div>
                  <div data-chart={PREVIEW_CHARTS[3].dataChart}>
                    <AdherenciaChart
                      cardId={PREVIEW_CHARTS[3].id}
                      title="Adherencia a las Intervenciones"
                      subtitle={subtitle}
                      data={adherenciaData}
                      analysis={adherenciaAnalysis}
                      isLoading={isLoading}
                      onExport={() => {}}
                      chartHeightClassName="h-48"
                      showExportButton={false}
                      showAnalysis={false}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950/40">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Analisis con IA</h3>
                    <button
                      type="button"
                      onClick={() => {
                        void handleCopyText();
                      }}
                      disabled={!reportText || reportLoading}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar texto
                    </button>
                  </div>

                  {reportLoading ? (
                    <div className="mt-4 space-y-2 animate-pulse">
                      <div className="h-4 w-11/12 rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-4 w-10/12 rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-4 w-9/12 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                  ) : (
                    <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-6 text-gray-600 dark:text-gray-300">
                      {reportText || 'No hay analisis disponible para este reporte.'}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-5 text-sm text-gray-500 dark:text-gray-400">
            {progressText ? <span>{progressText}</span> : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                void handleCopyText();
              }}
              disabled={!reportText || reportLoading || isGenerating || exporting !== null}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Copy className="h-4 w-4" />
              Copiar texto
            </button>
            <button
              type="button"
              onClick={() => {
                void handleExportPDF();
              }}
              disabled={isGenerating || isLoading || exporting !== null}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {exporting === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Descargar PDF
            </button>
            <button
              type="button"
              onClick={() => {
                void handleExportPowerPoint();
              }}
              disabled={isGenerating || isLoading || exporting !== null}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {exporting === 'ppt' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Presentation className="h-4 w-4" />}
              PowerPoint
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating || exporting !== null}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => {
                void handleGenerateReport();
              }}
              disabled={isGenerating || isLoading || exporting !== null}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating || exporting === 'all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Generar y Descargar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
