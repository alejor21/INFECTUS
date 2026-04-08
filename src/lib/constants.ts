export const MAX_TEXT_FIELD_LENGTH = 500;
export const MAX_EXCEL_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_AVATAR_SIZE_BYTES = 400 * 1024;

export const ALLOWED_EXCEL_EXTENSIONS = ['.xlsx', '.xls'] as const;
export const ALLOWED_EXCEL_EXTENSIONS_LABEL = ALLOWED_EXCEL_EXTENSIONS.join(', ');
