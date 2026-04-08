/*
Run this SQL in Supabase SQL Editor:

CREATE TABLE patients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_code varchar NOT NULL,
  full_name varchar,
  age integer,
  gender varchar CHECK (gender IN ('M', 'F', 'otro')),
  admission_date date,
  discharge_date date,
  status varchar NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'mejorado', 'empeorado', 'alta', 'fallecido')),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE treatment_followups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  intervention_date date NOT NULL,
  antibiotic varchar,
  dose varchar,
  route varchar,
  outcome varchar CHECK (outcome IN ('mejorado', 'sin_cambio', 'empeorado', 'alta', 'fallecido')),
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX ON patients (hospital_id);
CREATE INDEX ON treatment_followups (patient_id);
*/

import { getSupabaseClient } from './client';

export interface Patient {
  id: string;
  hospital_id: string;
  patient_code: string;
  full_name: string | null;
  age: number | null;
  gender: 'M' | 'F' | 'otro' | null;
  admission_date: string | null;
  discharge_date: string | null;
  status: 'activo' | 'mejorado' | 'empeorado' | 'alta' | 'fallecido';
  notes: string | null;
  created_at: string;
}

export interface TreatmentFollowup {
  id: string;
  patient_id: string;
  hospital_id: string;
  intervention_date: string;
  antibiotic: string | null;
  dose: string | null;
  route: string | null;
  outcome: 'mejorado' | 'sin_cambio' | 'empeorado' | 'alta' | 'fallecido' | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
}

const PATIENT_SELECT_COLUMNS = [
  'id',
  'hospital_id',
  'patient_code',
  'full_name',
  'age',
  'gender',
  'admission_date',
  'discharge_date',
  'status',
  'notes',
  'created_at',
].join(', ');

const FOLLOWUP_SELECT_COLUMNS = [
  'id',
  'patient_id',
  'hospital_id',
  'intervention_date',
  'antibiotic',
  'dose',
  'route',
  'outcome',
  'notes',
  'recorded_by',
  'created_at',
].join(', ');

export const getPatients = async (hospitalId: string): Promise<Patient[]> => {
  const { data } = await getSupabaseClient()
    .from('patients')
    .select(PATIENT_SELECT_COLUMNS)
    .eq('hospital_id', hospitalId)
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as Patient[];
};

export const getPatient = async (id: string): Promise<Patient | null> => {
  const { data } = await getSupabaseClient()
    .from('patients')
    .select(PATIENT_SELECT_COLUMNS)
    .eq('id', id)
    .single();
  return (data ?? null) as unknown as Patient | null;
};

export const createPatient = async (
  patient: Omit<Patient, 'id' | 'created_at'>,
) => {
  return getSupabaseClient().from('patients').insert(patient).select().single();
};

export const updatePatient = async (id: string, updates: Partial<Patient>) => {
  return getSupabaseClient().from('patients').update(updates).eq('id', id);
};

export const deletePatient = async (id: string) => {
  return getSupabaseClient().from('patients').delete().eq('id', id);
};

export const getFollowups = async (patientId: string): Promise<TreatmentFollowup[]> => {
  const { data } = await getSupabaseClient()
    .from('treatment_followups')
    .select(FOLLOWUP_SELECT_COLUMNS)
    .eq('patient_id', patientId)
    .order('intervention_date', { ascending: false });
  return (data ?? []) as unknown as TreatmentFollowup[];
};

export const createFollowup = async (
  followup: Omit<TreatmentFollowup, 'id' | 'created_at'>,
) => {
  return getSupabaseClient()
    .from('treatment_followups')
    .insert(followup)
    .select()
    .single();
};

export const updateFollowup = async (
  id: string,
  updates: Partial<TreatmentFollowup>,
) => {
  return getSupabaseClient()
    .from('treatment_followups')
    .update(updates)
    .eq('id', id);
};

export const deleteFollowup = async (id: string) => {
  return getSupabaseClient().from('treatment_followups').delete().eq('id', id);
};

/** Returns a map of patient_id → followup count for a given hospital */
export const getFollowupCounts = async (
  hospitalId: string,
): Promise<Record<string, number>> => {
  const { data } = await getSupabaseClient()
    .from('treatment_followups')
    .select('patient_id')
    .eq('hospital_id', hospitalId);

  if (!data) return {};
  return data.reduce<Record<string, number>>((acc, row) => {
    acc[row.patient_id] = (acc[row.patient_id] ?? 0) + 1;
    return acc;
  }, {});
};
