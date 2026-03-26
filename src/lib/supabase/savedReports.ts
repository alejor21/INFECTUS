/**
 * Supabase table: saved_reports
 *
 * CREATE TABLE saved_reports (
 *   id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   hospital_id  uuid REFERENCES hospitals(id) ON DELETE SET NULL,
 *   hospital_name text NOT NULL DEFAULT '',
 *   report_type  text NOT NULL CHECK (report_type IN ('ejecutivo', 'alertas', 'chat')),
 *   title        text NOT NULL DEFAULT '',
 *   content      text NOT NULL DEFAULT '',
 *   date_range   text NOT NULL DEFAULT '',
 *   records_count integer NOT NULL DEFAULT 0,
 *   created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 *   created_at   timestamptz NOT NULL DEFAULT now()
 * );
 */

import { getSupabaseClient } from './client';

export interface SavedReport {
  id: string;
  hospital_id: string | null;
  hospital_name: string;
  report_type: 'ejecutivo' | 'alertas' | 'chat';
  title: string;
  content: string;
  date_range: string;
  records_count: number;
  created_by: string | null;
  created_at: string;
}

export async function getSavedReports(hospitalId?: string): Promise<SavedReport[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('saved_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (hospitalId) {
    query = query.eq('hospital_id', hospitalId);
  }

  const { data, error } = await query;
  if (error) {
    return [];
  }
  return data ?? [];
}

export async function saveReport(
  report: Omit<SavedReport, 'id' | 'created_at'>,
): Promise<SavedReport | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('saved_reports')
    .insert(report)
    .select()
    .single();

  if (error) {
    return null;
  }
  return data;
}

export async function deleteReport(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.from('saved_reports').delete().eq('id', id);
}
