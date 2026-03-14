import { Suspense, lazy } from 'react';
import type { LazyExoticComponent, ComponentType } from 'react';
import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { ProtectedRoute, LoginRoute } from './components/ProtectedRoute';
import { EvaluacionLayout } from '../modules/evaluacion/components/EvaluacionLayout';
import { PageLoader } from '../components/PageLoader';

// ─── Lazy page imports ───────────────────────────────────────────────────────

function wrap<T extends object>(Lazy: LazyExoticComponent<ComponentType<T>>) {
  return function Wrapped(props: T) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}

const Launcher = wrap(lazy(() => import('./pages/Launcher').then((m) => ({ default: m.Launcher }))));
const Dashboard = wrap(lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard }))));
const IndicadoresPROA = wrap(lazy(() => import('./pages/IndicadoresPROA').then((m) => ({ default: m.IndicadoresPROA }))));
const ConsumoAntibioticos = wrap(lazy(() => import('./pages/ConsumoAntibioticos').then((m) => ({ default: m.ConsumoAntibioticos }))));
const Resistencias = wrap(lazy(() => import('./pages/Resistencias').then((m) => ({ default: m.Resistencias }))));
const Reportes = wrap(lazy(() => import('./pages/Reportes').then((m) => ({ default: m.Reportes }))));
const Configuracion = wrap(lazy(() => import('./pages/Configuracion').then((m) => ({ default: m.Configuracion }))));
const Hospitales = wrap(lazy(() => import('./pages/Hospitales').then((m) => ({ default: m.Hospitales }))));
const HospitalDashboard = wrap(lazy(() => import('./pages/HospitalDashboard').then((m) => ({ default: m.HospitalDashboard }))));
const Comparativa = wrap(lazy(() => import('./pages/Comparativa').then((m) => ({ default: m.Comparativa }))));
const Alertas = wrap(lazy(() => import('./pages/Alertas').then((m) => ({ default: m.Alertas }))));
const CalculadoraDDD = wrap(lazy(() => import('./pages/CalculadoraDDD').then((m) => ({ default: m.CalculadoraDDD }))));
const Pacientes = wrap(lazy(() => import('./pages/Pacientes').then((m) => ({ default: m.Pacientes }))));
const Evaluacion = wrap(lazy(() => import('./pages/Evaluacion').then((m) => ({ default: m.Evaluacion }))));

const EvaluacionInstituciones = wrap(lazy(() => import('../modules/evaluacion/pages/EvaluacionInstituciones').then((m) => ({ default: m.EvaluacionInstituciones }))));
const EvaluacionPROA = wrap(lazy(() => import('../modules/evaluacion/pages/EvaluacionPROA').then((m) => ({ default: m.EvaluacionPROA }))));
const EvaluacionFormularios = wrap(lazy(() => import('../modules/evaluacion/pages/EvaluacionFormularios').then((m) => ({ default: m.EvaluacionFormularios }))));
const EvaluacionIAS = wrap(lazy(() => import('../modules/evaluacion/pages/EvaluacionIAS').then((m) => ({ default: m.EvaluacionIAS }))));
const EvaluacionReportes = wrap(lazy(() => import('../modules/evaluacion/pages/EvaluacionReportes').then((m) => ({ default: m.EvaluacionReportes }))));
const EvaluacionConfiguracion = wrap(lazy(() => import('../modules/evaluacion/pages/EvaluacionConfiguracion').then((m) => ({ default: m.EvaluacionConfiguracion }))));
const ResetPasswordPage = wrap(lazy(() => import('./pages/ResetPassword').then((m) => ({ default: m.ResetPassword }))));

// ─── Router ──────────────────────────────────────────────────────────────────

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
    children: [
      // Standalone routes — no Layout wrapper
      { index: true, Component: Launcher },
      // Evaluacion section — persistent shell with sidebar + hospital selector
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
      // Layout-wrapped routes (pathless layout group)
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
        ],
      },
    ],
  },
]);
