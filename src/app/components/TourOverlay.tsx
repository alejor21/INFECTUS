import { useEffect } from 'react';
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

  // Apply / remove highlight class on the target element
  useEffect(() => {
    if (!isActive || !currentStepData.targetId) return;
    const el = document.getElementById(currentStepData.targetId);
    if (el) el.classList.add('tour-highlight');
    return () => {
      if (el) el.classList.remove('tour-highlight');
    };
  }, [isActive, currentStepData]);

  if (!isActive) return null;

  const isCentered = currentStepData.targetId === null;
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <>
      {/* Semi-transparent overlay — pointer-events-none so backdrop clicks fall through */}
      <div className="fixed inset-0 bg-black/40 z-[100] pointer-events-none" />

      {/* Tooltip card */}
      <div
        className={`
          fixed z-[101] bg-white rounded-2xl shadow-2xl p-6
          w-[calc(100vw-2rem)] max-w-sm pointer-events-auto
          ${isCentered
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:top-1/3 lg:left-72 lg:translate-x-0 lg:-translate-y-1/3'
          }
        `}
      >
        {/* Step counter + skip */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-gray-400">
            {currentStep + 1} / {totalSteps}
          </span>
          <button
            onClick={completeTour}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Omitir
          </button>
        </div>

        {/* Content */}
        <h3 className="text-base font-bold mb-2" style={{ color: '#0B3C5D' }}>
          {currentStepData.title}
        </h3>
        <p className="text-sm text-gray-600 mb-5 leading-relaxed">
          {currentStepData.description}
        </p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === currentStep ? '16px' : '8px',
                height: '8px',
                backgroundColor: i === currentStep ? '#0F8B8D' : '#D1D5DB',
              }}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          {!isFirst ? (
            <button
              onClick={prevStep}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
            >
              Anterior
            </button>
          ) : (
            <div className="flex-1" />
          )}
          <button
            onClick={isLast ? completeTour : nextStep}
            className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity min-h-[44px]"
            style={{ backgroundColor: '#0F8B8D' }}
          >
            {isLast ? '¡Finalizar! 🎉' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </>
  );
}
