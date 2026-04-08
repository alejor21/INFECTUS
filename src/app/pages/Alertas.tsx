import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useHospitalContext } from '../../contexts/HospitalContext';
import { useAlerts } from '../../hooks/useAlerts';
import type { Alert } from '../../lib/supabase/alerts';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';

type SeverityFilter = 'all' | 'alta' | 'media' | 'baja';

const SEVERITY_LABELS: Record<'alta' | 'media' | 'baja', string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

const SEVERITY_BORDER: Record<'alta' | 'media' | 'baja', string> = {
  alta: 'border-l-red-500',
  media: 'border-l-amber-500',
  baja: 'border-l-green-500',
};

const SEVERITY_ICON_COLOR: Record<'alta' | 'media' | 'baja', string> = {
  alta: 'text-red-500',
  media: 'text-amber-500',
  baja: 'text-green-500',
};

const SEVERITY_BADGE: Record<'alta' | 'media' | 'baja', string> = {
  alta: 'bg-red-100 text-red-700',
  media: 'bg-amber-100 text-amber-700',
  baja: 'bg-green-100 text-green-700',
};

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 60) {
    return `hace ${diffMinutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `hace ${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
}

export function Alertas() {
  const { hospitals } = useHospitalContext();
  const {
    alerts,
    unreadCount,
    loading,
    error,
    markingAlertId,
    deletingAlertId,
    markingAllAsRead,
    markRead,
    markAllRead,
    deleteAlert,
    refresh,
  } = useAlerts();
  const [severityFilter, setSeverityFilter] =
    useState<SeverityFilter>('all');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [alertToDelete, setAlertToDelete] = useState<Alert | null>(null);

  const filteredAlerts: Alert[] = useMemo(
    () =>
      alerts.filter((alert) => {
        if (
          severityFilter !== 'all' &&
          alert.severity !== severityFilter
        ) {
          return false;
        }

        if (hospitalFilter && alert.hospital_id !== hospitalFilter) {
          return false;
        }

        return true;
      }),
    [alerts, severityFilter, hospitalFilter],
  );

  const hasActiveFilters =
    severityFilter !== 'all' || hospitalFilter !== '';

  function clearFilters(): void {
    setSeverityFilter('all');
    setHospitalFilter('');
  }

  return (
    <>
      <div className="p-4 lg:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 lg:mb-8">
          <div className="flex items-center gap-3">
            <h1
              className="text-3xl font-bold"
              style={{ color: '#0B3C5D' }}
            >
              Alertas del Sistema
            </h1>
            {unreadCount > 0 ? (
              <span className="inline-flex items-center rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              void markAllRead();
            }}
            disabled={loading || unreadCount === 0 || markingAllAsRead}
            className="flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {markingAllAsRead ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Marcar todas como leidas
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3 overflow-x-auto pb-1">
          <div className="shrink-0 rounded-lg bg-gray-100 p-1">
            {(['all', 'alta', 'media', 'baja'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  severityFilter === sev
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {sev === 'all' ? 'Todas' : SEVERITY_LABELS[sev]}
              </button>
            ))}
          </div>

          <label htmlFor="alerts-hospital-filter" className="sr-only">
            Filtrar alertas por hospital
          </label>
          <select
            id="alerts-hospital-filter"
            value={hospitalFilter}
            onChange={(event) => setHospitalFilter(event.target.value)}
            className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Todos los hospitales</option>
            {hospitals.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name}
              </option>
            ))}
          </select>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-red-700">
                  No se pudieron cargar las alertas.
                </p>
                <p className="mt-1 text-sm text-red-600">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void refresh();
                }}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <p className="text-sm">Cargando alertas...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white">
            <EmptyState
              icon={CheckCircle}
              title={
                hasActiveFilters
                  ? 'No hay alertas con estos filtros'
                  : 'No hay alertas activas'
              }
              description={
                hasActiveFilters
                  ? 'Prueba limpiando los filtros para revisar otras alertas del sistema.'
                  : 'El sistema no detecto alertas activas para el hospital y periodo seleccionados.'
              }
              action={
                hasActiveFilters
                  ? { label: 'Limpiar filtros', onClick: clearFilters }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
              const isMarking = markingAlertId === alert.id;
              const isDeleting = deletingAlertId === alert.id;
              const isBusy = isMarking || isDeleting;

              return (
                <div
                  key={alert.id}
                  className={`rounded-xl border border-l-4 border-gray-200 bg-white p-3 transition-all lg:p-5 ${
                    SEVERITY_BORDER[alert.severity]
                  } ${!alert.is_read ? 'bg-gray-50' : 'opacity-70'}`}
                >
                  <div className="flex items-start gap-4">
                    <AlertTriangle
                      className={`mt-0.5 h-5 w-5 shrink-0 ${
                        SEVERITY_ICON_COLOR[alert.severity]
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {alert.title}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {alert.message}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                          {alert.hospital_name}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            SEVERITY_BADGE[alert.severity]
                          }`}
                        >
                          {SEVERITY_LABELS[alert.severity]}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTimeAgo(alert.created_at)}
                        </span>

                        <div className="ml-auto flex items-center gap-2">
                          {!alert.is_read ? (
                            <button
                              type="button"
                              onClick={() => {
                                void markRead(alert.id);
                              }}
                              disabled={isBusy}
                              className="text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                              style={{ color: '#0F8B8D' }}
                            >
                              {isMarking ? 'Marcando...' : 'Marcar leida'}
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => setAlertToDelete(alert)}
                            disabled={isBusy}
                            aria-label={`Eliminar alerta ${alert.title}`}
                            title="Eliminar alerta"
                            className="rounded p-1 text-gray-400 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={alertToDelete !== null}
        title="Eliminar alerta"
        description={
          alertToDelete
            ? `Se eliminara la alerta "${alertToDelete.title}". Esta accion no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar"
        isDangerous
        isLoading={
          alertToDelete !== null &&
          deletingAlertId === alertToDelete.id
        }
        onCancel={() => setAlertToDelete(null)}
        onConfirm={() => {
          if (!alertToDelete) {
            return;
          }

          void deleteAlert(alertToDelete.id).finally(() =>
            setAlertToDelete(null),
          );
        }}
      />
    </>
  );
}
