const express = require('express');
const router  = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

// ✅ Generates a truly unique order number — avoids duplicate key constraint
const generateOrderNumber = () =>
  `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

// -------------------
// GET all orders
// -------------------
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        delivery_companies(id, name)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ orders: data });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: { message: 'Failed to get orders', status: 500 } });
  }
});

// -------------------
// GET single order
// -------------------
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) return res.status(404).json({ error: { message: 'Order not found', status: 404 } });
    res.json({ order: data });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: { message: 'Failed to get order', status: 500 } });
  }
});

// -------------------
// POST create order
// -------------------
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { client_name, client_email, amount, status, delivery_company_id } = req.body;

    if (!client_name || !amount) {
      return res.status(400).json({
        error: { message: 'client_name and amount are required', status: 400 }
      });
    }

    // ✅ Always generate a fresh unique order_number — never trust the client-supplied one
    // because resubmitting the same form would send the same value and hit the unique constraint
    const order_number = generateOrderNumber();

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        user_id:             req.user.id,
        client_name,
        client_email:        client_email || '',
        amount,
        status:              status || 'pending',
        delivery_company_id: delivery_company_id ? parseInt(delivery_company_id) : null,
        order_number,        // ✅ always a fresh unique value
        created_at:          new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Order created successfully', order: data });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: { message: 'Failed to create order', status: 500 } });
  }
});

// -------------------
// PUT update order
// -------------------
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { client_name, client_email, amount, status, delivery_company_id } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (client_name        !== undefined) updateData.client_name        = client_name;
    if (client_email       !== undefined) updateData.client_email       = client_email;
    if (amount             !== undefined) updateData.amount             = amount;
    if (status             !== undefined) updateData.status             = status;
    if (delivery_company_id !== undefined) updateData.delivery_company_id = parseInt(delivery_company_id);

    // ✅ Never update order_number — it's immutable once created
    // Removing it from the update payload prevents the duplicate key error

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Order updated successfully', order: data });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: { message: 'Failed to update order', status: 500 } });
  }
});

// -------------------
// DELETE order
// -------------------
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: { message: 'Failed to delete order', status: 500 } });
  }
});

module.exports = router;