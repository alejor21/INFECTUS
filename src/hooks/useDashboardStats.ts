import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';

export interface RecentEval {
  id: string;
  hospital_name: string | null;
  status: string;
  created_at: string;
  progress_pct: number | null;
}

export interface DashboardStats {
  evalCount: number;
  lastEval: { created_at: string; status: string } | null;
  proaLevel: string | null;
  excelMonths: number;
  recentEvals: RecentEval[];
}

interface EvaluationStatusRow {
  created_at: string;
  status: string;
}

interface RecentEvaluationRow extends EvaluationStatusRow {
  id: string;
  hospital_name: string | null;
  progress_pct: number | null;
}

interface ProaLevelRow {
  level: string | null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'No se pudo cargar el resumen del dashboard.';
}

export function useDashboardStats(hospitalId: string | null) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!hospitalId) {
      setStats(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();

      const [
        { count: evalCount, error: evalCountError },
        { data: lastEvalRows, error: lastEvalError },
        { data: proaRows, error: proaError },
        { count: excelCount, error: excelError },
        { data: recentRows, error: recentError },
      ] = await Promise.all([
        supabase.from('evaluaciones').select('*', { count: 'exact', head: true }).eq('hospital_id', hospitalId),
        supabase
          .from('evaluaciones')
          .select('created_at, status')
          .eq('hospital_id', hospitalId)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('proa_evaluations')
          .select('level')
          .eq('hospital_id', hospitalId)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase.from('hospital_monthly_metrics').select('*', { count: 'exact', head: true }).eq('hospital_id', hospitalId),
        supabase
          .from('evaluaciones')
          .select('id, hospital_name, status, created_at, progress_pct')
          .eq('hospital_id', hospitalId)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const firstError = evalCountError ?? lastEvalError ?? proaError ?? excelError ?? recentError;
      if (firstError) throw firstError;

      const lastEval = ((lastEvalRows ?? []) as EvaluationStatusRow[])[0] ?? null;
      const latestProaLevel = ((proaRows ?? []) as ProaLevelRow[])[0]?.level ?? null;
      const recentEvals = ((recentRows ?? []) as RecentEvaluationRow[]).map((row) => ({
        id: row.id,
        hospital_name: row.hospital_name,
        status: row.status,
        created_at: row.created_at,
        progress_pct: row.progress_pct,
      }));

      setStats({
        evalCount: evalCount ?? 0,
        lastEval,
        proaLevel: latestProaLevel,
        excelMonths: excelCount ?? 0,
        recentEvals,
      });
    } catch (errorValue: unknown) {
      setStats(null);
      setError(getErrorMessage(errorValue));
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    stats,
    loading,
    error,
    refresh,
  };
}
