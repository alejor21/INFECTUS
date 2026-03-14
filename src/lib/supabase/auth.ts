import { getSupabaseClient } from './client';

export const signIn = (email: string, password: string) =>
  getSupabaseClient().auth.signInWithPassword({ email, password });

export const signUp = async (email: string, password: string, fullName: string, role: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) throw error
  if (!data.user) throw new Error('No se pudo crear el usuario')

  const initials = fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    full_name: fullName,
    email: email,
    role: role,
    avatar_initials: initials,
    is_active: true
  })

  if (profileError) throw new Error('Error creando perfil: ' + profileError.message)

  return data
}

export const signOut = () => getSupabaseClient().auth.signOut();

export const getProfile = async (userId: string) => {
  const { data } = await getSupabaseClient()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
};

export const getAllProfiles = async () => {
  const { data } = await getSupabaseClient()
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
};

export const updateProfile = async (
  userId: string,
  updates: {
    full_name?: string;
    role?: string;
    hospital_name?: string;
    is_active?: boolean;
  },
) => {
  return getSupabaseClient().from('profiles').update(updates).eq('id', userId);
};
