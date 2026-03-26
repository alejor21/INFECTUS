import { Building2, CheckCircle2, ClipboardCheck, FileSpreadsheet, BarChart3, X } from 'lucide-react';

interface WelcomeModalProps {
  userId: string;
  onDismiss: () => void;
}

const STORAGE_KEY = (id: string) => `infectus_welcomed_${id}`;

const steps = [
  {
    icon: Building2,
    title: 'Crea tu hospital',
    description: 'Configura la institución donde aplicarás el seguimiento PROA.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Sube tu Excel PROA del mes',
    description: 'Importa tus intervenciones y deja que INFECTUS procese los datos automáticamente.',
  },
  {
    icon: BarChart3,
    title: 'Revisa tus analíticas automáticas',
    description: 'Consulta indicadores, tendencias y comportamiento de los servicios.',
  },
  {
    icon: ClipboardCheck,
    title: 'Registra evaluaciones manualmente',
    description: 'Completa intervenciones individuales cuando necesites seguimiento caso a caso.',
  },
];

function dismiss(userId: string, onDismiss: () => void) {
  localStorage.setItem(STORAGE_KEY(userId), 'true');
  onDismiss();
}

export function WelcomeModal({ userId, onDismiss }: WelcomeModalProps) {
  const handleDismiss = () => dismiss(userId, onDismiss);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      onClick={handleDismiss}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200 dark:bg-gray-900 sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h2 id="welcome-title" className="text-2xl font-bold text-gray-900 dark:text-white">
                ¡Bienvenido a INFECTUS!
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Sigue estos 4 pasos para comenzar:
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="Cerrar bienvenida"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-950/50"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-600 shadow-sm dark:bg-gray-900 dark:text-teal-300">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-teal-600 dark:text-teal-300">
                  Paso {index + 1}
                </span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-teal-700"
          >
            ¡Empezar ahora!
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="block w-full text-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Saltar por ahora
          </button>
        </div>
      </div>
    </div>
  );
}

export function shouldShowWelcome(userId: string): boolean {
  return !localStorage.getItem(STORAGE_KEY(userId));
}

export function resetWelcome(userId: string): void {
  localStorage.removeItem(STORAGE_KEY(userId));
}
