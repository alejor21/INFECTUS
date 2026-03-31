import * as XLSX from 'xlsx';
import { getSupabaseClient } from '../../lib/supabase/client';
import { parseInterventionFile } from '../../lib/parsers/excelParser';
import { upsertInterventions } from '../../lib/supabase/queries/interventions';

const SPANISH_MONTHS: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

const ENGLISH_MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const MONTH_LABELS: Record<number, string> = {
  1: 'Enero',
  2: 'Febrero',
  3: 'Marzo',
  4: 'Abril',
  5: 'Mayo',
  6: 'Junio',
  7: 'Julio',
  8: 'Agosto',
  9: 'Septiembre',
  10: 'Octubre',
  11: 'Noviembre',
  12: 'Diciembre',
};

const MESES_LABEL = [
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

const COLUMN_MAP: Record<string, string[]> = {
  fecha: ['fecha', 'date', 'fecha_intervencion', 'fecha_valoracion', 'fecha_de_intervencion'],
  tipo_intervencion: ['tipo_intervencion', 'tipo', 'tipo_de_intervencion', 'intervencion'],
  nombre_paciente: ['nombre_paciente', 'nombre', 'paciente', 'nombre_del_paciente'],
  cedula: ['cedula', 'id', 'documento', 'identificacion', 'admision', 'no_admision', 'admision_cedula'],
  cama: ['cama', 'cama_no', 'numero_cama', 'no_cama'],
  servicio: ['servicio', 'area', 'unidad', 'servicio_medico'],
  edad: ['edad', 'age', 'anos', 'a_os'],
  cod_diagnostico: ['cod_diagnostico', 'codigo_diagnostico', 'cie10', 'codigo_cie'],
  diagnostico: ['diagnostico', 'diagnosis', 'diagnostico_principal', 'impresion_diagnostica'],
  iaas: ['iaas', 'infeccion_asociada', 'infeccion_hospitalaria', 'iaas_si_no'],
  tipo_iaas: ['tipo_iaas', 'tipo_infeccion', 'tipo_de_iaas'],
  aprobacion_terapia: ['aprobacion_terapia', 'aprobacion', 'se_aprobo', 'aprobado', 'adherencia', 'aprobacion_de_terapia', 'aprobo_terapia'],
  causa_no_aprobacion: ['causa_no_aprobacion', 'causa_no_aprobado', 'razon_no_aprobacion'],
  combinacion_no_adecuada: ['combinacion_no_adecuada', 'combinacion_inadecuada'],
  extension_no_adecuada: ['extension_no_adecuada', 'extension_inadecuada'],
  ajuste_cultivo: ['ajuste_cultivo', 'ajuste_por_cultivo', 'cultivo_ajuste'],
  dx_correlacionado: ['dx_correlacionado', 'diagnostico_correlacionado', 'correlacion', 'correlacion_dx_antibiotico'],
  terapia_empirica: ['terapia_empirica', 'empirica', 'tratamiento_empirico', 'terapia_empirica_apropiada'],
  cultivos_previos: ['cultivos_previos', 'cultivo_previo', 'tiene_cultivos'],
  conducta_general: ['conducta_general', 'conducta', 'recomendacion', 'accion', 'conducta_infectologia'],
  antibiotico_01: ['antibiotico_01', 'antibiotico1', 'antibiotico_1', 'antibiotico', 'atb1'],
  acciones_medicamento_01: ['acciones_medicamento_01', 'accion_01', 'accion1', 'accion_atb_1', 'acciones_med_01'],
  dias_terapia_01: ['dias_terapia_01', 'dias1', 'dias_01', 'dias_tratamiento_1', 'dias_terapia_med_01'],
  antibiotico_02: ['antibiotico_02', 'antibiotico2', 'antibiotico_2', 'atb2'],
  acciones_medicamento_02: ['acciones_medicamento_02', 'accion_02', 'accion2', 'acciones_med_02'],
  dias_terapia_02: ['dias_terapia_02', 'dias2', 'dias_02', 'dias_terapia_med_02'],
  observaciones: ['observaciones', 'notas', 'comentarios', 'observacion'],
};

export interface TopItem {
  name: string;
  count: number;
}

export interface NumericStats {
  min: number;
  max: number;
  avg: number;
  sum: number;
}

export interface MonthMetrics {
  totalRows: number;
  columns: string[];
  numericSummary: Record<string, NumericStats>;
  topValues: Record<string, Array<{ value: string; count: number }>>;
  topAntibiotics?: TopItem[];
  topMicroorganisms?: TopItem[];
  topServices?: TopItem[];
  topDiagnoses?: TopItem[];
  totalDDD?: number;
}

export interface HospitalMonthlyMetric {
  id: string;
  hospital_id: string;
  upload_id: string | null;
  month: string;
  month_label: string;
  metrics: MonthMetrics;
  row_count: number;
  created_at: string;
}

export interface HospitalExcelUpload {
  id: string;
  hospital_id: string;
  user_id: string;
  filename: string;
  periodo: string | null;
  mes: number | null;
  anio: number | null;
  total_filas: number;
  filas_validas: number;
  filas_error: number;
  estado: 'procesando' | 'completado' | 'error';
  errores: unknown[];
  created_at: string;
  updated_at: string;
}

export interface RowError {
  fila: number;
  motivo: string;
}

export interface DetectedMonth {
  mes: number;
  anio: number;
  label: string;
  count: number;
}

export interface ProcessResult {
  success: boolean;
  monthsFound: string[];
  totalRows: number;
  filasInsertadas: number;
  filasConError: number;
  mesesDetectados: DetectedMonth[];
  errores: RowError[];
  error?: string;
}

interface InsertedUploadRow {
  id: string;
}

interface EvaluationInsertRow {
  hospital_id: string;
  hospital_name: string;
  created_by: string;
  status: 'completada';
  evaluation_date: string;
  fecha: string | null;
  mes: number | null;
  anio: number | null;
  tipo_intervencion: string | null;
  nombre_paciente: string | null;
  cedula: string | null;
  cama: string | null;
  servicio: string | null;
  edad: number | null;
  cod_diagnostico: string | null;
  diagnostico: string | null;
  iaas: boolean | null;
  tipo_iaas: string | null;
  aprobacion_terapia: boolean | null;
  causa_no_aprobacion: string | null;
  combinacion_no_adecuada: boolean | null;
  extension_no_adecuada: boolean | null;
  ajuste_cultivo: boolean | null;
  dx_correlacionado: boolean | null;
  terapia_empirica: boolean | null;
  cultivos_previos: boolean | null;
  conducta_general: string | null;
  antibiotico_01: string | null;
  acciones_medicamento_01: string | null;
  dias_terapia_01: number | null;
  antibiotico_02: string | null;
  acciones_medicamento_02: string | null;
  dias_terapia_02: number | null;
  observaciones: string | null;
}

interface ParsedEvaluationRow {
  sourceRowNumber: number;
  payload: EvaluationInsertRow;
  analyticsRow: Record<string, unknown>;
}

function normalizeHeader(header: unknown): string {
  return String(header ?? '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function buildColumnIndex(headers: unknown[]): Record<string, number> {
  const normalizedHeaders = headers.map(normalizeHeader);
  const index: Record<string, number> = {};

  for (const [dbColumn, synonyms] of Object.entries(COLUMN_MAP)) {
    for (const synonym of synonyms) {
      const position = normalizedHeaders.indexOf(synonym);
      if (position !== -1) {
        index[dbColumn] = position;
        break;
      }
    }
  }

  return index;
}

function cleanString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const cleaned = String(value).trim();
  if (cleaned === '') {
    return null;
  }

  return cleaned;
}

function parseInteger(value: unknown): number | null {
  const cleaned = cleanString(value);
  if (!cleaned) {
    return null;
  }

  const parsed = Number.parseInt(cleaned, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number' && value > 1000 && value < 100000) {
    return new Date(Math.round((value - 25569) * 86400 * 1000));
  }

  const raw = String(value).trim();
  const dayMonthYear = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dayMonthYear) {
    const date = new Date(
      Number.parseInt(dayMonthYear[3], 10),
      Number.parseInt(dayMonthYear[2], 10) - 1,
      Number.parseInt(dayMonthYear[1], 10),
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const yearMonthDay = raw.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (yearMonthDay) {
    const date = new Date(
      Number.parseInt(yearMonthDay[1], 10),
      Number.parseInt(yearMonthDay[2], 10) - 1,
      Number.parseInt(yearMonthDay[3], 10),
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function parseBool(value: unknown): boolean | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const normalized = String(value)
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (['si', 'yes', '1', 'true', 'x', 'aplica', 'positivo', 'checked'].includes(normalized)) {
    return true;
  }

  if (['no', '0', 'false', 'n/a', 'na', 'no aplica', 'negativo'].includes(normalized)) {
    return false;
  }

  return null;
}

function normalizeTipoIntervencion(value: unknown): string | null {
  const cleaned = cleanString(value);
  if (!cleaned) {
    return null;
  }

  const normalized = cleaned
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (['ic', 'interconsulta', 'inter-consulta', 'consulta'].some((token) => normalized.includes(token))) {
    return 'IC';
  }

  if (['proa', 'captacion', 'captada'].some((token) => normalized.includes(token))) {
    return 'PROA';
  }

  if (['rev', 'revalor', 'seguimiento', 'control'].some((token) => normalized.includes(token))) {
    return 'REV';
  }

  return cleaned;
}

function normalizeConducta(value: unknown): string | null {
  const cleaned = cleanString(value);
  if (!cleaned) {
    return null;
  }

  const normalized = cleaned
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized.includes('acort') || normalized.includes('reduc')) return 'Acortar días de tto';
  if (normalized.includes('desescal')) return 'Desescalonamiento';
  if (normalized.includes('suspens') || normalized.includes('suspend')) return 'Suspensión';
  if (normalized.includes('ajuste') || normalized.includes('dosis')) return 'Ajuste de dosis';
  if (normalized.includes('continu') || normalized.includes('mantener')) return 'Continuar esquema';

  return cleaned;
}

function inferirMesDeNombreArchivo(filename: string): { mes: number; anio: number } | null {
  const monthMap: Record<string, number> = {
    enero: 1,
    jan: 1,
    febrero: 2,
    feb: 2,
    marzo: 3,
    mar: 3,
    abril: 4,
    apr: 4,
    mayo: 5,
    junio: 6,
    jun: 6,
    julio: 7,
    jul: 7,
    agosto: 8,
    aug: 8,
    septiembre: 9,
    sep: 9,
    octubre: 10,
    oct: 10,
    noviembre: 11,
    nov: 11,
    diciembre: 12,
    dec: 12,
  };

  const normalized = filename
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const [name, number] of Object.entries(monthMap)) {
    if (normalized.includes(name)) {
      const yearMatch = filename.match(/20\d{2}/);
      return {
        mes: number,
        anio: yearMatch ? Number.parseInt(yearMatch[0], 10) : new Date().getFullYear(),
      };
    }
  }

  return null;
}

function parseSheetNameToYearMonth(name: string): { year: number; month: number } | null {
  const normalized = name.trim();
  const isoMatch = /^(\d{4})-(\d{2})$/.exec(normalized);
  if (isoMatch) {
    return { year: Number.parseInt(isoMatch[1], 10), month: Number.parseInt(isoMatch[2], 10) };
  }

  const lowered = normalized.toLowerCase();
  const words = lowered.split(/[\s\-_/]+/);
  let monthNumber: number | undefined;
  let year = new Date().getFullYear();

  for (const word of words) {
    if (SPANISH_MONTHS[word] !== undefined) {
      monthNumber = SPANISH_MONTHS[word];
    } else if (ENGLISH_MONTHS[word] !== undefined) {
      monthNumber = ENGLISH_MONTHS[word];
    } else if (/^\d{4}$/.test(word)) {
      year = Number.parseInt(word, 10);
    }
  }

  return monthNumber !== undefined ? { year, month: monthNumber } : null;
}

function parseDateToYearMonth(value: unknown): { year: number; month: number } | null {
  const parsed = parseDate(value);
  if (parsed) {
    return { year: parsed.getFullYear(), month: parsed.getMonth() + 1 };
  }

  const cleaned = cleanString(value);
  if (!cleaned) {
    return null;
  }

  const monthYear = /^(\d{1,2})\/(\d{4})$/.exec(cleaned);
  if (monthYear) {
    return { year: Number.parseInt(monthYear[2], 10), month: Number.parseInt(monthYear[1], 10) };
  }

  const normalized = cleaned.toLowerCase();
  const yearMatch = /(\d{4})/.exec(cleaned);
  const year = yearMatch ? Number.parseInt(yearMatch[1], 10) : new Date().getFullYear();
  const allMonths = { ...SPANISH_MONTHS, ...ENGLISH_MONTHS };

  for (const [monthName, monthNumber] of Object.entries(allMonths)) {
    if (normalized.includes(monthName)) {
      return { year, month: monthNumber };
    }
  }

  return null;
}

function topFrequent(map: Map<string, number>, limit: number): TopItem[] {
  return Array.from(map.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function calculateMetrics(rows: Record<string, unknown>[]): MonthMetrics {
  if (rows.length === 0) {
    return { totalRows: 0, columns: [], numericSummary: {}, topValues: {} };
  }

  const columns = Object.keys(rows[0]);
  const numericAccum: Record<string, { min: number; max: number; sum: number; count: number }> = {};
  const valueMaps: Record<string, Map<string, number>> = {};

  for (const column of columns) {
    valueMaps[column] = new Map();
  }

  for (const row of rows) {
    for (const column of columns) {
      const value = row[column];
      if (value === null || value === undefined || value === '') {
        continue;
      }

      if (typeof value === 'number' && !Number.isNaN(value)) {
        const accumulator = numericAccum[column];
        if (!accumulator) {
          numericAccum[column] = { min: value, max: value, sum: value, count: 1 };
        } else {
          accumulator.min = Math.min(accumulator.min, value);
          accumulator.max = Math.max(accumulator.max, value);
          accumulator.sum += value;
          accumulator.count += 1;
        }
        continue;
      }

      const stringValue = String(value).trim();
      if (stringValue) {
        valueMaps[column].set(stringValue, (valueMaps[column].get(stringValue) ?? 0) + 1);
      }
    }
  }

  const numericSummary: Record<string, NumericStats> = {};
  for (const [column, accumulator] of Object.entries(numericAccum)) {
    numericSummary[column] = {
      min: accumulator.min,
      max: accumulator.max,
      avg: accumulator.count > 0 ? accumulator.sum / accumulator.count : 0,
      sum: accumulator.sum,
    };
  }

  const topValues: Record<string, Array<{ value: string; count: number }>> = {};
  for (const column of columns) {
    const map = valueMaps[column];
    if (map.size > 0) {
      topValues[column] = Array.from(map.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));
    }
  }

  const metrics: MonthMetrics = {
    totalRows: rows.length,
    columns,
    numericSummary,
    topValues,
  };

  const antibioticColumn = columns.find((column) => /antibio[tc]ico|antibiotico_0[12]/i.test(column));
  if (antibioticColumn && valueMaps[antibioticColumn].size > 0) {
    metrics.topAntibiotics = topFrequent(valueMaps[antibioticColumn], 10);
  }

  const microorganismColumn = columns.find((column) => /microorganismo|bacteria|germen|organismo/i.test(column));
  if (microorganismColumn && valueMaps[microorganismColumn].size > 0) {
    metrics.topMicroorganisms = topFrequent(valueMaps[microorganismColumn], 10);
  }

  const serviceColumn = columns.find((column) => /^(servicio|area|ward|service)$/i.test(column.trim()));
  if (serviceColumn && valueMaps[serviceColumn].size > 0) {
    metrics.topServices = topFrequent(valueMaps[serviceColumn], 10);
  }

  const diagnosisColumn = columns.find((column) => /diagnostico|diagnosis/i.test(column));
  if (diagnosisColumn && valueMaps[diagnosisColumn].size > 0) {
    metrics.topDiagnoses = topFrequent(valueMaps[diagnosisColumn], 10);
  }

  const dddColumn = columns.find((column) => /^(ddd|dosis|dose)$/i.test(column.trim()));
  if (dddColumn && numericSummary[dddColumn]) {
    metrics.totalDDD = numericSummary[dddColumn].sum;
  }

  return metrics;
}

function buildEvaluationRows(
  rows: unknown[][],
  hospitalId: string,
  hospitalName: string,
  filename: string,
  uploadedBy: string,
): {
  parsedRows: ParsedEvaluationRow[];
  errores: RowError[];
  mesesDetectados: DetectedMonth[];
  monthlyDataMap: Map<string, Record<string, unknown>[]>;
} {
  if (rows.length < 2) {
    return {
      parsedRows: [],
      errores: [{ fila: 1, motivo: 'El archivo está vacío o sin datos' }],
      mesesDetectados: [],
      monthlyDataMap: new Map<string, Record<string, unknown>[]>(),
    };
  }

  const headers = rows[0] as unknown[];
  const dataRows = rows.slice(1);
  const columnIndex = buildColumnIndex(headers);
  const fallbackMonth = inferirMesDeNombreArchivo(filename);
  const errores: RowError[] = [];
  const parsedRows: ParsedEvaluationRow[] = [];
  const monthCount = new Map<string, number>();
  const monthlyDataMap = new Map<string, Record<string, unknown>[]>();

  for (let index = 0; index < dataRows.length; index += 1) {
    const row = dataRows[index];
    if (!row.some((cell) => cell !== null && cell !== '' && cell !== undefined)) {
      continue;
    }

    const getValue = (column: string): unknown => {
      const position = columnIndex[column];
      return position !== undefined ? row[position] : null;
    };

    const sourceRowNumber = index + 2;
    const parsedDate = parseDate(getValue('fecha'));
    const mes = parsedDate ? parsedDate.getMonth() + 1 : fallbackMonth?.mes ?? null;
    const anio = parsedDate ? parsedDate.getFullYear() : fallbackMonth?.anio ?? null;

    if (!mes || !anio) {
      errores.push({ fila: sourceRowNumber, motivo: 'No se pudo determinar mes/fecha' });
    }

    const isoDate = parsedDate ? toIsoDate(parsedDate) : null;
    const evaluationDate = isoDate ?? toIsoDate(new Date());

    const payload: EvaluationInsertRow = {
      hospital_id: hospitalId,
      hospital_name: hospitalName,
      created_by: uploadedBy,
      status: 'completada',
      evaluation_date: evaluationDate,
      fecha: isoDate,
      mes,
      anio,
      tipo_intervencion: normalizeTipoIntervencion(getValue('tipo_intervencion')),
      nombre_paciente: cleanString(getValue('nombre_paciente')),
      cedula: cleanString(getValue('cedula')),
      cama: cleanString(getValue('cama')),
      servicio: cleanString(getValue('servicio')),
      edad: parseInteger(getValue('edad')),
      cod_diagnostico: cleanString(getValue('cod_diagnostico')),
      diagnostico: cleanString(getValue('diagnostico')),
      iaas: parseBool(getValue('iaas')),
      tipo_iaas: cleanString(getValue('tipo_iaas')),
      aprobacion_terapia: parseBool(getValue('aprobacion_terapia')),
      causa_no_aprobacion: cleanString(getValue('causa_no_aprobacion')),
      combinacion_no_adecuada: parseBool(getValue('combinacion_no_adecuada')),
      extension_no_adecuada: parseBool(getValue('extension_no_adecuada')),
      ajuste_cultivo: parseBool(getValue('ajuste_cultivo')),
      dx_correlacionado: parseBool(getValue('dx_correlacionado')),
      terapia_empirica: parseBool(getValue('terapia_empirica')),
      cultivos_previos: parseBool(getValue('cultivos_previos')),
      conducta_general: normalizeConducta(getValue('conducta_general')),
      antibiotico_01: cleanString(getValue('antibiotico_01')),
      acciones_medicamento_01: cleanString(getValue('acciones_medicamento_01')),
      dias_terapia_01: parseInteger(getValue('dias_terapia_01')),
      antibiotico_02: cleanString(getValue('antibiotico_02')),
      acciones_medicamento_02: cleanString(getValue('acciones_medicamento_02')),
      dias_terapia_02: parseInteger(getValue('dias_terapia_02')),
      observaciones: cleanString(getValue('observaciones')),
    };

    parsedRows.push({
      sourceRowNumber,
      payload,
      analyticsRow: {
        fecha: payload.fecha,
        tipo_intervencion: payload.tipo_intervencion,
        nombre_paciente: payload.nombre_paciente,
        cedula: payload.cedula,
        cama: payload.cama,
        servicio: payload.servicio,
        edad: payload.edad,
        cod_diagnostico: payload.cod_diagnostico,
        diagnostico: payload.diagnostico,
        iaas: payload.iaas,
        tipo_iaas: payload.tipo_iaas,
        aprobacion_terapia: payload.aprobacion_terapia,
        causa_no_aprobacion: payload.causa_no_aprobacion,
        combinacion_no_adecuada: payload.combinacion_no_adecuada,
        extension_no_adecuada: payload.extension_no_adecuada,
        ajuste_cultivo: payload.ajuste_cultivo,
        dx_correlacionado: payload.dx_correlacionado,
        terapia_empirica: payload.terapia_empirica,
        cultivos_previos: payload.cultivos_previos,
        conducta_general: payload.conducta_general,
        antibiotico_01: payload.antibiotico_01,
        acciones_medicamento_01: payload.acciones_medicamento_01,
        dias_terapia_01: payload.dias_terapia_01,
        antibiotico_02: payload.antibiotico_02,
        acciones_medicamento_02: payload.acciones_medicamento_02,
        dias_terapia_02: payload.dias_terapia_02,
        observaciones: payload.observaciones,
        mes: payload.mes,
        anio: payload.anio,
      },
    });

    if (mes && anio) {
      const key = `${anio}-${mes}`;
      monthCount.set(key, (monthCount.get(key) ?? 0) + 1);
      const existingRows = monthlyDataMap.get(`${anio}-${String(mes).padStart(2, '0')}`) ?? [];
      existingRows.push(parsedRows[parsedRows.length - 1].analyticsRow);
      monthlyDataMap.set(`${anio}-${String(mes).padStart(2, '0')}`, existingRows);
    }
  }

  const mesesDetectados = Array.from(monthCount.entries())
    .map(([key, count]) => {
      const [anioValue, mesValue] = key.split('-').map((value) => Number.parseInt(value, 10));
      return {
        mes: mesValue,
        anio: anioValue,
        label: `${MESES_LABEL[mesValue - 1]} ${anioValue}`,
        count,
      };
    })
    .sort((left, right) => right.anio - left.anio || right.mes - left.mes);

  return { parsedRows, errores, mesesDetectados, monthlyDataMap };
}

async function insertEvaluaciones(
  parsedRows: ParsedEvaluationRow[],
): Promise<{ filasInsertadas: number; errores: RowError[] }> {
  const supabase = getSupabaseClient();
  const batchSize = 100;
  let filasInsertadas = 0;
  const errores: RowError[] = [];

  for (let index = 0; index < parsedRows.length; index += batchSize) {
    const batch = parsedRows.slice(index, index + batchSize);
    const { error } = await supabase.from('evaluaciones').insert(batch.map((row) => row.payload));

    if (error) {
      for (const row of batch) {
        errores.push({ fila: row.sourceRowNumber, motivo: error.message });
      }
    } else {
      filasInsertadas += batch.length;
    }
  }

  return { filasInsertadas, errores };
}

export async function processAndSaveExcel(
  hospitalId: string,
  file: File,
  uploadedBy: string,
): Promise<ProcessResult> {
  try {
    const supabase = getSupabaseClient();
    const { data: hospitalRow, error: hospitalError } = await supabase
      .from('hospitals')
      .select('name')
      .eq('id', hospitalId)
      .single();

    if (hospitalError || !hospitalRow?.name) {
      return {
        success: false,
        monthsFound: [],
        totalRows: 0,
        filasInsertadas: 0,
        filasConError: 0,
        mesesDetectados: [],
        errores: [],
        error: hospitalError?.message ?? 'No se pudo identificar el hospital para cargar el Excel.',
      };
    }

    const parsedInterventions = await parseInterventionFile(file);
    if (parsedInterventions.valid.length > 0) {
      const recordsWithHospital = parsedInterventions.valid.map((record) => ({
        ...record,
        hospitalName: hospitalRow.name,
      }));

      const { error: interventionsError } = await upsertInterventions(recordsWithHospital);
      if (interventionsError) {
        return {
          success: false,
          monthsFound: [],
          totalRows: 0,
          filasInsertadas: 0,
          filasConError: 0,
          mesesDetectados: [],
          errores: [],
          error: interventionsError,
        };
      }
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: null }) as unknown[][];

    if (rawRows.length < 2) {
      return {
        success: false,
        monthsFound: [],
        totalRows: 0,
        filasInsertadas: 0,
        filasConError: 0,
        mesesDetectados: [],
        errores: [{ fila: 1, motivo: 'El archivo está vacío o sin datos' }],
        error: 'El archivo está vacío o sin datos',
      };
    }

    const { parsedRows, errores: parsingErrors, mesesDetectados, monthlyDataMap } = buildEvaluationRows(
      rawRows,
      hospitalId,
      hospitalRow.name,
      file.name,
      uploadedBy,
    );

    if (parsedRows.length === 0) {
      return {
        success: false,
        monthsFound: [],
        totalRows: 0,
        filasInsertadas: 0,
        filasConError: parsingErrors.length,
        mesesDetectados,
        errores: parsingErrors,
        error: 'No se pudo procesar el archivo. Verifica el formato.',
      };
    }

    const { filasInsertadas, errores: insertErrors } = await insertEvaluaciones(parsedRows);
    const errores = [...parsingErrors, ...insertErrors];

    const inferredMonthlyDataMap = new Map<string, Record<string, unknown>[]>();
    if (monthlyDataMap.size === 0) {
      const sheetCandidates = workbook.SheetNames
        .map((name) => ({ name, parsed: parseSheetNameToYearMonth(name) }))
        .filter((entry) => entry.parsed !== null);

      if (sheetCandidates.length > 0) {
        for (const entry of sheetCandidates) {
          if (!entry.parsed) {
            continue;
          }

          const monthKey = `${entry.parsed.year}-${String(entry.parsed.month).padStart(2, '0')}`;
          const sheetRows = XLSX.utils.sheet_to_json(workbook.Sheets[entry.name], { defval: null }) as Record<string, unknown>[];
          inferredMonthlyDataMap.set(monthKey, sheetRows);
        }
      } else {
        const allRows = XLSX.utils.sheet_to_json(firstSheet, { defval: null }) as Record<string, unknown>[];
        if (allRows.length > 0) {
          const dateColumn = Object.keys(allRows[0]).find((column) => /^(mes|month|fecha|date|periodo|per[ií]odo)$/i.test(column.trim()));
          if (dateColumn) {
            for (const row of allRows) {
              const yearMonth = parseDateToYearMonth(row[dateColumn]);
              if (!yearMonth) {
                continue;
              }

              const monthKey = `${yearMonth.year}-${String(yearMonth.month).padStart(2, '0')}`;
              const existingRows = inferredMonthlyDataMap.get(monthKey) ?? [];
              existingRows.push(row);
              inferredMonthlyDataMap.set(monthKey, existingRows);
            }
          }
        }
      }
    }

    const metricsSource = monthlyDataMap.size > 0 ? monthlyDataMap : inferredMonthlyDataMap;
    const monthlyData: Array<{ month: string; monthLabel: string; metrics: MonthMetrics; rowCount: number }> = [];
    for (const [month, rows] of metricsSource.entries()) {
      const [yearValue, monthValue] = month.split('-').map((value) => Number.parseInt(value, 10));
      monthlyData.push({
        month,
        monthLabel: `${MONTH_LABELS[monthValue] ?? String(monthValue)} ${yearValue}`,
        metrics: calculateMetrics(rows),
        rowCount: rows.length,
      });
    }

    monthlyData.sort((left, right) => left.month.localeCompare(right.month));
    const monthsFound = monthlyData.map((item) => item.month);
    const latestMonth = monthlyData[monthlyData.length - 1] ?? mesesDetectados[0] ?? null;

    let uploadId: string | null = null;
    const { data: upload, error: uploadError } = await supabase
      .from('hospital_excel_uploads')
      .insert({
        hospital_id: hospitalId,
        user_id: uploadedBy,
        filename: file.name,
        periodo: latestMonth ? ('monthLabel' in latestMonth ? latestMonth.monthLabel : latestMonth.label) : null,
        mes: latestMonth ? ('month' in latestMonth ? Number.parseInt(latestMonth.month.split('-')[1], 10) : latestMonth.mes) : null,
        anio: latestMonth ? ('month' in latestMonth ? Number.parseInt(latestMonth.month.split('-')[0], 10) : latestMonth.anio) : null,
        total_filas: parsedRows.length,
        filas_validas: filasInsertadas,
        filas_error: errores.length,
        estado: 'completado',
        errores,
      })
      .select('id')
      .single();

    if (!uploadError && upload) {
      uploadId = (upload as InsertedUploadRow).id;
    }

    for (const monthData of monthlyData) {
      await supabase.from('hospital_monthly_metrics').upsert(
        {
          hospital_id: hospitalId,
          upload_id: uploadId,
          month: monthData.month,
          month_label: monthData.monthLabel,
          metrics: monthData.metrics,
          row_count: monthData.rowCount,
        },
        { onConflict: 'hospital_id,month' },
      );
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('infectus:data-updated'));
    }

    return {
      success: filasInsertadas > 0,
      monthsFound,
      totalRows: parsedRows.length,
      filasInsertadas,
      filasConError: errores.length,
      mesesDetectados,
      errores,
      error: filasInsertadas === 0 ? 'No se pudo procesar el archivo. Verifica el formato.' : undefined,
    };
  } catch (error) {
    return {
      success: false,
      monthsFound: [],
      totalRows: 0,
      filasInsertadas: 0,
      filasConError: 0,
      mesesDetectados: [],
      errores: [],
      error: error instanceof Error ? error.message : 'Error desconocido al procesar el archivo',
    };
  }
}
