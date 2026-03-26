import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import type { ParseResult } from '../../lib/parsers/excelParser';
import type { UploadResult } from '../../types';

interface ExcelUploadSummaryProps {
  parseResult: ParseResult | null;
  uploadResult: UploadResult | null;
  onClose: () => void;
}

export function ExcelUploadSummary({
  parseResult,
  uploadResult,
  onClose,
}: ExcelUploadSummaryProps) {
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    setShowErrors((uploadResult?.errors.length ?? 0) > 0);
  }, [uploadResult]);

  if (!parseResult && !uploadResult) {
    return null;
  }

  const insertedRows = uploadResult?.inserted ?? parseResult?.summary.validRows ?? 0;
  const errorCount = uploadResult?.errors.length ?? parseResult?.summary.errorRows ?? 0;
  const hasErrors = errorCount > 0;
  const hasWarnings =
    (parseResult?.summary.missingColumns.length ?? 0) > 0 ||
    (parseResult?.summary.warnings.length ?? 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Resumen de importación
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-2xl border border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950/40 p-4">
            <p className="text-sm font-semibold text-teal-800 dark:text-teal-200">
              ✅ {insertedRows} filas cargadas. ⚠️ {errorCount} filas con errores
            </p>
            {parseResult && (
              <p className="mt-2 text-xs text-teal-700 dark:text-teal-300">
                Total procesado: {parseResult.summary.totalRows} filas
              </p>
            )}
          </div>

          {parseResult?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {parseResult.summary.totalRows}
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-4">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Válidas</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {parseResult.summary.validRows}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/40 rounded-xl p-4">
                <p className="text-xs text-red-600 dark:text-red-400 mb-1">Errores</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {parseResult.summary.errorRows}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/40 rounded-xl p-4">
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Insertadas</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {insertedRows}
                </p>
              </div>
            </div>
          )}

          {insertedRows > 0 && (
            <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-900 dark:text-emerald-100">
                  Importación completada
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                  Se continuó con los registros válidos aunque algunas filas fueron omitidas.
                </p>
              </div>
            </div>
          )}

          {hasWarnings && parseResult && (
            <div className="space-y-3">
              {parseResult.summary.missingColumns.length > 0 && (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      Columnas críticas faltantes
                    </p>
                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                      {parseResult.summary.missingColumns.join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {parseResult.summary.warnings.length > 0 && (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      Advertencias
                    </p>
                    <div className="mt-2 space-y-1">
                      {parseResult.summary.warnings.map((warning) => (
                        <p
                          key={warning}
                          className="text-sm text-amber-700 dark:text-amber-300"
                        >
                          {warning}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {hasErrors && uploadResult && (
            <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40">
              <button
                onClick={() => setShowErrors((currentValue) => !currentValue)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left"
              >
                <span className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                  <span className="font-medium text-red-900 dark:text-red-100">
                    Panel de errores
                  </span>
                </span>
                <span className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                  {errorCount} fila{errorCount === 1 ? '' : 's'}
                  {showErrors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              {showErrors && (
                <div className="px-4 pb-4 space-y-2">
                  {uploadResult.errors.map((error) => (
                    <div
                      key={`${error.row}-${error.message}`}
                      className="rounded-xl bg-white dark:bg-gray-900 border border-red-100 dark:border-red-950 p-3 text-sm text-red-700 dark:text-red-300"
                    >
                      {error.row > 0 ? `Fila ${error.row}: ` : ''}
                      {error.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
