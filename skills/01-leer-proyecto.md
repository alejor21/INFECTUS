# Skill: Leer Proyecto Eficientemente

## Estructura estándar de INFECTUS
src/
├── app/pages/          → Analiticas.tsx, Configuracion.tsx, Hospitales.tsx
├── components/         → DataManagementPanel.tsx, DeleteConfirmModal.tsx
├── hooks/              → useHospital.ts, useEvaluaciones.ts, useDataManagement.ts
├── lib/supabase.ts     → cliente supabase
├── types/index.ts      → todos los tipos
└── utils/excelProcessor.ts → parser Excel

## Regla: leer MÍNIMO de archivos
| Tarea | Leer solo |
|-------|-----------|
| Fix en componente | ese componente + su hook |
| Nuevo hook | types/index.ts + lib/supabase.ts |
| Fix parser Excel | utils/excelProcessor.ts únicamente |
| Nueva página | app/pages/ + routes |
| Fix UI | solo el componente afectado |

## NUNCA leer innecesariamente
- NO leer todos los archivos de pages/ si el fix es en uno solo
- NO leer package.json salvo que pidan instalar algo
- NO leer archivos de config (vite, tsconfig, eslint) salvo errores de build
- NO leer migrations de Supabase salvo cambios de schema

## Patrón de lectura eficiente
1. Inferir archivo por el nombre del bug/feature
2. Leer SOLO ese archivo
3. Si necesitas un tipo → busca en types/index.ts
4. Si necesitas el cliente supabase → lib/supabase.ts