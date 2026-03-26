import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardCheck,
  Plus,
  ArrowLeft,
  CalendarDays,
  User,
  Trophy,
  BarChart2,
  Trash2,
  X,
  Save,
  Loader2,
  Building2,
  Check,
  Cloud,
  FileEdit,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import type { Hospital } from '../../lib/supabase/hospitals';
import { useAuth } from '../../contexts/AuthContext';
import { InfoTooltip } from '../components/Tooltip';
import type { ComplianceValue, ProaSectionId } from '../../modules/evaluacion/data/proaItems';
import {
  PROA_SECTIONS,
  computeAllScores,
  calculateLevel,
  getItemKey,
} from '../../modules/evaluacion/data/proaItems';
import type { ProaEvaluation } from '../../modules/evaluacion/lib/evaluacion';
import {
  getEvaluations,
  saveEvaluation,
  updateEvaluation,
  deleteEvaluation,
} from '../../modules/evaluacion/lib/evaluacion';
import { generateEvaluacionPDF, exportPartialEvaluation } from '../../modules/evaluacion/lib/evaluacionPDF';
import { EvaluacionBoard } from '../../modules/evaluacion/components/EvaluacionBoard';
import { EvaluacionSummary } from '../../modules/evaluacion/components/EvaluacionSummary';
import { EvaluacionComparativa } from '../../modules/evaluacion/components/EvaluacionComparativa';
import { useEvaluacionContext } from '../../modules/evaluacion/context/EvaluacionContext';
import { useEvaluaciones } from '../../modules/evaluacion/hooks/useEvaluaciones';
import type { Evaluacion as EvaluacionRecord } from '../../modules/evaluacion/types';
import type { ComplianceValueDB } from '../../modules/evaluacion/types';

type ViewMode = 'list' | 'board' | 'comparativa';
type AutoSaveStatus = 'idle' | 'saving' | 'saved';
type ProgressTone = 'indigo' | 'amber' | 'teal';

const LEVEL_CONFIG = {
  avanzado: { label: 'Avanzado', className: 'bg-green-100 text-green-700 border-green-200' },
  basico: { label: 'Básico', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  inadecuado: { label: 'Inadecuado', className: 'bg-red-100 text-red-700 border-red-200' },
};

const TOTAL_ITEMS = 61;
const PROGRESS_SEGMENTS = 20;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const months = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function splitItemsBySection(
  allItemValues: Record<string, ComplianceValue>,
): Record<ProaSectionId, Record<string, ComplianceValue>> {
  const pre: Record<string, ComplianceValue> = {};
  const exec: Record<string, ComplianceValue> = {};
  const evalItems: Record<string, ComplianceValue> = {};
  Object.entries(allItemValues).forEach(([key, val]) => {
    if (key.startsWith('pre-')) pre[key] = val;
    else if (key.startsWith('exec-')) exec[key] = val;
    else if (key.startsWith('eval-')) evalItems[key] = val;
  });
  return { pre, exec, eval: evalItems };
}

function countAnsweredItems(allItemValues: Record<string, ComplianceValue>): number {
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

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getProgressSegmentClassName(active: boolean, tone: ProgressTone): string {
  if (!active) {
    return 'bg-gray-200';
  }

  switch (tone) {
    case 'amber':
      return 'bg-amber-500';
    case 'teal':
      return 'bg-teal-500';
    default:
      return 'bg-indigo-500';
  }
}

interface SegmentedProgressBarProps {
  value: number;
  tone?: ProgressTone;
}

function SegmentedProgressBar({ value, tone = 'indigo' }: SegmentedProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, Math.round(value)));
  const filledSegments = Math.round((clampedValue / 100) * PROGRESS_SEGMENTS);

  return (
    <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1">
      {Array.from({ length: PROGRESS_SEGMENTS }, (_, index) => (
        <div
          key={`progress-segment-${tone}-${index}`}
          className={`h-2 rounded-full ${getProgressSegmentClassName(index < filledSegments, tone)}`}
        />
      ))}
    </div>
  );
}

export function Evaluacion() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { hospitals, selectedHospitalId, setSelectedHospitalId, hospitalsLoading } =
    useEvaluacionContext();

  const [evaluations, setEvaluations] = useState<ProaEvaluation[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingEvalId, setEditingEvalId] = useState<string | null>(null);
  const [allItemValues, setAllItemValues] = useState<Record<string, ComplianceValue>>({});
  const [observations, setObservations] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Draft / autosave
  const {
    borradores,
    loading: draftsLoading,
    createDraft,
    deleteDraft,
    completarEvaluacion,
    loadRespuestas,
    batchSaveRespuestas,
  } = useEvaluaciones(selectedHospitalId);

  const [draftEvalId, setDraftEvalId] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId) ?? null;

  useEffect(() => {
    if (!selectedHospitalId) {
      setEvaluations([]);
      setAllItemValues({});
      setObservations('');
      return;
    }
    setIsLoading(true);
    getEvaluations(selectedHospitalId)
      .then(setEvaluations)
      .finally(() => setIsLoading(false));
    setViewMode('list');
    setEditingEvalId(null);
    setConfirmDeleteId(null);
    setDraftEvalId(null);
    setAllItemValues({});
    setObservations('');
  }, [selectedHospitalId]);

  // Auto-save effect (debounced 800ms)
  useEffect(() => {
    if (!draftEvalId || viewMode !== 'board') return;
    const answeredCount = countAnsweredItems(allItemValues);
    if (answeredCount === 0) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (resetStatusTimerRef.current) clearTimeout(resetStatusTimerRef.current);
    setAutoSaveStatus('saving');

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const progressPct = Math.round((answeredCount / TOTAL_ITEMS) * 100);
        await batchSaveRespuestas(
          draftEvalId,
          allItemValues as Record<string, ComplianceValueDB>,
          progressPct,
        );
        setAutoSaveStatus('saved');
        resetStatusTimerRef.current = setTimeout(() => setAutoSaveStatus('idle'), 2500);
      } catch {
        setAutoSaveStatus('idle');
      }
    }, 800);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [allItemValues, draftEvalId, viewMode, batchSaveRespuestas]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (resetStatusTimerRef.current) clearTimeout(resetStatusTimerRef.current);
    };
  }, []);

  // Fire-and-forget draft save on browser unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const answeredCount = countAnsweredItems(allItemValues);
      if (draftEvalId && viewMode === 'board' && answeredCount > 0) {
        const progressPct = Math.round((answeredCount / TOTAL_ITEMS) * 100);
        void batchSaveRespuestas(
          draftEvalId,
          allItemValues as Record<string, ComplianceValueDB>,
          progressPct,
        );
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [draftEvalId, allItemValues, viewMode, batchSaveRespuestas]);

  const handleItemChange = useCallback((key: string, value: ComplianceValue) => {
    setAllItemValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const startFreshEvaluation = useCallback(async () => {
    if (!selectedHospital || !profile) return;
    setAllItemValues({});
    setObservations('');
    setEditingEvalId(null);
    setAutoSaveStatus('idle');
    try {
      const draft = await createDraft({
        hospital_id: selectedHospital.id,
        hospital_name: selectedHospital.name,
        evaluator_name: profile.full_name,
        evaluation_date: new Date().toISOString().split('T')[0],
        status: 'borrador',
        proa_evaluation_id: null,
        total_score: null,
        level: null,
        progress_pct: 0,
        observations: null,
        created_by: profile.id,
      });
      setDraftEvalId(draft.id);
    } catch {
      setDraftEvalId(null);
    }
    setViewMode('board');
  }, [selectedHospital, profile, createDraft]);

  const handleNewEvaluation = useCallback(() => {
    if (borradores.length > 0) {
      setShowResumeDialog(true);
      return;
    }
    startFreshEvaluation();
  }, [borradores.length, startFreshEvaluation]);

  const handleContinueDraft = useCallback(async (draft: EvaluacionRecord) => {
    setShowResumeDialog(false);
    try {
      const respuestas = await loadRespuestas(draft.id);
      setAllItemValues(respuestas as Record<string, ComplianceValue>);
      setObservations(draft.observations ?? '');
      setEditingEvalId(null);
      setDraftEvalId(draft.id);
      setAutoSaveStatus('idle');
      setViewMode('board');
    } catch {
      toast.error('Error al cargar el borrador');
    }
  }, [loadRespuestas]);

  const handleDiscardAndNew = useCallback(async () => {
    setShowResumeDialog(false);
    for (const draft of borradores) {
      try { await deleteDraft(draft.id); } catch { /* non-critical */ }
    }
    await startFreshEvaluation();
  }, [borradores, deleteDraft, startFreshEvaluation]);

  const handleDeleteDraft = useCallback(async (id: string) => {
    try {
      await deleteDraft(id);
      toast.success('Borrador eliminado');
    } catch {
      toast.error('Error al eliminar el borrador');
    }
  }, [deleteDraft]);

  const handleViewDetail = (evaluation: ProaEvaluation) => {
    const merged: Record<string, ComplianceValue> = {
      ...evaluation.pre_items,
      ...evaluation.exec_items,
      ...evaluation.eval_items,
    };
    setAllItemValues(merged);
    setObservations(evaluation.observations ?? '');
    setEditingEvalId(evaluation.id);
    setDraftEvalId(null);
    setViewMode('board');
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteEvaluation(id);
      setConfirmDeleteId(null);
      if (selectedHospitalId) {
        const updated = await getEvaluations(selectedHospitalId);
        setEvaluations(updated);
      }
      toast.success('Evaluación eliminada correctamente');
    } catch {
      toast.error('Error al eliminar la evaluación');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async () => {
    if (!selectedHospital || !profile) return;

    const answeredCount = countAnsweredItems(allItemValues);
    if (answeredCount === 0) return;

    // Partial save — save as borrador (do not write to proa_evaluations)
    if (answeredCount < TOTAL_ITEMS && draftEvalId) {
      setIsSaving(true);
      try {
        const progressPct = Math.round((answeredCount / TOTAL_ITEMS) * 100);
        await batchSaveRespuestas(
          draftEvalId,
          allItemValues as Record<string, ComplianceValueDB>,
          progressPct,
        );
        localStorage.setItem(`draft-evaluacion-${selectedHospital.id}`, draftEvalId);
        setAllItemValues({});
        setObservations('');
        toast.success('Evaluación guardada como borrador');
        setDraftEvalId(null);
        setViewMode('list');
      } catch {
        toast.error('Error al guardar el borrador');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    const { preScore, execScore, evalScore, totalScore } =
      computeAllScores(allItemValues);
    const level = calculateLevel(totalScore);
    const split = splitItemsBySection(allItemValues);
    const today = new Date().toISOString().split('T')[0];

    const evalData = {
      hospital_id: selectedHospital.id,
      hospital_name: selectedHospital.name,
      evaluator_name: profile.full_name,
      evaluation_date: editingEvalId
        ? (evaluations.find((e) => e.id === editingEvalId)?.evaluation_date ?? today)
        : today,
      period_month: new Date().getMonth() + 1,
      period_year: new Date().getFullYear(),
      pre_items: split.pre,
      pre_score: preScore,
      pre_max: 28,
      exec_items: split.exec,
      exec_score: execScore,
      exec_max: 21,
      eval_items: split.eval,
      eval_score: evalScore,
      eval_max: 12,
      total_score: totalScore,
      total_max: 61,
      level,
      observations: observations.trim() || null,
      created_by: profile.id,
    };

    setIsSaving(true);
    try {
      let savedProaId: string | null = null;
      if (editingEvalId) {
        await updateEvaluation(editingEvalId, evalData);
        savedProaId = editingEvalId;
      } else {
        const result = await saveEvaluation(evalData);
        savedProaId = result.data?.id ?? null;
      }

      // Complete the draft record if tracking
      if (draftEvalId && savedProaId) {
        try {
          await completarEvaluacion(draftEvalId, savedProaId, totalScore, level);
        } catch { /* non-critical */ }
        setDraftEvalId(null);
      }

      const updated = await getEvaluations(selectedHospital.id);
      setEvaluations(updated);
      setAllItemValues({});
      setObservations('');
      setViewMode('list');
      setEditingEvalId(null);
      toast.success(editingEvalId ? 'Evaluación actualizada correctamente' : 'Evaluación guardada correctamente');
    } catch {
      toast.error('Error al guardar la evaluación');
    } finally {
      setIsSaving(false);
    }
  };

  const saveCurrentDraft = useCallback(async () => {
    if (!draftEvalId || !selectedHospital) return;
    const answeredCount = countAnsweredItems(allItemValues);
    if (answeredCount === 0) return;
    const progressPct = Math.round((answeredCount / TOTAL_ITEMS) * 100);
    await batchSaveRespuestas(
      draftEvalId,
      allItemValues as Record<string, ComplianceValueDB>,
      progressPct,
    );
    localStorage.setItem(`draft-evaluacion-${selectedHospital.id}`, draftEvalId);
  }, [draftEvalId, selectedHospital, allItemValues, batchSaveRespuestas]);

  const handleExitSave = useCallback(async () => {
    try {
      await saveCurrentDraft();
      toast.success('Borrador guardado correctamente');
    } catch {
      toast.error('Error al guardar el borrador');
    } finally {
      setShowExitDialog(false);
      setAllItemValues({});
      setObservations('');
      setDraftEvalId(null);
      setViewMode('list');
      setEditingEvalId(null);
    }
  }, [saveCurrentDraft]);

  const handleExitNoSave = useCallback(() => {
    const answeredCount = countAnsweredItems(allItemValues);
    if (draftEvalId && answeredCount === 0) {
      deleteDraft(draftEvalId).catch(() => {});
    } else if (selectedHospital) {
      localStorage.removeItem(`draft-evaluacion-${selectedHospital.id}`);
    }
    setShowExitDialog(false);
    setAllItemValues({});
    setObservations('');
    setDraftEvalId(null);
    setViewMode('list');
    setEditingEvalId(null);
  }, [allItemValues, draftEvalId, deleteDraft, selectedHospital]);

  const handleBack = useCallback(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    const answeredCount = countAnsweredItems(allItemValues);
    if (draftEvalId && answeredCount > 0) {
      setShowExitDialog(true);
      return;
    }
    setAllItemValues({});
    setObservations('');
    setDraftEvalId(null);
    setViewMode('list');
    setEditingEvalId(null);
  }, [allItemValues, draftEvalId]);

  const handleExport = () => {
    if (!selectedHospital) return;
    const { preScore, execScore, evalScore, totalScore } =
      computeAllScores(allItemValues);
    const level = calculateLevel(totalScore);
    generateEvaluacionPDF({
      hospitalName: selectedHospital.name,
      evaluatorName: profile?.full_name ?? '—',
      evaluationDate: new Date().toISOString().split('T')[0],
      preScore, execScore, evalScore, totalScore, level, allItemValues, observations,
    });
    toast.success('PDF exportado correctamente');
  };

  const handleExportPartial = (sections: string[]) => {
    if (!selectedHospital) return;
    const { preScore, execScore, evalScore, totalScore } = computeAllScores(allItemValues);
    const level = calculateLevel(totalScore);
    exportPartialEvaluation({
      hospitalName: selectedHospital.name,
      evaluatorName: profile?.full_name ?? '—',
      evaluationDate: new Date().toISOString().split('T')[0],
      preScore, execScore, evalScore, totalScore, level, allItemValues, observations,
      selectedSections: sections,
    });
    toast.success('PDF exportado correctamente');
  };

  const handleExportSection = (sectionId: string) => {
    if (!selectedHospital) return;
    const { preScore, execScore, evalScore, totalScore } = computeAllScores(allItemValues);
    const level = calculateLevel(totalScore);
    exportPartialEvaluation({
      hospitalName: selectedHospital.name,
      evaluatorName: profile?.full_name ?? '—',
      evaluationDate: new Date().toISOString().split('T')[0],
      preScore, execScore, evalScore, totalScore, level, allItemValues, observations,
      selectedSections: [sectionId],
    });
    const SECTION_NAMES: Record<string, string> = { pre: 'Pre-implementación', exec: 'Ejecución', eval: 'Evaluación' };
    toast.success(`Sección "${SECTION_NAMES[sectionId] ?? sectionId}" exportada como PDF`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {hospitalsLoading ? (
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : hospitals.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4 text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-sm max-w-sm w-full">
            <Building2 className="w-16 h-16 text-gray-200" />
            <div>
              <p className="text-base font-semibold text-gray-700">Aún no has creado ningún hospital</p>
              <p className="text-sm text-gray-400 mt-1">Crea el primero para comenzar a registrar intervenciones PROA.</p>
            </div>
            <button
              onClick={() => navigate('/hospitales')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-5 min-h-[44px] transition-colors"
            >
              Crear mi primer hospital
            </button>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <ListContent
          selectedHospital={selectedHospital}
          evaluations={evaluations}
          borradores={borradores}
          draftsLoading={draftsLoading}
          isLoading={isLoading}
          onNewEvaluation={handleNewEvaluation}
          onViewDetail={handleViewDetail}
          onViewComparativa={() => setViewMode('comparativa')}
          onContinueDraft={handleContinueDraft}
          onDeleteDraft={handleDeleteDraft}
          confirmDeleteId={confirmDeleteId}
          deletingId={deletingId}
          onConfirmDelete={setConfirmDeleteId}
          onCancelDelete={() => setConfirmDeleteId(null)}
          onDelete={handleDelete}
        />
      ) : viewMode === 'comparativa' ? (
        <ComparativaContent
          evaluations={evaluations}
          selectedHospital={selectedHospital}
          onBack={() => setViewMode('list')}
        />
      ) : (
        <BoardContent
          allItemValues={allItemValues}
          observations={observations}
          isSaving={isSaving}
          isEditing={editingEvalId !== null}
          editingEvalId={editingEvalId}
          selectedHospital={selectedHospital}
          autoSaveStatus={autoSaveStatus}
          hasDraft={draftEvalId !== null}
          onBack={handleBack}
          onItemChange={handleItemChange}
          onObservationsChange={setObservations}
          onSave={handleSave}
          onExport={handleExport}
          onExportPartial={handleExportPartial}
          onExportSection={handleExportSection}
        />
      )}

      {/* Resume Draft Dialog */}
      <AnimatePresence>
        {showResumeDialog && borradores.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResumeDialog(false)}
              className="fixed inset-0 z-50 bg-black/40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <div className="pointer-events-auto bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                    <FileEdit className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">
                      Borrador sin completar
                    </h3>
                    <p className="text-xs text-gray-400">
                      {formatDate(borradores[0].updated_at.split('T')[0])}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 mb-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500">Progreso guardado</span>
                    <span className="text-xs font-semibold text-indigo-600">
                      {borradores[0].progress_pct}%
                    </span>
                  </div>
                  <SegmentedProgressBar tone="indigo" value={borradores[0].progress_pct} />
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleContinueDraft(borradores[0])}
                    className="w-full min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    Continuar borrador
                  </button>
                  <button
                    onClick={handleDiscardAndNew}
                    className="w-full min-h-[44px] border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition-colors"
                  >
                    Descartar y empezar de nuevo
                  </button>
                  <button
                    onClick={() => setShowResumeDialog(false)}
                    className="w-full min-h-[44px] text-gray-400 hover:text-gray-600 text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Exit Dialog — shown when user clicks ← Volver with unsaved answers */}
      <AnimatePresence>
        {showExitDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <div className="pointer-events-auto bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
                <h3 className="text-base font-semibold text-gray-800 mb-2">
                  ¿Guardar evaluación?
                </h3>
                <p className="text-sm text-gray-500 mb-5">
                  Tu progreso se guardará como borrador. Podrás continuarla después.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleExitSave}
                    className="w-full min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    Guardar y salir
                  </button>
                  <button
                    onClick={handleExitNoSave}
                    className="w-full min-h-[44px] border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-xl transition-colors"
                  >
                    Salir sin guardar
                  </button>
                  <button
                    onClick={() => setShowExitDialog(false)}
                    className="w-full min-h-[44px] text-gray-400 hover:text-gray-600 text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components (private to this page) ────────────────────────────────────

interface ListContentProps {
  selectedHospital: Hospital | null;
  evaluations: ProaEvaluation[];
  borradores: EvaluacionRecord[];
  draftsLoading: boolean;
  isLoading: boolean;
  onNewEvaluation: () => void;
  onViewDetail: (evaluation: ProaEvaluation) => void;
  onViewComparativa: () => void;
  onContinueDraft: (draft: EvaluacionRecord) => void;
  onDeleteDraft: (id: string) => void;
  confirmDeleteId: string | null;
  deletingId: string | null;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onDelete: (id: string) => Promise<void>;
}

function ListContent({
  selectedHospital,
  evaluations,
  borradores,
  draftsLoading,
  isLoading,
  onNewEvaluation,
  onViewDetail,
  onViewComparativa,
  onContinueDraft,
  onDeleteDraft,
  confirmDeleteId,
  deletingId,
  onConfirmDelete,
  onCancelDelete,
  onDelete,
}: ListContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] =
    useState<'todos' | 'avanzado' | 'basico' | 'inadecuado'>('todos');
  const bestScore =
    evaluations.length > 0 ? Math.max(...evaluations.map((e) => e.total_score)) : 0;
  const latestLevel = evaluations.length > 0 ? (evaluations[0].level ?? 'inadecuado') : null;
  const filteredEvaluations = useMemo(() => {
    const query = normalizeText(searchQuery.trim());

    return evaluations.filter((evaluation) => {
      const matchesLevel = levelFilter === 'todos' || evaluation.level === levelFilter;
      const matchesQuery =
        query.length === 0 ||
        normalizeText(evaluation.evaluator_name).includes(query) ||
        normalizeText(evaluation.hospital_name).includes(query) ||
        normalizeText(evaluation.evaluation_date).includes(query) ||
        normalizeText(LEVEL_CONFIG[evaluation.level ?? 'inadecuado'].label).includes(query);

      return matchesLevel && matchesQuery;
    });
  }, [evaluations, levelFilter, searchQuery]);

  return (
    <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-800">Evaluaciones PROA</h1>
            <InfoTooltip content="Registro individual de cada intervencion del equipo PROA" />
          </div>
          {selectedHospital ? (
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedHospital.name} - revisa borradores pendientes o abre evaluaciones completadas.
            </p>
          ) : null}
        </div>
        {selectedHospital ? (
          <div className="flex items-center gap-2">
            {evaluations.length >= 2 ? (
              <button
                onClick={onViewComparativa}
                className="flex items-center gap-2 border border-indigo-300 text-indigo-600 hover:bg-indigo-50 text-sm font-medium rounded-lg px-4 min-h-[44px] transition-colors"
              >
                <BarChart2 className="w-4 h-4" />
                <span className="hidden sm:inline">Ver comparativa</span>
              </button>
            ) : null}
            <button
              onClick={onNewEvaluation}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 min-h-[44px] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva evaluacion</span>
            </button>
          </div>
        ) : null}
      </div>

      {selectedHospital ? (
        <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-2 text-sm text-indigo-900 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-semibold">Flujo recomendado para hoy</p>
              <p className="mt-1 text-indigo-700">
                Primero revisa borradores pendientes, luego abre evaluaciones completadas y registra una nueva intervencion si hace falta.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium text-indigo-700">
              <span className="rounded-full border border-indigo-200 bg-white px-3 py-1">1. Borradores</span>
              <span className="rounded-full border border-indigo-200 bg-white px-3 py-1">2. Evaluaciones guardadas</span>
              <span className="rounded-full border border-indigo-200 bg-white px-3 py-1">3. Nueva evaluacion</span>
            </div>
          </div>
        </div>
      ) : null}

      {selectedHospital && evaluations.length > 0 ? (
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6 bg-white rounded-xl border border-gray-200 px-5 py-3 shadow-sm text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Evaluaciones:</span>
            <span className="font-semibold text-gray-800">{evaluations.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Ultima:</span>
            <span className="font-semibold text-gray-800">{formatDate(evaluations[0].evaluation_date)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400">Mejor puntaje:</span>
            <span className="font-semibold text-indigo-600">{bestScore}</span>
          </div>
          {latestLevel ? (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">Nivel actual:</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${LEVEL_CONFIG[latestLevel].className}`}>
                {LEVEL_CONFIG[latestLevel].label}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {evaluations.length > 0 || borradores.length > 0 || draftsLoading ? (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar por evaluador, fecha o nivel"
                className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
              />
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <SlidersHorizontal className="h-4 w-4 text-gray-400" />
              <select
                value={levelFilter}
                onChange={(event) =>
                  setLevelFilter(event.target.value as 'todos' | 'avanzado' | 'basico' | 'inadecuado')
                }
                className="w-full bg-transparent text-sm text-gray-700 outline-none"
              >
                <option value="todos">Todos los niveles</option>
                <option value="avanzado">Avanzado</option>
                <option value="basico">Basico</option>
                <option value="inadecuado">Inadecuado</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-col gap-1 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <span>Busca rapido por profesional, fecha o nivel de cumplimiento.</span>
            <span>{filteredEvaluations.length} resultado(s) visibles</span>
          </div>
        </div>
      ) : null}

      {!selectedHospital ? (
        <EmptyState
          icon={<ClipboardCheck className="w-20 h-20 text-gray-300" />}
          title="Primero selecciona o crea un hospital para comenzar"
          subtitle="Necesitas un hospital activo para ver y registrar evaluaciones PROA."
          action={
            <button
              onClick={() => navigate('/hospitales')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 min-h-[44px] transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Crear hospital
            </button>
          }
        />
      ) : isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <>
          {borradores.length > 0 ? (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <FileEdit className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-gray-600">Borradores pendientes ({borradores.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {borradores.map((draft) => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    onContinue={onContinueDraft}
                    onDelete={onDeleteDraft}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {evaluations.length === 0 && borradores.length === 0 ? (
            <EmptyState
              icon={<ClipboardCheck className="w-20 h-20 text-gray-300" />}
              title="Aun no tienes evaluaciones"
              subtitle="Sube un archivo Excel o crea una evaluacion manual para comenzar con este hospital."
              action={
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => navigate('/hospitales')}
                    className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg px-4 min-h-[44px] transition-colors"
                  >
                    <Building2 className="w-4 h-4" />
                    Subir Excel
                  </button>
                  <button
                    onClick={onNewEvaluation}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 min-h-[44px] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Crear evaluacion manual
                  </button>
                </div>
              }
            />
          ) : filteredEvaluations.length === 0 && evaluations.length > 0 ? (
            <EmptyState
              icon={<Search className="w-20 h-20 text-gray-300" />}
              title="No hay evaluaciones con esos filtros"
              subtitle="Ajusta la busqueda o el nivel para volver a ver resultados."
              action={
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setLevelFilter('todos');
                  }}
                  className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg px-4 min-h-[44px] transition-colors"
                >
                  Limpiar filtros
                </button>
              }
            />
          ) : evaluations.length > 0 ? (
            <>
              {borradores.length > 0 ? (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-gray-600">
                    Evaluaciones completadas ({evaluations.length})
                  </span>
                </div>
              ) : null}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEvaluations.map((evaluation) => (
                  <EvaluacionListCard
                    key={evaluation.id}
                    evaluation={evaluation}
                    onViewDetail={onViewDetail}
                    confirmDeleteId={confirmDeleteId}
                    deletingId={deletingId}
                    onConfirmDelete={onConfirmDelete}
                    onCancelDelete={onCancelDelete}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </>
          ) : null}
        </>
      )}
    </main>
  );
}

// ─── DraftCard ────────────────────────────────────────────────────────────────

interface DraftCardProps {
  draft: EvaluacionRecord;
  onContinue: (draft: EvaluacionRecord) => void;
  onDelete: (id: string) => void;
}

function DraftCard({ draft, onContinue, onDelete }: DraftCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 border border-amber-300">
              Borrador
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-700 mt-1">
            <CalendarDays className="w-3.5 h-3.5" />
            {formatDate(draft.updated_at.split('T')[0])}
          </div>
          <p className="mt-2 text-xs text-amber-700">
            Retoma la evaluacion exactamente donde quedo y completa los items faltantes.
          </p>
        </div>
        {!confirmDelete && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-9 h-9 flex items-center justify-center text-amber-400 hover:text-red-500 transition-colors rounded-lg min-h-[44px] min-w-[44px]"
            aria-label="Eliminar borrador"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-amber-700">Progreso</span>
          <span className="text-xs font-bold text-amber-800">{draft.progress_pct}%</span>
        </div>
        <SegmentedProgressBar tone="amber" value={draft.progress_pct} />
      </div>

      {confirmDelete ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700 font-medium text-center mb-2">Eliminar este borrador?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 min-h-[44px] border border-gray-200 text-gray-600 hover:bg-white text-sm font-medium rounded-lg transition-colors"
            >
              No
            </button>
            <button
              onClick={() => { setConfirmDelete(false); onDelete(draft.id); }}
              className="flex-1 min-h-[44px] bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Si, eliminar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => onContinue(draft)}
          className="w-full min-h-[44px] bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Continuar borrador
        </button>
      )}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      {icon}
      <div>
        <p className="text-base font-semibold text-gray-600">{title}</p>
        <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

// ─── EvaluacionListCard ───────────────────────────────────────────────────────

interface EvaluacionListCardProps {
  evaluation: ProaEvaluation;
  onViewDetail: (evaluation: ProaEvaluation) => void;
  confirmDeleteId: string | null;
  deletingId: string | null;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onDelete: (id: string) => Promise<void>;
}

function EvaluacionListCard({
  evaluation,
  onViewDetail,
  confirmDeleteId,
  deletingId,
  onConfirmDelete,
  onCancelDelete,
  onDelete,
}: EvaluacionListCardProps) {
  const level = evaluation.level ?? 'inadecuado';
  const levelCfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.inadecuado;
  const scorePercent =
    evaluation.total_max === 0 ? 0 : Math.round((evaluation.total_score / evaluation.total_max) * 100);
  const isConfirming = confirmDeleteId === evaluation.id;
  const isDeleting = deletingId === evaluation.id;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">Evaluacion clinica PROA</p>
          <p className="mt-1 text-xs text-gray-500 truncate">{evaluation.hospital_name}</p>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <CalendarDays className="w-3.5 h-3.5" />
              {formatDate(evaluation.evaluation_date)}
            </div>
            {evaluation.evaluator_name && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <User className="w-3.5 h-3.5" />
                {evaluation.evaluator_name}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${levelCfg.className}`}
          >
            {levelCfg.label}
          </span>
          {!isConfirming && (
            <button
              onClick={() => onConfirmDelete(evaluation.id)}
              className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors rounded-lg min-h-[44px] min-w-[44px]"
              aria-label="Eliminar evaluacion"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Score Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Trophy className="w-3.5 h-3.5" />
            Puntaje total
          </div>
          <span className="text-sm font-bold text-indigo-600">
            {evaluation.total_score} / {evaluation.total_max}
          </span>
        </div>
        <SegmentedProgressBar tone="teal" value={scorePercent} />
      </div>

      {/* Section Scores */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        {[
          { label: 'Pre', score: evaluation.pre_score, max: evaluation.pre_max },
          { label: 'Ejec.', score: evaluation.exec_score, max: evaluation.exec_max },
          { label: 'Eval.', score: evaluation.eval_score, max: evaluation.eval_max },
        ].map(({ label, score, max }) => (
          <div key={label} className="bg-gray-50 rounded-lg py-2">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-sm font-semibold text-gray-700">
              {score}/{max}
            </p>
          </div>
        ))}
      </div>

      {isConfirming ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700 font-medium text-center mb-2">Eliminar esta evaluacion?</p>
          <div className="flex gap-2">
            <button
              onClick={onCancelDelete}
              disabled={isDeleting}
              className="flex-1 min-h-[44px] border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-50 text-sm font-medium rounded-lg transition-colors"
            >
              No
            </button>
            <button
              onClick={() => onDelete(evaluation.id)}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isDeleting ? 'Eliminando...' : 'Si, eliminar'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => onViewDetail(evaluation)}
          className="w-full min-h-[44px] border border-indigo-300 text-indigo-600 hover:bg-indigo-50 text-sm font-medium rounded-lg transition-colors"
        >
          Abrir evaluacion
        </button>
      )}
    </div>
  );
}

// ─── BoardContent ─────────────────────────────────────────────────────────────

interface BoardContentProps {
  allItemValues: Record<string, ComplianceValue>;
  observations: string;
  isSaving: boolean;
  isEditing: boolean;
  editingEvalId: string | null;
  selectedHospital: Hospital | null;
  autoSaveStatus: AutoSaveStatus;
  hasDraft: boolean;
  onBack: () => void;
  onItemChange: (key: string, value: ComplianceValue) => void;
  onObservationsChange: (value: string) => void;
  onSave: () => void;
  onExport: () => void;
  onExportPartial?: (sections: string[]) => void;
  onExportSection?: (sectionId: string) => void;
}

function BoardContent({
  allItemValues,
  observations,
  isSaving,
  isEditing,
  editingEvalId,
  selectedHospital,
  autoSaveStatus,
  hasDraft,
  onBack,
  onItemChange,
  onObservationsChange,
  onSave,
  onExport,
  onExportPartial,
  onExportSection,
}: BoardContentProps) {
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  const { totalScore } = computeAllScores(allItemValues);
  const level = calculateLevel(totalScore);
  const mobileLevelCfg = LEVEL_CONFIG[level];
  const answered = countAnsweredItems(allItemValues);
  const allAnswered = answered === TOTAL_ITEMS;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Breadcrumb bar */}
      <div className="border-b border-gray-200 bg-white px-6 py-2.5 flex items-center gap-3 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Evaluaciones
        </button>
        {selectedHospital && (
          <>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-700 truncate max-w-[160px]">
              {selectedHospital.name}
            </span>
          </>
        )}
        {isEditing && (
          <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
            Editando
          </span>
        )}
        {hasDraft && !isEditing && (
          <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
            Borrador
          </span>
        )}

        {/* Auto-save status */}
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {autoSaveStatus === 'saving' && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5" />
              Guardando...
            </span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Guardado
            </span>
          )}
        </div>
      </div>

      {/* Board + Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Scrollable Board */}
        <div className="flex-1 overflow-auto p-6 pb-24 md:pb-6">
          <EvaluacionBoard
            allItemValues={allItemValues}
            onItemChange={onItemChange}
            onExportSection={onExportSection}
          />
        </div>

        {/* Fixed Summary Sidebar — desktop only */}
        <aside className="hidden md:block w-72 shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
          <EvaluacionSummary
            allItemValues={allItemValues}
            observations={observations}
            onObservationsChange={onObservationsChange}
            onSave={onSave}
            onExport={onExport}
            onExportPartial={onExportPartial}
            isSaving={isSaving}
            hospitalId={selectedHospital?.id}
            hospitalName={selectedHospital?.name}
            evaluacionId={editingEvalId ?? undefined}
          />
        </aside>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-sm font-bold text-gray-800 shrink-0">
              {totalScore}
              <span className="text-xs font-normal text-gray-400">/61</span>
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${mobileLevelCfg.className}`}
            >
              {mobileLevelCfg.label}
            </span>
          </div>
          {autoSaveStatus === 'saved' && (
            <span className="text-xs text-green-600 flex items-center gap-1 shrink-0">
              <Check className="w-3 h-3" />
              Guardado
            </span>
          )}
          <button
            onClick={() => setShowMobileSummary(true)}
            className="text-xs text-indigo-600 hover:underline shrink-0 min-h-[44px]"
          >
            Ver resumen
          </button>
          <button
            onClick={onSave}
            disabled={isSaving || answered === 0}
            title={answered === 0 ? 'Responde al menos un ítem para guardar' : undefined}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg px-3 min-h-[44px] transition-colors shrink-0"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Guardar
          </button>
        </div>
      </div>

      {/* Mobile Summary Overlay */}
      <AnimatePresence>
        {showMobileSummary && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileSummary(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Resumen</h3>
                <button
                  onClick={() => setShowMobileSummary(false)}
                  className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg min-h-[44px] min-w-[44px] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <EvaluacionSummary
                allItemValues={allItemValues}
                observations={observations}
                onObservationsChange={onObservationsChange}
                onSave={() => {
                  onSave();
                  setShowMobileSummary(false);
                }}
                onExport={onExport}
                onExportPartial={onExportPartial}
                isSaving={isSaving}
                hospitalId={selectedHospital?.id}
                hospitalName={selectedHospital?.name}
                evaluacionId={editingEvalId ?? undefined}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ComparativaContent ───────────────────────────────────────────────────────

interface ComparativaContentProps {
  evaluations: ProaEvaluation[];
  selectedHospital: Hospital | null;
  onBack: () => void;
}

function ComparativaContent({
  evaluations,
  selectedHospital,
  onBack,
}: ComparativaContentProps) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Breadcrumb bar */}
      <div className="border-b border-gray-200 bg-white px-6 py-2.5 flex items-center gap-4 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Evaluaciones
        </button>
        {selectedHospital && (
          <>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-700 truncate max-w-[160px]">
              {selectedHospital.name}
            </span>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-700">Comparativa</span>
          </>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <EvaluacionComparativa evaluations={evaluations} />
      </div>
    </div>
  );
}
