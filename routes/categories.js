const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Department = require('../models/Department');
const { body, validationResult } = require('express-validator');
const adminAuth = require('../middleware/adminAuth');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const { dept_id, store_code } = req.query;
    
    const filter = {};
    if (dept_id) filter.dept_id = dept_id;
    if (store_code) filter.store_code = store_code;

    const categories = await Category.find(filter)
      .populate('dept_id', 'department_name')
      .sort({ sequence_id: 1 })
      .lean();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('dept_id', 'department_name');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
});

// Get categories by department
router.get('/department/:deptId', async (req, res) => {
  try {
    const { store_code } = req.query;
    
    const filter = { dept_id: req.params.deptId };
    if (store_code) filter.store_code = store_code;

    const categories = await Category.find(filter)
      .populate('dept_id', 'department_name')
      .sort({ sequence_id: 1 })
      .lean();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories by department',
      error: error.message
    });
  }
});

// ==================== ADMIN CRUD ROUTES ====================

// Create new category (Admin only)
router.post('/', adminAuth, [
  body('category_name').notEmpty().withMessage('Category name is required'),
  body('dept_id').isMongoId().withMessage('Valid department ID is required'),
  body('store_code').notEmpty().withMessage('Store code is required'),
  body('sequence_id').isInt({ min: 1 }).withMessage('Valid sequence ID is required')
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
      category_name,
      dept_id,
      store_code,
      sequence_id,
      category_description,
      category_img,
      is_active = 'Y'
    } = req.body;

    // Check if department exists
    const department = await Department.findById(dept_id);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if sequence ID already exists for this department and store
    const existingCategory = await Category.findOne({
      dept_id,
      store_code,
      sequence_id
    });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Sequence ID already exists for this department and store'
      });
    }

    // Generate a unique ID for the category
    const idcategory_master = `CAT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const category = new Category({
      idcategory_master,
      category_name,
      dept_id,
      store_code,
      sequence_id,
      category_description,
      image_link: category_img || 'https://via.placeholder.com/200x200?text=Category',
      category_bg_color: '#FFFFFF',
      is_active
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
});

// Update category (Admin only)
router.put('/:id', adminAuth, [
  body('category_name').optional().notEmpty().withMessage('Category name cannot be empty'),
  body('sequence_id').optional().isInt({ min: 1 }).withMessage('Valid sequence ID is required'),
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

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if sequence ID already exists (excluding current category)
    if (req.body.sequence_id && req.body.sequence_id !== category.sequence_id) {
      const existingCategory = await Category.findOne({
        dept_id: category.dept_id,
        store_code: category.store_code,
        sequence_id: req.body.sequence_id,
        _id: { $ne: req.params.id }
      });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Sequence ID already exists for this department and store'
        });
      }
    }

    // Update fields
    const updateFields = [
      'category_name', 'sequence_id', 'category_description', 
      'category_img', 'is_active'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        category[field] = req.body[field];
      }
    });

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
});

// Delete category (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
});

// Get all categories for admin (including inactive)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      dept_id, 
      store_code, 
      is_active,
      search 
    } = req.query;
    
    const filter = {};
    if (dept_id) filter.dept_id = dept_id;
    if (store_code) filter.store_code = store_code;
    if (is_active) filter.is_active = is_active;
    if (search) {
      filter.$or = [
        { category_name: { $regex: search, $options: 'i' } },
        { category_description: { $regex: search, $options: 'i' } }
      ];
    }

    const categories = await Category.find(filter)
      .populate('dept_id', 'department_name')
      .sort({ sequence_id: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Category.countDocuments(filter);

    res.json({
      success: true,
      data: {
        categories,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_categories: total,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// Toggle category status (Admin only)
router.patch('/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.is_active = category.is_active === 'Y' ? 'N' : 'Y';
    await category.save();

    res.json({
      success: true,
      message: `Category ${category.is_active === 'Y' ? 'enabled' : 'disabled'} successfully`,
      data: {
        id: category._id,
        is_active: category.is_active
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling category status',
      error: error.message
    });
  }
});

module.exports = router;
