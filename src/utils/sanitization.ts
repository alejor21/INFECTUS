import { MAX_TEXT_FIELD_LENGTH } from '../lib/constants';

export function sanitizeOptionalText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const cleaned = String(value)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TEXT_FIELD_LENGTH);

  return cleaned === '' ? null : cleaned;
}
