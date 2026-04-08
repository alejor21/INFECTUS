import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadActiveProfile = useCallback(async (sessionUser: User | null): Promise<Profile | null> => {
    if (!sessionUser) {
      return null;
    }

    const profileData = await getProfile(sessionUser.id);
    return profileData?.is_active ? profileData : null;
  }, []);

  const clearSession = useCallback(async () => {
    setUser(null);
    setProfile(null);
    await getSupabaseClient().auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    const {
      data: { user: sessionUser },
    } = await getSupabaseClient().auth.getUser();

    if (!sessionUser) {
      setUser(null);
      setProfile(null);
      return;
    }

    const profileData = await loadActiveProfile(sessionUser);
    if (!profileData) {
      await clearSession();
      return;
    }

    setUser(sessionUser);
    setProfile(profileData);
  }, [clearSession, loadActiveProfile]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let isMounted = true;

    const resolveSession = async (sessionUser: User | null) => {
      if (!sessionUser) {
        if (isMounted) {
          setUser(null);
          setProfile(null);
        }
        return;
      }

      const profileData = await loadActiveProfile(sessionUser);
      if (!profileData) {
        await clearSession();
        return;
      }

      if (isMounted) {
        setUser(sessionUser);
        setProfile(profileData);
      }
    };

    void supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        await resolveSession(session?.user ?? null);
      })
      .catch(async () => {
        await clearSession();
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setLoading(true);
      void resolveSession(session?.user ?? null)
        .catch(async () => {
          await clearSession();
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [clearSession, loadActiveProfile]);

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
