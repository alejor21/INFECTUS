import { useMemo } from 'react';
import { useHospitalContext } from '../contexts/HospitalContext';
import { filterByService } from '../lib/analytics/dateFilters';
import {
  calcAntibioticUseRate,
  calcTherapeuticAdequacy,
  calcIAASRate,
  calcGuidelineCompliance,
  calcTop5Antibiotics,
  calcMonthlyConsumption,
  calcIAASDistribution,
  calcConductaDistribution,
  calcMonthlyCompliance,
  calcCultivosPreRate,
  calcAvgTherapyDays,
  calcMRSARate,
  calcBLEERate,
  calcCarbapenemaseRate,
  calcPositiveCultureRate,
  calcOrganismDistribution,
  calcResistanceByService,
  calcSensitivityMatrix,
  calcResistanceTrend,
} from '../lib/analytics/kpiCalculator';
import type { InterventionRecord, KPIMetrics } from '../types';

interface UseAnalyticsParams {
  // months and hospital are kept for backward compat but are now ignored —
  // filtering is handled by HospitalContext (selectedHospitalObj + dateRange).
  months?: 1 | 6 | 12;
  hospital?: string;
  service?: string;
}

interface UseAnalyticsReturn {
  kpis: KPIMetrics;
  monthlyConsumption: { month: string; ddd: number }[];
  top5Antibiotics: { name: string; count: number }[];
  iaasDistribution: { type: string; count: number }[];
  conductaDistribution: { conducta: string; count: number }[];
  monthlyCompliance: { month: string; rate: number }[];
  cultivosPreRate: number;
  avgTherapyDays: number;
  records: InterventionRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  // Resistance analytics
  mrsaRate: number;
  bleeRate: number;
  carbapenemaseRate: number;
  positiveCultureRate: number;
  organismDistribution: { type: string; count: number }[];
  resistanceByService: { servicio: string; ecoli: number; kpneumoniae: number; pseudomonas: number }[];
  sensitivityMatrix: { organismo: string; vancomicina: string; meropenem: string; count: number }[];
  resistanceTrend: { month: string; blee: number; mrsa: number; carba: number }[];
}

const EMPTY_KPIS: KPIMetrics = {
  antibioticUseRate: 0,
  avgTherapyDays: 0,
  therapeuticAdequacy: 0,
  iaasRate: 0,
  guidelineCompliance: 0,
};

export function useAnalytics({ service }: UseAnalyticsParams = {}): UseAnalyticsReturn {
  const { records: contextRecords, recordsLoading, refreshRecords } = useHospitalContext();

  // Apply per-page service filter if provided (hospital + date filtering already done in context)
  const records = useMemo<InterventionRecord[]>(() => {
    if (!service) return contextRecords;
    return filterByService(contextRecords, service);
  }, [contextRecords, service]);

  const kpis = useMemo<KPIMetrics>(() => {
    if (records.length === 0) return EMPTY_KPIS;
    const avgTherapyDays = calcAvgTherapyDays(records);
    return {
      antibioticUseRate: avgTherapyDays,
      avgTherapyDays,
      therapeuticAdequacy: calcTherapeuticAdequacy(records),
      iaasRate: calcIAASRate(records, records.length),
      guidelineCompliance: calcGuidelineCompliance(records),
    };
  }, [records]);

  const monthlyConsumption   = useMemo(() => calcMonthlyConsumption(records), [records]);
  const top5Antibiotics      = useMemo(() => calcTop5Antibiotics(records), [records]);
  const iaasDistribution     = useMemo(() => calcIAASDistribution(records), [records]);
  const conductaDistribution = useMemo(() => calcConductaDistribution(records), [records]);
  const monthlyCompliance    = useMemo(() => calcMonthlyCompliance(records), [records]);
  const cultivosPreRate      = useMemo(() => calcCultivosPreRate(records), [records]);
  const avgTherapyDays       = useMemo(() => calcAvgTherapyDays(records), [records]);
  const mrsaRate             = useMemo(() => calcMRSARate(records), [records]);
  const bleeRate             = useMemo(() => calcBLEERate(records), [records]);
  const carbapenemaseRate    = useMemo(() => calcCarbapenemaseRate(records), [records]);
  const positiveCultureRate  = useMemo(() => calcPositiveCultureRate(records), [records]);
  const organismDistribution = useMemo(() => calcOrganismDistribution(records), [records]);
  const resistanceByService  = useMemo(() => calcResistanceByService(records), [records]);
  const sensitivityMatrix    = useMemo(() => calcSensitivityMatrix(records), [records]);
  const resistanceTrend      = useMemo(() => calcResistanceTrend(records), [records]);

  return {
    kpis,
    monthlyConsumption,
    top5Antibiotics,
    iaasDistribution,
    conductaDistribution,
    monthlyCompliance,
    cultivosPreRate,
    avgTherapyDays,
    records,
    loading: recordsLoading,
    error: null,
    refetch: refreshRecords,
    mrsaRate,
    bleeRate,
    carbapenemaseRate,
    positiveCultureRate,
    organismDistribution,
    resistanceByService,
    sensitivityMatrix,
    resistanceTrend,
  };
}
