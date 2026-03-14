// ─── Shared TypeScript interfaces for the Evaluacion module ─────────────────

export type EvaluacionStatus = 'borrador' | 'completada' | 'archivada';
export type ComplianceLevel   = 'avanzado' | 'basico' | 'inadecuado';
export type ComplianceValueDB = 'SI' | 'NO' | 'NO_APLICA';
export type FormularioCategoria = 'PROA' | 'IAS';
export type FormularioEstado    = 'activo' | 'borrador';
export type IASEstado           = 'activo' | 'resuelto' | 'seguimiento';
export type IntervenciónTipo    = 'preautorizacion' | 'auditoria' | 'educacion' | 'otro';

// ─── evaluaciones ────────────────────────────────────────────────────────────

export interface Evaluacion {
  id: string;
  hospital_id: string;
  hospital_name: string;
  evaluator_name: string | null;
  evaluation_date: string;
  status: EvaluacionStatus;
  proa_evaluation_id: string | null;
  total_score: number | null;
  level: ComplianceLevel | null;
  progress_pct: number;
  observations: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type EvaluacionInsert = Omit<Evaluacion, 'id' | 'created_at' | 'updated_at'>;
export type EvaluacionUpdate = Partial<Omit<Evaluacion, 'id' | 'created_at'>>;

// ─── evaluacion_respuestas ───────────────────────────────────────────────────

export interface EvaluacionRespuesta {
  id: string;
  evaluacion_id: string;
  item_key: string;
  value: ComplianceValueDB;
  updated_at: string;
}

// ─── instituciones ───────────────────────────────────────────────────────────

export interface Institucion {
  id: string;
  hospital_id: string;
  nombre: string;
  ciudad: string | null;
  tipo: string;
  nivel: string;
  camas: number;
  telefono: string | null;
  email: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export type InstitucionInsert = Omit<Institucion, 'id' | 'created_at' | 'updated_at'>;
export type InstitucionUpdate = Partial<Omit<Institucion, 'id' | 'created_at'>>;

// ─── formularios ─────────────────────────────────────────────────────────────

export interface Formulario {
  id: string;
  hospital_id: string;
  nombre: string;
  categoria: FormularioCategoria;
  descripcion: string | null;
  estado: FormularioEstado;
  enviados: number;
  pendientes: number;
  created_at: string;
  updated_at: string;
}

export type FormularioInsert = Omit<Formulario, 'id' | 'created_at' | 'updated_at'>;
export type FormularioUpdate = Partial<Omit<Formulario, 'id' | 'created_at'>>;

// ─── ias_registros ───────────────────────────────────────────────────────────

export interface IASRegistro {
  id: string;
  hospital_id: string;
  paciente: string | null;
  cama: string | null;
  servicio: string | null;
  tipo_iaas: string | null;
  microorganismo: string | null;
  fecha: string;
  estado: IASEstado;
  observaciones: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type IASRegistroInsert = Omit<IASRegistro, 'id' | 'created_at' | 'updated_at'>;
export type IASRegistroUpdate = Partial<Omit<IASRegistro, 'id' | 'created_at'>>;

// ─── proa_intervenciones ─────────────────────────────────────────────────────

export interface ProaIntervencion {
  id: string;
  hospital_id: string;
  paciente: string | null;
  servicio: string | null;
  tipo: IntervenciónTipo;
  antibiotico: string | null;
  diagnostico: string | null;
  aprobado: boolean | null;
  observaciones: string | null;
  fecha: string;
  created_by: string | null;
  created_at: string;
}

export type ProaIntervencionInsert = Omit<ProaIntervencion, 'id' | 'created_at'>;

// ─── configuracion_hospital ──────────────────────────────────────────────────

export interface ConfiguracionHospital {
  id: string;
  hospital_id: string;
  nombre_programa: string;
  responsable: string | null;
  email_notificaciones: string | null;
  notif_email: boolean;
  notif_alertas: boolean;
  notif_cumplimiento: boolean;
  notif_semanal: boolean;
  zona_horaria: string;
  created_at: string;
  updated_at: string;
}

export type ConfiguracionUpdate = Partial<
  Omit<ConfiguracionHospital, 'id' | 'hospital_id' | 'created_at'>
>;
