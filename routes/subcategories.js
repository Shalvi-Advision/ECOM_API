const express = require('express');
const router = express.Router();
const SubCategory = require('../models/SubCategory');
const { body, validationResult } = require('express-validator');
const adminAuth = require('../middleware/adminAuth');
const { populateSubCategoryWithCategory } = require('../utils/populateHelpers');

// Get all subcategories
router.get('/', async (req, res) => {
  try {
    const { category_id } = req.query;
    
    const filter = {};
    if (category_id) filter.category_id = category_id;

    const subCategories = await SubCategory.find(filter)
      .sort({ sub_category_name: 1 })
      .lean();

    // Populate category data manually
    const populatedSubCategories = await Promise.all(
      subCategories.map(subCategory => populateSubCategoryWithCategory(subCategory))
    );

    res.json({
      success: true,
      data: populatedSubCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategories',
      error: error.message
    });
  }
});

// Get subcategory by ID
router.get('/:id', async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id)
      .populate('category_id', 'category_name');

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    res.json({
      success: true,
      data: subCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategory',
      error: error.message
    });
  }
});

// Get subcategories by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const subCategories = await SubCategory.find({ category_id: req.params.categoryId })
      .populate('category_id', 'category_name')
      .sort({ sub_category_name: 1 })
      .lean();

    res.json({
      success: true,
      data: subCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategories by category',
      error: error.message
    });
  }
});

// ==================== ADMIN CRUD ROUTES ====================

// Create new subcategory (Admin only)
router.post('/', adminAuth, [
  body('sub_category_name').notEmpty().withMessage('Subcategory name is required'),
  body('category_id').isMongoId().withMessage('Valid category ID is required')
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

    const {
      sub_category_name,
      category_id,
      sub_category_description,
      sub_category_img,
      is_active = 'Y'
    } = req.body;

    // Check if category exists
    const Category = require('../models/Category');
    const category = await Category.findById(category_id);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Generate a unique ID for the subcategory
    const idsub_category_master = `SUBCAT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const subCategory = new SubCategory({
      idsub_category_master,
      sub_category_name,
      category_id,
      main_category_name: category.category_name || 'Unknown Category'
    });

    await subCategory.save();

    res.status(201).json({
      success: true,
      message: 'Subcategory created successfully',
      data: subCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating subcategory',
      error: error.message
    });
  }
});

// Update subcategory (Admin only)
router.put('/:id', adminAuth, [
  body('sub_category_name').optional().notEmpty().withMessage('Subcategory name cannot be empty'),
  body('is_active').optional().isIn(['Y', 'N']).withMessage('Valid status is required')
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

    const subCategory = await SubCategory.findById(req.params.id);
    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Update fields
    const updateFields = [
      'sub_category_name', 'sub_category_description', 
      'sub_category_img', 'is_active'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        subCategory[field] = req.body[field];
      }
    });

    await subCategory.save();

    res.json({
      success: true,
      message: 'Subcategory updated successfully',
      data: subCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating subcategory',
      error: error.message
    });
  }
});

// Delete subcategory (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id);
    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    await SubCategory.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Subcategory deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting subcategory',
      error: error.message
    });
  }
});

// Get all subcategories for admin (including inactive)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category_id,
      is_active,
      search 
    } = req.query;
    
    const filter = {};
    if (category_id) filter.category_id = category_id;
    if (is_active) filter.is_active = is_active;
    if (search) {
      filter.$or = [
        { sub_category_name: { $regex: search, $options: 'i' } },
        { sub_category_description: { $regex: search, $options: 'i' } }
      ];
    }

    const subCategories = await SubCategory.find(filter)
      .populate('category_id', 'category_name')
      .sort({ sub_category_name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await SubCategory.countDocuments(filter);

    res.json({
      success: true,
      data: {
        subCategories,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_subcategories: total,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategories',
      error: error.message
    });
  }
});

// Toggle subcategory status (Admin only)
router.patch('/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id);
    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    subCategory.is_active = subCategory.is_active === 'Y' ? 'N' : 'Y';
    await subCategory.save();

    res.json({
      success: true,
      message: `Subcategory ${subCategory.is_active === 'Y' ? 'enabled' : 'disabled'} successfully`,
      data: {
        id: subCategory._id,
        is_active: subCategory.is_active
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling subcategory status',
      error: error.message
    });
  }
});

module.exports = router;
