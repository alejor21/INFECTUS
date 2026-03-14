import { createBrowserRouter } from 'react-router';
import { MainLayout } from './layouts/MainLayout';
import { TableroGeneral } from './pages/TableroGeneral';
import { Instituciones } from './pages/Instituciones';
import { PROA } from './pages/PROA';
import { IAS } from './pages/IAS';
import { Formularios } from './pages/Formularios';
import { Reportes } from './pages/Reportes';
import { Configuracion } from './pages/Configuracion';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: MainLayout,
    children: [
      { index: true, Component: TableroGeneral },
      { path: 'instituciones', Component: Instituciones },
      { path: 'proa', Component: PROA },
      { path: 'ias', Component: IAS },
      { path: 'formularios', Component: Formularios },
      { path: 'reportes', Component: Reportes },
      { path: 'configuracion', Component: Configuracion },
    ],
  },
]);
