import { generateOpenRouterText } from '../lib/openrouter';

export interface ReportComparisonRow {
  indicador: string;
  mes1: string;
  mes2: string;
  diff: string;
  positivo: boolean;
}

export interface GenerateProaReportInput {
  hospitalNombre: string;
  mes: string;
  totalEvaluaciones: number;
  tipoAnalisis: string[];
  servicioAnalisis: string[];
  conductaAnalisis: string[];
  adherenciaAnalisis: string[];
  mesComparar?: string;
  tablaComparativa?: ReportComparisonRow[];
}

function buildFallbackReport(input: GenerateProaReportInput): string {
  const sections = [
    `1. Resumen ejecutivo\nHospital: ${input.hospitalNombre}\nPeriodo: ${input.mes}\nEvaluaciones analizadas: ${input.totalEvaluaciones}.`,
    `2. Tipo de intervencion\n${input.tipoAnalisis.join('\n')}`,
    `3. Distribucion por servicio\n${input.servicioAnalisis.join('\n')}`,
    `4. Conductas de infectologia\n${input.conductaAnalisis.join('\n')}`,
    `5. Adherencia\n${input.adherenciaAnalisis.join('\n')}`,
  ];

  if (input.mesComparar && input.tablaComparativa && input.tablaComparativa.length > 0) {
    const comparisonText = input.tablaComparativa
      .map((row) => `- ${row.indicador}: ${row.mes1} vs ${row.mes2} (${row.diff})`)
      .join('\n');
    sections.push(`6. Comparativa ${input.mes} vs ${input.mesComparar}\n${comparisonText}`);
  }

  sections.push('7. Recomendaciones\n- Mantener seguimiento mensual del programa PROA.\n- Priorizar servicios con mayor carga de intervenciones.\n- Revisar adherencia y conductas con menor desempeno para mejora continua.');
  return sections.join('\n\n');
}

function buildPrompt(input: GenerateProaReportInput): string {
  const comparison = input.mesComparar && input.tablaComparativa && input.tablaComparativa.length > 0
    ? `Comparativa con ${input.mesComparar}:\n${input.tablaComparativa
      .map((row) => `- ${row.indicador}: ${row.mes1} vs ${row.mes2} (${row.diff})`)
      .join('\n')}`
    : 'Sin comparativa adicional.';

  return [
    `Genera un reporte ejecutivo PROA para ${input.hospitalNombre}.`,
    `Periodo principal: ${input.mes}.`,
    `Total de evaluaciones: ${input.totalEvaluaciones}.`,
    'Usa esta evidencia:',
    `Tipo de intervencion:\n${input.tipoAnalisis.join('\n')}`,
    `Servicio:\n${input.servicioAnalisis.join('\n')}`,
    `Conductas:\n${input.conductaAnalisis.join('\n')}`,
    `Adherencia:\n${input.adherenciaAnalisis.join('\n')}`,
    comparison,
    'Responde en espanol con estas secciones: 1. Resumen ejecutivo 2. Hallazgos principales 3. Alertas o patrones 4. Recomendaciones concretas.',
  ].join('\n\n');
}

export async function generateProaReport(input: GenerateProaReportInput): Promise<string> {
  const fallback = buildFallbackReport(input);

  try {
    const generated = await generateOpenRouterText(buildPrompt(input));
    return generated || fallback;
  } catch {
    return fallback;
  }
}
