const express = require("express");
const router = express.Router();
const axios = require("axios");
const { supabase } = require("../config/supabase");

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// ✅ Vérification du webhook WhatsApp (obligatoire par Meta)
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("✅ Webhook WhatsApp vérifié");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ✅ Réception des messages WhatsApp
router.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (message) {
      const from = message.from; // Numéro de l'utilisateur
      const text = message.text?.body?.trim().toLowerCase();

      console.log(`💬 Message reçu de ${from}: ${text}`);

      // 1️⃣ Récupérer un chatbot actif avec canal WhatsApp activé
      const { data: chatbots, error } = await supabase
        .from("chatbots")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;

      const whatsappBot = chatbots.find(
        (b) => b.channels?.whatsapp === true
      );

      if (!whatsappBot) {
        console.log("⚠️ Aucun chatbot WhatsApp actif trouvé.");
        await sendMessage(from, "Aucun chatbot WhatsApp n’est actuellement actif.");
        return res.sendStatus(200);
      }

      // 2️⃣ Chercher la réponse dans les scénarios
      const scenarios = whatsappBot.scenarios || [];
      const matched = scenarios.find((s) =>
        text.includes(s.question.toLowerCase())
      );

      // 3️⃣ Répondre
      if (matched) {
        await sendMessage(from, matched.answer);
      } else {
        await sendMessage(from, whatsappBot.welcome_message || "Je n’ai pas compris, pouvez-vous reformuler ?");
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erreur Webhook WhatsApp:", err.message);
    res.sendStatus(500);
  }
});

// ✅ Route d’envoi manuel (pour tester depuis React)
router.post("/send", async (req, res) => {
  const { to, message } = req.body;
  try {
    await sendMessage(to, message);
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur envoi WhatsApp:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Fonction pour envoyer un message
async function sendMessage(to, message) {
  await axios.post(
    `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
  console.log(`📤 Réponse envoyée à ${to}: ${message}`);
}

module.exports = router;
