const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Add/Remove to Favorites
router.post('/add_remove_to_favorites', protect, async (req, res) => {
  try {
    const { p_code, store_code } = req.body;
    const mobile_no = req.user.mobile_no;
    const project_code = req.user.project_code;

    if (!p_code || !store_code) {
      return res.status(400).json({
        success: false,
        message: 'p_code and store_code are required'
      });
    }

    const favoritesCollection = mongoose.connection.db.collection('favorites');

    // Check if product is already in favorites
    const existingFavorite = await favoritesCollection.findOne({
      mobile_no: mobile_no,
      p_code: p_code.toString(),
      store_code: store_code
    });

    if (existingFavorite) {
      // Remove from favorites
      await favoritesCollection.deleteOne({
        mobile_no: mobile_no,
        p_code: p_code.toString(),
        store_code: store_code
      });

      res.json({
        success: true,
        message: 'Product removed from favorites',
        data: {
          action: 'removed',
          p_code: p_code,
          mobile_no: mobile_no
        }
      });
    } else {
      // Add to favorites
      const favoriteData = {
        mobile_no: mobile_no,
        p_code: p_code.toString(),
        store_code: store_code,
        project_code: project_code,
        added_at: new Date()
      };

      await favoritesCollection.insertOne(favoriteData);

      res.json({
        success: true,
        message: 'Product added to favorites',
        data: {
          action: 'added',
          p_code: p_code,
          mobile_no: mobile_no
        }
      });
    }

  } catch (error) {
    console.error('Error managing favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to manage favorites'
    });
  }
});

// Get Favorite Items
router.post('/get_favorite_items', protect, async (req, res) => {
  try {
    const { store_code } = req.body;
    const mobile_no = req.user.mobile_no;
    const project_code = req.user.project_code;

    if (!store_code) {
      return res.status(400).json({
        success: false,
        message: 'store_code is required'
      });
    }

    const favoritesCollection = mongoose.connection.db.collection('favorites');
    const productsCollection = mongoose.connection.db.collection('products');

    // Get user's favorite items
    const favorites = await favoritesCollection.find({
      mobile_no: mobile_no,
      store_code: store_code
    }).toArray();

    if (favorites.length === 0) {
      return res.json({
        success: true,
        message: 'No favorite items found',
        data: [],
        count: 0
      });
    }

    // Get product details for each favorite
    const favoritePcodes = favorites.map(fav => fav.p_code);
    const products = await productsCollection.find({
      p_code: { $in: favoritePcodes }
    }).toArray();

    res.json({
      success: true,
      message: 'Favorite items retrieved successfully',
      data: products,
      count: products.length
    });

  } catch (error) {
    console.error('Error getting favorite items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get favorite items'
    });
  }
});

// Add Address
router.post('/add_address', protect, async (req, res) => {
  try {
    const {
      idaddress_book,
      store_code,
      full_name,
      email_id,
      delivery_addr_line_1,
      delivery_addr_line_2,
      delivery_addr_city,
      delivery_addr_pincode,
      is_default,
      latitude,
      longitude,
      area_id
    } = req.body;

    const mobile_number = req.user.mobile_no;
    const project_code = req.user.project_code;

    if (!store_code || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'store_code and full_name are required'
      });
    }

    const addressbooksCollection = mongoose.connection.db.collection('addressbooks');

    const addressData = {
      idaddress_book: idaddress_book || `ADDR${Date.now()}`,
      store_code,
      project_code,
      full_name,
      access_key,
      mobile_number,
      email_id,
      delivery_addr_line_1,
      delivery_addr_line_2,
      delivery_addr_city,
      delivery_addr_pincode,
      is_default: is_default || 'No',
      latitude,
      longitude,
      area_id,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await addressbooksCollection.insertOne(addressData);

    res.json({
      success: true,
      message: 'Address added successfully',
      data: {
        address_id: result.insertedId,
        address_details: addressData
      }
    });

  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add address'
    });
  }
});

// Get Address List
router.post('/get_address_list', protect, async (req, res) => {
  try {
    const { store_code } = req.body;
    const mobile_no = req.user.mobile_no;
    const project_code = req.user.project_code;

    if (!store_code) {
      return res.status(400).json({
        success: false,
        message: 'store_code is required'
      });
    }

    const addressbooksCollection = mongoose.connection.db.collection('addressbooks');

    const addresses = await addressbooksCollection.find({
      mobile_number: mobile_no,
      store_code: store_code
    }).toArray();

    res.json({
      success: true,
      message: addresses.length > 0 ? 'Addresses retrieved successfully' : 'No addresses found',
      data: addresses,
      count: addresses.length
    });

  } catch (error) {
    console.error('Error getting address list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get address list'
    });
  }
});

// Update Address
router.put('/update_address/:address_id', async (req, res) => {
  try {
    const { address_id } = req.params;
    const updateData = req.body;

    if (!address_id) {
      return res.status(400).json({
        success: false,
        message: 'Address ID is required'
      });
    }

    const addressbooksCollection = mongoose.connection.db.collection('addressbooks');

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.created_at;

    updateData.updated_at = new Date();

    const result = await addressbooksCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(address_id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.json({
        success: false,
        message: 'Address not found'
      });
    }

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: {
        address_id: address_id,
        updated_fields: updateData
      }
    });

  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address'
    });
  }
});

// Add/Update Customer Profile
router.post('/add_update_customer_profile', protect, async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email_id,
      store_code
    } = req.body;

    const mobile_number = req.user.mobile_no;
    const project_code = req.user.project_code;

    if (!store_code) {
      return res.status(400).json({
        success: false,
        message: 'store_code is required'
      });
    }

    const addressbooksCollection = mongoose.connection.db.collection('addressbooks');

    // Check if customer profile exists
    const existingProfile = await addressbooksCollection.findOne({
      mobile_number: mobile_number
    });

    const profileData = {
      first_name,
      last_name,
      mobile_number,
      email_id,
      store_code,
      project_code,
      updated_at: new Date()
    };

    if (existingProfile) {
      // Update existing profile
      await addressbooksCollection.updateOne(
        { _id: existingProfile._id },
        { $set: profileData }
      );

      res.json({
        success: true,
        message: 'Customer profile updated successfully',
        data: profileData
      });
    } else {
      // Create new profile
      profileData.created_at = new Date();
      const result = await addressbooksCollection.insertOne(profileData);

      res.json({
        success: true,
        message: 'Customer profile created successfully',
        data: {
          profile_id: result.insertedId,
          profile_details: profileData
        }
      });
    }

  } catch (error) {
    console.error('Error managing customer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to manage customer profile'
    });
  }
});

// Get Customer Profile
router.post('/get_customer_profile', protect, async (req, res) => {
  try {
    const { store_code } = req.body;
    const mobile_number = req.user.mobile_no;
    const project_code = req.user.project_code;

    if (!store_code) {
      return res.status(400).json({
        success: false,
        message: 'store_code is required'
      });
    }

    const addressbooksCollection = mongoose.connection.db.collection('addressbooks');

    const profile = await addressbooksCollection.findOne({
      mobile_number: mobile_number,
      store_code: store_code
    });

    if (!profile) {
      return res.json({
        success: false,
        message: 'Customer profile not found',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Customer profile retrieved successfully',
      data: profile
    });

  } catch (error) {
    console.error('Error getting customer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get customer profile'
    });
  }
});

module.exports = router;
