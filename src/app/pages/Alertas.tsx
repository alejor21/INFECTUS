import { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle, Trash2, Check } from 'lucide-react';
import { useAlerts } from '../../hooks/useAlerts';
import { useHospitalContext } from '../../contexts/HospitalContext';
import type { Alert } from '../../lib/supabase/alerts';

type SeverityFilter = 'all' | 'alta' | 'media' | 'baja';

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60)
    return `hace ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24)
    return `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  const diffDays = Math.floor(diffHours / 24);
  return `hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
}

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

export function Alertas() {
  const { hospitals } = useHospitalContext();
  const { alerts, unreadCount, loading, markRead, markAllRead, deleteAlert } = useAlerts();
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [hospitalFilter, setHospitalFilter] = useState('');

  const filteredAlerts: Alert[] = useMemo(
    () =>
      alerts.filter((a) => {
        if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
        if (hospitalFilter && a.hospital_id !== hospitalFilter) return false;
        return true;
      }),
    [alerts, severityFilter, hospitalFilter],
  );

  return (
    <div className="p-4 lg:p-8">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold" style={{ color: '#0B3C5D' }}>
            Alertas del Sistema
          </h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={markAllRead}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors min-h-[44px]"
        >
          <Check className="w-4 h-4" />
          Marcar todas como leídas
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-1">
        {/* Severity filter pills */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg shrink-0">
          {(['all', 'alta', 'media', 'baja'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                severityFilter === sev
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {sev === 'all' ? 'Todas' : SEVERITY_LABELS[sev]}
            </button>
          ))}
        </div>

        {/* Hospital dropdown */}
        <select
          value={hospitalFilter}
          onChange={(e) => setHospitalFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 shrink-0"
        >
          <option value="">Todos los hospitales</option>
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <p className="text-sm">Cargando alertas…</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <CheckCircle className="w-12 h-12 mb-3 text-green-400" />
          <p className="text-lg font-semibold text-gray-500">No hay alertas activas</p>
          <p className="text-sm mt-1">
            El sistema no detectó ninguna alerta con los filtros actuales.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-xl border border-gray-200 border-l-4 ${SEVERITY_BORDER[alert.severity]} p-3 lg:p-5 transition-all ${
                !alert.is_read ? 'bg-gray-50' : 'opacity-70'
              }`}
            >
              <div className="flex items-start gap-4">
                <AlertTriangle
                  className={`w-5 h-5 mt-0.5 shrink-0 ${SEVERITY_ICON_COLOR[alert.severity]}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{alert.title}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{alert.message}</p>

                  <div className="flex items-center flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                      {alert.hospital_name}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_BADGE[alert.severity]}`}
                    >
                      {SEVERITY_LABELS[alert.severity]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(alert.created_at)}
                    </span>

                    <div className="ml-auto flex items-center gap-2">
                      {!alert.is_read && (
                        <button
                          onClick={() => markRead(alert.id)}
                          className="text-xs font-medium transition-colors"
                          style={{ color: '#0F8B8D' }}
                          onMouseOver={(e) =>
                            ((e.currentTarget as HTMLButtonElement).style.color = '#0B3C5D')
                          }
                          onMouseOut={(e) =>
                            ((e.currentTarget as HTMLButtonElement).style.color = '#0F8B8D')
                          }
                        >
                          Marcar leída
                        </button>
                      )}
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        title="Eliminar alerta"
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
