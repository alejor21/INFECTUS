# Skill: Supabase INFECTUS

## Tablas principales
hospitales   → id, nombre, ciudad, departamento
usuarios     → id, hospital_id, rol (admin|medico|viewer)
evaluaciones → id, hospital_id, mes, anio, fecha, tipo_intervencion,
               servicio, diagnostico, antibiotico_01, antibiotico_02,
               organismo, blee, carbapenemasa, mrsa, se_aprobo,
               cultivos_previos, terapia_empirica, conducta

## Queries más usadas

// Por hospital y mes
const { data, error } = await supabase
  .from('evaluaciones').select('*')
  .eq('hospital_id', hospitalId).eq('mes', mes).eq('anio', anio)

// Meses disponibles
const { data } = await supabase
  .from('evaluaciones').select('id, mes, anio')
  .eq('hospital_id', hospitalId)
// Agrupar en JS por mes+anio

// Insert masivo en chunks de 500
for (const batch of chunks) {
  const { error } = await supabase.from('evaluaciones').insert(batch)
  if (error) throw error
}

// Delete por mes
await supabase.from('evaluaciones').delete()
  .eq('hospital_id', hospitalId).eq('mes', mes).eq('anio', anio)

// Delete inválidos (por IDs directos)
const ids = invalidos.map(r => r.id)
await supabase.from('evaluaciones').delete().in('id', ids)

## Reglas
- Siempre filtrar por hospital_id
- Siempre manejar el error de cada query
- hospital_id viene de useHospital().hospitalActual.id