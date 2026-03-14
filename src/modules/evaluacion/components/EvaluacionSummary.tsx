import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Save,
  FileDown,
  Loader2,
  Sparkles,
  X,
  Copy,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { ComplianceValue } from '../data/proaItems';
import {
  PROA_SECTIONS,
  computeAllScores,
  calculateLevel,
  getItemKey,
} from '../data/proaItems';
import { ProgressBar } from './ProgressBar';
import type { IAReport } from '../lib/evaluacionIA';
import { generateIAReport, enhanceReportWithAI } from '../lib/evaluacionIA';
import type { AIResponse } from '../lib/evaluacionIA';
import { exportIAReportPDF } from '../lib/evaluacionPDF';

// ─── Props ───────────────────────────────────────────────────────────────────

interface EvaluacionSummaryProps {
  allItemValues: Record<string, ComplianceValue>;
  observations: string;
  onObservationsChange: (value: string) => void;
  onSave: () => void;
  onExport: () => void;
  onExportPartial?: (sections: string[]) => void;
  isSaving: boolean;
  hospitalId?: string;
  hospitalName?: string;
  evaluacionId?: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const LEVEL_CONFIG = {
  avanzado: {
    label: 'Avanzado',
    desc: '56 – 61 pts',
    color: 'bg-green-100 text-green-700 border-green-200',
    scoreColor: 'text-green-600',
  },
  basico: {
    label: 'Básico',
    desc: '31 – 55 pts',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    scoreColor: 'text-amber-600',
  },
  inadecuado: {
    label: 'Inadecuado',
    desc: '≤ 30 pts',
    color: 'bg-red-100 text-red-700 border-red-200',
    scoreColor: 'text-red-600',
  },
};

const SECTION_BARS: Record<string, string> = {
  pre: 'from-indigo-400 to-indigo-600',
  exec: 'from-teal-400 to-teal-600',
  eval: 'from-violet-400 to-violet-600',
};

const SECTION_LABELS: Record<string, string> = {
  pre: 'Pre-implementación',
  exec: 'Ejecución del PROA',
  eval: 'Evaluación de la Ejecución',
};

const RISK_COLORS: Record<
  IAReport['nivelRiesgo'],
  { box: string; text: string; dot: string; badge: string }
> = {
  BAJO: {
    box: 'bg-emerald-50 border border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  MEDIO: {
    box: 'bg-amber-50 border border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  ALTO: {
    box: 'bg-red-50 border border-red-200',
    text: 'text-red-600',
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-600 border-red-200',
  },
  CRITICO: {
    box: 'bg-red-100 border border-red-300',
    text: 'text-red-700',
    dot: 'bg-red-600',
    badge: 'bg-red-200 text-red-700 border-red-300',
  },
};

const PRIORIDAD_COLORS: Record<string, string> = {
  INMEDIATA: 'bg-red-100 text-red-700',
  CORTO_PLAZO: 'bg-amber-100 text-amber-700',
  LARGO_PLAZO: 'bg-blue-100 text-blue-700',
};

const TOTAL_ITEMS = 61;
const RING_RADIUS = 18;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function countAnswered(allItemValues: Record<string, ComplianceValue>): number {
  let count = 0;
  PROA_SECTIONS.forEach((section) => {
    section.categories.forEach((cat, catIdx) => {
      cat.items.forEach((_, itemIdx) => {
        const key = getItemKey(section.id, catIdx, itemIdx);
        if (allItemValues[key] !== undefined) count++;
      });
    });
  });
  return count;
}

function getSectionAnsweredCount(
  sectionId: string,
  allItemValues: Record<string, ComplianceValue>,
): { count: number; total: number } {
  const section = PROA_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return { count: 0, total: 0 };
  let count = 0;
  let total = 0;
  section.categories.forEach((cat, catIdx) => {
    cat.items.forEach((_, itemIdx) => {
      total++;
      if (allItemValues[getItemKey(sectionId, catIdx, itemIdx)] !== undefined) count++;
    });
  });
  return { count, total };
}

function formatIAReportAsText(report: IAReport, hospitalName: string): string {
  const lines: string[] = [
    `REPORTE INTELIGENTE PROA — ${hospitalName}`,
    `Generado: ${new Date().toLocaleDateString('es-CO')}`,
    `Nivel de Riesgo: ${report.nivelRiesgo} | Puntuación: ${report.puntuacionGlobal}/61`,
    '',
    '── RESUMEN EJECUTIVO ──',
    report.resumenEjecutivo,
    '',
  ];

  if (report.fortalezas.length > 0) {
    lines.push('── FORTALEZAS ──');
    report.fortalezas.forEach((f) => lines.push(`• ${f}`));
    lines.push('');
  }

  if (report.areasDeOportunidad.length > 0) {
    lines.push('── ÁREAS DE OPORTUNIDAD ──');
    report.areasDeOportunidad.forEach((a) => lines.push(`⚠ ${a}`));
    lines.push('');
  }

  if (report.recomendaciones.length > 0) {
    lines.push('── RECOMENDACIONES ──');
    report.recomendaciones.forEach((r) => {
      lines.push(`[${r.prioridad.replace('_', ' ')}] ${r.categoria}`);
      lines.push(`  Acción: ${r.accion}`);
      lines.push(`  Impacto: ${r.impactoEsperado}`);
      lines.push('');
    });
  }

  lines.push('── CONCLUSIÓN ──');
  lines.push(report.conclusión);

  return lines.join('\n');
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EvaluacionSummary({
  allItemValues,
  observations,
  onObservationsChange,
  onSave,
  onExport,
  onExportPartial,
  isSaving,
  hospitalId,
  hospitalName,
  evaluacionId,
}: EvaluacionSummaryProps) {
  const { preScore, execScore, evalScore, totalScore } = computeAllScores(allItemValues);
  const level = calculateLevel(totalScore);
  const levelCfg = LEVEL_CONFIG[level];

  const answered = countAnswered(allItemValues);
  const allAnswered = answered === TOTAL_ITEMS;
  const completionPct = Math.round((answered / TOTAL_ITEMS) * 100);
  const ringOffset = RING_CIRCUMFERENCE * (1 - completionPct / 100);
  const ringColor = allAnswered ? '#16a34a' : completionPct >= 50 ? '#f59e0b' : '#4f46e5';

  const sectionScores = [
    { label: 'Pre-implementación', score: preScore, max: 28, sectionId: 'pre' },
    { label: 'Ejecución', score: execScore, max: 21, sectionId: 'exec' },
    { label: 'Evaluación', score: evalScore, max: 12, sectionId: 'eval' },
  ];

  // ── IA Report state ────────────────────────────────────────────────────────
  const storageKey = hospitalId
    ? `ia-report-${hospitalId}-${evaluacionId ?? 'draft'}`
    : null;

  const [showIAModal, setShowIAModal] = useState(false);
  const [iaPhase, setIAPhase] = useState<'loading' | 'result'>('loading');
  const [iaReport, setIAReport] = useState<IAReport | null>(() => {
    if (!storageKey) return null;
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as IAReport) : null;
    } catch {
      return null;
    }
  });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState('Procesando categorías...');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // ── AI enhancement state ───────────────────────────────────────────────────
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedSummary, setEnhancedSummary] = useState<string | null>(null);
  const [enhancedProvider, setEnhancedProvider] = useState<AIResponse['provider'] | null>(null);

  // ── Partial export modal state ─────────────────────────────────────────────
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>(['pre', 'exec', 'eval']);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openCachedReport = () => {
    if (iaReport) {
      setIAPhase('result');
      setShowIAModal(true);
    }
  };

  const handleGenerateIA = () => {
    setIAPhase('loading');
    setLoadingProgress(0);
    setLoadingStep('Procesando categorías...');
    setShowIAModal(true);

    const STEPS = [
      { pct: 33, msg: 'Identificando patrones...', delay: 1000 },
      { pct: 66, msg: 'Generando recomendaciones...', delay: 2000 },
      { pct: 100, msg: 'Finalizando análisis...', delay: 2800 },
    ] as const;

    STEPS.forEach(({ pct, msg, delay }) => {
      setTimeout(() => {
        setLoadingProgress(pct);
        setLoadingStep(msg);
      }, delay);
    });

    setTimeout(() => {
      const report = generateIAReport(
        { allItemValues, observations },
        hospitalName ?? 'Hospital',
      );
      setIAReport(report);
      setIAPhase('result');
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(report));
        } catch {
          // Ignore storage errors
        }
      }
    }, 3200);
  };

  const copyToClipboard = async () => {
    if (!iaReport) return;
    try {
      await navigator.clipboard.writeText(
        formatIAReportAsText(iaReport, hospitalName ?? 'Hospital'),
      );
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch {
      // Ignore clipboard errors
    }
  };

  const handleEnhanceAI = async () => {
    if (!iaReport) return;
    setIsEnhancing(true);
    try {
      const result = await enhanceReportWithAI(iaReport, hospitalName ?? 'Hospital');
      setEnhancedSummary(result.summary);
      setEnhancedProvider(result.provider);
    } catch {
      // Silently fail — keep original summary
    } finally {
      setIsEnhancing(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((s) => s !== sectionId)
        : [...prev, sectionId],
    );
  };

  const handleExportSelected = () => {
    if (selectedSections.length === 0) return;
    if (selectedSections.length === 3) {
      onExport();
    } else {
      onExportPartial?.(selectedSections);
    }
    setShowExportModal(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
        Resumen de Evaluación
      </h2>

      {/* Section mini scores */}
      <div className="space-y-3">
        {sectionScores.map(({ label, score, max, sectionId }) => (
          <div key={sectionId} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">{label}</span>
              <span className="text-xs font-semibold text-gray-700">
                {score} / {max}
              </span>
            </div>
            <ProgressBar
              progress={Math.round((score / max) * 100)}
              size="sm"
              showLabel={false}
              colorClass={SECTION_BARS[sectionId] ?? 'from-indigo-400 to-indigo-600'}
            />
          </div>
        ))}
      </div>

      {/* Completeness Ring */}
      <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
        <svg width="48" height="48" className="shrink-0 -rotate-90">
          <circle cx="24" cy="24" r={RING_RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="4" />
          <circle
            cx="24"
            cy="24"
            r={RING_RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth="4"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={ringOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
          />
        </svg>
        <div>
          <p className="text-sm font-semibold text-gray-700">
            {answered} / {TOTAL_ITEMS}
          </p>
          <p className="text-xs text-gray-500">ítems respondidos</p>
        </div>
      </div>

      {/* Total Score */}
      <div className="bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100">
        <p className="text-xs text-indigo-500 uppercase tracking-wide mb-1">Puntaje Total</p>
        <motion.p
          key={totalScore}
          initial={{ scale: 0.9, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className={`text-4xl font-bold ${levelCfg.scoreColor}`}
        >
          {totalScore}
        </motion.p>
        <p className="text-xs text-gray-400 mt-0.5">de 61 puntos</p>
        <ProgressBar
          progress={Math.round((totalScore / 61) * 100)}
          size="md"
          showLabel={false}
          colorClass="from-indigo-400 to-indigo-600"
        />
      </div>

      {/* Level Badge */}
      <motion.div
        key={level}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`rounded-lg px-4 py-3 border text-center ${levelCfg.color}`}
      >
        <p className="text-sm font-bold">{levelCfg.label}</p>
        <p className="text-xs opacity-75">{levelCfg.desc}</p>
      </motion.div>

      {/* IA Risk Badge (persisted) */}
      {iaReport && (
        <div
          className={`rounded-lg px-3 py-2 border flex items-center gap-2 text-xs font-medium ${RISK_COLORS[iaReport.nivelRiesgo].badge}`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Riesgo IA: {iaReport.nivelRiesgo}</span>
          <button
            onClick={openCachedReport}
            className="ml-auto underline hover:no-underline text-xs min-h-[44px]"
          >
            Ver análisis
          </button>
        </div>
      )}

      {/* Observations */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Observaciones
        </label>
        <textarea
          value={observations}
          onChange={(e) => onObservationsChange(e.target.value)}
          rows={4}
          placeholder="Notas o comentarios sobre la evaluación..."
          className="w-full text-xs text-gray-700 border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-shadow bg-white"
        />
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-2">
        <button
          onClick={onSave}
          disabled={isSaving || answered === 0}
          title={answered === 0 ? 'Responde al menos un ítem para guardar' : undefined}
          className={`w-full flex items-center justify-center gap-2 min-h-[44px] text-sm font-medium rounded-lg px-4 transition-colors ${
            answered === 0 || isSaving
              ? 'bg-indigo-300 cursor-not-allowed text-white'
              : allAnswered
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'border border-indigo-300 text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving
            ? 'Guardando...'
            : allAnswered
              ? 'Finalizar Evaluación ✓'
              : answered === 0
                ? 'Guardar Evaluación'
                : 'Guardar como borrador'}
        </button>

        <button
          onClick={() => setShowExportModal(true)}
          className="w-full flex items-center justify-center gap-2 min-h-[44px] border border-indigo-300 text-indigo-600 hover:bg-indigo-50 text-sm font-medium rounded-lg px-4 transition-colors"
        >
          <FileDown className="w-4 h-4" />
          Exportar PDF
        </button>

        <button
          onClick={handleGenerateIA}
          className="w-full flex items-center justify-center gap-2 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Generar Reporte IA
        </button>
      </div>

      {/* ── PARTIAL EXPORT MODAL ── */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-800">Seleccionar secciones a exportar</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-3">
              {PROA_SECTIONS.map((section) => {
                const { count, total } = getSectionAnsweredCount(section.id, allItemValues);
                const hasData = count > 0;
                const isChecked = selectedSections.includes(section.id);
                return (
                  <label
                    key={section.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      hasData
                        ? isChecked
                          ? 'border-indigo-300 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={!hasData}
                      onChange={() => toggleSection(section.id)}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <span className="flex-1 text-sm font-medium text-gray-700">
                      {SECTION_LABELS[section.id]}
                    </span>
                    {hasData ? (
                      <span className="text-xs font-medium text-green-600 shrink-0">
                        {count}/{total} eval.
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 shrink-0">Sin datos</span>
                    )}
                  </label>
                );
              })}
            </div>

            <div className="flex items-center gap-2 px-6 pb-6">
              <button
                onClick={handleExportSelected}
                disabled={selectedSections.length === 0}
                className="flex-1 flex items-center justify-center gap-2 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                <FileDown className="w-4 h-4" />
                {selectedSections.length === 3 ? 'Exportar todo' : 'Exportar seleccionadas'}
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="min-h-[44px] px-4 text-sm text-gray-500 hover:text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── IA REPORT MODAL ── */}
      {showIAModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="max-w-3xl w-full mx-auto my-10 bg-white rounded-2xl shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
                Reporte Inteligente PROA
              </h2>
              {iaPhase === 'result' && (
                <button
                  onClick={() => setShowIAModal(false)}
                  className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Phase 1 — Loading */}
            {iaPhase === 'loading' && (
              <div className="flex flex-col items-center gap-6 py-12 px-8">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-800 mb-2">
                    Analizando resultados...
                  </p>
                  <p className="text-sm text-gray-500">{loadingStep}</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Phase 2/3 — Result */}
            {iaPhase === 'result' && iaReport && (
              <div className="px-8 py-6 space-y-6">
                {/* Risk level header */}
                <div className={`rounded-xl p-4 flex items-center gap-4 ${RISK_COLORS[iaReport.nivelRiesgo].box}`}>
                  <div
                    className={`w-4 h-4 rounded-full shrink-0 ${RISK_COLORS[iaReport.nivelRiesgo].dot} ${
                      iaReport.nivelRiesgo === 'CRITICO' ? 'animate-pulse' : ''
                    }`}
                  />
                  <div>
                    <p className="text-xs uppercase tracking-wide opacity-70 mb-0.5">
                      Nivel de Riesgo
                    </p>
                    <p className={`text-xl font-bold ${RISK_COLORS[iaReport.nivelRiesgo].text}`}>
                      {iaReport.nivelRiesgo}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-3xl font-bold text-gray-800">
                      {iaReport.puntuacionGlobal}
                      <span className="text-sm font-normal text-gray-400">/61</span>
                    </p>
                    <p className="text-xs text-gray-500">puntos globales</p>
                  </div>
                </div>

                {/* Resumen ejecutivo */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Resumen Ejecutivo</h3>
                    {enhancedProvider && (
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Generado con IA · {enhancedProvider === 'groq' ? 'Groq' : 'OpenRouter'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {enhancedSummary ?? iaReport.resumenEjecutivo}
                  </p>
                  {!enhancedSummary && (
                    <button
                      onClick={handleEnhanceAI}
                      disabled={isEnhancing}
                      className="mt-3 flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isEnhancing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      {isEnhancing ? 'Mejorando...' : '✨ Mejorar resumen con IA'}
                    </button>
                  )}
                </div>

                {/* Fortalezas */}
                {iaReport.fortalezas.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      Fortalezas ({iaReport.fortalezas.length})
                    </h3>
                    <ul className="space-y-1.5">
                      {iaReport.fortalezas.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-green-500 shrink-0 mt-0.5 font-bold">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Áreas de oportunidad */}
                {iaReport.areasDeOportunidad.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      Áreas de Oportunidad ({iaReport.areasDeOportunidad.length})
                    </h3>
                    <ul className="space-y-1.5">
                      {iaReport.areasDeOportunidad.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recomendaciones */}
                {iaReport.recomendaciones.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Recomendaciones de Mejora ({iaReport.recomendaciones.length})
                    </h3>
                    <div className="space-y-3">
                      {iaReport.recomendaciones.map((rec, i) => (
                        <div key={i} className="border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                PRIORIDAD_COLORS[rec.prioridad] ?? 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {rec.prioridad.replace('_', ' ')}
                            </span>
                            <span className="text-sm font-medium text-gray-700 truncate">
                              {rec.categoria}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">
                            <span className="font-medium">Acción:</span> {rec.accion}
                          </p>
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Impacto esperado:</span>{' '}
                            {rec.impactoEsperado}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conclusión */}
                <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-4">
                  <h3 className="text-sm font-semibold text-indigo-700 mb-1.5">Conclusión</h3>
                  <p className="text-sm text-indigo-800 leading-relaxed">{iaReport.conclusión}</p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => exportIAReportPDF(iaReport, hospitalName ?? 'Hospital')}
                    className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-lg px-4 min-h-[44px] transition-colors"
                  >
                    <FileDown className="w-4 h-4 shrink-0" />
                    Exportar PDF
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-lg px-4 min-h-[44px] transition-colors"
                  >
                    <Copy className="w-4 h-4 shrink-0" />
                    {copiedToClipboard ? '¡Copiado!' : 'Copiar texto'}
                  </button>
                  <button
                    onClick={handleGenerateIA}
                    className="flex items-center gap-2 border border-indigo-300 text-indigo-600 hover:bg-indigo-50 text-sm font-medium rounded-lg px-4 min-h-[44px] transition-colors"
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    Regenerar
                  </button>
                  <button
                    onClick={() => setShowIAModal(false)}
                    className="ml-auto text-sm text-gray-500 hover:text-gray-700 min-h-[44px] px-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
