import type { ComplianceValue } from '../data/proaItems';
import { PROA_SECTIONS, computeAllScores, getItemKey } from '../data/proaItems';
import { callAI } from '../../../lib/ai/aiClient';
import type { AIResponse } from '../../../lib/ai/aiClient';
export type { AIResponse };

export interface RecomendacionIA {
  categoria: string;
  prioridad: 'INMEDIATA' | 'CORTO_PLAZO' | 'LARGO_PLAZO';
  accion: string;
  impactoEsperado: string;
}

export interface IAReport {
  resumenEjecutivo: string;
  fortalezas: string[];
  areasDeOportunidad: string[];
  recomendaciones: RecomendacionIA[];
  nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  puntuacionGlobal: number;
  conclusión: string;
}

export interface EvaluacionData {
  allItemValues: Record<string, ComplianceValue>;
  observations: string;
}

function getCategoryScore(
  sectionId: string,
  categoryIdx: number,
  categoryItemCount: number,
  allItemValues: Record<string, ComplianceValue>,
): { score: number; max: number; pct: number } {
  let score = 0;
  for (let itemIdx = 0; itemIdx < categoryItemCount; itemIdx++) {
    const key = getItemKey(sectionId, categoryIdx, itemIdx);
    const val = allItemValues[key];
    if (val === 'SI' || val === 'NO_APLICA') score++;
  }
  const max = categoryItemCount;
  const pct = max > 0 ? (score / max) * 100 : 0;
  return { score, max, pct };
}

const CATEGORY_ACTIONS: Record<string, string> = {
  'Socialización del PROA':
    'Realizar sesiones de socialización obligatorias para directivos, calidad y talento humano sobre los objetivos y alcance del PROA.',
  'Conformación del equipo Institucional del PROA':
    'Completar la conformación del equipo multidisciplinario incluyendo todos los roles requeridos (Infectólogo, Epidemiólogo, Farmacia, Microbiología, Enfermería).',
  'Capacidad técnica para la ejecución del PROA':
    'Gestionar los recursos tecnológicos necesarios: historia clínica sistematizada con alertas, acceso a WHONET y sistemas de soporte de decisión clínica.',
  'Capacidad tecnológica para la ejecución del PROA':
    'Adquirir o habilitar los equipos de laboratorio y pruebas requeridos: antibiogramas ajustados, pruebas rápidas de identificación y marcadores de respuesta inflamatoria.',
  Oficialización:
    'Desarrollar y oficializar las guías de práctica clínica pendientes, especialmente para IVU, Neumonía, Piel/Tejidos Blandos y profilaxis perioperatoria.',
  Educación:
    'Implementar un programa estructurado y continuo de educación en resistencia antimicrobiana, diagnóstico y uso racional de antibióticos dirigido a todo el personal clínico.',
  Implementación:
    'Activar las estrategias de preautorización con seguimiento y auditoría prospectiva con retroalimentación, junto con la evaluación periódica del consumo de antimicrobianos.',
  'Indicadores proceso':
    'Establecer la medición sistemática de indicadores de proceso: toma de muestras previo tratamiento, adherencia a guías y valoraciones por infectología.',
  'Indicadores Resultado':
    'Implementar el monitoreo de DDD/DOT, tasas de ajuste de prescripción y cumplimiento de profilaxis perioperatoria menor a 24 horas.',
  'Indicadores Impacto':
    'Iniciar el seguimiento activo de IAAS por gérmenes resistentes (BLEE, AMPc, carbapenémicos) y mantener actualizado el perfil institucional de resistencia bacteriana.',
};

const CATEGORY_IMPACT: Record<string, string> = {
  'Socialización del PROA':
    'Mayor compromiso institucional y soporte directivo, facilitando la implementación sostenida del PROA.',
  'Conformación del equipo Institucional del PROA':
    'Mejora en la coordinación multidisciplinaria, decisiones clínicas más apropiadas y mayor cobertura del programa.',
  'Capacidad técnica para la ejecución del PROA':
    'Optimización del monitoreo del consumo antimicrobiano y reducción de errores de prescripción por soporte informático.',
  'Capacidad tecnológica para la ejecución del PROA':
    'Diagnósticos microbiológicos más precisos y tratamientos antibióticos oportunos y dirigidos.',
  Oficialización:
    'Estandarización de las prescripciones antibióticas, reducción de variabilidad injustificada y menor presión selectiva.',
  Educación:
    'Personal clínico con mayor conocimiento en uso racional de antimicrobianos, reduciendo prescripciones inapropiadas.',
  Implementación:
    'Control activo de la prescripción antimicrobiana, detección temprana de problemas y corrección oportuna de tratamientos inadecuados.',
  'Indicadores proceso':
    'Seguimiento objetivo del desempeño del PROA y evidencia de adherencia a prácticas clínicas recomendadas.',
  'Indicadores Resultado':
    'Reducción del consumo global de antimicrobianos y mejora en la idoneidad de las prescripciones.',
  'Indicadores Impacto':
    'Disminución de infecciones por microorganismos resistentes y reducción de la presión selectiva institucional.',
};

export function generateIAReport(
  evaluacion: EvaluacionData,
  hospitalName: string,
): IAReport {
  const { allItemValues } = evaluacion;
  const { preScore, execScore, evalScore, totalScore } = computeAllScores(allItemValues);
  const pct = Math.round((totalScore / 61) * 100);

  const nivelRiesgo: IAReport['nivelRiesgo'] =
    pct >= 80 ? 'BAJO' : pct >= 60 ? 'MEDIO' : pct >= 40 ? 'ALTO' : 'CRITICO';

  const fortalezas: string[] = [];
  const areasDeOportunidad: string[] = [];
  const recomendaciones: RecomendacionIA[] = [];

  PROA_SECTIONS.forEach((section) => {
    section.categories.forEach((cat, catIdx) => {
      const { pct: catPct } = getCategoryScore(
        section.id,
        catIdx,
        cat.items.length,
        allItemValues,
      );

      if (catPct >= 75) {
        fortalezas.push(`Alta adherencia en "${cat.name}" (${Math.round(catPct)}%)`);
      }
      if (catPct < 50) {
        areasDeOportunidad.push(
          `"${cat.name}": solo ${Math.round(catPct)}% de cumplimiento — requiere atención prioritaria`,
        );
      }
      if (catPct < 70) {
        const prioridad: RecomendacionIA['prioridad'] =
          catPct < 30 ? 'INMEDIATA' : catPct < 50 ? 'CORTO_PLAZO' : 'LARGO_PLAZO';
        recomendaciones.push({
          categoria: cat.name,
          prioridad,
          accion:
            CATEGORY_ACTIONS[cat.name] ??
            `Revisar e implementar las actividades pendientes en la categoría "${cat.name}".`,
          impactoEsperado:
            CATEGORY_IMPACT[cat.name] ??
            `Mejora en el cumplimiento del programa PROA en el área de ${cat.name}.`,
        });
      }
    });
  });

  const nivelLabel =
    nivelRiesgo === 'BAJO'
      ? 'BAJO (nivel de implementación avanzado)'
      : nivelRiesgo === 'MEDIO'
        ? 'MEDIO (implementación en desarrollo)'
        : nivelRiesgo === 'ALTO'
          ? 'ALTO (implementación incipiente)'
          : 'CRÍTICO (implementación insuficiente)';

  const resumenEjecutivo = [
    `La evaluación del Programa de Optimización de Antimicrobianos (PROA) de ${hospitalName} `,
    `arroja una puntuación global de ${totalScore}/61 puntos (${pct}%), `,
    `clasificándose en nivel de riesgo ${nivelLabel}. `,
    `En la dimensión de Pre-implementación se obtuvo ${preScore}/28 puntos (${Math.round((preScore / 28) * 100)}%), `,
    `en Ejecución del PROA ${execScore}/21 puntos (${Math.round((execScore / 21) * 100)}%), `,
    `y en Evaluación de la Ejecución ${evalScore}/12 puntos (${Math.round((evalScore / 12) * 100)}%). `,
    fortalezas.length > 0
      ? `Se identificaron ${fortalezas.length} fortaleza(s) en las categorías con alta adherencia. `
      : '',
    recomendaciones.length > 0
      ? `Se generaron ${recomendaciones.length} recomendación(es) de mejora priorizadas por urgencia.`
      : 'El programa presenta un desempeño sólido en todas las categorías evaluadas.',
  ].join('');

  const conclusión = buildConclusion(nivelRiesgo, pct, recomendaciones.length, hospitalName);

  return {
    resumenEjecutivo,
    fortalezas,
    areasDeOportunidad,
    recomendaciones,
    nivelRiesgo,
    puntuacionGlobal: totalScore,
    conclusión,
  };
}

function buildConclusion(
  nivelRiesgo: IAReport['nivelRiesgo'],
  pct: number,
  numRecs: number,
  hospitalName: string,
): string {
  if (nivelRiesgo === 'BAJO') {
    return `${hospitalName} demuestra un PROA maduro con ${pct}% de cumplimiento. Se recomienda mantener los estándares actuales, institucionalizar las prácticas exitosas y continuar el monitoreo periódico para sostener el nivel avanzado alcanzado.`;
  }
  if (nivelRiesgo === 'MEDIO') {
    return `${hospitalName} tiene bases sólidas con ${pct}% de cumplimiento. Con ${numRecs} mejora(s) identificadas, se puede alcanzar el nivel avanzado en el mediano plazo mediante la priorización de las categorías con menor desempeño.`;
  }
  if (nivelRiesgo === 'ALTO') {
    return `${hospitalName} presenta brechas significativas con solo ${pct}% de cumplimiento. Es imperativo implementar urgentemente las ${numRecs} recomendación(es) previstas, con especial énfasis en las categorías marcadas como prioridad INMEDIATA.`;
  }
  return `${hospitalName} requiere intervención inmediata. Con ${pct}% de cumplimiento y ${numRecs} área(s) crítica(s), se deben activar acciones correctivas de forma urgente con involucramiento de las directivas institucionales.`;
}

// ─── AI-enhanced report generation ───────────────────────────────────────────

export async function enhanceReportWithAI(
  report: IAReport,
  hospitalName: string,
): Promise<{ summary: string; provider: AIResponse['provider'] }> {
  const pct = Math.round((report.puntuacionGlobal / 61) * 100);
  const fortalezasStr = report.fortalezas.slice(0, 3).join(', ') || 'Ninguna identificada';
  const areasStr = report.areasDeOportunidad.slice(0, 3).join(', ') || 'Ninguna identificada';

  const response = await callAI(
    [
      {
        role: 'system',
        content:
          'Eres un experto en programas PROA (Programa de Optimización de Uso de Antimicrobianos) en hospitales de Colombia. Respondes siempre en español, de forma profesional, directa y sin preambles.',
      },
      {
        role: 'user',
        content: `Genera un párrafo ejecutivo profesional de 3-4 oraciones en español basado en estos datos:

Hospital: ${hospitalName}
Puntuación global: ${pct}%
Nivel de riesgo: ${report.nivelRiesgo}
Fortalezas: ${fortalezasStr}
Áreas de mejora: ${areasStr}

El párrafo debe ser directo, profesional y orientado a la acción. No uses listas ni viñetas.`,
      },
    ],
    { maxTokens: 300 },
  );

  return { summary: response.content, provider: response.provider };
}
