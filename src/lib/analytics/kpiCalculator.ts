import type { InterventionRecord } from '../../types';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const MONTHS_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
] as const;

/**
 * Parses a fecha string in DD/MM/YYYY or YYYY-MM-DD format.
 * Returns null if the string cannot be parsed.
 */
function parseDate(fecha: string): Date | null {
  const trimmed = (fecha ?? '').trim();
  // DD/MM/YYYY
  const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    return isNaN(d.getTime()) ? null : d;
  }
  // YYYY-MM-DD
  const ymd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    const d = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** Returns a display month string ("Ene 2026") and a numeric sort key (202601). */
function toMonthInfo(date: Date): { label: string; sortKey: number } {
  return {
    label: `${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`,
    sortKey: date.getFullYear() * 100 + (date.getMonth() + 1),
  };
}

function isYes(value: string): boolean {
  return (value ?? '').trim().toUpperCase() === 'SI';
}

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

// ---------------------------------------------------------------------------
// KPI functions
// ---------------------------------------------------------------------------

/**
 * Average therapy days across records with at least one therapy-day value.
 */
export function calcAntibioticUseRate(records: InterventionRecord[]): number {
  return calcAvgTherapyDays(records);
}

/**
 * Percentage of records where aproboTerapia === 'SI' (case-insensitive).
 * Returns 0 if no records
 */
export function calcTherapeuticAdequacy(records: InterventionRecord[]): number {
  if (records.length === 0) return 0;
  const approved = records.filter((r) => isYes(r.aproboTerapia ?? '')).length;
  return pct(approved, records.length);
}

/**
 * Rate of IAAS per 1 000 bed-days.
 * Formula: (count where iaas === 'SI') / totalBedDays * 1000
 */
export function calcIAASRate(
  records: InterventionRecord[],
  totalBedDays: number,
): number {
  if (totalBedDays === 0) return 0;
  const iaasCount = records.filter((r) => isYes(r.iaas)).length;
  return Math.round((iaasCount / totalBedDays) * 1000 * 100) / 100;
}

/**
 * Percentage of records where terapiaEmpricaApropiada === 'SI' (case-insensitive).
 * Returns 0 if no records
 */
export function calcGuidelineCompliance(records: InterventionRecord[]): number {
  if (records.length === 0) return 0;
  const compliant = records.filter((r) => isYes(r.terapiaEmpricaApropiada ?? '')).length;
  return pct(compliant, records.length);
}

/**
 * Top 5 antibiotics by combined frequency across antibiotico01 and antibiotico02.
 * Empty / null / whitespace-only values are excluded.
 */
export function calcTop5Antibiotics(
  records: InterventionRecord[],
): { name: string; count: number }[] {
  const freq = new Map<string, number>();

  for (const r of records) {
    for (const raw of [r.antibiotico01, r.antibiotico02]) {
      const name = (raw ?? '').trim();
      if (!name) continue;
      freq.set(name, (freq.get(name) ?? 0) + 1);
    }
  }

  return Array.from(freq.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/**
 * Total therapy days (diasTerapiaMed01 + diasTerapiaMed02) grouped by month,
 * sorted chronologically. Returns empty array if no valid dates found.
 */
export function calcMonthlyConsumption(
  records: InterventionRecord[],
): { month: string; ddd: number }[] {
  const grouped = new Map<string, { ddd: number; sortKey: number }>();

  for (const r of records) {
    const date = parseDate(r.fecha ?? '');
    if (!date) continue;

    const { label, sortKey } = toMonthInfo(date);
    const d1 = parseFloat(r.diasTerapiaMed01 ?? '') || 0;
    const d2 = parseFloat(r.diasTerapiaMed02 ?? '') || 0;
    const days1 = Number.isFinite(d1) ? d1 : 0;
    const days2 = Number.isFinite(d2) ? d2 : 0;

    const entry = grouped.get(label);
    if (entry) {
      entry.ddd += days1 + days2;
    } else {
      grouped.set(label, { ddd: days1 + days2, sortKey });
    }
  }

  return Array.from(grouped.entries())
    .sort((a, b) => a[1].sortKey - b[1].sortKey)
    .map(([month, { ddd }]) => ({ 
      month, 
      ddd: Number.isFinite(ddd) ? Math.round(ddd * 100) / 100 : 0 
    }));
}

/**
 * Count of IAAS cases grouped by tipoIaas, sorted descending by count.
 * Empty / null values are excluded.
 */
export function calcIAASDistribution(
  records: InterventionRecord[],
): { type: string; count: number }[] {
  const freq = new Map<string, number>();

  for (const r of records) {
    const type = (r.tipoIaas ?? '').trim();
    if (!type) continue;
    freq.set(type, (freq.get(type) ?? 0) + 1);
  }

  return Array.from(freq.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Count of records grouped by conductaGeneral, sorted descending by count.
 * Empty / null values are excluded.
 */
export function calcConductaDistribution(
  records: InterventionRecord[],
): { conducta: string; count: number }[] {
  const freq = new Map<string, number>();

  for (const r of records) {
    const conducta = (r.conductaGeneral ?? '').trim();
    if (!conducta) continue;
    freq.set(conducta, (freq.get(conducta) ?? 0) + 1);
  }

  return Array.from(freq.entries())
    .map(([conducta, count]) => ({ conducta, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Guideline compliance rate per month, sorted chronologically.
 */
export function calcMonthlyCompliance(
  records: InterventionRecord[],
): { month: string; rate: number }[] {
  const grouped = new Map<
    string,
    { compliant: number; total: number; sortKey: number }
  >();

  for (const r of records) {
    const date = parseDate(r.fecha);
    if (!date) continue;

    const { label, sortKey } = toMonthInfo(date);
    const entry = grouped.get(label);
    if (entry) {
      entry.total++;
      if (isYes(r.terapiaEmpricaApropiada)) entry.compliant++;
    } else {
      grouped.set(label, {
        compliant: isYes(r.terapiaEmpricaApropiada) ? 1 : 0,
        total: 1,
        sortKey,
      });
    }
  }

  return Array.from(grouped.entries())
    .sort((a, b) => a[1].sortKey - b[1].sortKey)
    .map(([month, { compliant, total }]) => ({
      month,
      rate: pct(compliant, total),
    }));
}

/**
 * Percentage of records where cultivosPrevios === 'SI' (case-insensitive).
 * Returns 0 if no records
 */
export function calcCultivosPreRate(records: InterventionRecord[]): number {
  if (records.length === 0) return 0;
  const withCultivos = records.filter((r) => isYes(r.cultivosPrevios ?? '')).length;
  return pct(withCultivos, records.length);
}

/**
 * Distribution of records by servicio (service/ward), sorted descending by count.
 * Empty values are excluded.
 */
export function calcServicioDistribution(
  records: InterventionRecord[],
): { servicio: string; count: number }[] {
  const freq = new Map<string, number>();

  for (const r of records) {
    const servicio = (r.servicio ?? '').trim();
    if (!servicio) continue;
    freq.set(servicio, (freq.get(servicio) ?? 0) + 1);
  }

  return Array.from(freq.entries())
    .map(([servicio, count]) => ({ servicio, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Distribution of records by diagnostico (top 10), sorted descending by count.
 * Empty values are excluded.
 */
export function calcDiagnosticoDistribution(
  records: InterventionRecord[],
  limit = 10,
): { diagnostico: string; count: number }[] {
  const freq = new Map<string, number>();

  for (const r of records) {
    const diagnostico = (r.diagnostico ?? '').trim();
    if (!diagnostico) continue;
    freq.set(diagnostico, (freq.get(diagnostico) ?? 0) + 1);
  }

  return Array.from(freq.entries())
    .map(([diagnostico, count]) => ({ diagnostico, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Distribution of records by tipoIntervencion, sorted descending by count.
 * Empty values are excluded.
 */
export function calcTipoIntervencionDistribution(
  records: InterventionRecord[],
): { tipo: string; count: number }[] {
  const freq = new Map<string, number>();

  for (const r of records) {
    const tipo = (r.tipoIntervencion ?? '').trim();
    if (!tipo) continue;
    freq.set(tipo, (freq.get(tipo) ?? 0) + 1);
  }

  return Array.from(freq.entries())
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Average therapy days across all records with therapy days data.
 * Returns 0 if no records have therapy days.
 */
export function calcAvgTherapyDays(records: InterventionRecord[]): number {
  let totalDays = 0;
  let count = 0;

  for (const r of records) {
    const d1 = parseFloat(r.diasTerapiaMed01 ?? '') || 0;
    const d2 = parseFloat(r.diasTerapiaMed02 ?? '') || 0;
    const days1 = Number.isFinite(d1) ? d1 : 0;
    const days2 = Number.isFinite(d2) ? d2 : 0;
    const total = days1 + days2;
    
    if (total > 0) {
      totalDays += total;
      count++;
    }
  }

  if (count === 0) return 0;
  const avg = totalDays / count;
  return Number.isFinite(avg) ? Math.round(avg * 100) / 100 : 0;
}

/**
 * Counts of approved vs rejected therapy by servicio.
 * Returns array sorted descending by total count.
 */
export function calcApprovalByServicio(
  records: InterventionRecord[],
): { servicio: string; aprobadas: number; rechazadas: number; total: number }[] {
  const map = new Map<string, { aprobadas: number; rechazadas: number }>();

  for (const r of records) {
    const servicio = (r.servicio ?? '').trim();
    if (!servicio) continue;

    if (!map.has(servicio)) {
      map.set(servicio, { aprobadas: 0, rechazadas: 0 });
    }

    const entry = map.get(servicio)!;
    if (isYes(r.aproboTerapia ?? '')) {
      entry.aprobadas++;
    } else if ((r.aproboTerapia ?? '').trim().toUpperCase() === 'NO') {
      entry.rechazadas++;
    }
  }

  return Array.from(map.entries())
    .map(([servicio, { aprobadas, rechazadas }]) => ({
      servicio,
      aprobadas,
      rechazadas,
      total: aprobadas + rechazadas,
    }))
    .sort((a, b) => b.total - a.total);
}

/** Returns positive-culture records as the denominator for resistance rates. */
function positiveCultureRecords(records: InterventionRecord[]): InterventionRecord[] {
  return records.filter((r) => (r.resultadoCultivo ?? '').trim().toUpperCase() === 'POSITIVO');
}

/**
 * Percentage of positive cultures where mrsa === 'SI'.
 */
export function calcMRSARate(records: InterventionRecord[]): number {
  const positives = positiveCultureRecords(records);
  if (positives.length === 0) return 0;
  const count = positives.filter((r) => isYes(r.mrsa ?? '')).length;
  return pct(count, positives.length);
}

/**
 * Percentage of positive cultures where blee === 'SI'.
 */
export function calcBLEERate(records: InterventionRecord[]): number {
  const positives = positiveCultureRecords(records);
  if (positives.length === 0) return 0;
  const count = positives.filter((r) => isYes(r.blee ?? '')).length;
  return pct(count, positives.length);
}

/**
 * Percentage of positive cultures where carbapenemasa === 'SI'.
 */
export function calcCarbapenemaseRate(records: InterventionRecord[]): number {
  const positives = positiveCultureRecords(records);
  if (positives.length === 0) return 0;
  const count = positives.filter((r) => isYes(r.carbapenemasa ?? '')).length;
  return pct(count, positives.length);
}

/**
 * Percentage of all records where resultadoCultivo === 'POSITIVO'.
 */
export function calcPositiveCultureRate(records: InterventionRecord[]): number {
  if (records.length === 0) return 0;
  const count = positiveCultureRecords(records).length;
  return pct(count, records.length);
}

/**
 * Count of positive cultures grouped by organismoAislado, sorted descending.
 * Empty values are excluded.
 */
export function calcOrganismDistribution(
  records: InterventionRecord[],
): { type: string; count: number }[] {
  const freq = new Map<string, number>();
  for (const r of positiveCultureRecords(records)) {
    const org = (r.organismoAislado ?? '').trim();
    if (!org) continue;
    freq.set(org, (freq.get(org) ?? 0) + 1);
  }
  return Array.from(freq.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Per-service count of key resistance organisms (E. coli, K. pneumoniae, Pseudomonas).
 * Matches by case-insensitive substring of organismoAislado.
 */
export function calcResistanceByService(
  records: InterventionRecord[],
): { servicio: string; ecoli: number; kpneumoniae: number; pseudomonas: number }[] {
  const map = new Map<string, { ecoli: number; kpneumoniae: number; pseudomonas: number }>();
  for (const r of positiveCultureRecords(records)) {
    const servicio = (r.servicio ?? '').trim();
    if (!servicio) continue;
    if (!map.has(servicio)) map.set(servicio, { ecoli: 0, kpneumoniae: 0, pseudomonas: 0 });
    const entry = map.get(servicio)!;
    const org = (r.organismoAislado ?? '').toLowerCase();
    if (org.includes('coli')) entry.ecoli++;
    if (org.includes('pneumon')) entry.kpneumoniae++;
    if (org.includes('pseudo') || org.includes('aerug')) entry.pseudomonas++;
  }
  return Array.from(map.entries()).map(([servicio, counts]) => ({ servicio, ...counts }));
}

/**
 * Sensitivity patterns per organism for Vancomicina and Meropenem.
 * Groups by (organismoAislado, sensibilidadVancomicina, sensibilidadMeropenem).
 */
export function calcSensitivityMatrix(
  records: InterventionRecord[],
): { organismo: string; vancomicina: string; meropenem: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of positiveCultureRecords(records)) {
    const organismo = (r.organismoAislado ?? '').trim();
    if (!organismo) continue;
    const vanco = (r.sensibilidadVancomicina ?? '').trim();
    const merope = (r.sensibilidadMeropenem ?? '').trim();
    const key = `${organismo}||${vanco}||${merope}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([key, count]) => {
    const [organismo, vancomicina, meropenem] = key.split('||');
    return { organismo, vancomicina, meropenem, count };
  });
}

/**
 * Monthly resistance rates (BLEE, MRSA, carbapenemase) among positive cultures,
 * sorted chronologically.
 */
export function calcResistanceTrend(
  records: InterventionRecord[],
): { month: string; blee: number; mrsa: number; carba: number }[] {
  const grouped = new Map<
    string,
    { blee: number; mrsa: number; carba: number; total: number; sortKey: number }
  >();

  for (const r of positiveCultureRecords(records)) {
    const date = parseDate(r.fecha);
    if (!date) continue;
    const { label, sortKey } = toMonthInfo(date);
    const entry = grouped.get(label);
    if (entry) {
      entry.total++;
      if (isYes(r.blee ?? '')) entry.blee++;
      if (isYes(r.mrsa ?? '')) entry.mrsa++;
      if (isYes(r.carbapenemasa ?? '')) entry.carba++;
    } else {
      grouped.set(label, {
        total: 1,
        blee: isYes(r.blee ?? '') ? 1 : 0,
        mrsa: isYes(r.mrsa ?? '') ? 1 : 0,
        carba: isYes(r.carbapenemasa ?? '') ? 1 : 0,
        sortKey,
      });
    }
  }

  return Array.from(grouped.entries())
    .sort((a, b) => a[1].sortKey - b[1].sortKey)
    .map(([month, { blee, mrsa, carba, total }]) => ({
      month,
      blee: pct(blee, total),
      mrsa: pct(mrsa, total),
      carba: pct(carba, total),
    }));
}
