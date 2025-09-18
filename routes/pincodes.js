const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Check if pincode exists
router.post('/check_if_pincode_exists', async (req, res) => {
  try {
    const { pincode, project_code } = req.body;

    if (!pincode || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'Pincode and project_code are required'
      });
    }

    const pincodesCollection = mongoose.connection.db.collection('pincodes');
    const pincodeStoreCollection = mongoose.connection.db.collection('pincodestores');

    // Check if pincode exists in pincodes collection
    const pincodeData = await pincodesCollection.findOne({
      pincode: pincode.toString()
    });

    if (!pincodeData) {
      return res.json({
        success: false,
        message: 'Pincode not found',
        data: null
      });
    }

    // Check if pincode has associated stores
    const storeData = await pincodeStoreCollection.findOne({
      pincode: pincode.toString()
    });

    res.json({
      success: !!storeData,
      message: storeData ? 'Pincode is serviceable' : 'Pincode not serviceable',
      data: {
        pincode: pincodeData,
        stores: storeData ? [storeData] : []
      }
    });

  } catch (error) {
    console.error('Error checking pincode:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Check if new order received
router.post('/check_if_new_order_received', async (req, res) => {
  try {
    // This would typically check for new orders
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'No new orders',
      has_new_orders: false,
      new_orders_count: 0
    });
  } catch (error) {
    console.error('Error checking new orders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pincode wise outlet
router.post('/get_pincodewise_outlet', async (req, res) => {
  try {
    const { pincode, project_code } = req.body;

    if (!pincode || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'Pincode and project_code are required'
      });
    }

    const pincodeStoreCollection = mongoose.connection.db.collection('pincodestores');

    const stores = await pincodeStoreCollection.find({
      pincode: pincode.toString()
    }).toArray();

    res.json({
      success: true,
      message: stores.length > 0 ? 'Stores found' : 'No stores found for this pincode',
      data: stores
    });

  } catch (error) {
    console.error('Error getting pincode wise outlet:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get store details
router.post('/get_store_details', async (req, res) => {
  try {
    const { store_code, project_code } = req.body;

    if (!store_code || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'Store code and project_code are required'
      });
    }

    const pincodeStoreCollection = mongoose.connection.db.collection('pincodestores');

    const store = await pincodeStoreCollection.findOne({
      store_code: store_code
    });

    if (!store) {
      return res.json({
        success: false,
        message: 'Store not found',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Store details retrieved successfully',
      data: store
    });

  } catch (error) {
    console.error('Error getting store details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pincode list
router.get('/get_pincode_list', async (req, res) => {
  try {
    const pincodesCollection = mongoose.connection.db.collection('pincodes');

    const pincodes = await pincodesCollection.find({}).toArray();

    res.json({
      success: true,
      message: 'Pincode list retrieved successfully',
      data: pincodes
    });

  } catch (error) {
    console.error('Error getting pincode list:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Check outlet status
router.post('/check_outlet_status', async (req, res) => {
  try {
    const { store_code } = req.body;

    if (!store_code) {
      return res.status(400).json({
        success: false,
        message: 'Store code is required'
      });
    }

    const pincodeStoreCollection = mongoose.connection.db.collection('pincodestores');

    const store = await pincodeStoreCollection.findOne({
      store_code: store_code
    });

    res.json({
      success: !!store,
      message: store ? 'Outlet is active' : 'Outlet not found or inactive',
      data: store ? { status: 'active', store: store } : null
    });

  } catch (error) {
    console.error('Error checking outlet status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
