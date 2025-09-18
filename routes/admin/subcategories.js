const express = require('express');
const mongoose = require('mongoose');
const { protect, adminOnly } = require('../../middleware/auth');
const router = express.Router();

// Apply admin authentication to all routes
router.use(protect);
router.use(adminOnly);

// Get all subcategories (admin view with pagination)
router.post('/get_all_subcategories', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, category_id, dept_id, sort_by = 'sub_category_name', sort_order = 'asc' } = req.body;

    const subcategoriesCollection = mongoose.connection.db.collection('subcategories');

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { sub_category_name: { $regex: search, $options: 'i' } },
        { sub_category_id: { $regex: search, $options: 'i' } }
      ];
    }
    if (category_id) query.category_id = category_id.toString();
    if (dept_id) query.dept_id = dept_id.toString();

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const totalCount = await subcategoriesCollection.countDocuments(query);

    // Get subcategories
    const subcategories = await subcategoriesCollection.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      message: subcategories.length > 0 ? 'Subcategories retrieved successfully' : 'No subcategories found',
      data: subcategories,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_subcategories: totalCount,
        per_page: parseInt(limit),
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1
      },
      filters: {
        search,
        category_id,
        dept_id
      }
    });

  } catch (error) {
    console.error('Error getting all subcategories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get subcategory by ID
router.post('/get_subcategory_by_id', async (req, res) => {
  try {
    const { sub_category_id } = req.body;

    if (!sub_category_id) {
      return res.status(400).json({
        success: false,
        message: 'sub_category_id is required'
      });
    }

    const subcategoriesCollection = mongoose.connection.db.collection('subcategories');

    const subcategory = await subcategoriesCollection.findOne({
      sub_category_id: sub_category_id.toString()
    });

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    res.json({
      success: true,
      message: 'Subcategory retrieved successfully',
      data: subcategory
    });

  } catch (error) {
    console.error('Error getting subcategory by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new subcategory
router.post('/create_subcategory', async (req, res) => {
  try {
    const {
      sub_category_id,
      sub_category_name,
      category_id,
      dept_id,
      sequence_id,
      is_active = true,
      image_url,
      description
    } = req.body;

    // Validate required fields
    if (!sub_category_id || !sub_category_name || !category_id || !dept_id) {
      return res.status(400).json({
        success: false,
        message: 'sub_category_id, sub_category_name, category_id, and dept_id are required'
      });
    }

    const subcategoriesCollection = mongoose.connection.db.collection('subcategories');

    // Check if subcategory ID already exists
    const existingSubcategory = await subcategoriesCollection.findOne({ sub_category_id: sub_category_id.toString() });
    if (existingSubcategory) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory with this ID already exists'
      });
    }

    // Create new subcategory
    const newSubcategory = {
      sub_category_id: sub_category_id.toString(),
      sub_category_name,
      category_id: category_id.toString(),
      dept_id: dept_id.toString(),
      sequence_id: sequence_id ? parseInt(sequence_id) : 0,
      is_active: Boolean(is_active),
      image_url: image_url || '',
      description: description || '',
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await subcategoriesCollection.insertOne(newSubcategory);

    res.status(201).json({
      success: true,
      message: 'Subcategory created successfully',
      data: {
        _id: result.insertedId,
        ...newSubcategory
      }
    });

  } catch (error) {
    console.error('Error creating subcategory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subcategory'
    });
  }
});

// Update subcategory
router.post('/update_subcategory', async (req, res) => {
  try {
    const {
      sub_category_id,
      sub_category_name,
      category_id,
      dept_id,
      sequence_id,
      is_active,
      image_url,
      description
    } = req.body;

    if (!sub_category_id) {
      return res.status(400).json({
        success: false,
        message: 'sub_category_id is required'
      });
    }

    const subcategoriesCollection = mongoose.connection.db.collection('subcategories');

    // Find subcategory
    const existingSubcategory = await subcategoriesCollection.findOne({
      sub_category_id: sub_category_id.toString()
    });

    if (!existingSubcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Check if sub_category_id is being changed and if it's already taken
    if (sub_category_id && sub_category_id !== existingSubcategory.sub_category_id) {
      const duplicateSubcategory = await subcategoriesCollection.findOne({
        sub_category_id: sub_category_id.toString(),
        _id: { $ne: existingSubcategory._id }
      });
      if (duplicateSubcategory) {
        return res.status(400).json({
          success: false,
          message: 'Subcategory ID already exists'
        });
      }
    }

    // Build update object
    const updateData = {
      updated_at: new Date()
    };

    if (sub_category_name !== undefined) updateData.sub_category_name = sub_category_name;
    if (category_id !== undefined) updateData.category_id = category_id.toString();
    if (dept_id !== undefined) updateData.dept_id = dept_id.toString();
    if (sequence_id !== undefined) updateData.sequence_id = parseInt(sequence_id);
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);
    if (image_url !== undefined) updateData.image_url = image_url;
    if (description !== undefined) updateData.description = description;

    const result = await subcategoriesCollection.updateOne(
      { sub_category_id: sub_category_id.toString() },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes made to subcategory'
      });
    }

    // Get updated subcategory
    const updatedSubcategory = await subcategoriesCollection.findOne({
      sub_category_id: sub_category_id.toString()
    });

    res.json({
      success: true,
      message: 'Subcategory updated successfully',
      data: updatedSubcategory
    });

  } catch (error) {
    console.error('Error updating subcategory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subcategory'
    });
  }
});

// Delete subcategory
router.post('/delete_subcategory', async (req, res) => {
  try {
    const { sub_category_id } = req.body;

    if (!sub_category_id) {
      return res.status(400).json({
        success: false,
        message: 'sub_category_id is required'
      });
    }

    const subcategoriesCollection = mongoose.connection.db.collection('subcategories');

    // Find subcategory
    const existingSubcategory = await subcategoriesCollection.findOne({
      sub_category_id: sub_category_id.toString()
    });

    if (!existingSubcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    const result = await subcategoriesCollection.deleteOne({
      sub_category_id: sub_category_id.toString()
    });

    if (result.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete subcategory'
      });
    }

    res.json({
      success: true,
      message: 'Subcategory deleted successfully',
      data: {
        deleted_sub_category_id: sub_category_id,
        deleted_subcategory: existingSubcategory
      }
    });

  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subcategory'
    });
  }
});

// Get subcategories by category
router.post('/get_subcategories_by_category', async (req, res) => {
  try {
    const { category_id } = req.body;

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: 'category_id is required'
      });
    }

    const subcategoriesCollection = mongoose.connection.db.collection('subcategories');

    const subcategories = await subcategoriesCollection.find({
      category_id: category_id.toString()
    }).sort({ sequence_id: 1 }).toArray();

    res.json({
      success: true,
      message: subcategories.length > 0 ? 'Subcategories retrieved successfully' : 'No subcategories found for this category',
      data: subcategories,
      count: subcategories.length,
      category_id: category_id
    });

  } catch (error) {
    console.error('Error getting subcategories by category:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Bulk update subcategories
router.post('/bulk_update_subcategories', async (req, res) => {
  try {
    const { sub_category_ids, update_data } = req.body;

    if (!sub_category_ids || !Array.isArray(sub_category_ids) || sub_category_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'sub_category_ids array is required and cannot be empty'
      });
    }

    if (!update_data || Object.keys(update_data).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'update_data is required'
      });
    }

    const subcategoriesCollection = mongoose.connection.db.collection('subcategories');

    // Build query to match subcategories by sub_category_id strings
    const query = {
      sub_category_id: { $in: sub_category_ids.map(id => id.toString()) }
    };

    // Add updated_at timestamp
    const bulkUpdateData = {
      ...update_data,
      updated_at: new Date()
    };

    const result = await subcategoriesCollection.updateMany(
      query,
      { $set: bulkUpdateData }
    );

    res.json({
      success: true,
      message: `Bulk update completed. ${result.modifiedCount} subcategories updated.`,
      data: {
        matched_count: result.matchedCount,
        modified_count: result.modifiedCount,
        sub_category_ids: sub_category_ids
      }
    });

  } catch (error) {
    console.error('Error bulk updating subcategories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update subcategories'
    });
  }
});

module.exports = router;
