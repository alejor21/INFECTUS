import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface PdfChartPage {
  id: string;
  title: string;
  analysis: string[];
}

export interface ExportChartsPDFData {
  charts: PdfChartPage[];
}

interface ChartExportTarget {
  id: string;
  filename: string;
}

const CHART_EXPORT_ORDER: ChartExportTarget[] = [
  { id: 'proa-chart-tipo-intervencion', filename: 'TipoIntervencion' },
  { id: 'proa-chart-servicio', filename: 'PorServicio' },
  { id: 'proa-chart-conductas', filename: 'Conductas' },
  { id: 'proa-chart-adherencia', filename: 'Adherencia' },
];

function sanitizeFilePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function captureChartCanvas(elementId: string): Promise<HTMLCanvasElement> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`No se encontro la grafica ${elementId}.`);
  }

  return html2canvas(element, {
    backgroundColor: '#FFFFFF',
    scale: 2,
    useCORS: true,
  });
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export async function exportChartAsPNG(elementId: string, filename: string): Promise<void> {
  try {
    const canvas = await captureChartCanvas(elementId);
    downloadDataUrl(canvas.toDataURL('image/png'), `${sanitizeFilePart(filename)}.png`);
    toast.success('Imagen descargada');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No fue posible exportar la imagen.';
    toast.error(message);
    throw error;
  }
}

export async function exportAllChartsAsPNG(
  hospitalName: string,
  period: string,
  chartTargets: ChartExportTarget[] = CHART_EXPORT_ORDER,
): Promise<void> {
  const totalCharts = chartTargets.length;
  const toastId = toast.loading(`Exportando grafica 1 de ${totalCharts}...`);

  try {
    for (let index = 0; index < chartTargets.length; index += 1) {
      const chart = chartTargets[index];
      toast.loading(`Exportando grafica ${index + 1} de ${totalCharts}...`, { id: toastId });
      const canvas = await captureChartCanvas(chart.id);
      downloadDataUrl(
        canvas.toDataURL('image/png'),
        `${sanitizeFilePart(hospitalName)}_${chart.filename}_${sanitizeFilePart(period)}.png`,
      );
    }

    toast.success(`${totalCharts} graficas descargadas`, { id: toastId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No fue posible exportar las graficas.';
    toast.error(message, { id: toastId });
    throw error;
  }
}

export async function exportChartsPDF(
  hospitalName: string,
  period: string,
  data: ExportChartsPDFData,
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const generatedAt = new Date().toLocaleDateString('es-CO');

  doc.setFillColor(30, 96, 145);
  doc.rect(0, 0, pageWidth, 38, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text('PROGRAMA DE OPTIMIZACION DE ANTIMICROBIANOS (PROA)', 18, 18);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(period, 18, 27);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(hospitalName, 18, 62);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado por INFECTUS - ${generatedAt}`, 18, 72);

  for (const chart of data.charts) {
    const canvas = await captureChartCanvas(chart.id);
    const imageData = canvas.toDataURL('image/png');

    doc.addPage();
    doc.setTextColor(26, 26, 26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(chart.title, 16, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`${hospitalName} - ${period}`, 16, 28);

    doc.addImage(imageData, 'PNG', 14, 36, 182, 108);

    let currentY = 156;
    doc.setFontSize(10);
    chart.analysis.forEach((line) => {
      const wrapped = doc.splitTextToSize(`- ${line}`, 175);
      doc.text(wrapped, 16, currentY);
      currentY += wrapped.length * 5 + 2;
    });
  }

  doc.save(`${sanitizeFilePart(hospitalName)}_PROA_${sanitizeFilePart(period)}.pdf`);
  toast.success('PDF generado y descargado');
}
