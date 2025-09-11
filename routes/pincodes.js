const express = require('express');
const router = express.Router();
const Pincode = require('../models/Pincode');
const PincodeStore = require('../models/PincodeStore');

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

module.exports = router;
