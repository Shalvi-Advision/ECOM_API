const express = require('express');
const mongoose = require('mongoose');
const { protect, adminOnly } = require('../../middleware/auth');
const router = express.Router();

// Apply admin authentication to all routes
router.use(protect);
router.use(adminOnly);

// Get all products (admin view with pagination)
router.post('/get_all_products', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, category_id, dept_id, sort_by = 'product_name', sort_order = 'asc' } = req.body;

    const productsCollection = mongoose.connection.db.collection('products');

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { product_name: { $regex: search, $options: 'i' } },
        { p_code: { $regex: search, $options: 'i' } }
      ];
    }
    if (category_id) query.category_id = category_id.toString();
    if (dept_id) query.dept_id = dept_id.toString();

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const totalCount = await productsCollection.countDocuments(query);

    // Get products
    const products = await productsCollection.find(query)
      .sort(sortObj)
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
        search,
        category_id,
        dept_id
      }
    });

  } catch (error) {
    console.error('Error getting all products:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get product by ID
router.post('/get_product_by_id', async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'product_id is required'
      });
    }

    const productsCollection = mongoose.connection.db.collection('products');

    const product = await productsCollection.findOne({
      _id: new mongoose.Types.ObjectId(product_id)
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product retrieved successfully',
      data: product
    });

  } catch (error) {
    console.error('Error getting product by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new product
router.post('/create_product', async (req, res) => {
  try {
    const {
      p_code,
      product_name,
      category_id,
      sub_category_id,
      dept_id,
      selling_price,
      mrp,
      description,
      image_url,
      stock_quantity,
      is_active = true,
      sequence_id,
      store_code
    } = req.body;

    // Validate required fields
    if (!p_code || !product_name || !category_id || !dept_id || !selling_price) {
      return res.status(400).json({
        success: false,
        message: 'p_code, product_name, category_id, dept_id, and selling_price are required'
      });
    }

    const productsCollection = mongoose.connection.db.collection('products');

    // Check if product code already exists
    const existingProduct = await productsCollection.findOne({ p_code: p_code.toString() });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this code already exists'
      });
    }

    // Create new product
    const newProduct = {
      p_code: p_code.toString(),
      product_name,
      category_id: category_id.toString(),
      sub_category_id: sub_category_id ? sub_category_id.toString() : null,
      dept_id: dept_id.toString(),
      selling_price: parseFloat(selling_price),
      mrp: mrp ? parseFloat(mrp) : parseFloat(selling_price),
      description: description || '',
      image_url: image_url || '',
      stock_quantity: stock_quantity ? parseInt(stock_quantity) : 0,
      is_active: Boolean(is_active),
      sequence_id: sequence_id ? parseInt(sequence_id) : 0,
      store_code: store_code || '',
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await productsCollection.insertOne(newProduct);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        _id: result.insertedId,
        ...newProduct
      }
    });

  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
});

// Update product
router.post('/update_product', async (req, res) => {
  try {
    const {
      product_id,
      p_code,
      product_name,
      category_id,
      sub_category_id,
      dept_id,
      selling_price,
      mrp,
      description,
      image_url,
      stock_quantity,
      is_active,
      sequence_id,
      store_code
    } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'product_id is required'
      });
    }

    const productsCollection = mongoose.connection.db.collection('products');

    // Check if product exists
    const existingProduct = await productsCollection.findOne({
      _id: new mongoose.Types.ObjectId(product_id)
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if p_code is being changed and if it's already taken
    if (p_code && p_code !== existingProduct.p_code) {
      const duplicateProduct = await productsCollection.findOne({
        p_code: p_code.toString(),
        _id: { $ne: new mongoose.Types.ObjectId(product_id) }
      });
      if (duplicateProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product code already exists'
        });
      }
    }

    // Build update object
    const updateData = {
      updated_at: new Date()
    };

    if (p_code !== undefined) updateData.p_code = p_code.toString();
    if (product_name !== undefined) updateData.product_name = product_name;
    if (category_id !== undefined) updateData.category_id = category_id.toString();
    if (sub_category_id !== undefined) updateData.sub_category_id = sub_category_id ? sub_category_id.toString() : null;
    if (dept_id !== undefined) updateData.dept_id = dept_id.toString();
    if (selling_price !== undefined) updateData.selling_price = parseFloat(selling_price);
    if (mrp !== undefined) updateData.mrp = parseFloat(mrp);
    if (description !== undefined) updateData.description = description;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (stock_quantity !== undefined) updateData.stock_quantity = parseInt(stock_quantity);
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);
    if (sequence_id !== undefined) updateData.sequence_id = parseInt(sequence_id);
    if (store_code !== undefined) updateData.store_code = store_code;

    const result = await productsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(product_id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes made to product'
      });
    }

    // Get updated product
    const updatedProduct = await productsCollection.findOne({
      _id: new mongoose.Types.ObjectId(product_id)
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
});

// Delete product
router.post('/delete_product', async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'product_id is required'
      });
    }

    const productsCollection = mongoose.connection.db.collection('products');

    // Check if product exists
    const existingProduct = await productsCollection.findOne({
      _id: new mongoose.Types.ObjectId(product_id)
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const result = await productsCollection.deleteOne({
      _id: new mongoose.Types.ObjectId(product_id)
    });

    if (result.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete product'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: {
        deleted_product_id: product_id,
        deleted_product: existingProduct
      }
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
});

// Bulk update products
router.post('/bulk_update_products', async (req, res) => {
  try {
    const { product_ids, update_data } = req.body;

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'product_ids array is required and cannot be empty'
      });
    }

    if (!update_data || Object.keys(update_data).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'update_data is required'
      });
    }

    const productsCollection = mongoose.connection.db.collection('products');

    // Convert string IDs to ObjectIds
    const objectIds = product_ids.map(id => new mongoose.Types.ObjectId(id));

    // Add updated_at timestamp
    const bulkUpdateData = {
      ...update_data,
      updated_at: new Date()
    };

    const result = await productsCollection.updateMany(
      { _id: { $in: objectIds } },
      { $set: bulkUpdateData }
    );

    res.json({
      success: true,
      message: `Bulk update completed. ${result.modifiedCount} products updated.`,
      data: {
        matched_count: result.matchedCount,
        modified_count: result.modifiedCount,
        product_ids: product_ids
      }
    });

  } catch (error) {
    console.error('Error bulk updating products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update products'
    });
  }
});

// Update product stock
router.post('/update_product_stock', async (req, res) => {
  try {
    const { product_id, stock_quantity, operation = 'set' } = req.body;

    if (!product_id || stock_quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'product_id and stock_quantity are required'
      });
    }

    const productsCollection = mongoose.connection.db.collection('products');

    let updateOperation;
    const quantity = parseInt(stock_quantity);

    switch (operation) {
      case 'add':
        updateOperation = { $inc: { stock_quantity: quantity } };
        break;
      case 'subtract':
        updateOperation = { $inc: { stock_quantity: -quantity } };
        break;
      case 'set':
      default:
        updateOperation = { $set: { stock_quantity: quantity } };
        break;
    }

    // Add updated_at
    updateOperation.$set = updateOperation.$set || {};
    updateOperation.$set.updated_at = new Date();

    const result = await productsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(product_id) },
      updateOperation
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get updated product
    const updatedProduct = await productsCollection.findOne({
      _id: new mongoose.Types.ObjectId(product_id)
    });

    res.json({
      success: true,
      message: 'Product stock updated successfully',
      data: {
        product_id: product_id,
        operation: operation,
        previous_stock: updatedProduct.stock_quantity - (operation === 'add' ? quantity : operation === 'subtract' ? -quantity : updatedProduct.stock_quantity - quantity),
        new_stock: updatedProduct.stock_quantity,
        updated_product: updatedProduct
      }
    });

  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product stock'
    });
  }
});

module.exports = router;
