const express = require('express');
const router = express.Router();
const SubCategory = require('../models/SubCategory');
const { body, validationResult } = require('express-validator');
const adminAuth = require('../middleware/adminAuth');
// Removed populate helper as we're using mongoose populate now

/**
 * @swagger
 * /subcategories:
 *   get:
 *     tags:
 *       - Subcategories
 *     summary: Get all subcategories
 *     description: Retrieve a list of all subcategories with optional category filtering
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *         description: Filter subcategories by category ID
 *     responses:
 *       200:
 *         description: Subcategories retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64f1a2b3c4d5e6f7g8h9i0j7"
 *                       idsub_category_master:
 *                         type: string
 *                         example: "349"
 *                       sub_category_name:
 *                         type: string
 *                         example: "Rice & Grains"
 *                       category_id:
 *                         type: string
 *                         example: "89"
 *                       sequence_id:
 *                         type: number
 *                         example: 1
 *                       image_link:
 *                         type: string
 *                         example: "https://example.com/subcategory.jpg"
 *                       sub_category_bg_color:
 *                         type: string
 *                         example: "#FF5733"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags:
 *       - Subcategories
 *     summary: Create a new subcategory (Admin only)
 *     description: Create a new subcategory in the catalog
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sub_category_name
 *               - category_id
 *             properties:
 *               sub_category_name:
 *                 type: string
 *                 example: "Rice & Grains"
 *               category_id:
 *                 type: string
 *                 example: "89"
 *               sequence_id:
 *                 type: number
 *                 example: 1
 *               image_link:
 *                 type: string
 *                 example: "https://example.com/subcategory.jpg"
 *               sub_category_bg_color:
 *                 type: string
 *                 example: "#FF5733"
 *     responses:
 *       201:
 *         description: Subcategory created successfully
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
 *                   example: "Subcategory created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64f1a2b3c4d5e6f7g8h9i0j7"
 *                     idsub_category_master:
 *                       type: string
 *                       example: "349"
 *                     sub_category_name:
 *                       type: string
 *                       example: "Rice & Grains"
 *                     category_id:
 *                       type: string
 *                       example: "89"
 *                     sequence_id:
 *                       type: number
 *                       example: 1
 *                     image_link:
 *                       type: string
 *                       example: "https://example.com/subcategory.jpg"
 *                     sub_category_bg_color:
 *                       type: string
 *                       example: "#FF5733"
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
 * /subcategories/{id}:
 *   get:
 *     tags:
 *       - Subcategories
 *     summary: Get subcategory by ID
 *     description: Retrieve a specific subcategory by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subcategory ID
 *         example: "64f1a2b3c4d5e6f7g8h9i0j7"
 *     responses:
 *       200:
 *         description: Subcategory retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64f1a2b3c4d5e6f7g8h9i0j7"
 *                     idsub_category_master:
 *                       type: string
 *                       example: "349"
 *                     sub_category_name:
 *                       type: string
 *                       example: "Rice & Grains"
 *                     category_id:
 *                       type: string
 *                       example: "89"
 *                     sequence_id:
 *                       type: number
 *                       example: 1
 *                     image_link:
 *                       type: string
 *                       example: "https://example.com/subcategory.jpg"
 *                     sub_category_bg_color:
 *                       type: string
 *                       example: "#FF5733"
 *       404:
 *         description: Subcategory not found
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
 *       - Subcategories
 *     summary: Update subcategory (Admin only)
 *     description: Update an existing subcategory
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subcategory ID
 *         example: "64f1a2b3c4d5e6f7g8h9i0j7"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sub_category_name:
 *                 type: string
 *                 example: "Updated Rice & Grains"
 *               category_id:
 *                 type: string
 *                 example: "89"
 *               sequence_id:
 *                 type: number
 *                 example: 2
 *               image_link:
 *                 type: string
 *                 example: "https://example.com/updated.jpg"
 *               sub_category_bg_color:
 *                 type: string
 *                 example: "#00FF00"
 *     responses:
 *       200:
 *         description: Subcategory updated successfully
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
 *                   example: "Subcategory updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64f1a2b3c4d5e6f7g8h9i0j7"
 *                     idsub_category_master:
 *                       type: string
 *                       example: "349"
 *                     sub_category_name:
 *                       type: string
 *                       example: "Updated Rice & Grains"
 *                     category_id:
 *                       type: string
 *                       example: "89"
 *                     sequence_id:
 *                       type: number
 *                       example: 2
 *                     image_link:
 *                       type: string
 *                       example: "https://example.com/updated.jpg"
 *                     sub_category_bg_color:
 *                       type: string
 *                       example: "#00FF00"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Subcategory not found
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
 *       - Subcategories
 *     summary: Delete subcategory (Admin only)
 *     description: Delete a subcategory from the catalog
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subcategory ID
 *         example: "64f1a2b3c4d5e6f7g8h9i0j7"
 *     responses:
 *       200:
 *         description: Subcategory deleted successfully
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
 *                   example: "Subcategory deleted successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Subcategory not found
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
 * /subcategories/category/{categoryId}:
 *   get:
 *     tags:
 *       - Subcategories
 *     summary: Get subcategories by category
 *     description: Retrieve all subcategories belonging to a specific category
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *         example: "89"
 *     responses:
 *       200:
 *         description: Subcategories retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64f1a2b3c4d5e6f7g8h9i0j7"
 *                       idsub_category_master:
 *                         type: string
 *                         example: "349"
 *                       sub_category_name:
 *                         type: string
 *                         example: "Rice & Grains"
 *                       category_id:
 *                         type: string
 *                         example: "89"
 *                       sequence_id:
 *                         type: number
 *                         example: 1
 *                       image_link:
 *                         type: string
 *                         example: "https://example.com/subcategory.jpg"
 *                       sub_category_bg_color:
 *                         type: string
 *                         example: "#FF5733"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Get all subcategories
router.get('/', async (req, res) => {
  try {
    const { category_id, dept_id } = req.query;

    const filter = {};

    // Handle category_id filtering - can be ObjectId or idcategory_master string
    if (category_id) {
      if (mongoose.Types.ObjectId.isValid(category_id)) {
        filter.category_id = category_id;
      } else {
        // If it's not a valid ObjectId, try to find category by idcategory_master string
        const category = await Category.findOne({ idcategory_master: category_id });
        if (category) {
          filter.category_id = category._id;
        }
      }
    }

    // Handle dept_id filtering for hierarchical queries
    if (dept_id) {
      if (mongoose.Types.ObjectId.isValid(dept_id)) {
        // Find categories under this department, then find subcategories under those categories
        const categories = await Category.find({ dept_id }).select('_id');
        const categoryIds = categories.map(cat => cat._id);
        filter.category_id = { $in: categoryIds };
      } else {
        // If it's not a valid ObjectId, try to find department by department_id string
        const department = await Department.findOne({ department_id: dept_id });
        if (department) {
          const categories = await Category.find({ dept_id: department._id }).select('_id');
          const categoryIds = categories.map(cat => cat._id);
          filter.category_id = { $in: categoryIds };
        }
      }
    }

    const subCategories = await SubCategory.find(filter)
      .populate({
        path: 'category_id',
        populate: {
          path: 'dept_id',
          select: 'department_name image_link sequence_id department_id'
        },
        select: 'category_name image_link sequence_id idcategory_master'
      })
      .sort({ sub_category_name: 1 })
      .lean();

    res.json({
      success: true,
      data: subCategories
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
    const id = req.params.id;
    let subCategory;

    // Handle both ObjectId and string idsub_category_master
    if (mongoose.Types.ObjectId.isValid(id)) {
      // Try to find by ObjectId first
      subCategory = await SubCategory.findById(id);
    }

    // If not found by ObjectId or if it's not a valid ObjectId, search by idsub_category_master
    if (!subCategory) {
      subCategory = await SubCategory.findOne({ idsub_category_master: id });
    }

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Populate full hierarchy
    await subCategory.populate({
      path: 'category_id',
      populate: {
        path: 'dept_id',
        select: 'department_name image_link sequence_id department_id'
      },
      select: 'category_name image_link sequence_id idcategory_master'
    });

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
    const categoryId = req.params.categoryId;
    let categoryObjectId = categoryId;

    // Handle category ID - can be ObjectId or idcategory_master string
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      // If it's not a valid ObjectId, try to find category by idcategory_master string
      const category = await Category.findOne({ idcategory_master: categoryId });
      if (category) {
        categoryObjectId = category._id;
      } else {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    const subCategories = await SubCategory.find({ category_id: categoryObjectId })
      .populate({
        path: 'category_id',
        populate: {
          path: 'dept_id',
          select: 'department_name image_link sequence_id department_id'
        },
        select: 'category_name image_link sequence_id idcategory_master'
      })
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

    // Check if category exists - handle both ObjectId and string IDs
    const Category = require('../models/Category');
    let category;

    if (mongoose.Types.ObjectId.isValid(category_id)) {
      category = await Category.findById(category_id);
    } else {
      // Try to find by idcategory_master string
      category = await Category.findOne({ idcategory_master: category_id });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Use the ObjectId for storage
    const categoryObjectId = category._id;

    // Generate a unique ID for the subcategory
    const idsub_category_master = `SUBCAT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const subCategory = new SubCategory({
      idsub_category_master,
      sub_category_name,
      category_id: categoryObjectId, // Use ObjectId
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

    // Handle category_id filtering - can be ObjectId or idcategory_master string
    if (category_id) {
      if (mongoose.Types.ObjectId.isValid(category_id)) {
        filter.category_id = category_id;
      } else {
        // If it's not a valid ObjectId, try to find category by idcategory_master string
        const category = await Category.findOne({ idcategory_master: category_id });
        if (category) {
          filter.category_id = category._id;
        }
      }
    }

    if (is_active) filter.is_active = is_active;
    if (search) {
      filter.$or = [
        { sub_category_name: { $regex: search, $options: 'i' } },
        { sub_category_description: { $regex: search, $options: 'i' } }
      ];
    }

    const subCategories = await SubCategory.find(filter)
      .populate({
        path: 'category_id',
        populate: {
          path: 'dept_id',
          select: 'department_name image_link sequence_id department_id'
        },
        select: 'category_name image_link sequence_id idcategory_master'
      })
      .sort({ sub_category_name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const populatedSubCategories = subCategories;

    const total = await SubCategory.countDocuments(filter);

    res.json({
      success: true,
      data: {
        subCategories: populatedSubCategories,
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
