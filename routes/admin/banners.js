const express = require('express');
const mongoose = require('mongoose');
const { protect, adminOnly } = require('../../middleware/auth');
const router = express.Router();

// Apply admin authentication to all routes
router.use(protect);
router.use(adminOnly);

// Get all banners (admin view with pagination)
router.post('/get_all_banners', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, banner_type, is_active, sort_by = 'sequence_id', sort_order = 'asc' } = req.body;

    const bannersCollection = mongoose.connection.db.collection('banners');

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { banner_title: { $regex: search, $options: 'i' } },
        { banner_description: { $regex: search, $options: 'i' } }
      ];
    }
    if (banner_type) query.banner_type = banner_type;
    if (is_active !== undefined) query.is_active = Boolean(is_active);

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const totalCount = await bannersCollection.countDocuments(query);

    // Get banners
    const banners = await bannersCollection.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      message: banners.length > 0 ? 'Banners retrieved successfully' : 'No banners found',
      data: banners,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_banners: totalCount,
        per_page: parseInt(limit),
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1
      },
      filters: {
        search,
        banner_type,
        is_active
      }
    });

  } catch (error) {
    console.error('Error getting all banners:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get banner by ID
router.post('/get_banner_by_id', async (req, res) => {
  try {
    const { banner_id } = req.body;

    if (!banner_id) {
      return res.status(400).json({
        success: false,
        message: 'banner_id is required'
      });
    }

    const bannersCollection = mongoose.connection.db.collection('banners');

    const banner = await bannersCollection.findOne({
      _id: new mongoose.Types.ObjectId(banner_id)
    });

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.json({
      success: true,
      message: 'Banner retrieved successfully',
      data: banner
    });

  } catch (error) {
    console.error('Error getting banner by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new banner
router.post('/create_banner', async (req, res) => {
  try {
    const {
      banner_title,
      banner_description,
      banner_image_url,
      banner_type,
      banner_link,
      sequence_id,
      is_active = true,
      start_date,
      end_date
    } = req.body;

    // Validate required fields
    if (!banner_title || !banner_image_url) {
      return res.status(400).json({
        success: false,
        message: 'banner_title and banner_image_url are required'
      });
    }

    const bannersCollection = mongoose.connection.db.collection('banners');

    // Create new banner
    const newBanner = {
      banner_title,
      banner_description: banner_description || '',
      banner_image_url,
      banner_type: banner_type || 'general',
      banner_link: banner_link || '',
      sequence_id: sequence_id ? parseInt(sequence_id) : 0,
      is_active: Boolean(is_active),
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await bannersCollection.insertOne(newBanner);

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: {
        _id: result.insertedId,
        ...newBanner
      }
    });

  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create banner'
    });
  }
});

// Update banner
router.post('/update_banner', async (req, res) => {
  try {
    const {
      banner_id,
      banner_title,
      banner_description,
      banner_image_url,
      banner_type,
      banner_link,
      sequence_id,
      is_active,
      start_date,
      end_date
    } = req.body;

    if (!banner_id) {
      return res.status(400).json({
        success: false,
        message: 'banner_id is required'
      });
    }

    const bannersCollection = mongoose.connection.db.collection('banners');

    // Check if banner exists
    const existingBanner = await bannersCollection.findOne({
      _id: new mongoose.Types.ObjectId(banner_id)
    });

    if (!existingBanner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Build update object
    const updateData = {
      updated_at: new Date()
    };

    if (banner_title !== undefined) updateData.banner_title = banner_title;
    if (banner_description !== undefined) updateData.banner_description = banner_description;
    if (banner_image_url !== undefined) updateData.banner_image_url = banner_image_url;
    if (banner_type !== undefined) updateData.banner_type = banner_type;
    if (banner_link !== undefined) updateData.banner_link = banner_link;
    if (sequence_id !== undefined) updateData.sequence_id = parseInt(sequence_id);
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);
    if (start_date !== undefined) updateData.start_date = start_date ? new Date(start_date) : null;
    if (end_date !== undefined) updateData.end_date = end_date ? new Date(end_date) : null;

    const result = await bannersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(banner_id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes made to banner'
      });
    }

    // Get updated banner
    const updatedBanner = await bannersCollection.findOne({
      _id: new mongoose.Types.ObjectId(banner_id)
    });

    res.json({
      success: true,
      message: 'Banner updated successfully',
      data: updatedBanner
    });

  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update banner'
    });
  }
});

// Delete banner
router.post('/delete_banner', async (req, res) => {
  try {
    const { banner_id } = req.body;

    if (!banner_id) {
      return res.status(400).json({
        success: false,
        message: 'banner_id is required'
      });
    }

    const bannersCollection = mongoose.connection.db.collection('banners');

    // Check if banner exists
    const existingBanner = await bannersCollection.findOne({
      _id: new mongoose.Types.ObjectId(banner_id)
    });

    if (!existingBanner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    const result = await bannersCollection.deleteOne({
      _id: new mongoose.Types.ObjectId(banner_id)
    });

    if (result.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete banner'
      });
    }

    res.json({
      success: true,
      message: 'Banner deleted successfully',
      data: {
        deleted_banner_id: banner_id,
        deleted_banner: existingBanner
      }
    });

  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete banner'
    });
  }
});

// Bulk update banners
router.post('/bulk_update_banners', async (req, res) => {
  try {
    const { banner_ids, update_data } = req.body;

    if (!banner_ids || !Array.isArray(banner_ids) || banner_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'banner_ids array is required and cannot be empty'
      });
    }

    if (!update_data || Object.keys(update_data).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'update_data is required'
      });
    }

    const bannersCollection = mongoose.connection.db.collection('banners');

    // Convert string IDs to ObjectIds
    const objectIds = banner_ids.map(id => new mongoose.Types.ObjectId(id));

    // Add updated_at timestamp
    const bulkUpdateData = {
      ...update_data,
      updated_at: new Date()
    };

    const result = await bannersCollection.updateMany(
      { _id: { $in: objectIds } },
      { $set: bulkUpdateData }
    );

    res.json({
      success: true,
      message: `Bulk update completed. ${result.modifiedCount} banners updated.`,
      data: {
        matched_count: result.matchedCount,
        modified_count: result.modifiedCount,
        banner_ids: banner_ids
      }
    });

  } catch (error) {
    console.error('Error bulk updating banners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update banners'
    });
  }
});

// Get active banners for display
router.post('/get_active_banners', async (req, res) => {
  try {
    const { banner_type, limit = 10 } = req.body;

    const bannersCollection = mongoose.connection.db.collection('banners');

    const query = {
      is_active: true
    };

    if (banner_type) query.banner_type = banner_type;

    // Check date range if specified
    const now = new Date();
    query.$or = [
      { start_date: { $lte: now }, end_date: { $gte: now } },
      { start_date: null, end_date: null },
      { start_date: { $lte: now }, end_date: null },
      { start_date: null, end_date: { $gte: now } }
    ];

    const banners = await bannersCollection.find(query)
      .sort({ sequence_id: 1 })
      .limit(parseInt(limit))
      .toArray();

    res.json({
      success: true,
      message: banners.length > 0 ? 'Active banners retrieved successfully' : 'No active banners found',
      data: banners,
      count: banners.length
    });

  } catch (error) {
    console.error('Error getting active banners:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
