const jwt = require('jsonwebtoken');
require('dotenv').config();
const { supabase, supabaseAdmin  } = require('../config/supabase'); // ✅ import Supabase client

// Authenticate JWT token using Supabase
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: { message: 'Access token required', status: 401 }
      });
    }

    // ✅ Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: { message: 'Invalid or expired token', status: 401 }
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      error: { message: 'Authentication failed', status: 401 }
    });
  }
};

// Require admin role
// const requireAdmin = async (req, res, next) => {
//   try {
//     console.log('Checking admin for user:', req.user?.id);

//     if (!req.user || !req.user.id) {
//       return res.status(401).json({
//         error: { message: 'User not authenticated', status: 401 }
//       });
//     }

//     // ✅ Fetch user role
//     const { data: userRole, error } = await supabase
//       .from('user_roles')
//       .select('role')
//       .eq('user_id', req.user.id)
//       .maybeSingle()

//     console.log('User role check:', { 
//       userId: req.user.id, 
//       role: userRole?.role, 
//       error 
//     });

//     if (error) {
//       console.error('Database error:', error);
//       return res.status(500).json({
//         error: { message: `Database error: ${error.message}`, status: 500 }
//       });
//     }

//     if (!userRole) {
//       return res.status(404).json({
//         error: { message: 'User role not found', status: 404 }
//       });
//     }

//     if (userRole.role !== 'admin') {
//       return res.status(403).json({
//         error: { message: 'Admin access required', status: 403 }
//       });
//     }

//     req.userRole = userRole.role;
//     next();
//   } catch (error) {
//     console.error('requireAdmin error:', error);
//     res.status(500).json({
//       error: { message: `Authorization check failed: ${error.message}`, status: 500 }
//     });
//   }
// };

// const requireAdmin = async (req, res, next) => {
//   try {
//     // Fetch user's roles from user_roles
//     const { data, error } = await supabase
//       .from('users')
//       .select('id, user_roles(role)')
//       .eq('id', req.user.id)
//       .single();

//     if (error) {
//       console.error('Admin check DB error:', error);
//       return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
//     }

//     const roles = data?.user_roles?.map(r => r.role) || [];

//     console.log('User role check:', { userId: req.user.id, roles });

//     if (!roles.includes('admin')) {
//       return res.status(403).json({ error: { message: 'Forbidden', status: 403 } });
//     }

//     req.user.roles = roles; // attach roles for downstream use
//     next();
//   } catch (err) {
//     console.error('Admin check error:', err);
//     res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
//   }
// };

async function requireAdmin(req, res, next) {
  try {
    const userId = req.user.id;

    console.log('Checking admin for user:', userId);

    // Use supabaseAdmin to bypass RLS
    const { data: rolesData, error } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Admin check DB error:', error);
      return res.status(500).json({ error: { message: 'Database error', status: 500 } });
    }

    const roles = rolesData?.map(r => r.role) || [];
    console.log('User role check:', { userId, roles });

    if (!roles.includes('admin')) {
      return res.status(403).json({ error: { message: 'Forbidden', status: 403 } });
    }

    next();
  } catch (err) {
    console.error('Admin check error:', err);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
}

module.exports = {
  authenticateToken,
  requireAdmin
};
