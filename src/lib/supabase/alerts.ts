import { getSupabaseClient } from './client';

const ALERT_SELECT_COLUMNS = [
  'id',
  'hospital_id',
  'hospital_name',
  'type',
  'severity',
  'title',
  'message',
  'metric_value',
  'threshold_value',
  'is_read',
  'created_at',
].join(', ');

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
    .select(ALERT_SELECT_COLUMNS)
    .order('created_at', { ascending: false });

  if (hospitalId) {
    query = query.eq('hospital_id', hospitalId);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as Alert[];
};

export const getUnreadAlertCount = async (
  hospitalId?: string,
): Promise<number> => {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('alerts')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false);

  if (hospitalId) {
    query = query.eq('hospital_id', hospitalId);
  }

  const { count, error } = await query;
  if (error) {
    throw error;
  }

  return count ?? 0;
};

export const markAlertRead = async (id: string): Promise<void> => {
  const { error } = await getSupabaseClient()
    .from('alerts')
    .update({ is_read: true })
    .eq('id', id);

  if (error) {
    throw error;
  }
};

export const markAllAlertsRead = async (hospitalId?: string): Promise<void> => {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('alerts')
    .update({ is_read: true })
    .eq('is_read', false);

  if (hospitalId) {
    query = query.eq('hospital_id', hospitalId);
  }

  const { error } = await query;
  if (error) {
    throw error;
  }
};

export const deleteAlert = async (id: string): Promise<void> => {
  const { error } = await getSupabaseClient()
    .from('alerts')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
};

export const saveAlert = async (
  alert: Omit<Alert, 'id' | 'created_at'>,
): Promise<void> => {
  const { error } = await getSupabaseClient().from('alerts').insert(alert);

  if (error) {
    throw error;
  }
};
