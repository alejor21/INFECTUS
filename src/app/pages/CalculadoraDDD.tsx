import { useState, useMemo, useEffect } from 'react';
import { Building2, Plus, Trash2, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useHospitalContext } from '../../contexts/HospitalContext';

// ─── OMS/WHO Standard DDD values ─────────────────────────────────────────────

const OMS_DDD_TABLE: Record<string, { ddd: number; unit: string }> = {
  'Amoxicilina':                 { ddd: 1.5,  unit: 'g' },
  'Amoxicilina/Clavulanato':     { ddd: 1.5,  unit: 'g' },
  'Ampicilina':                  { ddd: 2,    unit: 'g' },
  'Piperacilina/Tazobactam':     { ddd: 14,   unit: 'g' },
  'Ceftriaxona':                 { ddd: 2,    unit: 'g' },
  'Cefazolina':                  { ddd: 3,    unit: 'g' },
  'Cefepime':                    { ddd: 2,    unit: 'g' },
  'Meropenem':                   { ddd: 2,    unit: 'g' },
  'Imipenem':                    { ddd: 2,    unit: 'g' },
  'Ertapenem':                   { ddd: 1,    unit: 'g' },
  'Vancomicina':                 { ddd: 2,    unit: 'g' },
  'Clindamicina':                { ddd: 1.8,  unit: 'g' },
  'Metronidazol':                { ddd: 1.5,  unit: 'g' },
  'Ciprofloxacina':              { ddd: 1,    unit: 'g' },
  'Levofloxacina':               { ddd: 0.5,  unit: 'g' },
  'Azitromicina':                { ddd: 0.3,  unit: 'g' },
  'Claritromicina':              { ddd: 0.5,  unit: 'g' },
  'Trimetoprim/Sulfametoxazol':  { ddd: 1.92, unit: 'g' },
  'Fluconazol':                  { ddd: 0.2,  unit: 'g' },
  'Linezolid':                   { ddd: 1.2,  unit: 'g' },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type DddCategory = 'alto' | 'medio' | 'bajo';

interface DddTableRow {
  id: string;
  antibiotic: string;
  totalDoses: number;
  estimatedGrams: number | null;
  omsDDD: number | null;
  hasOmsEntry: boolean;
  dddValue: number;
  category: DddCategory;
  isManual: boolean;
}

interface ManualEntry {
  id: string;
  antibiotic: string;
  totalGrams: number;
  omsDDD: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function categorize(value: number): DddCategory {
  if (value > 10) return 'alto';
  if (value >= 5) return 'medio';
  return 'bajo';
}

function CategoryBadge({ category }: { category: DddCategory }) {
  const map: Record<DddCategory, string> = {
    alto:  'bg-red-100 text-red-700',
    medio: 'bg-amber-100 text-amber-700',
    bajo:  'bg-green-100 text-green-700',
  };
  const labels: Record<DddCategory, string> = {
    alto: 'Alto', medio: 'Medio', bajo: 'Bajo',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${map[category]}`}>
      {labels[category]}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CalculadoraDDD() {
  const navigate = useNavigate();
  const { selectedHospitalObj, records } = useHospitalContext();

  // ── Config state ─────────────────────────────────────────────────────────
  const [beds, setBeds] = useState<string>(
    selectedHospitalObj?.beds != null ? String(selectedHospitalObj.beds) : '',
  );
  const [periodDays, setPeriodDays] = useState<string>('30');

  // Sync beds when hospital changes
  useEffect(() => {
    if (selectedHospitalObj?.beds != null) {
      setBeds(String(selectedHospitalObj.beds));
    }
  }, [selectedHospitalObj]);

  // ── Custom DDD inputs (for antibiotics not in OMS table) ─────────────────
  const [customDDDs, setCustomDDDs] = useState<Record<string, string>>({});

  // ── Manual entries added to table ─────────────────────────────────────────
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([]);

  // ── Manual calculator state ───────────────────────────────────────────────
  const [manAbInput, setManAbInput] = useState('');
  const [manGrams, setManGrams] = useState('');
  const [manDDDInput, setManDDDInput] = useState('');

  // Auto-fill DDD when antibiotic matches OMS table
  useEffect(() => {
    const entry = OMS_DDD_TABLE[manAbInput.trim()];
    if (entry) setManDDDInput(String(entry.ddd));
  }, [manAbInput]);

  // ── Computed values ────────────────────────────────────────────────────────

  const bedsNum = Math.max(parseInt(beds, 10) || 1, 1);
  const daysNum = Math.max(parseInt(periodDays, 10) || 30, 1);

  // Raw antibiotic data from records
  const antibioticDataMap = useMemo(() => {
    const map = new Map<string, { totalDoses: number }>();
    for (const r of records) {
      const ab = (r.antibiotico01 ?? '').trim();
      if (!ab) continue;
      const existing = map.get(ab) ?? { totalDoses: 0 };
      existing.totalDoses += 1;
      map.set(ab, existing);
    }
    return map;
  }, [records]);

  // Combined table rows (auto + manual), sorted by DDD desc
  const tableRows = useMemo((): DddTableRow[] => {
    const auto: DddTableRow[] = [];
    for (const [ab, data] of antibioticDataMap) {
      const omsEntry = OMS_DDD_TABLE[ab];
      const customRaw = customDDDs[ab];
      const customDDD = customRaw ? parseFloat(customRaw) : null;
      const effectiveDDD = omsEntry?.ddd ?? (customDDD !== null && !isNaN(customDDD) ? customDDD : null);
      const estimatedGrams = effectiveDDD != null ? data.totalDoses * effectiveDDD : null;
      const dddValue = data.totalDoses / (bedsNum * daysNum) * 100;

      auto.push({
        id: `auto_${ab}`,
        antibiotic: ab,
        totalDoses: data.totalDoses,
        estimatedGrams,
        omsDDD: effectiveDDD,
        hasOmsEntry: !!omsEntry,
        dddValue,
        category: categorize(dddValue),
        isManual: false,
      });
    }

    const manual: DddTableRow[] = manualEntries.map((me) => {
      const dddValue = (me.totalGrams / me.omsDDD) / (bedsNum * daysNum) * 100;
      return {
        id: me.id,
        antibiotic: me.antibiotic,
        totalDoses: 0,
        estimatedGrams: me.totalGrams,
        omsDDD: me.omsDDD,
        hasOmsEntry: true,
        dddValue,
        category: categorize(dddValue),
        isManual: true,
      };
    });

    return [...auto, ...manual].sort((a, b) => b.dddValue - a.dddValue);
  }, [antibioticDataMap, bedsNum, daysNum, customDDDs, manualEntries]);

  // Manual calculator result
  const manCalcResult = useMemo(() => {
    const g = parseFloat(manGrams);
    const d = parseFloat(manDDDInput);
    if (isNaN(g) || isNaN(d) || d === 0) return null;
    return (g / d) / (bedsNum * daysNum) * 100;
  }, [manGrams, manDDDInput, bedsNum, daysNum]);

  // Summary stats
  const summary = useMemo(() => {
    const rowsWithValue = tableRows.filter((r) => r.dddValue > 0);
    if (rowsWithValue.length === 0) return null;
    const sum = rowsWithValue.reduce((s, r) => s + r.dddValue, 0);
    const avg = sum / rowsWithValue.length;
    const max = rowsWithValue.reduce((m, r) => r.dddValue > m.dddValue ? r : m, rowsWithValue[0]);
    const altoCount = rowsWithValue.filter((r) => r.category === 'alto').length;
    return {
      total: rowsWithValue.length,
      avg,
      max,
      altoPct: (altoCount / rowsWithValue.length) * 100,
    };
  }, [tableRows]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleAddManual = () => {
    const g = parseFloat(manGrams);
    const d = parseFloat(manDDDInput);
    const ab = manAbInput.trim();
    if (!ab || isNaN(g) || isNaN(d) || d === 0) return;
    setManualEntries((prev) => [
      ...prev,
      { id: `manual_${Date.now()}`, antibiotic: ab, totalGrams: g, omsDDD: d },
    ]);
    setManAbInput('');
    setManGrams('');
    setManDDDInput('');
  };

  const removeManualEntry = (id: string) => {
    setManualEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // ── No hospital guard ──────────────────────────────────────────────────────

  if (!selectedHospitalObj) {
    return (
      <div className="p-4 lg:p-8 flex flex-col items-center justify-center min-h-[420px]">
        <Building2 className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-600 mb-1">
          Selecciona un hospital para usar la calculadora
        </h2>
        <p className="text-sm text-gray-400 mb-6 text-center max-w-sm">
          El cálculo de DDD requiere datos de intervenciones y camas del hospital seleccionado.
        </p>
        <button
          onClick={() => navigate('/hospitales')}
          className="px-5 py-2.5 text-sm font-medium text-white rounded-lg min-h-[44px]"
          style={{ backgroundColor: '#0F8B8D' }}
        >
          Ir a Hospitales
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-8">
      {/* Title */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: '#0B3C5D' }}>
          Calculadora DDD
        </h1>
        <p className="text-sm text-gray-500">
          Dosis Diaria Definida por 100 camas-día — Estándar OMS &nbsp;·&nbsp;
          <span className="font-medium text-gray-700">{selectedHospitalObj.name}</span>
        </p>
      </div>

      {/* ── SECTION 1: Configuration ── */}
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 mb-6 border-l-4"
        style={{ borderLeftColor: '#0F8B8D' }}
      >
        <h2 className="text-base font-semibold mb-4" style={{ color: '#0B3C5D' }}>
          Parámetros del cálculo
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Camas habilitadas
            </label>
            <input
              type="number"
              min="1"
              value={beds}
              onChange={(e) => setBeds(e.target.value)}
              placeholder="Ej. 150"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Días del período
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={periodDays}
                onChange={(e) => setPeriodDays(e.target.value)}
                placeholder="30"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
              {([30, 180, 365] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setPeriodDays(String(d))}
                  className={`px-2 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap min-h-[38px] ${
                    periodDays === String(d)
                      ? 'text-white border-transparent'
                      : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                  style={periodDays === String(d) ? { backgroundColor: '#0F8B8D' } : {}}
                >
                  {d === 30 ? '30 días' : d === 180 ? '180 días' : '365 días'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Fórmula: DDD/100 camas-día = (g consumidos ÷ DDD OMS) ÷ (camas × días) × 100
        </p>
      </div>

      {/* ── SECTION 2: Auto table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold" style={{ color: '#0B3C5D' }}>
            Análisis por antibiótico
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Basado en {records.length} intervenciones del período seleccionado ·{' '}
            {bedsNum} camas · {daysNum} días
          </p>
        </div>

        {tableRows.length === 0 ? (
          <div className="py-12 flex flex-col items-center">
            <Calculator className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">Sin datos de antibióticos</p>
            <p className="text-xs text-gray-400 mt-1">
              Carga archivos de intervenciones desde Hospitales para calcular DDDs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Antibiótico
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Dosis totales
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    DDD OMS (g)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    DDD/100 camas-día
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableRows.map((row) => {
                  const unknownNoCustom = !row.hasOmsEntry && !customDDDs[row.antibiotic];
                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        !row.hasOmsEntry ? 'bg-yellow-50/60 italic' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{row.antibiotic}</span>
                          {row.isManual && (
                            <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded font-normal not-italic">
                              Manual
                            </span>
                          )}
                          {!row.hasOmsEntry && (
                            <span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded font-normal not-italic">
                              Sin DDD OMS
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right hidden sm:table-cell">
                        {row.isManual ? '—' : row.totalDoses.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        {row.hasOmsEntry ? (
                          <span className="text-sm text-gray-700">
                            {row.omsDDD != null ? row.omsDDD.toFixed(2) : '—'}
                          </span>
                        ) : (
                          /* Inline custom DDD input for unknown antibiotics */
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={customDDDs[row.antibiotic] ?? ''}
                              onChange={(e) =>
                                setCustomDDDs((prev) => ({ ...prev, [row.antibiotic]: e.target.value }))
                              }
                              placeholder="DDD"
                              className="w-16 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none text-right"
                            />
                            <span className="text-xs text-gray-400">g</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-right" style={{ color: unknownNoCustom ? '#9ca3af' : '#0B3C5D' }}>
                        {row.dddValue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <CategoryBadge category={row.category} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {manualEntries.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 self-center">Entradas manuales:</span>
            {manualEntries.map((me) => (
              <span key={me.id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-200">
                {me.antibiotic}
                <button
                  onClick={() => removeManualEntry(me.id)}
                  className="hover:text-red-600 transition-colors"
                  title="Quitar entrada"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 3: Manual calculator ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 mb-6">
        <h2 className="text-base font-semibold mb-4" style={{ color: '#0B3C5D' }}>
          Cálculo Manual
        </h2>

        <datalist id="ddd-antibiotics">
          {Object.keys(OMS_DDD_TABLE).map((ab) => (
            <option key={ab} value={ab} />
          ))}
        </datalist>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Antibiótico</label>
            <input
              type="text"
              list="ddd-antibiotics"
              value={manAbInput}
              onChange={(e) => setManAbInput(e.target.value)}
              placeholder="Buscar antibiótico..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Total gramos consumidos
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={manGrams}
              onChange={(e) => setManGrams(e.target.value)}
              placeholder="Ej. 3600"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              DDD OMS (g)
              {manAbInput.trim() && OMS_DDD_TABLE[manAbInput.trim()] && (
                <span className="ml-1 text-xs text-teal-600 font-normal">(auto)</span>
              )}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={manDDDInput}
              onChange={(e) => setManDDDInput(e.target.value)}
              placeholder="Ej. 2.0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
        </div>

        {/* Result display */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-h-[72px] flex flex-col justify-center">
            {manCalcResult !== null ? (
              <>
                <p
                  className="text-4xl font-bold leading-none"
                  style={{ color: '#0F8B8D' }}
                >
                  {manCalcResult.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">DDD/100 camas-día</p>
                <div className="mt-2">
                  <CategoryBadge category={categorize(manCalcResult)} />
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">
                Ingresa antibiótico, gramos y DDD OMS para ver el resultado.
              </p>
            )}
          </div>

          <button
            onClick={handleAddManual}
            disabled={!manAbInput.trim() || !manGrams || !manDDDInput || manCalcResult === null}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg disabled:opacity-40 min-h-[44px] transition-colors shrink-0"
            style={{ backgroundColor: '#0F8B8D' }}
          >
            <Plus className="w-4 h-4" />
            Agregar a tabla
          </button>
        </div>
      </div>

      {/* ── SECTION 4: Summary bar ── */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Antibióticos analizados</p>
            <p className="text-2xl font-bold" style={{ color: '#0B3C5D' }}>{summary.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Promedio DDD general</p>
            <p className="text-2xl font-bold" style={{ color: '#0B3C5D' }}>
              {summary.avg.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Mayor DDD</p>
            <p className="text-lg font-bold truncate" style={{ color: '#0B3C5D' }}>
              {summary.max.antibiotic}
            </p>
            <p className="text-xs text-gray-500">{summary.max.dddValue.toFixed(2)} DDD/100</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">En categoría alto</p>
            <p className="text-2xl font-bold text-red-600">
              {Math.round(summary.altoPct)}%
            </p>
            <p className="text-xs text-gray-500">{'>'} 10 DDD/100</p>
          </div>
        </div>
      )}

      {/* Trash icon for clearing manual entries — shown when there are manual entries */}
      {manualEntries.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setManualEntries([])}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpiar entradas manuales
          </button>
        </div>
      )}
    </div>
  );
}
