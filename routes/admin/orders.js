const express = require('express');
const mongoose = require('mongoose');
const { protect, adminOnly } = require('../../middleware/auth');
const router = express.Router();

// Apply admin authentication to all routes
router.use(protect);
router.use(adminOnly);

// Get all orders (admin view with pagination)
router.post('/get_all_orders', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, order_status, payment_status, sort_by = 'created_at', sort_order = 'desc' } = req.body;

    const ordersCollection = mongoose.connection.db.collection('orders');

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { order_id: { $regex: search, $options: 'i' } },
        { customer_mobile: { $regex: search } },
        { customer_name: { $regex: search, $options: 'i' } }
      ];
    }
    if (order_status) query.order_status = order_status;
    if (payment_status) query.payment_status = payment_status;

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const totalCount = await ordersCollection.countDocuments(query);

    // Get orders
    const orders = await ordersCollection.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      message: orders.length > 0 ? 'Orders retrieved successfully' : 'No orders found',
      data: orders,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_orders: totalCount,
        per_page: parseInt(limit),
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1
      },
      filters: {
        search,
        order_status,
        payment_status
      }
    });

  } catch (error) {
    console.error('Error getting all orders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get order by ID
router.post('/get_order_by_id', async (req, res) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: 'order_id is required'
      });
    }

    const ordersCollection = mongoose.connection.db.collection('orders');

    const order = await ordersCollection.findOne({
      order_id: order_id.toString()
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order retrieved successfully',
      data: order
    });

  } catch (error) {
    console.error('Error getting order by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update order status
router.post('/update_order_status', async (req, res) => {
  try {
    const { order_id, order_status, delivery_notes } = req.body;

    if (!order_id || !order_status) {
      return res.status(400).json({
        success: false,
        message: 'order_id and order_status are required'
      });
    }

    const ordersCollection = mongoose.connection.db.collection('orders');

    // Check if order exists
    const existingOrder = await ordersCollection.findOne({
      order_id: order_id.toString()
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Build update object
    const updateData = {
      order_status: order_status,
      updated_at: new Date()
    };

    if (delivery_notes !== undefined) updateData.delivery_notes = delivery_notes;

    // Add status change timestamp
    const statusField = `status_${order_status.toLowerCase()}_at`;
    updateData[statusField] = new Date();

    const result = await ordersCollection.updateOne(
      { order_id: order_id.toString() },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes made to order'
      });
    }

    // Get updated order
    const updatedOrder = await ordersCollection.findOne({
      order_id: order_id.toString()
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

// Update payment status
router.post('/update_payment_status', async (req, res) => {
  try {
    const { order_id, payment_status, payment_notes } = req.body;

    if (!order_id || !payment_status) {
      return res.status(400).json({
        success: false,
        message: 'order_id and payment_status are required'
      });
    }

    const ordersCollection = mongoose.connection.db.collection('orders');

    // Check if order exists
    const existingOrder = await ordersCollection.findOne({
      order_id: order_id.toString()
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Build update object
    const updateData = {
      payment_status: payment_status,
      updated_at: new Date()
    };

    if (payment_notes !== undefined) updateData.payment_notes = payment_notes;

    // Add payment status change timestamp
    const paymentField = `payment_${payment_status.toLowerCase()}_at`;
    updateData[paymentField] = new Date();

    const result = await ordersCollection.updateOne(
      { order_id: order_id.toString() },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes made to order'
      });
    }

    // Get updated order
    const updatedOrder = await ordersCollection.findOne({
      order_id: order_id.toString()
    });

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: updatedOrder
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status'
    });
  }
});

// Bulk update order statuses
router.post('/bulk_update_order_status', async (req, res) => {
  try {
    const { order_ids, order_status, delivery_notes } = req.body;

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'order_ids array is required and cannot be empty'
      });
    }

    if (!order_status) {
      return res.status(400).json({
        success: false,
        message: 'order_status is required'
      });
    }

    const ordersCollection = mongoose.connection.db.collection('orders');

    // Build query to match orders by order_id strings
    const query = {
      order_id: { $in: order_ids.map(id => id.toString()) }
    };

    // Build update object
    const updateData = {
      order_status: order_status,
      updated_at: new Date()
    };

    if (delivery_notes !== undefined) updateData.delivery_notes = delivery_notes;

    // Add status change timestamp
    const statusField = `status_${order_status.toLowerCase()}_at`;
    updateData[statusField] = new Date();

    const result = await ordersCollection.updateMany(
      query,
      { $set: updateData }
    );

    res.json({
      success: true,
      message: `Bulk update completed. ${result.modifiedCount} orders updated.`,
      data: {
        matched_count: result.matchedCount,
        modified_count: result.modifiedCount,
        order_ids: order_ids,
        new_status: order_status
      }
    });

  } catch (error) {
    console.error('Error bulk updating order statuses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update order statuses'
    });
  }
});

// Get order statistics
router.post('/get_order_stats', async (req, res) => {
  try {
    const ordersCollection = mongoose.connection.db.collection('orders');

    // Get total orders count
    const totalOrders = await ordersCollection.countDocuments();

    // Get orders by status
    const pendingOrders = await ordersCollection.countDocuments({ order_status: 'pending' });
    const confirmedOrders = await ordersCollection.countDocuments({ order_status: 'confirmed' });
    const preparingOrders = await ordersCollection.countDocuments({ order_status: 'preparing' });
    const readyOrders = await ordersCollection.countDocuments({ order_status: 'ready' });
    const deliveredOrders = await ordersCollection.countDocuments({ order_status: 'delivered' });
    const cancelledOrders = await ordersCollection.countDocuments({ order_status: 'cancelled' });

    // Get orders by payment status
    const paidOrders = await ordersCollection.countDocuments({ payment_status: 'paid' });
    const pendingPaymentOrders = await ordersCollection.countDocuments({ payment_status: 'pending' });
    const failedPaymentOrders = await ordersCollection.countDocuments({ payment_status: 'failed' });

    // Get recent orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentOrders = await ordersCollection.countDocuments({
      created_at: { $gte: sevenDaysAgo }
    });

    // Calculate total revenue from delivered orders
    const deliveredOrderAggregate = await ordersCollection.aggregate([
      { $match: { order_status: 'delivered', payment_status: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total_amount' } } }
    ]).toArray();

    const totalRevenue = deliveredOrderAggregate.length > 0 ? deliveredOrderAggregate[0].totalRevenue : 0;

    res.json({
      success: true,
      message: 'Order statistics retrieved successfully',
      data: {
        total_orders: totalOrders,
        orders_by_status: {
          pending: pendingOrders,
          confirmed: confirmedOrders,
          preparing: preparingOrders,
          ready: readyOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders
        },
        orders_by_payment_status: {
          paid: paidOrders,
          pending: pendingPaymentOrders,
          failed: failedPaymentOrders
        },
        recent_orders: recentOrders,
        total_revenue: totalRevenue
      }
    });

  } catch (error) {
    console.error('Error getting order statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order statistics'
    });
  }
});

// Get orders by date range
router.post('/get_orders_by_date_range', async (req, res) => {
  try {
    const { start_date, end_date, page = 1, limit = 50 } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required'
      });
    }

    const ordersCollection = mongoose.connection.db.collection('orders');

    const query = {
      created_at: {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      }
    };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const totalCount = await ordersCollection.countDocuments(query);

    // Get orders
    const orders = await ordersCollection.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      message: orders.length > 0 ? 'Orders retrieved successfully' : 'No orders found in date range',
      data: orders,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_orders: totalCount,
        per_page: parseInt(limit),
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1
      },
      date_range: {
        start_date: start_date,
        end_date: end_date
      }
    });

  } catch (error) {
    console.error('Error getting orders by date range:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
