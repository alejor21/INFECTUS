import * as XLSX from 'xlsx';
import { EXCEL_COLUMN_MAP } from '../../constants/excelColumns';
import { interventionSchema } from '../validators/interventionSchema';
import { mapColumns, normalizeAntibiotics } from '../groq/excelAI';
import type { InterventionRecord } from '../../types';

export interface ParseResult {
  valid: InterventionRecord[];
  errors: { row: number; message: string }[];
  aiWarning?: string;
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    missingColumns: string[];
    warnings: string[];
  };
}

/**
 * Normalizes a header string by:
 * - Trimming whitespace
 * - Converting to lowercase
 * - Removing accents
 * - Collapsing multiple spaces to single space
 * - Removing special characters
 */
const normalizeHeader = (h: string): string => {
  return h
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[¿?¡!]/g, '') // Remove question/exclamation marks
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/[^a-z0-9\s]/g, ''); // Remove special chars except spaces
};

// Pre-build a normalized version of the column map so header lookup is O(1)
const normalizedColumnMap: Record<string, keyof InterventionRecord> = {};
for (const [spanishHeader, camelKey] of Object.entries(EXCEL_COLUMN_MAP)) {
  normalizedColumnMap[normalizeHeader(spanishHeader)] = camelKey;
}

// Known column variations for fuzzy matching
const COLUMN_ALIASES: Record<string, keyof InterventionRecord> = {
  // Fecha
  'fecha': 'fecha',
  'fechaingreso': 'fecha',
  'fecha ingreso': 'fecha',
  'fecha de ingreso': 'fecha',
  'fecha evaluacion': 'fecha',
  'fecha de evaluacion': 'fecha',
  'date': 'fecha',
  
  // Tipo intervención
  'tipo intervencion': 'tipoIntervencion',
  'tipodeintervencion': 'tipoIntervencion',
  'tipo': 'tipoIntervencion',
  'tipo de intervencion ic proa rev': 'tipoIntervencion',
  'intervencion': 'tipoIntervencion',
  
  // Paciente
  'paciente': 'nombre',
  'nombrep': 'nombre',
  'nombre paciente': 'nombre',
  'nombre del paciente': 'nombre',
  'nombre completo': 'nombre',
  
  // Cédula
  'cedula': 'admisionCedula',
  'identificacion': 'admisionCedula',
  'admision': 'admisionCedula',
  'admision cedula': 'admisionCedula',
  'numero documento': 'admisionCedula',
  'documento': 'admisionCedula',
  'id paciente': 'admisionCedula',
  
  // Cama
  'habitacion': 'cama',
  'cuarto': 'cama',
  'ubicacion': 'cama',
  
  // Servicio
  'area': 'servicio',
  'unidad': 'servicio',
  'departamento': 'servicio',
  'seccion': 'servicio',
  
  // Edad
  'anos': 'edad',
  'edad anos': 'edad',
  'years': 'edad',
  'edad paciente': 'edad',
  
  // Código diagnóstico
  'cod diagnostico': 'codDiagnostico',
  'codigo diagnostico': 'codDiagnostico',
  'cie10': 'codDiagnostico',
  'cie 10': 'codDiagnostico',
  'codigo cie': 'codDiagnostico',
  
  // Diagnóstico
  'dx': 'diagnostico',
  'diagnostico principal': 'diagnostico',
  'diagnostico infeccioso': 'diagnostico',
  
  // IAAS
  'iaas': 'iaas',
  'es iaas': 'iaas',
  'iaas sn': 'iaas',
  
  // Tipo IAAS
  'tipo iaas': 'tipoIaas',
  'tipo de iaas': 'tipoIaas',
  'clasificacion iaas': 'tipoIaas',
  
  // Aprobación terapia
  'aprobo': 'aproboTerapia',
  'aprobacion': 'aproboTerapia',
  'se aprobo': 'aproboTerapia',
  'se aprobo terapia': 'aproboTerapia',
  'se aprobo terapia antimicrobiana': 'aproboTerapia',
  'aprobo terapia': 'aproboTerapia',
  'aprobada': 'aproboTerapia',
  
  // Causa no aprobación
  'causa no aprobacion': 'causaNoAprobacion',
  'si no se aprobo causa': 'causaNoAprobacion',
  'causa': 'causaNoAprobacion',
  'motivo no aprobacion': 'causaNoAprobacion',
  'razon no aprobacion': 'causaNoAprobacion',
  
  // Combinación no adecuada
  'combinacion no adecuada': 'combinacionNoAdecuada',
  'combinacion inadecuada': 'combinacionNoAdecuada',
  
  // Extensión no adecuada
  'extension no adecuada': 'extensionNoAdecuada',
  'extension inadecuada': 'extensionNoAdecuada',
  'duracion no adecuada': 'extensionNoAdecuada',
  
  // Ajuste por cultivo
  'ajuste por cultivo': 'ajustePorCultivo',
  'ajuste cultivo': 'ajustePorCultivo',
  'se realizo ajuste de terapia antimicrobiana guiado por reporte de sensibilidad en cultivo': 'ajustePorCultivo',
  'ajuste terapia cultivo': 'ajustePorCultivo',
  
  // Correlación diagnóstico antibiótico
  'correlacion dx antibiotico': 'correlacionDxAntibiotico',
  'diagnostico infeccioso correlacionado con terapia antibiotica': 'correlacionDxAntibiotico',
  'correlacion diagnostico': 'correlacionDxAntibiotico',
  
  // Terapia empírica apropiada
  'terapia apropiada': 'terapiaEmpricaApropiada',
  'terapia empirica apropiada': 'terapiaEmpricaApropiada',
  'la terapia empirica fue apropiada primera linea': 'terapiaEmpricaApropiada',
  'empirica apropiada': 'terapiaEmpricaApropiada',
  'primera linea': 'terapiaEmpricaApropiada',
  
  // Cultivos previos
  'cultivo': 'cultivosPrevios',
  'cultivos': 'cultivosPrevios',
  'cultivos previos': 'cultivosPrevios',
  'se realizo toma de cultivos previo al inicio antimicrobiano': 'cultivosPrevios',
  'toma de cultivos': 'cultivosPrevios',
  'tomo cultivo': 'cultivosPrevios',
  
  // Conducta general
  'conducta': 'conductaGeneral',
  'conducta general cambio a terapia a oral dirige terapia mantiene desescalona escalona': 'conductaGeneral',
  'conducta terapeutica': 'conductaGeneral',
  'accion': 'conductaGeneral',
  
  // Antibiótico 01
  'antibiotico 1': 'antibiotico01',
  'antibiotico1': 'antibiotico01',
  'atb 1': 'antibiotico01',
  'atb01': 'antibiotico01',
  'antibiotico 01': 'antibiotico01',
  'antibiotico01': 'antibiotico01',
  'medicamento 1': 'antibiotico01',
  'atb1': 'antibiotico01',
  
  // Acciones medicamento 01
  'acciones medicamento 01': 'accionesMed01',
  'acciones med 01': 'accionesMed01',
  'accion medicamento 1': 'accionesMed01',
  'accion 1': 'accionesMed01',
  
  // Días terapia 01
  'dias 1': 'diasTerapiaMed01',
  'dias1': 'diasTerapiaMed01',
  'dias terapia 1': 'diasTerapiaMed01',
  'dias terapia medicamento 01': 'diasTerapiaMed01',
  'dias terapia medicamento01': 'diasTerapiaMed01',
  'duracion 1': 'diasTerapiaMed01',
  
  // Antibiótico 02
  'antibiotico 2': 'antibiotico02',
  'antibiotico2': 'antibiotico02',
  'atb 2': 'antibiotico02',
  'atb02': 'antibiotico02',
  'antibiotico 02': 'antibiotico02',
  'antibiotico02': 'antibiotico02',
  'medicamento 2': 'antibiotico02',
  'atb2': 'antibiotico02',
  
  // Acciones medicamento 02
  'acciones medicamento 02': 'accionesMed02',
  'acciones med 02': 'accionesMed02',
  'accion medicamento 2': 'accionesMed02',
  'accion 2': 'accionesMed02',
  
  // Días terapia 02
  'dias 2': 'diasTerapiaMed02',
  'dias2': 'diasTerapiaMed02',
  'dias terapia 2': 'diasTerapiaMed02',
  'dias terapia medicamento 02': 'diasTerapiaMed02',
  'dias terapia medicamento02': 'diasTerapiaMed02',
  'duracion 2': 'diasTerapiaMed02',
  
  // Observaciones
  'obs': 'observaciones',
  'comentarios': 'observaciones',
  'notas': 'observaciones',
  'nota': 'observaciones',
  
  // Microbiología
  'resultado cultivo': 'resultadoCultivo',
  'resultado': 'resultadoCultivo',
  'tipo de muestra': 'tipoMuestra',
  'muestra': 'tipoMuestra',
  'organismo aislado': 'organismoAislado',
  'germen': 'organismoAislado',
  'microorganismo': 'organismoAislado',
  'sensibilidad vancomicina': 'sensibilidadVancomicina',
  'vancomicina': 'sensibilidadVancomicina',
  'sensibilidad meropenem': 'sensibilidadMeropenem',
  'meropenem': 'sensibilidadMeropenem',
};

/**
 * Parses various date formats into YYYY-MM-DD string
 * Handles: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, Excel serial numbers
 */
function parseExcelDate(value: unknown): string {
  if (!value) return '';
  
  const str = String(value).trim();
  
  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  
  // DD/MM/YYYY or MM/DD/YYYY
  const slashMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashMatch) {
    const [, a, b, year] = slashMatch;
    const day = parseInt(a);
    const month = parseInt(b);
    
    // Heuristic: if day > 12, it's DD/MM/YYYY, otherwise MM/DD/YYYY
    if (day > 12) {
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    } else {
      // Assume DD/MM/YYYY (Colombian standard)
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
  }
  
  // Excel serial number (days since 1900-01-01)
  const num = parseFloat(str);
  if (!isNaN(num) && num > 1 && num < 100000) {
    const epoch = new Date(1900, 0, 1);
    epoch.setDate(epoch.getDate() + num - 2); // Excel bug: counts 1900 as leap year
    const year = epoch.getFullYear();
    const month = (epoch.getMonth() + 1).toString().padStart(2, '0');
    const day = epoch.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return '';
}

/**
 * Cleans cell value by:
 * - Trimming whitespace
 * - Replacing N/A, -, empty values with empty string
 * - Converting null/undefined to empty string
 */
function cleanCellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  
  const str = String(value).trim();
  
  // Replace various "empty" indicators
  const emptyIndicators = ['', '-', 'n/a', 'na', 'null', 'undefined', 'ninguno', 'ninguna', '.', '...'];
  if (emptyIndicators.includes(str.toLowerCase())) {
    return '';
  }
  
  return str;
}

/**
 * Normalizes boolean-like values to 'SI' or 'NO'.
 * Returns original value if not a boolean-like value.
 */
function normalizeBooleanValue(value: string): string {
  const cleaned = value.trim().toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove accents
  
  // Values that mean "yes"
  const yesValues = ['si', 'sí', 's', 'yes', 'y', '1', 'true', 'verdadero', 'x', 'aplica'];
  if (yesValues.includes(cleaned)) {
    return 'SI';
  }
  
  // Values that mean "no"
  const noValues = ['no', 'n', '0', 'false', 'falso', 'no aplica', 'na'];
  if (noValues.includes(cleaned)) {
    return 'NO';
  }
  
  // Return original if not boolean-like
  return value;
}

/**
 * Fields that should be normalized to SI/NO
 */
const BOOLEAN_FIELDS: (keyof InterventionRecord)[] = [
  'iaas',
  'aproboTerapia',
  'combinacionNoAdecuada',
  'extensionNoAdecuada',
  'ajustePorCultivo',
  'correlacionDxAntibiotico',
  'terapiaEmpricaApropiada',
  'cultivosPrevios',
  'blee',
  'carbapenemasa',
  'mrsa',
];
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
  // Priority: existing normalizedColumnMap first, then aliases, then AI mapping
  const resolveHeader = (rawHeader: string): keyof InterventionRecord | undefined => {
    const normalized = normalizeHeader(rawHeader);
    
    // 1. Try existing exact-match normalized map
    const existing = normalizedColumnMap[normalized];
    if (existing) return existing;

    // 2. Try known aliases
    const alias = COLUMN_ALIASES[normalized];
    if (alias) return alias;

    // 3. Try AI mapping fallback
    const aiField = aiColumnMap[rawHeader];
    if (aiField) {
      return AI_FIELD_TO_RECORD[aiField];
    }

    return undefined;
  };

  // Detect missing required columns
  const requiredFields: (keyof InterventionRecord)[] = [
    'fecha',
    'servicio',
    'diagnostico',
    'aproboTerapia'
  ];
  
  const mappedHeaders = rawHeaders.map(resolveHeader).filter(Boolean);
  const missingColumns = requiredFields.filter(
    (field) => !mappedHeaders.includes(field)
  );
  
  if (missingColumns.length > 0) {
    console.warn('[Parser] Columnas faltantes detectadas:', missingColumns);
  }

  // ── Step 3: Parse all rows ─────────────────────────────────────────────────
  const valid: InterventionRecord[] = [];
  const errors: { row: number; message: string }[] = [];
  const warnings: string[] = [];

  rows.forEach((rawRow, index) => {
    const excelRowNumber = index + 2; // row 1 = header in Excel

    // Skip fully empty rows
    const values = Object.values(rawRow);
    if (values.every((v) => v === '' || v === null || v === undefined)) {
      return;
    }

    // Map headers → camelCase keys and clean values
    const mapped: Record<string, string> = {};
    for (const [rawHeader, rawValue] of Object.entries(rawRow)) {
      const camelKey = resolveHeader(rawHeader);
      if (camelKey) {
        // Special handling for date fields
        if (camelKey === 'fecha') {
          const dateVal = parseExcelDate(rawValue);
          if (!dateVal && rawValue) {
            warnings.push(`Fila ${excelRowNumber}: Fecha "${rawValue}" no reconocida`);
          }
          mapped[camelKey] = dateVal;
        } 
        // Normalize boolean fields (SI/NO)
        else if (BOOLEAN_FIELDS.includes(camelKey)) {
          const cleaned = cleanCellValue(rawValue);
          mapped[camelKey] = cleaned ? normalizeBooleanValue(cleaned) : '';
        }
        else {
          mapped[camelKey] = cleanCellValue(rawValue);
        }
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

  return { 
    valid, 
    errors, 
    aiWarning,
    summary: {
      totalRows: rows.length,
      validRows: valid.length,
      errorRows: errors.length,
      missingColumns,
      warnings
    }
  };
}
