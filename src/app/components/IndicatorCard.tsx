import { AlertTriangle, CheckCircle, LucideIcon, TrendingUp } from 'lucide-react';

interface IndicatorCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  unit?: string;
  target: string;
  status: 'achieved' | 'progress' | 'warning';
  description: string;
}

const statusConfig = {
  achieved: {
    badgeClassName:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    label: 'Dentro del objetivo',
    iconClassName: 'text-emerald-600 dark:text-emerald-300',
    Icon: CheckCircle,
  },
  progress: {
    badgeClassName:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    label: 'Vigilar tendencia',
    iconClassName: 'text-blue-600 dark:text-blue-300',
    Icon: TrendingUp,
  },
  warning: {
    badgeClassName:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    label: 'Requiere revisión',
    iconClassName: 'text-amber-600 dark:text-amber-300',
    Icon: AlertTriangle,
  },
} as const;

export function IndicatorCard({
  icon: Icon,
  title,
  value,
  unit,
  target,
  status,
  description,
}: IndicatorCardProps) {
  const config = statusConfig[status];
  const StatusIcon = config.Icon;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300">
          <Icon className="h-6 w-6" />
        </div>
        <div
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${config.badgeClassName}`}
        >
          <StatusIcon className={`h-3.5 w-3.5 ${config.iconClassName}`} />
          {config.label}
        </div>
      </div>

      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
        {unit ? <span className="text-base text-gray-500 dark:text-gray-400">{unit}</span> : null}
      </div>

      <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-950/60">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
          Objetivo de referencia: {target}
          {unit}
        </p>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}
