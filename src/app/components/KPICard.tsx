import { TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface KPICardProps {
  title: string;
  value: string;
  unit?: string;
  trend?: number;
  trendPositive?: boolean;
  sparklineData: number[];
}

export function KPICard({ title, value, unit, trend, trendPositive, sparklineData }: KPICardProps) {
  const data = sparklineData.map((value, index) => ({ value, index }));
  const hasTrend = trend !== undefined;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">{title}</h3>

      <div className="flex items-end justify-between mb-4">
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold" style={{ color: '#0B3C5D' }}>
            {value}
          </span>
          {unit && <span className="text-sm text-gray-500 dark:text-gray-400">{unit}</span>}
        </div>

        {hasTrend && (
          <div
            className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
              trendPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
            }`}
          >
            {trendPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            <span
              className={`text-sm font-medium ${
                trendPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {trend! > 0 ? '+' : ''}{trend}%
            </span>
          </div>
        )}
      </div>

      {/* Sparkline */}
      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0F8B8D"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
