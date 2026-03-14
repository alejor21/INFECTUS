import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, UploadCloud } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { MonthlyTrendChart } from '../components/MonthlyTrendChart';
import { TopAntibioticsChart } from '../components/TopAntibioticsChart';
import { ResistanceChart } from '../components/ResistanceChart';
import { DistributionChart } from '../components/DistributionChart';
import { DataTable } from '../components/DataTable';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useHospitalContext } from '../components/Layout';

const PAGE_SIZE = 15;

const DATE_RANGE_LABEL: Record<'1m' | '6m' | '12m' | 'all', string> = {
  '1m': 'Último mes',
  '6m': 'Últimos 6 meses',
  '12m': 'Último año',
  'all': 'Todos los datos',
};

export function Dashboard() {
  const { selectedHospital, selectedHospitalObj, hospitals, dateRange } = useHospitalContext();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const {
    kpis,
    monthlyConsumption,
    monthlyCompliance,
    top5Antibiotics,
    iaasDistribution,
    resistanceByService,
    records,
    loading,
  } = useAnalytics();

  const consumptionSparkline = monthlyConsumption.map((x) => x.ddd);
  const complianceSparkline = monthlyCompliance.map((x) => x.rate);

  // Patient table: only when a specific hospital is selected
  const showPatientTable = !!selectedHospital;

  const filteredRecords = showPatientTable
    ? records.filter((r) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          (r.nombre ?? '').toLowerCase().includes(q) ||
          (r.servicio ?? '').toLowerCase().includes(q) ||
          (r.diagnostico ?? '').toLowerCase().includes(q)
        );
      })
    : [];

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRecords = filteredRecords.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className={loading ? 'p-4 lg:p-8 opacity-50' : 'p-4 lg:p-8'}>
      {/* Page title */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: '#0B3C5D' }}>
          Dashboard PROA
        </h1>
        {selectedHospitalObj ? (
          <p className="text-sm font-medium text-gray-700">
            {selectedHospitalObj.name}
            <span className="hidden sm:inline"> · {selectedHospitalObj.city}, {selectedHospitalObj.department}</span>
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            Vista general — Todos los hospitales ({hospitals.length} hospitales, {records.length} registros)
          </p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">{DATE_RANGE_LABEL[dateRange]}</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <KPICard
          title="Tasa de uso de antibióticos"
          value={String(kpis.antibioticUseRate)}
          unit="DDD/100 camas-día"
          sparklineData={consumptionSparkline}
        />
        <KPICard
          title="Adecuación terapéutica"
          value={String(kpis.therapeuticAdequacy)}
          unit="%"
          sparklineData={complianceSparkline}
        />
        <KPICard
          title="Infecciones por BMR"
          value={String(kpis.iaasRate)}
          unit="casos/1000 días"
          sparklineData={complianceSparkline}
        />
        <KPICard
          title="Cumplimiento de guías"
          value={String(kpis.guidelineCompliance)}
          unit="%"
          sparklineData={complianceSparkline}
        />
      </div>

      {/* Charts Section */}
      {!loading && records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Sin datos de intervenciones
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
            No se han encontrado registros para el hospital o período seleccionado.
            Carga un archivo Excel con las intervenciones para ver los indicadores.
          </p>
          <a
            href="/configuracion"
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors min-h-[44px] flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            Ir a configuración y cargar datos
          </a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <MonthlyTrendChart data={monthlyConsumption} />
            <TopAntibioticsChart data={top5Antibiotics} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <ResistanceChart data={resistanceByService} />
            <DistributionChart data={iaasDistribution} />
          </div>

          {/* Default Data Table (global view) */}
          <DataTable records={records} />
        </>
      )}

      {/* Hospital-specific patient table */}
      {showPatientTable && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#0B3C5D' }}>
              Intervenciones registradas — {selectedHospital}
            </h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por paciente, servicio o diagnóstico..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Paciente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cédula</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cama</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Servicio</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Diagnóstico</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Antibiótico</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Días</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Conducta</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aprobado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pageRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-500">
                      {search ? 'Sin resultados para la búsqueda' : 'Sin datos disponibles'}
                    </td>
                  </tr>
                ) : (
                  pageRecords.map((r, idx) => {
                    const aprobado = (r.aproboTerapia ?? '').trim().toUpperCase();
                    return (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{r.fecha || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{r.nombre || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{r.admisionCedula || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{r.cama || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{r.servicio || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{r.diagnostico || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{r.antibiotico01 || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {r.diasTerapiaMed01 ? `${r.diasTerapiaMed01} d` : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{r.conductaGeneral || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {aprobado === 'SI' ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Sí</span>
                          ) : aprobado ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">No</span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
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
              {filteredRecords.length === 0 ? (
                'Sin registros'
              ) : (
                <>
                  Mostrando{' '}
                  <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span>
                  {' '}–{' '}
                  <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, filteredRecords.length)}</span>
                  {' '}de{' '}
                  <span className="font-medium">{filteredRecords.length}</span> registros
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
      )}
    </div>
  );
}
