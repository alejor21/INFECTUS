import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = 'Cargando datos...',
  className = '',
}: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-4 animate-pulse">
        <Loader2 className="w-6 h-6 text-teal-600 dark:text-teal-400 animate-spin" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {message}
      </p>
    </div>
  );
}

export default LoadingState;
