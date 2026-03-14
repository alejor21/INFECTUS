interface ConsumptionHeatmapProps {
  data: { antibiotic: string; service: string; value: number }[];
}

export function ConsumptionHeatmap({ data }: ConsumptionHeatmapProps) {
  const antibiotics = [...new Set(data.map((d) => d.antibiotic))];
  const services = [...new Set(data.map((d) => d.service))];

  const getValue = (antibiotic: string, service: string): number => {
    const entry = data.find((d) => d.antibiotic === antibiotic && d.service === service);
    return entry?.value ?? 0;
  };

  const getColor = (value: number) => {
    if (value < 6) return '#E0F2F1';
    if (value < 10) return '#80CBC4';
    if (value < 15) return '#0F8B8D';
    if (value < 20) return '#0B7A7C';
    return '#0B3C5D';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-6" style={{ color: '#0B3C5D' }}>
        Mapa de calor: Consumo por servicio y antibiótico
      </h3>
      <div className="overflow-x-auto">
        {data.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-32">Sin datos disponibles</p>
        ) : (
        <>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs font-semibold text-gray-600 border border-gray-200 bg-gray-50">
                Antibiótico
              </th>
              {services.map((service) => (
                <th key={service} className="p-2 text-center text-xs font-semibold text-gray-600 border border-gray-200 bg-gray-50">
                  {service}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {antibiotics.map((antibiotic) => (
              <tr key={antibiotic}>
                <td className="p-2 text-xs font-medium text-gray-900 border border-gray-200 bg-gray-50">
                  {antibiotic}
                </td>
                {services.map((service) => {
                  const value = getValue(antibiotic, service);
                  return (
                    <td
                      key={service}
                      className="p-4 text-center text-xs font-semibold border border-gray-200 transition-all hover:scale-105"
                      style={{ backgroundColor: getColor(value), color: value > 12 ? 'white' : '#0B3C5D' }}
                    >
                      {value.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-600">
          <span>Bajo</span>
          <div className="flex space-x-1">
            <div className="w-6 h-4" style={{ backgroundColor: '#E0F2F1' }}></div>
            <div className="w-6 h-4" style={{ backgroundColor: '#80CBC4' }}></div>
            <div className="w-6 h-4" style={{ backgroundColor: '#0F8B8D' }}></div>
            <div className="w-6 h-4" style={{ backgroundColor: '#0B7A7C' }}></div>
            <div className="w-6 h-4" style={{ backgroundColor: '#0B3C5D' }}></div>
          </div>
          <span>Alto</span>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
