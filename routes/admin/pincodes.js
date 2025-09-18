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
    const { page = 1, limit = 50, search, store_code, is_active, sort_by = 'pincode', sort_order = 'asc' } = req.body;

    const pincodesCollection = mongoose.connection.db.collection('pincodes');

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { pincode: { $regex: search } },
        { area_name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } }
      ];
    }
    if (store_code) query.store_code = store_code;
    if (is_active !== undefined) query.is_active = Boolean(is_active);

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

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      message: pincodes.length > 0 ? 'Pincodes retrieved successfully' : 'No pincodes found',
      data: pincodes,
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
        store_code,
        is_active
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

    const pincode = await pincodesCollection.findOne({
      _id: new mongoose.Types.ObjectId(pincode_id)
    });

    if (!pincode) {
      return res.status(404).json({
        success: false,
        message: 'Pincode not found'
      });
    }

    res.json({
      success: true,
      message: 'Pincode retrieved successfully',
      data: pincode
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
      area_name,
      city,
      state,
      district,
      store_code,
      delivery_charge = 0,
      min_order_amount = 0,
      estimated_delivery_days = 1,
      is_active = true
    } = req.body;

    // Validate required fields
    if (!pincode || !area_name || !city || !state) {
      return res.status(400).json({
        success: false,
        message: 'pincode, area_name, city, and state are required'
      });
    }

    const pincodesCollection = mongoose.connection.db.collection('pincodes');

    // Check if pincode already exists for this store
    const existingPincode = await pincodesCollection.findOne({
      pincode: pincode.toString(),
      store_code: store_code || ''
    });
    if (existingPincode) {
      return res.status(400).json({
        success: false,
        message: 'Pincode already exists for this store'
      });
    }

    // Create new pincode
    const newPincode = {
      pincode: pincode.toString(),
      area_name,
      city,
      state,
      district: district || '',
      store_code: store_code || '',
      delivery_charge: parseFloat(delivery_charge),
      min_order_amount: parseFloat(min_order_amount),
      estimated_delivery_days: parseInt(estimated_delivery_days),
      is_active: Boolean(is_active),
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await pincodesCollection.insertOne(newPincode);

    res.status(201).json({
      success: true,
      message: 'Pincode created successfully',
      data: {
        _id: result.insertedId,
        ...newPincode
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
      area_name,
      city,
      state,
      district,
      store_code,
      delivery_charge,
      min_order_amount,
      estimated_delivery_days,
      is_active
    } = req.body;

    if (!pincode_id) {
      return res.status(400).json({
        success: false,
        message: 'pincode_id is required'
      });
    }

    const pincodesCollection = mongoose.connection.db.collection('pincodes');

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

    // Check if pincode is being changed and if it's already taken
    if (pincode && pincode !== existingPincode.pincode) {
      const duplicatePincode = await pincodesCollection.findOne({
        pincode: pincode.toString(),
        store_code: store_code || existingPincode.store_code,
        _id: { $ne: new mongoose.Types.ObjectId(pincode_id) }
      });
      if (duplicatePincode) {
        return res.status(400).json({
          success: false,
          message: 'Pincode already exists for this store'
        });
      }
    }

    // Build update object
    const updateData = {
      updated_at: new Date()
    };

    if (pincode !== undefined) updateData.pincode = pincode.toString();
    if (area_name !== undefined) updateData.area_name = area_name;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (district !== undefined) updateData.district = district;
    if (store_code !== undefined) updateData.store_code = store_code;
    if (delivery_charge !== undefined) updateData.delivery_charge = parseFloat(delivery_charge);
    if (min_order_amount !== undefined) updateData.min_order_amount = parseFloat(min_order_amount);
    if (estimated_delivery_days !== undefined) updateData.estimated_delivery_days = parseInt(estimated_delivery_days);
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    const result = await pincodesCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(pincode_id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes made to pincode'
      });
    }

    // Get updated pincode
    const updatedPincode = await pincodesCollection.findOne({
      _id: new mongoose.Types.ObjectId(pincode_id)
    });

    res.json({
      success: true,
      message: 'Pincode updated successfully',
      data: updatedPincode
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
        deleted_pincode: existingPincode
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

    // Convert string IDs to ObjectIds
    const objectIds = pincode_ids.map(id => new mongoose.Types.ObjectId(id));

    // Add updated_at timestamp
    const bulkUpdateData = {
      ...update_data,
      updated_at: new Date()
    };

    const result = await pincodesCollection.updateMany(
      { _id: { $in: objectIds } },
      { $set: bulkUpdateData }
    );

    res.json({
      success: true,
      message: `Bulk update completed. ${result.modifiedCount} pincodes updated.`,
      data: {
        matched_count: result.matchedCount,
        modified_count: result.modifiedCount,
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

    const query = {
      pincode: pincode.toString(),
      is_active: true
    };

    if (store_code) query.store_code = store_code;

    const pincodeData = await pincodesCollection.findOne(query);

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

    res.json({
      success: true,
      message: 'Pincode is serviceable',
      data: {
        ...pincodeData,
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
