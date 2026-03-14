import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../../../lib/supabase/client';
import type { IASRegistro, IASRegistroInsert, IASRegistroUpdate } from '../types';

export function useIAS(hospitalId: string | null) {
  const [registros, setRegistros] = useState<IASRegistro[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!hospitalId) {
      setRegistros([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await getSupabaseClient()
        .from('ias_registros')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('fecha', { ascending: false });
      if (fetchError) throw fetchError;
      setRegistros((data ?? []) as IASRegistro[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar registros IAS');
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (data: IASRegistroInsert): Promise<void> => {
    const { error: insertError } = await getSupabaseClient()
      .from('ias_registros')
      .insert(data);
    if (insertError) throw insertError;
    await refresh();
  };

  const update = async (id: string, data: IASRegistroUpdate): Promise<void> => {
    const { error: updateError } = await getSupabaseClient()
      .from('ias_registros')
      .update(data)
      .eq('id', id);
    if (updateError) throw updateError;
    await refresh();
  };

  const remove = async (id: string): Promise<void> => {
    const { error: deleteError } = await getSupabaseClient()
      .from('ias_registros')
      .delete()
      .eq('id', id);
    if (deleteError) throw deleteError;
    await refresh();
  };

  return { registros, loading, error, refresh, create, update, remove };
}
