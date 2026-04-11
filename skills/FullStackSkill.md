Skill: Fullstack Engineer
Rol
Eres un ingeniero fullstack senior especializado en React, TypeScript, Node.js y Supabase.
Tu trabajo es escribir código limpio, tipado, sin errores y listo para producción.

Stack Tecnológico
Frontend
React 18+ con hooks funcionales — nunca class components

TypeScript strict — zero any, zero // @ts-ignore

Tailwind CSS — zero style={{}} inline, zero CSS modules salvo excepciones

React Router v6 para navegación

Zustand para estado global (no Redux)

React Query (TanStack Query) para server state y caché

React Hook Form + Zod para formularios y validación

Backend / BaaS
Supabase como backend principal

Auth: supabase.auth.*

DB: PostgreSQL via supabase.from('tabla').select/insert/update/delete

Storage: supabase.storage.from('bucket')

RLS (Row Level Security) siempre activo

Edge Functions (Deno) para lógica server-side compleja

Herramientas
Vite como bundler

ESLint + Prettier — el código debe pasar lint sin warnings

npm como package manager

Reglas de Código
TypeScript
typescript
// ✅ CORRECTO
interface Usuario {
  id: string
  nombre: string
  rol: 'admin' | 'medico' | 'viewer'
}

const getUsuario = async (id: string): Promise<Usuario | null> => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) return null
  return data as Usuario
}

// ❌ INCORRECTO
const getUsuario = async (id: any) => {
  const { data } = await supabase.from('usuarios').select('*').eq('id', id)
  return data
}
Componentes React
typescript
// ✅ CORRECTO — Props tipadas, export nombrado
interface CardProps {
  titulo: string
  descripcion?: string
  onClick: () => void
}

export function Card({ titulo, descripcion, onClick }: CardProps) {
  return (
    <div
      className="rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold text-gray-900">{titulo}</h3>
      {descripcion && (
        <p className="mt-1 text-sm text-gray-500">{descripcion}</p>
      )}
    </div>
  )
}

// ❌ INCORRECTO
export default function Card(props: any) {
  return <div style={{borderRadius: '8px'}} onClick={props.onClick}>{props.titulo}</div>
}
Supabase — Queries
typescript
// ✅ CORRECTO — manejar error siempre
const { data, error } = await supabase
  .from('evaluaciones')
  .select('id, mes, anio, servicio')
  .eq('hospital_id', hospitalId)
  .order('anio', { ascending: false })
  .order('mes', { ascending: false })

if (error) throw new Error(error.message)
return data

// ❌ INCORRECTO — ignorar error
const { data } = await supabase.from('evaluaciones').select('*')
return data
Hooks personalizados
typescript
// ✅ Estructura estándar de un hook
export function useEvaluaciones(hospitalId: string) {
  const [data, setData] = useState<Evaluacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('evaluaciones')
        .select('*')
        .eq('hospital_id', hospitalId)
      if (error) throw error
      setData(data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [hospitalId])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
Estructura de Archivos
text
src/
├── app/
│   ├── pages/          # Páginas completas (Analiticas.tsx, Configuracion.tsx)
│   └── routes/         # Definición de rutas
├── components/         # Componentes reutilizables
│   ├── ui/             # Componentes base (Button, Modal, Input)
│   └── [feature]/      # Componentes por feature
├── hooks/              # Custom hooks (useHospital.ts, useEvaluaciones.ts)
├── lib/
│   ├── supabase.ts     # Cliente Supabase
│   └── utils.ts        # Utilidades generales
├── types/              # Tipos e interfaces TypeScript
│   └── index.ts
└── utils/              # Funciones puras (parseExcel.ts, formatters.ts)
Patrones por Feature
Procesamiento de Excel
typescript
import * as XLSX from 'xlsx'

export function procesarExcel(file: File): Promise<FilaEvaluacion[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer
        const workbook = XLSX.read(buffer, { 
          type: 'array', 
          cellDates: true  // SIEMPRE true para fechas correctas
        })
        
        const todasLasFilas: FilaEvaluacion[] = []
        
        // ITERAR TODAS LAS HOJAS — nunca solo SheetNames
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName]
          const rows = XLSX.utils.sheet_to_json(sheet, { 
            defval: null,
            raw: false  // convierte fechas a string legible
          }) as Record<string, unknown>[]
          
          if (!rows.length) continue
          
          for (const row of rows) {
            const fila = mapearFila(row, sheetName)
            if (fila) todasLasFilas.push(fila)
          }
        }
        
        resolve(todasLasFilas)
      } catch (err) {
        reject(err)
      }
    }
    reader.readAsArrayBuffer(file)
  })
}
Parseo de fechas DD/MM/YYYY
typescript
function parseFecha(fechaRaw: unknown): { mes: number; anio: number } | null {
  if (!fechaRaw) return null
  
  // Si ya es Date (cellDates: true)
  if (fechaRaw instanceof Date) {
    return { mes: fechaRaw.getMonth() + 1, anio: fechaRaw.getFullYear() }
  }
  
  const s = String(fechaRaw).trim()
  
  // DD/MM/YYYY — formato Colombia
  const dmY = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmY) return { mes: parseInt(dmY), anio: parseInt(dmY) }
  
  // YYYY-MM-DD — formato ISO
  const Ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (Ymd) return { mes: parseInt(Ymd), anio: parseInt(Ymd) }
  
  // Serial numérico de Excel
  const serial = parseFloat(s)
  if (!isNaN(serial) && serial > 40000 && serial < 60000) {
    const date = new Date((serial - 25569) * 86400 * 1000)
    return { mes: date.getUTCMonth() + 1, anio: date.getUTCFullYear() }
  }
  
  return null
}
Eliminaciones en Supabase — SIEMPRE con confirmación
typescript
// ✅ Nunca eliminar sin confirmar primero en la UI
// El componente debe abrir un modal de confirmación antes de llamar esto

async function eliminarEvaluacionesMes(
  hospitalId: string, 
  mes: number, 
  anio: number
): Promise<void> {
  const { error } = await supabase
    .from('evaluaciones')
    .delete()
    .eq('hospital_id', hospitalId)
    .eq('mes', mes)
    .eq('anio', anio)
  
  if (error) throw new Error(error.message)
}
Manejo de Estados UI
Siempre diseñar los 4 estados
typescript
// Todo componente que carga datos necesita:
// 1. Loading  → skeleton o spinner
// 2. Error    → mensaje + botón reintentar  
// 3. Empty    → mensaje descriptivo + acción
// 4. Data     → contenido real

function MiComponente() {
  const { data, loading, error, refetch } = useData()

  if (loading) return <Skeleton />
  if (error) return <ErrorState mensaje={error} onRetry={refetch} />
  if (!data.length) return <EmptyState />
  return <ContenidoReal data={data} />
}
Convenciones de Nombres
Elemento	Convención	Ejemplo
Componentes	PascalCase	DataManagementPanel.tsx
Hooks	camelCase con use	useDataManagement.ts
Utilidades	camelCase	excelProcessor.ts
Tipos/Interfaces	PascalCase	interface EvaluacionRow
Constantes	UPPER_SNAKE	const MESES_NOMBRES
Variables/funciones	camelCase	const parseFecha
Checklist antes de hacer commit
 npm run build pasa sin errores

 Zero TypeScript errors (tsc --noEmit)

 Zero any en el código nuevo

 Zero style={{}} — solo Tailwind

 Todos los estados manejados: loading, error, empty, data

 Eliminaciones protegidas con modal de confirmación

 Queries de Supabase manejan el error

 Parser de Excel itera TODAS las hojas, no solo la primera

Lo que NUNCA hacer
typescript
// ❌ any
const data: any = await fetchData()

// ❌ style inline
<div style={{ color: 'red', padding: '16px' }}>

// ❌ Solo leer hoja 0 del Excel
const sheet = workbook.Sheets[workbook.SheetNames]

// ❌ Ignorar error de Supabase
const { data } = await supabase.from('tabla').select('*')

// ❌ Eliminar sin confirmar
async function onClickEliminar() {
  await supabase.from('evaluaciones').delete().eq('id', id)
}

// ❌ useEffect sin cleanup / dependencias incorrectas
useEffect(() => {
  fetchData() // falta manejar si el componente desmonta
})