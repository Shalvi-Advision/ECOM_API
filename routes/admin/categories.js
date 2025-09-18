const express = require('express');
const mongoose = require('mongoose');
const { protect, adminOnly } = require('../../middleware/auth');
const router = express.Router();

// Apply admin authentication to all routes
router.use(protect);
router.use(adminOnly);

// Get all categories (admin view with pagination)
router.post('/get_all_categories', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, dept_id, sort_by = 'category_name', sort_order = 'asc' } = req.body;

    const categoriesCollection = mongoose.connection.db.collection('categories');

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { category_name: { $regex: search, $options: 'i' } },
        { category_id: { $regex: search, $options: 'i' } }
      ];
    }
    if (dept_id) query.dept_id = dept_id.toString();

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const totalCount = await categoriesCollection.countDocuments(query);

    // Get categories
    const categories = await categoriesCollection.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      message: categories.length > 0 ? 'Categories retrieved successfully' : 'No categories found',
      data: categories,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_categories: totalCount,
        per_page: parseInt(limit),
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1
      },
      filters: {
        search,
        dept_id
      }
    });

  } catch (error) {
    console.error('Error getting all categories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get category by ID
router.post('/get_category_by_id', async (req, res) => {
  try {
    const { category_id } = req.body;

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: 'category_id is required'
      });
    }

    const categoriesCollection = mongoose.connection.db.collection('categories');

    const category = await categoriesCollection.findOne({
      _id: new mongoose.Types.ObjectId(category_id)
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category retrieved successfully',
      data: category
    });

  } catch (error) {
    console.error('Error getting category by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new category
router.post('/create_category', async (req, res) => {
  try {
    const {
      category_id,
      category_name,
      dept_id,
      sequence_id,
      is_active = true,
      image_url,
      description
    } = req.body;

    // Validate required fields
    if (!category_id || !category_name || !dept_id) {
      return res.status(400).json({
        success: false,
        message: 'category_id, category_name, and dept_id are required'
      });
    }

    const categoriesCollection = mongoose.connection.db.collection('categories');

    // Check if category ID already exists
    const existingCategory = await categoriesCollection.findOne({ category_id: category_id.toString() });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this ID already exists'
      });
    }

    // Create new category
    const newCategory = {
      category_id: category_id.toString(),
      category_name,
      dept_id: dept_id.toString(),
      sequence_id: sequence_id ? parseInt(sequence_id) : 0,
      is_active: Boolean(is_active),
      image_url: image_url || '',
      description: description || '',
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await categoriesCollection.insertOne(newCategory);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        _id: result.insertedId,
        ...newCategory
      }
    });

  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category'
    });
  }
});

// Update category
router.post('/update_category', async (req, res) => {
  try {
    const {
      category_id,
      category_name,
      dept_id,
      sequence_id,
      is_active,
      image_url,
      description
    } = req.body;

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: 'category_id is required'
      });
    }

    const categoriesCollection = mongoose.connection.db.collection('categories');

    // Find category by category_id (string field)
    const existingCategory = await categoriesCollection.findOne({
      category_id: category_id.toString()
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category_id is being changed and if it's already taken
    if (category_id && category_id !== existingCategory.category_id) {
      const duplicateCategory = await categoriesCollection.findOne({
        category_id: category_id.toString(),
        _id: { $ne: existingCategory._id }
      });
      if (duplicateCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category ID already exists'
        });
      }
    }

    // Build update object
    const updateData = {
      updated_at: new Date()
    };

    if (category_name !== undefined) updateData.category_name = category_name;
    if (dept_id !== undefined) updateData.dept_id = dept_id.toString();
    if (sequence_id !== undefined) updateData.sequence_id = parseInt(sequence_id);
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);
    if (image_url !== undefined) updateData.image_url = image_url;
    if (description !== undefined) updateData.description = description;

    const result = await categoriesCollection.updateOne(
      { category_id: category_id.toString() },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes made to category'
      });
    }

    // Get updated category
    const updatedCategory = await categoriesCollection.findOne({
      category_id: category_id.toString()
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });

  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category'
    });
  }
});

// Delete category
router.post('/delete_category', async (req, res) => {
  try {
    const { category_id } = req.body;

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: 'category_id is required'
      });
    }

    const categoriesCollection = mongoose.connection.db.collection('categories');

    // Find category
    const existingCategory = await categoriesCollection.findOne({
      category_id: category_id.toString()
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const result = await categoriesCollection.deleteOne({
      category_id: category_id.toString()
    });

    if (result.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete category'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully',
      data: {
        deleted_category_id: category_id,
        deleted_category: existingCategory
      }
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
});

// Get categories by department
router.post('/get_categories_by_department', async (req, res) => {
  try {
    const { dept_id } = req.body;

    if (!dept_id) {
      return res.status(400).json({
        success: false,
        message: 'dept_id is required'
      });
    }

    const categoriesCollection = mongoose.connection.db.collection('categories');

    const categories = await categoriesCollection.find({
      dept_id: dept_id.toString()
    }).sort({ sequence_id: 1 }).toArray();

    res.json({
      success: true,
      message: categories.length > 0 ? 'Categories retrieved successfully' : 'No categories found for this department',
      data: categories,
      count: categories.length,
      dept_id: dept_id
    });

  } catch (error) {
    console.error('Error getting categories by department:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Bulk update categories
router.post('/bulk_update_categories', async (req, res) => {
  try {
    const { category_ids, update_data } = req.body;

    if (!category_ids || !Array.isArray(category_ids) || category_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'category_ids array is required and cannot be empty'
      });
    }

    if (!update_data || Object.keys(update_data).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'update_data is required'
      });
    }

    const categoriesCollection = mongoose.connection.db.collection('categories');

    // Build query to match categories by category_id strings
    const query = {
      category_id: { $in: category_ids.map(id => id.toString()) }
    };

    // Add updated_at timestamp
    const bulkUpdateData = {
      ...update_data,
      updated_at: new Date()
    };

    const result = await categoriesCollection.updateMany(
      query,
      { $set: bulkUpdateData }
    );

    res.json({
      success: true,
      message: `Bulk update completed. ${result.modifiedCount} categories updated.`,
      data: {
        matched_count: result.matchedCount,
        modified_count: result.modifiedCount,
        category_ids: category_ids
      }
    });

  } catch (error) {
    console.error('Error bulk updating categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update categories'
    });
  }
});

module.exports = router;
