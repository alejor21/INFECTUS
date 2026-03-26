import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, FileImage, FileText, Presentation, X } from 'lucide-react';
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
import { generateProaPPTX } from '../../utils/generatePPTX';
import { exportAllChartsAsPNG, exportChartsPDF } from '../../utils/exportCharts';
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
}

const PREVIEW_CHARTS = [
  { id: 'proa-report-preview-tipo', filename: 'TipoIntervencion', title: 'Tipo de Intervenciones PROA' },
  { id: 'proa-report-preview-servicio', filename: 'PorServicio', title: 'Intervenciones por Servicio' },
  { id: 'proa-report-preview-conductas', filename: 'Conductas', title: 'Conductas de Infectologia por Servicio' },
  { id: 'proa-report-preview-adherencia', filename: 'Adherencia', title: 'Adherencia a las Intervenciones' },
] as const;

function getDefaultAuthors(fullName: string | null | undefined, role: string | null | undefined): string {
  if (!fullName) {
    return 'Equipo PROA';
  }

  return `${fullName} - ${role ?? 'Equipo PROA'}`;
}

function buildPdfData(
  adherenciaAnalysis: string[],
  conductasAnalysis: string[],
  servicioAnalysis: string[],
  tipoAnalysis: string[],
) {
  return {
    charts: [
      {
        id: PREVIEW_CHARTS[0].id,
        title: PREVIEW_CHARTS[0].title,
        analysis: tipoAnalysis,
      },
      {
        id: PREVIEW_CHARTS[1].id,
        title: PREVIEW_CHARTS[1].title,
        analysis: servicioAnalysis,
      },
      {
        id: PREVIEW_CHARTS[2].id,
        title: PREVIEW_CHARTS[2].title,
        analysis: conductasAnalysis,
      },
      {
        id: PREVIEW_CHARTS[3].id,
        title: PREVIEW_CHARTS[3].title,
        analysis: adherenciaAnalysis,
      },
    ],
  };
}

export function ProaReportModal({
  isOpen,
  onClose,
  initialHospitalId,
  initialMonth,
  initialScope = 'hospital',
}: ProaReportModalProps) {
  const { profile } = useAuth();
  const { allRawRecords, hospitals, selectedHospitalObj } = useHospitalContext();
  const [selectedHospitalId, setSelectedHospitalId] = useState(selectedHospitalObj?.id ?? '');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [scope, setScope] = useState<ReportScope>(initialScope);
  const [authorsText, setAuthorsText] = useState(getDefaultAuthors(profile?.full_name, profile?.role));
  const [includePptx, setIncludePptx] = useState(true);
  const [includePdf, setIncludePdf] = useState(true);
  const [includePng, setIncludePng] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressText, setProgressText] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fallbackHospitalId = selectedHospitalObj?.id ?? hospitals[0]?.id ?? '';
    const nextHospitalId = initialHospitalId ?? fallbackHospitalId;
    const selectedHospitalName = hospitals.find((hospital) => hospital.id === nextHospitalId)?.name ?? null;
    const sourceForLatestMonth = selectedHospitalName
      ? allRawRecords.filter((record) => record.hospitalName === selectedHospitalName)
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

    return monthRecords.filter((record) => record.hospitalName === selectedHospitalName);
  }, [effectiveHospitalId, monthRecords, selectedHospitalName]);

  const {
    adherenciaData,
    conductasData,
    servicioData,
    tipoData,
    isLoading,
    isEmpty,
  } = useProaCharts({
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
  const pdfData = useMemo(
    () => buildPdfData(adherenciaAnalysis, conductasAnalysis, servicioAnalysis, tipoAnalysis),
    [adherenciaAnalysis, conductasAnalysis, servicioAnalysis, tipoAnalysis],
  );

  const authors = useMemo(() => {
    const lines = authorsText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    return lines.length > 0 ? lines : ['Equipo PROA'];
  }, [authorsText]);

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

    try {
      setProgressText('Generando graficas... (1/3)');
      await new Promise((resolve) => window.setTimeout(resolve, 80));

      setProgressText('Creando reportes... (2/3)');
      if (includePptx) {
        await generateProaPPTX({
          hospitalName: reportHospitalName,
          period: periodLabel,
          authors,
          adherenciaData,
          conductasData,
          servicioData,
          tipoData,
        });
      }

      if (includePdf) {
        await exportChartsPDF(reportHospitalName, periodLabel, pdfData);
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
      setProgressText('');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible generar el reporte.';
      toast.error(message, { id: loadingToastId });
      setIsGenerating(false);
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
                {scope === 'global' ? 'Todos los hospitales' : hospitalLabel} · {periodLabel}
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
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
              onClick={onClose}
              disabled={isGenerating}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                void handleGenerateReport();
              }}
              disabled={isGenerating || isLoading}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className={`h-4 w-4 ${isGenerating ? 'animate-pulse' : ''}`} />
              Generar y Descargar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
