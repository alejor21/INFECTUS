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
  const hospitalIdsKey = hospitalIds.join('|');

  const refresh = useCallback(async (isActive?: () => boolean) => {
    const ids = hospitalIdsKey.split('|').filter(Boolean);
    const canCommit = isActive ?? (() => true);

    if (ids.length === 0) {
      if (!canCommit()) {
        return;
      }

      setStatuses({});
      setError(null);
      setLoading(false);
      return;
    }

    if (!canCommit()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getHospitalUploadStatuses(ids);
      if (!canCommit()) {
        return;
      }

      setStatuses(data);
    } catch (errorValue: unknown) {
      if (!canCommit()) {
        return;
      }

      setStatuses({});
      setError(getErrorMessage(errorValue));
    } finally {
      if (canCommit()) {
        setLoading(false);
      }
    }
  }, [hospitalIdsKey]);

  useEffect(() => {
    let cancelled = false;
    const isActive = () => !cancelled;

    void refresh(isActive);

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return {
    statuses,
    loading,
    error,
    refresh,
  };
}
