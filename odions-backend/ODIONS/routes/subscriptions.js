const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");
const { authenticateToken } = require("../middleware/auth");

/**
 * GET current subscription (merchant)
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;

    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        id,
        status,
        started_at,
        expires_at,
        subscription_plans (
          id,
          name,
          price,
          features
        )
      `)
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .single();

    if (error && error.code !== "PGRST116") throw error;

    res.json({
      subscription: data || {
        subscription_plans: { name: "Free", price: 0, features: [] }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load subscription" });
  }
});

/**
 * POST checkout (mock payment gateway)
 */
router.post("/checkout", authenticateToken, async (req, res) => {
  try {
    const { plan_id } = req.body;
    const tenantId = req.user.tenant_id;

    // deactivate old subscription
    await supabase
      .from("subscriptions")
      .update({ status: "inactive" })
      .eq("tenant_id", tenantId);

    // create new subscription
    const { error } = await supabase.from("subscriptions").insert({
      tenant_id: tenantId,
      plan_id,
      status: "active",
      started_at: new Date().toISOString()
    });

    if (error) throw error;

    res.json({
      message: "Subscription updated successfully"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Checkout failed" });
  }
});

module.exports = router;
