import { BarChart3, Download, Calendar, TrendingUp, Filter, FileText, PieChart, Activity } from 'lucide-react';
import { Button } from '../components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart as RePieChart, Pie, Cell } from 'recharts';

const complianceData = [
  { name: 'Inst 1', PROA: 75, IAS: 100 },
  { name: 'Inst 2', PROA: 80, IAS: 75 },
  { name: 'Inst 3', PROA: 25, IAS: 90 },
  { name: 'Inst 4', PROA: 60, IAS: 55 },
  { name: 'Inst 5', PROA: 45, IAS: 40 },
  { name: 'Inst 6', PROA: 30, IAS: 15 },
  { name: 'Inst 7', PROA: 100, IAS: 85 },
];

const monthlyTrend = [
  { mes: 'Ene', cumplimiento: 62 },
  { mes: 'Feb', cumplimiento: 68 },
  { mes: 'Mar', cumplimiento: 72 },
];

const taskDistribution = [
  { name: 'Completadas', value: 2, color: '#10b981' },
  { name: 'En Revisión', value: 3, color: '#3b82f6' },
  { name: 'En Proceso', value: 3, color: '#f59e0b' },
  { name: 'Pendientes', value: 2, color: '#f97316' },
];

const reportTypes = [
  {
    id: 'r1',
    title: 'Reporte General de Cumplimiento',
    description: 'Resumen ejecutivo del estado de todas las instituciones',
    type: 'General',
    frequency: 'Mensual',
    lastGenerated: '01 Mar 2026',
    format: 'PDF',
  },
  {
    id: 'r2',
    title: 'Análisis PROA por Institución',
    description: 'Detalle de cumplimiento del programa PROA',
    type: 'PROA',
    frequency: 'Trimestral',
    lastGenerated: '28 Feb 2026',
    format: 'Excel',
  },
  {
    id: 'r3',
    title: 'Indicadores IAS',
    description: 'Métricas de prevención de infecciones asociadas',
    type: 'IAS',
    frequency: 'Mensual',
    lastGenerated: '01 Mar 2026',
    format: 'PDF',
  },
  {
    id: 'r4',
    title: 'Tendencias de Cumplimiento',
    description: 'Análisis de evolución temporal de indicadores',
    type: 'General',
    frequency: 'Trimestral',
    lastGenerated: '15 Feb 2026',
    format: 'PowerPoint',
  },
];

export function Reportes() {
  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Reportes</h2>
            <p className="text-sm text-slate-500 mt-1">
              Análisis y visualización de datos de cumplimiento
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-slate-300">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="w-4 h-4 mr-2" />
              Exportar Todo
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        {/* Charts Section */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Compliance by Institution */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Cumplimiento por Institución
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Comparativa PROA vs IAS
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="PROA" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="IAS" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Tendencia Mensual
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Evolución del cumplimiento general
                </p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="cumplimiento"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Task Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Distribución de Tareas
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Estado actual de actividades
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <PieChart className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={taskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>

          {/* Key Metrics */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Métricas Clave
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Indicadores principales Q1 2026
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Cumplimiento Global</span>
                  <span className="text-lg font-bold text-blue-600">72%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: '72%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Promedio PROA</span>
                  <span className="text-lg font-bold text-blue-600">59%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: '59%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Promedio IAS</span>
                  <span className="text-lg font-bold text-purple-600">66%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full" style={{ width: '66%' }} />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Mejora vs. Q4 2025</span>
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-lg font-bold">+8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Reports */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Reportes Disponibles
          </h3>
          <div className="grid grid-cols-2 gap-6">
            {reportTypes.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 mb-2">{report.title}</h4>
                      <p className="text-sm text-slate-600">{report.description}</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-slate-600" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Tipo:</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        report.type === 'PROA' ? 'bg-blue-50 text-blue-700' :
                        report.type === 'IAS' ? 'bg-purple-50 text-purple-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {report.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Formato:</span>
                      <span className="text-xs font-semibold text-slate-700">{report.format}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{report.lastGenerated}</span>
                      <span className="mx-1">•</span>
                      <span>{report.frequency}</span>
                    </div>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
