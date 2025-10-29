// // routes/campaigns.js
// const express = require('express');
// const router = express.Router();
// const { supabase } = require('../config/supabase');
// const { authenticateToken } = require('../middleware/auth');

// // Get all campaigns
// router.get('/', authenticateToken, async (req, res) => {
//   try {
//     const { status, type, limit = 50, offset = 0 } = req.query;
    
//     let query = supabase
//       .from('campaigns')
//       .select('*', { count: 'exact' })
//       .order('created_at', { ascending: false })
//       .range(offset, offset + limit - 1);

//     if (status) query = query.eq('status', status);
//     if (type) query = query.eq('type', type);

//     const { data, error, count } = await query;

//     if (error) throw error;

//     res.json({ campaigns: data, total: count });
//   } catch (error) {
//     console.error('Get campaigns error:', error);
//     res.status(500).json({ error: { message: 'Failed to get campaigns', status: 500 } });
//   }
// });

// // Get campaign by ID
// router.get('/:id', authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params;

//     const { data, error } = await supabase
//       .from('campaigns')
//       .select('*')
//       .eq('id', id)
//       .single();

//     if (error) {
//       return res.status(404).json({ error: { message: 'Campaign not found', status: 404 } });
//     }

//     res.json({ campaign: data });
//   } catch (error) {
//     console.error('Get campaign error:', error);
//     res.status(500).json({ error: { message: 'Failed to get campaign', status: 500 } });
//   }
// });

// // Create campaign
// router.post('/', authenticateToken, async (req, res) => {
//   try {
//     const { name, type, recipients_count } = req.body;

//     if (!name || !type) {
//       return res.status(400).json({ 
//         error: { message: 'Name and type are required', status: 400 } 
//       });
//     }

//     const campaignData = {
//       name,
//       type,
//       status: 'draft',
//       recipients_count: recipients_count || 0,
//       opened_count: 0,
//       clicked_count: 0,
//       conversion_count: 0,
//       created_by: req.user.id,
//       created_at: new Date().toISOString()
//     };

//     const { data, error } = await supabase
//       .from('campaigns')
//       .insert([campaignData])
//       .select()
//       .single();

//     if (error) throw error;

//     res.status(201).json({ 
//       message: 'Campaign created successfully', 
//       campaign: data 
//     });
//   } catch (error) {
//     console.error('Create campaign error:', error);
//     res.status(500).json({ error: { message: 'Failed to create campaign', status: 500 } });
//   }
// });

// // Update campaign
// router.put('/:id', authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, type, status, recipients_count, opened_count, clicked_count, conversion_count } = req.body;

//     const updateData = { updated_at: new Date().toISOString() };
//     if (name !== undefined) updateData.name = name;
//     if (type !== undefined) updateData.type = type;
//     if (status !== undefined) updateData.status = status;
//     if (recipients_count !== undefined) updateData.recipients_count = recipients_count;
//     if (opened_count !== undefined) updateData.opened_count = opened_count;
//     if (clicked_count !== undefined) updateData.clicked_count = clicked_count;
//     if (conversion_count !== undefined) updateData.conversion_count = conversion_count;

//     const { data, error } = await supabase
//       .from('campaigns')
//       .update(updateData)
//       .eq('id', id)
//       .select()
//       .single();

//     if (error) throw error;

//     res.json({ message: 'Campaign updated successfully', campaign: data });
//   } catch (error) {
//     console.error('Update campaign error:', error);
//     res.status(500).json({ error: { message: 'Failed to update campaign', status: 500 } });
//   }
// });

// // Send campaign
// router.post('/:id/send', authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params;

//     const { data, error } = await supabase
//       .from('campaigns')
//       .update({ 
//         status: 'sent',
//         sent_at: new Date().toISOString(),
//         updated_at: new Date().toISOString()
//       })
//       .eq('id', id)
//       .select()
//       .single();

//     if (error) throw error;

//     res.json({ message: 'Campaign sent successfully', campaign: data });
//   } catch (error) {
//     console.error('Send campaign error:', error);
//     res.status(500).json({ error: { message: 'Failed to send campaign', status: 500 } });
//   }
// });

// // Delete campaign
// router.delete('/:id', authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params;

//     const { error } = await supabase
//       .from('campaigns')
//       .delete()
//       .eq('id', id);

//     if (error) throw error;

//     res.json({ message: 'Campaign deleted successfully' });
//   } catch (error) {
//     console.error('Delete campaign error:', error);
//     res.status(500).json({ error: { message: 'Failed to delete campaign', status: 500 } });
//   }
// });

// // Get campaign statistics
// router.get('/:id/stats', authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params;

//     const { data, error } = await supabase
//       .from('campaigns')
//       .select('recipients_count, opened_count, clicked_count, conversion_count')
//       .eq('id', id)
//       .single();

//     if (error) throw error;

//     const stats = {
//       recipients: data.recipients_count,
//       opened: data.opened_count,
//       clicked: data.clicked_count,
//       conversions: data.conversion_count,
//       open_rate: data.recipients_count > 0 
//         ? ((data.opened_count / data.recipients_count) * 100).toFixed(2)
//         : 0,
//       click_rate: data.opened_count > 0 
//         ? ((data.clicked_count / data.opened_count) * 100).toFixed(2)
//         : 0,
//       conversion_rate: data.recipients_count > 0 
//         ? ((data.conversion_count / data.recipients_count) * 100).toFixed(2)
//         : 0
//     };

//     res.json({ stats });
//   } catch (error) {
//     console.error('Get campaign stats error:', error);
//     res.status(500).json({ error: { message: 'Failed to get campaign statistics', status: 500 } });
//   }
// });

// 
const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");
const axios = require("axios");

// Get all campaigns
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .select(`
        *,
        audiences (
          id,
          name,
          size
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    // Format response to include audience_name
    const formattedData = (data || []).map(campaign => ({
      ...campaign,
      audience_name: campaign.audiences?.name || "Unknown Audience"
    }));
    
    res.json(formattedData);
  } catch (err) {
    console.error("Get campaigns error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create a new campaign
router.post("/", async (req, res) => {
  try {
    const { name, audience_id, message, scheduled_date, user_id } = req.body;

    if (!name || !audience_id || !message) {
      return res.status(400).json({ 
        error: "Name, audience_id, and message are required" 
      });
    }

    // Verify audience exists
    const { data: audience, error: audienceError } = await supabase
      .from("audiences")
      .select("id, name")
      .eq("id", audience_id)
      .single();

    if (audienceError || !audience) {
      return res.status(404).json({ error: "Audience not found" });
    }

    const { data, error } = await supabase
      .from("campaigns")
      .insert([{
        name,
        audience_id,
        message,
        scheduled_date: scheduled_date || new Date().toISOString().split('T')[0],
        status: "En attente",
        user_id,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("Create campaign error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Send campaign messages via WhatsApp API
router.post("/send/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get campaign with audience details
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select(`
        *,
        audiences (
          id,
          name,
          size
        )
      `)
      .eq("id", id)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    if (campaign.status === "Envoyée") {
      return res.status(400).json({ error: "Campaign already sent" });
    }

    // Get contacts for this audience
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("phone_number, name, email")
      .eq("audience_id", campaign.audience_id);

    if (contactsError) {
      console.error("Error fetching contacts:", contactsError);
      return res.status(500).json({ error: "Failed to fetch contacts" });
    }

    if (!contacts || contacts.length === 0) {
      return res.status(400).json({ 
        error: "No contacts found for this audience" 
      });
    }

    // Meta WhatsApp Business API Configuration
    const WHATSAPP_API_URL = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      return res.status(500).json({ 
        error: "WhatsApp API credentials not configured" 
      });
    }

    let sentCount = 0;
    let failedCount = 0;
    const errors = [];

    // Send messages to all contacts
    for (const contact of contacts) {
      try {
        // Format phone number (remove any non-numeric characters except +)
        const phoneNumber = contact.phone_number.replace(/[^\d+]/g, '');

        const response = await axios.post(
          WHATSAPP_API_URL,
          {
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "text",
            text: { 
              body: campaign.message 
            }
          },
          {
            headers: {
              Authorization: `Bearer ${ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log(`Message sent to ${contact.phone_number}:`, response.data);
        sentCount++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`Failed to send to ${contact.phone_number}:`, err.response?.data || err.message);
        failedCount++;
        errors.push({
          phone: contact.phone_number,
          name: contact.name,
          error: err.response?.data?.error?.message || err.message
        });
      }
    }

    // Update campaign status
    const newStatus = failedCount === contacts.length ? "Échouée" : "Envoyée";
    
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({ 
        status: newStatus,
        sent_at: new Date().toISOString(),
        report: {
          sent: sentCount,
          delivered: sentCount, // This can be updated via webhooks
          failed: failedCount,
          read: 0 // This can be updated via webhooks
        },
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating campaign:", updateError);
    }

    res.json({ 
      success: true, 
      message: `Campaign sent! ${sentCount} messages sent, ${failedCount} failed`,
      details: {
        sent: sentCount,
        failed: failedCount,
        total: contacts.length,
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined // Only return first 5 errors
      }
    });
  } catch (err) {
    console.error("Send campaign error:", err);
    
    // Update campaign status to failed
    await supabase
      .from("campaigns")
      .update({ 
        status: "Échouée",
        updated_at: new Date().toISOString()
      })
      .eq("id", req.params.id);

    res.status(500).json({ error: err.message });
  }
});

// Delete a campaign
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", id);

    if (error) throw error;
    
    res.json({ success: true, message: "Campaign deleted successfully" });
  } catch (err) {
    console.error("Delete campaign error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get campaign statistics
router.get("/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .select("report")
      .eq("id", id)
      .single();

    if (error || !campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json({ stats: campaign.report || {} });
  } catch (err) {
    console.error("Get campaign stats error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;