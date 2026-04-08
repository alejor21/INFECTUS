import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import type { Hospital, HospitalFile } from '../lib/supabase/hospitals';
import { getHospitals, getHospitalFiles } from '../lib/supabase/hospitals';
import { getSupabaseClient } from '../lib/supabase/client';
import { getInterventionsByDateRange } from '../lib/supabase/queries/interventions';
import type { InterventionRecord } from '../types';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

interface EvaluationMonthRow {
  mes: number | null;
  anio: number | null;
}

export interface HospitalMonthOption {
  mes: number;
  anio: number;
  label: string;
  count: number;
  value: string;
}

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
  hospitalsLoading: boolean;
  hospitalsError: string | null;

  // Refresh helpers
  refreshHospitals: () => Promise<void>;
  refreshFiles: () => Promise<void>;
  refreshRecords: () => Promise<void>;

  // Date range filter
  dateRange: '1m' | '6m' | '12m' | 'all';
  setDateRange: (r: '1m' | '6m' | '12m' | 'all') => void;

  // Shared month filter for PROA data
  availableMonths: HospitalMonthOption[];
  monthsLoading: boolean;
  selectedMonth: HospitalMonthOption | null;
  selectedMonthValue: string | null;
  setSelectedMonthValue: (value: string | null) => void;
  refreshAvailableMonths: () => Promise<void>;
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

function toMonthValue(anio: number, mes: number): string {
  return `${anio}-${String(mes).padStart(2, '0')}`;
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
  hospitalsLoading: false,
  hospitalsError: null,
  refreshHospitals: async () => {},
  refreshFiles: async () => {},
  refreshRecords: async () => {},
  dateRange: '6m',
  setDateRange: () => {},
  availableMonths: [],
  monthsLoading: false,
  selectedMonth: null,
  selectedMonthValue: null,
  setSelectedMonthValue: () => {},
  refreshAvailableMonths: async () => {},
});

export function useHospitalContext() {
  return useContext(HospitalContext);
}

export function HospitalProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalObj, setSelectedHospitalObjState] = useState<Hospital | null>(null);
  const [hospitalFiles, setHospitalFiles] = useState<HospitalFile[]>([]);
  const [dateRange, setDateRange] = useState<'1m' | '6m' | '12m' | 'all'>('6m');
  const [allRawRecords, setAllRawRecords] = useState<InterventionRecord[]>([]);
  const [availableMonths, setAvailableMonths] = useState<HospitalMonthOption[]>([]);
  const [selectedMonthValue, setSelectedMonthValueState] = useState<string | null>(null);
  const [monthsLoading, setMonthsLoading] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [hospitalsError, setHospitalsError] = useState<string | null>(null);

  // Derived string — keeps legacy consumers (e.g. Dashboard patient table) working
  const selectedHospital = selectedHospitalObj?.name ?? '';
  const selectedHospitalId = selectedHospitalObj?.id ?? null;

  // Derived filtered records — recomputed whenever source data or filters change
  const records = useMemo(() => {
    let filtered = allRawRecords;
    if (selectedHospitalObj) {
      filtered = filtered.filter((record) =>
        record.hospitalId
          ? record.hospitalId === selectedHospitalObj.id
          : record.hospitalName === selectedHospitalObj.name,
      );
    }
    return applyDateRange(filtered, dateRange);
  }, [allRawRecords, selectedHospitalObj, dateRange]);

  const selectedMonth = useMemo(
    () => availableMonths.find((monthOption) => monthOption.value === selectedMonthValue) ?? null,
    [availableMonths, selectedMonthValue],
  );

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

  const setSelectedMonthValue = useCallback((value: string | null) => {
    setSelectedMonthValueState(value);
  }, []);

  const refreshHospitals = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setHospitals([]);
      setHospitalFiles([]);
      setSelectedHospitalObjState(null);
      setHospitalsError(null);
      setHospitalsLoading(false);
      return;
    }

    setHospitalsLoading(true);
    setHospitalsError(null);

    try {
      const data = await getHospitals();
      setHospitals(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudieron cargar tus hospitales.';
      setHospitals([]);
      setSelectedHospitalObjState(null);
      setHospitalsError(message);
    } finally {
      setHospitalsLoading(false);
    }
  }, [authLoading, user]);

  const refreshFiles = useCallback(async () => {
    if (!selectedHospitalObj) {
      setHospitalFiles([]);
      return;
    }
    const data = await getHospitalFiles(selectedHospitalObj.id);
    setHospitalFiles(data);
  }, [selectedHospitalObj]);

  const refreshAvailableMonths = useCallback(async () => {
    if (!selectedHospitalId) {
      setAvailableMonths([]);
      setSelectedMonthValueState(null);
      setMonthsLoading(false);
      return;
    }

    setMonthsLoading(true);

    try {
      const { data, error } = await getSupabaseClient()
        .from('evaluaciones')
        .select('mes, anio')
        .eq('hospital_id', selectedHospitalId)
        .not('mes', 'is', null)
        .not('anio', 'is', null);

      if (error) {
        throw new Error(error.message);
      }

      const monthMap = new Map<string, HospitalMonthOption>();
      for (const row of (data ?? []) as EvaluationMonthRow[]) {
        if (!row.mes || !row.anio) {
          continue;
        }

        const value = toMonthValue(row.anio, row.mes);
        const existing = monthMap.get(value);
        monthMap.set(value, {
          mes: row.mes,
          anio: row.anio,
          label: `${MONTH_NAMES[row.mes - 1]} ${row.anio}`,
          count: (existing?.count ?? 0) + 1,
          value,
        });
      }

      const orderedMonths = Array.from(monthMap.values()).sort(
        (left, right) => right.anio - left.anio || right.mes - left.mes,
      );

      setAvailableMonths(orderedMonths);
      setSelectedMonthValueState((currentValue) => {
        if (orderedMonths.length === 0) {
          return null;
        }

        if (currentValue && orderedMonths.some((monthOption) => monthOption.value === currentValue)) {
          return currentValue;
        }

        return orderedMonths[0].value;
      });
    } finally {
      setMonthsLoading(false);
    }
  }, [selectedHospitalId]);

  const refreshRecords = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setAllRawRecords([]);
      setRecordsLoading(false);
      return;
    }

    setRecordsLoading(true);
    try {
      const now = new Date();
      const farPast = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
      const data = await getInterventionsByDateRange(farPast, now);
      setAllRawRecords(data);
    } finally {
      setRecordsLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    let isMounted = true;
    refreshHospitals().then(() => {
      if (!isMounted) return;
    });
    return () => { isMounted = false; };
  }, [refreshHospitals, user?.id, authLoading]);

  useEffect(() => {
    let isMounted = true;
    refreshRecords().then(() => {
      if (!isMounted) return;
    });
    return () => { isMounted = false; };
  }, [refreshRecords, user?.id, authLoading]);

  useEffect(() => {
    if (hospitals.length === 1) {
      const onlyHospital = hospitals[0];
      if (selectedHospitalObj?.id !== onlyHospital.id) {
        setSelectedHospitalObjState(onlyHospital);
      }
      return;
    }

    if (selectedHospitalObj && !hospitals.some((hospital) => hospital.id === selectedHospitalObj.id)) {
      setSelectedHospitalObjState(null);
    }
  }, [hospitals, selectedHospitalObj]);

  useEffect(() => {
    setSelectedMonthValueState(null);
    setAvailableMonths([]);
  }, [selectedHospitalId]);

  // Reset dateRange when selected hospital changes
  useEffect(() => {
    setDateRange('6m');
  }, [selectedHospitalObj]);

  // Reload files when selected hospital changes
  useEffect(() => {
    let isMounted = true;
    refreshFiles().then(() => {
      if (!isMounted) return;
    });
    return () => { isMounted = false; };
  }, [selectedHospitalObj, refreshFiles]);

  useEffect(() => {
    let isMounted = true;
    refreshAvailableMonths().then(() => {
      if (!isMounted) return;
    });
    return () => { isMounted = false; };
  }, [refreshAvailableMonths]);

  // Refresh records when a file upload completes
  useEffect(() => {
    const handler = () => {
      refreshRecords().catch(() => {
        // Silent fail - already handled in refreshRecords
      });
      refreshAvailableMonths().catch(() => {
        // Silent fail - already handled in callers that consume the state
      });
    };
    window.addEventListener('infectus:data-updated', handler);
    return () => { window.removeEventListener('infectus:data-updated', handler); };
  }, [refreshAvailableMonths, refreshRecords]);

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
        hospitalsLoading,
        hospitalsError,
        refreshHospitals,
        refreshFiles,
        refreshRecords,
        dateRange,
        setDateRange,
        availableMonths,
        monthsLoading,
        selectedMonth,
        selectedMonthValue,
        setSelectedMonthValue,
        refreshAvailableMonths,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
}
