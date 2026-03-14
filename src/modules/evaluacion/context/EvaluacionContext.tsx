import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Hospital } from '../../../lib/supabase/hospitals';
import { getHospitals } from '../../../lib/supabase/hospitals';

interface EvaluacionContextValue {
  hospitals: Hospital[];
  selectedHospitalId: string | null;
  setSelectedHospitalId: (id: string | null) => void;
  hospitalsLoading: boolean;
  refreshHospitals: () => Promise<void>;
}

const EvaluacionContext = createContext<EvaluacionContextValue>({
  hospitals: [],
  selectedHospitalId: null,
  setSelectedHospitalId: () => {},
  hospitalsLoading: true,
  refreshHospitals: async () => {},
});

export function useEvaluacionContext() {
  return useContext(EvaluacionContext);
}

export function EvaluacionProvider({ children }: { children: React.ReactNode }) {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);

  const refreshHospitals = useCallback(async () => {
    setHospitalsLoading(true);
    try {
      const data = await getHospitals();
      setHospitals(data);
      // Auto-select the first hospital if none is currently selected
      setSelectedHospitalId((current) => {
        if (current !== null) return current;
        return data[0]?.id ?? null;
      });
    } finally {
      setHospitalsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHospitals();
  }, [refreshHospitals]);

  return (
    <EvaluacionContext.Provider
      value={{
        hospitals,
        selectedHospitalId,
        setSelectedHospitalId,
        hospitalsLoading,
        refreshHospitals,
      }}
    >
      {children}
    </EvaluacionContext.Provider>
  );
}
