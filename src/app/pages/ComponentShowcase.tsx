import { useState } from 'react';
import { Package } from 'lucide-react';
import { toast } from 'sonner';
import {
  ConfirmDialog,
  EmptyState,
  LoadingState,
  SkeletonCard,
  SkeletonGrid,
  SkeletonTable,
  AlertBanner,
  FormField,
  ResponsiveTable,
} from '../components';

export function ComponentShowcase() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEmpty, setShowEmpty] = useState(true);

  const tableData = [
    { date: '2026-03-25', patient: 'Juan García', antibiotic: 'Amoxicilina', days: '7' },
    { date: '2026-03-24', patient: 'María López', antibiotic: 'Azitromicina', days: '5' },
    { date: '2026-03-23', patient: 'Carlos Pérez', antibiotic: 'Ceftriaxona', days: '10' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          📦 Component Showcase
        </h1>

        {/* AlertBanner Examples */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            AlertBanner
          </h2>
          <div className="space-y-3">
            <AlertBanner
              type="info"
              title="Información"
              message="Este es un mensaje informativo"
              dismissible
            />
            <AlertBanner
              type="success"
              title="Éxito"
              message="La acción se completó correctamente"
              dismissible
            />
            <AlertBanner
              type="warning"
              title="Advertencia"
              message="Verifica esta acción antes de continuar"
              dismissible
            />
            <AlertBanner
              type="error"
              title="Error"
              message="Algo salió mal"
              dismissible
            />
          </div>
        </section>

        {/* EmptyState */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            EmptyState
          </h2>
          {showEmpty ? (
            <EmptyState
              icon={Package}
              title="Sin datos disponibles"
              description="Crea tu primer registro para comenzar"
              action={{
                label: 'Crear registro',
                onClick: () => setShowEmpty(false),
              }}
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-gray-700 dark:text-gray-300">
                ✅ Registro creado! (haz click en "Crear registro" para verlo de nuevo)
              </p>
            </div>
          )}
        </section>

        {/* Skeleton Loaders */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Skeleton Loaders
          </h2>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">
                SkeletonGrid (4 cards):
              </p>
              <SkeletonGrid count={4} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">
                SkeletonTable:
              </p>
              <SkeletonTable />
            </div>
          </div>
        </section>

        {/* LoadingState */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            LoadingState
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg">
            <LoadingState message="Cargando evaluaciones..." />
          </div>
        </section>

        {/* ResponsiveTable */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            ResponsiveTable
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            💡 Tip: Redimensiona la ventana - en móvil verás cards expandibles
          </p>
          <ResponsiveTable
            columns={[
              { key: 'date', label: 'Fecha' },
              { key: 'patient', label: 'Paciente' },
              { key: 'antibiotic', label: 'Antibiótico' },
              { key: 'days', label: 'Días' },
            ]}
            data={tableData}
            onRowClick={(row) => toast.info(`Fila seleccionada: ${String(row.patient)}`)}
          />
        </section>

        {/* ConfirmDialog */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            ConfirmDialog (Peligroso)
          </h2>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Abrir Dialog - Eliminar
          </button>

          <ConfirmDialog
            isOpen={showConfirm}
            title="¿Estás seguro?"
            description="Esta acción no se puede deshacer. ¿Deseas continuar?"
            confirmLabel="Eliminar"
            isDangerous={true}
            onConfirm={() => {
              toast.success('Acción confirmada');
              setShowConfirm(false);
            }}
            onCancel={() => setShowConfirm(false)}
          />
        </section>

        {/* FormField */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            FormField
          </h2>
          <div className="max-w-md">
            <FormField
              label="Email"
              required
              hint="Usaremos esto para contactarte"
              error="Este email ya está registrado"
            >
              <input
                type="email"
                placeholder="tu@hospital.com"
                className="w-full px-4 py-3 border border-red-300 dark:border-red-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </FormField>
          </div>
        </section>

        {/* Testing Tips */}
        <section className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
            💡 Testing Tips:
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li>✅ Presiona <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">ESC</code> en el ConfirmDialog para cerrarlo</li>
            <li>✅ Haz click en la tabla para ver logs en consola (F12)</li>
            <li>✅ Redimensiona la ventana para ver ResponsiveTable en móvil</li>
            <li>✅ Cambia a Dark Mode (botón sol/luna en header)</li>
            <li>✅ Cierra las AlertBanners con la X (si es dismissible)</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default ComponentShowcase;
