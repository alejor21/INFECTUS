import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import * as XLSX from 'xlsx';
import {
  ArrowDownUp,
  ClipboardList,
  Download,
  FileSpreadsheet,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import { useHospitalContext } from '../../contexts/HospitalContext';
import { SPANISH_MONTH_NAMES } from '../../lib/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProaRow {
  id: string;
  mes: number;
  servicio: string;
  historiaClinica: string;
  tipoCaptacion: string;
  conducta: string;
  escalamiento: boolean;
  desescalamiento: boolean;
  cambioViaOral: boolean;
  acortarDias: boolean;
  suspension: boolean;
  ajusteDosis: boolean;
  adherencia: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICIOS = [
  'UCI',
  'Urgencias',
  'Hospitalización Quirúrgica',
  'Hospitalización Médica',
  'Ginecología',
  'Pediatría',
] as const;

const TIPOS_CAPTACION = ['PROA', 'Interconsulta', 'Revaluación'] as const;

const CHART_BARS = [
  { key: 'escalamiento', label: 'Escalamiento', color: '#1E6091' },
  { key: 'desescalamiento', label: 'Desescalamiento', color: '#0D9488' },
  { key: 'cambioViaOral', label: 'Cambio Vía Oral', color: '#059669' },
  { key: 'acortarDias', label: 'Acortar días', color: '#D97706' },
  { key: 'suspension', label: 'Suspensión', color: '#DC2626' },
  { key: 'ajusteDosis', label: 'Ajuste de dosis', color: '#7C3AED' },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptyRow(): ProaRow {
  return {
    id: generateId(),
    mes: new Date().getMonth() + 1,
    servicio: '',
    historiaClinica: '',
    tipoCaptacion: '',
    conducta: '',
    escalamiento: false,
    desescalamiento: false,
    cambioViaOral: false,
    acortarDias: false,
    suspension: false,
    ajusteDosis: false,
    adherencia: '',
  };
}

function loadFromStorage(key: string): ProaRow[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [createEmptyRow()];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as ProaRow[];
    return [createEmptyRow()];
  } catch {
    return [createEmptyRow()];
  }
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  accent?: 'teal' | 'blue' | 'green' | 'amber' | 'violet';
}

function SummaryCard({ label, value, subtitle, accent = 'teal' }: SummaryCardProps) {
  const accentClasses: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300',
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </p>
      <div className={`mt-3 inline-flex rounded-xl px-3 py-1.5 text-3xl font-bold ${accentClasses[accent]}`}>
        {value}
      </div>
      {subtitle ? (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      ) : null}
    </div>
  );
}

// ─── Checkbox Cell ─────────────────────────────────────────────────────────────

interface CheckboxCellProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function CheckboxCell({ checked, onChange }: CheckboxCellProps) {
  return (
    <div className="flex items-center justify-center">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`flex h-6 w-6 min-h-[24px] items-center justify-center rounded border-2 transition-colors ${
          checked
            ? 'border-teal-600 bg-teal-600 text-white dark:border-teal-500 dark:bg-teal-500'
            : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
        }`}
        aria-checked={checked}
        role="checkbox"
        aria-label={checked ? '1' : 'vacío'}
      >
        {checked ? (
          <span className="text-xs font-bold leading-none">1</span>
        ) : null}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PlantillaPROA() {
  const { selectedHospitalObj } = useHospitalContext();

  const storageKey = `plantilla-proa-${selectedHospitalObj?.id ?? 'global'}`;

  const [rows, setRows] = useState<ProaRow[]>(() => loadFromStorage(storageKey));

  // Reload when hospital changes
  useEffect(() => {
    setRows(loadFromStorage(storageKey));
  }, [storageKey]);

  // Auto-save to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(rows));
    } catch {
      // Storage quota exceeded — silently ignore
    }
  }, [rows, storageKey]);

  const updateRow = useCallback(
    (id: string, field: keyof ProaRow, value: string | boolean | number) => {
      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
      );
    },
    [],
  );

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, createEmptyRow()]);
  }, []);

  const deleteRow = useCallback((id: string) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev.map(() => createEmptyRow());
      return prev.filter((row) => row.id !== id);
    });
  }, []);

  // ─── Indicators ─────────────────────────────────────────────────────────────

  const indicators = useMemo(() => {
    const total = rows.length;
    const captadasPROA = rows.filter((r) => r.tipoCaptacion === 'PROA').length;
    const interconsultas = rows.filter((r) => r.tipoCaptacion === 'Interconsulta').length;
    const adherentes = rows.filter((r) => r.adherencia === 'Sí').length;
    const withAdherencia = rows.filter((r) => r.adherencia !== '').length;
    const desescalados = rows.filter((r) => r.desescalamiento).length;
    const cambioVO = rows.filter((r) => r.cambioViaOral).length;

    return {
      total,
      pctPROA: total > 0 ? Math.round((captadasPROA / total) * 100) : 0,
      pctInterconsultas: total > 0 ? Math.round((interconsultas / total) * 100) : 0,
      pctAdherencia: withAdherencia > 0 ? Math.round((adherentes / withAdherencia) * 100) : 0,
      pctDesescalamiento: total > 0 ? Math.round((desescalados / total) * 100) : 0,
      pctCambioVO: total > 0 ? Math.round((cambioVO / total) * 100) : 0,
    };
  }, [rows]);

  // ─── Chart Data ──────────────────────────────────────────────────────────────

  const chartData = useMemo(() => {
    return SPANISH_MONTH_NAMES.map((name, index) => {
      const monthRows = rows.filter((r) => r.mes === index + 1);
      return {
        mes: name.slice(0, 3),
        escalamiento: monthRows.filter((r) => r.escalamiento).length,
        desescalamiento: monthRows.filter((r) => r.desescalamiento).length,
        cambioViaOral: monthRows.filter((r) => r.cambioViaOral).length,
        acortarDias: monthRows.filter((r) => r.acortarDias).length,
        suspension: monthRows.filter((r) => r.suspension).length,
        ajusteDosis: monthRows.filter((r) => r.ajusteDosis).length,
      };
    });
  }, [rows]);

  const chartHasData = useMemo(
    () => chartData.some((d) => CHART_BARS.some((b) => (d as Record<string, number>)[b.key] > 0)),
    [chartData],
  );

  // ─── Excel Export ─────────────────────────────────────────────────────────────

  const handleExportExcel = useCallback(() => {
    const exportData = rows.map((row, index) => ({
      'N°': index + 1,
      Mes: SPANISH_MONTH_NAMES[row.mes - 1],
      Servicio: row.servicio,
      'Historia Clínica': row.historiaClinica,
      'Tipo de Captación': row.tipoCaptacion,
      'Conducta / Intervención': row.conducta,
      Escalamiento: row.escalamiento ? '1' : '',
      Desescalamiento: row.desescalamiento ? '1' : '',
      'Cambio a Vía Oral': row.cambioViaOral ? '1' : '',
      'Acortar días de tto': row.acortarDias ? '1' : '',
      Suspensión: row.suspension ? '1' : '',
      'Ajuste de dosis': row.ajusteDosis ? '1' : '',
      Adherencia: row.adherencia,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);

    // Column widths
    ws['!cols'] = [
      { wch: 5 },   // N°
      { wch: 12 },  // Mes
      { wch: 28 },  // Servicio
      { wch: 22 },  // Historia Clínica
      { wch: 18 },  // Tipo de Captación
      { wch: 30 },  // Conducta
      { wch: 15 },  // Escalamiento
      { wch: 16 },  // Desescalamiento
      { wch: 18 },  // Cambio a Vía Oral
      { wch: 18 },  // Acortar días de tto
      { wch: 12 },  // Suspensión
      { wch: 16 },  // Ajuste de dosis
      { wch: 12 },  // Adherencia
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla PROA');

    const hospitalName = (selectedHospitalObj?.name ?? 'Hospital').replace(/\s+/g, '_');
    XLSX.writeFile(wb, `Plantilla_PROA_${hospitalName}.xlsx`);
  }, [rows, selectedHospitalObj]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Registro PROA</h1>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {selectedHospitalObj
                  ? `${selectedHospitalObj.name} — registro de intervenciones por mes`
                  : 'Selecciona un hospital para filtrar los datos guardados'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Exportar a Excel
          </button>
        </div>
      </div>

      {/* Summary Indicator Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          label="Total intervenciones"
          value={indicators.total}
          subtitle="n registros"
          accent="teal"
        />
        <SummaryCard
          label="% Captadas PROA"
          value={`${indicators.pctPROA}%`}
          subtitle="sobre total"
          accent="blue"
        />
        <SummaryCard
          label="% Interconsultas"
          value={`${indicators.pctInterconsultas}%`}
          subtitle="sobre total"
          accent="violet"
        />
        <SummaryCard
          label="% Adherencia"
          value={`${indicators.pctAdherencia}%`}
          subtitle="de los evaluados"
          accent="green"
        />
        <SummaryCard
          label="% Desescalamiento"
          value={`${indicators.pctDesescalamiento}%`}
          subtitle="sobre total"
          accent="amber"
        />
        <SummaryCard
          label="% Cambio vía oral"
          value={`${indicators.pctCambioVO}%`}
          subtitle="sobre total"
          accent="green"
        />
      </div>

      {/* Data Entry Table */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <ArrowDownUp className="h-4 w-4 text-teal-600" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Tabla de registro
            </h2>
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
              {rows.length} filas
            </span>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            <PlusCircle className="h-4 w-4" />
            Agregar fila
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  N°
                </th>
                <th className="min-w-[130px] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Mes
                </th>
                <th className="min-w-[200px] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Servicio
                </th>
                <th className="min-w-[160px] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Historia Clínica
                </th>
                <th className="min-w-[160px] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Tipo Captación
                </th>
                <th className="min-w-[200px] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Conducta / Intervención
                </th>
                {/* Boolean columns */}
                <th className="w-[80px] px-2 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Escal.
                </th>
                <th className="w-[90px] px-2 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Desescal.
                </th>
                <th className="w-[90px] px-2 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Vía Oral
                </th>
                <th className="w-[90px] px-2 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Acortar tto
                </th>
                <th className="w-[80px] px-2 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Suspens.
                </th>
                <th className="w-[90px] px-2 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Aj. dosis
                </th>
                <th className="min-w-[110px] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Adherencia
                </th>
                <th className="w-[50px] px-2 py-3" aria-label="Acciones" />
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/30"
                >
                  {/* N° */}
                  <td className="px-3 py-2 text-sm font-medium text-gray-400 dark:text-gray-500">
                    {index + 1}
                  </td>

                  {/* Mes */}
                  <td className="px-3 py-2">
                    <select
                      value={row.mes}
                      onChange={(e) => updateRow(row.id, 'mes', Number(e.target.value))}
                      className="min-h-[36px] w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    >
                      {SPANISH_MONTH_NAMES.map((name, i) => (
                        <option key={name} value={i + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Servicio */}
                  <td className="px-3 py-2">
                    <select
                      value={row.servicio}
                      onChange={(e) => updateRow(row.id, 'servicio', e.target.value)}
                      className="min-h-[36px] w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="">Seleccionar...</option>
                      {SERVICIOS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Historia Clínica */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.historiaClinica}
                      onChange={(e) => updateRow(row.id, 'historiaClinica', e.target.value)}
                      placeholder="N° historia"
                      className="min-h-[36px] w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                    />
                  </td>

                  {/* Tipo de Captación */}
                  <td className="px-3 py-2">
                    <select
                      value={row.tipoCaptacion}
                      onChange={(e) => updateRow(row.id, 'tipoCaptacion', e.target.value)}
                      className="min-h-[36px] w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="">Seleccionar...</option>
                      {TIPOS_CAPTACION.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Conducta */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.conducta}
                      onChange={(e) => updateRow(row.id, 'conducta', e.target.value)}
                      placeholder="Describir conducta..."
                      className="min-h-[36px] w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                    />
                  </td>

                  {/* Boolean checkboxes */}
                  <td className="px-2 py-2">
                    <CheckboxCell
                      checked={row.escalamiento}
                      onChange={(v) => updateRow(row.id, 'escalamiento', v)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <CheckboxCell
                      checked={row.desescalamiento}
                      onChange={(v) => updateRow(row.id, 'desescalamiento', v)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <CheckboxCell
                      checked={row.cambioViaOral}
                      onChange={(v) => updateRow(row.id, 'cambioViaOral', v)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <CheckboxCell
                      checked={row.acortarDias}
                      onChange={(v) => updateRow(row.id, 'acortarDias', v)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <CheckboxCell
                      checked={row.suspension}
                      onChange={(v) => updateRow(row.id, 'suspension', v)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <CheckboxCell
                      checked={row.ajusteDosis}
                      onChange={(v) => updateRow(row.id, 'ajusteDosis', v)}
                    />
                  </td>

                  {/* Adherencia */}
                  <td className="px-3 py-2">
                    <select
                      value={row.adherencia}
                      onChange={(e) => updateRow(row.id, 'adherencia', e.target.value)}
                      className="min-h-[36px] w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="">—</option>
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </td>

                  {/* Delete */}
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => deleteRow(row.id)}
                      className="flex h-8 w-8 min-h-[32px] items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      aria-label="Eliminar fila"
                      title="Eliminar fila"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Los datos se guardan automáticamente en este dispositivo
          </p>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:border-teal-400 hover:text-teal-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-teal-600 dark:hover:text-teal-400"
          >
            <PlusCircle className="h-4 w-4" />
            Agregar fila
          </button>
        </div>
      </div>

      {/* Monthly Grouped Bar Chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Intervenciones por mes
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Número de intervenciones por tipo en cada mes del año
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            title="Exportar datos a Excel"
          >
            <Download className="h-4 w-4" />
            Excel
          </button>
        </div>

        {chartHasData ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
                <XAxis
                  dataKey="mes"
                  stroke="#6B7280"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#6B7280"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    fontSize: '13px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} caso${value !== 1 ? 's' : ''}`,
                    name,
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
                  formatter={(value) => (
                    <span className="text-gray-600 dark:text-gray-400">{value}</span>
                  )}
                />
                {CHART_BARS.map((bar) => (
                  <Bar
                    key={bar.key}
                    dataKey={bar.key}
                    name={bar.label}
                    fill={bar.color}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={14}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-80 flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
              <BarChart className="h-8 w-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Sin datos para graficar
            </p>
            <p className="max-w-xs text-xs text-gray-400 dark:text-gray-500">
              Marca al menos una intervención en la tabla de arriba para ver la gráfica
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
