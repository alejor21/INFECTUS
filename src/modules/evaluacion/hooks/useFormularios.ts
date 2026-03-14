import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../../../lib/supabase/client';
import type { Formulario, FormularioInsert, FormularioUpdate } from '../types';

export function useFormularios(hospitalId: string | null) {
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!hospitalId) {
      setFormularios([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await getSupabaseClient()
        .from('formularios')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('nombre');
      if (fetchError) throw fetchError;
      setFormularios((data ?? []) as Formulario[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar formularios');
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (data: FormularioInsert): Promise<void> => {
    const { error: insertError } = await getSupabaseClient()
      .from('formularios')
      .insert(data);
    if (insertError) throw insertError;
    await refresh();
  };

  const update = async (id: string, data: FormularioUpdate): Promise<void> => {
    const { error: updateError } = await getSupabaseClient()
      .from('formularios')
      .update(data)
      .eq('id', id);
    if (updateError) throw updateError;
    await refresh();
  };

  const remove = async (id: string): Promise<void> => {
    const { error: deleteError } = await getSupabaseClient()
      .from('formularios')
      .delete()
      .eq('id', id);
    if (deleteError) throw deleteError;
    await refresh();
  };

  return { formularios, loading, error, refresh, create, update, remove };
}
