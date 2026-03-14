import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Building2,
  ClipboardCheck,
  BarChart3,
  Sparkles,
  FileDown,
  FileEdit,
  CheckCircle2,
  X,
} from 'lucide-react';

const STORAGE_KEY = 'infectus-onboarding-complete';

function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function markOnboardingComplete() {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // Ignore
  }
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function Step1() {
  return (
    <div className="flex flex-col items-center text-center px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-teal-500 flex items-center justify-center">
          <Activity className="w-9 h-9 text-white" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
        ¡Bienvenido a Infectus! 👋
      </h2>
      <p className="text-base font-semibold text-gray-500 dark:text-gray-400 mb-2">
        La plataforma de gestión PROA para hospitales
      </p>
      <p className="text-sm text-gray-400 dark:text-gray-500">
        Te guiaremos en unos pasos para que empieces rápidamente.
      </p>
    </div>
  );
}

function Step2() {
  return (
    <div className="flex flex-col items-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-6">
        <Building2 className="w-9 h-9 text-indigo-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
        Selecciona tu hospital
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
        Infectus organiza toda la información por hospital. Asegúrate de tener el hospital
        correcto seleccionado en la barra superior antes de comenzar a trabajar.
      </p>
    </div>
  );
}

function Step3() {
  return (
    <div className="flex flex-col items-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-6">
        <ClipboardCheck className="w-9 h-9 text-indigo-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
        Evalúa tu programa PROA
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
        Desde el módulo de Evaluación puedes crear evaluaciones, responder ítems por
        categoría y generar reportes automáticos con IA para identificar áreas de mejora.
      </p>
    </div>
  );
}

function Step4() {
  const features = [
    { icon: <BarChart3 className="w-6 h-6 text-teal-600" />, label: 'Analíticas', desc: 'Visualiza métricas y tendencias' },
    { icon: <Sparkles className="w-6 h-6 text-indigo-600" />, label: 'IA', desc: 'Genera reportes inteligentes' },
    { icon: <FileDown className="w-6 h-6 text-violet-600" />, label: 'Exportar', desc: 'Exporta evaluaciones a PDF' },
    { icon: <FileEdit className="w-6 h-6 text-amber-600" />, label: 'Borradores', desc: 'Guarda y retoma evaluaciones' },
  ];
  return (
    <div className="flex flex-col items-center text-center px-4">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-5">
        Funcionalidades clave
      </h2>
      <div className="grid grid-cols-2 gap-3 w-full">
        {features.map((f) => (
          <div
            key={f.label}
            className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 text-left"
          >
            <div className="mb-2">{f.icon}</div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{f.label}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step5({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex flex-col items-center text-center px-4">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
        className="mb-6"
      >
        <CheckCircle2 className="w-20 h-20 text-green-500" />
      </motion.div>
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
        ¡Todo listo para empezar!
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
        Puedes volver a ver esta guía en cualquier momento desde el menú de ayuda.
      </p>
      <button
        onClick={onFinish}
        className="w-full min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
      >
        Ir al dashboard
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const BUTTON_LABELS = [
  'Comenzar →',
  'Entendido →',
  'Siguiente →',
  'Casi listo →',
];

export function OnboardingFlow() {
  const [visible, setVisible] = useState(() => !hasCompletedOnboarding());
  const [step, setStep] = useState(0);

  const TOTAL_STEPS = 5;

  const handleSkip = () => {
    markOnboardingComplete();
    setVisible(false);
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    }
  };

  const handleFinish = () => {
    markOnboardingComplete();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-0">
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              Paso {step + 1} de {TOTAL_STEPS}
            </span>
            <button
              onClick={handleSkip}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-h-[44px] min-w-[44px] justify-end"
            >
              <X className="w-4 h-4" />
              <span>Omitir</span>
            </button>
          </div>

          {/* Step content */}
          <div className="px-6 py-8 min-h-[280px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {step === 0 && <Step1 />}
                {step === 1 && <Step2 />}
                {step === 2 && <Step3 />}
                {step === 3 && <Step4 />}
                {step === 4 && <Step5 onFinish={handleFinish} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          {step < TOTAL_STEPS - 1 && (
            <div className="px-6 pb-6 flex flex-col items-center gap-4">
              <button
                onClick={handleNext}
                className="w-full min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {BUTTON_LABELS[step] ?? 'Siguiente →'}
              </button>

              {/* Progress dots */}
              <div className="flex items-center gap-2">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setStep(i)}
                    className={`rounded-full cursor-pointer transition-all duration-300 ${
                      i === step
                        ? 'w-5 h-2 bg-indigo-600'
                        : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Dots only on last step */}
          {step === TOTAL_STEPS - 1 && (
            <div className="px-6 pb-4 flex justify-center">
              <div className="flex items-center gap-2">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setStep(i)}
                    className={`rounded-full cursor-pointer transition-all duration-300 ${
                      i === step
                        ? 'w-5 h-2 bg-indigo-600'
                        : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
