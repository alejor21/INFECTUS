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

export interface HospitalUploadStatus {
  months_found: string[];
  total_rows: number;
  uploaded_at: string;
}

interface HospitalExcelUploadRow {
  hospital_id: string;
  periodo: string | null;
  mes: number | null;
  anio: number | null;
  total_filas: number | null;
  created_at: string;
}

function formatUploadPeriod(periodo: string | null, mes: number | null, anio: number | null): string | null {
  if (periodo) {
    return periodo;
  }

  if (mes === null || anio === null) {
    return null;
  }

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const monthLabel = monthNames[mes - 1];
  return monthLabel ? `${monthLabel} ${anio}` : String(anio);
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

export const updateHospitalWithReferences = async (
  hospital: Hospital,
  updates: Partial<Hospital>,
) => {
  const supabase = getSupabaseClient();
  const nextName = updates.name?.trim() ?? hospital.name;

  const { data, error } = await supabase
    .from('hospitals')
    .update(updates)
    .eq('id', hospital.id)
    .select('*')
    .single();

  if (error) {
    return { data: null, error };
  }

  if (nextName !== hospital.name) {
    const [profilesUpdate, interventionsUpdate] = await Promise.all([
      supabase
        .from('profiles')
        .update({ hospital_name: nextName })
        .eq('hospital_name', hospital.name),
      supabase
        .from('interventions')
        .update({ hospital_name: nextName })
        .eq('hospital_name', hospital.name),
    ]);

    if (profilesUpdate.error || interventionsUpdate.error) {
      return {
        data: data as Hospital,
        error: profilesUpdate.error ?? interventionsUpdate.error,
      };
    }
  }

  return { data: data as Hospital, error: null };
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

export const getHospitalUploadStatuses = async (
  hospitalIds: string[],
): Promise<Record<string, HospitalUploadStatus>> => {
  if (hospitalIds.length === 0) return {};

  const { data, error } = await getSupabaseClient()
    .from('hospital_excel_uploads')
    .select('hospital_id, periodo, mes, anio, total_filas, created_at')
    .in('hospital_id', hospitalIds);

  if (error) throw error;

  return ((data ?? []) as HospitalExcelUploadRow[]).reduce<Record<string, HospitalUploadStatus>>((accumulator, item) => {
    const current = accumulator[item.hospital_id];
    const nextPeriod = formatUploadPeriod(item.periodo, item.mes, item.anio);
    const previousPeriods = current?.months_found ?? [];
    const months_found = nextPeriod && !previousPeriods.includes(nextPeriod)
      ? [...previousPeriods, nextPeriod]
      : previousPeriods;

    accumulator[item.hospital_id] = {
      months_found,
      total_rows: (current?.total_rows ?? 0) + (item.total_filas ?? 0),
      uploaded_at: current && current.uploaded_at > item.created_at ? current.uploaded_at : item.created_at,
    };

    return accumulator;
  }, {});
};

export const deleteHospitalFileData = async (
  hospitalId: string,
  fileId: string,
  month: number,
  year: number,
) => {
  const supabase = getSupabaseClient();
  const monthPad = String(month).padStart(2, '0');
  const monthKey = `${year}-${monthPad}`;

  const [legacyDateDelete, isoDateDelete, evaluacionesDelete, fileDelete] = await Promise.all([
    supabase
      .from('interventions')
      .delete()
      .eq('hospital_id', hospitalId)
      .like('fecha', `__/${monthPad}/${year}`),
    supabase
      .from('interventions')
      .delete()
      .eq('hospital_id', hospitalId)
      .like('fecha', `${monthKey}-%`),
    supabase
      .from('evaluaciones')
      .delete()
      .eq('hospital_id', hospitalId)
      .eq('anio', year)
      .eq('mes', month),
    supabase.from('hospital_files').delete().eq('id', fileId),
  ]);

  return {
    error:
      legacyDateDelete.error ??
      isoDateDelete.error ??
      evaluacionesDelete.error ??
      fileDelete.error ??
      null,
  };
};
