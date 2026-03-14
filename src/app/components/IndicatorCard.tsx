import { LucideIcon, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

interface IndicatorCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  unit?: string;
  target: string;
  status: 'achieved' | 'progress' | 'warning';
  description: string;
  trend?: number;
  trendDirection?: 'up' | 'down';
}

export function IndicatorCard({ icon: Icon, title, value, unit, target, status, description }: IndicatorCardProps) {
  const statusConfig = {
    achieved: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      textColor: 'text-green-700',
      label: 'Objetivo cumplido',
      StatusIcon: CheckCircle,
    },
    progress: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-700',
      label: 'En progreso',
      StatusIcon: TrendingUp,
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-700',
      label: 'Requiere atención',
      StatusIcon: AlertTriangle,
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.StatusIcon;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0F8B8D' }}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-md ${config.bgColor} ${config.borderColor} border`}>
          <StatusIcon className={`w-3 h-3 ${config.iconColor}`} />
          <span className={`text-xs font-medium ${config.textColor}`}>{config.label}</span>
        </div>
      </div>

      <h3 className="text-sm font-medium text-gray-600 mb-3">{title}</h3>

      <div className="flex items-baseline space-x-2 mb-2">
        <span className="text-3xl font-bold" style={{ color: '#0B3C5D' }}>
          {value}
        </span>
        <span className="text-lg text-gray-500">{unit}</span>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <span className="text-sm text-gray-600">Objetivo:</span>
        <span className="text-sm font-semibold" style={{ color: '#0F8B8D' }}>
          {target}{unit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: `${Math.min((parseFloat(String(value)) / parseFloat(target)) * 100, 100)}%`,
            backgroundColor: '#0F8B8D',
          }}
        />
      </div>

      <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
