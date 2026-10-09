const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");
const requireAuth = require("../middleware/requireAuth");
const { resolveRange, eachDay, RANGE_KEYS } = require("../utils/dateRanges");

// Every route below runs only for a verified Supabase session.
// req.tenantId comes from the token, never from the request body or query string.
router.use(requireAuth);

// Change a name here if your column differs.
const COL = {
  orders:    { table: "orders",    tenant: "user_id" },
  campaigns: { table: "campaigns", tenant: "user_id" },
  audiences: { table: "audiences", tenant: "user_id" },
  chatbots:  { table: "chatbots",  tenant: "user_id" },
};

const num = (v) => Number(v) || 0;
const iso = (ms) => new Date(ms).toISOString();
const pct = (a, b) => (b > 0 ? (a / b) * 100 : null);
const DAY_FMT = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Casablanca" }); // YYYY-MM-DD
const PAGE = 1000;
const MAX_ROWS = 50000; // safety cap per period

const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error(`[DASHBOARD] ${req.path}`, err.message || err);
    res.status(500).json({
      success: false,
      error: { message: "Could not load dashboard data", code: "DASHBOARD_ERROR" },
    });
  }
};

function withRange(req, res, next) {
  const key = req.query.range || "last_30_days";
  if (!RANGE_KEYS.includes(key)) {
    return res.status(400).json({ success: false, error: { message: "Invalid range", code: "VALIDATION" } });
  }
  req.range = resolveRange(key);
  next();
}

// Postgres 22P02 = invalid input syntax (for example a uuid compared with an integer column).
// For tables whose owner column is not a uuid we return an empty result instead of leaking
// or crashing, and log the reason so the schema can be fixed.
const isTypeMismatch = (error) => error && error.code === "22P02";

/* ------------------------------ ORDERS ------------------------------ */

async function fetchOrders(tenantId, w) {
  const rows = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await supabase
      .from(COL.orders.table)
      .select("id, status, amount, client_email, client_name, created_at")
      .eq(COL.orders.tenant, tenantId)
      .gte("created_at", iso(w.from))
      .lt("created_at", iso(w.to))
      .order("created_at", { ascending: true })
      .order("id", { ascending: true }) // stable paging
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return rows;
}

function kpisFrom(rows) {
  const byStatus = {};
  const customers = new Set();
  let revenue = 0;
  for (const o of rows) {
    const s = o.status || "unknown";
    byStatus[s] = (byStatus[s] || 0) + 1;
    if (s === "delivered") revenue += num(o.amount);
    const who = o.client_email || o.client_name;
    if (who) customers.add(who);
  }
  const total = rows.length;
  const delivered = byStatus.delivered || 0;
  return {
    total,
    delivered,
    refused: byStatus.refused || 0,
    pending: byStatus.pending || 0,
    returned: byStatus.returned || 0,
    byStatus,
    revenue,
    customers: customers.size,
    avgOrderValue: delivered ? revenue / delivered : null,
    deliveryRate: pct(delivered, total),
  };
}

function seriesFrom(rows) {
  const m = new Map();
  for (const o of rows) {
    const d = DAY_FMT.format(new Date(o.created_at));
    const e = m.get(d) || { orders: 0, revenue: 0 };
    e.orders++;
    if (o.status === "delivered") e.revenue += num(o.amount);
    m.set(d, e);
  }
  return m;
}

/* ----------------------------- WHATSAPP ----------------------------- */

async function whatsappKpis(tenantId, w) {
  const { data, error } = await supabase
    .from(COL.campaigns.table)
    .select("status, report")
    .eq(COL.campaigns.tenant, tenantId)
    .gte("sent_at", iso(w.from))
    .lt("sent_at", iso(w.to))
    .limit(1000);
  if (error) throw error;

  let campaignsSent = 0, sent = 0, delivered = 0, read = 0, failed = 0;
  for (const c of data || []) {
    if (c.status === "Envoyée") campaignsSent++;
    const r = c.report || {};
    sent += num(r.sent);
    delivered += num(r.delivered);
    read += num(r.read);
    failed += num(r.failed);
  }
  return {
    campaignsSent,
    messagesSent: sent,
    delivered,
    read,
    failed,
    deliveryRate: pct(delivered, sent),
    readRate: pct(read, sent),
  };
}

/* ------------------------------ ROUTES ------------------------------ */

router.get("/stats", withRange, wrap(async (req, res) => {
  const t = req.tenantId;
  const { current: c, previous: p } = req.range;

  const [curRows, prevRows, wc, wp] = await Promise.all([
    fetchOrders(t, c),
    fetchOrders(t, p),
    whatsappKpis(t, c),
    whatsappKpis(t, p),
  ]);

  const byDay = seriesFrom(curRows);
  const trend = eachDay(c.from, c.to).map((day) => ({
    date: day,
    orders: byDay.get(day)?.orders || 0,
    revenue: byDay.get(day)?.revenue || 0,
  }));

  res.json({
    range: { key: req.range.key, from: iso(c.from), to: iso(c.to), previousFrom: iso(p.from), previousTo: iso(p.to) },
    orders: { current: kpisFrom(curRows), previous: kpisFrom(prevRows) },
    whatsapp: { current: wc, previous: wp },
    trend,
  });
}));

router.get("/recent-orders", wrap(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 20);
  const { data, error } = await supabase
    .from(COL.orders.table)
    .select("id, order_number, client_name, amount, status, created_at") // no joins: there is no FK to stores
    .eq(COL.orders.tenant, req.tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  res.json({
    orders: (data || []).map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      customer: o.client_name || null,
      amount: num(o.amount),
      status: o.status || "unknown",
      createdAt: o.created_at,
    })),
  });
}));

router.get("/campaign-performance", wrap(async (req, res) => {
  const { data, error } = await supabase
    .from(COL.campaigns.table)
    .select("id, name, status, created_at, sent_at, report, audiences ( name )")
    .eq(COL.campaigns.tenant, req.tenantId)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;

  res.json({
    campaigns: (data || []).map((c) => {
      const r = c.report || {};
      const sent = num(r.sent);
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        audienceName: c.audiences?.name || null,
        createdAt: c.created_at,
        sentAt: c.sent_at || null,
        total: r.total ?? null,
        sent,
        delivered: num(r.delivered),
        read: num(r.read),
        failed: num(r.failed),
        deliveryRate: pct(num(r.delivered), sent),
        readRate: pct(num(r.read), sent),
        hasReport: !!c.report,
      };
    }),
  });
}));

router.get("/audience-overview", wrap(async (req, res) => {
  const { data, error, count } = await supabase
    .from(COL.audiences.table)
    .select("id, name, size", { count: "exact" })
    .eq(COL.audiences.tenant, req.tenantId)
    .order("size", { ascending: false, nullsFirst: false })
    .limit(500);

  if (isTypeMismatch(error)) {
    console.warn(`[DASHBOARD] ${COL.audiences.table}.${COL.audiences.tenant} is not a uuid column: returning no audiences`);
    return res.json({ totalAudiences: 0, totalContacts: 0, largest: [] });
  }
  if (error) throw error;

  const rows = (data || []).map((a) => ({ id: a.id, name: a.name, size: num(a.size) }));
  res.json({
    totalAudiences: count ?? rows.length,
    totalContacts: rows.reduce((s, a) => s + a.size, 0), // overlapping audiences are double-counted
    largest: rows.slice(0, 5),
  });
}));

router.get("/chatbot-status", wrap(async (req, res) => {
  const { data, error } = await supabase
    .from(COL.chatbots.table)
    .select("*")
    .eq(COL.chatbots.tenant, req.tenantId);

  if (isTypeMismatch(error)) {
    // chatbots.user_id is an integer, the logged-in id is a uuid: no safe link exists yet.
    // Return nothing rather than guess, which could expose another merchant's chatbots.
    console.warn(`[DASHBOARD] ${COL.chatbots.table}.${COL.chatbots.tenant} is not a uuid column: returning no chatbots`);
    return res.json({ total: 0, active: 0, chatbots: [] });
  }
  if (error) throw error;

  const bots = (data || []).map((b) => ({
    id: b.id,
    name: b.name ?? null,
    isActive: b.is_active === true,
    channels: Object.entries(b.channels || {}).filter(([, on]) => on === true).map(([k]) => k),
    scenarioCount: Array.isArray(b.scenarios) ? b.scenarios.length : 0,
    updatedAt: b.updated_at ?? null,
  }));
  res.json({ total: bots.length, active: bots.filter((b) => b.isActive).length, chatbots: bots });
}));

module.exports = router;