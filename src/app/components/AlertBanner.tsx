import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertBannerProps {
  type: AlertType;
  title: string;
  message?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const alertConfig = {
  info: {
    icon: Info,
    bgClass: 'bg-blue-50 dark:bg-blue-900/30',
    textClass: 'text-blue-800 dark:text-blue-200',
    iconClass: 'text-blue-500',
  },
  success: {
    icon: CheckCircle,
    bgClass: 'bg-green-50 dark:bg-green-900/30',
    textClass: 'text-green-800 dark:text-green-200',
    iconClass: 'text-green-500',
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-yellow-50 dark:bg-yellow-900/30',
    textClass: 'text-yellow-800 dark:text-yellow-200',
    iconClass: 'text-yellow-500',
  },
  error: {
    icon: AlertCircle,
    bgClass: 'bg-red-50 dark:bg-red-900/30',
    textClass: 'text-red-800 dark:text-red-200',
    iconClass: 'text-red-500',
  },
};

export function AlertBanner({
  type,
  title,
  message,
  dismissible = false,
  onDismiss,
  action,
}: AlertBannerProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  const config = alertConfig[type];
  const Icon = config.icon;

  const handleDismiss = () => {
    setIsOpen(false);
    onDismiss?.();
  };

  return (
    <div className={`rounded-lg p-4 ${config.bgClass}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${config.iconClass}`} />
        <div className="flex-1">
          <p className={`font-medium ${config.textClass}`}>{title}</p>
          {message && (
            <p className={`text-sm mt-1 opacity-90 ${config.textClass}`}>{message}</p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className={`text-sm font-medium mt-2 underline hover:no-underline ${config.textClass}`}
            >
              {action.label}
            </button>
          )}
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`p-1 rounded hover:opacity-75 transition-opacity ${config.textClass}`}
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default AlertBanner;
