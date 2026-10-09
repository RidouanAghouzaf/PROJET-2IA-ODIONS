import { ReactNode } from 'react';
import { useAuth, OdionsRole } from '@/context/AuthContext';

// ─── CanAccess ────────────────────────────────────────────────────────────────
// Renders children only if the current user has at least one of the given roles.
// Use this inside components to show/hide buttons, menu items, sections, etc.
//
// Usage:
//   <CanAccess roles={['super_admin']}>
//     <DeleteTenantButton />
//   </CanAccess>
//
//   <CanAccess roles={['tenant_admin', 'super_admin']} fallback={<ReadOnlyBadge />}>
//     <EditAudienceButton />
//   </CanAccess>

interface CanAccessProps {
  roles: OdionsRole[];
  children: ReactNode;
  fallback?: ReactNode;   // optional element to render when access is denied
}

export function CanAccess({ roles, children, fallback = null }: CanAccessProps) {
  const { hasRole } = useAuth();
  return hasRole(...roles) ? <>{children}</> : <>{fallback}</>;
}

// ─── Shorthand components (avoids repeating role arrays everywhere) ────────────

export function SuperAdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <CanAccess roles={['super_admin']} fallback={fallback}>{children}</CanAccess>;
}

export function TenantAdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <CanAccess roles={['tenant_admin', 'super_admin']} fallback={fallback}>{children}</CanAccess>;
}

export function TenantMemberOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <CanAccess roles={['tenant_admin', 'tenant_user', 'super_admin']} fallback={fallback}>
      {children}
    </CanAccess>
  );
}