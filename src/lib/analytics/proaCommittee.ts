import type {
  AdherenciaChartData,
  ConductaChartDatum,
  ServicioChartDatum,
  TipoIntervencionChartDatum,
} from '../../hooks/useProaCharts';

export function safePct(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 100);
}

export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getCommitteeHospitalLabel(hospitalName: string | null): string {
  return hospitalName ?? 'Todos los hospitales';
}

export function getAdherenciaAnalysis(data: AdherenciaChartData): string[] {
  const adheridosPct = safePct(data.adheridos, data.total);
  const noAdheridosPct = safePct(data.noAdheridos, data.total);

  return [
    `Adheridos: ${data.adheridos} casos (${adheridosPct}%)`,
    `No adherencia a recomendaciones: ${data.noAdheridos} casos (${noAdheridosPct}%)`,
    data.total === 0
      ? 'Sin datos suficientes para interpretar adherencia.'
      : adheridosPct >= 80
        ? 'Alta adherencia. Porcentaje de no adherencia clinicamente relevante, util para mejora continua.'
        : 'Adherencia por debajo del estandar esperado. Se recomienda revision de estrategias de intervencion.',
  ];
}

export function getConductasAnalysis(data: ConductaChartDatum[]): string[] {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const top = data[0];

  if (total === 0 || !top) {
    return ['Sin datos suficientes para interpretar conductas.'];
  }

  return [
    `La accion predominante es ${top.conducta} con ${top.count} casos.`,
    `Distribucion proporcional (n=${total}):`,
    ...data.map((item) => `${item.conducta}: ${item.count} casos`),
  ];
}

export function getServicioAnalysis(data: ServicioChartDatum[]): string[] {
  const activeServices = data.filter((item) => item.count > 0).length;

  return [
    `La distribucion evidencia fortalecimiento en la implementacion de PROA en ${activeServices} areas asistenciales.`,
  ];
}

export function getTipoIntervencionAnalysis(data: TipoIntervencionChartDatum[]): string[] {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const proa = data.find((item) => item.tipo === 'PROA');
  const proaPct = safePct(proa?.count ?? 0, total);

  if (total === 0) {
    return ['Sin datos suficientes para interpretar tipos de intervencion.'];
  }

  if (proaPct >= 40) {
    return [
      `El ${proaPct}% de las valoraciones provienen de captacion PROA, lo que indica un funcionamiento efectivo del programa con capacidad de identificar oportunidades de optimizacion antimicrobiana e intervenir tempranamente sin depender exclusivamente de la interconsulta.`,
      'Este hallazgo es coherente con estandares del MSPS - Resolucion 2471 y buenas practicas.',
    ];
  }

  return [
    `El ${proaPct}% de las valoraciones provienen de captacion PROA.`,
    'Se recomienda fortalecer la identificacion proactiva de pacientes para optimizacion antimicrobiana.',
  ];
}
