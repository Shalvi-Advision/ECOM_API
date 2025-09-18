const express = require('express');
const mongoose = require('mongoose');
const { protect, adminOnly } = require('../../middleware/auth');
const router = express.Router();

// Apply admin authentication to all routes
router.use(protect);
router.use(adminOnly);

// Get all delivery slots
router.post('/get_all_delivery_slots', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, store_code, is_active, sort_by = 'delivery_slot_from', sort_order = 'asc' } = req.body;

    const deliverySlotsCollection = mongoose.connection.db.collection('deliveryslots');

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { store_code: { $regex: search, $options: 'i' } },
        { delivery_slot_from: { $regex: search } },
        { delivery_slot_to: { $regex: search } }
      ];
    }
    if (store_code) query.store_code = store_code;
    if (is_active !== undefined) {
      query.is_active = is_active ? 'yes' : 'no';
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const totalCount = await deliverySlotsCollection.countDocuments(query);

    // Get delivery slots
    const deliverySlots = await deliverySlotsCollection.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      message: deliverySlots.length > 0 ? 'Delivery slots retrieved successfully' : 'No delivery slots found',
      data: deliverySlots,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_delivery_slots: totalCount,
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
    console.error('Error getting all delivery slots:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get delivery slot by ID
router.post('/get_delivery_slot_by_id', async (req, res) => {
  try {
    const { delivery_slot_id } = req.body;

    if (!delivery_slot_id) {
      return res.status(400).json({
        success: false,
        message: 'delivery_slot_id is required'
      });
    }

    const deliverySlotsCollection = mongoose.connection.db.collection('deliveryslots');

    const deliverySlot = await deliverySlotsCollection.findOne({
      _id: new mongoose.Types.ObjectId(delivery_slot_id)
    });

    if (!deliverySlot) {
      return res.status(404).json({
        success: false,
        message: 'Delivery slot not found'
      });
    }

    res.json({
      success: true,
      message: 'Delivery slot retrieved successfully',
      data: deliverySlot
    });

  } catch (error) {
    console.error('Error getting delivery slot by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create delivery slot
router.post('/create_delivery_slot', async (req, res) => {
  try {
    const {
      delivery_slot_from,
      delivery_slot_to,
      store_code,
      is_active = true
    } = req.body;

    // Validate required fields
    if (!delivery_slot_from || !delivery_slot_to || !store_code) {
      return res.status(400).json({
        success: false,
        message: 'delivery_slot_from, delivery_slot_to, and store_code are required'
      });
    }

    const deliverySlotsCollection = mongoose.connection.db.collection('deliveryslots');

    // Validate time format (HH:MM:SS)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (!timeRegex.test(delivery_slot_from) || !timeRegex.test(delivery_slot_to)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Use HH:MM:SS format (e.g., 09:00:00)'
      });
    }

    // Check if delivery slot already exists for this store and time range
    const existingSlot = await deliverySlotsCollection.findOne({
      store_code: store_code.trim(),
      delivery_slot_from: delivery_slot_from,
      delivery_slot_to: delivery_slot_to
    });

    if (existingSlot) {
      return res.status(400).json({
        success: false,
        message: 'Delivery slot with same time range already exists for this store'
      });
    }

    // Create new delivery slot
    const newDeliverySlot = {
      delivery_slot_from: delivery_slot_from,
      delivery_slot_to: delivery_slot_to,
      store_code: store_code.trim(),
      is_active: is_active ? 'yes' : 'no'
    };

    const result = await deliverySlotsCollection.insertOne(newDeliverySlot);

    res.status(201).json({
      success: true,
      message: 'Delivery slot created successfully',
      data: {
        _id: result.insertedId,
        ...newDeliverySlot
      }
    });

  } catch (error) {
    console.error('Error creating delivery slot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create delivery slot'
    });
  }
});

// Update delivery slot
router.post('/update_delivery_slot', async (req, res) => {
  try {
    const {
      delivery_slot_id,
      delivery_slot_from,
      delivery_slot_to,
      store_code,
      is_active
    } = req.body;

    if (!delivery_slot_id) {
      return res.status(400).json({
        success: false,
        message: 'delivery_slot_id is required'
      });
    }

    const deliverySlotsCollection = mongoose.connection.db.collection('deliveryslots');

    // Check if delivery slot exists
    const existingSlot = await deliverySlotsCollection.findOne({
      _id: new mongoose.Types.ObjectId(delivery_slot_id)
    });

    if (!existingSlot) {
      return res.status(404).json({
        success: false,
        message: 'Delivery slot not found'
      });
    }

    // Validate time format if being updated
    if (delivery_slot_from || delivery_slot_to) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
      if (delivery_slot_from && !timeRegex.test(delivery_slot_from)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid delivery_slot_from format. Use HH:MM:SS format'
        });
      }
      if (delivery_slot_to && !timeRegex.test(delivery_slot_to)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid delivery_slot_to format. Use HH:MM:SS format'
        });
      }
    }

    // Check for conflicts if time range or store code is being changed
    if ((delivery_slot_from !== existingSlot.delivery_slot_from ||
         delivery_slot_to !== existingSlot.delivery_slot_to ||
         store_code !== existingSlot.store_code) &&
        delivery_slot_from && delivery_slot_to && store_code) {

      const conflictSlot = await deliverySlotsCollection.findOne({
        store_code: store_code.trim(),
        delivery_slot_from: delivery_slot_from,
        delivery_slot_to: delivery_slot_to,
        _id: { $ne: new mongoose.Types.ObjectId(delivery_slot_id) }
      });

      if (conflictSlot) {
        return res.status(400).json({
          success: false,
          message: 'Another delivery slot with same time range already exists for this store'
        });
      }
    }

    // Build update data
    const updateData = {};
    if (delivery_slot_from !== undefined) updateData.delivery_slot_from = delivery_slot_from;
    if (delivery_slot_to !== undefined) updateData.delivery_slot_to = delivery_slot_to;
    if (store_code !== undefined) updateData.store_code = store_code.trim();
    if (is_active !== undefined) updateData.is_active = is_active ? 'yes' : 'no';

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const result = await deliverySlotsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(delivery_slot_id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes made to delivery slot'
      });
    }

    // Get updated delivery slot
    const updatedSlot = await deliverySlotsCollection.findOne({
      _id: new mongoose.Types.ObjectId(delivery_slot_id)
    });

    res.json({
      success: true,
      message: 'Delivery slot updated successfully',
      data: updatedSlot
    });

  } catch (error) {
    console.error('Error updating delivery slot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery slot'
    });
  }
});

// Delete delivery slot
router.post('/delete_delivery_slot', async (req, res) => {
  try {
    const { delivery_slot_id } = req.body;

    if (!delivery_slot_id) {
      return res.status(400).json({
        success: false,
        message: 'delivery_slot_id is required'
      });
    }

    const deliverySlotsCollection = mongoose.connection.db.collection('deliveryslots');

    // Check if delivery slot exists
    const existingSlot = await deliverySlotsCollection.findOne({
      _id: new mongoose.Types.ObjectId(delivery_slot_id)
    });

    if (!existingSlot) {
      return res.status(404).json({
        success: false,
        message: 'Delivery slot not found'
      });
    }

    const result = await deliverySlotsCollection.deleteOne({
      _id: new mongoose.Types.ObjectId(delivery_slot_id)
    });

    if (result.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete delivery slot'
      });
    }

    res.json({
      success: true,
      message: 'Delivery slot deleted successfully',
      data: {
        deleted_delivery_slot_id: delivery_slot_id,
        deleted_delivery_slot: existingSlot
      }
    });

  } catch (error) {
    console.error('Error deleting delivery slot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete delivery slot'
    });
  }
});

module.exports = router;
