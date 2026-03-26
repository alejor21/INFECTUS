import { getSupabaseClient } from './client';

type ProfileRole = 'administrador' | 'infectologo' | 'medico' | 'visor';

export const signIn = (email: string, password: string) =>
  getSupabaseClient().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

export const signUp = async (
  email: string,
  password: string,
  fullName: string,
  role: ProfileRole,
) => {
  const supabase = getSupabaseClient();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = fullName.trim();

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: normalizedName,
        role,
      },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('No se pudo crear el usuario.');

  const initials = normalizedName
    .split(/\s+/)
    .map((namePart) => namePart[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: data.user.id,
      full_name: normalizedName,
      email: normalizedEmail,
      role,
      avatar_initials: initials,
      is_active: true,
    },
    { onConflict: 'id' },
  );

  if (profileError) {
    throw new Error(`Error creando perfil: ${profileError.message}`);
  }

  return data;
};

export const sendPasswordReset = (email: string, redirectTo: string) =>
  getSupabaseClient().auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });

export const updatePassword = (password: string) =>
  getSupabaseClient().auth.updateUser({ password });

export const signOut = () => getSupabaseClient().auth.signOut();

export const getProfile = async (userId: string) => {
  const { data } = await getSupabaseClient().from('profiles').select('*').eq('id', userId).single();
  return data;
};

export const getAllProfiles = async () => {
  const { data } = await getSupabaseClient().from('profiles').select('*').order('created_at', { ascending: false });
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
