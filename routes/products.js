const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { body, validationResult } = require('express-validator');

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

module.exports = router;
