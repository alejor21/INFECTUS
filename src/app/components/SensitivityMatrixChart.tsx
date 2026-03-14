interface SensitivityRow {
  organismo: string;
  vancomicina: string;
  meropenem: string;
  count: number;
}

interface SensitivityMatrixChartProps {
  data?: SensitivityRow[];
}

const getColor = (value: number) => {
  if (value === 0) return '#F3F4F6';
  if (value < 40) return '#FCA5A5';
  if (value < 60) return '#FCD34D';
  if (value < 80) return '#A7F3D0';
  return '#6EE7B7';
};

const getTextColor = (value: number) => {
  if (value === 0) return '#9CA3AF';
  if (value < 60) return '#7F1D1D';
  return '#065F46';
};

function sensitivityToColor(value: string): string {
  const v = (value ?? '').trim().toUpperCase();
  if (v === 'S' || v === 'SENSIBLE') return '#6EE7B7';
  if (v === 'I' || v === 'INTERMEDIO') return '#FCD34D';
  if (v === 'R' || v === 'RESISTENTE') return '#FCA5A5';
  return '#F3F4F6';
}

function sensitivityToTextColor(value: string): string {
  const v = (value ?? '').trim().toUpperCase();
  if (v === 'S' || v === 'SENSIBLE') return '#065F46';
  if (v === 'R' || v === 'RESISTENTE') return '#7F1D1D';
  return '#374151';
}

export function SensitivityMatrixChart({ data }: SensitivityMatrixChartProps = {}) {
  const hasRealData = data && data.length > 0;

  if (hasRealData) {
    const organisms = [...new Set(data.map((d) => d.organismo))];
    const getVanco = (org: string) => data.filter((d) => d.organismo === org).sort((a, b) => b.count - a.count)[0]?.vancomicina ?? '';
    const getMerop = (org: string) => data.filter((d) => d.organismo === org).sort((a, b) => b.count - a.count)[0]?.meropenem ?? '';

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-6" style={{ color: '#0B3C5D' }}>
          Matriz de sensibilidad antibiótica
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-left text-xs font-semibold text-gray-600 border border-gray-200 bg-gray-50">Organismo</th>
                <th className="p-3 text-center text-xs font-semibold text-gray-600 border border-gray-200 bg-gray-50">Vancomicina</th>
                <th className="p-3 text-center text-xs font-semibold text-gray-600 border border-gray-200 bg-gray-50">Meropenem</th>
              </tr>
            </thead>
            <tbody>
              {organisms.map((org) => {
                const vanco = getVanco(org);
                const merope = getMerop(org);
                return (
                  <tr key={org}>
                    <td className="p-3 text-xs font-medium text-gray-900 border border-gray-200 bg-gray-50">{org}</td>
                    <td
                      className="p-4 text-center text-xs font-bold border border-gray-200 transition-all hover:scale-105"
                      style={{ backgroundColor: sensitivityToColor(vanco), color: sensitivityToTextColor(vanco) }}
                    >
                      {vanco || 'N/A'}
                    </td>
                    <td
                      className="p-4 text-center text-xs font-bold border border-gray-200 transition-all hover:scale-105"
                      style={{ backgroundColor: sensitivityToColor(merope), color: sensitivityToTextColor(merope) }}
                    >
                      {merope || 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-4 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FCA5A5' }}></div>
                <span className="text-gray-600">Resistente</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FCD34D' }}></div>
                <span className="text-gray-600">Intermedio</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6EE7B7' }}></div>
                <span className="text-gray-600">Sensible</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback to static data
  const organisms = ['E. coli', 'K. pneum.', 'P. aerug.', 'S. aureus'];
  const antibiotics = ['Amoxicilina', 'Ciprofloxacino', 'Ceftriaxona', 'Meropenem', 'Vancomicina'];
  const staticData = [
    [45, 62, 58, 95, 0],
    [38, 58, 52, 92, 0],
    [0, 81, 0, 81, 0],
    [0, 0, 0, 98, 68],
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-6" style={{ color: '#0B3C5D' }}>
        Matriz de sensibilidad antibiótica
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 border border-gray-200 bg-gray-50">Organismo</th>
              {antibiotics.map((antibiotic) => (
                <th key={antibiotic} className="p-3 text-center text-xs font-semibold text-gray-600 border border-gray-200 bg-gray-50">{antibiotic}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {organisms.map((organism, i) => (
              <tr key={organism}>
                <td className="p-3 text-xs font-medium text-gray-900 border border-gray-200 bg-gray-50">{organism}</td>
                {staticData[i].map((value, j) => (
                  <td
                    key={j}
                    className="p-4 text-center text-xs font-bold border border-gray-200 transition-all hover:scale-105"
                    style={{ backgroundColor: getColor(value), color: getTextColor(value) }}
                  >
                    {value === 0 ? 'N/A' : `${value}%`}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FCA5A5' }}></div>
              <span className="text-gray-600">{'< 40% Resistencia alta'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FCD34D' }}></div>
              <span className="text-gray-600">40-60% Moderada</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#A7F3D0' }}></div>
              <span className="text-gray-600">60-80% Buena</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6EE7B7' }}></div>
              <span className="text-gray-600">{'>'}80% Excelente</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
