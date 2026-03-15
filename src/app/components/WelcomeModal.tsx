import { Heart } from 'lucide-react';

interface WelcomeModalProps {
  userId: string;
  onDismiss: () => void;
}

const STORAGE_KEY = (id: string) => `infectus_welcomed_${id}`;

function dismiss(userId: string, onDismiss: () => void) {
  localStorage.setItem(STORAGE_KEY(userId), 'true');
  onDismiss();
}

export function WelcomeModal({ userId, onDismiss }: WelcomeModalProps) {
  const handleDismiss = () => dismiss(userId, onDismiss);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-teal-600 dark:text-teal-400" />
        </div>

        {/* Title */}
        <h2
          id="welcome-title"
          className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
        >
          ¡Bienvenido a Infectus! 🎉
        </h2>

        {/* Subtitle */}
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Tu plataforma para optimizar el uso de antibióticos está lista. Sigue estos pasos para
          comenzar:
        </p>

        {/* Steps */}
        <div className="text-left space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
              1
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Selecciona o crea un hospital arriba
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
              2
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Sube tu Excel con datos históricos
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
              3
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Realiza tu primera evaluación PROA
            </span>
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={handleDismiss}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 min-h-[44px]"
        >
          ¡Empezar ahora! 🚀
        </button>

        {/* Skip */}
        <button
          onClick={handleDismiss}
          className="mt-3 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-h-[44px] w-full"
        >
          Saltar por ahora
        </button>
      </div>
    </div>
  );
}

/** Returns true if the welcome modal should be shown for this user. */
export function shouldShowWelcome(userId: string): boolean {
  return !localStorage.getItem(STORAGE_KEY(userId));
}
