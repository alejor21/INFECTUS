import { Pie, PieChart, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartEmptyState, ChartLoadingState } from '../../ChartEmptyState';
import { ProaChartCard } from './ProaChartCard';
import { formatPct } from '../../../../lib/analytics/proaCommittee';
import type { AdherenciaChartData } from '../../../../hooks/useProaCharts';

interface AdherenciaChartProps {
  cardId: string;
  title: string;
  subtitle: string;
  data: AdherenciaChartData;
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

export function AdherenciaChart({
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
}: AdherenciaChartProps) {
  const chartData = [
    { name: `Adheridos (${data.adheridos})`, shortName: 'Adheridos', value: data.adheridos, color: '#1E6091' },
    { name: `No adherencia (${data.noAdheridos})`, shortName: 'No adherencia', value: data.noAdheridos, color: '#E07B00' },
  ].filter((item) => item.value > 0);

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
        <ChartLoadingState message="Preparando grafica de adherencia..." />
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
              dataKey="value"
              labelLine={false}
              label={renderPercentageLabel}
            >
              {chartData.map((item) => (
                <Cell key={item.name} fill={item.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`${value} casos`, 'Cantidad']} />
            <Legend verticalAlign="bottom" align="center" iconType="circle" formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-300">{String(value)}</span>} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ProaChartCard>
  );
}
