import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../../../lib/supabase/client';
import type { Institucion, InstitucionInsert, InstitucionUpdate } from '../types';

export function useInstituciones(hospitalId: string | null) {
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!hospitalId) {
      setInstituciones([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await getSupabaseClient()
        .from('instituciones')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('nombre');
      if (fetchError) throw fetchError;
      setInstituciones((data ?? []) as Institucion[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar instituciones');
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (data: InstitucionInsert): Promise<void> => {
    const { error: insertError } = await getSupabaseClient()
      .from('instituciones')
      .insert(data);
    if (insertError) throw insertError;
    await refresh();
  };

  const update = async (id: string, data: InstitucionUpdate): Promise<void> => {
    const { error: updateError } = await getSupabaseClient()
      .from('instituciones')
      .update(data)
      .eq('id', id);
    if (updateError) throw updateError;
    await refresh();
  };

  const remove = async (id: string): Promise<void> => {
    const { error: deleteError } = await getSupabaseClient()
      .from('instituciones')
      .delete()
      .eq('id', id);
    if (deleteError) throw deleteError;
    await refresh();
  };

  const toggleActivo = async (id: string, activo: boolean): Promise<void> => {
    await update(id, { activo });
  };

  return { instituciones, loading, error, refresh, create, update, remove, toggleActivo };
}
