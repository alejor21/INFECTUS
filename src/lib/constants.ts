export const MAX_TEXT_FIELD_LENGTH = 500;
export const MAX_EXCEL_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_AVATAR_SIZE_BYTES = 400 * 1024;

export const ALLOWED_EXCEL_EXTENSIONS = ['.xlsx', '.xls'] as const;
export const ALLOWED_EXCEL_EXTENSIONS_LABEL = ALLOWED_EXCEL_EXTENSIONS.join(', ');

export const SPANISH_MONTH_NAMES = [
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
] as const;

export const PROA_INTERVENTION_TYPE_LABELS: Record<string, string> = {
  IC: 'Interconsultas',
  PROA: 'Captadas PROA',
  REV: 'Revaloracion',
};

export function getMonthName(month: number | null | undefined): string | null {
  if (!month || month < 1 || month > SPANISH_MONTH_NAMES.length) {
    return null;
  }

  return SPANISH_MONTH_NAMES[month - 1];
}

export function formatMonthYear(
  month: number | null | undefined,
  year: number | null | undefined,
): string | null {
  const monthName = getMonthName(month);
  if (!monthName || !year) {
    return null;
  }

  return `${monthName} ${year}`;
}
