import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';

interface HospitalRow {
  id: string;
  name: string;
  city: string;
  department: string;
  beds: number | null;
  contact_name: string | null;
  contact_email: string | null;
  is_active: boolean;
  created_at: string;
}

export interface HospitalFormData {
  name: string;
  city: string;
  department: string;
  beds: number | null;
  contact_name: string | null;
  contact_email: string | null;
  is_active?: boolean;
}

interface UseHospitalsReturn {
  hospitals: string[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createHospital: (data: HospitalFormData) => Promise<HospitalRow>;
}

export function useHospitals(): UseHospitalsReturn {
  const [hospitals, setHospitals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await getSupabaseClient()
        .from('hospitals')
        .select('name')
        .order('name');

      if (fetchError) {
        throw fetchError;
      }

      const names = ((data ?? []) as Array<{ name: string | null }>)
        .map((hospital) => hospital.name ?? '')
        .filter(Boolean);

      setHospitals(names);
    } catch (errorValue) {
      setHospitals([]);
      setError(errorValue instanceof Error ? errorValue.message : 'No se pudieron cargar los hospitales.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createHospital = useCallback(async (data: HospitalFormData): Promise<HospitalRow> => {
    const supabase = getSupabaseClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      throw new Error('No autenticado');
    }

    const { data: hospital, error: insertError } = await supabase
      .from('hospitals')
      .insert({
        ...data,
        is_active: data.is_active ?? true,
        user_id: user.id,
      })
      .select('*')
      .single();

    if (insertError || !hospital) {
      throw insertError ?? new Error('No se pudo crear el hospital.');
    }

    await refetch();

    return hospital as HospitalRow;
  }, [refetch]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { hospitals, loading, error, refetch, createHospital };
}
