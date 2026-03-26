import { TrendingDown, TrendingUp } from 'lucide-react';

export interface ProaIndicatorRow {
  codigo: string;
  indicador: string;
  valor: number;
  objetivo: number;
  unidad?: '%' | 'días';
  lowIsBetter?: boolean;
  tendencia: 'up' | 'down';
  frecuencia: string;
  ultimaActualizacion: string;
}

interface IndicatorsTableProps {
  rows?: ProaIndicatorRow[];
}

function isRowReached(row: ProaIndicatorRow): boolean {
  if (row.lowIsBetter) {
    return row.valor <= row.objetivo;
  }

  return row.valor >= row.objetivo;
}

export function IndicatorsTable({ rows = [] }: IndicatorsTableProps) {
  const cumplidos = rows.filter((row) => isRowReached(row)).length;
  const enSeguimiento = rows.filter((row) => !isRowReached(row)).length;
  const promedio =
    rows.length > 0
      ? Math.round((rows.reduce((accumulator, row) => accumulator + row.valor, 0) / rows.length) * 10) / 10
      : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-200 p-6 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tablero de seguimiento de indicadores
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Revisión rápida del estado actual de cada indicador clínico del programa PROA.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-900/20">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Objetivos cumplidos</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{cumplidos}</p>
          </div>
          <div className="rounded-xl bg-amber-50 px-4 py-3 dark:bg-amber-900/20">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">En seguimiento</p>
            <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-300">{enSeguimiento}</p>
          </div>
          <div className="rounded-xl bg-teal-50 px-4 py-3 dark:bg-teal-900/20">
            <p className="text-xs font-medium text-teal-700 dark:text-teal-300">Promedio general</p>
            <p className="mt-1 text-2xl font-bold text-teal-700 dark:text-teal-300">{promedio}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-950/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Código
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Indicador
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Valor actual
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Objetivo
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Estado
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Frecuencia
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Actualización
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  Sin datos disponibles.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const reached = isRowReached(row);
                const unit = row.unidad ?? '%';

                return (
                  <tr
                    key={row.codigo}
                    className="transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{row.codigo}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{row.indicador}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {row.valor}
                      {unit}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {row.objetivo}
                      {unit}
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${
                          reached
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
                            : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
                        }`}
                      >
                        {reached ? (
                          <>
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
                            <span>Cumplido</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" />
                            <span>En seguimiento</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                        {row.frecuencia}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{row.ultimaActualizacion}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
