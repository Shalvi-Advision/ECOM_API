const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Department = require('../models/Department');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const { body, validationResult } = require('express-validator');
const adminAuth = require('../middleware/adminAuth');
const mongoose = require('mongoose');

// Helper function to check if a string is a valid ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper function to populate product references manually
const populateProductsReferences = async (product) => {
  try {
    // Populate department
    if (product.dept_id) {
      let department;
      if (isValidObjectId(product.dept_id)) {
        department = await Department.findById(product.dept_id).lean();
      } else {
        department = await Department.findOne({ department_id: product.dept_id }).lean();
      }
      
      if (department) {
        product.dept_id = {
          _id: department._id,
          department_name: department.department_name
        };
      } else {
        product.dept_id = null;
      }
    }

    // Populate category
    if (product.category_id) {
      let category;
      if (isValidObjectId(product.category_id)) {
        category = await Category.findById(product.category_id).lean();
      } else {
        category = await Category.findOne({ idcategory_master: product.category_id }).lean();
      }
      
      if (category) {
        product.category_id = {
          _id: category._id,
          category_name: category.category_name
        };
      } else {
        product.category_id = null;
      }
    }

    // Populate subcategory
    if (product.sub_category_id) {
      let subCategory;
      if (isValidObjectId(product.sub_category_id)) {
        subCategory = await SubCategory.findById(product.sub_category_id).lean();
      } else {
        subCategory = await SubCategory.findOne({ idsub_category_master: product.sub_category_id }).lean();
      }
      
      if (subCategory) {
        product.sub_category_id = {
          _id: subCategory._id,
          sub_category_name: subCategory.sub_category_name
        };
      } else {
        product.sub_category_id = null;
      }
    }

    return product;
  } catch (error) {
    console.error('Error populating product references:', error);
    return product; // Return original product if population fails
  }
};

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
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Populate references manually
    const populatedProducts = await Promise.all(
      products.map(product => populateProductsReferences(product))
    );

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
    const product = await Product.findOne({ pcode: req.params.id }).lean();
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Populate references manually
    const populatedProduct = await populateProductsReferences(product);

    res.json({
      success: true,
      data: populatedProduct
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
router.get('/category/:category_id', async (req, res) => {
  try {
    const { category_id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const products = await Product.find({ 
      category_id: category_id,
      pcode_status: 'Y'
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Populate references manually
    const populatedProducts = await Promise.all(
      products.map(product => populateProductsReferences(product))
    );

    const total = await Product.countDocuments({ 
      category_id: category_id,
      pcode_status: 'Y'
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
      message: 'Error fetching products by category',
      error: error.message
    });
  }
});

// Get products by subcategory
router.get('/subcategory/:sub_category_id', async (req, res) => {
  try {
    const { sub_category_id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const products = await Product.find({ 
      sub_category_id: sub_category_id,
      pcode_status: 'Y'
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Populate references manually
    const populatedProducts = await Promise.all(
      products.map(product => populateProductsReferences(product))
    );

    const total = await Product.countDocuments({ 
      sub_category_id: sub_category_id,
      pcode_status: 'Y'
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
      message: 'Error fetching products by subcategory',
      error: error.message
    });
  }
});

// Get products by department
router.get('/department/:dept_id', async (req, res) => {
  try {
    const { dept_id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const products = await Product.find({ 
      dept_id: dept_id,
      pcode_status: 'Y'
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Populate references manually
    const populatedProducts = await Promise.all(
      products.map(product => populateProductsReferences(product))
    );

    const total = await Product.countDocuments({ 
      dept_id: dept_id,
      pcode_status: 'Y'
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
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Populate references manually
    const populatedProducts = await Promise.all(
      products.map(product => populateProductsReferences(product))
    );

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
      featured: true
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Populate references manually
    const populatedProducts = await Promise.all(
      products.map(product => populateProductsReferences(product))
    );

    res.json({
      success: true,
      data: populatedProducts
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
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Populate references manually
    const populatedProducts = await Promise.all(
      products.map(product => populateProductsReferences(product))
    );

    const total = await Product.countDocuments({ 
      store_code: store_code,
      pcode_status: 'Y'
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

    // Populate references manually
    const populatedProduct = await populateProductsReferences(product.toObject());

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct
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
      { pcode: req.params.id },
      req.body,
      { new: true, runValidators: true }
    ).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Populate references manually
    const populatedProduct = await populateProductsReferences(product);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: populatedProduct
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
