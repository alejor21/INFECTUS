import { Building2, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'hospital' | 'alert' | 'none';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const ICON_MAP = {
  hospital: Building2,
  alert: AlertCircle,
  none: null,
};

export function EmptyState({ icon = 'alert', title, description, action }: EmptyStateProps) {
  const Icon = ICON_MAP[icon];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
