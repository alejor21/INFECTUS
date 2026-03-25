import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Hospital, HospitalFile } from '../lib/supabase/hospitals';
import { getHospitals, getHospitalFiles } from '../lib/supabase/hospitals';
import { getInterventionsByDateRange } from '../lib/supabase/queries/interventions';
import type { InterventionRecord } from '../types';

interface HospitalContextValue {
  // Legacy string field — keeps existing consumers working without changes
  selectedHospital: string;
  setSelectedHospital: (name: string) => void;

  // Full hospital object management
  hospitals: Hospital[];
  selectedHospitalObj: Hospital | null;
  setSelectedHospitalObj: (h: Hospital | null) => void;

  // All records from all hospitals (unfiltered)
  allRawRecords: InterventionRecord[];
  // Derived: filtered by selectedHospitalObj + dateRange
  records: InterventionRecord[];

  // Files for the selected hospital
  hospitalFiles: HospitalFile[];

  // Loading state for records fetch
  recordsLoading: boolean;

  // Refresh helpers
  refreshHospitals: () => Promise<void>;
  refreshFiles: () => Promise<void>;
  refreshRecords: () => Promise<void>;

  // Date range filter
  dateRange: '1m' | '6m' | '12m' | 'all';
  setDateRange: (r: '1m' | '6m' | '12m' | 'all') => void;
}

// Parse fecha string (DD/MM/YYYY or YYYY-MM-DD) into a Date
function parseFecha(dateStr: string): Date | null {
  const s = (dateStr ?? '').trim();
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  return null;
}

function applyDateRange(
  records: InterventionRecord[],
  range: '1m' | '6m' | '12m' | 'all',
): InterventionRecord[] {
  if (range === 'all') return records;
  const months = range === '1m' ? 1 : range === '6m' ? 6 : 12;
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
  return records.filter((r) => {
    const d = parseFecha(r.fecha ?? '');
    return d ? d >= cutoff : true;
  });
}

export const HospitalContext = createContext<HospitalContextValue>({
  selectedHospital: '',
  setSelectedHospital: () => {},
  hospitals: [],
  selectedHospitalObj: null,
  setSelectedHospitalObj: () => {},
  allRawRecords: [],
  records: [],
  hospitalFiles: [],
  recordsLoading: false,
  refreshHospitals: async () => {},
  refreshFiles: async () => {},
  refreshRecords: async () => {},
  dateRange: '6m',
  setDateRange: () => {},
});

export function useHospitalContext() {
  return useContext(HospitalContext);
}

export function HospitalProvider({ children }: { children: React.ReactNode }) {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalObj, setSelectedHospitalObjState] = useState<Hospital | null>(null);
  const [hospitalFiles, setHospitalFiles] = useState<HospitalFile[]>([]);
  const [dateRange, setDateRange] = useState<'1m' | '6m' | '12m' | 'all'>('6m');
  const [allRawRecords, setAllRawRecords] = useState<InterventionRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Derived string — keeps legacy consumers (e.g. Dashboard patient table) working
  const selectedHospital = selectedHospitalObj?.name ?? '';

  // Derived filtered records — recomputed whenever source data or filters change
  const records = useMemo(() => {
    let filtered = allRawRecords;
    if (selectedHospitalObj) {
      filtered = filtered.filter((r) => r.hospitalName === selectedHospitalObj.name);
    }
    return applyDateRange(filtered, dateRange);
  }, [allRawRecords, selectedHospitalObj, dateRange]);

  const setSelectedHospital = useCallback(
    (name: string) => {
      if (!name) {
        setSelectedHospitalObjState(null);
      } else {
        setSelectedHospitalObjState(hospitals.find((h) => h.name === name) ?? null);
      }
    },
    [hospitals],
  );

  const setSelectedHospitalObj = useCallback((h: Hospital | null) => {
    setSelectedHospitalObjState(h);
  }, []);

  const refreshHospitals = useCallback(async () => {
    const data = await getHospitals();
    setHospitals(data);
  }, []);

  const refreshFiles = useCallback(async () => {
    if (!selectedHospitalObj) {
      setHospitalFiles([]);
      return;
    }
    const data = await getHospitalFiles(selectedHospitalObj.id);
    setHospitalFiles(data);
  }, [selectedHospitalObj]);

  const refreshRecords = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const now = new Date();
      const farPast = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
      const data = await getInterventionsByDateRange(farPast, now);
      setAllRawRecords(data);
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  // Load hospitals on mount
  useEffect(() => {
    let isMounted = true;
    refreshHospitals().then(() => {
      if (!isMounted) return;
    });
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load all records on mount
  useEffect(() => {
    let isMounted = true;
    refreshRecords().then(() => {
      if (!isMounted) return;
    });
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload files when selected hospital changes
  useEffect(() => {
    let isMounted = true;
    refreshFiles().then(() => {
      if (!isMounted) return;
    });
    return () => { isMounted = false; };
  }, [selectedHospitalObj, refreshFiles]);

  // Refresh records when a file upload completes
  useEffect(() => {
    const handler = () => { 
      refreshRecords().catch(() => {
        // Silent fail - already handled in refreshRecords
      });
    };
    window.addEventListener('infectus:data-updated', handler);
    return () => { window.removeEventListener('infectus:data-updated', handler); };
  }, [refreshRecords]);

  return (
    <HospitalContext.Provider
      value={{
        selectedHospital,
        setSelectedHospital,
        hospitals,
        selectedHospitalObj,
        setSelectedHospitalObj,
        allRawRecords,
        records,
        hospitalFiles,
        recordsLoading,
        refreshHospitals,
        refreshFiles,
        refreshRecords,
        dateRange,
        setDateRange,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
}
