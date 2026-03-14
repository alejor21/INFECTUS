import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';
import { getProfile } from '../lib/supabase/auth';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'administrador' | 'infectologo' | 'medico' | 'visor';
  hospital_name: string | null;
  avatar_initials: string | null;
  is_active: boolean;
}

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isInfectologo: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isInfectologo: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) getProfile(session.user.id).then(setProfile);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) getProfile(session.user.id).then(setProfile);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin: profile?.role === 'administrador',
        isInfectologo:
          profile?.role === 'infectologo' || profile?.role === 'administrador',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export const usePermissions = () => {
  const { profile } = useContext(AuthContext);
  const role = profile?.role ?? 'visor';
  return {
    canCreate: role === 'medico' || role === 'administrador' || role === 'infectologo',
    canEdit: role === 'medico' || role === 'administrador' || role === 'infectologo',
    canDelete: role === 'medico' || role === 'administrador' || role === 'infectologo',
    canExport: true,
    canViewReports: true,
    isAdmin: role === 'administrador',
    isMedico: role === 'medico',
    isInfectologo: role === 'infectologo',
    isVisor: role === 'visor',
  };
};
