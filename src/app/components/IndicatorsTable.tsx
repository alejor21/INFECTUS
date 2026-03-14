import { Download, Filter, TrendingUp, TrendingDown } from 'lucide-react';

export interface ProaIndicatorRow {
  codigo: string;
  indicador: string;
  valor: number;
  objetivo: number;
  tendencia: 'up' | 'down';
  frecuencia: string;
  ultimaActualizacion: string;
}

interface IndicatorsTableProps {
  rows?: ProaIndicatorRow[];
}

export function IndicatorsTable({ rows = [] }: IndicatorsTableProps) {
  const cumplidos = rows.filter((r) => r.valor >= r.objetivo).length;
  const enProgreso = rows.filter((r) => r.valor < r.objetivo).length;
  const promedio = rows.length > 0
    ? Math.round(rows.reduce((acc, r) => acc + r.valor, 0) / rows.length * 10) / 10
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: '#0B3C5D' }}>
            Tablero de seguimiento de indicadores
          </h3>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filtrar</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: '#0F8B8D' }}>
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Código</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Indicador</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Valor actual</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Objetivo</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Frecuencia</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actualización</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                  Sin datos disponibles
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono font-medium" style={{ color: '#0B3C5D' }}>{row.codigo}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{row.indicador}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold" style={{ color: row.valor >= row.objetivo ? '#0F8B8D' : '#F59E0B' }}>
                      {row.valor}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{row.objetivo}%</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {row.tendencia === 'up' ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">Cumplido</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-600">En progreso</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-700">{row.frecuencia}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{row.ultimaActualizacion}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">{cumplidos}</div>
            <div className="text-xs text-gray-600">Objetivos cumplidos</div>
          </div>
          <div className="text-center border-l border-r border-gray-300">
            <div className="text-2xl font-bold text-yellow-600 mb-1">{enProgreso}</div>
            <div className="text-xs text-gray-600">En progreso</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#0B3C5D' }}>{promedio}%</div>
            <div className="text-xs text-gray-600">Cumplimiento promedio</div>
          </div>
        </div>
      </div>
    </div>
  );
}
