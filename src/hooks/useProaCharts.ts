import { useMemo } from 'react';
import { useHospitalContext } from '../contexts/HospitalContext';
import type { InterventionRecord } from '../types';

export interface AdherenciaChartData {
  adheridos: number;
  noAdheridos: number;
  total: number;
}

export interface ConductaChartDatum {
  conducta: string;
  count: number;
}

export interface ServicioChartDatum {
  servicio: string;
  count: number;
}

export interface TipoIntervencionChartDatum {
  tipo: string;
  label: string;
  count: number;
}

interface UseProaChartsParams {
  evaluaciones: InterventionRecord[];
  hospitalId?: string;
}

interface UseProaChartsReturn {
  adherenciaData: AdherenciaChartData;
  conductasData: ConductaChartDatum[];
  servicioData: ServicioChartDatum[];
  tipoData: TipoIntervencionChartDatum[];
  isLoading: boolean;
  isEmpty: boolean;
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function normalizeConducta(value: string | null | undefined): string {
  const normalized = normalizeText(value);

  if (!normalized) {
    return 'Otro';
  }

  if (normalized.includes('acortar') || normalized.includes('dias_de_tto') || normalized.includes('dias_tto')) {
    return 'Acortar dias de tto';
  }

  if (normalized.includes('desescalon')) {
    return 'Desescalonamiento';
  }

  if (normalized.includes('suspension') || normalized.includes('suspender')) {
    return 'Suspension';
  }

  if (normalized.includes('ajuste_de_dosis') || normalized.includes('ajuste_dosis')) {
    return 'Ajuste de dosis';
  }

  return 'Otro';
}

function normalizeServicio(value: string | null | undefined): string {
  const normalized = normalizeText(value);

  if (!normalized) {
    return 'Otro';
  }

  if (normalized.includes('uci')) {
    return 'UCI';
  }

  if (normalized.includes('urgenc')) {
    return 'Urgencias';
  }

  if (normalized.includes('quirurg')) {
    return 'Hospitalizacion Quirurgica';
  }

  if (normalized.includes('medic')) {
    return 'Hospitalizacion Medica';
  }

  if (normalized.includes('pedia')) {
    return 'Pediatria';
  }

  if (normalized.includes('gine')) {
    return 'Ginecologia';
  }

  return 'Otro';
}

function normalizeTipo(value: string | null | undefined): 'IC' | 'PROA' | 'REV' | 'OTRO' {
  const normalized = normalizeText(value).toUpperCase();

  if (normalized === 'IC' || normalized === 'PROA' || normalized === 'REV') {
    return normalized;
  }

  return 'OTRO';
}

export function useProaCharts({
  evaluaciones,
  hospitalId,
}: UseProaChartsParams): UseProaChartsReturn {
  const { hospitals, recordsLoading } = useHospitalContext();

  const filteredEvaluaciones = useMemo(() => {
    if (!hospitalId) {
      return evaluaciones;
    }

    const selectedHospital = hospitals.find((hospital) => hospital.id === hospitalId);
    if (!selectedHospital) {
      return evaluaciones;
    }

    return evaluaciones.filter((record) => record.hospitalName === selectedHospital.name);
  }, [evaluaciones, hospitalId, hospitals]);

  const adherenciaData = useMemo<AdherenciaChartData>(() => {
    const adheridos = filteredEvaluaciones.filter(
      (record) => normalizeText(record.aproboTerapia) === 'si',
    ).length;
    const noAdheridos = filteredEvaluaciones.filter(
      (record) => normalizeText(record.aproboTerapia) === 'no',
    ).length;

    return {
      adheridos,
      noAdheridos,
      total: adheridos + noAdheridos,
    };
  }, [filteredEvaluaciones]);

  const conductasData = useMemo<ConductaChartDatum[]>(() => {
    const counts = new Map<string, number>();

    filteredEvaluaciones.forEach((record) => {
      const conducta = normalizeConducta(record.conductaGeneral);
      counts.set(conducta, (counts.get(conducta) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([conducta, count]) => ({ conducta, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredEvaluaciones]);

  const servicioData = useMemo<ServicioChartDatum[]>(() => {
    const counts = new Map<string, number>();

    filteredEvaluaciones.forEach((record) => {
      const servicio = normalizeServicio(record.servicio);
      counts.set(servicio, (counts.get(servicio) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([servicio, count]) => ({ servicio, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredEvaluaciones]);

  const tipoData = useMemo<TipoIntervencionChartDatum[]>(() => {
    const base = new Map<'IC' | 'PROA' | 'REV', number>([
      ['IC', 0],
      ['PROA', 0],
      ['REV', 0],
    ]);

    filteredEvaluaciones.forEach((record) => {
      const tipo = normalizeTipo(record.tipoIntervencion);
      if (tipo === 'OTRO') {
        return;
      }

      base.set(tipo, (base.get(tipo) ?? 0) + 1);
    });

    return [
      { tipo: 'IC', label: 'Interconsultas', count: base.get('IC') ?? 0 },
      { tipo: 'PROA', label: 'Captadas PROA', count: base.get('PROA') ?? 0 },
      { tipo: 'REV', label: 'Revaloracion', count: base.get('REV') ?? 0 },
    ];
  }, [filteredEvaluaciones]);

  const isEmpty = useMemo(() => {
    const total = adherenciaData.total + conductasData.length + servicioData.length + tipoData.reduce((sum, item) => sum + item.count, 0);
    return total === 0;
  }, [adherenciaData.total, conductasData.length, servicioData.length, tipoData]);

  return {
    adherenciaData,
    conductasData,
    servicioData,
    tipoData,
    isLoading: recordsLoading,
    isEmpty,
  };
}
