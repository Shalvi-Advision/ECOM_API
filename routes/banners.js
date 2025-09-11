const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Banner = require('../models/Banner');
const adminAuth = require('../middleware/adminAuth');

// Get all active banners in new format
router.get('/', async (req, res) => {
  try {
    const { 
      store_code, 
      banner_type_id, 
      page = 'homepage', 
      position = 'top',
      platform = 'web',
      rotation_type = 'carousel'
    } = req.query;
    
    const filter = { 
      is_active: 'Enabled',
      'placement.page': page,
      'placement.position': position,
      'placement.platform': platform,
      rotation_type: rotation_type,
      'validity.start': { $lte: new Date() },
      'validity.end': { $gte: new Date() }
    };
    
    if (store_code) filter.store_code = store_code;
    if (banner_type_id) filter.banner_type_id = parseInt(banner_type_id);

    const banners = await Banner.find(filter)
      .sort({ priority: -1, sequence_id: 1 })
      .lean();

    // Transform banners to new format
    const transformedBanners = banners.map(banner => ({
      id: banner._id,
      title: banner.title || `Banner ${banner.sequence_id}`,
      media_type: banner.media_type || 'image',
      media_url: banner.media_url || banner.banner_img,
      redirect: {
        type: banner.redirect?.type || 'internal',
        id: banner.redirect?.id || null,
        url: banner.redirect?.url || banner.redirect_link || '/'
      },
      priority: banner.priority || 1,
      validity: {
        start: banner.validity?.start || banner.createdAt,
        end: banner.validity?.end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      tracking: {
        impressions: banner.tracking?.impressions || 0,
        clicks: banner.tracking?.clicks || 0
      }
    }));

    res.json({
      status: 'success',
      data: {
        placement: {
          page: page,
          position: position,
          platform: platform.split(',').map(p => p.trim())
        },
        rotation_type: rotation_type,
        banners: transformedBanners
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching banners',
      error: error.message
    });
  }
});

// Get banner by ID
router.get('/:id', async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Transform single banner to new format
    const transformedBanner = {
      id: banner._id,
      title: banner.title || `Banner ${banner.sequence_id}`,
      media_type: banner.media_type || 'image',
      media_url: banner.media_url || banner.banner_img,
      redirect: {
        type: banner.redirect?.type || 'internal',
        id: banner.redirect?.id || null,
        url: banner.redirect?.url || banner.redirect_link || '/'
      },
      priority: banner.priority || 1,
      validity: {
        start: banner.validity?.start || banner.createdAt,
        end: banner.validity?.end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      tracking: {
        impressions: banner.tracking?.impressions || 0,
        clicks: banner.tracking?.clicks || 0
      }
    };

    res.json({
      status: 'success',
      data: transformedBanner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching banner',
      error: error.message
    });
  }
});

// Get banners by placement
router.get('/placement/:page/:position', async (req, res) => {
  try {
    const { page, position } = req.params;
    const { platform = 'web', rotation_type = 'carousel' } = req.query;
    
    const filter = { 
      is_active: 'Enabled',
      'placement.page': page,
      'placement.position': position,
      'placement.platform': platform,
      rotation_type: rotation_type,
      'validity.start': { $lte: new Date() },
      'validity.end': { $gte: new Date() }
    };

    const banners = await Banner.find(filter)
      .sort({ priority: -1, sequence_id: 1 })
      .lean();

    const transformedBanners = banners.map(banner => ({
      id: banner._id,
      title: banner.title || `Banner ${banner.sequence_id}`,
      media_type: banner.media_type || 'image',
      media_url: banner.media_url || banner.banner_img,
      redirect: {
        type: banner.redirect?.type || 'internal',
        id: banner.redirect?.id || null,
        url: banner.redirect?.url || banner.redirect_link || '/'
      },
      priority: banner.priority || 1,
      validity: {
        start: banner.validity?.start || banner.createdAt,
        end: banner.validity?.end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      tracking: {
        impressions: banner.tracking?.impressions || 0,
        clicks: banner.tracking?.clicks || 0
      }
    }));

    res.json({
      status: 'success',
      data: {
        placement: {
          page: page,
          position: position,
          platform: platform.split(',').map(p => p.trim())
        },
        rotation_type: rotation_type,
        banners: transformedBanners
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching banners by placement',
      error: error.message
    });
  }
});

// ==================== ADMIN CRUD ROUTES ====================

// Create new banner (Admin only)
router.post('/', adminAuth, [
  body('title').notEmpty().withMessage('Title is required'),
  body('media_url').notEmpty().withMessage('Media URL is required'),
  body('media_type').isIn(['image', 'video', 'gif']).withMessage('Valid media type is required'),
  body('redirect.type').isIn(['product', 'category', 'external', 'internal']).withMessage('Valid redirect type is required'),
  body('redirect.url').notEmpty().withMessage('Redirect URL is required'),
  body('placement.page').isIn(['homepage', 'category', 'product', 'cart', 'checkout']).withMessage('Valid page is required'),
  body('placement.position').isIn(['top', 'middle', 'bottom', 'sidebar', 'popup']).withMessage('Valid position is required'),
  body('priority').isInt({ min: 1, max: 10 }).withMessage('Priority must be between 1 and 10'),
  body('store_code').notEmpty().withMessage('Store code is required'),
  body('validity.start').isISO8601().withMessage('Valid start date is required'),
  body('validity.end').isISO8601().withMessage('Valid end date is required')
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
      title,
      media_url,
      media_type,
      redirect,
      priority,
      placement,
      rotation_type = 'carousel',
      validity,
      store_code,
      banner_type_id = 1,
      sequence_id = 1,
      banner_bg_color = '#FFFFFF'
    } = req.body;

    // Check if validity dates are valid
    if (new Date(validity.start) >= new Date(validity.end)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    const banner = new Banner({
      title,
      media_url,
      media_type,
      redirect,
      priority,
      placement,
      rotation_type,
      validity,
      store_code,
      banner_type_id,
      sequence_id,
      banner_bg_color,
      is_active: 'Enabled',
      tracking: {
        impressions: 0,
        clicks: 0
      }
    });

    await banner.save();

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: banner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating banner',
      error: error.message
    });
  }
});

// Update banner (Admin only)
router.put('/:id', adminAuth, [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('media_url').optional().notEmpty().withMessage('Media URL cannot be empty'),
  body('media_type').optional().isIn(['image', 'video', 'gif']).withMessage('Valid media type is required'),
  body('redirect.type').optional().isIn(['product', 'category', 'external', 'internal']).withMessage('Valid redirect type is required'),
  body('redirect.url').optional().notEmpty().withMessage('Redirect URL cannot be empty'),
  body('placement.page').optional().isIn(['homepage', 'category', 'product', 'cart', 'checkout']).withMessage('Valid page is required'),
  body('placement.position').optional().isIn(['top', 'middle', 'bottom', 'sidebar', 'popup']).withMessage('Valid position is required'),
  body('priority').optional().isInt({ min: 1, max: 10 }).withMessage('Priority must be between 1 and 10'),
  body('validity.start').optional().isISO8601().withMessage('Valid start date is required'),
  body('validity.end').optional().isISO8601().withMessage('Valid end date is required'),
  body('is_active').optional().isIn(['Enabled', 'Disabled']).withMessage('Valid status is required')
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

    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Check validity dates if provided
    if (req.body.validity) {
      const startDate = new Date(req.body.validity.start || banner.validity.start);
      const endDate = new Date(req.body.validity.end || banner.validity.end);
      
      if (startDate >= endDate) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }

    // Update fields
    const updateFields = [
      'title', 'media_url', 'media_type', 'redirect', 'priority', 
      'placement', 'rotation_type', 'validity', 'is_active', 
      'banner_type_id', 'sequence_id', 'banner_bg_color'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        banner[field] = req.body[field];
      }
    });

    await banner.save();

    res.json({
      success: true,
      message: 'Banner updated successfully',
      data: banner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating banner',
      error: error.message
    });
  }
});

// Delete banner (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting banner',
      error: error.message
    });
  }
});

// Get all banners for admin (including inactive)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      store_code, 
      is_active, 
      placement_page,
      placement_position 
    } = req.query;
    
    const filter = {};
    if (store_code) filter.store_code = store_code;
    if (is_active) filter.is_active = is_active;
    if (placement_page) filter['placement.page'] = placement_page;
    if (placement_position) filter['placement.position'] = placement_position;

    const banners = await Banner.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Banner.countDocuments(filter);

    res.json({
      success: true,
      data: {
        banners,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_banners: total,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching banners',
      error: error.message
    });
  }
});

// Toggle banner status (Admin only)
router.patch('/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    banner.is_active = banner.is_active === 'Enabled' ? 'Disabled' : 'Enabled';
    await banner.save();

    res.json({
      success: true,
      message: `Banner ${banner.is_active === 'Enabled' ? 'enabled' : 'disabled'} successfully`,
      data: {
        id: banner._id,
        is_active: banner.is_active
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling banner status',
      error: error.message
    });
  }
});

// Bulk update banner priorities (Admin only)
router.patch('/bulk/priorities', adminAuth, [
  body('banners').isArray({ min: 1 }).withMessage('Banners array is required'),
  body('banners.*.id').isMongoId().withMessage('Valid banner ID is required'),
  body('banners.*.priority').isInt({ min: 1, max: 10 }).withMessage('Priority must be between 1 and 10')
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

    const { banners } = req.body;
    const updatePromises = banners.map(banner => 
      Banner.findByIdAndUpdate(banner.id, { priority: banner.priority }, { new: true })
    );

    const updatedBanners = await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Banner priorities updated successfully',
      data: updatedBanners
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating banner priorities',
      error: error.message
    });
  }
});

module.exports = router;
