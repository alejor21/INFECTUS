<div align="center">

<img src="public/logo.png" alt="Infectus Logo" width="90" />

# Infectus Analytics

**Plataforma de vigilancia y optimización del uso de antimicrobianos para hospitales colombianos**

[![Deploy](https://img.shields.io/badge/deploy-vercel-black?style=flat-square&logo=vercel)](https://infectus.vercel.app)
[![React](https://img.shields.io/badge/react-router_v7-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactrouter.com)
[![TypeScript](https://img.shields.io/badge/typescript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/supabase-postgres-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind](https://img.shields.io/badge/tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

[🌐 Ver Demo](https://infectus.vercel.app) · [📂 Repositorio](https://github.com/alejor21/INFECTUS) · [🐛 Reportar un problema](https://github.com/alejor21/INFECTUS/issues)

</div>

---

## ¿Qué es Infectus?

Infectus es un dashboard clínico diseñado para los **Programas de Optimización de Antibióticos (PROA)** en instituciones de salud de Colombia. Permite centralizar el seguimiento de infecciones asociadas a la atención en salud (IAAS), evaluar el cumplimiento de guías clínicas, analizar el consumo de antimicrobianos y generar reportes de indicadores de impacto — todo en una sola plataforma, con acceso basado en roles.

---

## ✨ Funcionalidades

| Módulo | Descripción |
|---|---|
| 🏥 **Hospitales** | Gestión de instituciones hospitalarias con carga de datos Excel y dashboard analítico por hospital |
| 📊 **Dashboard** | Indicadores clave: tasa de uso de antibióticos, adecuación terapéutica, cumplimiento de guías |
| 📋 **Evaluación PROA** | Formulario de evaluación por secciones (Pre-implementación, Ejecución, Evaluación) con guardado automático |
| 💊 **Consumo de Antibióticos** | Análisis de DDD/DOT, top antibióticos, tendencias mensuales y distribución por servicio |
| 🦠 **Resistencias** | Perfil institucional de resistencia bacteriana con visualización por germen y servicio |
| 📈 **Indicadores PROA** | KPIs de proceso, resultado e impacto del programa PROA por período |
| 🏨 **IAS (IAAS)** | Registro y seguimiento de infecciones nosocomiales con estadísticas por tipo y estado |
| 🧑‍⚕️ **Pacientes** | Base de datos de pacientes con historial de intervenciones antimicrobianas |
| 🆚 **Comparativa** | Comparación de métricas entre hospitales o períodos de tiempo |
| 🧮 **Calculadora DDD** | Cálculo de Dosis Diarias Definidas para cualquier antibiótico |
| 📄 **Reportes** | Generación de reportes en PDF con tablas de evidencia por evaluación |
| ⚙️ **Configuración** | Ajustes del programa PROA por institución: responsable, notificaciones, zona horaria |
| 🔔 **Alertas** | Notificaciones automáticas por umbrales de resistencia o consumo elevado |

---

## 🚀 Inicio rápido

### Requisitos

- Node.js ≥ 18
- Una cuenta en [Supabase](https://supabase.com) con el proyecto configurado

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/alejor21/INFECTUS.git
cd INFECTUS

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# → editar .env.local con tus credenciales de Supabase

# 4. Ejecutar en modo desarrollo
npm run dev
```

### Variables de entorno

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🗂️ Estructura del proyecto

```
src/
├── app/
│   ├── pages/              # Páginas principales (Dashboard, Hospitales, Evaluacion…)
│   └── routes.tsx          # Configuración de rutas (React Router v7)
├── contexts/               # AuthContext, permisos por rol
├── modules/
│   ├── evaluacion/         # Módulo PROA: formulario, hooks, tipos, PDF
│   │   ├── components/     # EvaluacionBoard, EvaluacionCard, EvaluacionSummary…
│   │   ├── data/           # proaItems.ts — 61 ítems en 3 secciones
│   │   ├── hooks/          # useEvaluaciones, useIAS, usePROA…
│   │   └── lib/            # evaluacion.ts, evaluacionPDF.ts, evaluacionIA.ts
│   ├── excel/              # Procesador de archivos Excel (3 estrategias)
│   └── onboarding/         # Flujo de onboarding para nuevos hospitales
├── lib/
│   ├── supabase/           # Cliente Supabase y consultas tipadas
│   └── ai/                 # Cliente de análisis IA para reportes PROA
└── components/             # Componentes UI compartidos
```

---

## 🛠️ Stack tecnológico

- **Framework**: React Router v7 + Vite
- **Lenguaje**: TypeScript (modo estricto)
- **Estilos**: Tailwind CSS
- **Base de datos**: Supabase (PostgreSQL)
- **Gráficos**: Recharts
- **Animaciones**: Motion (Framer Motion)
- **Exportación**: jsPDF + jspdf-autotable
- **Excel**: SheetJS (xlsx)
- **Notificaciones**: Sonner
- **Testing**: Vitest

---

## 📋 Base de datos

El esquema completo se encuentra en:

```
supabase/migrations/20260313000000_infectus_full_schema.sql
```

Ejecuta la migración desde el panel de Supabase o con la CLI:

```bash
supabase db push
```

Las tablas principales son: `hospitals`, `evaluaciones`, `evaluacion_respuestas`, `ias_registros`, `proa_intervenciones`, `hospital_monthly_metrics`, `configuracion_hospital`.

---

## 🔐 Roles de usuario

| Rol | Descripción |
|---|---|
| **Administrador** | Acceso total: gestión de hospitales, usuarios, evaluaciones y configuración |
| **Médico / Infectólogo** | Crear y completar evaluaciones, registrar pacientes, subir archivos Excel |
| **Visitante** | Solo lectura — puede consultar dashboards e indicadores, sin edición |

---

## 📦 Scripts disponibles

```bash
npm run dev           # Servidor de desarrollo en localhost:5173
npm run build         # Build de producción (TypeScript + Vite)
npm run test          # Ejecutar tests con Vitest
npm run test:watch    # Tests en modo watch
npm run test:coverage # Reporte de cobertura
```

---

## 🌐 Deploy en Vercel

1. Haz fork del repositorio en GitHub
2. Importa el proyecto en [vercel.com](https://vercel.com)
3. Agrega las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en la configuración del proyecto
4. Vercel detectará Vite automáticamente y desplegará con cada `push` a `main`

Demo en producción: **[infectus.vercel.app](https://infectus.vercel.app)**

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para contribuir:

1. Haz fork del repositorio
2. Crea una rama descriptiva: `git checkout -b feat/nombre-funcionalidad`
3. Realiza tus cambios y asegúrate de que `npm run build` pase sin errores
4. Abre un Pull Request describiendo los cambios

---

<div align="center">

Desarrollado con ❤️ para el sistema de salud colombiano

[infectus.vercel.app](https://infectus.vercel.app)

</div>
