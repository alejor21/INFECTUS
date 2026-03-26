import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
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
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isInfectologo: boolean;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isInfectologo: false,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const sessionUser = getSupabaseClient().auth.getUser
      ? (await getSupabaseClient().auth.getUser()).data.user
      : user;

    if (!sessionUser) {
      setProfile(null);
      return;
    }

    const profileData = await getProfile(sessionUser.id);
    setProfile(profileData);
  };

  useEffect(() => {
    const supabase = getSupabaseClient();
    let isMounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id).then((profileData) => {
          if (isMounted) setProfile(profileData);
        });
      }
      setLoading(false);
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id).then((profileData) => {
          if (isMounted) setProfile(profileData);
        });
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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
        refreshProfile,
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
