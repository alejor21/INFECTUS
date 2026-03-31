import { createElement } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { Launcher } from './pages/Launcher';
import { Evaluacion } from './pages/Evaluacion';
import { Dashboard } from './pages/Dashboard';
import { IndicadoresPROA } from './pages/IndicadoresPROA';
import { ConsumoAntibioticos } from './pages/ConsumoAntibioticos';
import { Resistencias } from './pages/Resistencias';
import { Reportes } from './pages/Reportes';
import { Configuracion } from './pages/Configuracion';
import { Hospitales } from './pages/Hospitales';
import { HospitalDashboard } from './pages/HospitalDashboard';
import { Comparativa } from './pages/Comparativa';
import { Alertas } from './pages/Alertas';
import { CalculadoraDDD } from './pages/CalculadoraDDD';
import { Pacientes } from './pages/Pacientes';
import { ComponentShowcase } from './pages/ComponentShowcase';
import { ProtectedRoute, LoginRoute } from './components/ProtectedRoute';
import { EvaluacionLayout } from '../modules/evaluacion/components/EvaluacionLayout';
import { EvaluacionInstituciones } from '../modules/evaluacion/pages/EvaluacionInstituciones';
import { EvaluacionPROA } from '../modules/evaluacion/pages/EvaluacionPROA';
import { EvaluacionFormularios } from '../modules/evaluacion/pages/EvaluacionFormularios';
import { EvaluacionIAS } from '../modules/evaluacion/pages/EvaluacionIAS';
import { EvaluacionReportes } from '../modules/evaluacion/pages/EvaluacionReportes';
import { EvaluacionConfiguracion } from '../modules/evaluacion/pages/EvaluacionConfiguracion';

function ErrorPage() {
  return createElement(
    'div',
    { className: 'flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center' },
    createElement('span', { className: 'text-4xl' }, '⚠️'),
    createElement('h2', { className: 'text-xl font-semibold' }, 'Página no encontrada'),
    createElement('p', { className: 'text-sm text-gray-500' }, 'La ruta que buscas no existe.'),
    createElement(
      'a',
      { href: '/dashboard', className: 'rounded-lg bg-teal-600 px-4 py-2 text-sm text-white' },
      'Volver al inicio',
    ),
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginRoute,
  },
  {
    Component: ProtectedRoute,
    errorElement: createElement(ErrorPage),
    children: [
      { index: true, element: createElement(Navigate, { to: '/dashboard', replace: true }) },
      { path: 'launcher', Component: Launcher },
      {
        path: 'evaluacion',
        Component: EvaluacionLayout,
        children: [
          { index: true, Component: Evaluacion },
          { path: 'instituciones', Component: EvaluacionInstituciones },
          { path: 'proa', Component: EvaluacionPROA },
          { path: 'formularios', Component: EvaluacionFormularios },
          { path: 'ias', Component: EvaluacionIAS },
          { path: 'reportes', Component: EvaluacionReportes },
          { path: 'configuracion', Component: EvaluacionConfiguracion },
        ],
      },
      {
        Component: Layout,
        children: [
          { path: 'dashboard', Component: Dashboard },
          { path: 'indicadores-proa', Component: IndicadoresPROA },
          { path: 'consumo-antibioticos', Component: ConsumoAntibioticos },
          { path: 'resistencias', Component: Resistencias },
          { path: 'reportes', Component: Reportes },
          { path: 'alertas', Component: Alertas },
          { path: 'configuracion', Component: Configuracion },
          { path: 'hospitales', Component: Hospitales },
          { path: 'hospitales/:hospitalId/dashboard', Component: HospitalDashboard },
          { path: 'pacientes', Component: Pacientes },
          { path: 'comparativa', Component: Comparativa },
          { path: 'calculadora-ddd', Component: CalculadoraDDD },
          { path: 'componentes', Component: ComponentShowcase },
          { path: '*', element: createElement(Navigate, { to: '/dashboard', replace: true }) },
        ],
      },
    ],
  },
]);
