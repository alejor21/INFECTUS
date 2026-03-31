import PptxGenJS from 'pptxgenjs';
import { toast } from 'sonner';
import type { PDFReportInput } from './exportPDF';
import { captureCharts } from './exportPDF';

const TEAL = '01696F';
const WHITE = 'FFFFFF';
const DARK = '28251D';
const LIGHT = 'F7F6F2';

function sanitizeFilePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function addSlideTitle(slide: PptxGenJS.Slide, title: string): void {
  slide.addText(title, {
    x: 0.3,
    y: 0.15,
    w: 12.4,
    h: 0.45,
    fontSize: 14,
    bold: true,
    color: TEAL,
  });
}

export async function exportPowerPoint(input: PDFReportInput): Promise<void> {
  try {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'INFECTUS';
    pptx.company = 'INFECTUS';
    pptx.subject = 'Reporte PROA';
    pptx.title = `Reporte PROA ${input.hospitalNombre} ${input.mes}`;

    const slide1 = pptx.addSlide();
    slide1.background = { color: TEAL };
    slide1.addText('INFECTUS', {
      x: 0.5,
      y: 1.45,
      w: 12,
      h: 0.8,
      fontSize: 40,
      bold: true,
      color: WHITE,
      align: 'center',
    });
    slide1.addText(`Reporte Comite PROA\n${input.hospitalNombre}`, {
      x: 0.5,
      y: 2.45,
      w: 12,
      h: 0.9,
      fontSize: 22,
      color: WHITE,
      align: 'center',
      breakLine: false,
    });
    slide1.addText(input.mes, {
      x: 0.5,
      y: 3.6,
      w: 12,
      h: 0.5,
      fontSize: 18,
      color: 'CEDCD8',
      align: 'center',
      italic: true,
    });
    slide1.addText(`Total evaluaciones: ${input.totalEvaluaciones}`, {
      x: 0.5,
      y: 4.35,
      w: 12,
      h: 0.4,
      fontSize: 14,
      color: WHITE,
      align: 'center',
    });
    if (input.authors && input.authors.length > 0) {
      slide1.addText(input.authors.join('\n'), {
        x: 1.2,
        y: 4.85,
        w: 10.6,
        h: 0.9,
        fontSize: 10,
        color: 'CEDCD8',
        align: 'center',
        breakLine: false,
      });
    }

    const charts = await captureCharts(input.rootElement);

    const slide2 = pptx.addSlide();
    slide2.background = { color: LIGHT };
    addSlideTitle(slide2, `Indicadores PROA - ${input.mes}`);
    if (charts['tipo-intervencion']) {
      slide2.addImage({ data: charts['tipo-intervencion'], x: 0.3, y: 0.7, w: 6.0, h: 3.5 });
    }
    if (charts['por-servicio']) {
      slide2.addImage({ data: charts['por-servicio'], x: 6.7, y: 0.7, w: 6.0, h: 3.5 });
    }

    const slide3 = pptx.addSlide();
    slide3.background = { color: LIGHT };
    addSlideTitle(slide3, `Indicadores PROA - ${input.mes}`);
    if (charts['conductas']) {
      slide3.addImage({ data: charts['conductas'], x: 0.3, y: 0.7, w: 6.0, h: 3.5 });
    }
    if (charts['adherencia']) {
      slide3.addImage({ data: charts['adherencia'], x: 6.7, y: 0.7, w: 6.0, h: 3.5 });
    }

    const slide4 = pptx.addSlide();
    slide4.background = { color: LIGHT };
    addSlideTitle(slide4, 'Analisis con Inteligencia Artificial');
    slide4.addText(input.reporteTextoIA, {
      x: 0.3,
      y: 0.7,
      w: 12.4,
      h: 5.8,
      fontSize: 8.5,
      color: DARK,
      valign: 'top',
      margin: 0.08,
      breakLine: false,
      fit: 'shrink',
    });

    if (input.tablaComparativa && input.tablaComparativa.length > 0 && input.mesComparar) {
      const slide5 = pptx.addSlide();
      slide5.background = { color: LIGHT };
      addSlideTitle(slide5, `Comparativa: ${input.mes} vs ${input.mesComparar}`);
      slide5.addTable(
        [
          ['Indicador', input.mes, input.mesComparar, 'Diferencia'],
          ...input.tablaComparativa.map((row) => [row.indicador, row.mes1, row.mes2, row.diff]),
        ],
        {
          x: 0.5,
          y: 0.8,
          w: 12,
          h: 5.4,
          fontSize: 9,
          color: DARK,
          border: { type: 'solid', color: 'DCD9D5', pt: 0.5 },
          fill: LIGHT,
          bold: false,
          rowH: 0.45,
          autoFit: false,
          colW: [3.6, 2.6, 2.6, 3.2],
        },
      );
    }

    await pptx.writeFile({
      fileName: `Reporte_PROA_${sanitizeFilePart(input.hospitalNombre)}_${sanitizeFilePart(input.mes)}.pptx`,
    });
    toast.success('PowerPoint generado y descargado');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No fue posible generar el PowerPoint.';
    toast.error(message);
    throw error;
  }
}
