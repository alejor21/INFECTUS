import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

interface EvaluacionMonthRow {
  id: string;
  mes: number | null;
  anio: number | null;
}

function hasValidMonth(row: EvaluacionMonthRow): row is EvaluacionMonthRow & { mes: number; anio: number } {
  return row.mes !== null && row.mes > 0 && row.anio !== null && row.anio > 0;
}

export interface MesData {
  mes: number;
  anio: number;
  label: string;
  count: number;
  value: string;
}

interface UseDataManagementReturn {
  meses: MesData[];
  totalEvaluaciones: number;
  invalidCount: number;
  loading: boolean;
  error: string | null;
  deleteMes: (mes: number, anio: number) => Promise<void>;
  deleteAllData: () => Promise<void>;
  deleteInvalidData: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useDataManagement(hospitalId: string | null | undefined): UseDataManagementReturn {
  const [meses, setMeses] = useState<MesData[]>([]);
  const [totalEvaluaciones, setTotalEvaluaciones] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [invalidIds, setInvalidIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!hospitalId) {
      setMeses([]);
      setTotalEvaluaciones(0);
      setInvalidCount(0);
      setInvalidIds([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await getSupabaseClient()
        .from('evaluaciones')
        .select('id, mes, anio')
        .eq('hospital_id', hospitalId);

      if (fetchError) {
        throw fetchError;
      }

      const rows = (data ?? []) as EvaluacionMonthRow[];
      const validRows = rows.filter(hasValidMonth);
      const invalidRows = rows.filter((row) => !hasValidMonth(row));
      const monthMap = new Map<string, MesData>();

      for (const row of validRows) {
        const key = `${row.anio}-${row.mes}`;
        const previous = monthMap.get(key);
        monthMap.set(key, {
          mes: row.mes,
          anio: row.anio,
          label: `${MESES[row.mes - 1]} ${row.anio}`,
          count: (previous?.count ?? 0) + 1,
          value: `${row.anio}-${String(row.mes).padStart(2, '0')}`,
        });
      }

      const orderedMonths = Array.from(monthMap.values()).sort(
        (left, right) => right.anio - left.anio || right.mes - left.mes,
      );

      setMeses(orderedMonths);
      setTotalEvaluaciones(validRows.length);
      setInvalidCount(invalidRows.length);
      setInvalidIds(invalidRows.map((row) => row.id));
    } catch (errorValue: unknown) {
      setMeses([]);
      setTotalEvaluaciones(0);
      setInvalidCount(0);
      setInvalidIds([]);
      setError(errorValue instanceof Error ? errorValue.message : 'No se pudieron cargar los datos del hospital.');
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  const deleteMes = useCallback(async (mes: number, anio: number) => {
    if (!hospitalId) {
      throw new Error('Selecciona un hospital antes de eliminar datos.');
    }

    const { error: deleteError } = await getSupabaseClient()
      .from('evaluaciones')
      .delete()
      .eq('hospital_id', hospitalId)
      .eq('mes', mes)
      .eq('anio', anio);

    if (deleteError) {
      throw deleteError;
    }

    window.dispatchEvent(new CustomEvent('infectus:data-updated'));
    await refetch();
  }, [hospitalId, refetch]);

  const deleteAllData = useCallback(async () => {
    if (!hospitalId) {
      throw new Error('Selecciona un hospital antes de eliminar datos.');
    }

    const { error: deleteError } = await getSupabaseClient()
      .from('evaluaciones')
      .delete()
      .eq('hospital_id', hospitalId);

    if (deleteError) {
      throw deleteError;
    }

    window.dispatchEvent(new CustomEvent('infectus:data-updated'));
    await refetch();
  }, [hospitalId, refetch]);

  const deleteInvalidData = useCallback(async () => {
    if (!hospitalId) {
      throw new Error('Selecciona un hospital antes de eliminar datos.');
    }

    if (invalidIds.length === 0) {
      return;
    }

    const { error: deleteError } = await getSupabaseClient()
      .from('evaluaciones')
      .delete()
      .in('id', invalidIds);

    if (deleteError) {
      throw deleteError;
    }

    window.dispatchEvent(new CustomEvent('infectus:data-updated'));
    await refetch();
  }, [hospitalId, invalidIds, refetch]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    meses,
    totalEvaluaciones,
    invalidCount,
    loading,
    error,
    deleteMes,
    deleteAllData,
    deleteInvalidData,
    refetch,
  };
}
