# AGENT.md — INFECTUS
> Plataforma de Gestión del Programa PROA
> Lee este archivo COMPLETO antes de tocar cualquier cosa.

---

## 🧠 CONTEXTO DEL PROYECTO

INFECTUS es una plataforma web médica usada por equipos PROA
(Programa de Optimización de Antimicrobianos) en hospitales colombianos.
Permite importar datos desde Excel, registrar evaluaciones de pacientes,
y generar analíticas automáticas sobre el uso de antibióticos.

Usuarios finales: Médicos infectólogos, enfermeras, químicos
farmacéuticos, administradores hospitalarios.

Objetivo principal: Reemplazar el Excel manual con un sistema
automatizado que genere analíticas en tiempo real sin errores.

---

## ⚙️ STACK TECNOLÓGICO

| Capa | Tecnología |
|---|---|
| Framework | React 18 + TypeScript (strict) |
| Build | Vite |
| Estilos | Tailwind CSS v3 — SOLO Tailwind, CERO CSS inline |
| Routing | React Router v6 |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Gráficas | Recharts (o la librería ya instalada en el proyecto) |
| Excel | xlsx / SheetJS |
| Íconos | Lucide React |
| Formularios | React Hook Form + Zod |
| Estado global | Context API (AuthContext, HospitalContext) |
| Deploy | Vercel |
| Tipografía | Inter (Google Fonts) |

---

## 📁 ESTRUCTURA DE CARPETAS

src/
├── app/
│   ├── components/
│   │   ├── ui/              ← Componentes base reutilizables
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── LoadingSkeleton.tsx
│   │   ├── charts/          ← Componentes de gráficas
│   │   ├── layout/          ← Sidebar, Topbar, Layout
│   │   └── shared/          ← Componentes compartidos específicos
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Analytics.tsx
│   │   ├── EvaluacionPROA.tsx
│   │   ├── Hospitals.tsx
│   │   └── Settings.tsx
│   ├── hooks/               ← Custom hooks
│   ├── utils/               ← Utilidades puras (parser Excel, formatters)
│   └── lib/                 ← Clientes externos (supabase.ts, etc.)
├── contexts/
│   ├── AuthContext.tsx
│   └── HospitalContext.tsx
├── types/                   ← Todos los tipos TypeScript
│   ├── evaluacion.types.ts
│   ├── hospital.types.ts
│   └── analytics.types.ts
└── main.tsx

---

## 🔒 REGLAS ABSOLUTAS — NUNCA VIOLAR

1. TypeScript STRICT — cero 'any', cero 'as unknown'
2. Tailwind ONLY — cero style={{}}, cero CSS modules, cero styled-components
3. Cero console.error en runtime
4. Cero TypeScript errors — npm run build debe pasar SIEMPRE
5. NO romper funcionalidad existente al hacer cambios
6. NO instalar librerías nuevas sin verificar si ya existe una equivalente
7. Componentes en INGLÉS (nombres), contenido visible en ESPAÑOL
8. Cero lógica de negocio en componentes UI — va en hooks o utils
9. Cero llamadas a Supabase directas en componentes — van en hooks
10. Todo cambio destructivo requiere confirmación del usuario (modal)

---

## 🎨 SISTEMA DE DISEÑO

### Paleta de colores
Primary:     teal-600 (#0D9488) / teal-700 (#0F766E)
Background:  gray-50 en light  /  gray-950 en dark
Surface:     white en light     /  gray-900 en dark
Border:      gray-200 en light  /  gray-800 en dark
Text:        gray-900 en light  /  gray-100 en dark
Muted:       gray-500
Success:     emerald-500
Warning:     amber-500
Error:       red-500
Info:        blue-500

### Tipografía (Inter)
H1 — text-2xl font-bold tracking-tight
H2 — text-xl font-semibold
H3 — text-lg font-semibold
Subtítulo — text-sm font-medium text-gray-500
Body — text-sm
Label — text-xs font-medium uppercase tracking-wide text-gray-400

### Espaciado y bordes
Cards:   rounded-2xl p-6 border shadow-sm
Inputs:  rounded-xl border h-10 px-3
Buttons: rounded-xl font-medium transition-all duration-200
Modals:  rounded-2xl p-6 shadow-xl

### Variantes de Button
primary:   bg-teal-600 hover:bg-teal-700 text-white
secondary: bg-gray-100 hover:bg-gray-200 text-gray-900
ghost:     hover:bg-gray-100 text-gray-600
danger:    bg-red-500 hover:bg-red-600 text-white
outline:   border border-gray-300 hover:bg-gray-50

### Variantes de Badge
success: bg-emerald-50 text-emerald-700 border border-emerald-200
warning: bg-amber-50  text-amber-700  border border-amber-200
error:   bg-red-50    text-red-700    border border-red-200
info:    bg-blue-50   text-blue-700   border border-blue-200
neutral: bg-gray-100  text-gray-600   border border-gray-200

---

## 🏥 DOMINIO — PROGRAMA PROA

### Roles de usuario
Admin               → acceso total, gestión de usuarios
Médico              → crear/ver evaluaciones, ver analíticas
Enfermera           → crear/ver evaluaciones
Químico Farmacéutico → ver evaluaciones, analíticas
Auditor             → solo lectura

### Columnas del Excel PROA
El Excel que suben los usuarios tiene estas columnas.
Mapear de forma flexible: trim + lowercase + sin tildes.

fecha
tipo_intervencion          → IC | PROA | REV
nombre                     → nombre del paciente
cedula / admision
cama
servicio
edad
cod_diagnostico
diagnostico
iaas                       → Sí/No
tipo_iaas
aprobacion_terapia         → Sí/No
causa_no_aprobacion
combinacion_no_adecuada    → Sí/No
extension_no_adecuada      → Sí/No
ajuste_por_cultivo         → Sí/No
diagnostico_correlacionado → Sí/No
terapia_empirica_apropiada → Sí/No
cultivos_previos           → Sí/No
conducta_general           → Cambio oral | Dirige | Mantiene | Desescalona | Escala
antibiotico_01
acciones_medicamento_01
dias_terapia_01
antibiotico_02
acciones_medicamento_02
dias_terapia_02
observaciones

### KPIs médicos
% Aprobación terapia  = aprobadas / total * 100
% Cultivos previos    = con_cultivo / total * 100
% Terapia empírica    = apropiadas / total * 100
Días promedio terapia = suma(dias_01 + dias_02) / total
NUNCA dividir por cero → fallback a 0

### Analíticas a mostrar
1. KPI cards (4): total, % aprobación, % cultivos, % empírica
2. Línea temporal: evaluaciones por día
3. Barras: Top 10 antibióticos
4. Donut: Conductas generales
5. Barras horizontales: Por servicio
6. Barras agrupadas: Aprobadas vs No por servicio
7. Donut: Tipos de intervención
8. Tabla: Top 10 diagnósticos

---

## 🗄️ BASE DE DATOS — SUPABASE

### Tablas principales

hospitals     → id, nombre, nit, ciudad, departamento,
                nivel_complejidad, caracter, responsable_proa,
                created_at, user_id

evaluaciones  → id, hospital_id, fecha, tipo_intervencion,
                nombre_paciente, cedula, cama, servicio, edad,
                diagnostico, cod_diagnostico, iaas, tipo_iaas,
                aprobacion_terapia, causa_no_aprobacion,
                combinacion_no_adecuada, extension_no_adecuada,
                ajuste_cultivo, dx_correlacionado,
                terapia_empirica, cultivos_previos,
                conducta_general, antibiotico_01, dias_01,
                antibiotico_02, dias_02, observaciones,
                created_at, updated_at

profiles      → id (= auth.users.id), nombre, cargo, rol,
                hospital_id, avatar_url

### Reglas para Supabase
- TODAS las queries van en custom hooks (useHospitals, useEvaluaciones, etc.)
- NUNCA hacer .from() directamente en un componente
- Siempre manejar loading, error y data en los hooks
- Usar RLS (Row Level Security) — no bypassear
- Siempre validar con Zod antes de insertar
- Usar tipos generados de Supabase si existen en src/lib/database.types.ts

---

## 🧩 PATRONES DE CÓDIGO

### Custom Hook — estructura estándar
export function useEvaluaciones(hospitalId: string) {
  const [data, setData] = useState<Evaluacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hospitalId) return
    fetchEvaluaciones()
  }, [hospitalId])

  async function fetchEvaluaciones() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('evaluaciones')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('fecha', { ascending: false })
      if (error) throw error
      setData(data ?? [])
    } catch (err) {
      setError('Error al cargar evaluaciones')
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch: fetchEvaluaciones }
}

### Componente — estructura estándar
interface CardEvaluacionProps {
  evaluacion: Evaluacion
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function CardEvaluacion({ evaluacion, onEdit, onDelete }: CardEvaluacionProps) {
  const aprobado = evaluacion.aprobacion_terapia
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-900">
      ...
    </div>
  )
}

### Parser Excel — funciones base
// Normalizar encabezados
const normalize = (s: string) =>
  s.trim().toLowerCase()
   .normalize('NFD')
   .replace(/[\u0300-\u036f]/g, '')
   .replace(/\s+/g, '_')

// Parsear booleanos
const parseBool = (v: unknown): boolean | null => {
  if (v == null) return null
  const s = String(v).trim().toLowerCase()
  if (['si', 'sí', '1', 'true', 'yes'].includes(s)) return true
  if (['no', '0', 'false'].includes(s)) return false
  return null
}

// Parsear fechas (todos los formatos)
const parseDate = (v: unknown): Date | null => {
  if (v == null || v === '' || v === 'N/A' || v === '-') return null
  if (typeof v === 'number') {
    return new Date(Math.round((v - 25569) * 86400 * 1000))
  }
  const s = String(v).trim()
  const ddmm = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (ddmm) return new Date(`${ddmm[3]}-${ddmm[2]}-${ddmm[1]}`)
  const parsed = new Date(s)
  return isNaN(parsed.getTime()) ? null : parsed
}

// Porcentaje sin dividir por cero
const pct = (num: number, den: number) =>
  den === 0 ? 0 : Math.round((num / den) * 100)

---

## 🚦 FLUJO DE TRABAJO DEL AGENTE

Cuando recibas una tarea sigue este orden SIEMPRE:

1. Lee AGENT.md completo (este archivo)
2. Lee los archivos relevantes para la tarea
3. Identifica dependencias antes de modificar
4. Implementa el cambio más pequeño posible que funcione
5. Verifica que npm run build pasa
6. Haz commit con mensaje descriptivo
7. Pasa al siguiente bloque

### Mensajes de commit
feat:     nueva funcionalidad
fix:      corrección de bug
style:    cambio de diseño sin afectar lógica
refactor: refactorización sin cambio de comportamiento
chore:    cambios de configuración o dependencias

---

## ✅ CHECKLIST ANTES DE CADA COMMIT

□ npm run build → sin errores
□ TypeScript → cero errores
□ Consola del browser → cero console.error
□ Dark mode → se ve correctamente en todas las pantallas
□ Mobile (375px) → se ve correctamente
□ Empty states → existen en todas las secciones
□ Loading states → existen en todas las operaciones async
□ Error states → mensajes claros en español
□ Funcionalidad existente → no se rompió nada

---

## 🚫 ANTIPATRONES — NUNCA HACER ESTO

❌ const data: any = response.data
✅ const data: Evaluacion[] = response.data

❌ <div style={{ color: 'red', padding: '16px' }}>
✅ <div className="text-red-500 p-4">

❌ const { data } = await supabase.from('evaluaciones').select() // dentro de un componente
✅ const { data } = useEvaluaciones(hospitalId)

❌ const porcentaje = (aprobadas / total) * 100
✅ const porcentaje = total === 0 ? 0 : (aprobadas / total) * 100

❌ <BarChart data={data} />  // sin empty state
✅ {data.length === 0 ? <EmptyState mensaje="Sin datos" /> : <BarChart data={data} />}

❌ import { useState } from 'react' // y luego lógica de BD en el componente
✅ Toda lógica de BD va en hooks, toda lógica de transformación va en utils

---

## 🌐 VARIABLES DE ENTORNO

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

Nunca exponer la service_role key en el frontend.
Nunca hardcodear URLs o keys en el código.

---

*AGENT.md — INFECTUS v2 | Actualizado: 25 de marzo de 2026*