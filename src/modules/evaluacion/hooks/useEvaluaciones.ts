import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../../../lib/supabase/client';
import type {
  Evaluacion,
  EvaluacionInsert,
  EvaluacionUpdate,
  EvaluacionRespuesta,
  ComplianceValueDB,
} from '../types';

export function useEvaluaciones(hospitalId: string | null) {
  const [borradores, setBorradores] = useState<Evaluacion[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!hospitalId) {
      setBorradores([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await getSupabaseClient()
        .from('evaluaciones')
        .select('*')
        .eq('hospital_id', hospitalId)
        .eq('status', 'borrador')
        .order('updated_at', { ascending: false });
      setBorradores((data ?? []) as Evaluacion[]);
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createDraft = async (insert: EvaluacionInsert): Promise<Evaluacion> => {
    const { data, error } = await getSupabaseClient()
      .from('evaluaciones')
      .insert(insert)
      .select()
      .single();
    if (error) throw error;
    await refresh();
    return data as Evaluacion;
  };

  const updateDraft = async (id: string, updates: EvaluacionUpdate): Promise<void> => {
    const { error } = await getSupabaseClient()
      .from('evaluaciones')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  };

  const deleteDraft = async (id: string): Promise<void> => {
    const { error } = await getSupabaseClient()
      .from('evaluaciones')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await refresh();
  };

  const completarEvaluacion = async (
    id: string,
    proaEvaluationId: string,
    totalScore: number,
    level: 'avanzado' | 'basico' | 'inadecuado',
  ): Promise<void> => {
    const { error } = await getSupabaseClient()
      .from('evaluaciones')
      .update({
        status: 'completada',
        proa_evaluation_id: proaEvaluationId,
        total_score: totalScore,
        level,
        progress_pct: 100,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
    await refresh();
  };

  const loadRespuestas = async (
    evaluacionId: string,
  ): Promise<Record<string, ComplianceValueDB>> => {
    const { data, error } = await getSupabaseClient()
      .from('evaluacion_respuestas')
      .select('item_key, value')
      .eq('evaluacion_id', evaluacionId);
    if (error) throw error;
    const result: Record<string, ComplianceValueDB> = {};
    (data ?? []).forEach((r: Pick<EvaluacionRespuesta, 'item_key' | 'value'>) => {
      result[r.item_key] = r.value;
    });
    return result;
  };

  const batchSaveRespuestas = async (
    evaluacionId: string,
    itemValues: Record<string, ComplianceValueDB>,
    progressPct: number,
  ): Promise<void> => {
    const rows = Object.entries(itemValues).map(([key, value]) => ({
      evaluacion_id: evaluacionId,
      item_key: key,
      value,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length === 0) return;
    const { error } = await getSupabaseClient()
      .from('evaluacion_respuestas')
      .upsert(rows, { onConflict: 'evaluacion_id,item_key' });
    if (error) throw error;
    await getSupabaseClient()
      .from('evaluaciones')
      .update({ progress_pct: progressPct, updated_at: new Date().toISOString() })
      .eq('id', evaluacionId);
  };

  return {
    borradores,
    loading,
    refresh,
    createDraft,
    updateDraft,
    deleteDraft,
    completarEvaluacion,
    loadRespuestas,
    batchSaveRespuestas,
  };
}
