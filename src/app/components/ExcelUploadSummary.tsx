import { CheckCircle2, AlertCircle, AlertTriangle, FileSpreadsheet, X } from 'lucide-react';
import type { ParseResult } from '../../lib/parsers/excelParser';
import type { UploadResult } from '../../types';

interface ExcelUploadSummaryProps {
  parseResult: ParseResult | null;
  uploadResult: UploadResult | null;
  onClose: () => void;
}

export function ExcelUploadSummary({ parseResult, uploadResult, onClose }: ExcelUploadSummaryProps) {
  if (!parseResult && !uploadResult) return null;

  const hasErrors = (uploadResult?.errors.length ?? 0) > 0;
  const hasWarnings = (parseResult?.summary.missingColumns.length ?? 0) > 0 || 
                      (parseResult?.summary.warnings?.length ?? 0) > 0 ||
                      (parseResult?.aiWarning);
  const isSuccess = !hasErrors && uploadResult && uploadResult.inserted > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between ${
          isSuccess ? 'bg-green-50 dark:bg-green-900/20' :
          hasErrors ? 'bg-red-50 dark:bg-red-900/20' :
          'bg-amber-50 dark:bg-amber-900/20'
        }`}>
          <div className="flex items-center gap-3">
            <FileSpreadsheet className={`w-6 h-6 ${
              isSuccess ? 'text-green-600 dark:text-green-400' :
              hasErrors ? 'text-red-600 dark:text-red-400' :
              'text-amber-600 dark:text-amber-400'
            }`} />
            <h3 className={`text-lg font-semibold ${
              isSuccess ? 'text-green-900 dark:text-green-100' :
              hasErrors ? 'text-red-900 dark:text-red-100' :
              'text-amber-900 dark:text-amber-100'
            }`}>
              Resumen de Importación
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary Stats */}
          {parseResult?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Filas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {parseResult.summary.totalRows}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-xs text-green-600 dark:text-green-400 mb-1">Válidas</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {parseResult.summary.validRows}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <p className="text-xs text-red-600 dark:text-red-400 mb-1">Con Errores</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {parseResult.summary.errorRows}
                </p>
              </div>
              {uploadResult && (
                <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4">
                  <p className="text-xs text-teal-600 dark:text-teal-400 mb-1">Insertadas</p>
                  <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                    {uploadResult.inserted}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Success Message */}
          {isSuccess && uploadResult && (
            <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  ✅ Importación completada exitosamente
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Se cargaron {uploadResult.inserted} registros correctamente
                </p>
              </div>
            </div>
          )}

          {/* Warnings */}
          {hasWarnings && (
            <div className="space-y-3">
              {parseResult?.summary.missingColumns && parseResult.summary.missingColumns.length > 0 && (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                      ⚠️ Columnas requeridas faltantes
                    </p>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                      {parseResult.summary.missingColumns.map((col) => (
                        <li key={col} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          {col}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      Los datos se procesaron con los campos disponibles
                    </p>
                  </div>
                </div>
              )}

              {parseResult?.aiWarning && (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {parseResult.aiWarning}
                    </p>
                  </div>
                </div>
              )}

              {/* Data warnings (dates, etc.) */}
              {parseResult?.summary.warnings && parseResult.summary.warnings.length > 0 && (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                      ⚠️ Advertencias de datos ({parseResult.summary.warnings.length})
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {parseResult.summary.warnings.slice(0, 5).map((warning, idx) => (
                        <p key={idx} className="text-sm text-amber-700 dark:text-amber-300">
                          {warning}
                        </p>
                      ))}
                      {parseResult.summary.warnings.length > 5 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                          ... y {parseResult.summary.warnings.length - 5} advertencias más
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Errors */}
          {hasErrors && uploadResult && uploadResult.errors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-900 dark:text-red-100 mb-2">
                    ❌ Errores encontrados ({uploadResult.errors.length})
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {uploadResult.errors.slice(0, 10).map((err, idx) => (
                      <div key={idx} className="text-sm text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 rounded p-2">
                        {err.row > 0 && (
                          <span className="font-medium">Fila {err.row}: </span>
                        )}
                        {err.message}
                      </div>
                    ))}
                    {uploadResult.errors.length > 10 && (
                      <p className="text-xs text-red-600 dark:text-red-400 italic">
                        ... y {uploadResult.errors.length - 10} errores más
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Continue with valid data */}
          {hasErrors && uploadResult && uploadResult.inserted > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 Se continuó con los {uploadResult.inserted} registros válidos. Los datos con errores fueron omitidos.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
