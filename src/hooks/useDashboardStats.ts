import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHospitalContext } from '../contexts/HospitalContext';
import { getSupabaseClient } from '../lib/supabase/client';

export interface RecentEval {
  id: string;
  hospital_name: string | null;
  status: string;
  created_at: string;
  progress_pct: number | null;
}

export interface DashboardStats {
  totalEvaluaciones: number;
  pctAprobacion: number;
  pctCultivos: number;
  pctEmpirica: number;
  adherenciaData: {
    adheridos: number;
    noAdheridos: number;
    total: number;
  };
  conductasData: Array<{ conducta: string; count: number }>;
  servicioData: Array<{ servicio: string; count: number }>;
  tipoData: Array<{ tipo: string; label: string; count: number }>;
  periodoLabel: string;
  lastEval: { created_at: string; status: string } | null;
  recentEvals: RecentEval[];
}

interface EvaluationStatusRow {
  created_at: string;
  status: string;
}

interface RecentEvaluationRow extends EvaluationStatusRow {
  id: string;
  hospital_name: string | null;
  progress_pct: number | null;
}

interface UploadPeriodRow {
  periodo: string | null;
  mes: number | null;
  anio: number | null;
  created_at: string;
}

interface RemoteStatsState {
  lastEval: { created_at: string; status: string } | null;
  recentEvals: RecentEval[];
  latestUpload: UploadPeriodRow | null;
}

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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'No se pudo cargar el resumen del dashboard.';
}

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

function getRecordValue(record: object, candidateKeys: string[]): string | number | boolean | null {
  const normalizedCandidates = candidateKeys.map((candidate) => normalizeKey(candidate));

  for (const [key, value] of Object.entries(record)) {
    if (!normalizedCandidates.includes(normalizeKey(key))) {
      continue;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    return null;
  }

  return null;
}

function cleanString(value: string | number | boolean | null): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'SI' : 'NO';
  }

  return null;
}

function parseBooleanValue(value: string | number | boolean | null): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = normalizeKey(value);
  if (['si', 's', 'true', '1', 'yes'].includes(normalized)) {
    return true;
  }

  if (['no', 'false', '0'].includes(normalized)) {
    return false;
  }

  return null;
}

function parseDateValue(value: string | number | boolean | null): Date | null {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function percentage(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 1000) / 10;
}

function buildPeriodLabel(
  latestUpload: UploadPeriodRow | null,
  latestRecordDate: Date | null,
  lastEval: { created_at: string; status: string } | null,
): string {
  if (latestUpload?.periodo) {
    return latestUpload.periodo;
  }

  if (latestUpload?.mes && latestUpload.anio) {
    const monthIndex = latestUpload.mes - 1;
    if (monthIndex >= 0 && monthIndex < MONTH_NAMES.length) {
      return `${MONTH_NAMES[monthIndex]} ${latestUpload.anio}`;
    }
  }

  if (latestRecordDate) {
    return `${MONTH_NAMES[latestRecordDate.getMonth()]} ${latestRecordDate.getFullYear()}`;
  }

  if (lastEval) {
    const evaluationDate = new Date(lastEval.created_at);
    if (!Number.isNaN(evaluationDate.getTime())) {
      return `${MONTH_NAMES[evaluationDate.getMonth()]} ${evaluationDate.getFullYear()}`;
    }
  }

  return 'Todos los datos';
}

export function useDashboardStats(hospitalId: string | null) {
  const { allRawRecords, recordsLoading, refreshRecords, selectedHospitalObj } = useHospitalContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteStats, setRemoteStats] = useState<RemoteStatsState>({
    lastEval: null,
    recentEvals: [],
    latestUpload: null,
  });

  const hospitalRecords = useMemo(() => {
    if (!hospitalId || !selectedHospitalObj || selectedHospitalObj.id !== hospitalId) {
      return [];
    }

    return allRawRecords.filter((record) => {
      const hospitalName = cleanString(
        getRecordValue(record, ['hospital_name', 'hospitalName', 'hospital', 'institucion', 'hospital_nombre']),
      );

      return hospitalName === selectedHospitalObj.name;
    });
  }, [allRawRecords, hospitalId, selectedHospitalObj]);

  const fetchRemoteStats = useCallback(async () => {
    if (!hospitalId) {
      setRemoteStats({
        lastEval: null,
        recentEvals: [],
        latestUpload: null,
      });
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const [
        { data: lastEvalRows, error: lastEvalError },
        { data: recentRows, error: recentError },
        { data: uploadRows, error: uploadError },
      ] = await Promise.all([
        supabase
          .from('evaluaciones')
          .select('created_at, status')
          .eq('hospital_id', hospitalId)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('evaluaciones')
          .select('id, hospital_name, status, created_at, progress_pct')
          .eq('hospital_id', hospitalId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('hospital_excel_uploads')
          .select('periodo, mes, anio, created_at')
          .eq('hospital_id', hospitalId)
          .order('created_at', { ascending: false })
          .limit(1),
      ]);

      const firstError = lastEvalError ?? recentError ?? uploadError;
      if (firstError) {
        throw firstError;
      }

      const lastEval = ((lastEvalRows ?? []) as EvaluationStatusRow[])[0] ?? null;
      const recentEvals = ((recentRows ?? []) as RecentEvaluationRow[]).map((row) => ({
        id: row.id,
        hospital_name: row.hospital_name,
        status: row.status,
        created_at: row.created_at,
        progress_pct: row.progress_pct,
      }));
      const latestUpload = ((uploadRows ?? []) as UploadPeriodRow[])[0] ?? null;

      setRemoteStats({
        lastEval,
        recentEvals,
        latestUpload,
      });
    } catch (errorValue: unknown) {
      setError(getErrorMessage(errorValue));
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!hospitalId) {
        setRemoteStats({
          lastEval: null,
          recentEvals: [],
          latestUpload: null,
        });
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabaseClient();
        const [
          { data: lastEvalRows, error: lastEvalError },
          { data: recentRows, error: recentError },
          { data: uploadRows, error: uploadError },
        ] = await Promise.all([
          supabase
            .from('evaluaciones')
            .select('created_at, status')
            .eq('hospital_id', hospitalId)
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('evaluaciones')
            .select('id, hospital_name, status, created_at, progress_pct')
            .eq('hospital_id', hospitalId)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('hospital_excel_uploads')
            .select('periodo, mes, anio, created_at')
            .eq('hospital_id', hospitalId)
            .order('created_at', { ascending: false })
            .limit(1),
        ]);

        const firstError = lastEvalError ?? recentError ?? uploadError;
        if (firstError) {
          throw firstError;
        }

        if (cancelled) {
          return;
        }

        const lastEval = ((lastEvalRows ?? []) as EvaluationStatusRow[])[0] ?? null;
        const recentEvals = ((recentRows ?? []) as RecentEvaluationRow[]).map((row) => ({
          id: row.id,
          hospital_name: row.hospital_name,
          status: row.status,
          created_at: row.created_at,
          progress_pct: row.progress_pct,
        }));
        const latestUpload = ((uploadRows ?? []) as UploadPeriodRow[])[0] ?? null;

        setRemoteStats({
          lastEval,
          recentEvals,
          latestUpload,
        });
      } catch (errorValue: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(errorValue));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [hospitalId]);

  useEffect(() => {
    const handleDataUpdated = () => {
      void fetchRemoteStats();
    };

    window.addEventListener('infectus:data-updated', handleDataUpdated);
    return () => {
      window.removeEventListener('infectus:data-updated', handleDataUpdated);
    };
  }, [fetchRemoteStats]);

  const stats = useMemo<DashboardStats | null>(() => {
    if (!hospitalId || hospitalRecords.length === 0) {
      return null;
    }

    let aprobados = 0;
    let noAdheridos = 0;
    let cultivosPrevios = 0;
    let terapiaEmpirica = 0;
    let latestRecordDate: Date | null = null;
    const conductaMap = new Map<string, number>();
    const servicioMap = new Map<string, number>();
    const tipoMap = new Map<string, number>();

    for (const record of hospitalRecords) {
      const adherencia = parseBooleanValue(
        getRecordValue(record, ['aprobo_terapia', 'aprobacion_terapia', 'aproboTerapia']),
      );
      if (adherencia === true) {
        aprobados += 1;
      }
      if (adherencia === false) {
        noAdheridos += 1;
      }

      if (parseBooleanValue(getRecordValue(record, ['cultivos_previos', 'cultivosPrevios'])) === true) {
        cultivosPrevios += 1;
      }

      if (
        parseBooleanValue(
          getRecordValue(record, [
            'terapia_empirica',
            'terapia_empirica_apropiada',
            'terapiaEmpiricaApropiada',
            'terapiaEmpricaApropiada',
          ]),
        ) === true
      ) {
        terapiaEmpirica += 1;
      }

      const conducta = cleanString(getRecordValue(record, ['conducta_general', 'conductaGeneral'])) ?? 'Sin registrar';
      const servicio = cleanString(getRecordValue(record, ['servicio'])) ?? 'Sin registrar';
      const tipo = cleanString(getRecordValue(record, ['tipo_intervencion', 'tipoIntervencion'])) ?? 'Otro';

      conductaMap.set(conducta, (conductaMap.get(conducta) ?? 0) + 1);
      servicioMap.set(servicio, (servicioMap.get(servicio) ?? 0) + 1);
      tipoMap.set(tipo, (tipoMap.get(tipo) ?? 0) + 1);

      const recordDate = parseDateValue(getRecordValue(record, ['fecha']));
      if (recordDate && (!latestRecordDate || recordDate > latestRecordDate)) {
        latestRecordDate = recordDate;
      }
    }

    const totalEvaluaciones = hospitalRecords.length;
    const tipoLabels: Record<string, string> = {
      IC: 'Interconsultas',
      PROA: 'Captadas PROA',
      REV: 'Revaloración',
    };

    return {
      totalEvaluaciones,
      pctAprobacion: percentage(aprobados, totalEvaluaciones),
      pctCultivos: percentage(cultivosPrevios, totalEvaluaciones),
      pctEmpirica: percentage(terapiaEmpirica, totalEvaluaciones),
      adherenciaData: {
        adheridos: aprobados,
        noAdheridos,
        total: aprobados + noAdheridos,
      },
      conductasData: Array.from(conductaMap.entries())
        .map(([conducta, count]) => ({ conducta, count }))
        .sort((left, right) => right.count - left.count),
      servicioData: Array.from(servicioMap.entries())
        .map(([servicio, count]) => ({ servicio, count }))
        .sort((left, right) => right.count - left.count),
      tipoData: Array.from(tipoMap.entries())
        .map(([tipo, count]) => ({
          tipo,
          label: tipoLabels[tipo] ?? tipo,
          count,
        }))
        .sort((left, right) => right.count - left.count),
      periodoLabel: buildPeriodLabel(remoteStats.latestUpload, latestRecordDate, remoteStats.lastEval),
      lastEval: remoteStats.lastEval,
      recentEvals: remoteStats.recentEvals,
    };
  }, [hospitalId, hospitalRecords, remoteStats]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchRemoteStats(), refreshRecords()]);
  }, [fetchRemoteStats, refreshRecords]);

  return {
    stats,
    loading: loading || recordsLoading,
    error,
    refresh,
  };
}
