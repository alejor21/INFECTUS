import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import type { ReportComparisonRow } from './generateProaReport';

export interface PDFReportInput {
  hospitalNombre: string;
  mes: string;
  totalEvaluaciones: number;
  reporteTextoIA: string;
  mesComparar?: string;
  tablaComparativa?: ReportComparisonRow[];
  rootElement?: ParentNode | null;
  kpis?: Array<{ label: string; value: string }>;
  authors?: string[];
}

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const MARGIN_MM = 15;
const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - MARGIN_MM * 2;
const CHART_NAMES = ['tipo-intervencion', 'por-servicio', 'conductas', 'adherencia'] as const;

function sanitizeFilePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function drawKpiCards(pdf: jsPDF, kpis: Array<{ label: string; value: string }>, startY: number): number {
  if (kpis.length === 0) {
    return startY;
  }

  const gap = 4;
  const cardWidth = (CONTENT_WIDTH_MM - gap * 3) / 4;
  const cardHeight = 22;

  kpis.slice(0, 4).forEach((kpi, index) => {
    const x = MARGIN_MM + (cardWidth + gap) * index;
    pdf.setFillColor(247, 246, 242);
    pdf.roundedRect(x, startY, cardWidth, cardHeight, 3, 3, 'F');
    pdf.setTextColor(80, 80, 80);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(kpi.label, x + 3, startY + 7);
    pdf.setTextColor(40, 37, 29);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(kpi.value, x + 3, startY + 16);
  });

  return startY + cardHeight + 10;
}

function drawComparisonTable(
  pdf: jsPDF,
  mes: string,
  mesComparar: string,
  tablaComparativa: ReportComparisonRow[],
): void {
  let y = 20;
  const colWidths = [70, 35, 35, 40];
  const headers = ['Indicador', mes, mesComparar, 'Diferencia'];

  pdf.setFillColor(1, 105, 111);
  pdf.rect(0, 0, PAGE_WIDTH_MM, 12, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(`Comparativa: ${mes} vs ${mesComparar}`, MARGIN_MM, 8.5);

  pdf.setFillColor(220, 220, 215);
  pdf.rect(MARGIN_MM, y, CONTENT_WIDTH_MM, 7, 'F');
  pdf.setTextColor(40, 37, 29);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);

  let x = MARGIN_MM;
  headers.forEach((header, index) => {
    pdf.text(header, x + 2, y + 4.8);
    x += colWidths[index];
  });

  y += 9;
  pdf.setFont('helvetica', 'normal');

  tablaComparativa.forEach((row) => {
    if (y > PAGE_HEIGHT_MM - MARGIN_MM) {
      pdf.addPage();
      y = MARGIN_MM;
    }

    let currentX = MARGIN_MM;
    pdf.setTextColor(40, 37, 29);
    pdf.text(row.indicador, currentX + 2, y + 4.5);
    currentX += colWidths[0];
    pdf.text(row.mes1, currentX + 2, y + 4.5);
    currentX += colWidths[1];
    pdf.text(row.mes2, currentX + 2, y + 4.5);
    currentX += colWidths[2];
    pdf.setTextColor(row.positivo ? 39 : 161, row.positivo ? 122 : 44, row.positivo ? 34 : 123);
    pdf.text(row.diff, currentX + 2, y + 4.5);
    pdf.setDrawColor(220, 217, 213);
    pdf.line(MARGIN_MM, y + 7, MARGIN_MM + CONTENT_WIDTH_MM, y + 7);
    y += 8;
  });
}

export async function captureCharts(rootElement?: ParentNode | null): Promise<Record<string, string>> {
  const charts: Record<string, string> = {};
  const scope = rootElement ?? document;
  const chartElements = Array.from(scope.querySelectorAll<HTMLElement>('[data-chart]'));

  for (const element of chartElements) {
    const name = element.getAttribute('data-chart');
    if (!name) {
      continue;
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
    charts[name] = canvas.toDataURL('image/png');
  }

  return charts;
}

export async function exportPDF(input: PDFReportInput): Promise<void> {
  try {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const kpis = input.kpis ?? [{ label: 'Evaluaciones', value: String(input.totalEvaluaciones) }];

    pdf.setFillColor(1, 105, 111);
    pdf.rect(0, 0, PAGE_WIDTH_MM, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text('INFECTUS - Reporte PROA', MARGIN_MM, 22);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.text(`${input.hospitalNombre} - ${input.mes}`, MARGIN_MM, 31.5);

    let y = 55;
    pdf.setTextColor(40, 37, 29);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('Resumen del periodo', MARGIN_MM, y);
    y += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Total evaluaciones analizadas: ${input.totalEvaluaciones}`, MARGIN_MM, y);
    y += 8;
    y = drawKpiCards(pdf, kpis, y);

    const charts = await captureCharts(input.rootElement);

    pdf.addPage();
    pdf.setFillColor(1, 105, 111);
    pdf.rect(0, 0, PAGE_WIDTH_MM, 12, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(`Indicadores PROA - ${input.mes}`, MARGIN_MM, 8.5);

    const chartWidth = (CONTENT_WIDTH_MM - 5) / 2;
    const chartHeight = chartWidth * 0.7;
    const positions = [
      { x: MARGIN_MM, y: 18 },
      { x: MARGIN_MM + chartWidth + 5, y: 18 },
      { x: MARGIN_MM, y: 18 + chartHeight + 5 },
      { x: MARGIN_MM + chartWidth + 5, y: 18 + chartHeight + 5 },
    ];

    CHART_NAMES.forEach((chartName, index) => {
      const imageData = charts[chartName];
      if (imageData) {
        pdf.addImage(imageData, 'PNG', positions[index].x, positions[index].y, chartWidth, chartHeight);
      }
    });

    pdf.addPage();
    pdf.setFillColor(1, 105, 111);
    pdf.rect(0, 0, PAGE_WIDTH_MM, 12, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Analisis con Inteligencia Artificial', MARGIN_MM, 8.5);

    y = 20;
    pdf.setTextColor(40, 37, 29);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const lines = pdf.splitTextToSize(input.reporteTextoIA, CONTENT_WIDTH_MM);
    for (const line of lines) {
      if (y > PAGE_HEIGHT_MM - MARGIN_MM) {
        pdf.addPage();
        y = MARGIN_MM;
      }
      pdf.text(String(line), MARGIN_MM, y);
      y += 4.5;
    }

    if (input.tablaComparativa && input.tablaComparativa.length > 0 && input.mesComparar) {
      pdf.addPage();
      drawComparisonTable(pdf, input.mes, input.mesComparar, input.tablaComparativa);
    }

    pdf.save(`Reporte_PROA_${sanitizeFilePart(input.hospitalNombre)}_${sanitizeFilePart(input.mes)}.pdf`);
    toast.success('PDF generado y descargado');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No fue posible generar el PDF.';
    toast.error(message);
    throw error;
  }
}
