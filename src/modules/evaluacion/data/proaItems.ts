export type ComplianceValue = 'SI' | 'NO' | 'NO_APLICA';
export type ProaSectionId = 'pre' | 'exec' | 'eval';

// ─── Item type ───────────────────────────────────────────────────────────────

export interface ProaItem {
  text: string;
  requiresFile?: boolean;
  fileLabel?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const t = (text: string): ProaItem => ({ text });
const f = (text: string, fileLabel: string): ProaItem => ({ text, requiresFile: true, fileLabel });

// ─── Section definition type ─────────────────────────────────────────────────

export interface ProaSectionDef {
  id: ProaSectionId;
  title: string;
  maxScore: number;
  categories: readonly {
    name: string;
    items: readonly ProaItem[];
  }[];
}

export type ProaSection = ProaSectionDef;

// ─── Data ─────────────────────────────────────────────────────────────────────

export const PROA_SECTIONS: readonly ProaSectionDef[] = [
  {
    id: 'pre',
    title: 'Pre-implementación',
    maxScore: 28,
    categories: [
      {
        name: 'Socialización del PROA',
        items: [
          t('Socialización a directores, calidad, Talento Humano etc.'),
          t('Diseño del PROA'),
          f('Institucionalización PROA (Acta de conformación/ acto administrativo)', 'Subir acta de conformación'),
          t('Difusión del PROA'),
        ],
      },
      {
        name: 'Conformación del equipo Institucional del PROA',
        items: [
          t('Líder del equipo'),
          t('Representante Administrativo de la IPS'),
          t('Profesional Enfermería'),
          t('Profesional Microbiología'),
          t('Profesional en Química Farmacéutica y/o Regente de Farmacia'),
          t('Representante de médicos'),
          t('Especialista en Infectología'),
          t('Profesional en Epidemiología con entrenamiento en PROA'),
          t('Representantes de las diferentes especialidades clínicas'),
          t('Líder de Capacitación'),
          t('Otros'),
        ],
      },
      {
        name: 'Capacidad técnica para la ejecución del PROA',
        items: [
          t('Lugar para reunión del equipo PROA, con ordenadores, programas informáticos, acceso a bibliografía y proyector'),
          t('Historia clínica sistematizada - Alertas'),
          t('Sistemas de soporte de decisión clínica sistematizada para formulación'),
          t('Equipos con Herramienta de análisis de resistencia WHONET'),
        ],
      },
      {
        name: 'Capacidad tecnológica para la ejecución del PROA',
        items: [
          t('Equipos de laboratorio para Identificación de microorganismos y perfil de susceptibilidad'),
          t('Antibiogramas ajustados'),
          f('Informe periódico', 'Subir informe periódico'),
          t('Test rápidos para identificación de microorganismos'),
          t('Galactomannan y otras para hongos'),
          t('Vancomicina (niveles)'),
          t('Aminoglucósidos (niveles)'),
          t('Proteína C reactiva'),
          t('Procalcitonina'),
        ],
      },
    ],
  },
  {
    id: 'exec',
    title: 'Ejecución del PROA',
    maxScore: 21,
    categories: [
      {
        name: 'Oficialización',
        items: [
          f('IVU — Guía de Práctica Clínica', 'Subir GPC de IVU'),
          f('Neumonía — Guía de Práctica Clínica', 'Subir GPC de Neumonía'),
          f('Piel y Tejidos Blandos — Guía de Práctica Clínica', 'Subir GPC de Piel y Tejidos Blandos'),
          f('Exacerbación EPOC — Guía de Práctica Clínica', 'Subir GPC de EPOC'),
          f('EDA — Guía de Práctica Clínica', 'Subir GPC de EDA'),
          f('Profilaxis pre quirúrgica — Guía de Práctica Clínica', 'Subir GPC de Profilaxis Quirúrgica'),
          f('Otras — Guía de Práctica Clínica', 'Subir Guía de Práctica Clínica'),
          f('Desarrollo de algoritmos de tratamiento', 'Subir algoritmo de tratamiento'),
          t('Implementación de Sistemas de soporte de decisión clínica'),
          f('Realización de protocolos para pruebas de identificación de microorganismos', 'Subir protocolo'),
          t('Desarrollo de estrategias de Preautorización/ documentación'),
          t('Desarrollo de estrategias de Auditoría prospectivas con retroalimentación'),
        ],
      },
      {
        name: 'Educación',
        items: [
          t('Resistencia a antimicrobianos'),
          t('Diagnóstico y esquema de tratamientos institucionales'),
          t('Diagnóstico y Control de las IAAS'),
          t('Solicitud Pruebas de laboratorio'),
          t('Interpretación de pruebas de laboratorio'),
          t('Estrategias de Educación'),
        ],
      },
      {
        name: 'Implementación',
        items: [
          t('Preautorización con seguimiento'),
          t('Auditoría prospectivas con retroalimentación (alterna)'),
          t('Evaluación periódica de consumo'),
        ],
      },
    ],
  },
  {
    id: 'eval',
    title: 'Evaluación de la Ejecución',
    maxScore: 12,
    categories: [
      {
        name: 'Indicadores proceso',
        items: [
          t('Toma de muestras previo tratamiento (obligatorio)'),
          t('Solicitudes de pruebas de microbiología generales, especiales y test rápidos'),
          t('Adherencia a guías'),
          t('Valoraciones por Infectología AB grupo 1'),
          t('Valoraciones por infectología pacientes en UCI, UCIN y pacientes con Neutropenia febril'),
        ],
      },
      {
        name: 'Indicadores Resultado',
        items: [
          t('DDD/DOT'),
          t('Ajuste de prescripción (obligatorio)'),
          t('Ajuste de prescripción en UCI, UCIN y pacientes con Neutropenia Febril'),
          t('Cambios de medicamentos por Infectología'),
          t('Profilaxis antibiótica perioperatoria menor 24H (obligatorio)'),
        ],
      },
      {
        name: 'Indicadores Impacto',
        items: [
          t('IAAS por gérmenes resistentes, BLEE, AMPc, carbapenémicos (obligatorio)'),
          f('Perfil institucional de Resistencia Bacteriana', 'Subir perfil de resistencia'),
        ],
      },
    ],
  },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

export function getItemKey(
  sectionId: string,
  categoryIdx: number,
  itemIdx: number,
): string {
  return `${sectionId}-${categoryIdx}-${itemIdx}`;
}

export function getComplianceScore(value: ComplianceValue | undefined): number {
  return value === 'NO' ? 0 : 1;
}

export function computeSectionScore(
  section: ProaSection,
  allItemValues: Record<string, ComplianceValue>,
): number {
  let score = 0;
  section.categories.forEach((cat, catIdx) => {
    cat.items.forEach((_, itemIdx) => {
      const key = getItemKey(section.id, catIdx, itemIdx);
      const val = allItemValues[key];
      if (val === 'SI' || val === 'NO_APLICA') score++;
    });
  });
  return score;
}

export function computeAllScores(allItemValues: Record<string, ComplianceValue>): {
  preScore: number;
  execScore: number;
  evalScore: number;
  totalScore: number;
} {
  const preScore = computeSectionScore(PROA_SECTIONS[0], allItemValues);
  const execScore = computeSectionScore(PROA_SECTIONS[1], allItemValues);
  const evalScore = computeSectionScore(PROA_SECTIONS[2], allItemValues);
  return { preScore, execScore, evalScore, totalScore: preScore + execScore + evalScore };
}

export function calculateLevel(
  totalScore: number,
): 'avanzado' | 'basico' | 'inadecuado' {
  if (totalScore >= 56) return 'avanzado';
  if (totalScore >= 31) return 'basico';
  return 'inadecuado';
}
