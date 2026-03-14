// Evaluación PROA Module
export type { ComplianceValue, ProaSectionId, ProaSection } from './data/proaItems';
export {
  PROA_SECTIONS,
  getItemKey,
  getComplianceScore,
  computeSectionScore,
  computeAllScores,
  calculateLevel,
} from './data/proaItems';

export type { ProaEvaluation, ProaEvaluationInsert, ProaEvaluationUpdate } from './lib/evaluacion';
export {
  getEvaluations,
  getAllEvaluations,
  saveEvaluation,
  updateEvaluation,
  deleteEvaluation,
} from './lib/evaluacion';

export { generateEvaluacionPDF } from './lib/evaluacionPDF';

export { EvaluacionBoard } from './components/EvaluacionBoard';
export { EvaluacionCard } from './components/EvaluacionCard';
export { EvaluacionColumn } from './components/EvaluacionColumn';
export { EvaluacionComparativa } from './components/EvaluacionComparativa';
export { EvaluacionNavbar } from './components/EvaluacionNavbar';
export { EvaluacionSummary } from './components/EvaluacionSummary';
export { ProgressBar } from './components/ProgressBar';
