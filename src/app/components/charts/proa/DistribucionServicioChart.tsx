import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartEmptyState, ChartLoadingState } from '../../ChartEmptyState';
import type { ServicioChartDatum } from '../../../../hooks/useProaCharts';
import { formatPct } from '../../../../lib/analytics/proaCommittee';
import { ProaChartCard } from './ProaChartCard';

interface DistribucionServicioChartProps {
  cardId: string;
  title: string;
  subtitle: string;
  data: ServicioChartDatum[];
  analysis: string[];
  isLoading: boolean;
  onExport: () => void;
  chartHeightClassName?: string;
  showExportButton?: boolean;
  showAnalysis?: boolean;
}

interface PieLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

const COLORS = ['#1A5276', '#1F618D', '#2874A6', '#2E86C1', '#3498DB', '#5DADE2', '#85C1E9'];

function renderPercentageLabel({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  percent = 0,
}: PieLabelProps) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
  const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

  return (
    <text x={x} y={y} fill="#FFFFFF" textAnchor="middle" dominantBaseline="central" className="text-xs font-semibold">
      {formatPct(percent * 100)}
    </text>
  );
}

export function DistribucionServicioChart({
  cardId,
  title,
  subtitle,
  data,
  analysis,
  isLoading,
  onExport,
  chartHeightClassName,
  showExportButton,
  showAnalysis,
}: DistribucionServicioChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    name: `${item.servicio} (${item.count})`,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <ProaChartCard
      id={cardId}
      title={title}
      subtitle={subtitle}
      analysis={analysis}
      onExport={onExport}
      chartHeightClassName={chartHeightClassName}
      showExportButton={showExportButton}
      showAnalysis={showAnalysis}
    >
      {isLoading ? (
        <ChartLoadingState message="Preparando grafica por servicio..." />
      ) : chartData.length === 0 ? (
        <ChartEmptyState message="Sin datos para generar esta grafica" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              outerRadius={96}
              dataKey="count"
              labelLine={false}
              label={renderPercentageLabel}
            >
              {chartData.map((item) => (
                <Cell key={item.name} fill={item.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`${value} casos`, 'Cantidad']} />
            <Legend verticalAlign="bottom" iconType="circle" formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-300">{String(value)}</span>} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ProaChartCard>
  );
}
