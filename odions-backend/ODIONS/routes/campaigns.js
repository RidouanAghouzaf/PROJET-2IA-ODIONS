const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { supabase } = require("../config/supabase");
const { sendWhatsAppMessage, checkWhatsAppConnection, isWhatsAppConfigured } = require("../services/whatsappService");
const { normalizePhoneNumber } = require("../utils/phone");
const requireAuth = require("../middleware/requireAuth");

router.use(requireAuth);

// ⚠ CONFIRM against the SQL in section 3
const AUDIENCE_TENANT_COL = "user_id";
const CONTACTS = { table: "contacts", audience: "audience_id", name: "name", phone: "phone_number" };
const ST = { PENDING: "En attente", RUNNING: "En cours", DONE: "Envoyée", FAILED: "Échouée" };
const CONCURRENCY = 5;
const DELAY_MS = 200;

const fail = (res, http, message, code) => res.status(http).json({ success: false, error: { message, code } });
const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };

async function runPool(items, limit, worker) {
  let i = 0, stop = false;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (!stop && i < items.length) {
      if ((await worker(items[i++])) === "STOP") stop = true;
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  });
  await Promise.all(runners);
}

// Never leave a campaign stuck because an optional column is missing
async function safeUpdate(id, tenantId, patch, fallback = { status: patch.status }) {
  let { error } = await supabase.from("campaigns").update(patch).eq("id", id).eq("user_id", tenantId);
  if (error) {
    console.error(`[CAMPAIGN ${id}] update failed (does the column exist?)`, error.message, Object.keys(patch));
    ({ error } = await supabase.from("campaigns").update(fallback).eq("id", id).eq("user_id", tenantId));
    if (error) console.error(`[CAMPAIGN ${id}] fallback update failed`, error.message);
  }
}
// Recipients come from the `contacts` table, filtered by the audience.
// The route has already verified that the audience belongs to the logged-in account.
async function loadRecipients(audienceId) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(CONTACTS.table)
      .select(`${CONTACTS.name}, ${CONTACTS.phone}`)
      .eq(CONTACTS.audience, audienceId)
      .order(CONTACTS.phone)
      .range(from, from + 999);
    if (error) throw error;
    for (const r of data) out.push({ name: r[CONTACTS.name] || "", phone: r[CONTACTS.phone] });
    if (data.length < 1000) break;
  }
  return out;
}
/* ---------- list / create / delete / stats (tenant-scoped) ---------- */

router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("campaigns")
      .select("*, audiences ( id, name, size )")
      .eq("user_id", req.tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json((data || []).map((c) => ({ ...c, audience_name: c.audiences?.name || "Unknown Audience" })));
  } catch (err) {
    console.error("Get campaigns error:", err);
    fail(res, 500, "Could not load campaigns", "DB_ERROR");
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, audience_id, message, scheduled_date } = req.body || {}; // user_id from the body is ignored
    if (!name || !audience_id || !message) return fail(res, 400, "Name, audience_id, and message are required", "VALIDATION");

    const { data: audience } = await supabase.from("audiences").select("id")
      .eq("id", audience_id).eq(AUDIENCE_TENANT_COL, req.tenantId).maybeSingle();
    if (!audience) return fail(res, 404, "Audience not found", "NOT_FOUND");

    const { data, error } = await supabase.from("campaigns").insert([{
      name, audience_id, message,
      scheduled_date: scheduled_date || new Date().toISOString().split("T")[0],
      status: ST.PENDING,
      user_id: req.tenantId,
      created_at: new Date().toISOString(),
    }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("Create campaign error:", err);
    fail(res, 500, "Could not create campaign", "DB_ERROR");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase.from("campaigns").delete()
      .eq("id", req.params.id).eq("user_id", req.tenantId).neq("status", ST.RUNNING).select("id");
    if (error) throw error;
    if (!data?.length) return fail(res, 404, "Campaign not found (or currently sending)", "NOT_FOUND");
    res.json({ success: true, message: "Campaign deleted successfully" });
  } catch (err) {
    console.error("Delete campaign error:", err);
    fail(res, 500, "Could not delete campaign", "DB_ERROR");
  }
});

router.get("/:id/stats", async (req, res) => {
  const { data, error } = await supabase.from("campaigns").select("report")
    .eq("id", req.params.id).eq("user_id", req.tenantId).maybeSingle();
  if (error || !data) return fail(res, 404, "Campaign not found", "NOT_FOUND");
  res.json({ stats: data.report || {} });
});

// Replaces /test-whatsapp (an open relay): checks token + Phone Number ID against Meta, sends nothing
router.get("/whatsapp-health", async (_req, res) => res.json(await checkWhatsAppConnection()));

/* ---------- SEND ---------- */

router.post("/send/:id", async (req, res) => {
  const campaignId = req.params.id;
  const tenantId = req.tenantId;
  const tag = `[CAMPAIGN ${campaignId}]`;
  console.log(`${tag} send requested`, { tenantId });

  if (!isWhatsAppConfigured()) return fail(res, 503, "WhatsApp is not configured on the server", "CONFIG_MISSING");

  // 1. Atomic claim: only one request can move the campaign to "En cours"
  const { data: campaign, error: claimErr } = await supabase.from("campaigns")
    .update({ status: ST.RUNNING })
    .eq("id", campaignId).eq("user_id", tenantId)
    .in("status", [ST.PENDING, ST.FAILED])
    .select("*").maybeSingle();

  if (claimErr) {
    if (claimErr.code === "22P02") return fail(res, 404, "Campaign not found", "NOT_FOUND");
    console.error(`${tag} claim failed`, claimErr);
    return fail(res, 500, "Could not start the campaign", "DB_ERROR");
  }
  if (!campaign) {
    const { data: existing } = await supabase.from("campaigns").select("status")
      .eq("id", campaignId).eq("user_id", tenantId).maybeSingle();
    if (!existing) return fail(res, 404, "Campaign not found", "NOT_FOUND"); // also covers other tenants
    return fail(res, 409,
      existing.status === ST.RUNNING ? "Campaign is already being sent" : `Campaign already ${existing.status}`,
      "ALREADY_PROCESSED");
  }

  const abort = async (http, message, code) => {
    await safeUpdate(campaignId, tenantId, { status: ST.PENDING }); // nothing was sent: allow a retry
    return fail(res, http, message, code);
  };

  let sent = 0, sendingStarted = false;
  try {
    // 2. Audience, tenant-scoped
    if (!campaign.audience_id) return await abort(400, "Campaign has no audience", "NO_AUDIENCE");
    const { data: audience } = await supabase.from("audiences").select("id")
      .eq("id", campaign.audience_id).eq(AUDIENCE_TENANT_COL, tenantId).maybeSingle();
    if (!audience) return await abort(404, "Audience not found", "NOT_FOUND");

    // 3. Recipients
    const raw = await loadRecipients(audience.id);
    if (!raw.length) return await abort(400, "No contacts found for this audience", "EMPTY_AUDIENCE");

    // 4. Normalize + dedupe
    const seen = new Set(), valid = [], invalid = [];
    for (const r of raw) {
      const phone = normalizePhoneNumber(r.phone);
      if (!phone) { invalid.push(r); continue; }
      if (seen.has(phone)) continue;
      seen.add(phone);
      valid.push({ id: crypto.randomUUID(), name: r.name, phone });
    }
    console.log(`${tag} recipients`, { raw: raw.length, valid: valid.length, invalid: invalid.length, duplicates: raw.length - valid.length - invalid.length });

    const errors = invalid.map((r) => ({ phone: String(r.phone ?? ""), name: r.name, error: "Invalid phone number", code: "INVALID_PHONE" }));
    const rows = [
      ...invalid.map((r) => ({ id: crypto.randomUUID(), campaign_id: campaignId, name: r.name, phone: String(r.phone ?? ""), status: "failed", error_code: "INVALID_PHONE", error_message: "Invalid phone number" })),
      ...valid.map((v) => ({ id: v.id, campaign_id: campaignId, name: v.name, phone: v.phone, status: "pending" })),
    ];
    // Track BEFORE sending: if this table is missing, nothing goes out untracked
    await supabase.from("campaign_recipients").delete().eq("campaign_id", campaignId);
    for (const part of chunk(rows, 500)) {
      const { error } = await supabase.from("campaign_recipients").insert(part);
      if (error) throw error;
    }

    // 5. Controlled sending
    sendingStarted = true;
    let aborted = null;
    await runPool(valid, CONCURRENCY, async (t) => {
      const r = await sendWhatsAppMessage(t.phone, campaign.message, { campaignId, name: t.name });
      if (r.success) {
        sent++;
        await supabase.from("campaign_recipients")
          .update({ status: "sent", wa_message_id: r.wamid, sent_at: new Date().toISOString() }).eq("id", t.id);
        return;
      }
      errors.push({ phone: t.phone, name: t.name, error: r.error, code: String(r.code) });
      await supabase.from("campaign_recipients")
        .update({ status: "failed", error_code: String(r.code), error_message: r.error }).eq("id", t.id);
      if (r.fatal) { aborted = r; return "STOP"; } // bad token / phone ID: don't hammer Meta
    });

    if (aborted) {
      await supabase.from("campaign_recipients")
        .update({ status: "failed", error_code: "ABORTED", error_message: "Campaign stopped after a fatal WhatsApp error" })
        .eq("campaign_id", campaignId).eq("status", "pending");
    }

    // 6. Finalize. delivered/read stay 0 until Meta's webhook confirms them
    const total = invalid.length + valid.length;
    const failed = total - sent;
    const status = sent > 0 ? ST.DONE : ST.FAILED;
    const report = { sent, delivered: 0, failed, read: 0, total };
    const ts = new Date().toISOString();
    await safeUpdate(campaignId, tenantId, { status, sent_at: ts, report, updated_at: ts }, { status, sent_at: ts });
    console.log(`${tag} done`, { sent, failed, total, aborted: !!aborted });

    return res.json({
      success: sent > 0,
      message: aborted
        ? `Campaign stopped: WhatsApp rejected the credentials (code ${aborted.code}). ${sent} sent, ${failed} failed`
        : `Campaign processed: ${sent} accepted by WhatsApp, ${failed} failed`,
      details: { sent, failed, total, errors: errors.slice(0, 200) },
    });
  } catch (err) {
    console.error(`${tag} unexpected error`, err);
    // If messages already went out, never mark it retryable (that would send them twice)
    await safeUpdate(campaignId, tenantId, { status: sendingStarted && sent > 0 ? ST.DONE : ST.FAILED });
    return res.status(500).json({
      success: false,
      error: {
        message: "Internal error while sending campaign",
        code: err.code || "INTERNAL",
        ...(process.env.NODE_ENV !== "production" && { detail: err.message }),
      },
    });
  }
});

module.exports = router;