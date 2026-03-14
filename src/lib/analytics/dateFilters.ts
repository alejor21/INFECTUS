import type { InterventionRecord } from '../../types';

// ---------------------------------------------------------------------------
// Date parsing (DD/MM/YYYY or YYYY-MM-DD)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Filter functions
// ---------------------------------------------------------------------------

/**
 * Returns records whose fecha falls within the last N calendar months from today.
 * Records with unparseable dates are excluded.
 */
export function filterByRange(
  records: InterventionRecord[],
  months: 1 | 6 | 12,
): InterventionRecord[] {
  const now = new Date();
  // Set cutoff to the same day of month N months ago (JS handles month underflow correctly)
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());

  return records.filter((r) => {
    const date = parseDate(r.fecha);
    return date !== null && date >= cutoff;
  });
}

/**
 * Returns records matching the given hospital name (exact, case-sensitive).
 */
export function filterByHospital(
  records: InterventionRecord[],
  hospital: string,
): InterventionRecord[] {
  return records.filter((r) => r.hospitalName === hospital);
}

/**
 * Returns records matching the given service (exact, case-sensitive).
 */
export function filterByService(
  records: InterventionRecord[],
  service: string,
): InterventionRecord[] {
  return records.filter((r) => r.servicio === service);
}

/**
 * Returns a sorted list of unique non-empty servicio values from the records.
 */
export function getDistinctServices(records: InterventionRecord[]): string[] {
  const seen = new Set<string>();
  for (const r of records) {
    const s = (r.servicio ?? '').trim();
    if (s) seen.add(s);
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b, 'es'));
}
