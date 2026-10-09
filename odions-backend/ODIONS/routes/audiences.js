// // routes/audiences.js
// const express = require("express");
// const router = express.Router();
// const { supabase } = require("../config/supabase");
// const requireAuth = require("../middleware/requireAuth"); // same middleware as campaigns.js

// // Must be the same column used in campaigns.js (AUDIENCE_TENANT_COL)
// const TENANT_COL = "user_id";

// router.use(requireAuth); // sets req.tenantId

// const fail = (res, http, message) =>
//   res.status(http).json({ error: { message, status: http } });

// // 🟢 Get all audiences (only the current user's)
// router.get("/", async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from("audiences")
//       .select("*")
//       .eq(TENANT_COL, req.tenantId)
//       .order("created_at", { ascending: false });

//     if (error) throw error;
//     res.json({ audiences: data || [] });
//   } catch (error) {
//     console.error("Get audiences error:", error);
//     fail(res, 500, "Failed to get audiences");
//   }
// });

// // 🟢 Get single audience by ID
// router.get("/:id", async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from("audiences")
//       .select("*")
//       .eq("id", req.params.id)
//       .eq(TENANT_COL, req.tenantId)
//       .maybeSingle();

//     if (error) {
//       if (error.code === "22P02") return fail(res, 404, "Audience not found");
//       throw error;
//     }
//     if (!data) return fail(res, 404, "Audience not found");
//     res.json({ audience: data });
//   } catch (error) {
//     console.error("Get audience error:", error);
//     fail(res, 500, "Failed to get audience");
//   }
// });

// // 🟢 Create new audience
// router.post("/", async (req, res) => {
//   try {
//     const { name, description, size } = req.body || {};
//     if (!name) return fail(res, 400, "Name is required");

//     const { data, error } = await supabase
//       .from("audiences")
//       .insert([
//         {
//           name,
//           criteria_summary: description || "",
//           size: Number(size) || 0,
//           [TENANT_COL]: req.tenantId, // never trust user_id from the body
//         },
//       ])
//       .select()
//       .single();

//     if (error) throw error;
//     res.status(201).json({ message: "Audience created successfully", audience: data });
//   } catch (error) {
//     console.error("Create audience error:", error);
//     fail(res, 500, "Failed to create audience");
//   }
// });

// // 🟢 Update audience
// router.put("/:id", async (req, res) => {
//   try {
//     const { name, description, size } = req.body || {};

//     const updateData = { updated_at: new Date().toISOString() };
//     if (name !== undefined) updateData.name = name;
//     if (description !== undefined) updateData.criteria_summary = description;
//     if (size !== undefined) updateData.size = Number(size) || 0;

//     const { data, error } = await supabase
//       .from("audiences")
//       .update(updateData)
//       .eq("id", req.params.id)
//       .eq(TENANT_COL, req.tenantId)
//       .select()
//       .maybeSingle();

//     if (error) {
//       if (error.code === "22P02") return fail(res, 404, "Audience not found");
//       throw error;
//     }
//     if (!data) return fail(res, 404, "Audience not found");
//     res.json({ message: "Audience updated successfully", audience: data });
//   } catch (error) {
//     console.error("Update audience error:", error);
//     fail(res, 500, "Failed to update audience");
//   }
// });

// // 🟢 Delete audience
// router.delete("/:id", async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from("audiences")
//       .delete()
//       .eq("id", req.params.id)
//       .eq(TENANT_COL, req.tenantId)
//       .select("id");

//     if (error) {
//       if (error.code === "22P02") return fail(res, 404, "Audience not found");
//       throw error;
//     }
//     if (!data?.length) return fail(res, 404, "Audience not found");
//     res.json({ message: "Audience deleted successfully" });
//   } catch (error) {
//     console.error("Delete audience error:", error);
//     fail(res, 500, "Failed to delete audience");
//   }
// });

// module.exports = router;
// routes/audiences.js
const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");
const requireAuth = require("../middleware/requireAuth");
const { normalizePhoneNumber } = require("../utils/phone");

// Must be the same column used in campaigns.js (AUDIENCE_TENANT_COL)
const TENANT_COL = "user_id";
const MAX_PER_CALL = 1000;

router.use(requireAuth); // sets req.tenantId from the verified Supabase token

const fail = (res, http, message, extra = {}) =>
  res.status(http).json({ error: { message, status: http, ...extra } });

const devDetail = (err) => (process.env.NODE_ENV !== "production" ? { detail: err.message } : {});

/* ------------------------------ helpers ------------------------------ */
// Pages through all existing numbers (Supabase returns at most 1000 rows per request)
async function existingPhones(audienceId) {
  const seen = new Set();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("contacts")
      .select("phone_number")
      .eq("audience_id", audienceId)
      .order("id")
      .range(from, from + 999);
    if (error) throw error;
    for (const c of data) {
      const p = normalizePhoneNumber(c.phone_number);
      if (p) seen.add(p);
    }
    if (data.length < 1000) break;
  }
  return seen;
}
// Returns the audience row only if it belongs to the logged-in account, else null.
async function ownedAudience(id, tenantId) {
  const { data, error } = await supabase
    .from("audiences")
    .select("id")
    .eq("id", id)
    .eq(TENANT_COL, tenantId)
    .maybeSingle();
  if (error && error.code === "22P02") return null; // malformed id
  if (error) throw error;
  return data;
}

// audiences.size always reflects the real number of contacts.
async function syncSize(audienceId) {
  const { count, error } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("audience_id", audienceId);
  if (error) throw error;
  const size = count || 0;
  const { error: upErr } = await supabase
    .from("audiences")
    .update({ size, updated_at: new Date().toISOString() })
    .eq("id", audienceId);
  if (upErr) throw upErr;
  return size;
}

// Normalizes, de-duplicates and inserts contacts. Returns a summary.
async function addContacts(audienceId, list) {
  const input = (Array.isArray(list) ? list : []).slice(0, MAX_PER_CALL);

   const seen = await existingPhones(audienceId);
  const rows = [];
  const invalid = [];
  let duplicates = 0;
  for (const c of input) {
    const phone = normalizePhoneNumber(c?.phone);
    if (!phone) {
      invalid.push({ name: String(c?.name || ""), phone: String(c?.phone ?? "") });
      continue;
    }
    if (seen.has(phone)) {
      duplicates++;
      continue;
    }
    seen.add(phone);
    rows.push({ audience_id: audienceId, name: String(c?.name || "").slice(0, 200), phone_number: phone });
  }

  if (rows.length) {
    const { error } = await supabase.from("contacts").insert(rows);
    if (error) throw error;
  }
  const size = await syncSize(audienceId);
  return { added: rows.length, duplicates, invalid, size };
}

/* ------------------------------ audiences ---------------------------- */

// List the current account's audiences
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("audiences")
      .select("*")
      .eq(TENANT_COL, req.tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ audiences: data || [] });
  } catch (error) {
    console.error("Get audiences error:", error);
    fail(res, 500, "Failed to get audiences");
  }
});

// Single audience
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("audiences")
      .select("*")
      .eq("id", req.params.id)
      .eq(TENANT_COL, req.tenantId)
      .maybeSingle();
    if (error) {
      if (error.code === "22P02") return fail(res, 404, "Audience not found");
      throw error;
    }
    if (!data) return fail(res, 404, "Audience not found");
    res.json({ audience: data });
  } catch (error) {
    console.error("Get audience error:", error);
    fail(res, 500, "Failed to get audience");
  }
});

// Create an audience. Optional body.contacts: [{ name, phone }]
// "size" sent by a client is ignored: it is computed from the real contacts.
router.post("/", async (req, res) => {
  try {
    const { name, description, contacts } = req.body || {};
    if (!name || !String(name).trim()) return fail(res, 400, "Name is required");

    const { data, error } = await supabase
      .from("audiences")
      .insert([
        {
          name: String(name).trim(),
          criteria_summary: description || "",
          size: 0,
          [TENANT_COL]: req.tenantId, // never trust user_id from the body
        },
      ])
      .select()
      .single();
    if (error) throw error;

    let summary = null;
    if (Array.isArray(contacts) && contacts.length) {
      summary = await addContacts(data.id, contacts);
      data.size = summary.size;
    }
    res.status(201).json({ message: "Audience created successfully", audience: data, contacts: summary });
  } catch (error) {
    console.error("Create audience error:", error);
    fail(res, 500, "Failed to create audience", devDetail(error));
  }
});

// Update name / description only
router.put("/:id", async (req, res) => {
  try {
    const { name, description } = req.body || {};
    const updateData = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = String(name).trim();
    if (description !== undefined) updateData.criteria_summary = description;

    const { data, error } = await supabase
      .from("audiences")
      .update(updateData)
      .eq("id", req.params.id)
      .eq(TENANT_COL, req.tenantId)
      .select()
      .maybeSingle();
    if (error) {
      if (error.code === "22P02") return fail(res, 404, "Audience not found");
      throw error;
    }
    if (!data) return fail(res, 404, "Audience not found");
    res.json({ message: "Audience updated successfully", audience: data });
  } catch (error) {
    console.error("Update audience error:", error);
    fail(res, 500, "Failed to update audience");
  }
});

// Delete an audience and its contacts
router.delete("/:id", async (req, res) => {
  try {
    if (!(await ownedAudience(req.params.id, req.tenantId))) return fail(res, 404, "Audience not found");

    const { error: cErr } = await supabase.from("contacts").delete().eq("audience_id", req.params.id);
    if (cErr) throw cErr;

    const { data, error } = await supabase
      .from("audiences")
      .delete()
      .eq("id", req.params.id)
      .eq(TENANT_COL, req.tenantId)
      .select("id");
    if (error) throw error;
    if (!data?.length) return fail(res, 404, "Audience not found");
    res.json({ message: "Audience deleted successfully" });
  } catch (error) {
    console.error("Delete audience error:", error);
    fail(res, 500, "Failed to delete audience");
  }
});

/* ------------------------------ contacts ----------------------------- */

// List contacts of an audience
router.get("/:id/contacts", async (req, res) => {
  try {
    if (!(await ownedAudience(req.params.id, req.tenantId))) return fail(res, 404, "Audience not found");
    const { data, error } = await supabase
      .from("contacts")
      .select("id, name, phone_number")
      .eq("audience_id", req.params.id)
      .order("name", { ascending: true })
      .limit(1000);
    if (error) throw error;
    res.json({ contacts: data || [] });
  } catch (error) {
    console.error("List contacts error:", error);
    fail(res, 500, "Failed to get contacts", devDetail(error));
  }
});

// Add contacts: body { contacts: [{ name, phone }, ...] } (max 1000 per call)
router.post("/:id/contacts", async (req, res) => {
  try {
    if (!(await ownedAudience(req.params.id, req.tenantId))) return fail(res, 404, "Audience not found");
    const list = req.body?.contacts;
    if (!Array.isArray(list) || !list.length) return fail(res, 400, "contacts must be a non-empty array");
    const summary = await addContacts(req.params.id, list);
    res.status(201).json(summary);
  } catch (error) {
    console.error("Add contacts error:", error);
    fail(res, 500, "Failed to add contacts", devDetail(error));
  }
});

// Remove one contact
router.delete("/:id/contacts/:contactId", async (req, res) => {
  try {
    if (!(await ownedAudience(req.params.id, req.tenantId))) return fail(res, 404, "Audience not found");
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", req.params.contactId)
      .eq("audience_id", req.params.id);
    if (error) throw error;
    const size = await syncSize(req.params.id);
    res.json({ message: "Contact removed", size });
  } catch (error) {
    console.error("Delete contact error:", error);
    fail(res, 500, "Failed to remove contact", devDetail(error));
  }
});

module.exports = router;