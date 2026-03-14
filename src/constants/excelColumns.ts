import type { InterventionRecord } from '../types';

/**
 * Maps exact Spanish Excel column headers (as they appear in the sheet)
 * to the camelCase field names of InterventionRecord.
 *
 * Includes both the original casing variants and the lowercase/exact
 * variants as they appear in real-world Excel exports.
 */
export const EXCEL_COLUMN_MAP: Record<string, keyof InterventionRecord> = {
  // --- Original casing ---
  'Fecha': 'fecha',
  'Tipo de Intervención': 'tipoIntervencion',
  'Nombre': 'nombre',
  'Admisión / Cédula': 'admisionCedula',
  'Cama': 'cama',
  'Servicio': 'servicio',
  'Edad': 'edad',
  'Cód. Diagnóstico': 'codDiagnostico',
  'Diagnóstico': 'diagnostico',
  'IAAs': 'iaas',
  'Tipo de IAAs': 'tipoIaas',
  'Aprobó Terapia': 'aproboTerapia',
  'Causa No Aprobación': 'causaNoAprobacion',
  'Combinación No Adecuada': 'combinacionNoAdecuada',
  'Extensión No Adecuada': 'extensionNoAdecuada',
  'Ajuste por Cultivo': 'ajustePorCultivo',
  'Correlación Dx-Antibiótico': 'correlacionDxAntibiotico',
  'Terapia Empírica Apropiada': 'terapiaEmpricaApropiada',
  'Cultivos Previos': 'cultivosPrevios',
  'Conducta General': 'conductaGeneral',
  'Antibiótico 01': 'antibiotico01',
  'Acciones Med. 01': 'accionesMed01',
  'Días Terapia Med. 01': 'diasTerapiaMed01',
  'Antibiótico 02': 'antibiotico02',
  'Acciones Med. 02': 'accionesMed02',
  'Días Terapia Med. 02': 'diasTerapiaMed02',
  'Observaciones': 'observaciones',

  // --- Exact lowercase variants as they appear in real Excel exports ---
  'fecha': 'fecha',
  'tipo de intervencion: ic, proa, rev': 'tipoIntervencion',
  'nombre': 'nombre',
  'admision/cedula': 'admisionCedula',
  'cama': 'cama',
  'servicio': 'servicio',
  'edad': 'edad',
  'cod diagnostico': 'codDiagnostico',
  'diagnostico': 'diagnostico',
  'iaas?': 'iaas',
  'tipo de iaas': 'tipoIaas',
  'se aprobo terapia antimicrobiana': 'aproboTerapia',
  'si no se aprobo. causa': 'causaNoAprobacion',
  'combinacion no adecuada': 'combinacionNoAdecuada',
  'extension no adecuada': 'extensionNoAdecuada',
  '¿se realizó ajuste de terapia antimicrobiana guiado por reporte de sensibilidad en cultivo?': 'ajustePorCultivo',
  'diagnóstico infeccioso correlacionado con terapia antibiótica?': 'correlacionDxAntibiotico',
  '¿la terapia empírica fue apropiada (primera línea)?': 'terapiaEmpricaApropiada',
  '¿se realizó toma de cultivos previo al inicio antimicrobiano?': 'cultivosPrevios',
  'conducta general: cambio a terapia a oral - dirige terapia- mantiene-desescalona-escalona': 'conductaGeneral',
  'antibiotico_01': 'antibiotico01',
  'acciones medicamento_01': 'accionesMed01',
  'días terapia: medicamento_01': 'diasTerapiaMed01',
  'antibiotico_02': 'antibiotico02',
  'acciones medicamento_02': 'accionesMed02',
  'días terapia: medicamento_02': 'diasTerapiaMed02',
  'observaciones': 'observaciones',
  // --- Resistance / microbiology columns ---
  'resultado cultivo': 'resultadoCultivo',
  'tipo de muestra': 'tipoMuestra',
  'organismo aislado': 'organismoAislado',
  'blee': 'blee',
  'carbapenemasa': 'carbapenemasa',
  'mrsa': 'mrsa',
  'sensibilidad vancomicina': 'sensibilidadVancomicina',
  'sensibilidad meropenem': 'sensibilidadMeropenem',
};
