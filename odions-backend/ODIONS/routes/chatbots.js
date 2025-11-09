const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");
const { v4: uuidv4 } = require("uuid");

// ============ GET ALL CHATBOTS ============
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("chatbots")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Get chatbots error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============ CREATE CHATBOT ============
router.post("/", async (req, res) => {
  try {
    const { bot_name, welcome_message, channels, user_id } = req.body;

    if (!bot_name) {
      return res.status(400).json({ error: "Bot name is required" });
    }

    const chatbotData = {
      bot_name,
      welcome_message: welcome_message || "Bonjour ! Comment puis-je vous aider ?",
      channels: channels || { facebook: false, whatsapp: false, website: true },
      is_active: true,
      user_id: user_id || 1, // TEMP default for testing
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("chatbots")
      .insert([chatbotData])
      .select()
      .single();

    if (error) throw error;

    // Auto create initial session
    const sessionData = {
      bot_id: data.id,
      session_id: uuidv4(),
      messages: [],
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: sessionError } = await supabase
      .from("chatbot_sessions")
      .insert([sessionData]);

    if (sessionError) {
      console.error("Failed to create chatbot session:", sessionError);
    }

    res.status(201).json({ message: "Chatbot created successfully", chatbot: data });
  } catch (err) {
    console.error("Create chatbot error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============ DELETE CHATBOT ============
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("chatbots")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ success: true, message: "Chatbot deleted successfully" });
  } catch (err) {
    console.error("Delete chatbot error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============ GET ALL SESSIONS ============
router.get("/:id/sessions", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("chatbot_sessions")
      .select("*")
      .eq("bot_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ sessions: data });
  } catch (err) {
    console.error("Get sessions error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============ CREATE SESSION ============
router.post("/:id/sessions", async (req, res) => {
  try {
    const { id } = req.params;

    const sessionData = {
      bot_id: id,
      session_id: uuidv4(),
      messages: [],
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("chatbot_sessions")
      .insert([sessionData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Session created successfully", session: data });
  } catch (err) {
    console.error("Create session error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============ ADD MESSAGE TO SESSION (✔️ UPDATED) ============
router.post("/sessions/:sessionId/messages", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, role } = req.body;

    const { data: session, error: sessionError } = await supabase
      .from("chatbot_sessions")
      .select("messages")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Ajout du message utilisateur
    const updatedMessages = [
      ...session.messages,
      {
        role: role || "user",
        content: message,
        timestamp: new Date().toISOString(),
      },
    ];

    // Simulation d'une réponse automatique du bot
    const botReply = `🤖 Réponse automatique : "${message}"`;
    updatedMessages.push({
      role: "assistant",
      content: botReply,
      timestamp: new Date().toISOString(),
    });

    const { error } = await supabase
      .from("chatbot_sessions")
      .update({
        messages: updatedMessages,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (error) throw error;

    res.json({
      message: "Message added successfully",
      messages: updatedMessages,
      botReply,
    });
  } catch (err) {
    console.error("Add message error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
