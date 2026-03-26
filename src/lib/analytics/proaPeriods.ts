import type { InterventionRecord } from '../../types';

export type CommitteeRange = '1m' | '6m' | '12m' | 'all';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const COMMITTEE_RANGE_LABEL: Record<CommitteeRange, string> = {
  '1m': 'Ultimo mes',
  '6m': 'Ultimos 6 meses',
  '12m': 'Ultimo ano',
  all: 'Todo el periodo',
};

export function parseCommitteeDate(value: string): Date | null {
  const trimmed = (value ?? '').trim();
  const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  }

  const ymd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  }

  return null;
}

export function filterRecordsByCommitteeRange(
  records: InterventionRecord[],
  range: CommitteeRange,
): InterventionRecord[] {
  if (range === 'all') {
    return records;
  }

  const months = range === '1m' ? 1 : range === '6m' ? 6 : 12;
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());

  return records.filter((record) => {
    const parsedDate = parseCommitteeDate(record.fecha);
    return parsedDate ? parsedDate >= cutoff : false;
  });
}

export function getCurrentMonthValue(baseDate = new Date()): string {
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  return `${baseDate.getFullYear()}-${month}`;
}

export function getMonthValueFromDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

export function getLatestMonthValue(records: InterventionRecord[]): string {
  let latest: Date | null = null;

  for (const record of records) {
    const parsedDate = parseCommitteeDate(record.fecha);
    if (parsedDate && (!latest || parsedDate > latest)) {
      latest = parsedDate;
    }
  }

  return latest ? getMonthValueFromDate(latest) : getCurrentMonthValue();
}

export function filterRecordsByMonth(
  records: InterventionRecord[],
  monthValue: string,
): InterventionRecord[] {
  if (!/^\d{4}-\d{2}$/.test(monthValue)) {
    return [];
  }

  const [yearText, monthText] = monthValue.split('-');
  const year = Number(yearText);
  const month = Number(monthText);

  return records.filter((record) => {
    const parsedDate = parseCommitteeDate(record.fecha);
    return parsedDate
      ? parsedDate.getFullYear() === year && parsedDate.getMonth() + 1 === month
      : false;
  });
}

export function formatMonthLabel(monthValue: string): string {
  if (!/^\d{4}-\d{2}$/.test(monthValue)) {
    return 'Periodo seleccionado';
  }

  const [yearText, monthText] = monthValue.split('-');
  const monthIndex = Number(monthText) - 1;
  const label = MONTH_NAMES[monthIndex];

  if (!label) {
    return 'Periodo seleccionado';
  }

  return `${label} ${yearText}`;
}
