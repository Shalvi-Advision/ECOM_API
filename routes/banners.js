const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Get banner by type
router.post('/get_banner', async (req, res) => {
  try {
    const { banner_type_id, store_code, platform, project_code } = req.body;

    if (!banner_type_id || !store_code || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'banner_type_id, store_code, and project_code are required'
      });
    }

    const bannersCollection = mongoose.connection.db.collection('banners');

    // Find banners by type and store code
    const banners = await bannersCollection.find({
      banner_type_id: parseInt(banner_type_id),
      store_code: store_code
    }).sort({ sequence_id: 1 }).toArray();

    res.json({
      success: true,
      message: banners.length > 0 ? 'Banners retrieved successfully' : 'No banners found',
      data: banners,
      count: banners.length
    });

  } catch (error) {
    console.error('Error getting banners:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get popup screen banner
router.post('/get_popup_screen', async (req, res) => {
  try {
    const { store_code } = req.body;

    if (!store_code) {
      return res.status(400).json({
        success: false,
        message: 'store_code is required'
      });
    }

    const bannersCollection = mongoose.connection.db.collection('banners');

    // Find popup banners (assuming banner_type_id 6 for popup)
    const popupBanners = await bannersCollection.find({
      banner_type_id: 6, // Assuming 6 is for popup screens
      store_code: store_code
    }).sort({ sequence_id: 1 }).toArray();

    res.json({
      success: true,
      message: popupBanners.length > 0 ? 'Popup banners retrieved successfully' : 'No popup banners found',
      data: popupBanners,
      count: popupBanners.length
    });

  } catch (error) {
    console.error('Error getting popup screen:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all banner types for a store
router.post('/get_all_banners', async (req, res) => {
  try {
    const { store_code, project_code } = req.body;

    if (!store_code || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'store_code and project_code are required'
      });
    }

    const bannersCollection = mongoose.connection.db.collection('banners');

    // Get all banners for the store
    const banners = await bannersCollection.find({
      store_code: store_code
    }).sort({ banner_type_id: 1, sequence_id: 1 }).toArray();

    // Group by banner type
    const groupedBanners = {};
    banners.forEach(banner => {
      const typeId = banner.banner_type_id;
      if (!groupedBanners[typeId]) {
        groupedBanners[typeId] = [];
      }
      groupedBanners[typeId].push(banner);
    });

    res.json({
      success: true,
      message: 'All banners retrieved successfully',
      data: groupedBanners,
      total_count: banners.length
    });

  } catch (error) {
    console.error('Error getting all banners:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get banner types/categories
router.get('/get_banner_types', async (req, res) => {
  try {
    // Return predefined banner types based on the Postman collection
    const bannerTypes = [
      { id: 1, name: 'Home Slider 1', description: 'Main home page slider' },
      { id: 2, name: 'Home Slider 2', description: 'Secondary home page slider' },
      { id: 3, name: 'Bestseller 1', description: 'First bestseller section' },
      { id: 4, name: 'Bestseller 2', description: 'Second bestseller section' },
      { id: 5, name: 'Loyalty Card', description: 'Loyalty card promotions' },
      { id: 6, name: 'Popup Screen', description: 'Popup banner screens' },
      { id: 7, name: 'Table Booking', description: 'Table booking promotions' },
      { id: 8, name: 'Product List', description: 'Product listing banners' },
      { id: 9, name: 'Banquet Booking', description: 'Banquet booking promotions' },
      { id: 10, name: 'Seasonal Pick', description: 'Seasonal product picks' },
      { id: 11, name: 'Bestseller 3', description: 'Third bestseller section' },
      { id: 12, name: 'Bestseller 4', description: 'Fourth bestseller section' },
      { id: 13, name: 'Offers', description: 'Special offers and discounts' },
      { id: 14, name: 'Department', description: 'Department specific banners' }
    ];

    res.json({
      success: true,
      message: 'Banner types retrieved successfully',
      data: bannerTypes
    });

  } catch (error) {
    console.error('Error getting banner types:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
