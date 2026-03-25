import { BarChart3, Loader2 } from 'lucide-react';

interface ChartEmptyStateProps {
  message?: string;
}

export function ChartEmptyState({ message = 'Sin datos suficientes' }: ChartEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      <BarChart3 className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{message}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        No hay información disponible para mostrar
      </p>
    </div>
  );
}

interface ChartLoadingStateProps {
  message?: string;
}

export function ChartLoadingState({ message = 'Cargando datos...' }: ChartLoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      <Loader2 className="w-12 h-12 text-teal-500 dark:text-teal-400 animate-spin mb-3" />
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
}

interface ChartSkeletonProps {
  height?: string;
}

export function ChartSkeleton({ height = '320px' }: ChartSkeletonProps) {
  return (
    <div className="animate-pulse" style={{ height }}>
      <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
      <div className="space-y-3">
        <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded"></div>
        <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-5/6"></div>
        <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-4/6"></div>
        <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-3/6"></div>
        <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-2/6"></div>
      </div>
    </div>
  );
}
