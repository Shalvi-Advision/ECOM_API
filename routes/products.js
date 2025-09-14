const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Department = require('../models/Department');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const { body, validationResult } = require('express-validator');
const adminAuth = require('../middleware/adminAuth');
const mongoose = require('mongoose');

/**
 * @swagger
 * /products:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get all products
 *     description: Retrieve a paginated list of products with optional filters
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: sub_category_id
 *         schema:
 *           type: string
 *         description: Filter by subcategory ID
 *       - in: query
 *         name: dept_id
 *         schema:
 *           type: string
 *         description: Filter by department ID
 *       - in: query
 *         name: store_code
 *         schema:
 *           type: string
 *         description: Filter by store code
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product name, description, or brand
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         current_page:
 *                           type: integer
 *                           example: 1
 *                         total_pages:
 *                           type: integer
 *                           example: 10
 *                         total_products:
 *                           type: integer
 *                           example: 200
 *                         has_next:
 *                           type: boolean
 *                           example: true
 *                         has_prev:
 *                           type: boolean
 *                           example: false
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags:
 *       - Products
 *     summary: Create a new product (Admin only)
 *     description: Create a new product in the catalog
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_name
 *               - our_price
 *               - dept_id
 *               - category_id
 *               - sub_category_id
 *             properties:
 *               product_name:
 *                 type: string
 *                 example: "New Product"
 *               product_description:
 *                 type: string
 *                 example: "Product description"
 *               our_price:
 *                 type: number
 *                 example: 25.00
 *               dept_id:
 *                 type: string
 *                 example: "2"
 *               category_id:
 *                 type: string
 *                 example: "89"
 *               sub_category_id:
 *                 type: string
 *                 example: "349"
 *               store_code:
 *                 type: string
 *                 example: "AME"
 *               package_size:
 *                 type: number
 *                 example: 500
 *               package_unit:
 *                 type: string
 *                 example: "GM"
 *               brand_name:
 *                 type: string
 *                 example: "Brand Name"
 *               store_quantity:
 *                 type: number
 *                 example: 100
 *               max_quantity_allowed:
 *                 type: number
 *                 example: 5
 *               pcode_img:
 *                 type: string
 *                 example: "https://example.com/image.jpg"
 *               discount_percentage:
 *                 type: number
 *                 example: 10
 *               featured:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Product created successfully
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
 *                   example: "Product created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
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
 */

// Helper function to check if a string is a valid ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get product by ID
 *     description: Retrieve a single product by its product code
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product code (p_code)
 *         example: "2390"
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
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
 *       - Products
 *     summary: Update product (Admin only)
 *     description: Update an existing product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product code (p_code)
 *         example: "2390"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully
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
 *                   example: "Product updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
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
 *       - Products
 *     summary: Delete product (Admin only)
 *     description: Delete a product from the catalog
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product code (p_code)
 *         example: "2390"
 *     responses:
 *       200:
 *         description: Product deleted successfully
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
 *                   example: "Product deleted successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
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
 */

// Get all products with pagination and filters
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category_id,
      sub_category_id,
      dept_id,
      store_code,
      search,
      min_price,
      max_price,
      sort_by = 'createdAt',
      sort_order = 'desc'
    } = req.query;

    // Build filter object
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

    // Handle sub_category_id filtering - can be ObjectId or idsub_category_master string
    if (sub_category_id) {
      if (mongoose.Types.ObjectId.isValid(sub_category_id)) {
        filter.sub_category_id = sub_category_id;
      } else {
        // If it's not a valid ObjectId, try to find subcategory by idsub_category_master string
        const subCategory = await SubCategory.findOne({ idsub_category_master: sub_category_id });
        if (subCategory) {
          filter.sub_category_id = subCategory._id;
        }
      }
    }

    // Handle dept_id filtering - can be ObjectId or department_id string
    if (dept_id) {
      if (mongoose.Types.ObjectId.isValid(dept_id)) {
        filter.dept_id = dept_id;
      } else {
        // If it's not a valid ObjectId, try to find department by department_id string
        const department = await Department.findOne({ department_id: dept_id });
        if (department) {
          filter.dept_id = department._id;
        }
      }
    }

    if (store_code) filter.store_code = store_code;
    if (min_price || max_price) {
      filter.our_price = {};
      if (min_price) filter.our_price.$gte = parseFloat(min_price);
      if (max_price) filter.our_price.$lte = parseFloat(max_price);
    }
    if (search) {
      filter.$or = [
        { product_name: { $regex: search, $options: 'i' } },
        { product_description: { $regex: search, $options: 'i' } },
        { brand_name: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Only show active products
    filter.pcode_status = 'Y';

    // Build sort object
    const sort = {};
    sort[sort_by] = sort_order === 'desc' ? -1 : 1;

    const products = await Product.find(filter)
      .populate('dept_id', 'department_name image_link sequence_id department_id')
      .populate('category_id', 'category_name image_link sequence_id idcategory_master')
      .populate('sub_category_id', 'sub_category_name idsub_category_master')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const populatedProducts = products;

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: {
        products: populatedProducts,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_products: total,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ p_code: req.params.id })
      .populate('dept_id', 'department_name image_link sequence_id department_id')
      .populate('category_id', 'category_name image_link sequence_id idcategory_master')
      .populate('sub_category_id', 'sub_category_name idsub_category_master')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// Get products by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const { page = 1, limit = 20 } = req.query;

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

    const products = await Product.find({
      category_id: categoryObjectId,
      pcode_status: 'Y'
    })
      .populate('dept_id', 'department_name image_link sequence_id department_id')
      .populate('category_id', 'category_name image_link sequence_id idcategory_master')
      .populate('sub_category_id', 'sub_category_name idsub_category_master')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Product.countDocuments({
      category_id: categoryObjectId,
      pcode_status: 'Y'
    });

    res.json({
      success: true,
      data: {
        products: products,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_products: total,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products by category',
      error: error.message
    });
  }
});

// Get products by subcategory
router.get('/subcategory/:subCategoryId', async (req, res) => {
  try {
    const subCategoryId = req.params.subCategoryId;
    const { page = 1, limit = 20 } = req.query;

    let subCategoryObjectId = subCategoryId;

    // Handle subcategory ID - can be ObjectId or idsub_category_master string
    if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
      // If it's not a valid ObjectId, try to find subcategory by idsub_category_master string
      const subCategory = await SubCategory.findOne({ idsub_category_master: subCategoryId });
      if (subCategory) {
        subCategoryObjectId = subCategory._id;
      } else {
        return res.status(404).json({
          success: false,
          message: 'Subcategory not found'
        });
      }
    }

    const products = await Product.find({
      sub_category_id: subCategoryObjectId,
      pcode_status: 'Y'
    })
      .populate('dept_id', 'department_name image_link sequence_id department_id')
      .populate('category_id', 'category_name image_link sequence_id idcategory_master')
      .populate('sub_category_id', 'sub_category_name idsub_category_master')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Product.countDocuments({
      sub_category_id: subCategoryObjectId,
      pcode_status: 'Y'
    });

    res.json({
      success: true,
      data: {
        products: products,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_products: total,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products by subcategory',
      error: error.message
    });
  }
});

// Get products by department
router.get('/department/:deptId', async (req, res) => {
  try {
    const deptId = req.params.deptId;
    const { page = 1, limit = 20 } = req.query;

    let deptObjectId = deptId;

    // Handle department ID - can be ObjectId or department_id string
    if (!mongoose.Types.ObjectId.isValid(deptId)) {
      // If it's not a valid ObjectId, try to find department by department_id string
      const department = await Department.findOne({ department_id: deptId });
      if (department) {
        deptObjectId = department._id;
      } else {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }
    }

    const products = await Product.find({
      dept_id: deptObjectId,
      pcode_status: 'Y'
    })
      .populate('dept_id', 'department_name image_link sequence_id department_id')
      .populate('category_id', 'category_name image_link sequence_id idcategory_master')
      .populate('sub_category_id', 'sub_category_name idsub_category_master')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Product.countDocuments({
      dept_id: deptObjectId,
      pcode_status: 'Y'
    });

    res.json({
      success: true,
      data: {
        products: products,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_products: total,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products by department',
      error: error.message
    });
  }
});

// Search products
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const products = await Product.find({
      $and: [
        { pcode_status: 'Y' },
        {
          $or: [
            { product_name: { $regex: query, $options: 'i' } },
            { product_description: { $regex: query, $options: 'i' } },
            { brand_name: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
      .populate('dept_id', 'department_name image_link sequence_id department_id')
      .populate('category_id', 'category_name image_link sequence_id idcategory_master')
      .populate('sub_category_id', 'sub_category_name idsub_category_master')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const populatedProducts = products;

    const total = await Product.countDocuments({
      $and: [
        { pcode_status: 'Y' },
        {
          $or: [
            { product_name: { $regex: query, $options: 'i' } },
            { product_description: { $regex: query, $options: 'i' } },
            { brand_name: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    });

    res.json({
      success: true,
      data: {
        products: populatedProducts,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_products: total,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching products',
      error: error.message
    });
  }
});

// Get featured products
router.get('/featured/list', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.find({
      pcode_status: 'Y',
      is_featured: true
    })
      .populate('dept_id', 'department_name image_link sequence_id department_id')
      .populate('category_id', 'category_name image_link sequence_id idcategory_master')
      .populate('sub_category_id', 'sub_category_name idsub_category_master')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
      error: error.message
    });
  }
});

// Get products by store
router.get('/store/:store_code', async (req, res) => {
  try {
    const { store_code } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const products = await Product.find({
      store_code: store_code,
      pcode_status: 'Y'
    })
      .populate('dept_id', 'department_name image_link sequence_id department_id')
      .populate('category_id', 'category_name image_link sequence_id idcategory_master')
      .populate('sub_category_id', 'sub_category_name idsub_category_master')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Product.countDocuments({
      store_code: store_code,
      pcode_status: 'Y'
    });

    res.json({
      success: true,
      data: {
        products: products,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_products: total,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products by store',
      error: error.message
    });
  }
});

// Admin routes (protected)
// Create product
router.post('/', adminAuth, [
  body('product_name').notEmpty().withMessage('Product name is required'),
  body('our_price').isNumeric().withMessage('Price must be a number'),
  body('dept_id').notEmpty().withMessage('Department ID is required'),
  body('category_id').notEmpty().withMessage('Category ID is required'),
  body('sub_category_id').notEmpty().withMessage('Subcategory ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const product = new Product(req.body);
    await product.save();

    // Populate references using mongoose
    await product.populate([
      { path: 'dept_id', select: 'department_name image_link sequence_id department_id' },
      { path: 'category_id', select: 'category_name image_link sequence_id idcategory_master' },
      { path: 'sub_category_id', select: 'sub_category_name idsub_category_master' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
});

// Update product
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { p_code: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Populate references using mongoose
    await product.populate([
      { path: 'dept_id', select: 'department_name image_link sequence_id department_id' },
      { path: 'category_id', select: 'category_name image_link sequence_id idcategory_master' },
      { path: 'sub_category_id', select: 'sub_category_name idsub_category_master' }
    ]);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
});

// Delete product
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ pcode: req.params.id });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
});

// Bulk update products
router.put('/bulk/update', adminAuth, async (req, res) => {
  try {
    const { product_ids, update_data } = req.body;

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required'
      });
    }

    const result = await Product.updateMany(
      { pcode: { $in: product_ids } },
      update_data
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} products updated successfully`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error bulk updating products',
      error: error.message
    });
  }
});

// Get product statistics
router.get('/admin/statistics', adminAuth, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ pcode_status: 'Y' });
    const inactiveProducts = await Product.countDocuments({ pcode_status: 'N' });
    const featuredProducts = await Product.countDocuments({ featured: true });

    // Get products by department
    const productsByDept = await Product.aggregate([
      { $match: { pcode_status: 'Y' } },
      { $group: { _id: '$dept_id', count: { $sum: 1 } } },
      { $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: 'department_id',
        as: 'department'
      }},
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      { $project: {
        department_name: '$department.department_name',
        count: 1
      }}
    ]);

    // Get products by category
    const productsByCategory = await Product.aggregate([
      { $match: { pcode_status: 'Y' } },
      { $group: { _id: '$category_id', count: { $sum: 1 } } },
      { $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: 'idcategory_master',
        as: 'category'
      }},
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $project: {
        category_name: '$category.category_name',
        count: 1
      }}
    ]);

    res.json({
      success: true,
      data: {
        total_products: totalProducts,
        active_products: activeProducts,
        inactive_products: inactiveProducts,
        featured_products: featuredProducts,
        products_by_department: productsByDept,
        products_by_category: productsByCategory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product statistics',
      error: error.message
    });
  }
});

module.exports = router;
