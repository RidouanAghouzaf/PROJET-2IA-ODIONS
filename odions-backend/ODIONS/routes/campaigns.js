const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");
const axios = require("axios");

// Meta WhatsApp Business API Configuration
const WHATSAPP_CONFIG = {
  PHONE_NUMBER_ID: "826017757269126",
  ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
  API_URL: "https://graph.facebook.com/v22.0"
};

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

// Helper function to format phone number for WhatsApp
function formatPhoneNumber(phone) {
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it starts with +, remove it
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // If it starts with 00, remove it
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  
  // Ensure it has country code (if starts with 0, assume Morocco +212)
  if (cleaned.startsWith('0')) {
    cleaned = '212' + cleaned.substring(1);
  }
  
  // If no country code detected, assume Morocco
  if (cleaned.length === 9) {
    cleaned = '212' + cleaned;
  }
  
  return cleaned;
}

// Send campaign messages via WhatsApp API
router.post("/send/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { use_template } = req.body; // Optional: specify if using template

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

    const WHATSAPP_API_URL = `${WHATSAPP_CONFIG.API_URL}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}/messages`;

    let sentCount = 0;
    let failedCount = 0;
    const errors = [];

    console.log(`Starting to send campaign "${campaign.name}" to ${contacts.length} contacts`);
    console.log(`Using ${use_template ? 'TEMPLATE' : 'TEXT'} message type`);

    // Send messages to all contacts
    for (const contact of contacts) {
      try {
        // Format phone number properly
        const phoneNumber = formatPhoneNumber(contact.phone_number);
        
        console.log(`Sending to ${contact.name || 'Unknown'}: ${phoneNumber}`);

        // Choose message payload based on type
        let messagePayload;
        
        if (use_template) {
          // TEMPLATE MESSAGE - for first contact with users
          messagePayload = {
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "template",
            template: {
              name: "hello_world", // Use your approved template name
              language: {
                code: "en_US" // Or your template's language
              }
            }
          };
        } else {
          // TEXT MESSAGE - only works if user replied within 24h
          messagePayload = {
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "text",
            text: { 
              body: campaign.message 
            }
          };
        }

        const response = await axios.post(
          WHATSAPP_API_URL,
          messagePayload,
          {
            headers: {
              Authorization: `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log(`✅ Message sent to ${phoneNumber}:`, response.data);
        sentCount++;

        // Delay to avoid rate limiting (Meta allows ~80 messages/second)
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        const errorMessage = err.response?.data?.error?.message || err.message;
        const errorCode = err.response?.data?.error?.code;
        
        console.error(`❌ Failed to send to ${contact.phone_number}:`, {
          error: errorMessage,
          code: errorCode,
          details: err.response?.data
        });
        
        failedCount++;
        errors.push({
          phone: contact.phone_number,
          name: contact.name,
          error: errorMessage,
          code: errorCode,
          hint: errorCode === 131047 ? "User needs to reply first or use template message" : 
                errorCode === 131026 ? "Message undeliverable - check phone number" :
                errorCode === 131049 ? "User received too many marketing messages" : null
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
          delivered: sentCount,
          failed: failedCount,
          read: 0,
          total: contacts.length
        },
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating campaign:", updateError);
    }

    console.log(`Campaign complete: ${sentCount} sent, ${failedCount} failed`);

    res.json({ 
      success: true, 
      message: `Campaign sent! ${sentCount} messages sent, ${failedCount} failed`,
      details: {
        sent: sentCount,
        failed: failedCount,
        total: contacts.length,
        errors: errors.length > 0 ? errors : undefined
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

// Test WhatsApp API connection and send test message
router.post("/test-whatsapp", async (req, res) => {
  try {
    const { phone_number, message } = req.body;

    if (!phone_number) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const testMessage = message || "Hello! This is a test message from your WhatsApp Campaign system.";
    const phoneNumber = formatPhoneNumber(phone_number);

    console.log("=== WHATSAPP TEST ===");
    console.log("Original phone:", phone_number);
    console.log("Formatted phone:", phoneNumber);
    console.log("Message:", testMessage);
    console.log("API URL:", `${WHATSAPP_CONFIG.API_URL}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}/messages`);
    console.log("Phone Number ID:", WHATSAPP_CONFIG.PHONE_NUMBER_ID);
    console.log("Token (first 20 chars):", WHATSAPP_CONFIG.ACCESS_TOKEN.substring(0, 20) + "...");

    const WHATSAPP_API_URL = `${WHATSAPP_CONFIG.API_URL}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}/messages`;

    try {
      const response = await axios.post(
        WHATSAPP_API_URL,
        {
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "text",
          text: { 
            body: testMessage 
          }
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ SUCCESS - WhatsApp API Response:", JSON.stringify(response.data, null, 2));

      res.json({
        success: true,
        message: "Test message sent successfully!",
        details: {
          formatted_phone: phoneNumber,
          api_response: response.data,
          message_id: response.data.messages?.[0]?.id
        }
      });
    } catch (apiError) {
      console.error("❌ WHATSAPP API ERROR:");
      console.error("Status:", apiError.response?.status);
      console.error("Response:", JSON.stringify(apiError.response?.data, null, 2));
      
      res.status(apiError.response?.status || 500).json({
        success: false,
        error: "WhatsApp API Error",
        details: {
          formatted_phone: phoneNumber,
          status: apiError.response?.status,
          error_message: apiError.response?.data?.error?.message,
          error_code: apiError.response?.data?.error?.code,
          error_type: apiError.response?.data?.error?.type,
          error_subcode: apiError.response?.data?.error?.error_subcode,
          full_error: apiError.response?.data
        }
      });
    }
  } catch (err) {
    console.error("Test endpoint error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
