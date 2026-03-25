import { Activity, CheckCircle2, FlaskConical, TrendingUp } from 'lucide-react';

interface AnalyticsKPICardProps {
  icon: 'total' | 'approval' | 'cultivos' | 'terapia';
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

const ICON_MAP = {
  total: Activity,
  approval: CheckCircle2,
  cultivos: FlaskConical,
  terapia: TrendingUp,
};

const COLOR_MAP = {
  total: {
    icon: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    border: 'border-teal-200 dark:border-teal-800',
  },
  approval: {
    icon: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
  },
  cultivos: {
    icon: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
  },
  terapia: {
    icon: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
  },
};

export function AnalyticsKPICard({ 
  icon, 
  label, 
  value, 
  subtitle, 
  trend,
  loading 
}: AnalyticsKPICardProps) {
  const Icon = ICON_MAP[icon];
  const colors = COLOR_MAP[icon];

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg ${colors.bg}`}></div>
          {trend && <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>}
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
        {subtitle && <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>}
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border ${colors.border} p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            trend.isPositive 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}>
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        {label}
      </p>
      
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </p>
      
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}
