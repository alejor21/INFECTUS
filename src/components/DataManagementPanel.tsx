import { useMemo, useState } from 'react';
import { AlertTriangle, Database, RefreshCw, Trash2, Upload } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useDataManagement, type MesData } from '../hooks/useDataManagement';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface DataManagementPanelProps {
  hospitalId: string | null | undefined;
  hospitalName?: string | null;
}

type DeleteTarget =
  | { type: 'mes'; mesData: MesData }
  | { type: 'all'; totalEvaluaciones: number; totalMeses: number };

function buildSummary(totalEvaluaciones: number, totalMeses: number): string {
  const evaluationLabel = totalEvaluaciones === 1 ? 'evaluacion' : 'evaluaciones';
  const monthLabel = totalMeses === 1 ? 'mes' : 'meses';
  return `Total: ${totalEvaluaciones} ${evaluationLabel} en ${totalMeses} ${monthLabel}`;
}

export function DataManagementPanel({ hospitalId, hospitalName }: DataManagementPanelProps) {
  const navigate = useNavigate();
  const { meses, totalEvaluaciones, loading, error, deleteMes, deleteAllData, refetch } = useDataManagement(hospitalId);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const summary = useMemo(() => buildSummary(totalEvaluaciones, meses.length), [meses.length, totalEvaluaciones]);

  async function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    if (deleteTarget.type === 'mes') {
      await deleteMes(deleteTarget.mesData.mes, deleteTarget.mesData.anio);
      toast.success(`${deleteTarget.mesData.count} evaluaciones eliminadas correctamente`);
      return;
    }

    await deleteAllData();
    toast.success(`${deleteTarget.totalEvaluaciones} evaluaciones eliminadas correctamente`);
  }

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-6 flex flex-col gap-3 border-b border-gray-200 pb-4 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-teal-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Gestion de Datos</h2>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{summary}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
            <button
              type="button"
              onClick={() => {
                void refetch();
              }}
              className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-teal-700"
            >
              Reintentar
            </button>
          </div>
        ) : meses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-950/40">
            <Upload className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Aun no tienes datos cargados</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {hospitalName
                ? `No hay evaluaciones registradas para ${hospitalName}.`
                : 'No hay evaluaciones registradas para el hospital activo.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/hospitales')}
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-teal-700"
            >
              Subir nuevo Excel
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Datos por mes</p>
              <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
                {meses.map((mesData) => (
                  <div
                    key={mesData.value}
                    className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 transition-colors duration-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{mesData.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{mesData.count} evaluaciones</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ type: 'mes', mesData })}
                      className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar mes
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 dark:border-red-900/40 dark:bg-red-950/20">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-red-100 p-2 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">Zona de peligro</p>
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    Elimina todas las evaluaciones del hospital para volver a cargar un Excel limpio.
                  </p>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ type: 'all', totalEvaluaciones, totalMeses: meses.length })}
                    className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar TODOS los datos del hospital
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={deleteTarget?.type === 'mes' ? `Eliminar ${deleteTarget.mesData.label}` : 'Eliminar todos los datos'}
        description={
          deleteTarget?.type === 'mes'
            ? `Se eliminaran ${deleteTarget.mesData.count} evaluaciones de ${deleteTarget.mesData.label}. Esta accion no se puede deshacer.`
            : `Esta accion eliminara permanentemente ${deleteTarget?.totalEvaluaciones ?? 0} evaluaciones de ${deleteTarget?.totalMeses ?? 0} meses. No se puede deshacer.`
        }
        confirmLabel="Eliminar"
        isDangerous={deleteTarget?.type === 'all'}
      />
    </>
  );
}
