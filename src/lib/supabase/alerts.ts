import { getSupabaseClient } from './client';

export interface Alert {
  id: string;
  hospital_id: string | null;
  hospital_name: string;
  type: string;
  severity: 'alta' | 'media' | 'baja';
  title: string;
  message: string;
  metric_value: number | null;
  threshold_value: number | null;
  is_read: boolean;
  created_at: string;
}

export const getAlerts = async (hospitalId?: string): Promise<Alert[]> => {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });
  if (hospitalId) query = query.eq('hospital_id', hospitalId);
  const { data } = await query;
  return data ?? [];
};

export const markAlertRead = async (id: string) => {
  return getSupabaseClient().from('alerts').update({ is_read: true }).eq('id', id);
};

export const markAllAlertsRead = async (hospitalId?: string) => {
  const supabase = getSupabaseClient();
  let query = supabase.from('alerts').update({ is_read: true }).eq('is_read', false);
  if (hospitalId) query = query.eq('hospital_id', hospitalId);
  return query;
};

export const deleteAlert = async (id: string) => {
  return getSupabaseClient().from('alerts').delete().eq('id', id);
};

export const saveAlert = async (alert: Omit<Alert, 'id' | 'created_at'>) => {
  return getSupabaseClient().from('alerts').insert(alert);
};
