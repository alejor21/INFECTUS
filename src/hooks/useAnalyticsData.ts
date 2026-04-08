import { useCallback, useEffect, useState } from 'react';
import {
  formatMonthYear,
  PROA_INTERVENTION_TYPE_LABELS,
} from '../lib/constants';
import { getSupabaseClient } from '../lib/supabase/client';

const pct = (n: number, total: number): number =>
  total === 0 ? 0 : Math.round((n / total) * 1000) / 10;

export interface MesDisponible {
  mes: number;
  anio: number;
  label: string;
  count: number;
}

export interface AnalyticsData {
  totalEvaluaciones: number;
  pctAprobacion: number;
  pctCultivos: number;
  pctEmpirica: number;
  periodoLabel: string;
  mesesDisponibles: MesDisponible[];
  adherenciaData: {
    adheridos: number;
    noAdheridos: number;
    total: number;
  };
  conductasData: Array<{ conducta: string; count: number }>;
  servicioData: Array<{ servicio: string; count: number }>;
  tipoData: Array<{ tipo: string; label: string; count: number }>;
}

interface EvaluacionAnalyticsRow {
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

interface MesRow {
  mes: number | null;
  anio: number | null;
}

interface FetchCancellation {
  cancelled: boolean;
}

export function useAnalyticsData(
  hospitalId: string | null | undefined,
  mes: number | null,
  anio: number | null,
) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [mesesDisponibles, setMesesDisponibles] = useState<MesDisponible[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (cancellation?: FetchCancellation) => {
      if (!hospitalId) {
        setData(null);
        setMesesDisponibles([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabaseClient();
        const evaluacionesQuery = supabase
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
          .order('fecha', { ascending: false });

        const filteredEvaluacionesQuery =
          mes && anio
            ? evaluacionesQuery.eq('mes', mes).eq('anio', anio)
            : evaluacionesQuery;

        const [evaluacionesResult, mesesResult] = await Promise.all([
          filteredEvaluacionesQuery,
          supabase
            .from('evaluaciones')
            .select('mes, anio')
            .eq('hospital_id', hospitalId)
            .not('mes', 'is', null)
            .not('anio', 'is', null),
        ]);

        if (cancellation?.cancelled) {
          return;
        }

        if (evaluacionesResult.error || mesesResult.error) {
          setError(
            evaluacionesResult.error?.message ??
              mesesResult.error?.message ??
              'Error cargando analiticas',
          );
          return;
        }

        const monthMap = new Map<string, MesDisponible>();
        for (const row of (mesesResult.data ?? []) as MesRow[]) {
          if (!row.mes || !row.anio) {
            continue;
          }

          const key = `${row.anio}-${row.mes}`;
          const previous = monthMap.get(key);
          monthMap.set(key, {
            mes: row.mes,
            anio: row.anio,
            label: formatMonthYear(row.mes, row.anio) ?? String(row.anio),
            count: (previous?.count ?? 0) + 1,
          });
        }

        const orderedMonths = Array.from(monthMap.values()).sort(
          (left, right) =>
            right.anio - left.anio || right.mes - left.mes,
        );
        setMesesDisponibles(orderedMonths);

        const evaluaciones =
          (evaluacionesResult.data ?? []) as unknown as EvaluacionAnalyticsRow[];
        if (evaluaciones.length === 0) {
          setData(null);
          return;
        }

        const totalEvaluaciones = evaluaciones.length;
        const adheridos = evaluaciones.filter(
          (evaluacion) => evaluacion.aprobacion_terapia === true,
        ).length;
        const noAdheridos = evaluaciones.filter(
          (evaluacion) => evaluacion.aprobacion_terapia === false,
        ).length;
        const cultivos = evaluaciones.filter(
          (evaluacion) => evaluacion.cultivos_previos === true,
        ).length;
        const empirica = evaluaciones.filter(
          (evaluacion) => evaluacion.terapia_empirica === true,
        ).length;

        const conductaMap = new Map<string, number>();
        for (const evaluacion of evaluaciones) {
          const conducta = evaluacion.conducta_general ?? 'Sin registrar';
          conductaMap.set(
            conducta,
            (conductaMap.get(conducta) ?? 0) + 1,
          );
        }

        const servicioMap = new Map<string, number>();
        for (const evaluacion of evaluaciones) {
          const servicio = evaluacion.servicio ?? 'Sin registrar';
          servicioMap.set(
            servicio,
            (servicioMap.get(servicio) ?? 0) + 1,
          );
        }

        const tipoMap = new Map<string, number>();
        for (const evaluacion of evaluaciones) {
          const tipo = evaluacion.tipo_intervencion ?? 'Otro';
          tipoMap.set(tipo, (tipoMap.get(tipo) ?? 0) + 1);
        }

        let periodoLabel = 'Todos los datos';
        if (mes && anio) {
          periodoLabel = formatMonthYear(mes, anio) ?? 'Todos los datos';
        } else if (orderedMonths.length > 0) {
          periodoLabel = orderedMonths[0].label;
        } else if (evaluaciones[0]?.fecha) {
          const parsedDate = new Date(evaluaciones[0].fecha);
          if (!Number.isNaN(parsedDate.getTime())) {
            periodoLabel =
              formatMonthYear(
                parsedDate.getMonth() + 1,
                parsedDate.getFullYear(),
              ) ?? 'Todos los datos';
          }
        }

        setData({
          totalEvaluaciones,
          pctAprobacion: pct(adheridos, totalEvaluaciones),
          pctCultivos: pct(cultivos, totalEvaluaciones),
          pctEmpirica: pct(empirica, totalEvaluaciones),
          periodoLabel,
          mesesDisponibles: orderedMonths,
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
              label: PROA_INTERVENTION_TYPE_LABELS[tipo] ?? tipo,
              count,
            }))
            .sort((left, right) => right.count - left.count),
        });
      } catch {
        if (!cancellation?.cancelled) {
          setError('Error cargando analiticas');
        }
      } finally {
        if (!cancellation?.cancelled) {
          setLoading(false);
        }
      }
    },
    [hospitalId, mes, anio],
  );

  useEffect(() => {
    const cancellation: FetchCancellation = { cancelled: false };
    void fetchData(cancellation);

    return () => {
      cancellation.cancelled = true;
    };
  }, [fetchData]);

  return { data, mesesDisponibles, loading, error, refetch: fetchData };
}
