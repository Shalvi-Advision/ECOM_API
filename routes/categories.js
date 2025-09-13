const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Department = require('../models/Department');
const { body, validationResult } = require('express-validator');
const adminAuth = require('../middleware/adminAuth');
const { populateCategoryWithDepartment } = require('../utils/populateHelpers');

/**
 * @swagger
 * /categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get all categories
 *     description: Retrieve a list of all categories with optional department and store filtering
 *     parameters:
 *       - in: query
 *         name: dept_id
 *         schema:
 *           type: string
 *         description: Filter categories by department ID
 *       - in: query
 *         name: store_code
 *         schema:
 *           type: string
 *         description: Filter categories by store code
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags:
 *       - Categories
 *     summary: Create a new category (Admin only)
 *     description: Create a new category in the catalog
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category_name
 *               - dept_id
 *             properties:
 *               category_name:
 *                 type: string
 *                 example: "Electronics"
 *               dept_id:
 *                 type: string
 *                 example: "2"
 *               sequence_id:
 *                 type: number
 *                 example: 1
 *               store_code:
 *                 type: string
 *                 example: "AME"
 *               no_of_col:
 *                 type: string
 *                 example: "12"
 *               image_link:
 *                 type: string
 *                 example: "https://example.com/category.jpg"
 *               category_bg_color:
 *                 type: string
 *                 example: "#FF5733"
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Category created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * /categories/{id}:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get category by ID
 *     description: Retrieve a specific category by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *         example: "64f1a2b3c4d5e6f7g8h9i0j4"
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     tags:
 *       - Categories
 *     summary: Update category (Admin only)
 *     description: Update an existing category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *         example: "64f1a2b3c4d5e6f7g8h9i0j4"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Category updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags:
 *       - Categories
 *     summary: Delete category (Admin only)
 *     description: Delete a category from the catalog
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *         example: "64f1a2b3c4d5e6f7g8h9i0j4"
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Category deleted successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * /categories/department/{deptId}:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get categories by department
 *     description: Retrieve all categories belonging to a specific department
 *     parameters:
 *       - in: path
 *         name: deptId
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *         example: "2"
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Get all categories
router.get('/', async (req, res) => {
  try {
    const { dept_id, store_code } = req.query;

    const filter = {};

    // Handle dept_id filtering - now dept_id is a string that matches department_id
    if (dept_id) {
      filter.dept_id = dept_id;
    }

    if (store_code) filter.store_code = store_code;

    const categories = await Category.find(filter)
      .sort({ sequence_id: 1 })
      .lean();

    // Populate department data manually
    const populatedCategories = await Promise.all(
      categories.map(category => populateCategoryWithDepartment(category))
    );

    res.json({
      success: true,
      data: populatedCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// Get categories by department
router.get('/department/:deptId', async (req, res) => {
  try {
    const { store_code } = req.query;
    const deptId = req.params.deptId;

    const filter = {};

    // Handle dept_id parameter - now dept_id is a string that matches department_id
    filter.dept_id = deptId;

    if (store_code) filter.store_code = store_code;

    const categories = await Category.find(filter)
      .sort({ sequence_id: 1 })
      .lean();

    // Populate department data manually
    const populatedCategories = await Promise.all(
      categories.map(category => populateCategoryWithDepartment(category))
    );

    res.json({
      success: true,
      data: populatedCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories by department',
      error: error.message
    });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // Simple test - just return the ID for now
    res.json({
      success: true,
      message: `Route working! Received ID: ${id}`,
      route: 'GET /:id',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error',
      error: error.message
    });
  }
});

// Test route
router.get('/test-route', (req, res) => {
  res.json({
    success: true,
    message: 'Test route working!',
    timestamp: new Date().toISOString()
  });
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
