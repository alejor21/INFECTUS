import { useMemo } from 'react';
import { Shield, AlertTriangle, TrendingUp, Microscope } from 'lucide-react';
import type { InterventionRecord } from '../../types';
import { ResistancePatternChart } from '../components/ResistancePatternChart';
import { OrganismDistributionChart } from '../components/OrganismDistributionChart';
import { SensitivityMatrixChart } from '../components/SensitivityMatrixChart';
import { ResistanceTrendChart } from '../components/ResistanceTrendChart';
import { ResistanceDataTable } from '../components/ResistanceDataTable';
import { KPICard } from '../components/KPICard';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useHospitalContext } from '../components/Layout';

const DATE_RANGE_LABEL: Record<'1m' | '6m' | '12m' | 'all', string> = {
  '1m': 'Último mes',
  '6m': 'Últimos 6 meses',
  '12m': 'Último año',
  'all': 'Todos los datos',
};

// ─── Heatmap helpers ──────────────────────────────────────────────────────────

/** Returns true if the record indicates resistance to the given antibiotic, null if no data. */
function isResistantTo(record: InterventionRecord, antibiotic: string): boolean | null {
  const ab = (antibiotic ?? '').toLowerCase();

  if (ab.includes('vancomicina') || ab.includes('daptomicina') || ab.includes('linezolid')) {
    const s = (record.sensibilidadVancomicina ?? '').trim().toUpperCase();
    if (!s) return null;
    return s === 'R' || s.includes('RESISTENTE');
  }
  if (ab.includes('meropenem') || ab.includes('imipenem') || ab.includes('ertapenem')) {
    const s = (record.sensibilidadMeropenem ?? '').trim().toUpperCase();
    if (!s) return null;
    return s === 'R' || s.includes('RESISTENTE');
  }
  if (
    ab.includes('ceftriaxona') || ab.includes('cefepime') || ab.includes('cefazolina') ||
    ab.includes('ampicilina') || ab.includes('amoxicilina') || ab.includes('piperacilina')
  ) {
    const blee = (record.blee ?? '').trim().toUpperCase();
    if (!blee) return null;
    return blee === 'SI';
  }
  if (ab.includes('carbapen')) {
    const carba = (record.carbapenemasa ?? '').trim().toUpperCase();
    if (!carba) return null;
    return carba === 'SI';
  }
  if (ab.includes('oxacilina') || ab.includes('meticilina') || ab.includes('nafcilina')) {
    const mrsa = (record.mrsa ?? '').trim().toUpperCase();
    if (!mrsa) return null;
    return mrsa === 'SI';
  }
  return null;
}

interface HeatmapCellStyle { className: string }

function getHeatmapCellStyle(rate: number | null): HeatmapCellStyle {
  if (rate === null)  return { className: 'bg-gray-100 text-gray-400' };
  if (rate <= 20)     return { className: 'bg-green-100 text-green-800' };
  if (rate <= 40)     return { className: 'bg-yellow-100 text-yellow-800' };
  if (rate <= 60)     return { className: 'bg-orange-100 text-orange-800' };
  if (rate <= 80)     return { className: 'bg-red-100 text-red-800' };
  return { className: 'bg-red-600 text-white font-bold' };
}

export function Resistencias() {
  const { selectedHospitalObj, hospitals, dateRange } = useHospitalContext();
  const {
    mrsaRate,
    bleeRate,
    carbapenemaseRate,
    positiveCultureRate,
    organismDistribution,
    sensitivityMatrix,
    resistanceTrend,
    records,
    loading,
  } = useAnalytics();

  // Summary card totals from organism distribution
  const totalPositiveCultures = organismDistribution.reduce((s, o) => s + o.count, 0);
  const totalRecords = records.length;

  // Per-organism resistance pattern for ResistancePatternChart
  const resistancePatternData = (() => {
    const map = new Map<string, { blee: number; carba: number; mrsa: number }>();
    for (const r of records) {
      if ((r.resultadoCultivo ?? '').trim().toUpperCase() !== 'POSITIVO') continue;
      const org = (r.organismoAislado ?? '').trim();
      if (!org) continue;
      if (!map.has(org)) map.set(org, { blee: 0, carba: 0, mrsa: 0 });
      const entry = map.get(org)!;
      if ((r.blee ?? '').trim().toUpperCase() === 'SI') entry.blee++;
      if ((r.carbapenemasa ?? '').trim().toUpperCase() === 'SI') entry.carba++;
      if ((r.mrsa ?? '').trim().toUpperCase() === 'SI') entry.mrsa++;
    }
    return Array.from(map.entries()).map(([organismo, counts]) => ({ organismo, ...counts }));
  })();

  // Map resistanceTrend to ResistanceTrendChart expected shape
  // resistanceTrend: { month, blee, mrsa, carba }
  // ResistanceTrendChart expects: { month, ecoli, kpneu, mrsa, pseudo }
  const trendChartData = resistanceTrend.map((d) => ({
    month: d.month,
    ecoli: d.blee,
    kpneu: d.carba,
    mrsa: d.mrsa,
    pseudo: 0,
  }));

  // Resistance data table rows (positive culture records)
  const tableData = records
    .filter((r) => (r.resultadoCultivo ?? '').trim().toUpperCase() === 'POSITIVO')
    .map((r) => ({
      servicio: r.servicio ?? '',
      organismoAislado: r.organismoAislado ?? '',
      blee: r.blee ?? '',
      carbapenemasa: r.carbapenemasa ?? '',
      mrsa: r.mrsa ?? '',
      sensibilidadVancomicina: r.sensibilidadVancomicina ?? '',
      sensibilidadMeropenem: r.sensibilidadMeropenem ?? '',
    }));

  // Sparklines from trend data
  const mrsaSparkline = resistanceTrend.map((d) => d.mrsa);
  const bleeSparkline = resistanceTrend.map((d) => d.blee);
  const carbaSparkline = resistanceTrend.map((d) => d.carba);

  const showCarbapenemaseAlert = carbapenemaseRate > 10;

  // ── Heatmap data ──────────────────────────────────────────────────────────
  const heatmapData = useMemo(() => {
    const MIN_SAMPLES = 3;
    const MAX_BACTERIA = 10;
    const MAX_ANTIBIOTICS = 12;

    const relevant = records.filter(
      (r) => (r.organismoAislado ?? '').trim() && (r.antibiotico01 ?? '').trim(),
    );
    if (relevant.length === 0) return null;

    const bacteriaCount = new Map<string, number>();
    const abCount = new Map<string, number>();
    for (const r of relevant) {
      const b = r.organismoAislado!.trim();
      const a = r.antibiotico01!.trim();
      bacteriaCount.set(b, (bacteriaCount.get(b) ?? 0) + 1);
      abCount.set(a, (abCount.get(a) ?? 0) + 1);
    }

    const bacteria = [...bacteriaCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_BACTERIA)
      .map(([name]) => name);

    const antibiotics = [...abCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_ANTIBIOTICS)
      .map(([name]) => name);

    const totalMap = new Map<string, number>();
    const resistMap = new Map<string, number>();

    for (const r of relevant) {
      const b = r.organismoAislado!.trim();
      const a = r.antibiotico01!.trim();
      if (!bacteria.includes(b) || !antibiotics.includes(a)) continue;
      const key = `${b}||${a}`;
      totalMap.set(key, (totalMap.get(key) ?? 0) + 1);
      if (isResistantTo(r, a) === true) {
        resistMap.set(key, (resistMap.get(key) ?? 0) + 1);
      }
    }

    const cells: Record<string, Record<string, number | null>> = {};
    for (const b of bacteria) {
      cells[b] = {};
      for (const a of antibiotics) {
        const key = `${b}||${a}`;
        const total = totalMap.get(key) ?? 0;
        cells[b][a] = total >= MIN_SAMPLES
          ? ((resistMap.get(key) ?? 0) / total) * 100
          : null;
      }
    }

    return { bacteria, antibiotics, cells };
  }, [records]);

  return (
    <div className={loading ? 'p-8 opacity-50' : 'p-8'}>

      {/* ── HEATMAP: Mapa de Resistencias Bacterianas ── */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-1" style={{ color: '#0B3C5D' }}>
          Mapa de Resistencias Bacterianas
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Tasa de resistencia por bacteria y antibiótico · {DATE_RANGE_LABEL[dateRange]}
        </p>

        {heatmapData === null ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
            <Microscope className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">Sin datos de resistencia disponibles</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Asegúrate de que los registros incluyan campos de germen y sensibilidad.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="border-collapse" style={{ minWidth: 'max-content' }}>
                <thead>
                  <tr>
                    {/* Corner cell */}
                    <th
                      className="sticky left-0 bg-white border-b border-r border-gray-200 z-10"
                      style={{ minWidth: '140px', width: '140px' }}
                    />
                    {heatmapData.antibiotics.map((ab) => (
                      <th
                        key={ab}
                        className="border-b border-gray-200 p-0 align-bottom"
                        style={{ width: '48px', minWidth: '48px', height: '80px' }}
                      >
                        <div className="flex items-end justify-start h-full pb-1 pl-2 overflow-hidden">
                          <span
                            className="text-xs text-gray-600 font-medium whitespace-nowrap block"
                            style={{
                              transform: 'rotate(-45deg)',
                              transformOrigin: 'bottom left',
                              maxWidth: '90px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={ab}
                          >
                            {ab}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.bacteria.map((bact, bi) => (
                    <tr key={bact} className={bi % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td
                        className="sticky left-0 bg-inherit border-r border-gray-200 px-3 py-2 z-10"
                        style={{ minWidth: '140px', width: '140px' }}
                      >
                        <span
                          className="text-xs font-semibold text-gray-700 block truncate sm:hidden"
                          title={bact}
                        >
                          {bact.length > 15 ? `${bact.slice(0, 14)}…` : bact}
                        </span>
                        <span
                          className="text-xs font-semibold text-gray-700 hidden sm:block truncate"
                          title={bact}
                        >
                          {bact}
                        </span>
                      </td>
                      {heatmapData.antibiotics.map((ab) => {
                        const rate = heatmapData.cells[bact]?.[ab] ?? null;
                        const { className } = getHeatmapCellStyle(rate);
                        return (
                          <td
                            key={ab}
                            className={`text-center text-xs border-b border-gray-100 ${className}`}
                            style={{ width: '48px', height: '40px' }}
                            title={rate !== null ? `${bact} × ${ab}: ${Math.round(rate)}%` : `${bact} × ${ab}: sin datos`}
                          >
                            {rate === null ? '—' : `${Math.round(rate)}%`}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50">
              <span className="text-xs text-gray-500 font-medium">Tasa de resistencia (%):</span>
              {[
                { label: '0–20%',   className: 'bg-green-100' },
                { label: '21–40%',  className: 'bg-yellow-100' },
                { label: '41–60%',  className: 'bg-orange-100' },
                { label: '61–80%',  className: 'bg-red-100' },
                { label: '81–100%', className: 'bg-red-600' },
                { label: 'Sin datos', className: 'bg-gray-100' },
              ].map(({ label, className }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`w-7 h-4 rounded ${className} inline-block border border-gray-200`} />
                  <span className="text-xs text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <hr className="border-gray-200 mb-8" />

      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: '#0B3C5D' }}>
          Vigilancia de Resistencias
        </h1>
        {selectedHospitalObj ? (
          <p className="text-sm font-medium text-gray-700">
            {selectedHospitalObj.name} · {selectedHospitalObj.city}, {selectedHospitalObj.department}
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            Vista general — Todos los hospitales ({hospitals.length} hospitales, {records.length} registros)
          </p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">{DATE_RANGE_LABEL[dateRange]}</p>
      </div>

      {/* Dynamic Alert Banner */}
      {showCarbapenemaseAlert && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900 mb-1">Alerta epidemiológica</h4>
            <p className="text-sm text-yellow-700">
              Se ha detectado un incremento de organismos productores de carbapenemasa ({carbapenemaseRate}% de cultivos positivos). Revisar medidas de control.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Tasa cultivos positivos"
          value={String(positiveCultureRate)}
          unit="%"
          trend={-18.5}
          trendPositive={true}
          sparklineData={bleeSparkline}
        />
        <KPICard
          title="MRSA"
          value={String(mrsaRate)}
          unit="%"
          trend={-3.0}
          trendPositive={true}
          sparklineData={mrsaSparkline}
        />
        <KPICard
          title="BLEE"
          value={String(bleeRate)}
          unit="%"
          trend={-5.0}
          trendPositive={true}
          sparklineData={bleeSparkline}
        />
        <KPICard
          title="Carbapenemasa"
          value={String(carbapenemaseRate)}
          unit="%"
          trend={-13.6}
          trendPositive={true}
          sparklineData={carbaSparkline}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-red-100">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Cultivos positivos</p>
              <p className="text-2xl font-bold text-red-600">{totalPositiveCultures}</p>
              <p className="text-xs text-gray-500 mt-1">Período seleccionado</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0F8B8D' }}>
              <Microscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Cultivos procesados</p>
              <p className="text-2xl font-bold" style={{ color: '#0B3C5D' }}>{totalRecords}</p>
              <p className="text-xs text-gray-500 mt-1">Período seleccionado</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Tasa de positividad</p>
              <p className="text-2xl font-bold" style={{ color: '#0B3C5D' }}>{positiveCultureRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ResistancePatternChart data={resistancePatternData} />
        <OrganismDistributionChart data={organismDistribution} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SensitivityMatrixChart data={sensitivityMatrix} />
        <ResistanceTrendChart data={trendChartData} />
      </div>

      {/* Detailed Table */}
      <ResistanceDataTable data={tableData} />
    </div>
  );
}
