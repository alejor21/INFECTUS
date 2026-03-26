import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm text-center">
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
