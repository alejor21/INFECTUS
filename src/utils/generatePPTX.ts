import pptxgen from 'pptxgenjs';
import {
  getAdherenciaAnalysis,
  getConductasAnalysis,
  getServicioAnalysis,
  getTipoIntervencionAnalysis,
  safePct,
} from '../lib/analytics/proaCommittee';
import type {
  AdherenciaChartData,
  ConductaChartDatum,
  ServicioChartDatum,
  TipoIntervencionChartDatum,
} from '../hooks/useProaCharts';
import { toast } from 'sonner';

export interface PPTXParams {
  hospitalName: string;
  period: string;
  authors: string[];
  adherenciaData: AdherenciaChartData;
  conductasData: ConductaChartDatum[];
  servicioData: ServicioChartDatum[];
  tipoData: TipoIntervencionChartDatum[];
  logoUrl?: string;
}

interface ChartSeries {
  name: string;
  labels: string[];
  values: number[];
}

const SLIDE_W = 10;
const SLIDE_H = 5.63;
const ACCENT_BAR_COLOR = 'C0392B';
const TITLE_COLOR = '002060';
const BODY_COLOR = '1A1A1A';

function sanitizeFilePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function addSlideChrome(slide: pptxgen.Slide): void {
  slide.background = { color: 'FFFFFF' };
  slide.addShape(pptxgen.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.15,
    h: SLIDE_H,
    fill: { color: ACCENT_BAR_COLOR },
    line: { color: ACCENT_BAR_COLOR },
  });
}

function addTextBlock(slide: pptxgen.Slide, lines: string[], startY: number): void {
  let currentY = startY;
  lines.forEach((line) => {
    slide.addText(line, {
      x: 0.55,
      y: currentY,
      w: 3.2,
      h: 0.32,
      fontFace: 'Calibri',
      fontSize: 11,
      color: BODY_COLOR,
      valign: 'middle',
      margin: 0,
    });
    currentY += 0.32;
  });
}

function addTitlePanel(slide: pptxgen.Slide, title: string, heading: string, lines: string[]): void {
  addSlideChrome(slide);
  slide.addText(title.toUpperCase(), {
    x: 0.55,
    y: 0.45,
    w: 3.25,
    h: 0.8,
    fontFace: 'Calibri',
    fontSize: 16,
    bold: true,
    color: TITLE_COLOR,
    margin: 0,
    valign: 'middle',
  });
  slide.addShape(pptxgen.ShapeType.line, {
    x: 0.55,
    y: 1.32,
    w: 2.1,
    h: 0,
    line: { color: 'E07B00', width: 1.2 },
  });
  slide.addText(heading, {
    x: 0.55,
    y: 1.48,
    w: 3,
    h: 0.32,
    fontFace: 'Calibri',
    fontSize: 12,
    bold: true,
    color: BODY_COLOR,
    margin: 0,
  });
  addTextBlock(slide, lines, 1.9);
}

function pieSeries(data: Array<{ label: string; count: number }>): ChartSeries[] {
  return [
    {
      name: 'Casos',
      labels: data.map((item) => item.label),
      values: data.map((item) => item.count),
    },
  ];
}

function barSeries(data: ConductaChartDatum[]): ChartSeries[] {
  return [
    {
      name: 'Casos',
      labels: data.map((item) => item.conducta),
      values: data.map((item) => item.count),
    },
  ];
}

function addPieChart(slide: pptxgen.Slide, data: Array<{ label: string; count: number }>, colors: string[]): void {
  slide.addChart(pptxgen.ChartType.pie, pieSeries(data), {
    x: 4.05,
    y: 0.7,
    w: 5.2,
    h: 4.0,
    chartColors: colors,
    showLegend: true,
    legendPos: 'b',
    legendFontFace: 'Calibri',
    legendFontSize: 10,
    showPercent: true,
    dataLabelPosition: 'bestFit',
    dataLabelColor: 'FFFFFF',
    dataLabelFontFace: 'Calibri',
    dataLabelFontSize: 9,
    showTitle: false,
  });
}

function addBarChart(slide: pptxgen.Slide, data: ConductaChartDatum[]): void {
  slide.addChart(pptxgen.ChartType.bar, barSeries(data), {
    x: 4.05,
    y: 0.8,
    w: 5.2,
    h: 3.9,
    chartColors: ['1E6091'],
    showLegend: false,
    showTitle: false,
    showValue: true,
    dataLabelPosition: 'outEnd',
    dataLabelFontFace: 'Calibri',
    dataLabelFontSize: 9,
    catAxisLabelFontFace: 'Calibri',
    catAxisLabelFontSize: 9,
    valAxisLabelFontFace: 'Calibri',
    valAxisLabelFontSize: 9,
    valAxisTitle: 'Numero de casos',
    valAxisTitleFontFace: 'Calibri',
    valAxisTitleFontSize: 9,
    showValAxisTitle: true,
    showCatAxisTitle: false,
    catAxisLabelRotate: 0,
  });
}

function buildTipoSlideLines(tipoData: TipoIntervencionChartDatum[]): string[] {
  const total = tipoData.reduce((sum, item) => sum + item.count, 0);
  const proa = tipoData.find((item) => item.tipo === 'PROA');
  const proaPct = safePct(proa?.count ?? 0, total);

  if (proaPct >= 40) {
    return [
      `Que el ${proaPct}% de las valoraciones provengan de captacion PROA indica un funcionamiento efectivo del programa, con capacidad de:`,
      '- Identificar oportunidades de optimizacion antimicrobiana.',
      '- Intervenir tempranamente sin depender exclusivamente de la interconsulta.',
      'Este hallazgo es coherente con estandares del MSPS - Resolucion 2471 y buenas practicas.',
    ];
  }

  return [
    `El ${proaPct}% de las valoraciones provienen de captacion PROA.`,
    'Se recomienda fortalecer la identificacion proactiva de pacientes para optimizacion antimicrobiana.',
  ];
}

function buildServicioSlideLines(servicioData: ServicioChartDatum[]): string[] {
  const topServices = servicioData.slice(0, 3);
  return [
    'La distribucion evidencia fortalecimiento en la implementacion de PROA en todas las areas asistenciales.',
    ...topServices.map((service) => `- ${service.servicio}: ${service.count} casos`),
  ];
}

function buildConductasSlideLines(conductasData: ConductaChartDatum[]): string[] {
  const top = conductasData[0];
  const total = conductasData.reduce((sum, item) => sum + item.count, 0);

  return [
    top ? `La accion predominante es ${top.conducta}.` : 'Sin conducta predominante registrada.',
    `Distribucion proporcional (n=${total}):`,
    ...conductasData.slice(0, 4).map((conducta) => `- ${conducta.conducta}: ${conducta.count} casos`),
  ];
}

function buildAdherenciaSlideLines(adherenciaData: AdherenciaChartData): string[] {
  const total = adherenciaData.total;
  const adheridosPct = safePct(adherenciaData.adheridos, total);
  const noAdheridosPct = safePct(adherenciaData.noAdheridos, total);

  const lines = [
    `- Adheridos: ${adherenciaData.adheridos} casos (${adheridosPct}%)`,
    `- No adherencia a recomendaciones: ${adherenciaData.noAdheridos} casos (${noAdheridosPct}%)`,
  ];

  if (adheridosPct >= 80) {
    lines.push(
      'El resultado evidencia una alta adherencia, aunque con un porcentaje de no adherencia clinicamente relevante, util para analisis de mejora continua y planes de intervencion.',
    );
  } else {
    lines.push(
      'El resultado evidencia una adherencia por debajo del estandar esperado. Se recomienda reforzar las estrategias de intervencion del equipo PROA.',
    );
  }

  return lines;
}

export async function generateProaPPTX(params: PPTXParams): Promise<void> {
  try {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'INFECTUS';
    pptx.company = 'INFECTUS';
    pptx.subject = 'Reporte Comite PROA';
    pptx.title = `PROA ${params.hospitalName} ${params.period}`;

    const portada = pptx.addSlide();
    addSlideChrome(portada);
    portada.addText('PROGRAMA DE OPTIMIZACION DE ANTIMICROBIANOS (PROA)', {
      x: 1.0,
      y: 1.1,
      w: 7.8,
      h: 0.9,
      fontFace: 'Calibri',
      fontSize: 20,
      bold: true,
      color: TITLE_COLOR,
      align: 'center',
      valign: 'middle',
      margin: 0,
    });
    portada.addText(params.period, {
      x: 1.0,
      y: 2.05,
      w: 7.8,
      h: 0.35,
      fontFace: 'Calibri',
      fontSize: 14,
      color: BODY_COLOR,
      align: 'center',
      margin: 0,
    });
    portada.addText(params.authors.join('\n'), {
      x: 1.7,
      y: 2.65,
      w: 6.6,
      h: 1.0,
      fontFace: 'Calibri',
      fontSize: 11,
      color: BODY_COLOR,
      align: 'center',
      valign: 'middle',
      margin: 0,
    });
    portada.addText(params.hospitalName, {
      x: 1.0,
      y: 4.1,
      w: 7.8,
      h: 0.35,
      fontFace: 'Calibri',
      fontSize: 12,
      bold: true,
      color: BODY_COLOR,
      align: 'center',
      margin: 0,
    });
    portada.addText('Generado por INFECTUS', {
      x: 0.7,
      y: 5.08,
      w: 8.6,
      h: 0.25,
      fontFace: 'Calibri',
      fontSize: 9,
      color: '7A7A7A',
      align: 'center',
      margin: 0,
    });

    const tipoSlide = pptx.addSlide();
    addTitlePanel(
      tipoSlide,
      `Tipo de intervenciones PROA del ${params.hospitalName} ${params.period} n=${params.tipoData.reduce((sum, item) => sum + item.count, 0)}`,
      'Fortalecimiento del PROA',
      buildTipoSlideLines(params.tipoData),
    );
    addPieChart(
      tipoSlide,
      params.tipoData.map((item) => ({ label: item.label, count: item.count })),
      ['#1A5276', '#2E86C1', '#85C1E9'],
    );

    const servicioSlide = pptx.addSlide();
    addTitlePanel(
      servicioSlide,
      `Intervenciones por servicio del ${params.hospitalName} ${params.period}`,
      'Cobertura asistencial',
      buildServicioSlideLines(params.servicioData),
    );
    addPieChart(
      servicioSlide,
      params.servicioData.map((item) => ({ label: item.servicio, count: item.count })),
      ['#1A5276', '#1F618D', '#2874A6', '#2E86C1', '#3498DB', '#5DADE2', '#85C1E9'],
    );

    const conductaSlide = pptx.addSlide();
    addTitlePanel(
      conductaSlide,
      `Conductas de infectologia por servicio del ${params.hospitalName} ${params.period}`,
      'Conductas predominantes',
      buildConductasSlideLines(params.conductasData),
    );
    addBarChart(conductaSlide, params.conductasData);

    const adherenciaSlide = pptx.addSlide();
    addTitlePanel(
      adherenciaSlide,
      `Adherencia a las intervenciones del ${params.hospitalName} ${params.period}`,
      'Lectura clinica',
      buildAdherenciaSlideLines(params.adherenciaData),
    );
    addPieChart(
      adherenciaSlide,
      [
        { label: 'Adheridos', count: params.adherenciaData.adheridos },
        { label: 'No adherencia', count: params.adherenciaData.noAdheridos },
      ],
      ['#1E6091', '#E07B00'],
    );

    await pptx.writeFile({ fileName: `${sanitizeFilePart(params.hospitalName)}_PROA_${sanitizeFilePart(params.period)}.pptx` });
    toast.success('PowerPoint generado y descargado');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No fue posible generar el PowerPoint.';
    toast.error(`Error al generar PowerPoint: ${message}`);
    throw error;
  }
}
