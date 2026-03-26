import { Building2, Calendar, X } from 'lucide-react';

interface ActiveFiltersProps {
  hospital?: string | null;
  dateRange: '1m' | '6m' | '12m' | 'all';
  onClearHospital?: () => void;
  className?: string;
}

const DATE_RANGE_LABELS: Record<string, string> = {
  '1m': 'Último mes',
  '6m': 'Últimos 6 meses',
  '12m': 'Último año',
  all: 'Todos los datos',
};

export function ActiveFilters({
  hospital,
  dateRange,
  onClearHospital,
  className = '',
}: ActiveFiltersProps) {
  const hasFilters = hospital || dateRange !== 'all';

  if (!hasFilters) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 text-sm ${className}`}>
      <span className="text-gray-500 dark:text-gray-400">Mostrando:</span>
      
      {hospital && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full">
          <Building2 className="w-3.5 h-3.5" />
          <span className="font-medium">{hospital}</span>
          {onClearHospital && (
            <button
              onClick={onClearHospital}
              className="ml-1 p-0.5 hover:bg-teal-100 dark:hover:bg-teal-800 rounded-full transition-colors"
              title="Quitar filtro de hospital"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      )}

      {!hospital && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
          <Building2 className="w-3.5 h-3.5" />
          <span>Todos los hospitales</span>
        </span>
      )}

      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
        <Calendar className="w-3.5 h-3.5" />
        <span>{DATE_RANGE_LABELS[dateRange]}</span>
      </span>
    </div>
  );
}

export default ActiveFilters;
