import { CheckCircle2 } from 'lucide-react';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

const TYPE_STYLES = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    icon: 'text-green-600 dark:text-green-400',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: 'text-red-600 dark:text-red-400',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'text-blue-600 dark:text-blue-400',
  },
};

export function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  const styles = TYPE_STYLES[type];

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 ${styles.bg} border ${styles.border} rounded-lg px-4 py-3 shadow-lg max-w-md animate-slide-up`}>
      <CheckCircle2 className={`w-5 h-5 ${styles.icon} shrink-0`} />
      <p className={`text-sm font-medium ${styles.text}`}>{message}</p>
    </div>
  );
}
