const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message
    });
  }
};

// Create new order
router.post('/', authenticateToken, [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('delivery_address').isObject().withMessage('Delivery address is required'),
  body('payment_mode').notEmpty().withMessage('Payment mode is required'),
  body('store_code').notEmpty().withMessage('Store code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { items, delivery_address, payment_mode, store_code, delivery_slot, notes } = req.body;

    // Validate and calculate order items
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product with ID ${item.product_id} not found`
        });
      }

      if (product.store_quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${product.product_name}`
        });
      }

      const unitPrice = parseFloat(product.our_price.toString());
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        product_id: product._id,
        p_code: product.p_code,
        product_name: product.product_name,
        quantity: item.quantity,
        unit_price: product.our_price,
        total_price: totalPrice
      });
    }

    // Generate order ID
    const orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create order
    const order = new Order({
      order_id: orderId,
      user_id: req.user._id,
      items: orderItems,
      delivery_address,
      store_code,
      payment_mode,
      subtotal,
      total_amount: subtotal, // Add delivery charges if needed
      delivery_slot,
      notes
    });

    await order.save();

    // Update product quantities
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product_id,
        { $inc: { store_quantity: -item.quantity } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
});

// Get user orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { user_id: req.user._id };
    if (status) filter.order_status = status;

    const orders = await Order.find(filter)
      .populate('items.product_id', 'product_name pcode_img')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_orders: total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user_id: req.user._id
    })
      .populate('items.product_id', 'product_name pcode_img product_description brand_name')
      .populate('delivery_slot', 'slot_name start_time end_time');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
});

// Cancel order
router.put('/:id/cancel', authenticateToken, [
  body('reason').notEmpty().withMessage('Cancellation reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { reason } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      user_id: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.order_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }

    if (order.order_status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel delivered order'
      });
    }

    // Update order status
    order.order_status = 'cancelled';
    order.cancelled_reason = reason;
    await order.save();

    // Restore product quantities
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product_id,
        { $inc: { store_quantity: item.quantity } }
      );
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
});

// ==================== ADMIN ROUTES ====================

// Get all orders for admin
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      store_code,
      payment_mode,
      start_date,
      end_date,
      search
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.order_status = status;
    if (store_code) filter.store_code = store_code;
    if (payment_mode) filter.payment_mode = payment_mode;
    
    // Date range filter
    if (start_date || end_date) {
      filter.createdAt = {};
      if (start_date) filter.createdAt.$gte = new Date(start_date);
      if (end_date) filter.createdAt.$lte = new Date(end_date);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { order_id: { $regex: search, $options: 'i' } },
        { 'delivery_address.name': { $regex: search, $options: 'i' } },
        { 'delivery_address.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(filter)
      .populate('user_id', 'name email phone')
      .populate('items.product_id', 'product_name pcode_img')
      .populate('delivery_slot', 'slot_name start_time end_time')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_orders: total,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

// Get order by ID for admin
router.get('/admin/:id', adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user_id', 'name email phone addresses')
      .populate('items.product_id', 'product_name pcode_img product_description brand_name our_price')
      .populate('delivery_slot', 'slot_name start_time end_time');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
});

// Update order status (Admin only)
router.put('/admin/:id/status', adminAuth, [
  body('order_status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Valid order status is required'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { order_status, notes } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order status
    order.order_status = order_status;
    if (notes) order.admin_notes = notes;
    
    // Add status history
    if (!order.status_history) {
      order.status_history = [];
    }
    
    order.status_history.push({
      status: order_status,
      timestamp: new Date(),
      updated_by: req.user._id,
      notes: notes || ''
    });

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
});

// Update order details (Admin only)
router.put('/admin/:id', adminAuth, [
  body('delivery_address').optional().isObject().withMessage('Delivery address must be an object'),
  body('total_amount').optional().isNumeric().withMessage('Total amount must be a number'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update fields
    const updateFields = ['delivery_address', 'total_amount', 'notes'];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        order[field] = req.body[field];
      }
    });

    await order.save();

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating order',
      error: error.message
    });
  }
});

// Cancel order (Admin only)
router.put('/admin/:id/cancel', adminAuth, [
  body('reason').notEmpty().withMessage('Cancellation reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { reason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.order_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }

    if (order.order_status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel delivered order'
      });
    }

    // Update order status
    order.order_status = 'cancelled';
    order.cancelled_reason = reason;
    order.cancelled_by = req.user._id;
    order.cancelled_at = new Date();

    // Add status history
    if (!order.status_history) {
      order.status_history = [];
    }
    
    order.status_history.push({
      status: 'cancelled',
      timestamp: new Date(),
      updated_by: req.user._id,
      notes: `Cancelled by admin: ${reason}`
    });

    await order.save();

    // Restore product quantities
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product_id,
        { $inc: { store_quantity: item.quantity } }
      );
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
});

// Get order statistics for admin
router.get('/admin/statistics', adminAuth, async (req, res) => {
  try {
    const { start_date, end_date, store_code } = req.query;

    // Build filter object
    const filter = {};
    if (store_code) filter.store_code = store_code;
    
    if (start_date || end_date) {
      filter.createdAt = {};
      if (start_date) filter.createdAt.$gte = new Date(start_date);
      if (end_date) filter.createdAt.$lte = new Date(end_date);
    }

    // Get order counts by status
    const statusCounts = await Order.aggregate([
      { $match: filter },
      { $group: { _id: '$order_status', count: { $sum: 1 } } }
    ]);

    // Get total revenue
    const revenueStats = await Order.aggregate([
      { $match: { ...filter, order_status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total_revenue: { $sum: '$total_amount' }, total_orders: { $sum: 1 } } }
    ]);

    // Get recent orders count (last 7 days)
    const recentFilter = {
      ...filter,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    };
    const recentOrdersCount = await Order.countDocuments(recentFilter);

    res.json({
      success: true,
      data: {
        status_counts: statusCounts,
        revenue: revenueStats[0] || { total_revenue: 0, total_orders: 0 },
        recent_orders: recentOrdersCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order statistics',
      error: error.message
    });
  }
});

module.exports = router;
