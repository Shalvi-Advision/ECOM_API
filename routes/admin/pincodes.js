const express = require('express');
const mongoose = require('mongoose');
const { protect, adminOnly } = require('../../middleware/auth');
const router = express.Router();

// Apply admin authentication to all routes
router.use(protect);
router.use(adminOnly);

// Get all pincodes (admin view with pagination)
router.post('/get_all_pincodes', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, store_code, sort_by = 'pincode', sort_order = 'asc' } = req.body;

    const pincodesCollection = mongoose.connection.db.collection('pincodes');
    const pincodeStoresCollection = mongoose.connection.db.collection('pincodestores');

    // Build query for pincodes collection
    const query = {};
    if (search) {
      query.pincode = { $regex: search };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const totalCount = await pincodesCollection.countDocuments(query);

    // Get pincodes
    const pincodes = await pincodesCollection.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    // Get associated store data for each pincode
    const enrichedPincodes = await Promise.all(
      pincodes.map(async (pincode) => {
        const stores = await pincodeStoresCollection.find({
          pincode: pincode.pincode
        }).toArray();

        return {
          ...pincode,
          stores: stores,
          is_active: pincode.is_enabled === 'Enabled',
          created_at: pincode._id.getTimestamp(),
          updated_at: pincode._id.getTimestamp()
        };
      })
    );

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      message: enrichedPincodes.length > 0 ? 'Pincodes retrieved successfully' : 'No pincodes found',
      data: enrichedPincodes,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_pincodes: totalCount,
        per_page: parseInt(limit),
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1
      },
      filters: {
        search,
        store_code
      }
    });

  } catch (error) {
    console.error('Error getting all pincodes:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pincode by ID
router.post('/get_pincode_by_id', async (req, res) => {
  try {
    const { pincode_id } = req.body;

    if (!pincode_id) {
      return res.status(400).json({
        success: false,
        message: 'pincode_id is required'
      });
    }

    const pincodesCollection = mongoose.connection.db.collection('pincodes');
    const pincodeStoresCollection = mongoose.connection.db.collection('pincodestores');

    const pincode = await pincodesCollection.findOne({
      _id: new mongoose.Types.ObjectId(pincode_id)
    });

    if (!pincode) {
      return res.status(404).json({
        success: false,
        message: 'Pincode not found'
      });
    }

    // Get associated store data
    const stores = await pincodeStoresCollection.find({
      pincode: pincode.pincode
    }).toArray();

    const enrichedPincode = {
      ...pincode,
      stores: stores,
      is_active: pincode.is_enabled === 'Enabled',
      created_at: pincode._id.getTimestamp(),
      updated_at: pincode._id.getTimestamp()
    };

    res.json({
      success: true,
      message: 'Pincode retrieved successfully',
      data: enrichedPincode
    });

  } catch (error) {
    console.error('Error getting pincode by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new pincode
router.post('/create_pincode', async (req, res) => {
  try {
    const {
      pincode,
      store_code,
      mobile_outlet_name,
      store_address,
      min_order_amount = 0,
      store_open_time,
      store_delivery_time,
      store_offer_name,
      latitude,
      longitude,
      home_delivery = 'yes',
      self_pickup = 'no',
      store_message,
      contact_number,
      email,
      is_enabled = 'Enabled'
    } = req.body;

    // Validate required fields
    if (!pincode) {
      return res.status(400).json({
        success: false,
        message: 'pincode is required'
      });
    }

    const pincodesCollection = mongoose.connection.db.collection('pincodes');
    const pincodeStoresCollection = mongoose.connection.db.collection('pincodestores');

    // Check if pincode already exists
    const existingPincode = await pincodesCollection.findOne({
      pincode: pincode.toString()
    });

    let pincodeResult;
    if (!existingPincode) {
      // Create new pincode entry
      const newPincode = {
        pincode: pincode.toString(),
        is_enabled: is_enabled ? 'Enabled' : 'Disabled'
      };
      pincodeResult = await pincodesCollection.insertOne(newPincode);
    }

    // Create store-specific entry if store data is provided
    let storeResult = null;
    if (store_code) {
      // Check if store entry already exists for this pincode
      const existingStoreEntry = await pincodeStoresCollection.findOne({
        pincode: pincode.toString(),
        store_code: store_code
      });

      if (existingStoreEntry) {
        return res.status(400).json({
          success: false,
          message: 'Store entry already exists for this pincode'
        });
      }

      const newStoreEntry = {
        pincode: pincode.toString(),
        store_code: store_code,
        mobile_outlet_name: mobile_outlet_name || '',
        store_address: store_address || '',
        min_order_amount: parseInt(min_order_amount) || 0,
        store_open_time: store_open_time || '',
        store_delivery_time: store_delivery_time || '',
        store_offer_name: store_offer_name || '',
        latitude: latitude || '',
        longitude: longitude || '',
        home_delivery: home_delivery || 'yes',
        self_pickup: self_pickup || 'no',
        store_message: store_message || '',
        contact_number: contact_number || '',
        email: email || '',
        is_enabled: is_enabled ? 'Enabled' : 'Disabled'
      };

      storeResult = await pincodeStoresCollection.insertOne(newStoreEntry);
    }

    res.status(201).json({
      success: true,
      message: 'Pincode created successfully',
      data: {
        pincode: {
          _id: pincodeResult?.insertedId,
          pincode: pincode.toString(),
          is_enabled: is_enabled ? 'Enabled' : 'Disabled'
        },
        store: storeResult ? {
          _id: storeResult.insertedId,
          ...req.body
        } : null
      }
    });

  } catch (error) {
    console.error('Error creating pincode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create pincode'
    });
  }
});

// Update pincode
router.post('/update_pincode', async (req, res) => {
  try {
    const {
      pincode_id,
      pincode,
      store_code,
      mobile_outlet_name,
      store_address,
      min_order_amount,
      store_open_time,
      store_delivery_time,
      store_offer_name,
      latitude,
      longitude,
      home_delivery,
      self_pickup,
      store_message,
      contact_number,
      email,
      is_enabled
    } = req.body;

    if (!pincode_id) {
      return res.status(400).json({
        success: false,
        message: 'pincode_id is required'
      });
    }

    const pincodesCollection = mongoose.connection.db.collection('pincodes');
    const pincodeStoresCollection = mongoose.connection.db.collection('pincodestores');

    // Check if pincode exists
    const existingPincode = await pincodesCollection.findOne({
      _id: new mongoose.Types.ObjectId(pincode_id)
    });

    if (!existingPincode) {
      return res.status(404).json({
        success: false,
        message: 'Pincode not found'
      });
    }

    // Update pincode data
    const pincodeUpdateData = {};
    if (pincode !== undefined) pincodeUpdateData.pincode = pincode.toString();
    if (is_enabled !== undefined) pincodeUpdateData.is_enabled = is_enabled ? 'Enabled' : 'Disabled';

    let pincodeResult = null;
    if (Object.keys(pincodeUpdateData).length > 0) {
      pincodeResult = await pincodesCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(pincode_id) },
        { $set: pincodeUpdateData }
      );
    }

    // Update or create store data if store_code is provided
    let storeResult = null;
    if (store_code) {
      const storeUpdateData = {};
      if (mobile_outlet_name !== undefined) storeUpdateData.mobile_outlet_name = mobile_outlet_name;
      if (store_address !== undefined) storeUpdateData.store_address = store_address;
      if (min_order_amount !== undefined) storeUpdateData.min_order_amount = parseInt(min_order_amount);
      if (store_open_time !== undefined) storeUpdateData.store_open_time = store_open_time;
      if (store_delivery_time !== undefined) storeUpdateData.store_delivery_time = store_delivery_time;
      if (store_offer_name !== undefined) storeUpdateData.store_offer_name = store_offer_name;
      if (latitude !== undefined) storeUpdateData.latitude = latitude;
      if (longitude !== undefined) storeUpdateData.longitude = longitude;
      if (home_delivery !== undefined) storeUpdateData.home_delivery = home_delivery;
      if (self_pickup !== undefined) storeUpdateData.self_pickup = self_pickup;
      if (store_message !== undefined) storeUpdateData.store_message = store_message;
      if (contact_number !== undefined) storeUpdateData.contact_number = contact_number;
      if (email !== undefined) storeUpdateData.email = email;
      if (is_enabled !== undefined) storeUpdateData.is_enabled = is_enabled ? 'Enabled' : 'Disabled';

      // Check if store entry exists
      const existingStoreEntry = await pincodeStoresCollection.findOne({
        pincode: existingPincode.pincode,
        store_code: store_code
      });

      if (existingStoreEntry) {
        // Update existing store entry
        storeResult = await pincodeStoresCollection.updateOne(
          { pincode: existingPincode.pincode, store_code: store_code },
          { $set: storeUpdateData }
        );
      } else {
        // Create new store entry
        const newStoreEntry = {
          pincode: existingPincode.pincode,
          store_code: store_code,
          ...storeUpdateData
        };
        storeResult = await pincodeStoresCollection.insertOne(newStoreEntry);
      }
    }

    // Get updated pincode with store data
    const updatedPincode = await pincodesCollection.findOne({
      _id: new mongoose.Types.ObjectId(pincode_id)
    });

    const stores = await pincodeStoresCollection.find({
      pincode: updatedPincode.pincode
    }).toArray();

    const enrichedPincode = {
      ...updatedPincode,
      stores: stores,
      is_active: updatedPincode.is_enabled === 'Enabled',
      created_at: updatedPincode._id.getTimestamp(),
      updated_at: new Date()
    };

    res.json({
      success: true,
      message: 'Pincode updated successfully',
      data: enrichedPincode
    });

  } catch (error) {
    console.error('Error updating pincode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pincode'
    });
  }
});

// Delete pincode
router.post('/delete_pincode', async (req, res) => {
  try {
    const { pincode_id } = req.body;

    if (!pincode_id) {
      return res.status(400).json({
        success: false,
        message: 'pincode_id is required'
      });
    }

    const pincodesCollection = mongoose.connection.db.collection('pincodes');
    const pincodeStoresCollection = mongoose.connection.db.collection('pincodestores');

    // Check if pincode exists
    const existingPincode = await pincodesCollection.findOne({
      _id: new mongoose.Types.ObjectId(pincode_id)
    });

    if (!existingPincode) {
      return res.status(404).json({
        success: false,
        message: 'Pincode not found'
      });
    }

    // Get associated store data before deletion
    const stores = await pincodeStoresCollection.find({
      pincode: existingPincode.pincode
    }).toArray();

    // Delete store entries first
    await pincodeStoresCollection.deleteMany({
      pincode: existingPincode.pincode
    });

    // Delete pincode entry
    const result = await pincodesCollection.deleteOne({
      _id: new mongoose.Types.ObjectId(pincode_id)
    });

    if (result.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete pincode'
      });
    }

    res.json({
      success: true,
      message: 'Pincode deleted successfully',
      data: {
        deleted_pincode_id: pincode_id,
        deleted_pincode: existingPincode,
        deleted_stores: stores
      }
    });

  } catch (error) {
    console.error('Error deleting pincode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pincode'
    });
  }
});

// Bulk update pincodes
router.post('/bulk_update_pincodes', async (req, res) => {
  try {
    const { pincode_ids, update_data } = req.body;

    if (!pincode_ids || !Array.isArray(pincode_ids) || pincode_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'pincode_ids array is required and cannot be empty'
      });
    }

    if (!update_data || Object.keys(update_data).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'update_data is required'
      });
    }

    const pincodesCollection = mongoose.connection.db.collection('pincodes');
    const pincodeStoresCollection = mongoose.connection.db.collection('pincodestores');

    // Convert string IDs to ObjectIds
    const objectIds = pincode_ids.map(id => new mongoose.Types.ObjectId(id));

    // Get the pincodes to find their pincode values
    const pincodes = await pincodesCollection.find({
      _id: { $in: objectIds }
    }).toArray();

    const pincodeValues = pincodes.map(p => p.pincode);

    // Update pincodes collection
    const pincodeUpdateData = {};
    if (update_data.is_enabled !== undefined) {
      pincodeUpdateData.is_enabled = update_data.is_enabled ? 'Enabled' : 'Disabled';
    }

    let pincodeResult = { matchedCount: 0, modifiedCount: 0 };
    if (Object.keys(pincodeUpdateData).length > 0) {
      pincodeResult = await pincodesCollection.updateMany(
        { _id: { $in: objectIds } },
        { $set: pincodeUpdateData }
      );
    }

    // Update store data if store-related fields are provided
    let storeResult = { matchedCount: 0, modifiedCount: 0 };
    const storeUpdateData = {};
    if (update_data.min_order_amount !== undefined) storeUpdateData.min_order_amount = parseInt(update_data.min_order_amount);
    if (update_data.home_delivery !== undefined) storeUpdateData.home_delivery = update_data.home_delivery;
    if (update_data.self_pickup !== undefined) storeUpdateData.self_pickup = update_data.self_pickup;
    if (update_data.is_enabled !== undefined) storeUpdateData.is_enabled = update_data.is_enabled ? 'Enabled' : 'Disabled';

    if (Object.keys(storeUpdateData).length > 0 && pincodeValues.length > 0) {
      storeResult = await pincodeStoresCollection.updateMany(
        { pincode: { $in: pincodeValues } },
        { $set: storeUpdateData }
      );
    }

    res.json({
      success: true,
      message: `Bulk update completed. ${pincodeResult.modifiedCount} pincodes and ${storeResult.modifiedCount} store entries updated.`,
      data: {
        pincode_updates: {
          matched_count: pincodeResult.matchedCount,
          modified_count: pincodeResult.modifiedCount
        },
        store_updates: {
          matched_count: storeResult.matchedCount,
          modified_count: storeResult.modifiedCount
        },
        pincode_ids: pincode_ids
      }
    });

  } catch (error) {
    console.error('Error bulk updating pincodes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update pincodes'
    });
  }
});

// Check pincode serviceability
router.post('/check_pincode_serviceability', async (req, res) => {
  try {
    const { pincode, store_code } = req.body;

    if (!pincode) {
      return res.status(400).json({
        success: false,
        message: 'pincode is required'
      });
    }

    const pincodesCollection = mongoose.connection.db.collection('pincodes');
    const pincodeStoresCollection = mongoose.connection.db.collection('pincodestores');

    // Check if pincode exists in pincodes collection
    const pincodeData = await pincodesCollection.findOne({
      pincode: pincode.toString(),
      is_enabled: 'Enabled'
    });

    if (!pincodeData) {
      return res.json({
        success: false,
        message: 'Pincode not serviceable',
        data: {
          pincode: pincode,
          is_serviceable: false
        }
      });
    }

    // Check if pincode has associated stores that are enabled
    const storeQuery = {
      pincode: pincode.toString(),
      is_enabled: 'Enabled'
    };

    if (store_code) {
      storeQuery.store_code = store_code;
    }

    const storeData = await pincodeStoresCollection.findOne(storeQuery);

    if (!storeData) {
      return res.json({
        success: false,
        message: 'Pincode not serviceable - no active stores found',
        data: {
          pincode: pincodeData,
          stores: [],
          is_serviceable: false
        }
      });
    }

    res.json({
      success: true,
      message: 'Pincode is serviceable',
      data: {
        pincode: pincodeData,
        stores: [storeData],
        is_serviceable: true
      }
    });

  } catch (error) {
    console.error('Error checking pincode serviceability:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
