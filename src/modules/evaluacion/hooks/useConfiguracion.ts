import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseClient } from '../../../lib/supabase/client';
import type { ConfiguracionHospital, ConfiguracionUpdate } from '../types';

type SaveStatus = 'idle' | 'saving' | 'saved';

export function useConfiguracion(hospitalId: string | null) {
  const [config, setConfig] = useState<ConfiguracionHospital | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    if (!hospitalId) {
      setConfig(null);
      return;
    }
    setLoading(true);
    try {
      const { data } = await getSupabaseClient()
        .from('configuracion_hospital')
        .select('*')
        .eq('hospital_id', hospitalId)
        .single();
      setConfig((data ?? null) as ConfiguracionHospital | null);
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveImmediate = useCallback(
    async (updates: ConfiguracionUpdate): Promise<void> => {
      if (!hospitalId) return;
      setSaveStatus('saving');
      try {
        await getSupabaseClient()
          .from('configuracion_hospital')
          .upsert(
            { hospital_id: hospitalId, ...updates, updated_at: new Date().toISOString() },
            { onConflict: 'hospital_id' },
          );
        setSaveStatus('saved');
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500);
        await refresh();
      } catch {
        setSaveStatus('idle');
        throw new Error('Error al guardar la configuración');
      }
    },
    [hospitalId, refresh],
  );

  const debouncedSave = useCallback(
    (updates: ConfiguracionUpdate) => {
      setConfig((prev) => (prev ? { ...prev, ...updates } : null));
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus('saving');
      saveTimerRef.current = setTimeout(() => {
        saveImmediate(updates);
      }, 1000);
    },
    [saveImmediate],
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  return { config, loading, saveStatus, refresh, debouncedSave, saveImmediate };
}
