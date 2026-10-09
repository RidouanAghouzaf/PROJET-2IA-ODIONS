const { supabase } = require("../config/supabase");

module.exports = async function requireAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ success: false, error: { message: "Authentication required" } });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ success: false, error: { message: "Invalid or expired session" } });
    req.user = data.user;
    req.tenantId = data.user.id; // ⚠ must equal what the frontend stores in campaigns.user_id
    next();
  } catch (e) {
    console.error("[AUTH]", e.message);
    res.status(401).json({ success: false, error: { message: "Authentication failed" } });
  }
};