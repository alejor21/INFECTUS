# Skill: Parser Excel INFECTUS

## Regla principal
SIEMPRE iterar TODAS las hojas. Nunca solo SheetNames[0].

## Código base
const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false })
  if (!rows.length) continue
  // procesar filas...
}

## parseFecha
function parseFecha(v: unknown): { mes: number; anio: number } | null {
  if (!v) return null
  if (v instanceof Date) return { mes: v.getMonth()+1, anio: v.getFullYear() }
  const s = String(v).trim()
  const a = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)  // DD/MM/YYYY
  if (a) return { mes: +a[2], anio: +a[3] }
  const b = s.match(/^(\d{4})-(\d{2})-(\d{2})/)          // ISO
  if (b) return { mes: +b[2], anio: +b[1] }
  const n = parseFloat(s)
  if (!isNaN(n) && n > 40000 && n < 60000) {              // Serial Excel
    const d = new Date((n - 25569) * 86400 * 1000)
    return { mes: d.getUTCMonth()+1, anio: d.getUTCFullYear() }
  }
  return null
}

## Columnas exactas plantilla INFECTUS
FECHA | Tipo de intervencion: IC, PROA, REV | NOMBRE | ADMISION/CEDULA
CAMA | Servicio | EDAD | COD DIAGNOSTICO | DIAGNOSTICO | IAAS?
TIPO DE IAAS | SE APROBO TERAPIA ANTIMICROBIANA | SI NO SE APROBO. CAUSA
COMBINACION NO ADECUADA | EXTENSION NO ADECUADA
¿Se realizó ajuste de terapia antimicrobiana guiado por reporte de sensibilidad en cultivo?
Diagnóstico infeccioso correlacionado con terapia antibiótica?
¿La terapia empírica fue apropiada (Primera línea)?
¿Se realizó toma de cultivos previo al inicio antimicrobiano?
Conducta general: Cambio a terapia A ORAL - DIRIGE TERAPIA- MANTIENE-Desescalona-Escalona
Antibiotico_01 | Acciones Medicamento_01 | Días Terapia: Medicamento_01
Antibiotico_02 | Acciones Medicamento_02 | Días Terapia: Medicamento_02
OBSERVACIONES | Resultado Cultivo | Tipo de Muestra | Organismo Aislado
BLEE | Carbapenemasa | MRSA | Sensibilidad Vancomicina | Sensibilidad Meropenem

## Validación
- parseFecha falla Y mesHoja null → push errores[], continue
- mes debe ser 1-12, anio > 2000
- Insert en chunks de 500