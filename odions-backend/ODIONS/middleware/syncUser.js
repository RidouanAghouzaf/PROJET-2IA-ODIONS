const { supabase } = require('../config/supabase');

const syncUser = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user || !user.id) {
      return res.status(401).json({
        error: { message: 'Unauthorized user', status: 401 }
      });
    }

    // 🔍 Check if user exists
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;

    // 🧠 If NOT exists → create
    if (!data) {
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: user.id,
          email: user.email || '',
          created_at: new Date().toISOString()
        }]);

      if (insertError) throw insertError;

      console.log("✅ User auto-created:", user.id);
    }

    next();

  } catch (err) {
    console.error('❌ Sync user error:', err);

    res.status(500).json({
      error: { message: 'User sync failed', status: 500 }
    });
  }
};

module.exports = { syncUser };