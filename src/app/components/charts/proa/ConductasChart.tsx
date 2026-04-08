import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartEmptyState, ChartLoadingState } from '../../ChartEmptyState';
import type { ConductaChartDatum } from '../../../../hooks/useProaCharts';
import { ProaChartCard } from './ProaChartCard';

interface ConductasChartProps {
  cardId?: string;
  title?: string;
  subtitle?: string;
  data: ConductaChartDatum[];
  analysis?: string[];
  isLoading?: boolean;
  onExport?: () => void;
  chartHeightClassName?: string;
  showExportButton?: boolean;
  showAnalysis?: boolean;
}

export function ConductasChart({
  cardId = 'conductas-chart',
  title = 'Conductas recomendadas',
  subtitle = 'Frecuencia de acciones clinicas sugeridas',
  data,
  analysis = [],
  isLoading = false,
  onExport = () => {},
  chartHeightClassName,
  showExportButton,
  showAnalysis,
}: ConductasChartProps) {
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
        <ChartLoadingState message="Preparando grafica de conductas..." />
      ) : data.length === 0 ? (
        <ChartEmptyState message="Sin datos para generar esta grafica" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis type="number" stroke="#6B7280" tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="conducta"
              width={140}
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
            />
            <Tooltip formatter={(value: number) => [`${value} casos`, 'Numero de casos']} />
            <Bar dataKey="count" radius={[0, 10, 10, 0]}>
              {data.map((item) => (
                <Cell key={item.conducta} fill="#1E6091" />
              ))}
              <LabelList dataKey="count" position="right" className="fill-gray-600 dark:fill-gray-300" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ProaChartCard>
  );
}
