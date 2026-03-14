import { FileText, Download, Plus, Calendar, User, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

interface FormTemplate {
  id: string;
  name: string;
  category: 'PROA' | 'IAS';
  description: string;
  lastModified: string;
  submittedCount: number;
  pendingCount: number;
  status: 'active' | 'draft';
}

const formTemplates: FormTemplate[] = [
  {
    id: 'f1',
    name: 'Formulario de Auditoría de Antibióticos',
    category: 'PROA',
    description: 'Evaluación del uso apropiado de antimicrobianos en hospitalización',
    lastModified: '05 Mar 2026',
    submittedCount: 45,
    pendingCount: 8,
    status: 'active',
  },
  {
    id: 'f2',
    name: 'Registro de Infección Nosocomial',
    category: 'IAS',
    description: 'Formulario de notificación de casos de IAAS',
    lastModified: '08 Mar 2026',
    submittedCount: 23,
    pendingCount: 5,
    status: 'active',
  },
  {
    id: 'f3',
    name: 'Evaluación de Higiene de Manos',
    category: 'IAS',
    description: 'Auditoría de adherencia a protocolo de lavado de manos',
    lastModified: '10 Mar 2026',
    submittedCount: 67,
    pendingCount: 12,
    status: 'active',
  },
  {
    id: 'f4',
    name: 'Consumo de Antimicrobianos Mensual',
    category: 'PROA',
    description: 'Reporte mensual de uso y consumo de antibióticos por servicio',
    lastModified: '12 Mar 2026',
    submittedCount: 34,
    pendingCount: 3,
    status: 'active',
  },
  {
    id: 'f5',
    name: 'Protocolo de Aislamiento',
    category: 'IAS',
    description: 'Verificación de cumplimiento de medidas de aislamiento',
    lastModified: '07 Mar 2026',
    submittedCount: 19,
    pendingCount: 6,
    status: 'active',
  },
  {
    id: 'f6',
    name: 'Guía de Tratamiento Empírico',
    category: 'PROA',
    description: 'Formulario de selección de terapia antimicrobiana inicial',
    lastModified: '02 Mar 2026',
    submittedCount: 0,
    pendingCount: 0,
    status: 'draft',
  },
];

export function Formularios() {
  const proaForms = formTemplates.filter(f => f.category === 'PROA');
  const iasForms = formTemplates.filter(f => f.category === 'IAS');
  const totalSubmitted = formTemplates.reduce((sum, f) => sum + f.submittedCount, 0);
  const totalPending = formTemplates.reduce((sum, f) => sum + f.pendingCount, 0);

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Formularios</h2>
            <p className="text-sm text-slate-500 mt-1">
              Gestión de plantillas y registros de cumplimiento
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Formulario
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Formularios</p>
                <p className="text-3xl font-bold text-slate-800">{formTemplates.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Completados</p>
                <p className="text-3xl font-bold text-green-600">{totalSubmitted}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-amber-600">{totalPending}</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Activos</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formTemplates.filter(f => f.status === 'active').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* PROA Forms */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Formularios PROA</h3>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
              {proaForms.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {proaForms.map((form) => (
              <div
                key={form.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-slate-800">{form.name}</h4>
                        {form.status === 'draft' && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                            Borrador
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{form.description}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold">
                      {form.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-600">
                        <span className="font-semibold text-green-600">{form.submittedCount}</span> completados
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-slate-600">
                        <span className="font-semibold text-amber-600">{form.pendingCount}</span> pendientes
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Modificado {form.lastModified}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
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

        {/* IAS Forms */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Formularios IAS</h3>
            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">
              {iasForms.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {iasForms.map((form) => (
              <div
                key={form.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-slate-800">{form.name}</h4>
                        {form.status === 'draft' && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                            Borrador
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{form.description}</p>
                    </div>
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold">
                      {form.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-600">
                        <span className="font-semibold text-green-600">{form.submittedCount}</span> completados
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-slate-600">
                        <span className="font-semibold text-amber-600">{form.pendingCount}</span> pendientes
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Modificado {form.lastModified}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-purple-600 border-purple-200 hover:bg-purple-50"
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
