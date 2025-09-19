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
    const usersCollection = mongoose.connection.db.collection('users');

    // Find user by mobile number to get user_id
    const user = await usersCollection.findOne({ mobile_no: mobile_no });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if product is already in favorites
    const existingFavorite = await favoritesCollection.findOne({
      user_id: user._id,
      p_code: p_code.toString(),
      store_code: store_code
    });

    if (existingFavorite) {
      // Remove from favorites
      await favoritesCollection.deleteOne({
        user_id: user._id,
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
        user_id: user._id, // Reference to users collection
        mobile_no: mobile_no, // Keep for backward compatibility
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
    const usersCollection = mongoose.connection.db.collection('users');

    // Find user by mobile number to get user_id
    const user = await usersCollection.findOne({ mobile_no: mobile_no });
    if (!user) {
      return res.json({
        success: true,
        message: 'No favorite items found',
        data: [],
        count: 0
      });
    }

    // Get user's favorite items
    const favorites = await favoritesCollection.find({
      user_id: user._id,
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
    const usersCollection = mongoose.connection.db.collection('users');

    // Find user by mobile number to get user_id
    const user = await usersCollection.findOne({ mobile_no: mobile_number });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const addressData = {
      idaddress_book: idaddress_book || `ADDR${Date.now()}`,
      user_id: user._id, // Reference to users collection
      store_code,
      project_code,
      full_name,
      mobile_number, // Keep for backward compatibility
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
    const usersCollection = mongoose.connection.db.collection('users');

    // Find user by mobile number to get user_id
    const user = await usersCollection.findOne({ mobile_no: mobile_no });
    if (!user) {
      return res.json({
        success: true,
        message: 'No addresses found',
        data: [],
        count: 0
      });
    }

    const addresses = await addressbooksCollection.find({
      user_id: user._id,
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

    const usersCollection = mongoose.connection.db.collection('users');

    // Check if user exists
    const existingUser = await usersCollection.findOne({
      mobile_no: mobile_number
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user profile
    const updateData = {
      name: first_name && last_name ? `${first_name} ${last_name}` : (first_name || last_name || existingUser.name),
      email: email_id || existingUser.email,
      updated_at: new Date()
    };

    await usersCollection.updateOne(
      { _id: existingUser._id },
      { $set: updateData }
    );

    // Get updated user
    const updatedUser = await usersCollection.findOne({ _id: existingUser._id });

    res.json({
      success: true,
      message: 'Customer profile updated successfully',
      data: {
        mobile_no: updatedUser.mobile_no,
        name: updatedUser.name,
        email: updatedUser.email,
        user_type: updatedUser.user_type,
        is_active: updatedUser.is_active,
        updated_at: updatedUser.updated_at
      }
    });

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

    const usersCollection = mongoose.connection.db.collection('users');

    const user = await usersCollection.findOne({
      mobile_no: mobile_number
    });

    if (!user) {
      return res.json({
        success: false,
        message: 'Customer profile not found',
        data: null
      });
    }

    // Split name into first and last name for backward compatibility
    const nameParts = user.name ? user.name.split(' ') : ['', ''];
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    res.json({
      success: true,
      message: 'Customer profile retrieved successfully',
      data: {
        mobile_no: user.mobile_no,
        first_name,
        last_name,
        full_name: user.name,
        email_id: user.email,
        user_type: user.user_type,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login
      }
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
