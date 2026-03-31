const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

// -------------------
// Overview Analytics
// -------------------
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date ? new Date(start_date) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = end_date ? new Date(end_date) : new Date();

    // Orders
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    if (ordersError) throw ordersError;

    // Users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    if (usersError) throw usersError;

    // Campaigns
    const { data: campaigns, error: campaignsError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    if (campaignsError) throw campaignsError;

    // Calculations
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const totalRecipients = campaigns.reduce((sum, c) => sum + (c.recipients_count || 0), 0);
    const totalOpens = campaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0);

    const analytics = {
      orders: {
        total: totalOrders,
        revenue: orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0).toFixed(2),
        average_value: totalOrders > 0
          ? (orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) / totalOrders).toFixed(2)
          : 0,
        by_status: {
          pending: orders.filter(o => o.status === 'pending').length,
          processing: orders.filter(o => o.status === 'processing').length,
          delivered: deliveredOrders,
          cancelled: orders.filter(o => o.status === 'cancelled').length
        }
      },
      users: {
        new_users: users.length,
        total_users: users.length
      },
      campaigns: {
        total: campaigns.length,
        sent: campaigns.filter(c => c.status === 'sent').length,
        total_recipients,
        total_opens,
        total_clicks: campaigns.reduce((sum, c) => sum + (c.clicked_count || 0), 0)
      },
      avgOpenRate: totalRecipients > 0 ? ((totalOpens / totalRecipients) * 100).toFixed(2) : 0,
      avgConversionRate: totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(2) : 0
    };

    res.json({ analytics, period: { start_date: startDate, end_date: endDate } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: { message: 'Failed to get analytics' } });
  }
});

// -------------------
// Revenue Analytics
// -------------------
router.get('/revenue', authenticateToken, async (req, res) => {
  try {
    const { period = 'month', start_date, end_date } = req.query;
    const startDate = start_date ? new Date(start_date) : new Date(new Date().setMonth(new Date().getMonth() - 6));
    const endDate = end_date ? new Date(end_date) : new Date();

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('total, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at');
    if (error) throw error;

    const groupedData = groupByPeriod(orders, period);
    res.json({ revenue: groupedData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: { message: 'Failed to get revenue analytics' } });
  }
});

// -------------------
// Helper
// -------------------
function groupByPeriod(orders, period) {
  const grouped = {};
  orders.forEach(order => {
    const date = new Date(order.created_at);
    let key;
    if (period === 'day') key = date.toISOString().split('T')[0];
    else if (period === 'week') { const w = new Date(date); w.setDate(date.getDate() - date.getDay()); key = w.toISOString().split('T')[0]; }
    else if (period === 'month') key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    else if (period === 'year') key = date.getFullYear().toString();
    if (!grouped[key]) grouped[key] = { period: key, revenue: 0, orders: 0 };
    grouped[key].revenue += parseFloat(order.total) || 0;
    grouped[key].orders += 1;
  });
  return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
}

module.exports = router;
