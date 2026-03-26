import { useCallback, useEffect, useState } from 'react';
import {
  getHospitalUploadStatuses,
  type HospitalUploadStatus,
} from '../lib/supabase/hospitals';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'No se pudo cargar el estado de los Excel.';
}

export function useHospitalUploadStatuses(hospitalIds: string[]) {
  const [statuses, setStatuses] = useState<Record<string, HospitalUploadStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (hospitalIds.length === 0) {
      setStatuses({});
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getHospitalUploadStatuses(hospitalIds);
      setStatuses(data);
    } catch (errorValue: unknown) {
      setStatuses({});
      setError(getErrorMessage(errorValue));
    } finally {
      setLoading(false);
    }
  }, [hospitalIds]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    statuses,
    loading,
    error,
    refresh,
  };
}
