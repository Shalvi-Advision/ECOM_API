const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Get active products list
router.post('/get_active_products_list', async (req, res) => {
  try {
    const { dept_id, category_id, sub_category_id, store_code, project_code, page = 1, limit = 50 } = req.body;

    if (!store_code || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'store_code and project_code are required'
      });
    }

    const productsCollection = mongoose.connection.db.collection('products');

    // Build query based on provided filters
    const query = {};
    if (dept_id) query.dept_id = dept_id.toString();
    if (category_id) query.category_id = category_id.toString();
    if (sub_category_id) query.sub_category_id = sub_category_id.toString();

    // Add store code filter if needed
    // query.store_code = store_code; // Uncomment if products have store_code field

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const totalCount = await productsCollection.countDocuments(query);

    // Get products with pagination
    const products = await productsCollection.find(query)
      .sort({ product_name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      message: products.length > 0 ? 'Products retrieved successfully' : 'No products found',
      data: products,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_products: totalCount,
        per_page: parseInt(limit),
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1
      },
      filters: {
        dept_id,
        category_id,
        sub_category_id,
        store_code
      }
    });

  } catch (error) {
    console.error('Error getting active products:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get search autocomplete results
router.post('/get_search_autocomplete_results', async (req, res) => {
  try {
    const { product_name, store_code, project_code, limit = 10 } = req.body;

    if (!product_name || !store_code || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'product_name, store_code, and project_code are required'
      });
    }

    const productsCollection = mongoose.connection.db.collection('products');

    // Search for products with name containing the search term (case insensitive)
    const searchRegex = new RegExp(product_name, 'i');

    const products = await productsCollection.find({
      product_name: { $regex: searchRegex }
    })
    .sort({ product_name: 1 })
    .limit(parseInt(limit))
    .toArray();

    // Extract unique product names for autocomplete
    const productNames = [...new Set(products.map(p => p.product_name))];

    res.json({
      success: true,
      message: productNames.length > 0 ? 'Search results found' : 'No products found',
      data: productNames,
      count: productNames.length,
      search_term: product_name
    });

  } catch (error) {
    console.error('Error getting search autocomplete:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get best seller products (generic function)
const getBestSellerProducts = (sellerNumber) => {
  return async (req, res) => {
    try {
      const { store_code, project_code, limit = 20 } = req.body;

      if (!store_code || !project_code) {
        return res.status(400).json({
          success: false,
          message: 'store_code and project_code are required'
        });
      }

      const productsCollection = mongoose.connection.db.collection('products');

      // For best sellers, we'll sort by some criteria
      // In a real implementation, you might have a separate best_sellers collection
      // or a field indicating bestseller status
      const bestSellers = await productsCollection.find({})
        .sort({ product_name: 1 }) // You might want to sort by sales/popularity
        .limit(parseInt(limit))
        .toArray();

      res.json({
        success: true,
        message: `Best seller ${sellerNumber} products retrieved successfully`,
        data: bestSellers,
        count: bestSellers.length,
        seller_category: sellerNumber
      });

    } catch (error) {
      console.error(`Error getting best seller ${sellerNumber}:`, error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

// Create individual routes for best sellers
router.post('/get_active_best_seller_1', getBestSellerProducts(1));
router.post('/get_active_best_seller_2', getBestSellerProducts(2));
router.post('/get_active_best_seller_3', getBestSellerProducts(3));
router.post('/get_active_best_seller_4', getBestSellerProducts(4));

// Get product details by pcode
router.post('/getpcodeproducts', async (req, res) => {
  try {
    const { p_code, store_code, project_code } = req.body;

    if (!p_code || !store_code || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'p_code, store_code, and project_code are required'
      });
    }

    const productsCollection = mongoose.connection.db.collection('products');

    const product = await productsCollection.findOne({
      p_code: p_code.toString()
    });

    if (!product) {
      return res.json({
        success: false,
        message: 'Product not found',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Product details retrieved successfully',
      data: product
    });

  } catch (error) {
    console.error('Error getting product details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get products by multiple pcodes
router.post('/get_products_by_pcodes', async (req, res) => {
  try {
    const { p_codes, store_code, project_code } = req.body;

    if (!p_codes || !Array.isArray(p_codes) || !store_code || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'p_codes (array), store_code, and project_code are required'
      });
    }

    const productsCollection = mongoose.connection.db.collection('products');

    // Convert pcodes to strings
    const productCodes = p_codes.map(code => code.toString());

    const products = await productsCollection.find({
      p_code: { $in: productCodes }
    }).toArray();

    res.json({
      success: true,
      message: products.length > 0 ? 'Products retrieved successfully' : 'No products found',
      data: products,
      count: products.length,
      requested_pcodes: p_codes,
      found_pcodes: products.map(p => p.p_code)
    });

  } catch (error) {
    console.error('Error getting products by pcodes:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get products by price range
router.post('/get_products_by_price_range', async (req, res) => {
  try {
    const { min_price, max_price, store_code, project_code, limit = 50, page = 1 } = req.body;

    if (!store_code || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'store_code and project_code are required'
      });
    }

    const productsCollection = mongoose.connection.db.collection('products');

    // Build price query
    const priceQuery = {};
    if (min_price !== undefined) priceQuery.$gte = parseFloat(min_price);
    if (max_price !== undefined) priceQuery.$lte = parseFloat(max_price);

    const query = {};
    if (Object.keys(priceQuery).length > 0) {
      query.selling_price = priceQuery;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const totalCount = await productsCollection.countDocuments(query);

    // Get products
    const products = await productsCollection.find(query)
      .sort({ selling_price: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      message: products.length > 0 ? 'Products by price range retrieved successfully' : 'No products found in price range',
      data: products,
      count: products.length,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_products: totalCount,
        per_page: parseInt(limit)
      },
      price_filter: {
        min_price: min_price || 0,
        max_price: max_price || 'unlimited'
      }
    });

  } catch (error) {
    console.error('Error getting products by price range:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
