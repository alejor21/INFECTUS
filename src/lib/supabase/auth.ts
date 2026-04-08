import { getSupabaseClient } from './client';

type ProfileRole = 'administrador' | 'infectologo' | 'medico' | 'visor';

const PROFILE_SELECT_COLUMNS = [
  'id',
  'full_name',
  'email',
  'role',
  'hospital_name',
  'avatar_initials',
  'is_active',
  'created_at',
].join(', ');

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
  hospitalName?: string | null,
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
      hospital_name: hospitalName ?? null,
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

export const inviteUser = async (
  email: string,
  password: string,
  fullName: string,
  role: ProfileRole,
  hospitalName?: string | null,
) => {
  const supabase = getSupabaseClient();
  const {
    data: { session: previousSession },
  } = await supabase.auth.getSession();

  const result = await signUp(email, password, fullName, role, hospitalName);

  if (previousSession) {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (currentUser?.id !== previousSession.user.id) {
      const { error: restoreError } = await supabase.auth.setSession({
        access_token: previousSession.access_token,
        refresh_token: previousSession.refresh_token,
      });

      if (restoreError) {
        throw new Error('El usuario fue creado, pero no se pudo restaurar la sesión actual.');
      }
    }
  }

  return result;
};

export const sendPasswordReset = (email: string, redirectTo: string) =>
  getSupabaseClient().auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });

export const updatePassword = (password: string) =>
  getSupabaseClient().auth.updateUser({ password });

export const updateCurrentUserMetadata = (data: Record<string, unknown>) =>
  getSupabaseClient().auth.updateUser({ data });

export const signOut = () => getSupabaseClient().auth.signOut();

export const getProfile = async (userId: string) => {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .select(PROFILE_SELECT_COLUMNS)
    .eq('id', userId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }

    throw error;
  }

  return (data ?? null) as unknown as null | {
    id: string;
    full_name: string;
    email: string;
    role: ProfileRole;
    hospital_name: string | null;
    avatar_initials: string | null;
    is_active: boolean;
    created_at: string;
  };
};

export const getAllProfiles = async () => {
  const { data } = await getSupabaseClient()
    .from('profiles')
    .select(PROFILE_SELECT_COLUMNS)
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as Array<{
    id: string;
    full_name: string;
    email: string;
    role: ProfileRole;
    hospital_name: string | null;
    avatar_initials: string | null;
    is_active: boolean;
    created_at: string;
  }>;
};

export const updateProfile = async (
  userId: string,
  updates: {
    full_name?: string;
    role?: string;
    hospital_name?: string;
    avatar_initials?: string;
    is_active?: boolean;
  },
) => {
  return getSupabaseClient().from('profiles').update(updates).eq('id', userId);
};
