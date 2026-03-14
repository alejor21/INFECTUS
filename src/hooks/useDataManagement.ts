import { useState, useEffect, useCallback } from 'react';
import {
  getHospitalsWithStats,
  deleteHospitalData,
  deleteAllData,
} from '../lib/supabase/queries/interventions';

type DeleteStatus = 'idle' | 'deleting' | 'success' | 'error';

interface HospitalStat {
  hospitalName: string;
  recordCount: number;
  lastUpload: string;
}

interface UseDataManagementReturn {
  hospitals: HospitalStat[];
  loading: boolean;
  refetch: () => void;
  deleteHospital: (hospitalName: string) => Promise<void>;
  deleteAll: () => Promise<void>;
  deleteStatus: DeleteStatus;
  deleteError: string | null;
}

export function useDataManagement(): UseDataManagementReturn {
  const [hospitals, setHospitals] = useState<HospitalStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus>('idle');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    try {
      const stats = await getHospitalsWithStats();
      setHospitals(stats);
    } catch {
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  const deleteHospital = useCallback(
    async (hospitalName: string) => {
      setDeleteStatus('deleting');
      setDeleteError(null);
      const { success, error } = await deleteHospitalData(hospitalName);
      if (!success) {
        setDeleteStatus('error');
        setDeleteError(error);
        return;
      }
      setDeleteStatus('success');
      window.dispatchEvent(new CustomEvent('infectus:data-updated'));
      await fetchHospitals();
    },
    [fetchHospitals],
  );

  const deleteAll = useCallback(async () => {
    setDeleteStatus('deleting');
    setDeleteError(null);
    const { success, error } = await deleteAllData();
    if (!success) {
      setDeleteStatus('error');
      setDeleteError(error);
      return;
    }
    setDeleteStatus('success');
    window.dispatchEvent(new CustomEvent('infectus:data-updated'));
    await fetchHospitals();
  }, [fetchHospitals]);

  return {
    hospitals,
    loading,
    refetch: fetchHospitals,
    deleteHospital,
    deleteAll,
    deleteStatus,
    deleteError,
  };
}
