import { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import type { InterventionRecord } from '../../types';

interface Props {
  records: InterventionRecord[];
}

const PAGE_SIZE = 8;

export function DataTable({ records }: Props) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [records]);

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRecords = records.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const start = records.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, records.length);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#0B3C5D' }}>
          Registro detallado de prescripciones
        </h3>

        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por servicio, antibiótico..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>

          {/* Filter button */}
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtros</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <button className="flex items-center space-x-1 hover:text-gray-900">
                  <span>Servicio</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <button className="flex items-center space-x-1 hover:text-gray-900">
                  <span>Antibiótico</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <button className="flex items-center space-x-1 hover:text-gray-900">
                  <span>Días terapia</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Aprobó terapia
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Observaciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pageRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  Sin datos disponibles
                </td>
              </tr>
            ) : (
              pageRecords.map((r, idx) => {
                const aprobado = (r.aproboTerapia ?? '').trim().toUpperCase();
                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{r.servicio || '—'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{r.antibiotico01 || '—'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium" style={{ color: '#0B3C5D' }}>
                        {r.diasTerapiaMed01 ? `${r.diasTerapiaMed01} días` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {aprobado === 'SI' ? (
                        <span className="px-3 py-1 inline-flex text-xs font-medium rounded-full bg-green-100 text-green-700">
                          Sí
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs font-medium rounded-full bg-red-100 text-red-700">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{r.observaciones || '—'}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {records.length === 0 ? (
            'Sin registros'
          ) : (
            <>
              Mostrando <span className="font-medium">{start}</span> a{' '}
              <span className="font-medium">{end}</span> de{' '}
              <span className="font-medium">{records.length}</span> registros
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="px-3 py-2 text-white rounded-lg text-sm font-medium" style={{ backgroundColor: '#0F8B8D' }}>
            {currentPage}
          </span>
          <span className="text-sm text-gray-500">/ {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
