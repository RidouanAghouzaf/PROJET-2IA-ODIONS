import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase'; // your Supabase client
import { Session } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OdionsRole = 'super_admin' | 'tenant_admin' | 'tenant_user';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  roles: OdionsRole[];
  tenant_id: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;

  // Auth actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, tenantId?: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Role helpers
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
  isTenantUser: boolean;
  hasRole: (...roles: OdionsRole[]) => boolean;
  canManageTenant: (tenantId: string) => boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch full user profile (with roles) from our backend
  const fetchUserProfile = async (accessToken: string): Promise<AuthUser | null> => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) return null;
      const { user: profile } = await res.json();
      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        roles: profile.roles || [],
        tenant_id: profile.tenant_id || null
      };
    } catch {
      return null;
    }
  };

  // Initialise session on mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.access_token) {
        const profile = await fetchUserProfile(session.access_token);
        setUser(profile);
      }
      setIsLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.access_token) {
          const profile = await fetchUserProfile(session.access_token);
          setUser(profile);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ─── Auth actions ──────────────────────────────────────────────────────────

  const signIn = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Login failed');

    // Supabase session is already set via onAuthStateChange,
    // but we also set user immediately from the login response
    setSession(data.session);
    setUser({
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.full_name || '',
      roles: data.user.roles || [],
      tenant_id: data.user.tenant_id || null
    });
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    tenantId?: string
  ) => {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, tenantId })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Signup failed');

    setSession(data.session);
    setUser({
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.full_name || fullName,
      roles: data.roles || ['tenant_admin'],
      tenant_id: tenantId || null
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  // ─── Role helpers ──────────────────────────────────────────────────────────

  const isSuperAdmin  = user?.roles.includes('super_admin') ?? false;
  const isTenantAdmin = user?.roles.includes('tenant_admin') ?? false;
  const isTenantUser  = user?.roles.includes('tenant_user') ?? false;

  // True if user has ANY of the given roles
  const hasRole = (...roles: OdionsRole[]) =>
    (user?.roles ?? []).some(r => roles.includes(r));

  // Super admin can manage any tenant; others only their own
  const canManageTenant = (tenantId: string) =>
    isSuperAdmin || user?.tenant_id === tenantId;

  return (
    <AuthContext.Provider value={{
      user, session, isLoading,
      signIn, signUp, signOut,
      isSuperAdmin, isTenantAdmin, isTenantUser,
      hasRole, canManageTenant
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}