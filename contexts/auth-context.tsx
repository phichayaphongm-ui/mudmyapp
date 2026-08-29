'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getUserProfile, createUserProfile, updateUserProfile } from '@/lib/services/users';
import type { User as AppUser } from '@/lib/types';
import { mapRowToUser } from '@/lib/utils';


interface AuthContextType {
  user: AppUser | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string, extraData?: Partial<AppUser>) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithLine: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isBanned: () => { banned: boolean, permanent: boolean, until?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAndSetUserProfile = async (uid: string, fallbackData?: Partial<AppUser>) => {
    try {
      if (!uid) {
        console.error('Error fetching user profile: User ID is null or undefined');
        setUser(null);
        return;
      }

      let profile = await getUserProfile(uid);
      if (!profile && fallbackData) {
        profile = await createUserProfile(uid, {
          name: fallbackData.name || 'User',
          email: fallbackData.email || '',
          avatar: fallbackData.avatar,
          userType: fallbackData.userType || 'personal',
        });
      }
      setUser(profile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
      setUser(null);
    }
  };

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        fetchAndSetUserProfile(session.user.id, {
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
          email: session.user.email || '',
          avatar: session.user.user_metadata?.avatar_url,
        }).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // 2. Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (session?.user) {
        await fetchAndSetUserProfile(session.user.id, {
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
          email: session.user.email || '',
          avatar: session.user.user_metadata?.avatar_url,
          userType: 'personal',
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // 3. Subscribe to real-time profile changes
    let profileChannel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      profileChannel = supabase
        .channel(`profile:${user.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        }, (payload) => {
          setUser(mapRowToUser(payload.new));
        })
        .subscribe();
    });

    return () => {
      subscription.unsubscribe();
      if (profileChannel) supabase.removeChannel(profileChannel);
    };
  }, []); // intentionally run only once on mount

  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string, extraData?: Partial<AppUser>) => {
    setError(null);
    const userType = extraData?.userType || 'personal';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Stored in auth.users metadata — the handle_new_user DB trigger reads these fields
        data: {
          full_name: name,
          name,
          user_type: userType,
          business_name: extraData?.businessName,
          business_tax_id: extraData?.businessTaxId,
          business_phone: extraData?.businessPhone,
        },
      },
    });
    if (error) {
      setError(error);
      throw error;
    }
    if (data.user) {
      // Profile is auto-created by DB trigger; upsert/update only when we have an active session (RLS)
      if (data.session) {
        const profileData = {
          name,
          email,
          userType,
          businessName: extraData?.businessName,
          businessTaxId: extraData?.businessTaxId,
          businessPhone: extraData?.businessPhone,
        };
        const existing = await getUserProfile(data.user.id);
        if (existing) {
          await updateUserProfile(data.user.id, profileData);
        } else {
          await createUserProfile(data.user.id, profileData);
        }
        await fetchAndSetUserProfile(data.user.id);
      }
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setError(error);
      throw error;
    }
  };

  const signInWithFacebook = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setError(error);
      throw error;
    }
  };

  // LINE login via Custom OIDC (requires 'line' provider configured in Supabase Auth > Providers > Add new provider > OIDC)
  const signInWithLine = async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'line' as any, // LINE must be configured as Custom OIDC provider in Supabase Dashboard
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (err: any) {
      console.warn('LINE login error:', err.message);
      setError(new Error('LINE Login ไม่พร้อมใช้งาน — กรุณาตั้งค่า LINE Custom OIDC ใน Supabase Dashboard → Authentication → Providers'));
      throw err;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSupabaseUser(null);
      setSession(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err instanceof Error ? err : new Error('Sign out failed'));
      throw err;
    }
  };

  const refreshProfile = async () => {
    try {
      const uid = supabaseUser?.id || session?.user?.id || user?.id;
      if (uid) {
        await fetchAndSetUserProfile(uid);
      } else {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          await fetchAndSetUserProfile(currentUser.id);
        }
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  const isBanned = () => {
    if (!user) return { banned: false, permanent: false };
    if (user.isPermanentlyBanned) return { banned: true, permanent: true };
    if (user.bannedUntil) {
      const until = new Date(user.bannedUntil);
      if (until > new Date()) {
        return { banned: true, permanent: false, until: user.bannedUntil };
      }
    }
    return { banned: false, permanent: false };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        loading,
        error,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithFacebook,
        signInWithLine,
        signOut,
        refreshProfile,
        isBanned,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
