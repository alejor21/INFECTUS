import { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { useHospitalContext } from '../../contexts/HospitalContext';
import { filterByRange } from '../../lib/analytics/dateFilters';
import { getAlerts } from '../../lib/supabase/alerts';
import type { Alert } from '../../lib/supabase/alerts';
import type { InterventionRecord } from '../../types';
import type { Hospital } from '../../lib/supabase/hospitals';

const HOSPITAL_COLORS = [
  '#0F8B8D',
  '#0B3C5D',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#DDA0DD',
  '#FFB347',
  '#FF8C94',
];

const DATE_RANGE_LABELS: Record<'1m' | '6m' | '12m' | 'all', string> = {
  '1m': '1M',
  '6m': '6M',
  '12m': '12M',
  all: 'Todo',
};

function applyDateFilter(
  records: InterventionRecord[],
  range: '1m' | '6m' | '12m' | 'all',
): InterventionRecord[] {
  if (range === 'all') return records;
  const months = range === '1m' ? 1 : range === '6m' ? 6 : 12;
  return filterByRange(records, months as 1 | 6 | 12);
}

function getAdequacyColor(value: number): string {
  if (value >= 80) return '#10b981';
  if (value >= 60) return '#f59e0b';
  return '#ef4444';
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function cellClass(value: number, best: number, worst: number, count: number): string {
  if (count < 2) return '';
  if (value === best) return 'bg-green-50 text-green-700 font-semibold';
  if (value === worst) return 'bg-red-50 text-red-700 font-semibold';
  return '';
}

export function Comparativa() {
  const { hospitals, allRawRecords, dateRange, setDateRange } = useHospitalContext();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [allAlerts, setAllAlerts] = useState<Alert[]>([]);

  // Initialize with all hospitals selected when hospitals load
  useEffect(() => {
    if (hospitals.length > 0) {
      setSelectedIds(new Set(hospitals.map((h) => h.id)));
    }
  }, [hospitals]);

  // Fetch all alerts for the active-alerts count in the metrics table
  useEffect(() => {
    getAlerts()
      .then(setAllAlerts)
      .catch(() => setAllAlerts([]));
  }, []);

  const selectedHospitals: Hospital[] = useMemo(
    () => hospitals.filter((h) => selectedIds.has(h.id)),
    [hospitals, selectedIds],
  );

  const dateFilteredRecords = useMemo(
    () => applyDateFilter(allRawRecords, dateRange),
    [allRawRecords, dateRange],
  );

  // Group records per hospital id (matched by name since records carry hospitalName)
  const recordsByHospital = useMemo(() => {
    const map = new Map<string, InterventionRecord[]>();
    for (const hospital of selectedHospitals) {
      map.set(
        hospital.id,
        dateFilteredRecords.filter((record) =>
          record.hospitalId
            ? record.hospitalId === hospital.id
            : record.hospitalName === hospital.name,
        ),
      );
    }
    return map;
  }, [selectedHospitals, dateFilteredRecords]);

  function toggleHospital(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // ── Chart 1: Adecuación Terapéutica per hospital ─────────────────────────
  const adequacyData = useMemo(
    () =>
      selectedHospitals.map((h) => {
        const recs = recordsByHospital.get(h.id) ?? [];
        const pct =
          recs.length === 0
            ? 0
            : (recs.filter((r) => (r.aproboTerapia ?? '').trim().toUpperCase() === 'SI').length /
                recs.length) *
              100;
        return {
          name: truncate(h.name, 20),
          fullName: h.name,
          value: Math.round(pct * 10) / 10,
        };
      }),
    [selectedHospitals, recordsByHospital],
  );

  // ── Chart 2: Total Intervenciones (horizontal bar) ────────────────────────
  const interventionData = useMemo(
    () =>
      selectedHospitals
        .map((h) => ({
          name: truncate(h.name, 20),
          fullName: h.name,
          total: (recordsByHospital.get(h.id) ?? []).length,
        }))
        .sort((a, b) => b.total - a.total),
    [selectedHospitals, recordsByHospital],
  );

  // ── Chart 3: Top 5 Antibióticos grouped bar ───────────────────────────────
  const { antibioticChartData } = useMemo(() => {
    const allRecs = selectedHospitals.flatMap((h) => recordsByHospital.get(h.id) ?? []);
    const countMap = new Map<string, number>();
    for (const r of allRecs) {
      const a1 = (r.antibiotico01 ?? '').trim();
      const a2 = (r.antibiotico02 ?? '').trim();
      if (a1) countMap.set(a1, (countMap.get(a1) ?? 0) + 1);
      if (a2) countMap.set(a2, (countMap.get(a2) ?? 0) + 1);
    }
    const top5 = [...countMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    const data = top5.map((antibiotic) => {
      const row: Record<string, string | number> = {
        antibiotic: truncate(antibiotic, 16),
        fullAntibiotic: antibiotic,
      };
      for (const h of selectedHospitals) {
        const recs = recordsByHospital.get(h.id) ?? [];
        row[h.name] = recs.filter(
          (r) =>
            (r.antibiotico01 ?? '').toLowerCase().includes(antibiotic.toLowerCase()) ||
            (r.antibiotico02 ?? '').toLowerCase().includes(antibiotic.toLowerCase()),
        ).length;
      }
      return row;
    });

    return { antibioticChartData: data };
  }, [selectedHospitals, recordsByHospital]);

  // ── Chart 4: Distribución por Servicio (Radar) ────────────────────────────
  const radarData = useMemo(() => {
    const allRecs = selectedHospitals.flatMap((h) => recordsByHospital.get(h.id) ?? []);
    const svcCountMap = new Map<string, number>();
    for (const r of allRecs) {
      const s = (r.servicio ?? '').trim();
      if (s) svcCountMap.set(s, (svcCountMap.get(s) ?? 0) + 1);
    }
    const top6 = [...svcCountMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name]) => name);

    return top6.map((service) => {
      const row: Record<string, string | number> = { service: truncate(service, 20) };
      for (const h of selectedHospitals) {
        const recs = recordsByHospital.get(h.id) ?? [];
        row[h.name] = recs.filter((r) => r.servicio === service).length;
      }
      return row;
    });
  }, [selectedHospitals, recordsByHospital]);

  // ── Metrics table ─────────────────────────────────────────────────────────
  const metricsData = useMemo(
    () =>
      selectedHospitals
        .map((h) => {
          const recs = recordsByHospital.get(h.id) ?? [];
          const total = recs.length;
          const adequacy =
            total === 0
              ? 0
              : Math.round(
                  (recs.filter((r) => (r.aproboTerapia ?? '').trim().toUpperCase() === 'SI')
                    .length /
                    total) *
                    1000,
                ) / 10;
          const withCulture = recs.filter((r) => {
            const c = (r.cultivosPrevios ?? '').trim();
            return c !== '' && c.toUpperCase() !== 'NO';
          }).length;
          const cultureRate = total === 0 ? 0 : Math.round((withCulture / total) * 1000) / 10;
          const activeAlerts = allAlerts.filter(
            (a) => !a.is_read && a.hospital_id === h.id,
          ).length;
          return { hospital: h, total, adequacy, cultureRate, activeAlerts };
        })
        .sort((a, b) => b.adequacy - a.adequacy),
    [selectedHospitals, recordsByHospital, allAlerts],
  );

  const bestAdequacy = Math.max(...(metricsData.map((r) => r.adequacy).filter(isFinite).concat([0])));
  const worstAdequacy = Math.min(...(metricsData.map((r) => r.adequacy).filter(isFinite).concat([0])));
  const bestCulture = Math.max(...(metricsData.map((r) => r.cultureRate).filter(isFinite).concat([0])));
  const worstCulture = Math.min(...(metricsData.map((r) => r.cultureRate).filter(isFinite).concat([0])));
  const bestTotal = Math.max(...(metricsData.map((r) => r.total).filter(isFinite).concat([0])));
  const worstTotal = Math.min(...(metricsData.map((r) => r.total).filter(isFinite).concat([0])));
  const rowCount = metricsData.length;

  // ── Empty state: fewer than 2 hospitals in system ─────────────────────────
  if (hospitals.length < 2) {
    return (
      <div className="p-4 lg:p-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: '#0B3C5D' }}>
          Comparativa de Hospitales
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Análisis comparativo entre hospitales del sistema
        </p>
        <div className="flex flex-col items-center justify-center py-28 text-gray-400">
          <span className="text-6xl mb-5">🏥</span>
          <p className="text-lg font-semibold text-gray-500">
            Se necesitan al menos 2 hospitales para comparar
          </p>
          <p className="text-sm mt-2 text-gray-400">
            Registra más hospitales en la sección Hospitales para usar esta vista.
          </p>
        </div>
      </div>
    );
  }

  const insufficientSelection = selectedHospitals.length < 2;

  return (
    <div className="p-4 lg:p-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row items-start gap-4 justify-between mb-6 lg:mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#0B3C5D' }}>
            Comparativa de Hospitales
          </h1>
          <p className="text-sm text-gray-500">
            Análisis comparativo entre hospitales del sistema
          </p>
        </div>

        {/* Date range selector */}
        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg shrink-0">
          {(['1m', '6m', '12m', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                dateRange === r
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {DATE_RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Hospital selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 mb-6 lg:mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Seleccionar hospitales para comparar
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 sm:flex-wrap">
          {hospitals.map((h) => (
            <label key={h.id} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedIds.has(h.id)}
                onChange={() => toggleHospital(h.id)}
                className="rounded border-gray-300"
                style={{ accentColor: '#0F8B8D' }}
              />
              <span className="text-sm text-gray-800 font-medium">{h.name}</span>
              <span className="text-xs text-gray-400">{h.city}</span>
            </label>
          ))}
        </div>
        {insufficientSelection && (
          <p className="mt-3 text-sm text-amber-600 font-medium">
            Selecciona al menos 2 hospitales para ver la comparativa.
          </p>
        )}
      </div>

      {insufficientSelection ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-lg font-medium">Selecciona al menos 2 hospitales</p>
        </div>
      ) : (
        <>
          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">

            {/* Chart 1 — Adecuación Terapéutica */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold mb-4" style={{ color: '#0B3C5D' }}>
                Adecuación Terapéutica por Hospital
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={adequacyData} margin={{ top: 5, right: 20, left: 0, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Adecuación']}
                    labelFormatter={(_: string, payload: { payload?: { fullName?: string } }[]) =>
                      payload?.[0]?.payload?.fullName ?? ''
                    }
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {adequacyData.map((entry, idx) => (
                      <Cell key={idx} fill={getAdequacyColor(entry.value)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-5 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }} />
                  ≥ 80%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                  60–79%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                  {'< 60%'}
                </span>
              </div>
            </div>

            {/* Chart 2 — Total Intervenciones (horizontal) */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold mb-4" style={{ color: '#0B3C5D' }}>
                Total Intervenciones por Hospital
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={interventionData}
                  layout="vertical"
                  margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [value, 'Intervenciones']}
                    labelFormatter={(_: string, payload: { payload?: { fullName?: string } }[]) =>
                      payload?.[0]?.payload?.fullName ?? ''
                    }
                  />
                  <Bar dataKey="total" fill="#0F8B8D" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 3 — Top Antibióticos grouped */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold mb-4" style={{ color: '#0B3C5D' }}>
                Top Antibióticos Comparativo
              </h3>
              {antibioticChartData.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                  Sin datos de antibióticos en el período seleccionado
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={antibioticChartData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="antibiotic"
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    {selectedHospitals.map((h, i) => (
                      <Bar
                        key={h.id}
                        dataKey={h.name}
                        fill={HOSPITAL_COLORS[i % HOSPITAL_COLORS.length]}
                        radius={[2, 2, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Chart 4 — Distribución por Servicio (Radar) */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold mb-4" style={{ color: '#0B3C5D' }}>
                Distribución por Servicio
              </h3>
              {radarData.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                  Sin datos de servicios en el período seleccionado
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart
                    data={radarData}
                    margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
                  >
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="service" tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <PolarRadiusAxis angle={30} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    {selectedHospitals.map((h, i) => (
                      <Radar
                        key={h.id}
                        name={h.name}
                        dataKey={h.name}
                        stroke={HOSPITAL_COLORS[i % HOSPITAL_COLORS.length]}
                        fill={HOSPITAL_COLORS[i % HOSPITAL_COLORS.length]}
                        fillOpacity={0.15}
                      />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Metrics table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-base font-semibold" style={{ color: '#0B3C5D' }}>
                Resumen por Hospital
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Ordenado por adecuación terapéutica descendente
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Hospital
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Ciudad
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Total Intervenciones
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Adecuación Terapéutica %
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Con Cultivo %
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Alertas Activas
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {metricsData.map(({ hospital, total, adequacy, cultureRate, activeAlerts }) => (
                    <tr key={hospital.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{hospital.name}</td>
                      <td className="px-6 py-4 text-gray-600 hidden sm:table-cell">{hospital.city}</td>
                      <td
                        className={`px-6 py-4 text-right ${cellClass(total, bestTotal, worstTotal, rowCount)}`}
                      >
                        {total.toLocaleString('es-CO')}
                      </td>
                      <td
                        className={`px-6 py-4 text-right ${cellClass(adequacy, bestAdequacy, worstAdequacy, rowCount)}`}
                      >
                        {adequacy.toFixed(1)}%
                      </td>
                      <td
                        className={`px-6 py-4 text-right hidden sm:table-cell ${cellClass(cultureRate, bestCulture, worstCulture, rowCount)}`}
                      >
                        {cultureRate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-right hidden sm:table-cell">
                        {activeAlerts > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            {activeAlerts}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
