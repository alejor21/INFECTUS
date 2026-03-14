import { getSupabaseClient } from '../../../lib/supabase/client';
import type { ComplianceValue } from '../data/proaItems';

export type { ComplianceValue };

export interface ProaEvaluation {
  id: string;
  hospital_id: string;
  hospital_name: string;
  evaluator_name: string | null;
  evaluation_date: string;
  period_month: number | null;
  period_year: number | null;
  pre_items: Record<string, ComplianceValue>;
  pre_score: number;
  pre_max: number;
  exec_items: Record<string, ComplianceValue>;
  exec_score: number;
  exec_max: number;
  eval_items: Record<string, ComplianceValue>;
  eval_score: number;
  eval_max: number;
  total_score: number;
  total_max: number;
  level: 'avanzado' | 'basico' | 'inadecuado' | null;
  observations: string | null;
  created_by: string | null;
  created_at: string;
}

export type ProaEvaluationInsert = Omit<ProaEvaluation, 'id' | 'created_at'>;
export type ProaEvaluationUpdate = Partial<Omit<ProaEvaluation, 'id' | 'created_at'>>;

export const getEvaluations = async (hospitalId: string): Promise<ProaEvaluation[]> => {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('proa_evaluations')
    .select('*')
    .eq('hospital_id', hospitalId)
    .order('created_at', { ascending: false });
  return (data ?? []) as ProaEvaluation[];
};

export const getAllEvaluations = async (): Promise<ProaEvaluation[]> => {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('proa_evaluations')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []) as ProaEvaluation[];
};

export const saveEvaluation = async (evaluation: ProaEvaluationInsert) => {
  const supabase = getSupabaseClient();
  return supabase.from('proa_evaluations').insert(evaluation).select().single();
};

export const updateEvaluation = async (id: string, updates: ProaEvaluationUpdate) => {
  const supabase = getSupabaseClient();
  return supabase.from('proa_evaluations').update(updates).eq('id', id);
};

export const deleteEvaluation = async (id: string) => {
  const supabase = getSupabaseClient();
  return supabase.from('proa_evaluations').delete().eq('id', id);
};
