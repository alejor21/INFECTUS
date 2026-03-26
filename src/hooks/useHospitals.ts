import { useState, useEffect } from 'react';
import { getDistinctHospitals } from '../lib/supabase/queries/interventions';

interface UseHospitalsReturn {
  hospitals: string[];
  loading: boolean;
}

export function useHospitals(): UseHospitalsReturn {
  const [hospitals, setHospitals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDistinctHospitals()
      .then((result) => setHospitals(result))
      .catch(() => setHospitals([]))
      .finally(() => setLoading(false));
  }, []);

  return { hospitals, loading };
}
