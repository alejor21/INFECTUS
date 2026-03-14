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

// Module-level flag ensures auto-generation runs only once per app session
// regardless of how many hook instances are mounted.
let autoGenerationDone = false;

const CARBAPENEMS = ['Meropenem', 'Imipenem', 'Ertapenem', 'Doripenem'];

function generateAutoAlerts(
  records: InterventionRecord[],
  hospitals: Hospital[],
  selectedHospitalObj: Hospital | null,
): void {
  const hospitalsToCheck = selectedHospitalObj ? [selectedHospitalObj] : hospitals;

  for (const hospital of hospitalsToCheck) {
    const hospitalRecords = records.filter((r) => r.hospitalName === hospital.name);
    if (hospitalRecords.length === 0) continue;

    // Alert 1: Low therapeutic adequacy
    const adequacy =
      (hospitalRecords.filter((r) => (r.aproboTerapia ?? '').trim().toUpperCase() === 'SI').length /
        hospitalRecords.length) *
      100;
    if (adequacy < 60) {
      saveAlert({
        hospital_id: hospital.id,
        hospital_name: hospital.name,
        type: 'adecuacion_terapeutica',
        severity: adequacy < 40 ? 'alta' : 'media',
        title: `Adecuación terapéutica baja — ${hospital.name}`,
        message: `La adecuación terapéutica es del ${adequacy.toFixed(1)}%, por debajo del umbral del 60%.`,
        metric_value: adequacy,
        threshold_value: 60,
        is_read: false,
      });
    }

    // Alert 2: High carbapenem use (checks both antibiotic slots)
    const carbapenemCount = hospitalRecords.filter((r) =>
      CARBAPENEMS.some(
        (c) =>
          (r.antibiotico01 ?? '').toLowerCase().includes(c.toLowerCase()) ||
          (r.antibiotico02 ?? '').toLowerCase().includes(c.toLowerCase()),
      ),
    ).length;
    const carbapenemRate = (carbapenemCount / hospitalRecords.length) * 100;
    if (carbapenemRate > 20) {
      saveAlert({
        hospital_id: hospital.id,
        hospital_name: hospital.name,
        type: 'uso_carbapenems',
        severity: carbapenemRate > 35 ? 'alta' : 'media',
        title: `Alto uso de carbapenems — ${hospital.name}`,
        message: `El ${carbapenemRate.toFixed(1)}% de las intervenciones usan carbapenems (umbral: 20%).`,
        metric_value: carbapenemRate,
        threshold_value: 20,
        is_read: false,
      });
    }

    // Alert 3: Low culture rate (uses cultivosPrevios field)
    const withCulture = hospitalRecords.filter((r) => {
      const c = (r.cultivosPrevios ?? '').trim();
      return c !== '' && c.toUpperCase() !== 'NO';
    }).length;
    const cultureRate = (withCulture / hospitalRecords.length) * 100;
    if (cultureRate < 30) {
      saveAlert({
        hospital_id: hospital.id,
        hospital_name: hospital.name,
        type: 'tasa_cultivos',
        severity: 'baja',
        title: `Baja tasa de cultivos — ${hospital.name}`,
        message: `Solo el ${cultureRate.toFixed(1)}% de los pacientes tienen cultivo registrado (umbral: 30%).`,
        metric_value: cultureRate,
        threshold_value: 30,
        is_read: false,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Full hook — used by the Alertas page
// ---------------------------------------------------------------------------

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

  // Fetch on mount and when selected hospital changes
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Auto-generate alerts once when records first load (module-level guard)
  useEffect(() => {
    if (autoGenerationDone) return;
    if (allRawRecords.length === 0 || hospitals.length === 0) return;
    autoGenerationDone = true;
    generateAutoAlerts(allRawRecords, hospitals, selectedHospitalObj);
    // Allow inserts to complete before refreshing the list
    const timer = setTimeout(() => fetchAlerts(), 1200);
    return () => clearTimeout(timer);
  }, [allRawRecords, hospitals, selectedHospitalObj, fetchAlerts]);

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  const markRead = useCallback(async (id: string) => {
    await markAlertRead(id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllAlertsRead(selectedHospitalObj?.id);
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
  }, [selectedHospitalObj]);

  const removeAlert = useCallback(async (id: string) => {
    await deleteAlertFromDb(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
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

// ---------------------------------------------------------------------------
// Lightweight badge hook — used by Sidebar and Header
// Only fetches the unread count; no auto-generation side effects.
// ---------------------------------------------------------------------------

export function useAlertBadge(): number {
  const { selectedHospitalObj } = useHospitalContext();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    getAlerts(selectedHospitalObj?.id)
      .then((data) => setUnreadCount(data.filter((a) => !a.is_read).length))
      .catch(() => setUnreadCount(0));
  }, [selectedHospitalObj]);

  return unreadCount;
}
