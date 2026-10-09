import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, OdionsRole } from '@/context/AuthContext';
import { ReactNode } from 'react';

// ─── Generic guard ────────────────────────────────────────────────────────────
// Wraps any route that needs one or more roles.
// Redirects unauthenticated users to /login, unauthorised to /unauthorized.

interface RoleGuardProps {
  children: ReactNode;
  roles: OdionsRole[];             // at least ONE of these roles must match
  redirectTo?: string;             // override redirect target
}

export function RoleGuard({ children, roles, redirectTo }: RoleGuardProps) {
  const { user, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasRole(...roles)) {
    return <Navigate to={redirectTo ?? '/unauthorized'} replace />;
  }

  return <>{children}</>;
}

// ─── Pre-composed guards (use directly in your router) ────────────────────────

/** Only super_admin can enter */
export function SuperAdminGuard({ children }: { children: ReactNode }) {
  return <RoleGuard roles={['super_admin']}>{children}</RoleGuard>;
}

/** tenant_admin or super_admin can enter */
export function TenantAdminGuard({ children }: { children: ReactNode }) {
  return <RoleGuard roles={['tenant_admin', 'super_admin']}>{children}</RoleGuard>;
}

/** Any authenticated tenant member can enter (admin or user) */
export function TenantMemberGuard({ children }: { children: ReactNode }) {
  return <RoleGuard roles={['tenant_admin', 'tenant_user', 'super_admin']}>{children}</RoleGuard>;
}

/** Any authenticated user (just checks login, not role) */
export function AuthGuard({ children }: { children: ReactNode }) {
  return <RoleGuard roles={['super_admin', 'tenant_admin', 'tenant_user']}>{children}</RoleGuard>;
}