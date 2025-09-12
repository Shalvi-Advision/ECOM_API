const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { body, validationResult } = require('express-validator');
const adminAuth = require('../middleware/adminAuth');
const { populateProductsReferences } = require('../utils/populateHelpers');

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
    
    if (category_id) filter.category_id = category_id;
    if (sub_category_id) filter.sub_category_id = sub_category_id;
    if (dept_id) filter.dept_id = dept_id;
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
      .populate('dept_id', 'department_name')
      .populate('category_id', 'category_name')
      .populate('sub_category_id', 'sub_category_name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: {
        products,
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
    const product = await Product.findById(req.params.id)
      .populate('dept_id', 'department_name')
      .populate('category_id', 'category_name')
      .populate('sub_category_id', 'sub_category_name');

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
    const { page = 1, limit = 20 } = req.query;
    
    const products = await Product.find({ 
      category_id: req.params.categoryId,
      pcode_status: 'Y'
    })
      .populate('dept_id', 'department_name')
      .populate('category_id', 'category_name')
      .populate('sub_category_id', 'sub_category_name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Product.countDocuments({ 
      category_id: req.params.categoryId,
      pcode_status: 'Y'
    });

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_products: total
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

// Get featured products
router.get('/featured/list', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const products = await Product.find({ 
      is_featured: true,
      pcode_status: 'Y'
    })
      .populate('dept_id', 'department_name')
      .populate('category_id', 'category_name')
      .populate('sub_category_id', 'sub_category_name')
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

// Search products
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const searchFilter = {
      $or: [
        { product_name: { $regex: query, $options: 'i' } },
        { product_description: { $regex: query, $options: 'i' } },
        { brand_name: { $regex: query, $options: 'i' } }
      ],
      pcode_status: 'Y'
    };

    const products = await Product.find(searchFilter)
      .populate('dept_id', 'department_name')
      .populate('category_id', 'category_name')
      .populate('sub_category_id', 'sub_category_name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Product.countDocuments(searchFilter);

    res.json({
      success: true,
      data: {
        products,
        query,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_products: total
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

// ==================== ADMIN CRUD ROUTES ====================

// Create new product (Admin only)
router.post('/', adminAuth, [
  body('product_name').notEmpty().withMessage('Product name is required'),
  body('p_code').notEmpty().withMessage('Product code is required'),
  body('our_price').isNumeric().withMessage('Valid price is required'),
  body('dept_id').isMongoId().withMessage('Valid department ID is required'),
  body('category_id').isMongoId().withMessage('Valid category ID is required'),
  body('sub_category_id').isMongoId().withMessage('Valid subcategory ID is required'),
  body('store_code').notEmpty().withMessage('Store code is required'),
  body('store_quantity').isInt({ min: 0 }).withMessage('Valid quantity is required')
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
      product_name,
      p_code,
      product_description,
      brand_name,
      our_price,
      mrp_price,
      dept_id,
      category_id,
      sub_category_id,
      store_code,
      store_quantity,
      pcode_img,
      is_featured = false,
      pcode_status = 'Y'
    } = req.body;

    // Check if product code already exists
    const existingProduct = await Product.findOne({ p_code });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this code already exists'
      });
    }

    const product = new Product({
      product_name,
      p_code,
      product_description,
      brand_name,
      our_price,
      mrp_price,
      dept_id,
      category_id,
      sub_category_id,
      store_code,
      store_quantity,
      pcode_img,
      is_featured,
      pcode_status
    });

    await product.save();

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

// Update product (Admin only)
router.put('/:id', adminAuth, [
  body('product_name').optional().notEmpty().withMessage('Product name cannot be empty'),
  body('p_code').optional().notEmpty().withMessage('Product code cannot be empty'),
  body('our_price').optional().isNumeric().withMessage('Valid price is required'),
  body('store_quantity').optional().isInt({ min: 0 }).withMessage('Valid quantity is required'),
  body('pcode_status').optional().isIn(['Y', 'N']).withMessage('Valid status is required')
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

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product code already exists (excluding current product)
    if (req.body.p_code && req.body.p_code !== product.p_code) {
      const existingProduct = await Product.findOne({ 
        p_code: req.body.p_code,
        _id: { $ne: req.params.id }
      });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this code already exists'
        });
      }
    }

    // Update fields
    const updateFields = [
      'product_name', 'p_code', 'product_description', 'brand_name',
      'our_price', 'mrp_price', 'dept_id', 'category_id', 'sub_category_id',
      'store_code', 'store_quantity', 'pcode_img', 'is_featured', 'pcode_status'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

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

// Delete product (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

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

// Get all products for admin (including inactive)
router.get('/admin/all', adminAuth, async (req, res) => {
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
      pcode_status,
      sort_by = 'createdAt',
      sort_order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category_id) filter.category_id = category_id;
    if (sub_category_id) filter.sub_category_id = sub_category_id;
    if (dept_id) filter.dept_id = dept_id;
    if (store_code) filter.store_code = store_code;
    if (pcode_status) filter.pcode_status = pcode_status;
    if (min_price || max_price) {
      filter.our_price = {};
      if (min_price) filter.our_price.$gte = parseFloat(min_price);
      if (max_price) filter.our_price.$lte = parseFloat(max_price);
    }
    if (search) {
      filter.$or = [
        { product_name: { $regex: search, $options: 'i' } },
        { product_description: { $regex: search, $options: 'i' } },
        { brand_name: { $regex: search, $options: 'i' } },
        { p_code: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sort_by] = sort_order === 'desc' ? -1 : 1;

    const products = await Product.find(filter)
      .populate('dept_id', 'department_name')
      .populate('category_id', 'category_name')
      .populate('sub_category_id', 'sub_category_name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: {
        products,
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

// Toggle product status (Admin only)
router.patch('/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.pcode_status = product.pcode_status === 'Y' ? 'N' : 'Y';
    await product.save();

    res.json({
      success: true,
      message: `Product ${product.pcode_status === 'Y' ? 'enabled' : 'disabled'} successfully`,
      data: {
        id: product._id,
        pcode_status: product.pcode_status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling product status',
      error: error.message
    });
  }
});

// Update product stock (Admin only)
router.patch('/:id/stock', adminAuth, [
  body('quantity').isInt({ min: 0 }).withMessage('Valid quantity is required'),
  body('operation').isIn(['add', 'subtract', 'set']).withMessage('Valid operation is required')
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

    const { quantity, operation } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    switch (operation) {
      case 'add':
        product.store_quantity += quantity;
        break;
      case 'subtract':
        if (product.store_quantity < quantity) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient stock'
          });
        }
        product.store_quantity -= quantity;
        break;
      case 'set':
        product.store_quantity = quantity;
        break;
    }

    await product.save();

    res.json({
      success: true,
      message: 'Product stock updated successfully',
      data: {
        id: product._id,
        store_quantity: product.store_quantity
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating product stock',
      error: error.message
    });
  }
});

module.exports = router;
