const { supabase } = require("../config/supabase");

async function count(campaignId, statuses) {
  let q = supabase.from("campaign_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId);
  if (statuses) q = q.in("status", statuses);
  const { count: n, error } = await q;
  if (error) throw error;
  return n || 0;
}

async function buildReport(campaignId) {
  const [sent, delivered, read, failed, total] = await Promise.all([
    count(campaignId, ["sent", "delivered", "read"]), // accepted by Meta
    count(campaignId, ["delivered", "read"]),
    count(campaignId, ["read"]),
    count(campaignId, ["failed"]),
    count(campaignId),
  ]);
  return { sent, delivered, read, failed, total };
}

// Webhooks arrive in bursts: refresh each campaign's report at most once per few seconds
const timers = new Map();
function scheduleReportRefresh(campaignId, delayMs = 3000) {
  if (timers.has(campaignId)) return;
  timers.set(campaignId, setTimeout(async () => {
    timers.delete(campaignId);
    try {
      const report = await buildReport(campaignId);
      const { error } = await supabase.from("campaigns").update({ report }).eq("id", campaignId);
      if (error) console.error("[REPORT] update failed", error.message);
    } catch (e) { console.error("[REPORT] refresh failed", e.message); }
  }, delayMs));
}

module.exports = { buildReport, scheduleReportRefresh };