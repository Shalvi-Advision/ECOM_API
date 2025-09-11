const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message
    });
  }
};

// Add product to favorites
router.post('/favorites', authenticateToken, [
  body('product_id').isMongoId().withMessage('Valid product ID is required')
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

    const { product_id } = req.body;

    // Check if product exists
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if already in favorites
    if (req.user.favorite_products.includes(product_id)) {
      return res.status(400).json({
        success: false,
        message: 'Product already in favorites'
      });
    }

    // Add to favorites
    req.user.favorite_products.push(product_id);
    await req.user.save();

    res.json({
      success: true,
      message: 'Product added to favorites',
      data: {
        favorite_products: req.user.favorite_products
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding to favorites',
      error: error.message
    });
  }
});

// Remove product from favorites
router.delete('/favorites/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product is in favorites
    const index = req.user.favorite_products.indexOf(productId);
    if (index === -1) {
      return res.status(400).json({
        success: false,
        message: 'Product not in favorites'
      });
    }

    // Remove from favorites
    req.user.favorite_products.splice(index, 1);
    await req.user.save();

    res.json({
      success: true,
      message: 'Product removed from favorites',
      data: {
        favorite_products: req.user.favorite_products
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing from favorites',
      error: error.message
    });
  }
});

// Get user's favorite products
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(req.user._id)
      .populate({
        path: 'favorite_products',
        populate: {
          path: 'dept_id',
          select: 'department_name'
        }
      })
      .populate({
        path: 'favorite_products',
        populate: {
          path: 'category_id',
          select: 'category_name'
        }
      })
      .populate({
        path: 'favorite_products',
        populate: {
          path: 'sub_category_id',
          select: 'sub_category_name'
        }
      });

    const favoriteProducts = user.favorite_products.slice(
      (page - 1) * limit,
      page * limit
    );

    res.json({
      success: true,
      data: {
        products: favoriteProducts,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(user.favorite_products.length / limit),
          total_products: user.favorite_products.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching favorite products',
      error: error.message
    });
  }
});

// Add address
router.post('/addresses', authenticateToken, [
  body('type').isIn(['home', 'work', 'other']).withMessage('Valid address type is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('address_line_1').notEmpty().withMessage('Address line 1 is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('pincode').isPostalCode('IN').withMessage('Valid pincode is required')
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

    const { type, name, phone, address_line_1, address_line_2, city, state, pincode, landmark, is_default } = req.body;

    // If this is set as default, unset other defaults
    if (is_default) {
      req.user.addresses.forEach(addr => {
        addr.is_default = false;
      });
    }

    const newAddress = {
      type,
      name,
      phone,
      address_line_1,
      address_line_2,
      city,
      state,
      pincode,
      landmark,
      is_default: is_default || false
    };

    req.user.addresses.push(newAddress);
    await req.user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: {
        addresses: req.user.addresses
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding address',
      error: error.message
    });
  }
});

// Update address
router.put('/addresses/:addressId', authenticateToken, [
  body('type').optional().isIn(['home', 'work', 'other']).withMessage('Valid address type is required'),
  body('name').optional().notEmpty().withMessage('Name is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('address_line_1').optional().notEmpty().withMessage('Address line 1 is required'),
  body('city').optional().notEmpty().withMessage('City is required'),
  body('state').optional().notEmpty().withMessage('State is required'),
  body('pincode').optional().isPostalCode('IN').withMessage('Valid pincode is required')
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

    const { addressId } = req.params;
    const address = req.user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Update address fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        address[key] = req.body[key];
      }
    });

    // If this is set as default, unset other defaults
    if (req.body.is_default) {
      req.user.addresses.forEach(addr => {
        if (addr._id.toString() !== addressId) {
          addr.is_default = false;
        }
      });
    }

    await req.user.save();

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: {
        addresses: req.user.addresses
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating address',
      error: error.message
    });
  }
});

// Delete address
router.delete('/addresses/:addressId', authenticateToken, async (req, res) => {
  try {
    const { addressId } = req.params;
    const address = req.user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    address.remove();
    await req.user.save();

    res.json({
      success: true,
      message: 'Address deleted successfully',
      data: {
        addresses: req.user.addresses
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting address',
      error: error.message
    });
  }
});

module.exports = router;
