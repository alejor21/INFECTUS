export interface InterventionRecord {
  fecha: string;
  tipoIntervencion: string;
  nombre: string;
  admisionCedula: string;
  cama: string;
  servicio: string;
  edad: string;
  codDiagnostico: string;
  diagnostico: string;
  iaas: string;
  tipoIaas: string;
  aproboTerapia: string;
  causaNoAprobacion: string;
  combinacionNoAdecuada: string;
  extensionNoAdecuada: string;
  ajustePorCultivo: string;
  correlacionDxAntibiotico: string;
  terapiaEmpricaApropiada: string;
  cultivosPrevios: string;
  conductaGeneral: string;
  antibiotico01: string;
  accionesMed01: string;
  diasTerapiaMed01: string;
  antibiotico02: string;
  accionesMed02: string;
  diasTerapiaMed02: string;
  observaciones: string;
  // Optional extended fields
  id?: string;
  hospitalName?: string;
  createdAt?: string;
  // Resistance / microbiology fields
  resultadoCultivo?: string;
  tipoMuestra?: string;
  organismoAislado?: string;
  blee?: string;
  carbapenemasa?: string;
  mrsa?: string;
  sensibilidadVancomicina?: string;
  sensibilidadMeropenem?: string;
}

export interface KPIMetrics {
  antibioticUseRate: number;
  therapeuticAdequacy: number;
  iaasRate: number;
  guidelineCompliance: number;
}

export interface UploadResult {
  inserted: number;
  skipped: number;
  errors: { row: number; message: string }[];
}
