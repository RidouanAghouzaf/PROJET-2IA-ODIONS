const { supabase, supabaseAdmin } = require('../config/supabase');

// ─── Authenticate JWT (unchanged logic, keep as-is) ─────────────────────────
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: { message: 'Access token required', status: 401 } });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: { message: 'Invalid or expired token', status: 401 } });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: { message: 'Authentication failed', status: 401 } });
  }
};

// ─── Shared helper: fetch roles for current user ─────────────────────────────
const getUserRoles = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select('role, tenant_id')
    .eq('user_id', userId);

  if (error) throw new Error(`DB error fetching roles: ${error.message}`);
  return data || [];
};

// ─── Attach roles to req.user (use BEFORE any role check) ───────────────────
// Usage: router.get('/...', authenticateToken, attachRoles, requireRole(...))
const attachRoles = async (req, res, next) => {
  try {
    const rolesData = await getUserRoles(req.user.id);
    req.user.roles     = rolesData.map(r => r.role);
    req.user.tenant_id = rolesData[0]?.tenant_id || null; // primary tenant
    next();
  } catch (err) {
    console.error('attachRoles error:', err);
    res.status(500).json({ error: { message: 'Failed to load user roles', status: 500 } });
  }
};

// ─── Generic role guard factory ──────────────────────────────────────────────
// Usage: requireRole('super_admin')
//        requireRole('tenant_admin', 'super_admin')   // allow either
const requireRole = (...allowedRoles) => async (req, res, next) => {
  try {
    // attachRoles may have already populated this; if not, fetch now
    if (!req.user.roles) {
      const rolesData = await getUserRoles(req.user.id);
      req.user.roles     = rolesData.map(r => r.role);
      req.user.tenant_id = rolesData[0]?.tenant_id || null;
    }

    const hasRole = req.user.roles.some(r => allowedRoles.includes(r));

    if (!hasRole) {
      return res.status(403).json({
        error: {
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
          status: 403
        }
      });
    }

    next();
  } catch (err) {
    console.error('requireRole error:', err);
    res.status(500).json({ error: { message: 'Authorization check failed', status: 500 } });
  }
};

// ─── Convenience guards (pre-composed) ──────────────────────────────────────
// Super admin only
const requireSuperAdmin = requireRole('super_admin');

// Tenant admin or super admin (super admin can manage any tenant)
const requireTenantAdmin = requireRole('tenant_admin', 'super_admin');

// Any authenticated tenant member (admin or user)
const requireTenantMember = requireRole('tenant_admin', 'tenant_user', 'super_admin');

// ─── Tenant isolation guard ───────────────────────────────────────────────────
// Ensures tenant_admin/tenant_user can only access their own tenant's data.
// Super admin bypasses this check.
// Usage: router.get('/:tenantId/...', authenticateToken, attachRoles, requireTenantAccess)
const requireTenantAccess = (req, res, next) => {
  const { roles, tenant_id } = req.user;

  // Super admin can access any tenant
  if (roles.includes('super_admin')) return next();

  const requestedTenantId = req.params.tenantId || req.body.tenant_id;

  if (!requestedTenantId) {
    return res.status(400).json({ error: { message: 'tenant_id is required', status: 400 } });
  }

  if (String(tenant_id) !== String(requestedTenantId)) {
    return res.status(403).json({
      error: { message: 'Access denied: wrong tenant', status: 403 }
    });
  }

  next();
};

// Keep legacy requireAdmin for backward compatibility
const requireAdmin = requireRole('super_admin');

module.exports = {
  authenticateToken,
  attachRoles,
  requireRole,
  requireSuperAdmin,
  requireTenantAdmin,
  requireTenantMember,
  requireTenantAccess,
  requireAdmin, // legacy alias
};