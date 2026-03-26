import * as XLSX from 'xlsx';
import { interventionSchema } from '../validators/interventionSchema';
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

type ImportField = keyof Omit<
  InterventionRecord,
  'id' | 'hospitalName' | 'createdAt'
>;

const CRITICAL_FIELDS: ImportField[] = [
  'fecha',
  'servicio',
  'diagnostico',
  'aproboTerapia',
];

const FIELD_LABELS: Record<ImportField, string> = {
  fecha: 'Fecha',
  tipoIntervencion: 'Tipo intervención',
  nombre: 'Nombre',
  admisionCedula: 'Cédula',
  cama: 'Cama',
  servicio: 'Servicio',
  edad: 'Edad',
  codDiagnostico: 'Código diagnóstico',
  diagnostico: 'Diagnóstico',
  iaas: 'IAAS',
  tipoIaas: 'Tipo IAAS',
  aproboTerapia: 'Aprobación terapia',
  causaNoAprobacion: 'Causa no aprobación',
  combinacionNoAdecuada: 'Combinación no adecuada',
  extensionNoAdecuada: 'Extensión no adecuada',
  ajustePorCultivo: 'Ajuste por cultivo',
  correlacionDxAntibiotico: 'Diagnóstico correlacionado',
  terapiaEmpricaApropiada: 'Terapia empírica apropiada',
  cultivosPrevios: 'Cultivos previos',
  conductaGeneral: 'Conducta general',
  antibiotico01: 'Antibiótico 01',
  accionesMed01: 'Acciones medicamento 01',
  diasTerapiaMed01: 'Días terapia 01',
  antibiotico02: 'Antibiótico 02',
  accionesMed02: 'Acciones medicamento 02',
  diasTerapiaMed02: 'Días terapia 02',
  observaciones: 'Observaciones',
  resultadoCultivo: 'Resultado cultivo',
  tipoMuestra: 'Tipo de muestra',
  organismoAislado: 'Organismo aislado',
  blee: 'BLEE',
  carbapenemasa: 'Carbapenemasa',
  mrsa: 'MRSA',
  sensibilidadVancomicina: 'Sensibilidad vancomicina',
  sensibilidadMeropenem: 'Sensibilidad meropenem',
};

const FIELD_ALIASES: Record<ImportField, string[]> = {
  fecha: [
    'fecha',
    'fecha_de_evaluacion',
    'fecha_evaluacion',
    'fecha_ingreso',
  ],
  tipoIntervencion: [
    'tipo_intervencion',
    'tipo_de_intervencion',
    'tipo_intervencion_ic_proa_rev',
    'tipo_de_intervencion_ic_proa_rev',
  ],
  nombre: ['nombre', 'nombre_completo', 'paciente'],
  admisionCedula: [
    'cedula',
    'admision',
    'admision_cedula',
    'admision/cedula',
    'numero_documento',
  ],
  cama: ['cama'],
  servicio: ['servicio', 'area', 'unidad'],
  edad: ['edad'],
  codDiagnostico: [
    'cod_diagnostico',
    'codigo_diagnostico',
    'codigo_cie10',
    'cie10',
  ],
  diagnostico: ['diagnostico'],
  iaas: ['iaas', 'es_iaas'],
  tipoIaas: ['tipo_iaas', 'tipo_de_iaas'],
  aproboTerapia: [
    'aprobacion_terapia',
    'aprobo_terapia',
    'se_aprobo_terapia_antimicrobiana',
  ],
  causaNoAprobacion: [
    'causa_no_aprobacion',
    'si_no_se_aprobo_causa',
  ],
  combinacionNoAdecuada: ['combinacion_no_adecuada'],
  extensionNoAdecuada: ['extension_no_adecuada'],
  ajustePorCultivo: ['ajuste_por_cultivo'],
  correlacionDxAntibiotico: [
    'diagnostico_correlacionado',
    'correlacion_dx_antibiotico',
    'diagnostico_infeccioso_correlacionado_con_terapia_antibiotica',
  ],
  terapiaEmpricaApropiada: [
    'terapia_empirica_apropiada',
    'la_terapia_empirica_fue_apropiada_primera_linea',
  ],
  cultivosPrevios: [
    'cultivos_previos',
    'se_realizo_toma_de_cultivos_previo_al_inicio_antimicrobiano',
  ],
  conductaGeneral: [
    'conducta_general',
    'conducta_general_cambio_oral/dirige/mantiene/desescalona/escala',
    'conducta_general_cambio_a_terapia_oral_dirige_terapia_mantiene_desescalona_escala',
  ],
  antibiotico01: ['antibiotico_01', 'antibiotico01', 'antibiotico_1'],
  accionesMed01: [
    'acciones_medicamento_01',
    'acciones_med_01',
    'accion_medicamento_01',
  ],
  diasTerapiaMed01: [
    'dias_terapia_01',
    'dias_terapia_med_01',
    'dias_terapia_medicamento_01',
  ],
  antibiotico02: ['antibiotico_02', 'antibiotico02', 'antibiotico_2'],
  accionesMed02: [
    'acciones_medicamento_02',
    'acciones_med_02',
    'accion_medicamento_02',
  ],
  diasTerapiaMed02: [
    'dias_terapia_02',
    'dias_terapia_med_02',
    'dias_terapia_medicamento_02',
  ],
  observaciones: ['observaciones', 'observacion'],
  resultadoCultivo: ['resultado_cultivo'],
  tipoMuestra: ['tipo_muestra'],
  organismoAislado: ['organismo_aislado', 'germen'],
  blee: ['blee'],
  carbapenemasa: ['carbapenemasa'],
  mrsa: ['mrsa'],
  sensibilidadVancomicina: ['sensibilidad_vancomicina'],
  sensibilidadMeropenem: ['sensibilidad_meropenem'],
};

const HEADER_TO_FIELD = new Map<string, ImportField>();

Object.entries(FIELD_ALIASES).forEach(([field, aliases]) => {
  aliases.forEach((alias) => {
    HEADER_TO_FIELD.set(canonicalize(alias), field as ImportField);
  });
});

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function canonicalize(value: string): string {
  return normalize(value)
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function cleanString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  const normalized = text.toUpperCase();
  if (normalized === 'N/A' || normalized === 'NA' || text === '-') {
    return null;
  }

  return text;
}

function parseBool(value: unknown): boolean | null {
  const text = cleanString(value);
  if (!text) {
    return null;
  }

  const normalized = normalize(text);

  if (['si', '1', 'true', 'yes'].includes(normalized)) {
    return true;
  }

  if (['no', '0', 'false'].includes(normalized)) {
    return false;
  }

  return null;
}

function formatDate(date: Date): string | null {
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function parseDate(value: unknown): string | null {
  if (value instanceof Date) {
    return formatDate(value);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return formatDate(new Date((value - 25569) * 86400 * 1000));
  }

  const text = cleanString(value);
  if (!text) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return formatDate(new Date(`${text}T00:00:00.000Z`));
  }

  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) {
    const first = Number(match[1]);
    const second = Number(match[2]);
    const year = Number(match[3]);

    let day = first;
    let month = second;

    if (first <= 12 && second > 12) {
      month = first;
      day = second;
    }

    const candidate = new Date(Date.UTC(year, month - 1, day));
    const valid =
      candidate.getUTCFullYear() === year &&
      candidate.getUTCMonth() === month - 1 &&
      candidate.getUTCDate() === day;

    return valid ? candidate.toISOString().slice(0, 10) : null;
  }

  const numeric = Number(text);
  if (Number.isFinite(numeric) && numeric > 0) {
    return formatDate(new Date((numeric - 25569) * 86400 * 1000));
  }

  return null;
}

function boolToStorage(value: boolean | null): string {
  if (value === null) {
    return '';
  }

  return value ? 'SI' : 'NO';
}

function normalizeAction(value: string | null): string {
  if (!value) {
    return '';
  }

  const normalized = canonicalize(value);
  const map: Record<string, string> = {
    inicio: 'Inicio',
    cambio: 'Cambio',
    suspension: 'Suspensión',
    suspender: 'Suspensión',
    continua: 'Continúa',
    continuacion: 'Continúa',
    continua_tratamiento: 'Continúa',
  };

  return map[normalized] ?? value;
}

function normalizeConducta(value: string | null): string {
  if (!value) {
    return '';
  }

  const normalized = canonicalize(value);
  const map: Record<string, string> = {
    cambio_oral: 'Cambio a terapia oral',
    cambio_a_terapia_oral: 'Cambio a terapia oral',
    dirige: 'Dirige terapia',
    dirige_terapia: 'Dirige terapia',
    mantiene: 'Mantiene',
    desescalona: 'Desescalona',
    escala: 'Escala',
  };

  return map[normalized] ?? value;
}

function normalizeInterventionType(value: string | null): string {
  if (!value) {
    return '';
  }

  const normalized = canonicalize(value).toUpperCase();
  if (normalized === 'IC' || normalized === 'PROA' || normalized === 'REV') {
    return normalized;
  }

  return value.toUpperCase();
}

function createEmptyRecord(): InterventionRecord {
  return {
    fecha: '',
    tipoIntervencion: '',
    nombre: '',
    admisionCedula: '',
    cama: '',
    servicio: '',
    edad: '',
    codDiagnostico: '',
    diagnostico: '',
    iaas: '',
    tipoIaas: '',
    aproboTerapia: '',
    causaNoAprobacion: '',
    combinacionNoAdecuada: '',
    extensionNoAdecuada: '',
    ajustePorCultivo: '',
    correlacionDxAntibiotico: '',
    terapiaEmpricaApropiada: '',
    cultivosPrevios: '',
    conductaGeneral: '',
    antibiotico01: '',
    accionesMed01: '',
    diasTerapiaMed01: '',
    antibiotico02: '',
    accionesMed02: '',
    diasTerapiaMed02: '',
    observaciones: '',
    resultadoCultivo: '',
    tipoMuestra: '',
    organismoAislado: '',
    blee: '',
    carbapenemasa: '',
    mrsa: '',
    sensibilidadVancomicina: '',
    sensibilidadMeropenem: '',
  };
}

function resolveHeader(header: string): ImportField | undefined {
  return HEADER_TO_FIELD.get(canonicalize(header));
}

async function readFileAsRows(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: false,
  });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('El archivo no contiene hojas para procesar.');
  }

  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: true,
  });
}

function setRecordValue(
  record: InterventionRecord,
  field: ImportField,
  rawValue: unknown,
): string | null {
  switch (field) {
    case 'fecha': {
      const parsed = parseDate(rawValue);
      record.fecha = parsed ?? '';
      return parsed ? null : 'Fecha inválida';
    }
    case 'tipoIntervencion':
      record.tipoIntervencion = normalizeInterventionType(cleanString(rawValue));
      return null;
    case 'iaas':
    case 'aproboTerapia':
    case 'combinacionNoAdecuada':
    case 'extensionNoAdecuada':
    case 'ajustePorCultivo':
    case 'correlacionDxAntibiotico':
    case 'terapiaEmpricaApropiada':
    case 'cultivosPrevios':
    case 'blee':
    case 'carbapenemasa':
    case 'mrsa':
      record[field] = boolToStorage(parseBool(rawValue));
      return null;
    case 'conductaGeneral':
      record.conductaGeneral = normalizeConducta(cleanString(rawValue));
      return null;
    case 'accionesMed01':
    case 'accionesMed02':
      record[field] = normalizeAction(cleanString(rawValue));
      return null;
    default:
      record[field] = cleanString(rawValue) ?? '';
      return null;
  }
}

export async function parseInterventionFile(file: File): Promise<ParseResult> {
  const rows = await readFileAsRows(file);
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const mappedFields = new Set<ImportField>();

  headers.forEach((header) => {
    const field = resolveHeader(header);
    if (field) {
      mappedFields.add(field);
    }
  });

  const missingColumns = CRITICAL_FIELDS.filter((field) => !mappedFields.has(field)).map(
    (field) => FIELD_LABELS[field],
  );

  const valid: InterventionRecord[] = [];
  const errors: { row: number; message: string }[] = [];
  const warnings: string[] = [];

  rows.forEach((rawRow, index) => {
    const rowNumber = index + 2;
    const record = createEmptyRecord();
    let hasMappedData = false;
    let invalidDate = false;

    Object.entries(rawRow).forEach(([header, value]) => {
      const field = resolveHeader(header);
      if (!field) {
        return;
      }

      if (cleanString(value) !== null || field === 'fecha') {
        hasMappedData = true;
      }

      const fieldError = setRecordValue(record, field, value);
      if (field === 'fecha' && fieldError) {
        invalidDate = true;
      }
    });

    if (!hasMappedData) {
      return;
    }

    if (invalidDate) {
      errors.push({
        row: rowNumber,
        message: 'Fecha inválida — omitida',
      });
      return;
    }

    if (!record.servicio) {
      errors.push({
        row: rowNumber,
        message: 'Servicio requerido — omitida',
      });
      return;
    }

    const validation = interventionSchema.safeParse(record);
    if (!validation.success) {
      const message = validation.error.issues
        .map((issue) => issue.message)
        .join('; ');
      errors.push({
        row: rowNumber,
        message: message || 'Fila inválida — omitida',
      });
      return;
    }

    valid.push(record);
  });

  if (missingColumns.length > 0) {
    warnings.push(
      `Columnas críticas faltantes: ${missingColumns.join(', ')}`,
    );
  }

  return {
    valid,
    errors,
    summary: {
      totalRows: rows.length,
      validRows: valid.length,
      errorRows: errors.length,
      missingColumns,
      warnings,
    },
  };
}
