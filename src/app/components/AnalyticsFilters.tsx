import { Calendar, X } from 'lucide-react';
import { useState } from 'react';

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

interface AnalyticsFiltersProps {
  dateRange: DateRange | null;
  onDateRangeChange: (range: DateRange | null) => void;
  selectedServicio: string;
  onServicioChange: (servicio: string) => void;
  selectedTipo: string;
  onTipoChange: (tipo: string) => void;
  servicios: string[];
  tipos: string[];
}

const QUICK_RANGES = [
  { label: 'Último mes', days: 30 },
  { label: 'Últimos 3 meses', days: 90 },
  { label: 'Último año', days: 365 },
];

export function AnalyticsFilters({
  dateRange,
  onDateRangeChange,
  selectedServicio,
  onServicioChange,
  selectedTipo,
  onTipoChange,
  servicios,
  tipos,
}: AnalyticsFiltersProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempFrom, setTempFrom] = useState(dateRange?.from ?? '');
  const [tempTo, setTempTo] = useState(dateRange?.to ?? '');

  const handleQuickRange = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    
    const range: DateRange = {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };
    
    onDateRangeChange(range);
    setShowDatePicker(false);
  };

  const handleApplyCustomRange = () => {
    if (tempFrom && tempTo) {
      onDateRangeChange({ from: tempFrom, to: tempTo });
      setShowDatePicker(false);
    }
  };

  const handleClearFilters = () => {
    onDateRangeChange(null);
    onServicioChange('');
    onTipoChange('');
  };

  const hasActiveFilters = dateRange || selectedServicio || selectedTipo;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Range */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              dateRange
                ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">
              {dateRange ? 'Rango personalizado' : 'Filtrar por fecha'}
            </span>
          </button>

          {showDatePicker && (
            <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-20 min-w-[280px]">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">
                Rangos rápidos
              </p>
              <div className="space-y-2 mb-4">
                {QUICK_RANGES.map((range) => (
                  <button
                    key={range.days}
                    onClick={() => handleQuickRange(range.days)}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {range.label}
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">
                  Rango personalizado
                </p>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Desde
                    </label>
                    <input
                      type="date"
                      value={tempFrom}
                      onChange={(e) => setTempFrom(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Hasta
                    </label>
                    <input
                      type="date"
                      value={tempTo}
                      onChange={(e) => setTempTo(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <button
                    onClick={handleApplyCustomRange}
                    disabled={!tempFrom || !tempTo}
                    className="w-full px-3 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Servicio Filter */}
        {servicios.length > 0 && (
          <select
            value={selectedServicio}
            onChange={(e) => onServicioChange(e.target.value)}
            className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
              selectedServicio
                ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            <option value="">Todos los servicios</option>
            {servicios.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}

        {/* Tipo Filter */}
        {tipos.length > 0 && (
          <select
            value={selectedTipo}
            onChange={(e) => onTipoChange(e.target.value)}
            className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
              selectedTipo
                ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            <option value="">Todos los tipos</option>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {dateRange && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs rounded-full">
              📅 {dateRange.from} → {dateRange.to}
            </span>
          )}
          {selectedServicio && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs rounded-full">
              🏥 {selectedServicio}
            </span>
          )}
          {selectedTipo && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs rounded-full">
              📋 {selectedTipo}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
