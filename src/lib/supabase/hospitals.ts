/*
Run this SQL in Supabase SQL Editor:

CREATE TABLE hospitals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name varchar NOT NULL,
  city varchar NOT NULL,
  department varchar NOT NULL,
  beds integer,
  contact_name varchar,
  contact_email varchar,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE hospital_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  file_name varchar NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  year integer NOT NULL,
  record_count integer DEFAULT 0,
  uploaded_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id)
);
*/

import { getSupabaseClient } from './client';

export interface Hospital {
  id: string;
  name: string;
  city: string;
  department: string;
  beds: number | null;
  contact_name: string | null;
  contact_email: string | null;
  is_active: boolean;
  created_at: string;
}

export interface HospitalFile {
  id: string;
  hospital_id: string;
  file_name: string;
  month: number;
  year: number;
  record_count: number;
  uploaded_at: string;
  uploaded_by: string | null;
}

export const getHospitals = async (): Promise<Hospital[]> => {
  const { data } = await getSupabaseClient().from('hospitals').select('*').order('name');
  return data ?? [];
};

export const createHospital = async (hospital: Omit<Hospital, 'id' | 'created_at'>) => {
  return getSupabaseClient().from('hospitals').insert(hospital).select().single();
};

export const updateHospital = async (id: string, updates: Partial<Hospital>) => {
  return getSupabaseClient().from('hospitals').update(updates).eq('id', id);
};

export const deleteHospital = async (id: string) => {
  return getSupabaseClient().from('hospitals').delete().eq('id', id);
};

export const getHospitalFiles = async (hospitalId: string): Promise<HospitalFile[]> => {
  const { data } = await getSupabaseClient()
    .from('hospital_files')
    .select('*')
    .eq('hospital_id', hospitalId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });
  return data ?? [];
};

export const saveHospitalFile = async (file: Omit<HospitalFile, 'id' | 'uploaded_at'>) => {
  return getSupabaseClient().from('hospital_files').insert(file);
};

export const deleteHospitalFile = async (id: string) => {
  return getSupabaseClient().from('hospital_files').delete().eq('id', id);
};
