import { useCallback, useEffect, useState } from 'react';
import { getHospitalFiles, type HospitalFile } from '../lib/supabase/hospitals';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'No se pudieron cargar los archivos del hospital.';
}

export function useHospitalFiles(hospitalId: string | null) {
  const [files, setFiles] = useState<HospitalFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!hospitalId) {
      setFiles([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getHospitalFiles(hospitalId);
      setFiles(data);
    } catch (errorValue: unknown) {
      setFiles([]);
      setError(getErrorMessage(errorValue));
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    files,
    loading,
    error,
    refresh,
  };
}
