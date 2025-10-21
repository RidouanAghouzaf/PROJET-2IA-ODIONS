// const express = require('express');
// const router = express.Router();
// const { supabase } = require('../config/supabase');
// const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all users (admin only)
// router.get('/', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from('users')
//       .select('*')
//       .order('created_at', { ascending: false });

//     if (error) throw error;

//     res.json({ users: data });
//   } catch (error) {
//     console.error('Get users error:', error);
//     res.status(500).json({ error: { message: 'Failed to get users', status: 500 } });
//   }
// });

// router.get('/', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from('users')
//       .select(`*`)
//       .order('created_at', { ascending: false });

//     if (error) throw error;

//     res.json({ users: data });
//   } catch (error) {
//     console.error('Get users error:', error);
//     res.status(500).json({ error: { message: 'Failed to get users', status: 500 } });
//   }
// });

// // Get user by ID
// router.get('/:id', authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params;

//     const { data: currentUser } = await supabase
//       .from('users')
//       .select('role')
//       .eq('id', req.user.id)
//       .single();

//     if (currentUser.role !== 'admin' && req.user.id !== id) {
//       return res.status(403).json({ error: { message: 'Forbidden', status: 403 } });
//     }

//     const { data, error } = await supabase
//       .from('users')
//       .select('*')
//       .eq('id', id)
//       .single();

//     if (error) return res.status(404).json({ error: { message: 'User not found', status: 404 } });

//     res.json({ user: data });
//   } catch (error) {
//     console.error('Get user error:', error);
//     res.status(500).json({ error: { message: 'Failed to get user', status: 500 } });
//   }
// });

// // Update user
// router.put('/:id', authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { full_name, phone, avatar_url } = req.body;

//     const { data: currentUser } = await supabase
//       .from('users')
//       .select('role')
//       .eq('id', req.user.id)
//       .single();

//     if (currentUser.role !== 'admin' && req.user.id !== id) {
//       return res.status(403).json({ error: { message: 'Forbidden', status: 403 } });
//     }

//     const updateData = {};
//     if (full_name !== undefined) updateData.full_name = full_name;
//     if (phone !== undefined) updateData.phone = phone;
//     if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
//     updateData.updated_at = new Date().toISOString();

//     const { data, error } = await supabase
//       .from('users')
//       .update(updateData)
//       .eq('id', id)
//       .select()
//       .single();

//     if (error) throw error;

//     res.json({ message: 'User updated successfully', user: data });
//   } catch (error) {
//     console.error('Update user error:', error);
//     res.status(500).json({ error: { message: 'Failed to update user', status: 500 } });
//   }
// });

// // Delete user (admin only)
// router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;

//     const { error } = await supabase
//       .from('users')
//       .delete()
//       .eq('id', id);

//     if (error) throw error;

//     res.json({ message: 'User deleted successfully' });
//   } catch (error) {
//     console.error('Delete user error:', error);
//     res.status(500).json({ error: { message: 'Failed to delete user', status: 500 } });
//   }
// });

// module.exports = router;


// const express = require('express');
// const router = express.Router();
// const { supabase } = require('../config/supabase');
// const { authenticateToken, requireAdmin } = require('../middleware/auth');

// // 🟢 Get all users (admin only)
// router.get('/', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from('users')
//       .select(`
//         *,
//         user_roles (
//           role
//         )
//       `)
//       .order('created_at', { ascending: false });

//     if (error) throw error;

//     // Flatten roles into array of strings for simplicity
//     const usersWithRoles = data.map(u => ({
//       ...u,
//       roles: u.user_roles?.map(r => r.role) || []
//     }));

//     res.json({ users: usersWithRoles });
//   } catch (error) {
//     console.error('Get users error:', error);
//     res.status(500).json({ error: { message: 'Failed to get users', status: 500 } });
//   }
// });

// // 🟢 Get user by ID
// router.get('/:id', authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Check requester role
//     const { data: currentUser } = await supabase
//       .from('users')
//       .select('id')
//       .eq('id', req.user.id)
//       .single();

//     // If not admin and not the same user → forbidden
//     if (req.user.role !== 'admin' && req.user.id !== id) {
//       return res.status(403).json({ error: { message: 'Forbidden', status: 403 } });
//     }

//     const { data, error } = await supabase
//       .from('users')
//       .select(`
//         *,
//         user_roles (
//           role
//         )
//       `)
//       .eq('id', id)
//       .single();

//     if (error) throw error;
//     if (!data) return res.status(404).json({ error: { message: 'User not found', status: 404 } });

//     const user = {
//       ...data,
//       roles: data.user_roles?.map(r => r.role) || []
//     };

//     res.json({ user });
//   } catch (error) {
//     console.error('Get user error:', error);
//     res.status(500).json({ error: { message: 'Failed to get user', status: 500 } });
//   }
// });

// // 🟢 Update user
// router.put('/:id', authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { full_name, phone, avatar_url } = req.body;

//     // Check role of current user
//     const { data: currentUser } = await supabase
//       .from('users')
//       .select('id')
//       .eq('id', req.user.id)
//       .single();

//     if (req.user.role !== 'admin' && req.user.id !== id) {
//       return res.status(403).json({ error: { message: 'Forbidden', status: 403 } });
//     }

//     const updateData = {};
//     if (full_name !== undefined) updateData.full_name = full_name;
//     if (phone !== undefined) updateData.phone = phone;
//     if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
//     updateData.updated_at = new Date().toISOString();

//     const { data, error } = await supabase
//       .from('users')
//       .update(updateData)
//       .eq('id', id)
//       .select()
//       .single();

//     if (error) throw error;

//     res.json({ message: 'User updated successfully', user: data });
//   } catch (error) {
//     console.error('Update user error:', error);
//     res.status(500).json({ error: { message: 'Failed to update user', status: 500 } });
//   }
// });

// // 🟢 Delete user (admin only)
// router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;

//     const { error } = await supabase
//       .from('users')
//       .delete()
//       .eq('id', id);

//     if (error) throw error;

//     res.json({ message: 'User deleted successfully' });
//   } catch (error) {
//     console.error('Delete user error:', error);
//     res.status(500).json({ error: { message: 'Failed to delete user', status: 500 } });
//   }
// });

// module.exports = router;

// routes/users.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 🟢 Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        user_roles (
          role
        )
      `)
      .order('created_at', { ascending: false }); // no .single()

    if (error) throw error;

    // Flatten roles into array of strings
    const usersWithRoles = data.map(u => ({
      ...u,
      roles: [...new Set(u.user_roles?.map(r => r.role) || [])]
    }));

    res.json({ users: usersWithRoles });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: { message: 'Failed to get users', status: 500 } });
  }
});

// 🟢 Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: { message: 'Forbidden', status: 403 } });
    }

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        user_roles (
          role
        )
      `)
      .eq('id', id)
      .maybeSingle(); // safe: unique ID

    if (error || !data) {
      return res.status(404).json({ error: { message: 'User not found', status: 404 } });
    }

    const user = {
      ...data,
      roles: data.user_roles?.map(r => r.role) || []
    };

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: { message: 'Failed to get user', status: 500 } });
  }
});

// 🟢 Create a new user (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { full_name, email, phone, roles = [] } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ error: { message: 'Full name and email are required', status: 400 } });
    }

    // Insert user into 'users' table
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ full_name, email, phone }])
      .select('*')
      .single(); // Return the created user

    if (insertError) throw insertError;

    // Assign roles if provided
    if (roles.length > 0) {
      const roleInserts = roles.map(role => ({
        user_id: newUser.id,
        role
      }));
      const { error: roleError } = await supabase.from('user_roles').insert(roleInserts);
      if (roleError) throw roleError;
    }

    // Fetch the user with roles flattened
    const { data: userWithRoles } = await supabase
      .from('users')
      .select(`
        *,
        user_roles ( role )
      `)
      .eq('id', newUser.id)
      .single();

    const formattedUser = {
      ...userWithRoles,
      roles: userWithRoles.user_roles?.map(r => r.role) || []
    };

    res.status(201).json(formattedUser);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: { message: 'Failed to create user', status: 500 } });
  }
});

// 🟢 Update user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, avatar_url } = req.body;

    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: { message: 'Forbidden', status: 403 } });
    }

    const updateData = { updated_at: new Date().toISOString() };
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle(); // safe

    if (error) throw error;

    res.json({ message: 'User updated successfully', user: data });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: { message: 'Failed to update user', status: 500 } });
  }
});

// 🟢 Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: { message: 'Failed to delete user', status: 500 } });
  }
});

module.exports = router;
