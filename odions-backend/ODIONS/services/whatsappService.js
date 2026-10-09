const axios = require("axios");

// Read lazily so dotenv load order can never leave these undefined
const cfg = () => ({
  token: process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN,
  phoneId: process.env.WHATSAPP_PHONE_ID,
  version: process.env.WHATSAPP_API_VERSION || "v22.0",
  templateName: process.env.WHATSAPP_TEMPLATE_NAME || "",
  templateLang: process.env.WHATSAPP_TEMPLATE_LANG || "fr",
  templateParams: (process.env.WHATSAPP_TEMPLATE_PARAMS || "").split(",").map((s) => s.trim()).filter(Boolean),
});

const isWhatsAppConfigured = () => {
  const c = cfg();
  return !!(c.token && c.phoneId);
};

function validateWhatsAppEnv() {
  const c = cfg();
  if (!c.token) console.error("[WhatsApp] Missing WHATSAPP_TOKEN (or legacy WHATSAPP_ACCESS_TOKEN)");
  if (!c.phoneId) console.error("[WhatsApp] Missing WHATSAPP_PHONE_ID");
  if (!process.env.VERIFY_TOKEN) console.error("[WhatsApp] Missing VERIFY_TOKEN");
  if (c.templateName) {
    console.log(`[WhatsApp] TEMPLATE mode: "${c.templateName}" (${c.templateLang}) params=[${c.templateParams.join(",")}]`);
  } else {
    console.warn("[WhatsApp] TEXT mode: campaigns only deliver inside the 24h customer-service window");
  }
  return isWhatsAppConfigured();
}

const HINTS = {
  190: "access token invalid or expired",
  100: "invalid parameter or wrong Phone Number ID",
  131030: "recipient not in the allowed list (app in development mode)",
  131047: "outside the 24h window, a template message is required",
  131026: "undeliverable: number not on WhatsApp or invalid",
  131049: "Meta limited this marketing message to protect user experience",
  131042: "business payment method issue",
  131056: "too many messages to this recipient from this number",
  130429: "throughput limit reached",
  132000: "template parameter count mismatch",
  132001: "template does not exist in this language or is not approved",
  132018: "template parameter has newlines/tabs or too many spaces",
};
const TRANSIENT = new Set([1, 2, 4, 17, 32, 613, 80007, 130429, 131016]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Template variables can't contain newlines/tabs or 5+ consecutive spaces, max 1024 chars
const clean = (v) => String(v ?? "").replace(/[\r\n\t]+/g, " ").replace(/ {5,}/g, "    ").trim().slice(0, 1024);

function buildPayload(c, to, message, ctx) {
  if (c.templateName && !ctx.forceText) {
    const source = { name: ctx.name || "Client", message };
    const template = { name: c.templateName, language: { code: c.templateLang } };
    if (c.templateParams.length) {
      template.components = [{
        type: "body",
        parameters: c.templateParams.map((k) => ({ type: "text", text: clean(source[k]) })),
      }];
    }
    return { messaging_product: "whatsapp", to, type: "template", template };
  }
  return { messaging_product: "whatsapp", to, type: "text", text: { preview_url: false, body: message } };
}

/**
 * Same contract as your old stub: never throws.
 * Success: { success: true, wamid }
 * Failure: { success: false, error, code, status, fatal }
 * `fatal` = every further send will fail too (bad token / wrong phone ID).
 */
const sendWhatsAppMessage = async (to, message, ctx = {}) => {
  const c = cfg();
  if (!c.token || !c.phoneId) {
    return { success: false, error: "WhatsApp is not configured on the server", code: "CONFIG_MISSING", status: 0, fatal: true };
  }
  const url = `https://graph.facebook.com/${c.version}/${c.phoneId}/messages`;
  const payload = buildPayload(c, to, message, ctx);

  for (let attempt = 1; ; attempt++) {
    try {
      const res = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
        timeout: 15000,
      });
      const wamid = res.data?.messages?.[0]?.id;
      if (!wamid) {
        return { success: false, error: "Meta accepted the request but returned no message id", code: "NO_MESSAGE_ID", status: res.status, fatal: false };
      }
      return { success: true, wamid };
    } catch (err) {
      const e = err.response?.data?.error || {};
      const status = err.response?.status || 0;
      const code = e.code ?? err.code ?? "NETWORK";
      const base = e.error_data?.details || e.message || err.message;

      console.error("[WhatsApp] API error", {
        status, code, subcode: e.error_subcode, type: e.type, message: base,
        fbtrace_id: e.fbtrace_id, campaignId: ctx.campaignId, phone: to, attempt,
      }); // the token is never logged

      const transient = !err.response || status === 429 || status >= 500 || TRANSIENT.has(e.code);
      if (transient && attempt < 4) {
        const ra = Number(err.response?.headers?.["retry-after"]);
        await sleep((ra ? ra * 1000 : 500 * 2 ** attempt) + Math.random() * 250);
        continue;
      }
      const fatal = status === 401 || e.code === 190 ||
        (e.code === 100 && (e.error_subcode === 33 || /does not exist/i.test(e.message || "")));
      return { success: false, error: HINTS[code] ? `${base} (${HINTS[code]})` : base, code, status, fatal };
    }
  }
};

/** Real check, replaces the stub that always said "connected" */
const checkWhatsAppConnection = async (phoneNumberId) => {
  const c = cfg();
  const id = phoneNumberId || c.phoneId;
  if (!id) return { connected: false, status: "no_phone_number", message: "No phone number configured" };
  if (!c.token) return { connected: false, status: "no_token", message: "WHATSAPP_TOKEN is not set" };
  try {
    const { data } = await axios.get(`https://graph.facebook.com/${c.version}/${id}`, {
      params: { fields: "display_phone_number,verified_name,quality_rating" },
      headers: { Authorization: `Bearer ${c.token}` },
      timeout: 10000,
    });
    return {
      connected: true, status: "active", phoneNumberId: id,
      displayPhoneNumber: data.display_phone_number, verifiedName: data.verified_name,
      qualityRating: data.quality_rating, message: "WhatsApp connection active",
    };
  } catch (err) {
    const e = err.response?.data?.error || {};
    return { connected: false, status: "error", code: e.code, message: e.message || err.message };
  }
};

module.exports = { sendWhatsAppMessage, checkWhatsAppConnection, validateWhatsAppEnv, isWhatsAppConfigured };