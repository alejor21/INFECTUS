import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useHospitalContext } from '../contexts/HospitalContext';
import {
  deleteAlert as deleteAlertFromDb,
  getAlerts,
  markAlertRead,
  markAllAlertsRead,
  saveAlert,
} from '../lib/supabase/alerts';
import type { Alert } from '../lib/supabase/alerts';
import type { Hospital } from '../lib/supabase/hospitals';
import type { InterventionRecord } from '../types';

let autoGenerationDone = false;

const ALERTS_UPDATED_EVENT = 'infectus:alerts-updated';
const ALERTS_FETCH_ERROR =
  'No se pudieron cargar las alertas. Intenta nuevamente.';
const ALERTS_UPDATE_ERROR =
  'No se pudo actualizar la alerta. Intenta nuevamente.';
const ALERTS_DELETE_ERROR =
  'No se pudo eliminar la alerta. Intenta nuevamente.';

const CARBAPENEMS = ['Meropenem', 'Imipenem', 'Ertapenem', 'Doripenem'];

const pct = (numerator: number, denominator: number): number =>
  denominator === 0 ? 0 : Math.round((numerator / denominator) * 1000) / 10;

function isYes(value: string | undefined): boolean {
  return (value ?? '').trim().toUpperCase() === 'SI';
}

function notifyAlertsUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ALERTS_UPDATED_EVENT));
  }
}

function generateAutoAlerts(
  records: InterventionRecord[],
  hospitals: Hospital[],
  selectedHospitalObj: Hospital | null,
): void {
  const hospitalsToCheck = selectedHospitalObj
    ? [selectedHospitalObj]
    : hospitals;

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
        title: `Adecuacion terapeutica baja - ${hospital.name}`,
        message: `La adecuacion terapeutica es del ${adequacy.toFixed(
          1,
        )}%, por debajo del umbral del 60%.`,
        metric_value: adequacy,
        threshold_value: 60,
        is_read: false,
      }).catch(() => undefined);
    }

    const carbapenemCount = hospitalRecords.filter((record) =>
      CARBAPENEMS.some(
        (carbapenem) =>
          (record.antibiotico01 ?? '')
            .toLowerCase()
            .includes(carbapenem.toLowerCase()) ||
          (record.antibiotico02 ?? '')
            .toLowerCase()
            .includes(carbapenem.toLowerCase()),
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
        message: `El ${carbapenemRate.toFixed(
          1,
        )}% de las intervenciones usan carbapenems (umbral: 20%).`,
        metric_value: carbapenemRate,
        threshold_value: 20,
        is_read: false,
      }).catch(() => undefined);
    }

    const withCulture = hospitalRecords.filter((record) => {
      const cultivosPrevios = (record.cultivosPrevios ?? '')
        .trim()
        .toUpperCase();
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
        message: `Solo el ${cultureRate.toFixed(
          1,
        )}% de los pacientes tienen cultivo registrado (umbral: 30%).`,
        metric_value: cultureRate,
        threshold_value: 30,
        is_read: false,
      }).catch(() => undefined);
    }
  }
}

export function useAlerts() {
  const { selectedHospitalObj, allRawRecords, hospitals } =
    useHospitalContext();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAlertId, setMarkingAlertId] = useState<string | null>(null);
  const [deletingAlertId, setDeletingAlertId] = useState<string | null>(null);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAlerts(selectedHospitalObj?.id);
      setAlerts(data);
    } catch {
      setAlerts([]);
      setError(ALERTS_FETCH_ERROR);
    } finally {
      setLoading(false);
    }
  }, [selectedHospitalObj?.id]);

  useEffect(() => {
    void fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    if (
      autoGenerationDone ||
      allRawRecords.length === 0 ||
      hospitals.length === 0
    ) {
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
    setMarkingAlertId(id);
    setError(null);

    try {
      await markAlertRead(id);
      setAlerts((previousAlerts) =>
        previousAlerts.map((alert) =>
          alert.id === id ? { ...alert, is_read: true } : alert,
        ),
      );
      notifyAlertsUpdated();
      toast.success('Alerta marcada como leida.');
    } catch {
      setError(ALERTS_UPDATE_ERROR);
      toast.error(ALERTS_UPDATE_ERROR);
    } finally {
      setMarkingAlertId(null);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setMarkingAllAsRead(true);
    setError(null);

    try {
      await markAllAlertsRead(selectedHospitalObj?.id);
      setAlerts((previousAlerts) =>
        previousAlerts.map((alert) => ({ ...alert, is_read: true })),
      );
      notifyAlertsUpdated();
      toast.success('Todas las alertas fueron marcadas como leidas.');
    } catch {
      setError(ALERTS_UPDATE_ERROR);
      toast.error(ALERTS_UPDATE_ERROR);
    } finally {
      setMarkingAllAsRead(false);
    }
  }, [selectedHospitalObj?.id]);

  const removeAlert = useCallback(async (id: string) => {
    setDeletingAlertId(id);
    setError(null);

    try {
      await deleteAlertFromDb(id);
      setAlerts((previousAlerts) =>
        previousAlerts.filter((alert) => alert.id !== id),
      );
      notifyAlertsUpdated();
      toast.success('Alerta eliminada correctamente.');
    } catch {
      setError(ALERTS_DELETE_ERROR);
      toast.error(ALERTS_DELETE_ERROR);
      throw new Error(ALERTS_DELETE_ERROR);
    } finally {
      setDeletingAlertId(null);
    }
  }, []);

  return {
    alerts,
    unreadCount,
    loading,
    error,
    markingAlertId,
    deletingAlertId,
    markingAllAsRead,
    refresh: fetchAlerts,
    markRead,
    markAllRead,
    deleteAlert: removeAlert,
  };
}

export function useAlertBadge(): number {
  const { selectedHospitalObj } = useHospitalContext();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const data = await getAlerts(selectedHospitalObj?.id);
      setUnreadCount(data.filter((alert) => !alert.is_read).length);
    } catch {
      setUnreadCount(0);
    }
  }, [selectedHospitalObj?.id]);

  useEffect(() => {
    void refreshUnreadCount();

    const handleAlertsUpdated = () => {
      void refreshUnreadCount();
    };

    window.addEventListener(ALERTS_UPDATED_EVENT, handleAlertsUpdated);

    return () => {
      window.removeEventListener(
        ALERTS_UPDATED_EVENT,
        handleAlertsUpdated,
      );
    };
  }, [refreshUnreadCount]);

  return unreadCount;
}
