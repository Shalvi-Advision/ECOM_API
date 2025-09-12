const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');
const adminAuth = require('../middleware/adminAuth');

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

// ==================== ADMIN ROUTES ====================

// Get all users for admin
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      is_active,
      search,
      start_date,
      end_date
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (role) filter.role = role;
    if (is_active !== undefined) filter.is_active = is_active === 'true';
    
    // Date range filter
    if (start_date || end_date) {
      filter.createdAt = {};
      if (start_date) filter.createdAt.$gte = new Date(start_date);
      if (end_date) filter.createdAt.$lte = new Date(end_date);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_users: total,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Get user by ID for admin
router.get('/admin/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('favorite_products', 'product_name pcode_img our_price')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// Update user (Admin only)
router.put('/admin/:id', adminAuth, [
  body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Valid role is required'),
  body('is_active').optional().isBoolean().withMessage('Valid active status is required')
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

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email already exists (excluding current user)
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({
        email: req.body.email,
        _id: { $ne: req.params.id }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Check if phone already exists (excluding current user)
    if (req.body.phone && req.body.phone !== user.phone) {
      const existingUser = await User.findOne({
        phone: req.body.phone,
        _id: { $ne: req.params.id }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already exists'
        });
      }
    }

    // Update fields
    const updateFields = ['name', 'email', 'phone', 'role', 'is_active', 'addresses'];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active,
        addresses: user.addresses
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// Toggle user status (Admin only)
router.patch('/admin/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.is_active = !user.is_active;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.is_active ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user._id,
        is_active: user.is_active
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling user status',
      error: error.message
    });
  }
});

// Delete user (Admin only)
router.delete('/admin/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is admin
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin user'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// Get user statistics for admin
router.get('/admin/statistics', adminAuth, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Build filter object
    const filter = {};
    
    if (start_date || end_date) {
      filter.createdAt = {};
      if (start_date) filter.createdAt.$gte = new Date(start_date);
      if (end_date) filter.createdAt.$lte = new Date(end_date);
    }

    // Get user counts by role
    const roleCounts = await User.aggregate([
      { $match: filter },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Get active/inactive counts
    const statusCounts = await User.aggregate([
      { $match: filter },
      { $group: { _id: '$is_active', count: { $sum: 1 } } }
    ]);

    // Get recent users count (last 7 days)
    const recentFilter = {
      ...filter,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    };
    const recentUsersCount = await User.countDocuments(recentFilter);

    // Get total users
    const totalUsers = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        role_counts: roleCounts,
        status_counts: statusCounts,
        recent_users: recentUsersCount,
        total_users: totalUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error.message
    });
  }
});

// Create admin user (Admin only)
router.post('/admin/create-admin', adminAuth, [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
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

    const { name, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or phone'
      });
    }

    // Create new admin user
    const user = new User({
      name,
      email,
      phone,
      password,
      role: 'admin',
      is_active: true
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating admin user',
      error: error.message
    });
  }
});

module.exports = router;
