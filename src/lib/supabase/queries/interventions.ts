import type { InterventionRecord } from '../../../types';
import { getSupabaseClient } from '../client';

// ---------------------------------------------------------------------------
// Column name mapping helpers
// ---------------------------------------------------------------------------

type DbRow = Record<string, string | null>;

/** Maps a camelCase InterventionRecord to a snake_case DB row. */
function toDbRow(record: InterventionRecord): DbRow {
  return {
    hospital_name:              record.hospitalName ?? '',
    fecha:                      record.fecha,
    tipo_intervencion:          record.tipoIntervencion,
    nombre:                     record.nombre,
    admision_cedula:            record.admisionCedula,
    cama:                       record.cama,
    servicio:                   record.servicio,
    edad:                       record.edad,
    cod_diagnostico:            record.codDiagnostico,
    diagnostico:                record.diagnostico,
    iaas:                       record.iaas,
    tipo_iaas:                  record.tipoIaas,
    aprobo_terapia:             record.aproboTerapia,
    causa_no_aprobacion:        record.causaNoAprobacion,
    combinacion_no_adecuada:    record.combinacionNoAdecuada,
    extension_no_adecuada:      record.extensionNoAdecuada,
    ajuste_por_cultivo:         record.ajustePorCultivo,
    correlacion_dx_antibiotico: record.correlacionDxAntibiotico,
    terapia_empirica_apropiada: record.terapiaEmpricaApropiada,
    cultivos_previos:           record.cultivosPrevios,
    conducta_general:           record.conductaGeneral,
    antibiotico01:              record.antibiotico01,
    acciones_med01:             record.accionesMed01,
    dias_terapia_med01:         record.diasTerapiaMed01,
    antibiotico02:              record.antibiotico02,
    acciones_med02:             record.accionesMed02,
    dias_terapia_med02:         record.diasTerapiaMed02,
    observaciones:              record.observaciones,
    resultado_cultivo:          record.resultadoCultivo,
    tipo_muestra:               record.tipoMuestra,
    organismo_aislado:          record.organismoAislado,
    blee:                       record.blee,
    carbapenemasa:              record.carbapenemasa,
    mrsa:                       record.mrsa,
    sensibilidad_vancomicina:   record.sensibilidadVancomicina,
    sensibilidad_meropenem:     record.sensibilidadMeropenem,
  };
}

/** Maps a snake_case DB row back to a camelCase InterventionRecord. */
function fromDbRow(row: DbRow): InterventionRecord {
  return {
    id:                         row['id'] ?? undefined,
    createdAt:                  row['created_at'] ?? undefined,
    hospitalName:               row['hospital_name'] ?? undefined,
    fecha:                      row['fecha'] ?? '',
    tipoIntervencion:           row['tipo_intervencion'] ?? '',
    nombre:                     row['nombre'] ?? '',
    admisionCedula:             row['admision_cedula'] ?? '',
    cama:                       row['cama'] ?? '',
    servicio:                   row['servicio'] ?? '',
    edad:                       row['edad'] ?? '',
    codDiagnostico:             row['cod_diagnostico'] ?? '',
    diagnostico:                row['diagnostico'] ?? '',
    iaas:                       row['iaas'] ?? '',
    tipoIaas:                   row['tipo_iaas'] ?? '',
    aproboTerapia:              row['aprobo_terapia'] ?? '',
    causaNoAprobacion:          row['causa_no_aprobacion'] ?? '',
    combinacionNoAdecuada:      row['combinacion_no_adecuada'] ?? '',
    extensionNoAdecuada:        row['extension_no_adecuada'] ?? '',
    ajustePorCultivo:           row['ajuste_por_cultivo'] ?? '',
    correlacionDxAntibiotico:   row['correlacion_dx_antibiotico'] ?? '',
    terapiaEmpricaApropiada:    row['terapia_empirica_apropiada'] ?? '',
    cultivosPrevios:            row['cultivos_previos'] ?? '',
    conductaGeneral:            row['conducta_general'] ?? '',
    antibiotico01:              row['antibiotico01'] ?? '',
    accionesMed01:              row['acciones_med01'] ?? '',
    diasTerapiaMed01:           row['dias_terapia_med01'] ?? '',
    antibiotico02:              row['antibiotico02'] ?? '',
    accionesMed02:              row['acciones_med02'] ?? '',
    diasTerapiaMed02:           row['dias_terapia_med02'] ?? '',
    observaciones:              row['observaciones'] ?? '',
    resultadoCultivo:           row['resultado_cultivo'] ?? undefined,
    tipoMuestra:                row['tipo_muestra'] ?? undefined,
    organismoAislado:           row['organismo_aislado'] ?? undefined,
    blee:                       row['blee'] ?? undefined,
    carbapenemasa:              row['carbapenemasa'] ?? undefined,
    mrsa:                       row['mrsa'] ?? undefined,
    sensibilidadVancomicina:    row['sensibilidad_vancomicina'] ?? undefined,
    sensibilidadMeropenem:      row['sensibilidad_meropenem'] ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

/**
 * Upserts an array of InterventionRecords into the interventions table.
 * Conflicts on (admision_cedula, fecha, hospital_name) are updated in place.
 * Returns the count of rows successfully upserted and any error message.
 */
export async function upsertInterventions(
  records: InterventionRecord[],
): Promise<{ inserted: number; error: string | null }> {
  if (records.length === 0) return { inserted: 0, error: null };

  const supabase = getSupabaseClient();
  const rows = records.map(toDbRow);

  const { error, count } = await supabase
    .from('interventions')
    .upsert(rows, {
      onConflict: 'admision_cedula,fecha,hospital_name',
      ignoreDuplicates: false,
    })
    .select('id', { count: 'exact', head: true });

  if (error) {
    return { inserted: 0, error: error.message };
  }

  return { inserted: count ?? records.length, error: null };
}

/**
 * Returns all InterventionRecords, optionally filtered by hospital name.
 * Date filtering is intentionally omitted here because the `fecha` column is
 * stored as a varchar in DD/MM/YYYY format, which is not sortable/comparable
 * via ISO string comparisons. Client-side filterByRange handles date windowing.
 * The start/end parameters are kept in the signature for API compatibility.
 */
export async function getInterventionsByDateRange(
  start: Date,
  end: Date,
  hospital?: string,
): Promise<InterventionRecord[]> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('interventions')
    .select('*');

  if (hospital) {
    query = query.eq('hospital_name', hospital);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return (data as DbRow[]).map(fromDbRow);
}

/**
 * Returns each hospital with its record count and last upload timestamp.
 */
export async function getHospitalsWithStats(): Promise<
  { hospitalName: string; recordCount: number; lastUpload: string }[]
> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('interventions')
    .select('hospital_name, created_at');

  if (error || !data) return [];

  const map = new Map<string, { count: number; lastUpload: string }>();

  for (const row of data as { hospital_name: string; created_at: string | null }[]) {
    const name = row.hospital_name;
    if (!name) continue;
    const existing = map.get(name);
    const ts = row.created_at ?? '';
    if (!existing) {
      map.set(name, { count: 1, lastUpload: ts });
    } else {
      existing.count += 1;
      if (ts > existing.lastUpload) existing.lastUpload = ts;
    }
  }

  return Array.from(map.entries())
    .map(([hospitalName, { count, lastUpload }]) => ({
      hospitalName,
      recordCount: count,
      lastUpload,
    }))
    .sort((a, b) => a.hospitalName.localeCompare(b.hospitalName));
}

/**
 * Deletes all intervention records for the given hospital.
 * Returns the number of rows deleted and any error message.
 */
export async function deleteHospitalData(
  hospitalName: string,
): Promise<{ success: boolean; deleted: number; error: string | null }> {
  const supabase = getSupabaseClient();

  const { error, count } = await supabase
    .from('interventions')
    .delete({ count: 'exact' })
    .eq('hospital_name', hospitalName);

  if (error) {
    return { success: false, deleted: 0, error: error.message };
  }

  return { success: true, deleted: count ?? 0, error: null };
}

/**
 * Deletes every row in the interventions table.
 * Returns the number of rows deleted and any error message.
 */
export async function deleteAllData(): Promise<{
  success: boolean;
  deleted: number;
  error: string | null;
}> {
  const supabase = getSupabaseClient();

  // neq with an impossible value matches all rows
  const { error, count } = await supabase
    .from('interventions')
    .delete({ count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    return { success: false, deleted: 0, error: error.message };
  }

  return { success: true, deleted: count ?? 0, error: null };
}

/**
 * Returns a sorted list of distinct hospital names present in the table.
 */
export async function getDistinctHospitals(): Promise<string[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('interventions')
    .select('hospital_name');

  if (error || !data) return [];

  const unique = Array.from(
    new Set((data as { hospital_name: string }[]).map((row) => row.hospital_name)),
  ).filter(Boolean).sort();

  return unique;
}
