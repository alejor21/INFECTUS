import { z } from 'zod';

export const interventionSchema = z.object({
  // Required fields
  hospitalId: z.string().optional(),
  fecha: z.string().min(1, 'La fecha es requerida'),
  servicio: z.string().min(1, 'El servicio es requerido'),

  // Optional fields
  nombre: z.string().optional(),
  admisionCedula: z.string().optional(),
  tipoIntervencion: z.string().optional(),
  cama: z.string().optional(),
  edad: z.string().optional(),
  codDiagnostico: z.string().optional(),
  diagnostico: z.string().optional(),
  iaas: z.string().optional(),
  tipoIaas: z.string().optional(),
  aproboTerapia: z.string().optional(),
  causaNoAprobacion: z.string().optional(),
  combinacionNoAdecuada: z.string().optional(),
  extensionNoAdecuada: z.string().optional(),
  ajustePorCultivo: z.string().optional(),
  correlacionDxAntibiotico: z.string().optional(),
  terapiaEmpricaApropiada: z.string().optional(),
  cultivosPrevios: z.string().optional(),
  conductaGeneral: z.string().optional(),
  antibiotico01: z.string().optional(),
  accionesMed01: z.string().optional(),
  diasTerapiaMed01: z.string().optional(),
  antibiotico02: z.string().optional(),
  accionesMed02: z.string().optional(),
  diasTerapiaMed02: z.string().optional(),
  observaciones: z.string().optional(),
  id: z.string().optional(),
  hospitalName: z.string().optional(),
  createdAt: z.string().optional(),
  // Resistance / microbiology fields
  resultadoCultivo: z.string().optional(),
  tipoMuestra: z.string().optional(),
  organismoAislado: z.string().optional(),
  blee: z.string().optional(),
  carbapenemasa: z.string().optional(),
  mrsa: z.string().optional(),
  sensibilidadVancomicina: z.string().optional(),
  sensibilidadMeropenem: z.string().optional(),
});

export type InterventionSchemaInput = z.input<typeof interventionSchema>;
export type InterventionSchemaOutput = z.output<typeof interventionSchema>;
