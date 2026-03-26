import type { ReactNode } from 'react';
import { Download } from 'lucide-react';

interface ProaChartCardProps {
  id: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  analysis: string[];
  onExport: () => void;
  chartHeightClassName?: string;
  showExportButton?: boolean;
  showAnalysis?: boolean;
}

export function ProaChartCard({
  id,
  title,
  subtitle,
  children,
  analysis,
  onExport,
  chartHeightClassName = 'h-80',
  showExportButton = true,
  showAnalysis = true,
}: ProaChartCardProps) {
  return (
    <div id={id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        {showExportButton ? (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            title="Descargar como imagen"
            aria-label="Descargar como imagen"
          >
            <Download className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className={chartHeightClassName}>{children}</div>

      {showAnalysis ? (
        <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          {analysis.map((line) => (
            <p key={line} className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
