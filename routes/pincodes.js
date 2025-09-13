const express = require('express');
const router = express.Router();
const Pincode = require('../models/Pincode');
const PincodeStore = require('../models/PincodeStore');
const { body, validationResult } = require('express-validator');
const adminAuth = require('../middleware/adminAuth');

/**
 * @swagger
 * /pincodes:
 *   get:
 *     tags:
 *       - Pincodes
 *     summary: Get all pincodes
 *     description: Retrieve a list of all pincodes with optional filtering
 *     parameters:
 *       - in: query
 *         name: is_enabled
 *         schema:
 *           type: string
 *         description: Filter by enabled status
 *     responses:
 *       200:
 *         description: Pincodes retrieved successfully
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
 *                         example: "64f1a2b3c4d5e6f7g8h9i0j8"
 *                       pincode:
 *                         type: string
 *                         example: "421002"
 *                       is_enabled:
 *                         type: string
 *                         example: "Enabled"
 *                       city:
 *                         type: string
 *                         example: "Kalyan"
 *                       state:
 *                         type: string
 *                         example: "Maharashtra"
 *                       delivery_charge:
 *                         type: number
 *                         example: 0
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags:
 *       - Pincodes
 *     summary: Create a new pincode (Admin only)
 *     description: Create a new pincode for delivery service
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pincode
 *             properties:
 *               pincode:
 *                 type: string
 *                 example: "421002"
 *               is_enabled:
 *                 type: string
 *                 example: "Enabled"
 *               city:
 *                 type: string
 *                 example: "Kalyan"
 *               state:
 *                 type: string
 *                 example: "Maharashtra"
 *               delivery_charge:
 *                 type: number
 *                 example: 0
 *     responses:
 *       201:
 *         description: Pincode created successfully
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
 *                   example: "Pincode created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64f1a2b3c4d5e6f7g8h9i0j8"
 *                     pincode:
 *                       type: string
 *                       example: "421002"
 *                     is_enabled:
 *                       type: string
 *                       example: "Enabled"
 *                     city:
 *                       type: string
 *                       example: "Kalyan"
 *                     state:
 *                       type: string
 *                       example: "Maharashtra"
 *                     delivery_charge:
 *                       type: number
 *                       example: 0
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
 * /pincodes/check/{pincode}:
 *   get:
 *     tags:
 *       - Pincodes
 *     summary: Check pincode serviceability
 *     description: Check if a pincode is serviceable for delivery
 *     parameters:
 *       - in: path
 *         name: pincode
 *         required: true
 *         schema:
 *           type: string
 *         description: Pincode to check
 *         example: "421002"
 *     responses:
 *       200:
 *         description: Pincode serviceability checked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     is_serviceable:
 *                       type: boolean
 *                       example: true
 *                     pincode:
 *                       type: object
 *                       properties:
 *                         pincode:
 *                           type: string
 *                           example: "421002"
 *                         is_enabled:
 *                           type: string
 *                           example: "Enabled"
 *                         city:
 *                           type: string
 *                           example: "Kalyan"
 *                         state:
 *                           type: string
 *                           example: "Maharashtra"
 *                     available_stores:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           store_code:
 *                             type: string
 *                             example: "AME"
 *                           store_name:
 *                             type: string
 *                             example: "Ambernath Store"
 *       404:
 *         description: Pincode not found
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
 * /pincodes/id/{id}:
 *   get:
 *     tags:
 *       - Pincodes
 *     summary: Get pincode by ID
 *     description: Retrieve a specific pincode by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pincode ID
 *         example: "64f1a2b3c4d5e6f7g8h9i0j8"
 *     responses:
 *       200:
 *         description: Pincode retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64f1a2b3c4d5e6f7g8h9i0j8"
 *                     pincode:
 *                       type: string
 *                       example: "421002"
 *                     is_enabled:
 *                       type: string
 *                       example: "Enabled"
 *                     city:
 *                       type: string
 *                       example: "Kalyan"
 *                     state:
 *                       type: string
 *                       example: "Maharashtra"
 *                     delivery_charge:
 *                       type: number
 *                       example: 0
 *       404:
 *         description: Pincode not found
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
 *   put:
 *     tags:
 *       - Pincodes
 *     summary: Update pincode (Admin only)
 *     description: Update an existing pincode
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pincode ID
 *         example: "64f1a2b3c4d5e6f7g8h9i0j8"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pincode:
 *                 type: string
 *                 example: "421002"
 *               is_enabled:
 *                 type: string
 *                 example: "Enabled"
 *               city:
 *                 type: string
 *                 example: "Updated City"
 *               state:
 *                 type: string
 *                 example: "Updated State"
 *               delivery_charge:
 *                 type: number
 *                 example: 50
 *     responses:
 *       200:
 *         description: Pincode updated successfully
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
 *                   example: "Pincode updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64f1a2b3c4d5e6f7g8h9i0j8"
 *                     pincode:
 *                       type: string
 *                       example: "421002"
 *                     is_enabled:
 *                       type: string
 *                       example: "Enabled"
 *                     city:
 *                       type: string
 *                       example: "Updated City"
 *                     state:
 *                       type: string
 *                       example: "Updated State"
 *                     delivery_charge:
 *                       type: number
 *                       example: 50
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Pincode not found
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
 *   delete:
 *     tags:
 *       - Pincodes
 *     summary: Delete pincode (Admin only)
 *     description: Delete a pincode from the system
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pincode ID
 *         example: "64f1a2b3c4d5e6f7g8h9i0j8"
 *     responses:
 *       200:
 *         description: Pincode deleted successfully
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
 *                   example: "Pincode deleted successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Pincode not found
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

// Get all pincodes
router.get('/', async (req, res) => {
  try {
    const { is_enabled } = req.query;
    
    const filter = {};
    if (is_enabled) filter.is_enabled = is_enabled;

    const pincodes = await Pincode.find(filter)
      .sort({ pincode: 1 })
      .lean();

    res.json({
      success: true,
      data: pincodes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pincodes',
      error: error.message
    });
  }
});

// Check if pincode is serviceable
router.get('/check/:pincode', async (req, res) => {
  try {
    const { pincode } = req.params;
    
    const pincodeData = await Pincode.findOne({ 
      pincode: pincode,
      is_enabled: 'Enabled'
    });

    if (!pincodeData) {
      return res.json({
        success: true,
        data: {
          is_serviceable: false,
          message: 'Pincode not serviceable'
        }
      });
    }

    // Get available stores for this pincode
    const stores = await PincodeStore.find({ 
      pincode: pincode,
      is_active: true
    }).lean();

    res.json({
      success: true,
      data: {
        is_serviceable: true,
        pincode: pincodeData,
        available_stores: stores
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking pincode',
      error: error.message
    });
  }
});

// Get pincode by ID
router.get('/id/:id', async (req, res) => {
  try {
    const pincode = await Pincode.findById(req.params.id);

    if (!pincode) {
      return res.status(404).json({
        success: false,
        message: 'Pincode not found'
      });
    }

    res.json({
      success: true,
      data: pincode
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pincode',
      error: error.message
    });
  }
});

// ==================== ADMIN CRUD ROUTES ====================

// Create new pincode (Admin only)
router.post('/', adminAuth, [
  body('pincode').isPostalCode('IN').withMessage('Valid pincode is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('is_enabled').isIn(['Enabled', 'Disabled']).withMessage('Valid status is required')
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
      pincode,
      city,
      state,
      area,
      is_enabled = 'Enabled'
    } = req.body;

    // Check if pincode already exists
    const existingPincode = await Pincode.findOne({ pincode });
    if (existingPincode) {
      return res.status(400).json({
        success: false,
        message: 'Pincode already exists'
      });
    }

    const pincodeData = new Pincode({
      pincode,
      city,
      state,
      area,
      is_enabled
    });

    await pincodeData.save();

    res.status(201).json({
      success: true,
      message: 'Pincode created successfully',
      data: pincodeData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating pincode',
      error: error.message
    });
  }
});

// Update pincode (Admin only)
router.put('/:id', adminAuth, [
  body('pincode').optional().isPostalCode('IN').withMessage('Valid pincode is required'),
  body('city').optional().notEmpty().withMessage('City cannot be empty'),
  body('state').optional().notEmpty().withMessage('State cannot be empty'),
  body('is_enabled').optional().isIn(['Enabled', 'Disabled']).withMessage('Valid status is required')
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

    const pincode = await Pincode.findById(req.params.id);
    if (!pincode) {
      return res.status(404).json({
        success: false,
        message: 'Pincode not found'
      });
    }

    // Check if pincode already exists (excluding current pincode)
    if (req.body.pincode && req.body.pincode !== pincode.pincode) {
      const existingPincode = await Pincode.findOne({
        pincode: req.body.pincode,
        _id: { $ne: req.params.id }
      });
      if (existingPincode) {
        return res.status(400).json({
          success: false,
          message: 'Pincode already exists'
        });
      }
    }

    // Update fields
    const updateFields = ['pincode', 'city', 'state', 'area', 'is_enabled'];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        pincode[field] = req.body[field];
      }
    });

    await pincode.save();

    res.json({
      success: true,
      message: 'Pincode updated successfully',
      data: pincode
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating pincode',
      error: error.message
    });
  }
});

// Delete pincode (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const pincode = await Pincode.findById(req.params.id);
    if (!pincode) {
      return res.status(404).json({
        success: false,
        message: 'Pincode not found'
      });
    }

    await Pincode.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Pincode deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting pincode',
      error: error.message
    });
  }
});

// Get all pincodes for admin (including disabled)
router.get('/admin/all', adminAuth, async (req, res) => {
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
        { pincode: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } },
        { area: { $regex: search, $options: 'i' } }
      ];
    }

    const pincodes = await Pincode.find(filter)
      .sort({ pincode: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Pincode.countDocuments(filter);

    res.json({
      success: true,
      data: {
        pincodes,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_pincodes: total,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pincodes',
      error: error.message
    });
  }
});

// Toggle pincode status (Admin only)
router.patch('/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const pincode = await Pincode.findById(req.params.id);
    if (!pincode) {
      return res.status(404).json({
        success: false,
        message: 'Pincode not found'
      });
    }

    pincode.is_enabled = pincode.is_enabled === 'Enabled' ? 'Disabled' : 'Enabled';
    await pincode.save();

    res.json({
      success: true,
      message: `Pincode ${pincode.is_enabled === 'Enabled' ? 'enabled' : 'disabled'} successfully`,
      data: {
        id: pincode._id,
        is_enabled: pincode.is_enabled
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling pincode status',
      error: error.message
    });
  }
});

// ==================== PINCODE STORE ADMIN ROUTES ====================

// Create pincode store mapping (Admin only)
router.post('/store', adminAuth, [
  body('pincode').isPostalCode('IN').withMessage('Valid pincode is required'),
  body('store_code').notEmpty().withMessage('Store code is required'),
  body('is_active').isBoolean().withMessage('Valid active status is required')
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

    const { pincode, store_code, is_active = true } = req.body;

    // Check if pincode exists
    const pincodeData = await Pincode.findOne({ pincode });
    if (!pincodeData) {
      return res.status(400).json({
        success: false,
        message: 'Pincode not found'
      });
    }

    // Check if mapping already exists
    const existingMapping = await PincodeStore.findOne({ pincode, store_code });
    if (existingMapping) {
      return res.status(400).json({
        success: false,
        message: 'Pincode store mapping already exists'
      });
    }

    const pincodeStore = new PincodeStore({
      pincode,
      store_code,
      is_active
    });

    await pincodeStore.save();

    res.status(201).json({
      success: true,
      message: 'Pincode store mapping created successfully',
      data: pincodeStore
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating pincode store mapping',
      error: error.message
    });
  }
});

// Get pincode store mappings (Admin only)
router.get('/admin/stores', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      pincode,
      store_code,
      is_active 
    } = req.query;
    
    const filter = {};
    if (pincode) filter.pincode = pincode;
    if (store_code) filter.store_code = store_code;
    if (is_active !== undefined) filter.is_active = is_active === 'true';

    const mappings = await PincodeStore.find(filter)
      .sort({ pincode: 1, store_code: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await PincodeStore.countDocuments(filter);

    res.json({
      success: true,
      data: {
        mappings,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_mappings: total,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pincode store mappings',
      error: error.message
    });
  }
});

// Delete pincode store mapping (Admin only)
router.delete('/store/:id', adminAuth, async (req, res) => {
  try {
    const mapping = await PincodeStore.findById(req.params.id);
    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Pincode store mapping not found'
      });
    }

    await PincodeStore.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Pincode store mapping deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting pincode store mapping',
      error: error.message
    });
  }
});

module.exports = router;
