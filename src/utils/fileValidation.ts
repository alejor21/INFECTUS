import {
  ALLOWED_EXCEL_EXTENSIONS,
  ALLOWED_EXCEL_EXTENSIONS_LABEL,
  MAX_EXCEL_UPLOAD_SIZE_BYTES,
} from '../lib/constants';

function formatMegabytes(bytes: number): string {
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : '';
}

export function isExcelFile(fileName: string): boolean {
  return ALLOWED_EXCEL_EXTENSIONS.includes(getFileExtension(fileName) as (typeof ALLOWED_EXCEL_EXTENSIONS)[number]);
}

export function validateExcelFile(file: Pick<File, 'name' | 'size'>): string | null {
  if (!isExcelFile(file.name)) {
    return `Solo se permiten archivos Excel (${ALLOWED_EXCEL_EXTENSIONS_LABEL}).`;
  }

  if (file.size > MAX_EXCEL_UPLOAD_SIZE_BYTES) {
    return `El archivo supera el límite de ${formatMegabytes(MAX_EXCEL_UPLOAD_SIZE_BYTES)}.`;
  }

  return null;
}
