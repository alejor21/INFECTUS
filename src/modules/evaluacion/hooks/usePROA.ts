import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../../../lib/supabase/client';
import type { ProaIntervencion, ProaIntervencionInsert } from '../types';

export function usePROA(hospitalId: string | null) {
  const [intervenciones, setIntervenciones] = useState<ProaIntervencion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!hospitalId) {
      setIntervenciones([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await getSupabaseClient()
        .from('proa_intervenciones')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('fecha', { ascending: false });
      if (fetchError) throw fetchError;
      setIntervenciones((data ?? []) as ProaIntervencion[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar intervenciones');
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (data: ProaIntervencionInsert): Promise<void> => {
    const { error: insertError } = await getSupabaseClient()
      .from('proa_intervenciones')
      .insert(data);
    if (insertError) throw insertError;
    await refresh();
  };

  const remove = async (id: string): Promise<void> => {
    const { error: deleteError } = await getSupabaseClient()
      .from('proa_intervenciones')
      .delete()
      .eq('id', id);
    if (deleteError) throw deleteError;
    await refresh();
  };

  return { intervenciones, loading, error, refresh, create, remove };
}
