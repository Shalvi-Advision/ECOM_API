const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');

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

module.exports = router;
