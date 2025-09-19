const express = require('express');
const mongoose = require('mongoose');
const { protect, adminOnly } = require('../../middleware/auth');
const router = express.Router();

// Apply admin authentication to all routes
router.use(protect);
router.use(adminOnly);

// Helper function to get banner type name from ID
function getBannerTypeName(bannerTypeId) {
  const bannerTypes = {
    1: 'general',
    2: 'product',
    3: 'category',
    4: 'promotion',
    5: 'seasonal',
    6: 'flash_sale',
    7: 'new_arrival',
    8: 'featured',
    9: 'clearance',
    10: 'special_offer'
  };
  return bannerTypes[bannerTypeId] || 'general';
}

// Helper function to get banner type ID from name
function getBannerTypeId(bannerTypeName) {
  const bannerTypes = {
    'general': 1,
    'product': 2,
    'category': 3,
    'promotion': 4,
    'seasonal': 5,
    'flash_sale': 6,
    'new_arrival': 7,
    'featured': 8,
    'clearance': 9,
    'special_offer': 10
  };
  return bannerTypes[bannerTypeName] || 1;
}

// Get all banners (admin view with pagination)
router.post('/get_all_banners', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, banner_type_id, is_active, store_code, sort_by = 'sequence_id', sort_order = 'asc' } = req.body;

    const bannersCollection = mongoose.connection.db.collection('banners');

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { redirect_link: { $regex: search, $options: 'i' } },
        { banner_img: { $regex: search, $options: 'i' } }
      ];
    }
    if (banner_type_id) query.banner_type_id = parseInt(banner_type_id);
    if (store_code) query.store_code = store_code;

    // Handle is_active conversion
    if (is_active !== undefined) {
      if (typeof is_active === 'boolean') {
        query.is_active = is_active ? 'Enabled' : 'Disabled';
      } else {
        query.is_active = is_active;
      }
    }

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

    // Transform data to match API expectations
    const transformedBanners = banners.map(banner => ({
      _id: banner._id,
      banner_title: `Banner ${banner._id}`, // Generate title since not in DB
      banner_description: `Banner for ${banner.store_code}`, // Generate description since not in DB
      banner_image_url: banner.banner_img,
      banner_type: getBannerTypeName(banner.banner_type_id),
      banner_type_id: banner.banner_type_id,
      banner_link: banner.redirect_link,
      sequence_id: banner.sequence_id,
      is_active: banner.is_active === 'Enabled',
      store_code: banner.store_code,
      banner_bg_color: banner.banner_bg_color || '#FFFFFF',
      created_at: banner._id.getTimestamp(),
      updated_at: banner._id.getTimestamp()
    }));

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      message: banners.length > 0 ? 'Banners retrieved successfully' : 'No banners found',
      data: transformedBanners,
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
        banner_type_id,
        is_active,
        store_code
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

    // Transform data to match API expectations
    const transformedBanner = {
      _id: banner._id,
      banner_title: `Banner ${banner._id}`,
      banner_description: `Banner for ${banner.store_code}`,
      banner_image_url: banner.banner_img,
      banner_type: getBannerTypeName(banner.banner_type_id),
      banner_type_id: banner.banner_type_id,
      banner_link: banner.redirect_link,
      sequence_id: banner.sequence_id,
      is_active: banner.is_active === 'Enabled',
      store_code: banner.store_code,
      banner_bg_color: banner.banner_bg_color || '#FFFFFF',
      created_at: banner._id.getTimestamp(),
      updated_at: banner._id.getTimestamp()
    };

    res.json({
      success: true,
      message: 'Banner retrieved successfully',
      data: transformedBanner
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
      banner_type_id,
      banner_link,
      sequence_id,
      is_active = true,
      store_code = 'ALL',
      banner_bg_color = '#FFFFFF'
    } = req.body;

    // Validate required fields
    if (!banner_image_url) {
      return res.status(400).json({
        success: false,
        message: 'banner_image_url is required'
      });
    }

    const bannersCollection = mongoose.connection.db.collection('banners');

    // Determine banner_type_id
    let finalBannerTypeId = banner_type_id;
    if (!finalBannerTypeId && banner_type) {
      finalBannerTypeId = getBannerTypeId(banner_type);
    }
    if (!finalBannerTypeId) {
      finalBannerTypeId = 1; // Default to general
    }

    // Create new banner with database schema
    const newBanner = {
      redirect_link: banner_link || '/',
      banner_img: banner_image_url,
      is_active: is_active ? 'Enabled' : 'Disabled',
      banner_type_id: finalBannerTypeId,
      sequence_id: sequence_id ? parseInt(sequence_id) : 0,
      store_code: store_code,
      banner_bg_color: banner_bg_color,
      __v: 0
    };

    const result = await bannersCollection.insertOne(newBanner);

    // Return transformed data to match API expectations
    const transformedBanner = {
      _id: result.insertedId,
      banner_title: banner_title || `Banner ${result.insertedId}`,
      banner_description: banner_description || `Banner for ${store_code}`,
      banner_image_url: newBanner.banner_img,
      banner_type: getBannerTypeName(newBanner.banner_type_id),
      banner_type_id: newBanner.banner_type_id,
      banner_link: newBanner.redirect_link,
      sequence_id: newBanner.sequence_id,
      is_active: newBanner.is_active === 'Enabled',
      store_code: newBanner.store_code,
      banner_bg_color: newBanner.banner_bg_color,
      created_at: result.insertedId.getTimestamp(),
      updated_at: result.insertedId.getTimestamp()
    };

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: transformedBanner
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
      banner_type_id,
      banner_link,
      sequence_id,
      is_active,
      store_code,
      banner_bg_color
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

    // Build update object with database schema
    const updateData = {};

    if (banner_image_url !== undefined) updateData.banner_img = banner_image_url;
    if (banner_link !== undefined) updateData.redirect_link = banner_link;

    // Handle banner_type_id
    if (banner_type_id !== undefined) {
      updateData.banner_type_id = parseInt(banner_type_id);
    } else if (banner_type !== undefined) {
      updateData.banner_type_id = getBannerTypeId(banner_type);
    }

    if (sequence_id !== undefined) updateData.sequence_id = parseInt(sequence_id);
    if (store_code !== undefined) updateData.store_code = store_code;
    if (banner_bg_color !== undefined) updateData.banner_bg_color = banner_bg_color;

    // Handle is_active conversion
    if (is_active !== undefined) {
      updateData.is_active = is_active ? 'Enabled' : 'Disabled';
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

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

    // Transform data to match API expectations
    const transformedBanner = {
      _id: updatedBanner._id,
      banner_title: banner_title || `Banner ${updatedBanner._id}`,
      banner_description: banner_description || `Banner for ${updatedBanner.store_code}`,
      banner_image_url: updatedBanner.banner_img,
      banner_type: getBannerTypeName(updatedBanner.banner_type_id),
      banner_type_id: updatedBanner.banner_type_id,
      banner_link: updatedBanner.redirect_link,
      sequence_id: updatedBanner.sequence_id,
      is_active: updatedBanner.is_active === 'Enabled',
      store_code: updatedBanner.store_code,
      banner_bg_color: updatedBanner.banner_bg_color || '#FFFFFF',
      created_at: updatedBanner._id.getTimestamp(),
      updated_at: new Date()
    };

    res.json({
      success: true,
      message: 'Banner updated successfully',
      data: transformedBanner
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

    // Transform deleted banner data
    const transformedBanner = {
      _id: existingBanner._id,
      banner_title: `Banner ${existingBanner._id}`,
      banner_description: `Banner for ${existingBanner.store_code}`,
      banner_image_url: existingBanner.banner_img,
      banner_type: getBannerTypeName(existingBanner.banner_type_id),
      banner_type_id: existingBanner.banner_type_id,
      banner_link: existingBanner.redirect_link,
      sequence_id: existingBanner.sequence_id,
      is_active: existingBanner.is_active === 'Enabled',
      store_code: existingBanner.store_code,
      banner_bg_color: existingBanner.banner_bg_color || '#FFFFFF'
    };

    res.json({
      success: true,
      message: 'Banner deleted successfully',
      data: {
        deleted_banner_id: banner_id,
        deleted_banner: transformedBanner
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

    // Transform API fields to database schema
    const bulkUpdateData = {};

    if (update_data.banner_image_url !== undefined) bulkUpdateData.banner_img = update_data.banner_image_url;
    if (update_data.banner_link !== undefined) bulkUpdateData.redirect_link = update_data.banner_link;

    if (update_data.banner_type_id !== undefined) {
      bulkUpdateData.banner_type_id = parseInt(update_data.banner_type_id);
    } else if (update_data.banner_type !== undefined) {
      bulkUpdateData.banner_type_id = getBannerTypeId(update_data.banner_type);
    }

    if (update_data.sequence_id !== undefined) bulkUpdateData.sequence_id = parseInt(update_data.sequence_id);
    if (update_data.store_code !== undefined) bulkUpdateData.store_code = update_data.store_code;
    if (update_data.banner_bg_color !== undefined) bulkUpdateData.banner_bg_color = update_data.banner_bg_color;

    // Handle is_active conversion
    if (update_data.is_active !== undefined) {
      bulkUpdateData.is_active = update_data.is_active ? 'Enabled' : 'Disabled';
    }

    if (Object.keys(bulkUpdateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

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
    const { banner_type_id, banner_type, limit = 10, store_code } = req.body;

    const bannersCollection = mongoose.connection.db.collection('banners');

    const query = {
      is_active: 'Enabled'
    };

    // Handle banner type filtering
    if (banner_type_id) {
      query.banner_type_id = parseInt(banner_type_id);
    } else if (banner_type) {
      query.banner_type_id = getBannerTypeId(banner_type);
    }

    if (store_code) query.store_code = store_code;

    const banners = await bannersCollection.find(query)
      .sort({ sequence_id: 1 })
      .limit(parseInt(limit))
      .toArray();

    // Transform data to match API expectations
    const transformedBanners = banners.map(banner => ({
      _id: banner._id,
      banner_title: `Banner ${banner._id}`,
      banner_description: `Banner for ${banner.store_code}`,
      banner_image_url: banner.banner_img,
      banner_type: getBannerTypeName(banner.banner_type_id),
      banner_type_id: banner.banner_type_id,
      banner_link: banner.redirect_link,
      sequence_id: banner.sequence_id,
      is_active: banner.is_active === 'Enabled',
      store_code: banner.store_code,
      banner_bg_color: banner.banner_bg_color || '#FFFFFF',
      created_at: banner._id.getTimestamp(),
      updated_at: banner._id.getTimestamp()
    }));

    res.json({
      success: true,
      message: banners.length > 0 ? 'Active banners retrieved successfully' : 'No active banners found',
      data: transformedBanners,
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
