import { useState } from 'react';
import { Heart, Building2, FileSpreadsheet, BarChart3, ClipboardCheck, ChevronRight, ChevronLeft, X } from 'lucide-react';

interface WelcomeModalProps {
  userId: string;
  onDismiss: () => void;
}

const STORAGE_KEY = (id: string) => `infectus_welcomed_${id}`;

const STEPS = [
  {
    icon: Building2,
    title: 'Crea tu Hospital',
    description: 'Comienza creando o seleccionando tu hospital. Ve a "Hospitales" y haz clic en "Nuevo Hospital".',
    tip: '💡 Puedes agregar múltiples hospitales si gestionas varios centros.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Sube tu Excel PROA',
    description: 'Importa tus datos históricos subiendo el archivo Excel del programa PROA. El sistema procesará automáticamente todas las columnas.',
    tip: '📋 Acepta formatos .xlsx, .xls y .csv con las columnas estándar PROA.',
  },
  {
    icon: BarChart3,
    title: 'Ve tus Analíticas',
    description: 'Visualiza indicadores clave: % aprobación, cultivos previos, terapia empírica, antibióticos más usados, y más.',
    tip: '📊 Las gráficas se actualizan automáticamente con cada importación.',
  },
  {
    icon: ClipboardCheck,
    title: 'Registra Manualmente',
    description: 'También puedes registrar evaluaciones PROA manualmente, una por una, usando el formulario de evaluación.',
    tip: '✏️ El sistema guarda borradores automáticamente mientras trabajas.',
  },
];

function dismiss(userId: string, onDismiss: () => void) {
  localStorage.setItem(STORAGE_KEY(userId), 'true');
  onDismiss();
}

export function WelcomeModal({ userId, onDismiss }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const handleDismiss = () => dismiss(userId, onDismiss);

  const step = STEPS[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="welcome-title" className="text-lg font-bold text-white">
                ¡Bienvenido a Infectus!
              </h2>
              <p className="text-teal-100 text-sm">Guía rápida de inicio</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-1.5 rounded-full mx-0.5 transition-colors ${
                  index <= currentStep
                    ? 'bg-teal-600 dark:bg-teal-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
            Paso {currentStep + 1} de {STEPS.length}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {step.title}
              </h3>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            {step.description}
          </p>

          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-3">
            <p className="text-sm text-teal-700 dark:text-teal-300">
              {step.tip}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          {!isFirstStep ? (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
          ) : (
            <button
              onClick={handleDismiss}
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Saltar guía
            </button>
          )}

          {isLastStep ? (
            <button
              onClick={handleDismiss}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
            >
              ¡Empezar ahora! 🚀
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Returns true if the welcome modal should be shown for this user. */
export function shouldShowWelcome(userId: string): boolean {
  return !localStorage.getItem(STORAGE_KEY(userId));
}

/** Resets the welcome modal so it shows again for the user. */
export function resetWelcome(userId: string): void {
  localStorage.removeItem(STORAGE_KEY(userId));
}
