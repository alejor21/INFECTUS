import { useEffect, useState, useCallback } from 'react';
import { useHospitalContext } from '../contexts/HospitalContext';
import {
  getAlerts,
  markAlertRead,
  markAllAlertsRead,
  deleteAlert as deleteAlertFromDb,
  saveAlert,
} from '../lib/supabase/alerts';
import type { Alert } from '../lib/supabase/alerts';
import type { InterventionRecord } from '../types';
import type { Hospital } from '../lib/supabase/hospitals';

let autoGenerationDone = false;

const CARBAPENEMS = ['Meropenem', 'Imipenem', 'Ertapenem', 'Doripenem'];
const pct = (numerator: number, denominator: number): number =>
  denominator === 0 ? 0 : Math.round((numerator / denominator) * 1000) / 10;

function isYes(value: string | undefined): boolean {
  return (value ?? '').trim().toUpperCase() === 'SI';
}

function generateAutoAlerts(
  records: InterventionRecord[],
  hospitals: Hospital[],
  selectedHospitalObj: Hospital | null,
): void {
  const hospitalsToCheck = selectedHospitalObj ? [selectedHospitalObj] : hospitals;

  for (const hospital of hospitalsToCheck) {
    const hospitalRecords = records.filter((record) =>
      record.hospitalId
        ? record.hospitalId === hospital.id
        : record.hospitalName === hospital.name,
    );
    if (hospitalRecords.length === 0) {
      continue;
    }

    const adequacy = pct(
      hospitalRecords.filter((record) => isYes(record.aproboTerapia)).length,
      hospitalRecords.length,
    );

    if (adequacy < 60) {
      void saveAlert({
        hospital_id: hospital.id,
        hospital_name: hospital.name,
        type: 'adecuacion_terapeutica',
        severity: adequacy < 40 ? 'alta' : 'media',
        title: `Adecuación terapéutica baja - ${hospital.name}`,
        message: `La adecuación terapéutica es del ${adequacy.toFixed(1)}%, por debajo del umbral del 60%.`,
        metric_value: adequacy,
        threshold_value: 60,
        is_read: false,
      });
    }

    const carbapenemCount = hospitalRecords.filter((record) =>
      CARBAPENEMS.some(
        (carbapenem) =>
          (record.antibiotico01 ?? '').toLowerCase().includes(carbapenem.toLowerCase()) ||
          (record.antibiotico02 ?? '').toLowerCase().includes(carbapenem.toLowerCase()),
      ),
    ).length;

    const carbapenemRate = pct(carbapenemCount, hospitalRecords.length);
    if (carbapenemRate > 20) {
      void saveAlert({
        hospital_id: hospital.id,
        hospital_name: hospital.name,
        type: 'uso_carbapenems',
        severity: carbapenemRate > 35 ? 'alta' : 'media',
        title: `Alto uso de carbapenems - ${hospital.name}`,
        message: `El ${carbapenemRate.toFixed(1)}% de las intervenciones usan carbapenems (umbral: 20%).`,
        metric_value: carbapenemRate,
        threshold_value: 20,
        is_read: false,
      });
    }

    const withCulture = hospitalRecords.filter((record) => {
      const cultivosPrevios = (record.cultivosPrevios ?? '').trim().toUpperCase();
      return cultivosPrevios !== '' && cultivosPrevios !== 'NO';
    }).length;

    const cultureRate = pct(withCulture, hospitalRecords.length);
    if (cultureRate < 30) {
      void saveAlert({
        hospital_id: hospital.id,
        hospital_name: hospital.name,
        type: 'tasa_cultivos',
        severity: 'baja',
        title: `Baja tasa de cultivos - ${hospital.name}`,
        message: `Solo el ${cultureRate.toFixed(1)}% de los pacientes tienen cultivo registrado (umbral: 30%).`,
        metric_value: cultureRate,
        threshold_value: 30,
        is_read: false,
      });
    }
  }
}

export function useAlerts() {
  const { selectedHospitalObj, allRawRecords, hospitals } = useHospitalContext();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAlerts(selectedHospitalObj?.id);
      setAlerts(data);
    } finally {
      setLoading(false);
    }
  }, [selectedHospitalObj]);

  useEffect(() => {
    void fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    if (autoGenerationDone || allRawRecords.length === 0 || hospitals.length === 0) {
      return undefined;
    }

    autoGenerationDone = true;
    generateAutoAlerts(allRawRecords, hospitals, selectedHospitalObj);

    const timer = window.setTimeout(() => {
      void fetchAlerts();
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [allRawRecords, hospitals, selectedHospitalObj, fetchAlerts]);

  const unreadCount = alerts.filter((alert) => !alert.is_read).length;

  const markRead = useCallback(async (id: string) => {
    await markAlertRead(id);
    setAlerts((previousAlerts) =>
      previousAlerts.map((alert) => (alert.id === id ? { ...alert, is_read: true } : alert)),
    );
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllAlertsRead(selectedHospitalObj?.id);
    setAlerts((previousAlerts) => previousAlerts.map((alert) => ({ ...alert, is_read: true })));
  }, [selectedHospitalObj]);

  const removeAlert = useCallback(async (id: string) => {
    await deleteAlertFromDb(id);
    setAlerts((previousAlerts) => previousAlerts.filter((alert) => alert.id !== id));
  }, []);

  return {
    alerts,
    unreadCount,
    loading,
    refresh: fetchAlerts,
    markRead,
    markAllRead,
    deleteAlert: removeAlert,
  };
}

export function useAlertBadge(): number {
  const { selectedHospitalObj } = useHospitalContext();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    getAlerts(selectedHospitalObj?.id)
      .then((data) => setUnreadCount(data.filter((alert) => !alert.is_read).length))
      .catch(() => setUnreadCount(0));
  }, [selectedHospitalObj]);

  return unreadCount;
}
