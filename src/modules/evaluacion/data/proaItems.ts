export type ComplianceValue = 'SI' | 'NO' | 'NO_APLICA';

export const PROA_SECTIONS = [
  {
    id: 'pre' as const,
    title: 'Pre-implementación',
    maxScore: 28,
    categories: [
      {
        name: 'Socialización del PROA',
        items: [
          'Socialización a directores, calidad, Talento Humano etc.',
          'Diseño del PROA',
          'Institucionalización PROA (Acta de conformación/ acto administrativo)',
          'Difusión del PROA',
        ] as const,
      },
      {
        name: 'Conformación del equipo Institucional del PROA',
        items: [
          'Líder del equipo',
          'Representante Administrativo de la IPS',
          'Profesional Enfermería',
          'Profesional Microbiología',
          'Profesional en Química Farmacéutica y/o Regente de Farmacia',
          'Representante de médicos',
          'Especialista en Infectología',
          'Profesional en Epidemiología con entrenamiento en PROA',
          'Representantes de las diferentes especialidades clínicas',
          'Líder de Capacitación',
          'Otros',
        ] as const,
      },
      {
        name: 'Capacidad técnica para la ejecución del PROA',
        items: [
          'Lugar para reunión del equipo PROA, con ordenadores, programas informáticos, acceso a bibliografía y proyector',
          'Historia clínica sistematizada - Alertas',
          'Sistemas de soporte de decisión clínica sistematizada para formulación',
          'Equipos con Herramienta de análisis de resistencia WHONET',
        ] as const,
      },
      {
        name: 'Capacidad tecnológica para la ejecución del PROA',
        items: [
          'Equipos de laboratorio para Identificación de microorganismos y perfil de susceptibilidad',
          'Antibiogramas ajustados',
          'Informe periódico',
          'Test rápidos para identificación de microorganismos',
          'Galactomannan y otras para hongos',
          'Vancomicina (niveles)',
          'Aminoglucósidos (niveles)',
          'Proteína C reactiva',
          'Procalcitonina',
        ] as const,
      },
    ] as const,
  },
  {
    id: 'exec' as const,
    title: 'Ejecución del PROA',
    maxScore: 21,
    categories: [
      {
        name: 'Oficialización',
        items: [
          'IVU — Guía de Práctica Clínica',
          'Neumonía — Guía de Práctica Clínica',
          'Piel y Tejidos Blandos — Guía de Práctica Clínica',
          'Exacerbación EPOC — Guía de Práctica Clínica',
          'EDA — Guía de Práctica Clínica',
          'Profilaxis pre quirúrgica — Guía de Práctica Clínica',
          'Otras — Guía de Práctica Clínica',
          'Desarrollo de algoritmos de tratamiento',
          'Implementación de Sistemas de soporte de decisión clínica',
          'Realización de protocolos para pruebas de identificación de microorganismos',
          'Desarrollo de estrategias de Preautorización/ documentación',
          'Desarrollo de estrategias de Auditoría prospectivas con retroalimentación',
        ] as const,
      },
      {
        name: 'Educación',
        items: [
          'Resistencia a antimicrobianos',
          'Diagnóstico y esquema de tratamientos institucionales',
          'Diagnóstico y Control de las IAAS',
          'Solicitud Pruebas de laboratorio',
          'Interpretación de pruebas de laboratorio',
          'Estrategias de Educación',
        ] as const,
      },
      {
        name: 'Implementación',
        items: [
          'Preautorización con seguimiento',
          'Auditoría prospectivas con retroalimentación (alterna)',
          'Evaluación periódica de consumo',
        ] as const,
      },
    ] as const,
  },
  {
    id: 'eval' as const,
    title: 'Evaluación de la Ejecución',
    maxScore: 12,
    categories: [
      {
        name: 'Indicadores proceso',
        items: [
          'Toma de muestras previo tratamiento (obligatorio)',
          'Solicitudes de pruebas de microbiología generales, especiales y test rápidos',
          'Adherencia a guías',
          'Valoraciones por Infectología AB grupo 1',
          'Valoraciones por infectología pacientes en UCI, UCIN y pacientes con Neutropenia febril',
        ] as const,
      },
      {
        name: 'Indicadores Resultado',
        items: [
          'DDD/DOT',
          'Ajuste de prescripción (obligatorio)',
          'Ajuste de prescripción en UCI, UCIN y pacientes con Neutropenia Febril',
          'Cambios de medicamentos por Infectología',
          'Profilaxis antibiótica perioperatoria menor 24H (obligatorio)',
        ] as const,
      },
      {
        name: 'Indicadores Impacto',
        items: [
          'IAAS por gérmenes resistentes, BLEE, AMPc, carbapenémicos (obligatorio)',
          'Perfil institucional de Resistencia Bacteriana',
        ] as const,
      },
    ] as const,
  },
] as const;

export type ProaSectionId = (typeof PROA_SECTIONS)[number]['id'];
export type ProaSection = (typeof PROA_SECTIONS)[number];

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
