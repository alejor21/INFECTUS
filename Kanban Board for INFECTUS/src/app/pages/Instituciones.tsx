import { Building2, MapPin, Bed, TrendingUp, Phone, Calendar, AlertCircle } from 'lucide-react';
import { institutions } from '../data/mockData';
import { ProgressBar } from '../components/ProgressBar';

export function Instituciones() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'warning':
        return 'Atención';
      case 'critical':
        return 'Crítico';
      default:
        return 'Sin estado';
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Instituciones de Salud</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestión y seguimiento de las 7 instituciones del programa
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Instituciones</p>
                <p className="text-3xl font-bold text-slate-800">{institutions.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Instituciones Activas</p>
                <p className="text-3xl font-bold text-green-600">
                  {institutions.filter(i => i.status === 'active').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Requieren Atención</p>
                <p className="text-3xl font-bold text-amber-600">
                  {institutions.filter(i => i.status === 'warning').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Camas</p>
                <p className="text-3xl font-bold text-slate-800">
                  {institutions.reduce((sum, i) => sum + i.beds, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Bed className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Institutions Grid */}
        <div className="grid grid-cols-2 gap-6">
          {institutions.map((institution) => (
            <div
              key={institution.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-50 to-slate-50 px-6 py-5 border-b border-slate-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Building2 className="w-7 h-7 text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        {institution.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <MapPin className="w-4 h-4" />
                          {institution.city}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Bed className="w-4 h-4" />
                          {institution.beds} camas
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(institution.status)}`}>
                    {getStatusLabel(institution.status)}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-6 py-5">
                {/* Progress Metrics */}
                <div className="space-y-4 mb-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Cumplimiento Total</span>
                      <span className="text-sm font-bold text-blue-600">{institution.totalProgress}%</span>
                    </div>
                    <ProgressBar progress={institution.totalProgress} size="sm" showLabel={false} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-600">PROA</span>
                        <span className="text-xs font-bold text-blue-600">{institution.proaProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                          style={{ width: `${institution.proaProgress}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-600">IAS</span>
                        <span className="text-xs font-bold text-purple-600">{institution.iasProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                          style={{ width: `${institution.iasProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4" />
                    <span>{institution.contact}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Act. {institution.lastUpdate}</span>
                  </div>
                </div>
              </div>

              {/* Level Badge */}
              <div className="bg-slate-50 px-6 py-3 border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-600">
                  Nivel de Atención: <span className="text-blue-600">{institution.level}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
