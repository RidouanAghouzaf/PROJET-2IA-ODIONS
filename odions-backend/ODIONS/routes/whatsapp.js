const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { supabase } = require("../config/supabase");
const { sendWhatsAppMessage } = require("../services/whatsappService");
const { scheduleReportRefresh } = require("../services/campaignReport");

const RANK = { pending: 0, sent: 1, delivered: 2, read: 3 };

// Meta verification handshake
router.get("/webhook", (req, res) => {
  if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === process.env.VERIFY_TOKEN) {
    console.log("✅ Webhook WhatsApp vérifié");
    return res.status(200).send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

// Only enforced once WHATSAPP_APP_SECRET is set. Requires in server.js:
//   app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));
function signatureOk(req) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true;
  if (!req.rawBody) {
    console.error("[WEBHOOK] WHATSAPP_APP_SECRET is set but req.rawBody is missing: add the verify hook in server.js");
    return false;
  }
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(req.rawBody).digest("hex");
  const got = req.get("x-hub-signature-256") || "";
  return got.length === expected.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

router.post("/webhook", async (req, res) => {
  if (!signatureOk(req)) return res.sendStatus(401);
  res.sendStatus(200); // acknowledge first: Meta retries on slow or non-200 responses

  for (const entry of req.body?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value;
      if (!value) continue;
      for (const s of value.statuses ?? []) {
        try { await handleStatus(s); } catch (e) { console.error("[WEBHOOK] status error", e.message); }
      }
      for (const m of value.messages ?? []) {
        try { await handleInboundMessage(m); } catch (e) { console.error("[WEBHOOK] message error", e.message); }
      }
      for (const e of value.errors ?? []) console.error("[WEBHOOK] error event", e);
    }
  }
});

// Delivery tracking: maps Meta's message id back to the campaign recipient
async function handleStatus(s) {
  const { data: row, error } = await supabase.from("campaign_recipients")
    .select("id,status,campaign_id").eq("wa_message_id", s.id).maybeSingle();
  if (error) return console.error("[WEBHOOK] lookup failed", error.message);
  if (!row) return; // not a campaign message (or the wamid isn't saved yet)

  const ts = s.timestamp ? new Date(Number(s.timestamp) * 1000).toISOString() : new Date().toISOString();
  const patch = {};
  if (s.status === "failed") {
    if ((RANK[row.status] ?? 0) >= RANK.delivered) return;
    const er = s.errors?.[0] || {};
    Object.assign(patch, { status: "failed", error_code: String(er.code ?? ""), error_message: er.title || er.message || "Delivery failed" });
  } else if ((RANK[s.status] ?? -1) > (RANK[row.status] ?? -1)) { // events can arrive out of order
    patch.status = s.status;
    if (s.status === "delivered") patch.delivered_at = ts;
    if (s.status === "read") { patch.read_at = ts; patch.delivered_at = ts; }
  }
  if (!Object.keys(patch).length) return;

  const { error: upErr } = await supabase.from("campaign_recipients").update(patch).eq("id", row.id);
  if (upErr) return console.error("[WEBHOOK] update failed", upErr.message);
  console.log("[WEBHOOK] status", { wamid: s.id, status: s.status, campaignId: row.campaign_id });
  scheduleReportRefresh(row.campaign_id); // keeps campaigns.report (what the UI reads) current
}

const reply = async (to, body) => {
  const r = await sendWhatsAppMessage(to, body, { forceText: true }); // in-window reply: plain text, never a template
  if (!r.success) console.error("[WEBHOOK] reply failed", r.code, r.error);
};

// Your existing chatbot logic, now guarded (non-text messages no longer crash it)
async function handleInboundMessage(m) {
  if (m.type !== "text") return;
  const from = m.from;
  const text = m.text?.body?.trim().toLowerCase();
  if (!from || !text) return;
  console.log(`💬 Message reçu de ${from}`);

  const { data: chatbots, error } = await supabase.from("chatbots").select("*").eq("is_active", true);
  if (error) throw error;

  const bot = (chatbots || []).find((b) => b.channels?.whatsapp === true);
  if (!bot) return reply(from, "Aucun chatbot WhatsApp n’est actuellement actif.");

  const matched = (bot.scenarios || []).find((s) => s.question?.trim() && text.includes(s.question.toLowerCase()));
  await reply(from, matched ? matched.answer : (bot.welcome_message || "Je n’ai pas compris, pouvez-vous reformuler ?"));
}

// POST /send removed: it was an unauthenticated open relay and your React code never calls it.
module.exports = router;