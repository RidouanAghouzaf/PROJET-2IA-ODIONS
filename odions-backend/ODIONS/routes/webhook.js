const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");

// WhatsApp Verification
router.get("/", (req, res) => {
  const VERIFY_TOKEN = "odions_whatsapp_verify";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// WhatsApp Incoming Messages
router.post("/", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const phone = message.from;
    const text = message.text?.body || "";
    const name = change.value.contacts?.[0]?.profile?.name || "Unknown";

    // Detect campaign based on your logic
    const campaign_id = null; // or extract if you add tracking IDs later

    // Store the incoming message
    await supabase.from("messages").insert({
      phone,
      name,
      message: text,
      direction: "incoming",
      campaign_id
    });

    console.log("📩 Incoming message saved:", phone, text);

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});

module.exports = router;
