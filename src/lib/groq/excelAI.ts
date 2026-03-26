import { askGroq } from './groqClient';

/**
 * Standard field names the AI maps Excel headers to.
 * These align with simplified PROA field semantics.
 */
const STANDARD_FIELDS = [
  'fechaIngreso',
  'servicio',
  'diagnostico',
  'antibiotico',
  'dosis',
  'via',
  'duracion',
  'cultivo',
  'germen',
  'sensibilidad',
  'aproboTerapia',
  'tipoPaciente',
];

/**
 * Calls Groq AI to map raw Excel headers to our standard field names.
 * Returns a Record<rawHeader, standardFieldName>.
 * Falls back to an empty object if the AI call fails.
 */
export async function mapColumns(rawHeaders: string[]): Promise<Record<string, string>> {
  if (rawHeaders.length === 0) return {};

  const prompt = `Tienes estos encabezados de un archivo Excel de un hospital colombiano de un programa PROA (Programa de Optimización de Antimicrobianos):

Encabezados encontrados: ${JSON.stringify(rawHeaders)}

Campos estándar del sistema: ${JSON.stringify(STANDARD_FIELDS)}

Tu tarea: mapear cada encabezado encontrado al campo estándar más apropiado.
Considera variaciones como:
- "Fec. Ingreso", "Fecha de ingreso", "F.Ingreso", "fecha ingreso" → fechaIngreso
- "Servicio", "Área", "Unidad", "Sala" → servicio
- "Diagnóstico", "Dx", "Diagnostico principal" → diagnostico
- "Antibiótico", "ATB", "Antimicrobiano", "Medicamento" → antibiotico
- "Dosis", "Dosis diaria", "Dosis (mg)" → dosis
- "Vía", "Via admin", "Ruta", "Via de administración" → via
- "Duración", "Dias tto", "Días tratamiento", "Duración (días)" → duracion
- "Cultivo", "Resultado cultivo", "Hemocultivo" → cultivo
- "Germen", "Microorganismo", "Bacteria", "Agente" → germen
- "Sensibilidad", "Antibiograma", "Perfil sensibilidad" → sensibilidad
- "Aprobó terapia", "Aprobacion", "Validación", "Aprobó" → aproboTerapia
- "Tipo paciente", "Tipo de paciente", "Categoria paciente" → tipoPaciente

Responde ÚNICAMENTE con un objeto JSON válido sin explicaciones, sin markdown, sin bloques de código.
Formato: {"encabezadoOriginal": "campoEstándar", ...}
Si un encabezado no corresponde a ningún campo estándar, omítelo.`;

  const response = await askGroq(
    'Eres un experto en mapeo de datos hospitalarios. Respondes SOLO con JSON válido, sin explicaciones ni markdown.',
    prompt,
  );

  try {
    const cleaned = response.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {};
  }
}

/**
 * Calls Groq AI to normalize a list of antibiotic names to their correct generic Spanish names.
 * Returns a Record<rawName, normalizedName>.
 * Falls back to an empty object if the AI call fails.
 */
export async function normalizeAntibiotics(rawNames: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(rawNames.filter(Boolean))];
  if (unique.length === 0) return {};

  const prompt = `Estos son nombres de antibióticos/antimicrobianos tal como aparecen en registros hospitalarios colombianos. Pueden tener errores tipográficos, abreviaciones, o inconsistencias:

${JSON.stringify(unique)}

Tu tarea: normalizar cada nombre a su nombre genérico correcto en español.
Ejemplos:
- "Amoxicilna", "amoxicilina", "AMOXICILINA" → "Amoxicilina"
- "Pip/Tazo", "Pip-Tazo", "piperacilina tazobactam", "PTZ" → "Piperacilina/Tazobactam"
- "Vancomicina", "VANCO", "Vanko" → "Vancomicina"
- "Meropenem", "Mero", "MEROPENEM" → "Meropenem"
- "Ceftriaxona", "Ceftriaxone", "CTX", "ceftriaxona" → "Ceftriaxona"
- "Ciprofloxacina", "Cipro", "CIP" → "Ciprofloxacina"
- "Clindamicina", "Clinda" → "Clindamicina"
- "Metronidazol", "Metro", "MTZ" → "Metronidazol"
- "TMP/SMX", "Trimetoprim", "Cotrimoxazol" → "Trimetoprim/Sulfametoxazol"

Responde ÚNICAMENTE con un objeto JSON válido sin explicaciones, sin markdown, sin bloques de código.
Formato: {"nombreOriginal": "nombreNormalizado", ...}
Incluye TODOS los nombres del array de entrada como keys.`;

  const response = await askGroq(
    'Eres un experto farmacéutico hospitalario colombiano. Respondes SOLO con JSON válido, sin explicaciones ni markdown.',
    prompt,
  );

  try {
    const cleaned = response.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {};
  }
}
