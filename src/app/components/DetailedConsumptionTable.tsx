import { useState, useEffect } from 'react';
import { ArrowUpDown, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import type { InterventionRecord } from '../../types';

interface Props {
  records: InterventionRecord[];
}

const PAGE_SIZE = 8;

export function DetailedConsumptionTable({ records }: Props) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [records]);

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRecords = records.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const start = records.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, records.length);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: '#0B3C5D' }}>
          Detalle de consumo por antibiótico
        </h3>
        <button className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: '#0F8B8D' }}>
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">Exportar</span>
        </button>
      </div>

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
                <button className="flex items-center space-x-1 hover:text-gray-900">
                  <span>Observaciones</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
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
                      <span className="text-sm text-gray-600">{r.servicio || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{r.antibiotico01 || '—'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold" style={{ color: '#0B3C5D' }}>
                        {r.diasTerapiaMed01 ? `${r.diasTerapiaMed01} días` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {aprobado === 'SI' ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Sí</span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">No</span>
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

      {/* Pagination footer */}
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
