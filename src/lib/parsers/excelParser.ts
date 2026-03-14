import * as XLSX from 'xlsx';
import { EXCEL_COLUMN_MAP } from '../../constants/excelColumns';
import { interventionSchema } from '../validators/interventionSchema';
import { mapColumns, normalizeAntibiotics } from '../groq/excelAI';
import type { InterventionRecord } from '../../types';

export interface ParseResult {
  valid: InterventionRecord[];
  errors: { row: number; message: string }[];
  aiWarning?: string; // set when AI calls failed (graceful degradation)
}

const normalizeHeader = (h: string) => h.trim().toLowerCase().replace(/\s+/g, ' ');

// Pre-build a normalized version of the column map so header lookup is O(1)
const normalizedColumnMap: Record<string, keyof InterventionRecord> = {};
for (const [spanishHeader, camelKey] of Object.entries(EXCEL_COLUMN_MAP)) {
  normalizedColumnMap[normalizeHeader(spanishHeader)] = camelKey;
}

/**
 * Bridge from AI standard field names → actual InterventionRecord camelCase keys.
 * Only covers fields that differ or need disambiguation.
 */
const AI_FIELD_TO_RECORD: Partial<Record<string, keyof InterventionRecord>> = {
  fechaIngreso:  'fecha',
  servicio:      'servicio',
  diagnostico:   'diagnostico',
  antibiotico:   'antibiotico01',
  via:           'accionesMed01',
  duracion:      'diasTerapiaMed01',
  cultivo:       'cultivosPrevios',
  germen:        'organismoAislado',
  sensibilidad:  'sensibilidadMeropenem',
  aproboTerapia: 'aproboTerapia',
  tipoPaciente:  'tipoIntervencion',
};

/**
 * Reads the raw binary of a browser File and converts it to an array of row objects
 * using SheetJS. Wrapped in a Promise for FileReader compatibility.
 */
function readFileAsRows(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) { reject(new Error('El archivo está vacío.')); return; }

        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) { reject(new Error('El archivo no contiene hojas de cálculo.')); return; }

        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: '',
          raw: false,
        });
        resolve(rows);
      } catch (err) {
        reject(new Error(`Error al procesar el archivo: ${String(err)}`));
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Reads a browser File (.xlsx, .xls, .csv), maps Spanish headers to camelCase,
 * validates each row with Zod, then applies AI-powered column mapping and
 * antibiotic name normalization (both with graceful degradation on failure).
 */
export async function parseInterventionFile(file: File): Promise<ParseResult> {
  // ── Step 1: Read raw rows ──────────────────────────────────────────────────
  const rows = await readFileAsRows(file);
  const rawHeaders = rows.length > 0 ? Object.keys(rows[0]) : [];

  if (rawHeaders.length > 0) {
    console.log('[Parser] detected headers:', rawHeaders);
  }

  // ── Step 2: AI column mapping (once per file) ──────────────────────────────
  let aiWarning: string | undefined;
  let aiColumnMap: Record<string, string> = {};

  try {
    aiColumnMap = await mapColumns(rawHeaders);
    console.log('[Parser] AI column map:', aiColumnMap);
  } catch (err) {
    console.warn('[Parser] AI column mapping failed:', err);
    aiWarning = 'IA no disponible — datos sin normalizar';
  }

  // Build a resolver: for a given rawHeader, return the InterventionRecord key.
  // Priority: existing normalizedColumnMap first, then AI mapping as fallback.
  const resolveHeader = (rawHeader: string): keyof InterventionRecord | undefined => {
    // 1. Try existing exact-match normalized map
    const existing = normalizedColumnMap[normalizeHeader(rawHeader)];
    if (existing) return existing;

    // 2. Try AI mapping fallback
    const aiField = aiColumnMap[rawHeader];
    if (aiField) {
      return AI_FIELD_TO_RECORD[aiField];
    }

    return undefined;
  };

  // ── Step 3: Parse all rows ─────────────────────────────────────────────────
  const valid: InterventionRecord[] = [];
  const errors: { row: number; message: string }[] = [];

  rows.forEach((rawRow, index) => {
    const excelRowNumber = index + 2; // row 1 = header in Excel

    // Skip fully empty rows
    const values = Object.values(rawRow);
    if (values.every((v) => v === '' || v === null || v === undefined)) {
      return;
    }

    // Map headers → camelCase keys
    const mapped: Record<string, string> = {};
    for (const [rawHeader, rawValue] of Object.entries(rawRow)) {
      const camelKey = resolveHeader(rawHeader);
      if (camelKey) {
        mapped[camelKey] = rawValue !== null && rawValue !== undefined ? String(rawValue).trim() : '';
      }
    }

    // Validate with Zod
    const result = interventionSchema.safeParse(mapped);
    if (!result.success) {
      const msg = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      errors.push({ row: excelRowNumber, message: msg });
      return;
    }

    valid.push(result.data as InterventionRecord);
  });

  // ── Step 4: AI antibiotic normalization (once per file) ────────────────────
  const rawAntibiotics = valid.flatMap((r) =>
    [r.antibiotico01, r.antibiotico02].filter((a): a is string => Boolean(a)),
  );

  let normMap: Record<string, string> = {};
  try {
    normMap = await normalizeAntibiotics(rawAntibiotics);
    console.log('[Parser] AI antibiotic normalization applied');
  } catch (err) {
    console.warn('[Parser] AI antibiotic normalization failed:', err);
    if (!aiWarning) aiWarning = 'IA no disponible — datos sin normalizar';
  }

  // Apply normalization to valid records
  if (Object.keys(normMap).length > 0) {
    for (const r of valid) {
      if (r.antibiotico01 && normMap[r.antibiotico01]) {
        r.antibiotico01 = normMap[r.antibiotico01];
      }
      if (r.antibiotico02 && normMap[r.antibiotico02]) {
        r.antibiotico02 = normMap[r.antibiotico02];
      }
    }
  }

  return { valid, errors, aiWarning };
}
