import { useCallback, useEffect, useState } from 'react';
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
  periodoLabel: string;
  adherenciaData: {
    adheridos: number;
    noAdheridos: number;
    total: number;
  };
  conductasData: Array<{ conducta: string; count: number }>;
  servicioData: Array<{ servicio: string; count: number }>;
  tipoData: Array<{ tipo: string; label: string; count: number }>;
  recentEvals: RecentEval[];
}

interface EvaluacionDashboardRow {
  aprobacion_terapia: boolean | null;
  cultivos_previos: boolean | null;
  terapia_empirica: boolean | null;
  servicio: string | null;
  conducta_general: string | null;
  tipo_intervencion: string | null;
  mes: number | null;
  anio: number | null;
  fecha: string | null;
}

interface FetchCancellation {
  cancelled: boolean;
}

const MESES = [
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

const TIPO_LABELS: Record<string, string> = {
  IC: 'Interconsultas',
  PROA: 'Captadas PROA',
  REV: 'Revaloración',
};

const pct = (n: number, total: number): number => (total === 0 ? 0 : Math.round((n / total) * 1000) / 10);

function buildPeriodoLabel(first: EvaluacionDashboardRow | undefined): string {
  if (!first) {
    return 'Todos los datos';
  }

  if (first.mes && first.anio) {
    return `${MESES[first.mes - 1]} ${first.anio}`;
  }

  if (first.fecha) {
    const parsed = new Date(first.fecha);
    if (!Number.isNaN(parsed.getTime())) {
      return `${MESES[parsed.getMonth()]} ${parsed.getFullYear()}`;
    }
  }

  return 'Todos los datos';
}

export function useDashboardStats(hospitalId: string | null | undefined) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(
    async (cancellation?: FetchCancellation) => {
      if (!hospitalId) {
        setStats(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabaseClient();
        const [
          { data, error: dbError },
          { data: recentRows, error: recentError },
        ] = await Promise.all([
          supabase
            .from('evaluaciones')
            .select(
              [
                'aprobacion_terapia',
                'cultivos_previos',
                'terapia_empirica',
                'servicio',
                'conducta_general',
                'tipo_intervencion',
                'mes',
                'anio',
                'fecha',
              ].join(', '),
            )
            .eq('hospital_id', hospitalId)
            .order('anio', { ascending: false })
            .order('mes', { ascending: false })
            .order('fecha', { ascending: false }),
          supabase
            .from('evaluaciones')
            .select('id, hospital_name, status, created_at, progress_pct')
            .eq('hospital_id', hospitalId)
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

        if (cancellation?.cancelled) {
          return;
        }

        if (dbError || recentError) {
          setError(dbError?.message ?? recentError?.message ?? 'Error al cargar los datos del dashboard');
          return;
        }

        const evaluaciones = ((data ?? []) as EvaluacionDashboardRow[]);
        const recentEvals = ((recentRows ?? []) as RecentEval[]);

        if (evaluaciones.length === 0) {
          setStats(null);
          return;
        }

        const totalEvaluaciones = evaluaciones.length;
        const adheridos = evaluaciones.filter((evaluacion) => evaluacion.aprobacion_terapia === true).length;
        const noAdheridos = evaluaciones.filter((evaluacion) => evaluacion.aprobacion_terapia === false).length;
        const cultivos = evaluaciones.filter((evaluacion) => evaluacion.cultivos_previos === true).length;
        const empirica = evaluaciones.filter((evaluacion) => evaluacion.terapia_empirica === true).length;

        const conductaMap = new Map<string, number>();
        for (const evaluacion of evaluaciones) {
          const conducta = evaluacion.conducta_general ?? 'Sin registrar';
          conductaMap.set(conducta, (conductaMap.get(conducta) ?? 0) + 1);
        }

        const servicioMap = new Map<string, number>();
        for (const evaluacion of evaluaciones) {
          const servicio = evaluacion.servicio ?? 'Sin registrar';
          servicioMap.set(servicio, (servicioMap.get(servicio) ?? 0) + 1);
        }

        const tipoMap = new Map<string, number>();
        for (const evaluacion of evaluaciones) {
          const tipo = evaluacion.tipo_intervencion ?? 'Otro';
          tipoMap.set(tipo, (tipoMap.get(tipo) ?? 0) + 1);
        }

        setStats({
          totalEvaluaciones,
          pctAprobacion: pct(adheridos, totalEvaluaciones),
          pctCultivos: pct(cultivos, totalEvaluaciones),
          pctEmpirica: pct(empirica, totalEvaluaciones),
          periodoLabel: buildPeriodoLabel(evaluaciones[0]),
          adherenciaData: {
            adheridos,
            noAdheridos,
            total: totalEvaluaciones,
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
              label: TIPO_LABELS[tipo] ?? tipo,
              count,
            }))
            .sort((left, right) => right.count - left.count),
          recentEvals,
        });
      } catch {
        if (!cancellation?.cancelled) {
          setError('Error al cargar los datos del dashboard');
        }
      } finally {
        if (!cancellation?.cancelled) {
          setLoading(false);
        }
      }
    },
    [hospitalId],
  );

  useEffect(() => {
    const cancellation: FetchCancellation = { cancelled: false };
    void fetchStats(cancellation);

    return () => {
      cancellation.cancelled = true;
    };
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
