import { AlertTriangle, Download, Filter } from 'lucide-react';

interface ResistanceRow {
  servicio: string;
  organismoAislado: string;
  blee: string;
  carbapenemasa: string;
  mrsa: string;
  sensibilidadVancomicina: string;
  sensibilidadMeropenem: string;
}

interface ResistanceDataTableProps {
  data?: ResistanceRow[];
}

const fallbackData = [
  { id: 1, organismo: 'Klebsiella pneumoniae', mecanismo: 'KPC', servicio: 'UCI', casos: 8, riesgo: 'critical', fecha: '20 Feb 2026' },
  { id: 2, organismo: 'Escherichia coli', mecanismo: 'BLEE', servicio: 'Medicina Interna', casos: 15, riesgo: 'high', fecha: '22 Feb 2026' },
  { id: 3, organismo: 'Staphylococcus aureus', mecanismo: 'MRSA', servicio: 'Cirugía', casos: 6, riesgo: 'high', fecha: '23 Feb 2026' },
  { id: 4, organismo: 'Pseudomonas aeruginosa', mecanismo: 'MDR', servicio: 'UCI', casos: 12, riesgo: 'critical', fecha: '24 Feb 2026' },
  { id: 5, organismo: 'Acinetobacter baumannii', mecanismo: 'Carbapenemasa', servicio: 'UCI', casos: 5, riesgo: 'critical', fecha: '25 Feb 2026' },
  { id: 6, organismo: 'Enterococcus faecium', mecanismo: 'VRE', servicio: 'UCI', casos: 3, riesgo: 'high', fecha: '26 Feb 2026' },
];

function resistanceBadge(value: string) {
  const v = (value ?? '').trim().toUpperCase();
  if (v === 'SI') return <span className="px-2 py-1 text-xs font-medium rounded-md bg-red-100 text-red-700">Sí</span>;
  if (v === 'NO') return <span className="px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-700">No</span>;
  return <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600">{value || '—'}</span>;
}

export function ResistanceDataTable({ data }: ResistanceDataTableProps = {}) {
  const hasRealData = data && data.length > 0;
  const totalCasos = hasRealData ? data.length : fallbackData.reduce((acc, r) => acc + r.casos, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: '#0B3C5D' }}>
            Detección de bacterias multirresistentes
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

      <div className="overflow-x-auto">
        {hasRealData ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Servicio</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Microorganismo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">BLEE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Carbapenemasa</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">MRSA</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vancomicina</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Meropenem</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{row.servicio || '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900 italic">{row.organismoAislado || '—'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{resistanceBadge(row.blee)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{resistanceBadge(row.carbapenemasa)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{resistanceBadge(row.mrsa)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{row.sensibilidadVancomicina || '—'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{row.sensibilidadMeropenem || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Microorganismo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mecanismo de resistencia</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Servicio</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Casos detectados</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nivel de riesgo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha detección</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fallbackData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900 italic">{row.organismo}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-md bg-red-100 text-red-700">{row.mecanismo}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{row.servicio}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold" style={{ color: '#0B3C5D' }}>{row.casos}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {row.riesgo === 'critical' ? (
                      <span className="flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Crítico</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Alto</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{row.fecha}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary footer */}
      <div className="p-6 border-t border-gray-200 bg-red-50">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-900">
              {totalCasos} casos de bacterias multirresistentes detectados este mes
            </p>
            <p className="text-xs text-red-700 mt-1">
              Se recomienda reforzar medidas de control de infecciones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
