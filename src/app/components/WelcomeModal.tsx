import { useNavigate } from 'react-router';
import { ArrowRight, BarChart3, Building2, CheckCircle2, ClipboardCheck, FileSpreadsheet, X } from 'lucide-react';
import { useHospitalContext } from '../../contexts/HospitalContext';

interface WelcomeModalProps {
  userId: string;
  onDismiss: () => void;
}

const STORAGE_KEY = (id: string) => `infectus_welcomed_${id}`;

const steps = [
  {
    icon: Building2,
    title: 'Define tu institucion',
    description: 'Crea o selecciona el hospital donde haras seguimiento del programa PROA.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Carga el Excel del periodo',
    description: 'Importa las intervenciones del mes para generar metricas sin digitacion manual.',
  },
  {
    icon: BarChart3,
    title: 'Revisa las analiticas',
    description: 'Identifica aprobacion terapeutica, cultivos previos y servicios con mayor actividad.',
  },
  {
    icon: ClipboardCheck,
    title: 'Completa casos individuales',
    description: 'Registra manualmente las intervenciones que no esten en el archivo o requieran seguimiento adicional.',
  },
];

function dismiss(userId: string, onDismiss: () => void) {
  localStorage.setItem(STORAGE_KEY(userId), 'true');
  onDismiss();
}

export function WelcomeModal({ userId, onDismiss }: WelcomeModalProps) {
  const navigate = useNavigate();
  const { selectedHospitalObj } = useHospitalContext();
  const hasHospital = Boolean(selectedHospitalObj);
  const primaryLabel = hasHospital ? 'Ir a cargar Excel' : 'Crear mi hospital';

  const handleDismiss = () => dismiss(userId, onDismiss);

  const handlePrimaryAction = () => {
    handleDismiss();
    navigate('/hospitales');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      onClick={handleDismiss}
    >
      <div
        className="animate-in fade-in zoom-in duration-200 w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900 sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h2 id="welcome-title" className="text-2xl font-bold text-gray-900 dark:text-white">
                Bienvenido a INFECTUS
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                Esta plataforma te ayuda a organizar el seguimiento clinico del programa PROA en un flujo simple y entendible para el equipo medico.
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

        <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-4 dark:border-teal-900/40 dark:bg-teal-950/30">
          <p className="text-sm font-medium text-teal-800 dark:text-teal-200">Que hacer primero</p>
          <p className="mt-1 text-sm text-teal-700 dark:text-teal-300">
            {hasHospital
              ? 'Ya tienes un hospital activo. El siguiente paso recomendado es cargar el Excel del periodo y luego revisar el dashboard.'
              : 'Empieza creando tu hospital. Despues podras cargar el Excel PROA y consultar analiticas automaticas.'}
          </p>
          <div className="mt-3 grid gap-2 text-xs text-teal-700 dark:text-teal-300 sm:grid-cols-3">
            <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-gray-900/40">1. Define el hospital activo</div>
            <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-gray-900/40">2. Sube el archivo del periodo</div>
            <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-gray-900/40">3. Revisa indicadores y pendientes</div>
          </div>
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
                <span className="text-sm font-semibold text-teal-600 dark:text-teal-300">Paso {index + 1}</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Saltar por ahora
          </button>
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-teal-700"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4" />
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
