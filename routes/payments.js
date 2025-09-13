const express = require('express');
const router = express.Router();
const PaymentMode = require('../models/PaymentMode');
const PaymentStatus = require('../models/PaymentStatus');
const { body, validationResult } = require('express-validator');
const adminAuth = require('../middleware/adminAuth');

/**
 * @swagger
 * /payments/modes:
 *   get:
 *     tags:
 *       - Payments
 *     summary: Get payment modes
 *     description: Retrieve all available payment modes
 *     responses:
 *       200:
 *         description: Payment modes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64f1a2b3c4d5e6f7g8h9i0j9"
 *                       idpayment_mode:
 *                         type: string
 *                         example: "1"
 *                       payment_mode:
 *                         type: string
 *                         example: "Online Payment"
 *                       is_enabled:
 *                         type: string
 *                         example: "Yes"
 *                       sequence_id:
 *                         type: number
 *                         example: 1
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags:
 *       - Payments
 *     summary: Create payment mode (Admin only)
 *     description: Create a new payment mode
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_mode
 *             properties:
 *               payment_mode:
 *                 type: string
 *                 example: "Credit Card"
 *               is_enabled:
 *                 type: string
 *                 example: "Yes"
 *               sequence_id:
 *                 type: number
 *                 example: 1
 *     responses:
 *       201:
 *         description: Payment mode created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment mode created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64f1a2b3c4d5e6f7g8h9i0j9"
 *                     idpayment_mode:
 *                       type: string
 *                       example: "1"
 *                     payment_mode:
 *                       type: string
 *                       example: "Credit Card"
 *                     is_enabled:
 *                       type: string
 *                       example: "Yes"
 *                     sequence_id:
 *                       type: number
 *                       example: 1
 *       400:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * /payments/statuses:
 *   get:
 *     tags:
 *       - Payments
 *     summary: Get payment statuses
 *     description: Retrieve all available payment statuses
 *     responses:
 *       200:
 *         description: Payment statuses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64f1a2b3c4d5e6f7g8h9i0j10"
 *                       idpayment_status:
 *                         type: string
 *                         example: "1"
 *                       payment_status:
 *                         type: string
 *                         example: "Pending"
 *                       sequence_id:
 *                         type: number
 *                         example: 1
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags:
 *       - Payments
 *     summary: Create payment status (Admin only)
 *     description: Create a new payment status
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_status
 *             properties:
 *               payment_status:
 *                 type: string
 *                 example: "Processing"
 *               sequence_id:
 *                 type: number
 *                 example: 1
 *     responses:
 *       201:
 *         description: Payment status created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment status created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64f1a2b3c4d5e6f7g8h9i0j10"
 *                     idpayment_status:
 *                       type: string
 *                       example: "1"
 *                     payment_status:
 *                       type: string
 *                       example: "Processing"
 *                     sequence_id:
 *                       type: number
 *                       example: 1
 *       400:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Get all payment modes
router.get('/modes', async (req, res) => {
  try {
    const paymentModes = await PaymentMode.find({ is_enabled: 'Yes' })
      .sort({ idpayment_mode: 1 })
      .lean();

    res.json({
      success: true,
      data: paymentModes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment modes',
      error: error.message
    });
  }
});

// Get all payment statuses
router.get('/statuses', async (req, res) => {
  try {
    const paymentStatuses = await PaymentStatus.find({ is_enabled: 'Yes' })
      .sort({ idpayment_status: 1 })
      .lean();

    res.json({
      success: true,
      data: paymentStatuses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment statuses',
      error: error.message
    });
  }
});

// ==================== ADMIN CRUD ROUTES ====================

// ==================== PAYMENT MODES ADMIN ROUTES ====================

// Create new payment mode (Admin only)
router.post('/modes', adminAuth, [
  body('payment_mode_name').notEmpty().withMessage('Payment mode name is required'),
  body('idpayment_mode').isInt({ min: 1 }).withMessage('Valid payment mode ID is required'),
  body('is_enabled').isIn(['Yes', 'No']).withMessage('Valid status is required')
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

    const {
      payment_mode_name,
      idpayment_mode,
      payment_mode_description,
      is_enabled = 'Yes'
    } = req.body;

    // Check if payment mode ID already exists
    const existingMode = await PaymentMode.findOne({ idpayment_mode });
    if (existingMode) {
      return res.status(400).json({
        success: false,
        message: 'Payment mode ID already exists'
      });
    }

    const paymentMode = new PaymentMode({
      payment_mode_name,
      idpayment_mode,
      payment_mode_description,
      is_enabled
    });

    await paymentMode.save();

    res.status(201).json({
      success: true,
      message: 'Payment mode created successfully',
      data: paymentMode
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating payment mode',
      error: error.message
    });
  }
});

// Update payment mode (Admin only)
router.put('/modes/:id', adminAuth, [
  body('payment_mode_name').optional().notEmpty().withMessage('Payment mode name cannot be empty'),
  body('is_enabled').optional().isIn(['Yes', 'No']).withMessage('Valid status is required')
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

    const paymentMode = await PaymentMode.findById(req.params.id);
    if (!paymentMode) {
      return res.status(404).json({
        success: false,
        message: 'Payment mode not found'
      });
    }

    // Update fields
    const updateFields = ['payment_mode_name', 'payment_mode_description', 'is_enabled'];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        paymentMode[field] = req.body[field];
      }
    });

    await paymentMode.save();

    res.json({
      success: true,
      message: 'Payment mode updated successfully',
      data: paymentMode
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating payment mode',
      error: error.message
    });
  }
});

// Delete payment mode (Admin only)
router.delete('/modes/:id', adminAuth, async (req, res) => {
  try {
    const paymentMode = await PaymentMode.findById(req.params.id);
    if (!paymentMode) {
      return res.status(404).json({
        success: false,
        message: 'Payment mode not found'
      });
    }

    await PaymentMode.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Payment mode deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting payment mode',
      error: error.message
    });
  }
});

// Get all payment modes for admin (including disabled)
router.get('/admin/modes', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      is_enabled,
      search 
    } = req.query;
    
    const filter = {};
    if (is_enabled) filter.is_enabled = is_enabled;
    if (search) {
      filter.$or = [
        { payment_mode_name: { $regex: search, $options: 'i' } },
        { payment_mode_description: { $regex: search, $options: 'i' } }
      ];
    }

    const paymentModes = await PaymentMode.find(filter)
      .sort({ idpayment_mode: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await PaymentMode.countDocuments(filter);

    res.json({
      success: true,
      data: {
        paymentModes,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_modes: total,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment modes',
      error: error.message
    });
  }
});

// Toggle payment mode status (Admin only)
router.patch('/modes/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const paymentMode = await PaymentMode.findById(req.params.id);
    if (!paymentMode) {
      return res.status(404).json({
        success: false,
        message: 'Payment mode not found'
      });
    }

    paymentMode.is_enabled = paymentMode.is_enabled === 'Yes' ? 'No' : 'Yes';
    await paymentMode.save();

    res.json({
      success: true,
      message: `Payment mode ${paymentMode.is_enabled === 'Yes' ? 'enabled' : 'disabled'} successfully`,
      data: {
        id: paymentMode._id,
        is_enabled: paymentMode.is_enabled
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling payment mode status',
      error: error.message
    });
  }
});

// ==================== PAYMENT STATUSES ADMIN ROUTES ====================

// Create new payment status (Admin only)
router.post('/statuses', adminAuth, [
  body('payment_status_name').notEmpty().withMessage('Payment status name is required'),
  body('idpayment_status').isInt({ min: 1 }).withMessage('Valid payment status ID is required'),
  body('is_enabled').isIn(['Yes', 'No']).withMessage('Valid status is required')
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

    const {
      payment_status_name,
      idpayment_status,
      payment_status_description,
      is_enabled = 'Yes'
    } = req.body;

    // Check if payment status ID already exists
    const existingStatus = await PaymentStatus.findOne({ idpayment_status });
    if (existingStatus) {
      return res.status(400).json({
        success: false,
        message: 'Payment status ID already exists'
      });
    }

    const paymentStatus = new PaymentStatus({
      payment_status_name,
      idpayment_status,
      payment_status_description,
      is_enabled
    });

    await paymentStatus.save();

    res.status(201).json({
      success: true,
      message: 'Payment status created successfully',
      data: paymentStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating payment status',
      error: error.message
    });
  }
});

// Update payment status (Admin only)
router.put('/statuses/:id', adminAuth, [
  body('payment_status_name').optional().notEmpty().withMessage('Payment status name cannot be empty'),
  body('is_enabled').optional().isIn(['Yes', 'No']).withMessage('Valid status is required')
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

    const paymentStatus = await PaymentStatus.findById(req.params.id);
    if (!paymentStatus) {
      return res.status(404).json({
        success: false,
        message: 'Payment status not found'
      });
    }

    // Update fields
    const updateFields = ['payment_status_name', 'payment_status_description', 'is_enabled'];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        paymentStatus[field] = req.body[field];
      }
    });

    await paymentStatus.save();

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: paymentStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating payment status',
      error: error.message
    });
  }
});

// Delete payment status (Admin only)
router.delete('/statuses/:id', adminAuth, async (req, res) => {
  try {
    const paymentStatus = await PaymentStatus.findById(req.params.id);
    if (!paymentStatus) {
      return res.status(404).json({
        success: false,
        message: 'Payment status not found'
      });
    }

    await PaymentStatus.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Payment status deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting payment status',
      error: error.message
    });
  }
});

// Get all payment statuses for admin (including disabled)
router.get('/admin/statuses', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      is_enabled,
      search 
    } = req.query;
    
    const filter = {};
    if (is_enabled) filter.is_enabled = is_enabled;
    if (search) {
      filter.$or = [
        { payment_status_name: { $regex: search, $options: 'i' } },
        { payment_status_description: { $regex: search, $options: 'i' } }
      ];
    }

    const paymentStatuses = await PaymentStatus.find(filter)
      .sort({ idpayment_status: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await PaymentStatus.countDocuments(filter);

    res.json({
      success: true,
      data: {
        paymentStatuses,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_statuses: total,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment statuses',
      error: error.message
    });
  }
});

// Toggle payment status (Admin only)
router.patch('/statuses/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const paymentStatus = await PaymentStatus.findById(req.params.id);
    if (!paymentStatus) {
      return res.status(404).json({
        success: false,
        message: 'Payment status not found'
      });
    }

    paymentStatus.is_enabled = paymentStatus.is_enabled === 'Yes' ? 'No' : 'Yes';
    await paymentStatus.save();

    res.json({
      success: true,
      message: `Payment status ${paymentStatus.is_enabled === 'Yes' ? 'enabled' : 'disabled'} successfully`,
      data: {
        id: paymentStatus._id,
        is_enabled: paymentStatus.is_enabled
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling payment status',
      error: error.message
    });
  }
});

module.exports = router;
