import { useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, X } from 'lucide-react';
import type { TourState } from '../../hooks/useTour';

interface TourOverlayProps {
  tour: TourState;
}

export function TourOverlay({ tour }: TourOverlayProps) {
  const {
    isActive,
    currentStep,
    currentStepData,
    totalSteps,
    nextStep,
    prevStep,
    completeTour,
  } = tour;

  useEffect(() => {
    if (!isActive || !currentStepData.targetId) return;

    const element = document.getElementById(currentStepData.targetId);
    if (!element) return;

    element.classList.add('tour-highlight');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    return () => {
      element.classList.remove('tour-highlight');
    };
  }, [isActive, currentStepData]);

  if (!isActive) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const isCentered = currentStepData.targetId === null;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[1px]" />

      <div
        className={`fixed z-[101] w-[calc(100vw-2rem)] max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900 ${
          isCentered
            ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
            : 'bottom-4 left-4 right-4 lg:bottom-6 lg:left-auto lg:right-6'
        }`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-teal-600 dark:text-teal-300">
                Paso {currentStep + 1} de {totalSteps}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {currentStepData.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={completeTour}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="Cerrar guía"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {currentStepData.description}
        </p>

        <div className="mt-5 flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-200 ${
                index === currentStep ? 'w-6 bg-teal-600' : 'w-2 bg-gray-300 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={prevStep}
            disabled={isFirst}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={completeTour}
              className="text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Omitir guía
            </button>
            <button
              type="button"
              onClick={isLast ? completeTour : nextStep}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-teal-700"
            >
              {isLast ? 'Finalizar' : 'Siguiente'}
              {!isLast && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
