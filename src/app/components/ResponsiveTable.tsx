import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface ResponsiveTableProps {
  columns: { key: string; label: string; sortable?: boolean }[];
  data: Record<string, any>[];
  onRowClick?: (row: Record<string, any>) => void;
  className?: string;
}

export function ResponsiveTable({
  columns,
  data,
  onRowClick,
  className = '',
}: ResponsiveTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Sin datos disponibles</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      {/* Desktop Table */}
      <table className="hidden md:table w-full">
        <thead className="border-b border-gray-200 dark:border-gray-700">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer' : ''}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data.map((row, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <button
              onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">
                  {row[columns[0].key]}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {row[columns[1]?.key]}
                </p>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expandedRow === idx ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedRow === idx && (
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 space-y-2">
                {columns.slice(2).map((col) => (
                  <div key={col.key} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{col.label}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {row[col.key]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResponsiveTable;
