import { BarChart3, Loader2 } from 'lucide-react';

interface ChartEmptyStateProps {
  message?: string;
}

export function ChartEmptyState({ message = 'Sin datos suficientes' }: ChartEmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-12 text-center">
      <BarChart3 className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{message}</p>
      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
        No hay información disponible para mostrar.
      </p>
    </div>
  );
}

interface ChartLoadingStateProps {
  message?: string;
}

export function ChartLoadingState({ message = 'Cargando datos...' }: ChartLoadingStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-12 text-center">
      <Loader2 className="mb-3 h-12 w-12 animate-spin text-teal-500 dark:text-teal-400" />
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="h-80 animate-pulse">
      <div className="mb-4 h-6 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="space-y-3">
        <div className="h-8 rounded bg-gray-100 dark:bg-gray-800"></div>
        <div className="h-8 w-5/6 rounded bg-gray-100 dark:bg-gray-800"></div>
        <div className="h-8 w-4/6 rounded bg-gray-100 dark:bg-gray-800"></div>
        <div className="h-8 w-3/6 rounded bg-gray-100 dark:bg-gray-800"></div>
        <div className="h-8 w-2/6 rounded bg-gray-100 dark:bg-gray-800"></div>
      </div>
    </div>
  );
}
