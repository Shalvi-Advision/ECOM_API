const express = require('express');
const mongoose = require('mongoose');
const { protect, adminOnly } = require('../../middleware/auth');
const router = express.Router();

// Apply admin authentication to all routes
router.use(protect);
router.use(adminOnly);

// Get all users (admin view with pagination)
router.post('/get_all_users', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, user_type, is_active, sort_by = 'created_at', sort_order = 'desc' } = req.body;

    const usersCollection = mongoose.connection.db.collection('users');

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { mobile_no: { $regex: search } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (user_type) query.user_type = user_type;
    if (is_active !== undefined) query.is_active = Boolean(is_active);

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const totalCount = await usersCollection.countDocuments(query);

    // Get users
    const users = await usersCollection.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      message: users.length > 0 ? 'Users retrieved successfully' : 'No users found',
      data: users,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_users: totalCount,
        per_page: parseInt(limit),
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1
      },
      filters: {
        search,
        user_type,
        is_active
      }
    });

  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user by ID
router.post('/get_user_by_id', async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required'
      });
    }

    const usersCollection = mongoose.connection.db.collection('users');

    const user = await usersCollection.findOne({
      _id: new mongoose.Types.ObjectId(user_id)
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });

  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new user
router.post('/create_user', async (req, res) => {
  try {
    const {
      mobile_no,
      name,
      email,
      user_type = 'customer',
      is_active = true,
      address,
      pincode,
      city,
      state
    } = req.body;

    // Validate required fields
    if (!mobile_no || !name) {
      return res.status(400).json({
        success: false,
        message: 'mobile_no and name are required'
      });
    }

    const usersCollection = mongoose.connection.db.collection('users');

    // Check if mobile number already exists
    const existingUser = await usersCollection.findOne({
      mobile_no: mobile_no.toString()
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number already exists'
      });
    }

    // Create new user
    const newUser = {
      mobile_no: mobile_no.toString(),
      name,
      email: email || '',
      user_type: user_type,
      is_active: Boolean(is_active),
      address: address || '',
      pincode: pincode || '',
      city: city || '',
      state: state || '',
      created_at: new Date(),
      updated_at: new Date(),
      last_login: null
    };

    const result = await usersCollection.insertOne(newUser);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: result.insertedId,
        ...newUser
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

// Update user
router.post('/update_user', async (req, res) => {
  try {
    const {
      user_id,
      mobile_no,
      name,
      email,
      user_type,
      is_active,
      address,
      pincode,
      city,
      state
    } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required'
      });
    }

    const usersCollection = mongoose.connection.db.collection('users');

    // Check if user exists
    const existingUser = await usersCollection.findOne({
      _id: new mongoose.Types.ObjectId(user_id)
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if mobile number is being changed and if it's already taken
    if (mobile_no && mobile_no !== existingUser.mobile_no) {
      const duplicateUser = await usersCollection.findOne({
        mobile_no: mobile_no.toString(),
        _id: { $ne: new mongoose.Types.ObjectId(user_id) }
      });
      if (duplicateUser) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number already exists'
        });
      }
    }

    // Build update object
    const updateData = {
      updated_at: new Date()
    };

    if (mobile_no !== undefined) updateData.mobile_no = mobile_no.toString();
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (user_type !== undefined) updateData.user_type = user_type;
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);
    if (address !== undefined) updateData.address = address;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;

    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(user_id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes made to user'
      });
    }

    // Get updated user
    const updatedUser = await usersCollection.findOne({
      _id: new mongoose.Types.ObjectId(user_id)
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// Delete user
router.post('/delete_user', async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required'
      });
    }

    const usersCollection = mongoose.connection.db.collection('users');

    // Check if user exists
    const existingUser = await usersCollection.findOne({
      _id: new mongoose.Types.ObjectId(user_id)
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const result = await usersCollection.deleteOne({
      _id: new mongoose.Types.ObjectId(user_id)
    });

    if (result.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete user'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: {
        deleted_user_id: user_id,
        deleted_user: existingUser
      }
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// Bulk update users
router.post('/bulk_update_users', async (req, res) => {
  try {
    const { user_ids, update_data } = req.body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'user_ids array is required and cannot be empty'
      });
    }

    if (!update_data || Object.keys(update_data).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'update_data is required'
      });
    }

    const usersCollection = mongoose.connection.db.collection('users');

    // Convert string IDs to ObjectIds
    const objectIds = user_ids.map(id => new mongoose.Types.ObjectId(id));

    // Add updated_at timestamp
    const bulkUpdateData = {
      ...update_data,
      updated_at: new Date()
    };

    const result = await usersCollection.updateMany(
      { _id: { $in: objectIds } },
      { $set: bulkUpdateData }
    );

    res.json({
      success: true,
      message: `Bulk update completed. ${result.modifiedCount} users updated.`,
      data: {
        matched_count: result.matchedCount,
        modified_count: result.modifiedCount,
        user_ids: user_ids
      }
    });

  } catch (error) {
    console.error('Error bulk updating users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update users'
    });
  }
});

// Get user statistics
router.post('/get_user_stats', async (req, res) => {
  try {
    const usersCollection = mongoose.connection.db.collection('users');

    // Get total users count
    const totalUsers = await usersCollection.countDocuments();

    // Get active users count
    const activeUsers = await usersCollection.countDocuments({ is_active: true });

    // Get users by type
    const customerUsers = await usersCollection.countDocuments({ user_type: 'customer' });
    const adminUsers = await usersCollection.countDocuments({ user_type: 'admin' });

    // Get recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await usersCollection.countDocuments({
      created_at: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        total_users: totalUsers,
        active_users: activeUsers,
        inactive_users: totalUsers - activeUsers,
        customer_users: customerUsers,
        admin_users: adminUsers,
        recent_users: recentUsers
      }
    });

  } catch (error) {
    console.error('Error getting user statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics'
    });
  }
});

module.exports = router;
