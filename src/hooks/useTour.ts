import { useState, useCallback } from 'react';

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
    title: '¡Bienvenido a Infectus!',
    description:
      'Te guiaremos por las funciones principales del programa PROA. Puedes omitir este tour en cualquier momento.',
    targetId: null,
    position: 'center',
  },
  {
    id: 'tour-dashboard',
    title: 'Dashboard',
    description:
      'El panel principal muestra los KPIs clave: adecuación terapéutica, consumo de antibióticos, tasa de IAAS y cumplimiento de guías clínicas.',
    targetId: 'tour-dashboard',
    position: 'right',
  },
  {
    id: 'tour-hospitales',
    title: 'Hospitales',
    description:
      'Gestiona los centros del programa. Aquí puedes registrar hospitales, cargar archivos Excel con intervenciones y ver el historial de cargas.',
    targetId: 'tour-hospitales',
    position: 'right',
  },
  {
    id: 'tour-pacientes',
    title: 'Pacientes',
    description:
      'Lleva fichas clínicas individuales con historial de antibióticos, estado del tratamiento y seguimiento de evolución por paciente.',
    targetId: 'tour-pacientes',
    position: 'right',
  },
  {
    id: 'tour-calculadora',
    title: 'Calculadora DDD',
    description:
      'Calcula la Dosis Diaria Definida (DDD/100 camas-día) según estándares OMS, con importación automática desde los registros cargados.',
    targetId: 'tour-calculadora',
    position: 'right',
  },
  {
    id: 'tour-alertas',
    title: 'Alertas',
    description:
      'Monitorea alertas activas sobre terapias no aprobadas, resistencias críticas y patrones de consumo que requieren atención.',
    targetId: 'tour-alertas',
    position: 'right',
  },
  {
    id: 'tour-reportes',
    title: 'Reportes IA',
    description:
      'Genera reportes ejecutivos PROA, detecta alertas epidemiológicas y consulta al asistente clínico, todo con inteligencia artificial.',
    targetId: 'tour-reportes',
    position: 'right',
  },
  {
    id: 'finish',
    title: '¡Todo listo!',
    description:
      'Ya conoces las funciones principales de Infectus. Puedes volver a ver este tour desde el menú de usuario cuando lo necesites.',
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
