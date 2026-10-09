const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateToken, attachRoles } = require('../middleware/auth');

// ─── POST /auth/signup ────────────────────────────────────────────────────────
// Creates a new user. Role is always 'tenant_admin' on self-signup.
// Super admins are assigned manually via /auth/assign-role.
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, tenantId } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        error: { message: 'Email, password, and full name are required', status: 400 }
      });
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });

    if (authError) {
      return res.status(400).json({ error: { message: authError.message, status: 400 } });
    }

    const userId = authData.user.id;

    // Upsert user profile
    await supabaseAdmin.from('users').upsert([{
      id: userId,
      email: authData.user.email,
      full_name: fullName,
      created_at: new Date().toISOString()
    }], { onConflict: 'id' });

    // Assign default role: tenant_admin (they manage their own store)
    await supabaseAdmin.from('user_roles').insert([{
      user_id: userId,
      role: 'tenant_admin',
      tenant_id: tenantId || null
    }]);

    res.status(201).json({
      message: 'User created successfully',
      user: { id: userId, email: authData.user.email, full_name: fullName },
      roles: ['tenant_admin'],
      session: authData.session
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: { message: 'Signup failed', status: 500 } });
  }
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: { message: 'Email and password are required', status: 400 }
      });
    }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('❌ LOGIN ERROR:', error.message);
      return res.status(401).json({ error: { message: error.message, status: 401 } });
    }

    const userId    = data.user.id;
    const userEmail = data.user.email;
    const fullName  = data.user.user_metadata?.full_name || '';

    // Sync user profile
    await supabaseAdmin.from('users').upsert([{
      id: userId,
      email: userEmail,
      full_name: fullName,
      created_at: new Date().toISOString()
    }], { onConflict: 'id' });

    // Fetch roles (with tenant info)
    const { data: rolesData, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role, tenant_id')
      .eq('user_id', userId);

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }

    // Assign default role if none exists
    if (!rolesData || rolesData.length === 0) {
      await supabaseAdmin.from('user_roles').insert([{
        user_id: userId,
        role: 'tenant_admin',
        tenant_id: null
      }]);
    }

    const roles    = rolesData?.map(r => r.role) || ['tenant_admin'];
    const tenantId = rolesData?.[0]?.tenant_id || null;

    res.status(200).json({
      message: 'Login successful',
      user: {
        ...data.user,
        full_name: fullName,
        roles,
        tenant_id: tenantId
      },
      session: data.session
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: { message: 'Login failed', status: 500 } });
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
router.get('/me', authenticateToken, attachRoles, async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: { message: 'User not found', status: 404 } });
    }

    res.json({
      user: {
        ...profile,
        roles: req.user.roles,
        tenant_id: req.user.tenant_id
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: { message: 'Failed to get user', status: 500 } });
  }
});

// ─── POST /auth/signout ───────────────────────────────────────────────────────
router.post('/signout', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return res.status(400).json({ error: { message: error.message, status: 400 } });
    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    res.status(500).json({ error: { message: 'Signout failed', status: 500 } });
  }
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ error: { message: 'Refresh token required', status: 400 } });
    }
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error) return res.status(401).json({ error: { message: error.message, status: 401 } });
    res.json({ message: 'Token refreshed', session: data.session });
  } catch (error) {
    res.status(500).json({ error: { message: 'Token refresh failed', status: 500 } });
  }
});

// ─── POST /auth/reset-password ────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: { message: 'Email required', status: 400 } });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CLIENT_URL}/reset-password`
    });
    if (error) return res.status(400).json({ error: { message: error.message, status: 400 } });
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ error: { message: 'Password reset failed', status: 500 } });
  }
});

// ─── POST /auth/update-password ───────────────────────────────────────────────
router.post('/update-password', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: { message: 'New password required', status: 400 } });
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return res.status(400).json({ error: { message: error.message, status: 400 } });
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: { message: 'Password update failed', status: 500 } });
  }
});

// ─── POST /auth/assign-role  (super_admin only) ───────────────────────────────
// Body: { userId, role: 'super_admin'|'tenant_admin'|'tenant_user', tenantId? }
router.post('/assign-role',
  authenticateToken,
  attachRoles,
  async (req, res) => {
    try {
      const { roles } = req.user;
      if (!roles.includes('super_admin')) {
        return res.status(403).json({ error: { message: 'Super admin only', status: 403 } });
      }

      const { userId, role, tenantId } = req.body;
      const VALID_ROLES = ['super_admin', 'tenant_admin', 'tenant_user'];

      if (!userId || !VALID_ROLES.includes(role)) {
        return res.status(400).json({
          error: { message: `userId and role (${VALID_ROLES.join('|')}) required`, status: 400 }
        });
      }

      // Remove existing roles for this user, then insert new one
      await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
      const { error } = await supabaseAdmin.from('user_roles').insert([{
        user_id: userId,
        role,
        tenant_id: tenantId || null
      }]);

      if (error) throw error;

      res.json({ message: `Role '${role}' assigned to user ${userId}` });
    } catch (error) {
      console.error('Assign role error:', error);
      res.status(500).json({ error: { message: 'Failed to assign role', status: 500 } });
    }
  }
);

module.exports = router;