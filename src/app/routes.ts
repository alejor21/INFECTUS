import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Launcher } from "./pages/Launcher";
import { Evaluacion } from "./pages/Evaluacion";
import { Dashboard } from "./pages/Dashboard";
import { IndicadoresPROA } from "./pages/IndicadoresPROA";
import { ConsumoAntibioticos } from "./pages/ConsumoAntibioticos";
import { Resistencias } from "./pages/Resistencias";
import { Reportes } from "./pages/Reportes";
import { Configuracion } from "./pages/Configuracion";
import { Hospitales } from "./pages/Hospitales";
import { Comparativa } from "./pages/Comparativa";
import { Alertas } from "./pages/Alertas";
import { CalculadoraDDD } from "./pages/CalculadoraDDD";
import { Pacientes } from "./pages/Pacientes";
import { ComponentShowcase } from "./pages/ComponentShowcase";
import { ProtectedRoute, LoginRoute } from "./components/ProtectedRoute";
import { EvaluacionLayout } from "../modules/evaluacion/components/EvaluacionLayout";
import { EvaluacionInstituciones } from "../modules/evaluacion/pages/EvaluacionInstituciones";
import { EvaluacionPROA } from "../modules/evaluacion/pages/EvaluacionPROA";
import { EvaluacionFormularios } from "../modules/evaluacion/pages/EvaluacionFormularios";
import { EvaluacionIAS } from "../modules/evaluacion/pages/EvaluacionIAS";
import { EvaluacionReportes } from "../modules/evaluacion/pages/EvaluacionReportes";
import { EvaluacionConfiguracion } from "../modules/evaluacion/pages/EvaluacionConfiguracion";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginRoute,
  },
  {
    Component: ProtectedRoute,
    children: [
      // Standalone routes — no Layout wrapper
      { index: true, Component: Launcher },
      // Evaluacion section — persistent shell with sidebar + hospital selector
      {
        path: "evaluacion",
        Component: EvaluacionLayout,
        children: [
          { index: true, Component: Evaluacion },
          { path: "instituciones", Component: EvaluacionInstituciones },
          { path: "proa", Component: EvaluacionPROA },
          { path: "formularios", Component: EvaluacionFormularios },
          { path: "ias", Component: EvaluacionIAS },
          { path: "reportes", Component: EvaluacionReportes },
          { path: "configuracion", Component: EvaluacionConfiguracion },
        ],
      },
      // Layout-wrapped routes (pathless layout group)
      {
        Component: Layout,
        children: [
          { path: "dashboard", Component: Dashboard },
          { path: "indicadores-proa", Component: IndicadoresPROA },
          { path: "consumo-antibioticos", Component: ConsumoAntibioticos },
          { path: "resistencias", Component: Resistencias },
          { path: "reportes", Component: Reportes },
          { path: "alertas", Component: Alertas },
          { path: "configuracion", Component: Configuracion },
          { path: "hospitales", Component: Hospitales },
          { path: "pacientes", Component: Pacientes },
          { path: "comparativa", Component: Comparativa },
          { path: "calculadora-ddd", Component: CalculadoraDDD },
          { path: "componentes", Component: ComponentShowcase },
        ],
      },
    ],
  },
]);
