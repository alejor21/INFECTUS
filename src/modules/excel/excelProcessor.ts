import * as XLSX from 'xlsx';
import { getSupabaseClient } from '../../lib/supabase/client';
import { parseInterventionFile } from '../../lib/parsers/excelParser';
import { upsertInterventions } from '../../lib/supabase/queries/interventions';

// ─── Month name lookup tables ──────────────────────────────────────────────

const SPANISH_MONTHS: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

const ENGLISH_MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8,
  sep: 9, oct: 10, nov: 11, dec: 12,
};

const MONTH_LABELS: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
  7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

// ─── Public types ──────────────────────────────────────────────────────────

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
  month: string;       // '2025-01'
  month_label: string; // 'Enero 2025'
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

export interface ProcessResult {
  success: boolean;
  monthsFound: string[];
  totalRows: number;
  error?: string;
}

interface InsertedUploadRow {
  id: string;
}

// ─── Private helpers ───────────────────────────────────────────────────────

function parseSheetNameToYearMonth(name: string): { year: number; month: number } | null {
  const norm = name.trim();
  // ISO: 2025-01
  const isoMatch = /^(\d{4})-(\d{2})$/.exec(norm);
  if (isoMatch) return { year: parseInt(isoMatch[1]), month: parseInt(isoMatch[2]) };

  const lower = norm.toLowerCase();
  const words = lower.split(/[\s\-_/]+/);
  let monthNum: number | undefined;
  let year = new Date().getFullYear();

  for (const word of words) {
    if (SPANISH_MONTHS[word] !== undefined) {
      monthNum = SPANISH_MONTHS[word];
    } else if (ENGLISH_MONTHS[word] !== undefined) {
      monthNum = ENGLISH_MONTHS[word];
    } else if (/^\d{4}$/.test(word)) {
      year = parseInt(word);
    }
  }
  return monthNum !== undefined ? { year, month: monthNum } : null;
}

function parseDateToYearMonth(value: unknown): { year: number; month: number } | null {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date) {
    return { year: value.getFullYear(), month: value.getMonth() + 1 };
  }

  const str = String(value).trim();
  // DD/MM/YYYY
  const ddmm = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(str);
  if (ddmm) return { year: parseInt(ddmm[3]), month: parseInt(ddmm[2]) };
  // YYYY-MM-DD
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  if (iso) return { year: parseInt(iso[1]), month: parseInt(iso[2]) };
  // MM/YYYY
  const mmyy = /^(\d{1,2})\/(\d{4})$/.exec(str);
  if (mmyy) return { year: parseInt(mmyy[2]), month: parseInt(mmyy[1]) };

  // Text month
  const lower = str.toLowerCase();
  const yearMatch = /(\d{4})/.exec(str);
  const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
  const allMonths = { ...SPANISH_MONTHS, ...ENGLISH_MONTHS };
  for (const [monthName, num] of Object.entries(allMonths)) {
    if (lower.includes(monthName)) return { year, month: num };
  }
  return null;
}

function topFrequent(map: Map<string, number>, limit: number): TopItem[] {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
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

  for (const col of columns) {
    valueMaps[col] = new Map();
  }

  for (const row of rows) {
    for (const col of columns) {
      const val = row[col];
      if (val === null || val === undefined || val === '') continue;
      if (typeof val === 'number' && !isNaN(val)) {
        const acc = numericAccum[col];
        if (!acc) {
          numericAccum[col] = { min: val, max: val, sum: val, count: 1 };
        } else {
          acc.min = Math.min(acc.min, val);
          acc.max = Math.max(acc.max, val);
          acc.sum += val;
          acc.count += 1;
        }
      } else {
        const strVal = String(val).trim();
        if (strVal) {
          valueMaps[col].set(strVal, (valueMaps[col].get(strVal) ?? 0) + 1);
        }
      }
    }
  }

  const numericSummary: Record<string, NumericStats> = {};
  for (const [col, acc] of Object.entries(numericAccum)) {
    numericSummary[col] = {
      min: acc.min,
      max: acc.max,
      avg: acc.count > 0 ? acc.sum / acc.count : 0,
      sum: acc.sum,
    };
  }

  const topValues: Record<string, Array<{ value: string; count: number }>> = {};
  for (const col of columns) {
    const map = valueMaps[col];
    if (map.size > 0) {
      topValues[col] = Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));
    }
  }

  const metrics: MonthMetrics = { totalRows: rows.length, columns, numericSummary, topValues };

  // Domain-specific columns
  const antibioticCol = columns.find((c) => /antibio[tc]ico|antibiotico_0[12]/i.test(c));
  if (antibioticCol && valueMaps[antibioticCol].size > 0) {
    metrics.topAntibiotics = topFrequent(valueMaps[antibioticCol], 10);
  }

  const microCol = columns.find((c) => /microorganismo|bacteria|germen|organismo/i.test(c));
  if (microCol && valueMaps[microCol].size > 0) {
    metrics.topMicroorganisms = topFrequent(valueMaps[microCol], 10);
  }

  const serviceCol = columns.find((c) => /^(servicio|área|area|ward|service)$/i.test(c.trim()));
  if (serviceCol && valueMaps[serviceCol].size > 0) {
    metrics.topServices = topFrequent(valueMaps[serviceCol], 10);
  }

  const diagCol = columns.find((c) => /diagnostico|diagnóstico|diagnosis/i.test(c));
  if (diagCol && valueMaps[diagCol].size > 0) {
    metrics.topDiagnoses = topFrequent(valueMaps[diagCol], 10);
  }

  const dddCol = columns.find((c) => /^(ddd|dosis|dose)$/i.test(c.trim()));
  if (dddCol && numericSummary[dddCol]) {
    metrics.totalDDD = numericSummary[dddCol].sum;
  }

  return metrics;
}

// ─── Public: main processor ─────────────────────────────────────────────────

export async function processAndSaveExcel(
  hospitalId: string,
  file: File,
  uploadedBy: string,
): Promise<ProcessResult> {
  try {
    const parsedInterventions = await parseInterventionFile(file);
    if (parsedInterventions.valid.length === 0) {
      return {
        success: false,
        monthsFound: [],
        totalRows: 0,
        error: parsedInterventions.errors[0]?.message ?? 'Sin registros validos para cargar.',
      };
    }

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
        error: hospitalError?.message ?? 'No se pudo identificar el hospital para cargar el Excel.',
      };
    }

    const recordsWithHospital = parsedInterventions.valid.map((record) => ({
      ...record,
      hospitalName: hospitalRow.name,
    }));

    const { inserted, error: interventionsError } = await upsertInterventions(recordsWithHospital);
    if (interventionsError) {
      return {
        success: false,
        monthsFound: [],
        totalRows: 0,
        error: interventionsError,
      };
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

    const monthlyDataMap = new Map<string, Record<string, unknown>[]>();
    let strategy = 'single' as 'sheets' | 'date-column' | 'single';

    // ── Strategy A: multiple sheets with month names ──────────────────────
    if (workbook.SheetNames.length > 1) {
      const monthSheets = workbook.SheetNames
        .map((name) => ({ name, parsed: parseSheetNameToYearMonth(name) }))
        .filter((s) => s.parsed !== null);

      if (monthSheets.length > 0) {
        strategy = 'sheets';
        for (const { name, parsed } of monthSheets) {
          if (!parsed) continue;
          const key = `${parsed.year}-${String(parsed.month).padStart(2, '0')}`;
          const sheet = workbook.Sheets[name];
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<string, unknown>[];
          monthlyDataMap.set(key, rows);
        }
      }
    }

    // ── Strategy B / C: single sheet ─────────────────────────────────────
    if (monthlyDataMap.size === 0) {
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const allRows = XLSX.utils.sheet_to_json(firstSheet, { defval: null }) as Record<string, unknown>[];

      if (allRows.length === 0) {
        return { success: false, monthsFound: [], totalRows: 0, error: 'El archivo está vacío' };
      }

      const firstRowCols = Object.keys(allRows[0]);
      const dateCol = firstRowCols.find((c) =>
        /^(mes|month|fecha|date|periodo|período)$/i.test(c.trim()),
      );

      if (dateCol) {
        // Strategy B: date / month column
        strategy = 'date-column';
        for (const row of allRows) {
          const ym = parseDateToYearMonth(row[dateCol]);
          if (ym) {
            const key = `${ym.year}-${String(ym.month).padStart(2, '0')}`;
            const existing = monthlyDataMap.get(key) ?? [];
            existing.push(row);
            monthlyDataMap.set(key, existing);
          }
        }
        // If date parsing yielded nothing, fall back to single
        if (monthlyDataMap.size === 0) {
          strategy = 'single';
          const now = new Date();
          const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          monthlyDataMap.set(key, allRows);
        }
      } else {
        // Strategy C: no date/month column — use current month
        strategy = 'single';
        const now = new Date();
        const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        monthlyDataMap.set(key, allRows);
      }
    }

    // ── Build per-month payload ───────────────────────────────────────────
    const monthsFound: string[] = [];
    let totalRows = 0;
    const monthlyData: Array<{
      month: string;
      monthLabel: string;
      metrics: MonthMetrics;
      rowCount: number;
    }> = [];

    for (const [month, rows] of monthlyDataMap.entries()) {
      const parts = month.split('-').map(Number);
      const y = parts[0];
      const m = parts[1];
      const monthLabel = `${MONTH_LABELS[m] ?? String(m)} ${y}`;
      const metrics = calculateMetrics(rows);
      monthsFound.push(month);
      totalRows += rows.length;
      monthlyData.push({ month, monthLabel, metrics, rowCount: rows.length });
    }
    monthsFound.sort();

    // ── Persist to Supabase ───────────────────────────────────────────────
    const latestMonth = monthlyData[monthlyData.length - 1] ?? null;
    const latestMonthParts = latestMonth?.month.split('-') ?? [];
    const latestYear = latestMonthParts.length === 2 ? Number(latestMonthParts[0]) : null;
    const latestMonthNumber = latestMonthParts.length === 2 ? Number(latestMonthParts[1]) : null;

    let uploadId: string | null = null;

    const { data: upload, error: uploadError } = await supabase
      .from('hospital_excel_uploads')
      .insert({
        hospital_id: hospitalId,
        user_id: uploadedBy,
        filename: file.name,
        periodo: latestMonth?.monthLabel ?? null,
        mes: latestMonthNumber,
        anio: latestYear,
        total_filas: totalRows,
        filas_validas: inserted,
        filas_error: parsedInterventions.summary.errorRows,
        estado: 'completado',
        errores: parsedInterventions.errors,
      })
      .select('id')
      .single();

    if (!uploadError && upload) {
      uploadId = (upload as InsertedUploadRow).id;
    }

    for (const { month, monthLabel, metrics, rowCount } of monthlyData) {
      await supabase
        .from('hospital_monthly_metrics')
        .upsert(
          {
            hospital_id: hospitalId,
            upload_id: uploadId,
            month,
            month_label: monthLabel,
            metrics,
            row_count: rowCount,
          },
          { onConflict: 'hospital_id,month' },
        );
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('infectus:data-updated'));
    }

    return { success: true, monthsFound, totalRows };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido al procesar el archivo';
    return { success: false, monthsFound: [], totalRows: 0, error: message };
  }
}
