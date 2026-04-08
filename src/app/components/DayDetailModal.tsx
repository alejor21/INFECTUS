import { X, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import type { InterventionRecord } from '../../types';

interface DayDetailModalProps {
  date: string;
  records: InterventionRecord[];
  onClose: () => void;
}

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${parseInt(day)} de ${monthNames[parseInt(month) - 1]} de ${year}`;
}

export function DayDetailModal({ date, records, onClose }: DayDetailModalProps) {
  const aprobadas = records.filter((r) => (r.aproboTerapia ?? '').trim().toUpperCase() === 'SI').length;
  const rechazadas = records.filter((r) => (r.aproboTerapia ?? '').trim().toUpperCase() === 'NO').length;
  const tasaAprobacion = records.length > 0 ? Math.round((aprobadas / records.length) * 100) : 0;

  // Get unique antibiotics used
  const antibiotics = new Set<string>();
  records.forEach((r) => {
    if (r.antibiotico01?.trim()) antibiotics.add(r.antibiotico01.trim());
    if (r.antibiotico02?.trim()) antibiotics.add(r.antibiotico02.trim());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-teal-50 dark:bg-teal-900/20">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Evaluaciones del día
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDisplayDate(date)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* KPIs del día */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4">
              <p className="text-xs text-teal-600 dark:text-teal-400 mb-1">Total</p>
              <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                {records.length}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-xs text-green-600 dark:text-green-400 mb-1">Aprobadas</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {aprobadas}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <p className="text-xs text-red-600 dark:text-red-400 mb-1">Rechazadas</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {rechazadas}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">% Aprobación</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {tasaAprobacion}%
              </p>
            </div>
          </div>
        </div>

        {/* Lista de evaluaciones */}
        <div className="p-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Evaluaciones ({records.length})
          </h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {records.map((record, idx) => (
              <div
                key={idx}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {record.nombre || 'Paciente sin nombre'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {record.servicio || 'Sin servicio'} • {record.diagnostico || 'Sin diagnóstico'}
                    </p>
                  </div>
                  {record.aproboTerapia && (
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      record.aproboTerapia.trim().toUpperCase() === 'SI'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {record.aproboTerapia.trim().toUpperCase() === 'SI' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {record.aproboTerapia.trim().toUpperCase() === 'SI' ? 'Aprobada' : 'Rechazada'}
                    </span>
                  )}
                </div>
                {(record.antibiotico01 || record.antibiotico02) && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {record.antibiotico01 && (
                      <span className="text-[10px] px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded font-mono">
                        {record.antibiotico01}
                      </span>
                    )}
                    {record.antibiotico02 && (
                      <span className="text-[10px] px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded font-mono">
                        {record.antibiotico02}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Antibióticos usados */}
        {antibiotics.size > 0 && (
          <div className="px-6 pb-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Antibióticos utilizados ({antibiotics.size})
            </h4>
            <div className="flex flex-wrap gap-2">
              {Array.from(antibiotics).map((atb, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full"
                >
                  {atb}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
