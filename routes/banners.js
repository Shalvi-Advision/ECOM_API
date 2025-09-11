const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');

// Get all active banners
router.get('/', async (req, res) => {
  try {
    const { store_code, banner_type_id } = req.query;
    
    const filter = { is_active: 'Enabled' };
    if (store_code) filter.store_code = store_code;
    if (banner_type_id) filter.banner_type_id = parseInt(banner_type_id);

    const banners = await Banner.find(filter)
      .sort({ sequence_id: 1 })
      .lean();

    res.json({
      success: true,
      data: banners
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

    res.json({
      success: true,
      data: banner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching banner',
      error: error.message
    });
  }
});

module.exports = router;
