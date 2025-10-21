const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');  // for unique session IDs

// ================= GET ALL CHATBOTS =================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chatbots')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ chatbots: data });
  } catch (err) {
    console.error('❌ Failed to fetch chatbots:', err);
    res.status(500).json({ error: { message: 'Failed to fetch chatbots', status: 500 } });
  }
});
// ================= POST MESSAGE TO A CHATBOT SESSION =================
router.post('/chatbots/:chatbotId/sessions/:sessionId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatbotId, sessionId } = req.params;
    const { message, role } = req.body;

    // Validate user owns the chatbot
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select('id, user_id')
      .eq('id', chatbotId)
      .eq('user_id', req.user.id)
      .single();

    if (chatbotError || !chatbot) {
      return res.status(404).json({ error: { message: 'Chatbot not found or access denied' } });
    }

    // Fetch existing session
    const { data: session, error: sessionError } = await supabase
      .from('chatbot_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('bot_id', chatbotId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: { message: 'Session not found or does not belong to chatbot' } });
    }

    // Append the message to the session
    const updatedMessages = [
      ...session.messages,
      {
        role: role || 'user',
        content: message,
        timestamp: new Date().toISOString(),
      },
    ];

    const { error: updateError } = await supabase
      .from('chatbot_sessions')
      .update({
        messages: updatedMessages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    // You can replace this with logic to generate a bot response later
    res.status(200).json({
      message: 'Message added to session',
      messages: updatedMessages,
    });
  } catch (err) {
    console.error('❌ Failed to send message to session:', err);
    res.status(500).json({ error: { message: 'Failed to send message', status: 500 } });
  }
});

// ================= CREATE CHATBOT =================
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { bot_name, welcome_message, channels, is_active } = req.body;

    const chatbotData = {
      user_id: req.user.id,
      bot_name: bot_name || 'Nouveau Chatbot',
      welcome_message: welcome_message || 'Bonjour ! Comment puis-je vous aider ?',
      channels: channels || { facebook: false, whatsapp: false, website: true },
      is_active: is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: chatbot, error } = await supabase
      .from('chatbots')
      .insert([chatbotData])
      .select()
      .single();

    if (error) throw error;

    // Automatically create an initial session for the new chatbot
    const sessionData = {
      bot_id: chatbot.id,
      session_id: uuidv4(),
      messages: [],
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: sessionError } = await supabase
      .from('chatbot_sessions')
      .insert([sessionData]);

    if (sessionError) {
      console.error('❌ Failed to create initial session:', sessionError);
      // Note: don't throw here, chatbot creation succeeded
    }

    res.status(201).json({ message: 'Chatbot created successfully', chatbot });
  } catch (err) {
    console.error('❌ Failed to create chatbot:', err);
    res.status(500).json({ error: { message: 'Failed to create chatbot', status: 500 } });
  }
});

// ================= UPDATE CHATBOT =================
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { bot_name, welcome_message, channels, is_active } = req.body;

    const { data, error } = await supabase
      .from('chatbots')
      .update({
        bot_name,
        welcome_message,
        channels,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Chatbot updated successfully', chatbot: data });
  } catch (err) {
    console.error('❌ Failed to update chatbot:', err);
    res.status(500).json({ error: { message: 'Failed to update chatbot', status: 500 } });
  }
});

// ================= DELETE CHATBOT =================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('chatbots')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Chatbot deleted successfully' });
  } catch (err) {
    console.error('❌ Failed to delete chatbot:', err);
    res.status(500).json({ error: { message: 'Failed to delete chatbot', status: 500 } });
  }
});

// ================= CREATE SESSION FOR A CHATBOT =================
router.post('/:id/sessions', authenticateToken, async (req, res) => {
  try {
    const bot_id = parseInt(req.params.id, 10);

    // Check chatbot ownership
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select('id')
      .eq('id', bot_id)
      .eq('user_id', req.user.id)
      .single();

    if (chatbotError || !chatbot) {
      return res.status(404).json({ error: { message: 'Chatbot not found or access denied' } });
    }

    const sessionData = {
      bot_id,
      session_id: uuidv4(),
      messages: [],
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('chatbot_sessions')
      .insert([sessionData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Session created successfully', session: data });
  } catch (err) {
    console.error('❌ Failed to create session:', err);
    res.status(500).json({ error: { message: 'Failed to create session', status: 500 } });
  }
});

// ================= GET ALL SESSIONS FOR A CHATBOT =================
router.get('/:id/sessions', authenticateToken, async (req, res) => {
  try {
    const bot_id = parseInt(req.params.id, 10);

    // Verify ownership
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select('id')
      .eq('id', bot_id)
      .eq('user_id', req.user.id)
      .single();

    if (chatbotError || !chatbot) {
      return res.status(404).json({ error: { message: 'Chatbot not found or access denied' } });
    }

    const { data, error } = await supabase
      .from('chatbot_sessions')
      .select('*')
      .eq('bot_id', bot_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ sessions: data });
  } catch (err) {
    console.error('❌ Failed to fetch sessions:', err);
    res.status(500).json({ error: { message: 'Failed to fetch sessions', status: 500 } });
  }
});

// ================= GET SINGLE SESSION BY ID =================
router.get('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;

    // Fetch session with related chatbot's user_id
    const { data, error } = await supabase
      .from('chatbot_sessions')
      .select('*, chatbot:bot_id(user_id)')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: { message: 'Session not found' } });
    }

    // Check if the session belongs to the authenticated user
    if (data.chatbot.user_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    res.json({ session: data });
  } catch (err) {
    console.error('❌ Failed to fetch session:', err);
    res.status(500).json({ error: { message: 'Failed to fetch session', status: 500 } });
  }
});

// ================= DELETE SESSION BY ID =================
router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;

    // Verify ownership via chatbot user_id
    const { data: session, error: sessionError } = await supabase
      .from('chatbot_sessions')
      .select('chatbot:bot_id(user_id)')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: { message: 'Session not found' } });
    }

    if (session.chatbot.user_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    const { error } = await supabase
      .from('chatbot_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;

    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    console.error('❌ Failed to delete session:', err);
    res.status(500).json({ error: { message: 'Failed to delete session', status: 500 } });
  }
});

module.exports = router;
