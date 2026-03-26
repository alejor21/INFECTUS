import { useCallback, useState } from 'react';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetId: string | null;
  position: 'center' | 'right';
}

const TOUR_STORAGE_KEY = 'infectus_tour_completed';

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenido a INFECTUS',
    description:
      'Esta guia te muestra por donde empezar para cargar informacion, revisar analiticas y dejar el hospital listo sin perder tiempo.',
    targetId: null,
    position: 'center',
  },
  {
    id: 'tour-dashboard',
    title: 'Dashboard',
    description:
      'Aqui ves el resumen clinico del hospital: actividad reciente, nivel PROA, meses cargados y el siguiente paso recomendado.',
    targetId: 'tour-dashboard',
    position: 'right',
  },
  {
    id: 'tour-hospitales',
    title: 'Hospitales',
    description:
      'En esta seccion creas hospitales, subes el Excel PROA y revisas si la informacion del periodo quedo cargada correctamente.',
    targetId: 'tour-hospitales',
    position: 'right',
  },
  {
    id: 'tour-evaluaciones',
    title: 'Evaluaciones',
    description:
      'Aqui registras evaluaciones, continuas borradores y revisas el detalle de intervenciones previas del equipo PROA.',
    targetId: 'tour-evaluaciones',
    position: 'right',
  },
  {
    id: 'tour-analytics',
    title: 'Analiticas',
    description:
      'Usa esta vista para identificar tendencias, servicios con mayor carga y oportunidades de mejora antes de tomar decisiones del programa.',
    targetId: 'tour-analytics',
    position: 'right',
  },
  {
    id: 'tour-configuracion',
    title: 'Configuracion',
    description:
      'Desde aqui actualizas tu perfil, el hospital activo, usuarios y preferencias de uso.',
    targetId: 'tour-configuracion',
    position: 'right',
  },
  {
    id: 'tour-reportes',
    title: 'Reportes',
    description:
      'Exporta resumenes y documentos para comites clinicos, auditorias o seguimiento institucional.',
    targetId: 'tour-reportes',
    position: 'right',
  },
  {
    id: 'finish',
    title: 'Todo listo',
    description:
      'Ya conoces las funciones principales. Cuando quieras, vuelve a abrir esta guia desde el boton de guia rapida en la parte superior.',
    targetId: null,
    position: 'center',
  },
];

export interface TourState {
  isActive: boolean;
  currentStep: number;
  currentStepData: TourStep;
  totalSteps: number;
  hasCompleted: boolean;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  completeTour: () => void;
  resetTour: () => void;
}

export function useTour(): TourState {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(
    () => localStorage.getItem(TOUR_STORAGE_KEY) === 'true',
  );

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TOUR_STEPS.length - 1));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setHasCompleted(true);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setHasCompleted(false);
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  return {
    isActive,
    currentStep,
    currentStepData: TOUR_STEPS[currentStep],
    totalSteps: TOUR_STEPS.length,
    hasCompleted,
    startTour,
    nextStep,
    prevStep,
    completeTour,
    resetTour,
  };
}
