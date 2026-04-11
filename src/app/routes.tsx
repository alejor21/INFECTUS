import { Suspense, lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { ProtectedRoute, LoginRoute } from './components/ProtectedRoute';
import { EvaluacionLayout } from '../modules/evaluacion/components/EvaluacionLayout';
import { PageLoader } from '../components/PageLoader';

function wrap<T extends object>(Lazy: LazyExoticComponent<ComponentType<T>>) {
  return function Wrapped(props: T) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}

const Launcher = wrap(lazy(() => import('./pages/Launcher').then((module) => ({ default: module.Launcher }))));
const Dashboard = wrap(lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard }))));
const IndicadoresPROA = wrap(lazy(() => import('./pages/IndicadoresPROA').then((module) => ({ default: module.IndicadoresPROA }))));
const ConsumoAntibioticos = wrap(lazy(() => import('./pages/ConsumoAntibioticos').then((module) => ({ default: module.ConsumoAntibioticos }))));
const Resistencias = wrap(lazy(() => import('./pages/Resistencias').then((module) => ({ default: module.Resistencias }))));
const Reportes = wrap(lazy(() => import('./pages/Reportes').then((module) => ({ default: module.Reportes }))));
const Configuracion = wrap(lazy(() => import('./pages/Configuracion').then((module) => ({ default: module.Configuracion }))));
const Hospitales = wrap(lazy(() => import('./pages/Hospitales').then((module) => ({ default: module.Hospitales }))));
const HospitalDashboard = wrap(lazy(() => import('./pages/HospitalDashboard').then((module) => ({ default: module.HospitalDashboard }))));
const Comparativa = wrap(lazy(() => import('./pages/Comparativa').then((module) => ({ default: module.Comparativa }))));
const Alertas = wrap(lazy(() => import('./pages/Alertas').then((module) => ({ default: module.Alertas }))));
const CalculadoraDDD = wrap(lazy(() => import('./pages/CalculadoraDDD').then((module) => ({ default: module.CalculadoraDDD }))));
const PlantillaPROA = wrap(lazy(() => import('./pages/PlantillaPROA').then((module) => ({ default: module.PlantillaPROA }))));
const Pacientes = wrap(lazy(() => import('./pages/Pacientes').then((module) => ({ default: module.Pacientes }))));
const Evaluacion = wrap(lazy(() => import('./pages/Evaluacion').then((module) => ({ default: module.Evaluacion }))));
const EvaluacionInstituciones = wrap(lazy(() => import('../modules/evaluacion/pages/EvaluacionInstituciones').then((module) => ({ default: module.EvaluacionInstituciones }))));
const EvaluacionPROA = wrap(lazy(() => import('../modules/evaluacion/pages/EvaluacionPROA').then((module) => ({ default: module.EvaluacionPROA }))));
const EvaluacionFormularios = wrap(lazy(() => import('../modules/evaluacion/pages/EvaluacionFormularios').then((module) => ({ default: module.EvaluacionFormularios }))));
const EvaluacionIAS = wrap(lazy(() => import('../modules/evaluacion/pages/EvaluacionIAS').then((module) => ({ default: module.EvaluacionIAS }))));
const EvaluacionReportes = wrap(lazy(() => import('../modules/evaluacion/pages/EvaluacionReportes').then((module) => ({ default: module.EvaluacionReportes }))));
const EvaluacionConfiguracion = wrap(lazy(() => import('../modules/evaluacion/pages/EvaluacionConfiguracion').then((module) => ({ default: module.EvaluacionConfiguracion }))));
const ResetPasswordPage = wrap(lazy(() => import('./pages/ResetPassword').then((module) => ({ default: module.ResetPassword }))));

function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="text-4xl">⚠️</span>
      <h2 className="text-xl font-semibold">Página no encontrada</h2>
      <p className="text-sm text-gray-500">La ruta que buscas no existe.</p>
      <a href="/dashboard" className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white">
        Volver al inicio
      </a>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginRoute,
  },
  {
    path: '/reset-password',
    Component: ResetPasswordPage,
  },
  {
    Component: ProtectedRoute,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
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
          { path: 'plantilla-proa', Component: PlantillaPROA },
          { path: '*', element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
]);
