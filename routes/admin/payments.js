const express = require('express');
const mongoose = require('mongoose');
const { protect, adminOnly } = require('../../middleware/auth');
const router = express.Router();

// Apply admin authentication to all routes
router.use(protect);
router.use(adminOnly);

// Get all payments (admin view with pagination)
router.post('/get_all_payments', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, payment_status, payment_method, sort_by = 'created_at', sort_order = 'desc' } = req.body;

    const paymentsCollection = mongoose.connection.db.collection('payments');

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { order_id: { $regex: search, $options: 'i' } },
        { transaction_id: { $regex: search, $options: 'i' } },
        { customer_mobile: { $regex: search } }
      ];
    }
    if (payment_status) query.payment_status = payment_status;
    if (payment_method) query.payment_method = payment_method;

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const totalCount = await paymentsCollection.countDocuments(query);

    // Get payments
    const payments = await paymentsCollection.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      message: payments.length > 0 ? 'Payments retrieved successfully' : 'No payments found',
      data: payments,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_payments: totalCount,
        per_page: parseInt(limit),
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1
      },
      filters: {
        search,
        payment_status,
        payment_method
      }
    });

  } catch (error) {
    console.error('Error getting all payments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get payment by ID
router.post('/get_payment_by_id', async (req, res) => {
  try {
    const { payment_id } = req.body;

    if (!payment_id) {
      return res.status(400).json({
        success: false,
        message: 'payment_id is required'
      });
    }

    const paymentsCollection = mongoose.connection.db.collection('payments');

    const payment = await paymentsCollection.findOne({
      _id: new mongoose.Types.ObjectId(payment_id)
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      message: 'Payment retrieved successfully',
      data: payment
    });

  } catch (error) {
    console.error('Error getting payment by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update payment status
router.post('/update_payment_status', async (req, res) => {
  try {
    const { payment_id, payment_status, payment_notes } = req.body;

    if (!payment_id || !payment_status) {
      return res.status(400).json({
        success: false,
        message: 'payment_id and payment_status are required'
      });
    }

    const paymentsCollection = mongoose.connection.db.collection('payments');

    // Check if payment exists
    const existingPayment = await paymentsCollection.findOne({
      _id: new mongoose.Types.ObjectId(payment_id)
    });

    if (!existingPayment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Build update object
    const updateData = {
      payment_status: payment_status,
      updated_at: new Date()
    };

    if (payment_notes !== undefined) updateData.payment_notes = payment_notes;

    // Add status change timestamp
    const statusField = `status_${payment_status.toLowerCase()}_at`;
    updateData[statusField] = new Date();

    const result = await paymentsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(payment_id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes made to payment'
      });
    }

    // Get updated payment
    const updatedPayment = await paymentsCollection.findOne({
      _id: new mongoose.Types.ObjectId(payment_id)
    });

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: updatedPayment
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status'
    });
  }
});

// Bulk update payment statuses
router.post('/bulk_update_payment_status', async (req, res) => {
  try {
    const { payment_ids, payment_status, payment_notes } = req.body;

    if (!payment_ids || !Array.isArray(payment_ids) || payment_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'payment_ids array is required and cannot be empty'
      });
    }

    if (!payment_status) {
      return res.status(400).json({
        success: false,
        message: 'payment_status is required'
      });
    }

    const paymentsCollection = mongoose.connection.db.collection('payments');

    // Convert string IDs to ObjectIds
    const objectIds = payment_ids.map(id => new mongoose.Types.ObjectId(id));

    // Build update object
    const updateData = {
      payment_status: payment_status,
      updated_at: new Date()
    };

    if (payment_notes !== undefined) updateData.payment_notes = payment_notes;

    // Add status change timestamp
    const statusField = `status_${payment_status.toLowerCase()}_at`;
    updateData[statusField] = new Date();

    const result = await paymentsCollection.updateMany(
      { _id: { $in: objectIds } },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: `Bulk update completed. ${result.modifiedCount} payments updated.`,
      data: {
        matched_count: result.matchedCount,
        modified_count: result.modifiedCount,
        payment_ids: payment_ids,
        new_status: payment_status
      }
    });

  } catch (error) {
    console.error('Error bulk updating payment statuses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update payment statuses'
    });
  }
});

// Get payment statistics
router.post('/get_payment_stats', async (req, res) => {
  try {
    const paymentsCollection = mongoose.connection.db.collection('payments');

    // Get total payments count
    const totalPayments = await paymentsCollection.countDocuments();

    // Get payments by status
    const completedPayments = await paymentsCollection.countDocuments({ payment_status: 'completed' });
    const pendingPayments = await paymentsCollection.countDocuments({ payment_status: 'pending' });
    const failedPayments = await paymentsCollection.countDocuments({ payment_status: 'failed' });
    const refundedPayments = await paymentsCollection.countDocuments({ payment_status: 'refunded' });

    // Get payments by method
    const onlinePayments = await paymentsCollection.countDocuments({ payment_method: 'online' });
    const codPayments = await paymentsCollection.countDocuments({ payment_method: 'cod' });
    const walletPayments = await paymentsCollection.countDocuments({ payment_method: 'wallet' });

    // Calculate total amount by status
    const completedAmountAggregate = await paymentsCollection.aggregate([
      { $match: { payment_status: 'completed' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]).toArray();

    const pendingAmountAggregate = await paymentsCollection.aggregate([
      { $match: { payment_status: 'pending' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]).toArray();

    const refundedAmountAggregate = await paymentsCollection.aggregate([
      { $match: { payment_status: 'refunded' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]).toArray();

    const completedAmount = completedAmountAggregate.length > 0 ? completedAmountAggregate[0].totalAmount : 0;
    const pendingAmount = pendingAmountAggregate.length > 0 ? pendingAmountAggregate[0].totalAmount : 0;
    const refundedAmount = refundedAmountAggregate.length > 0 ? refundedAmountAggregate[0].totalAmount : 0;

    // Get recent payments (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPayments = await paymentsCollection.countDocuments({
      created_at: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      message: 'Payment statistics retrieved successfully',
      data: {
        total_payments: totalPayments,
        payments_by_status: {
          completed: completedPayments,
          pending: pendingPayments,
          failed: failedPayments,
          refunded: refundedPayments
        },
        payments_by_method: {
          online: onlinePayments,
          cod: codPayments,
          wallet: walletPayments
        },
        amounts: {
          completed_amount: completedAmount,
          pending_amount: pendingAmount,
          refunded_amount: refundedAmount
        },
        recent_payments: recentPayments
      }
    });

  } catch (error) {
    console.error('Error getting payment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment statistics'
    });
  }
});

// Process refund
router.post('/process_refund', async (req, res) => {
  try {
    const { payment_id, refund_amount, refund_reason, refund_notes } = req.body;

    if (!payment_id || !refund_amount) {
      return res.status(400).json({
        success: false,
        message: 'payment_id and refund_amount are required'
      });
    }

    const paymentsCollection = mongoose.connection.db.collection('payments');

    // Check if payment exists
    const existingPayment = await paymentsCollection.findOne({
      _id: new mongoose.Types.ObjectId(payment_id)
    });

    if (!existingPayment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (existingPayment.payment_status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded'
      });
    }

    const refundAmount = parseFloat(refund_amount);
    if (refundAmount > existingPayment.amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed payment amount'
      });
    }

    // Build update object
    const updateData = {
      payment_status: 'refunded',
      refund_amount: refundAmount,
      refund_reason: refund_reason || '',
      refund_notes: refund_notes || '',
      refunded_at: new Date(),
      updated_at: new Date()
    };

    const result = await paymentsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(payment_id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to process refund'
      });
    }

    // Get updated payment
    const updatedPayment = await paymentsCollection.findOne({
      _id: new mongoose.Types.ObjectId(payment_id)
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: updatedPayment
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund'
    });
  }
});

// Get payments by date range
router.post('/get_payments_by_date_range', async (req, res) => {
  try {
    const { start_date, end_date, page = 1, limit = 50 } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required'
      });
    }

    const paymentsCollection = mongoose.connection.db.collection('payments');

    const query = {
      created_at: {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      }
    };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const totalCount = await paymentsCollection.countDocuments(query);

    // Get payments
    const payments = await paymentsCollection.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      message: payments.length > 0 ? 'Payments retrieved successfully' : 'No payments found in date range',
      data: payments,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_payments: totalCount,
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
    console.error('Error getting payments by date range:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== PAYMENT MODES CRUD ENDPOINTS =====

// Get all payment modes
router.post('/get_all_payment_modes', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, is_enabled, sort_by = 'payment_mode_name', sort_order = 'asc' } = req.body;

    const paymentModesCollection = mongoose.connection.db.collection('paymentmodes');

    // Build query
    const query = {};
    if (search) {
      query.payment_mode_name = { $regex: search, $options: 'i' };
    }
    if (is_enabled !== undefined) {
      query.is_enabled = is_enabled ? 'Yes' : 'No';
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const totalCount = await paymentModesCollection.countDocuments(query);

    // Get payment modes
    const paymentModes = await paymentModesCollection.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      message: paymentModes.length > 0 ? 'Payment modes retrieved successfully' : 'No payment modes found',
      data: paymentModes,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_payment_modes: totalCount,
        per_page: parseInt(limit),
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1
      },
      filters: {
        search,
        is_enabled
      }
    });

  } catch (error) {
    console.error('Error getting all payment modes:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get payment mode by ID
router.post('/get_payment_mode_by_id', async (req, res) => {
  try {
    const { payment_mode_id } = req.body;

    if (!payment_mode_id) {
      return res.status(400).json({
        success: false,
        message: 'payment_mode_id is required'
      });
    }

    const paymentModesCollection = mongoose.connection.db.collection('paymentmodes');

    const paymentMode = await paymentModesCollection.findOne({
      _id: new mongoose.Types.ObjectId(payment_mode_id)
    });

    if (!paymentMode) {
      return res.status(404).json({
        success: false,
        message: 'Payment mode not found'
      });
    }

    res.json({
      success: true,
      message: 'Payment mode retrieved successfully',
      data: paymentMode
    });

  } catch (error) {
    console.error('Error getting payment mode by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create payment mode
router.post('/create_payment_mode', async (req, res) => {
  try {
    const { payment_mode_name, is_enabled = true } = req.body;

    // Validate required fields
    if (!payment_mode_name) {
      return res.status(400).json({
        success: false,
        message: 'payment_mode_name is required'
      });
    }

    const paymentModesCollection = mongoose.connection.db.collection('paymentmodes');

    // Check if payment mode already exists
    const existingPaymentMode = await paymentModesCollection.findOne({
      payment_mode_name: payment_mode_name.trim()
    });

    if (existingPaymentMode) {
      return res.status(400).json({
        success: false,
        message: 'Payment mode with this name already exists'
      });
    }

    // Create new payment mode
    const newPaymentMode = {
      payment_mode_name: payment_mode_name.trim(),
      is_enabled: is_enabled ? 'Yes' : 'No'
    };

    const result = await paymentModesCollection.insertOne(newPaymentMode);

    res.status(201).json({
      success: true,
      message: 'Payment mode created successfully',
      data: {
        _id: result.insertedId,
        ...newPaymentMode
      }
    });

  } catch (error) {
    console.error('Error creating payment mode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment mode'
    });
  }
});

// Update payment mode
router.post('/update_payment_mode', async (req, res) => {
  try {
    const { payment_mode_id, payment_mode_name, is_enabled } = req.body;

    if (!payment_mode_id) {
      return res.status(400).json({
        success: false,
        message: 'payment_mode_id is required'
      });
    }

    const paymentModesCollection = mongoose.connection.db.collection('paymentmodes');

    // Check if payment mode exists
    const existingPaymentMode = await paymentModesCollection.findOne({
      _id: new mongoose.Types.ObjectId(payment_mode_id)
    });

    if (!existingPaymentMode) {
      return res.status(404).json({
        success: false,
        message: 'Payment mode not found'
      });
    }

    // Check if name is being changed and if it's already taken
    if (payment_mode_name && payment_mode_name.trim() !== existingPaymentMode.payment_mode_name) {
      const duplicatePaymentMode = await paymentModesCollection.findOne({
        payment_mode_name: payment_mode_name.trim(),
        _id: { $ne: new mongoose.Types.ObjectId(payment_mode_id) }
      });
      if (duplicatePaymentMode) {
        return res.status(400).json({
          success: false,
          message: 'Payment mode name already exists'
        });
      }
    }

    // Build update data
    const updateData = {};
    if (payment_mode_name !== undefined) updateData.payment_mode_name = payment_mode_name.trim();
    if (is_enabled !== undefined) updateData.is_enabled = is_enabled ? 'Yes' : 'No';

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const result = await paymentModesCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(payment_mode_id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes made to payment mode'
      });
    }

    // Get updated payment mode
    const updatedPaymentMode = await paymentModesCollection.findOne({
      _id: new mongoose.Types.ObjectId(payment_mode_id)
    });

    res.json({
      success: true,
      message: 'Payment mode updated successfully',
      data: updatedPaymentMode
    });

  } catch (error) {
    console.error('Error updating payment mode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment mode'
    });
  }
});

// Delete payment mode
router.post('/delete_payment_mode', async (req, res) => {
  try {
    const { payment_mode_id } = req.body;

    if (!payment_mode_id) {
      return res.status(400).json({
        success: false,
        message: 'payment_mode_id is required'
      });
    }

    const paymentModesCollection = mongoose.connection.db.collection('paymentmodes');

    // Check if payment mode exists
    const existingPaymentMode = await paymentModesCollection.findOne({
      _id: new mongoose.Types.ObjectId(payment_mode_id)
    });

    if (!existingPaymentMode) {
      return res.status(404).json({
        success: false,
        message: 'Payment mode not found'
      });
    }

    const result = await paymentModesCollection.deleteOne({
      _id: new mongoose.Types.ObjectId(payment_mode_id)
    });

    if (result.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete payment mode'
      });
    }

    res.json({
      success: true,
      message: 'Payment mode deleted successfully',
      data: {
        deleted_payment_mode_id: payment_mode_id,
        deleted_payment_mode: existingPaymentMode
      }
    });

  } catch (error) {
    console.error('Error deleting payment mode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment mode'
    });
  }
});

module.exports = router;
