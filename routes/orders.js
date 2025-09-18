const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Save/Update Cart
router.post('/save_cart', protect, async (req, res) => {
  try {
    const {
      store_code,
      temp_order_id,
      device_id,
      cart_items
    } = req.body;

    const project_code = req.user.project_code;

    if (!store_code || !cart_items || !Array.isArray(cart_items)) {
      return res.status(400).json({
        success: false,
        message: 'store_code and cart_items are required'
      });
    }

    // Generate temp order ID if not provided
    const orderId = temp_order_id || `AND${Date.now()}`;

    // Calculate totals
    let totalMrp = 0;
    let totalSellingPrice = 0;

    const processedCartItems = cart_items.map(item => {
      const mrp = parseFloat(item.product_mrp || 0);
      const sellingPrice = parseFloat(item.product_selling_price || item.selling_price || 0);
      const quantity = parseInt(item.quantity || 1);

      totalMrp += mrp * quantity;
      totalSellingPrice += sellingPrice * quantity;

      return {
        ...item,
        quantity,
        total_mrp: mrp * quantity,
        total_selling_price: sellingPrice * quantity
      };
    });

    const cartData = {
      temp_order_id: orderId,
      store_code,
      project_code,
      device_id,
      user_mobile: req.user.mobile_no,
      cart_items: processedCartItems,
      total_mrp: totalMrp,
      total_selling_price: totalSellingPrice,
      discount: 0,
      you_save: totalMrp - totalSellingPrice,
      created_at: new Date(),
      updated_at: new Date()
    };

    // In a real implementation, you would save this to a 'carts' collection
    // For now, we'll just return the processed data

    res.json({
      success: true,
      message: 'Cart saved successfully',
      data: cartData
    });

  } catch (error) {
    console.error('Error saving cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save cart'
    });
  }
});

// Get Orders History
router.post('/get_orders_history', protect, async (req, res) => {
  try {
    const { store_code } = req.body;
    const project_code = req.user.project_code;
    const user_mobile = req.user.mobile_no;

    if (!store_code) {
      return res.status(400).json({
        success: false,
        message: 'store_code is required'
      });
    }

    // In a real implementation, you would query the orders collection
    // For demo purposes, return sample order history
    const sampleOrders = [
      {
        order_id: 'ORD001',
        order_date: new Date(),
        status: 'Delivered',
        total_amount: 1500,
        items_count: 5
      },
      {
        order_id: 'ORD002',
        order_date: new Date(Date.now() - 86400000), // Yesterday
        status: 'Processing',
        total_amount: 800,
        items_count: 3
      }
    ];

    res.json({
      success: true,
      message: 'Orders history retrieved successfully',
      data: sampleOrders,
      total_orders: sampleOrders.length
    });

  } catch (error) {
    console.error('Error getting orders history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders history'
    });
  }
});

// Get Delivery Charges
router.post('/get_delivery_charges', async (req, res) => {
  try {
    const { distance, store_code, project_code, order_amount } = req.body;

    if (!store_code || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'store_code and project_code are required'
      });
    }

    // Calculate delivery charges based on distance and order amount
    const distanceKm = parseFloat(distance || 5);
    const orderAmt = parseFloat(order_amount || 0);

    let deliveryCharge = 0;

    // Free delivery for orders above certain amount
    if (orderAmt >= 500) {
      deliveryCharge = 0;
    } else if (distanceKm <= 5) {
      deliveryCharge = 30;
    } else if (distanceKm <= 10) {
      deliveryCharge = 50;
    } else {
      deliveryCharge = 80;
    }

    res.json({
      success: true,
      message: 'Delivery charges calculated successfully',
      data: {
        distance_km: distanceKm,
        order_amount: orderAmt,
        delivery_charges: deliveryCharge,
        free_delivery_threshold: 500,
        is_free_delivery: orderAmt >= 500
      }
    });

  } catch (error) {
    console.error('Error calculating delivery charges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate delivery charges'
    });
  }
});

// Get Discount Amount
router.post('/get_discount_amount', async (req, res) => {
  try {
    const { distance, store_code, project_code, order_amount } = req.body;

    if (!store_code || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'store_code and project_code are required'
      });
    }

    const orderAmt = parseFloat(order_amount || 0);
    let discount = 0;

    // Apply discounts based on order amount
    if (orderAmt >= 1000) {
      discount = orderAmt * 0.1; // 10% discount
    } else if (orderAmt >= 500) {
      discount = orderAmt * 0.05; // 5% discount
    }

    res.json({
      success: true,
      message: 'Discount calculated successfully',
      data: {
        order_amount: orderAmt,
        discount_amount: discount,
        discount_percentage: orderAmt >= 1000 ? 10 : orderAmt >= 500 ? 5 : 0,
        final_amount: orderAmt - discount
      }
    });

  } catch (error) {
    console.error('Error calculating discount:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate discount'
    });
  }
});

// Get Handling Charges
router.post('/get_handling_charges', async (req, res) => {
  try {
    const { store_code, project_code, order_amount } = req.body;

    if (!store_code || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'store_code and project_code are required'
      });
    }

    const orderAmt = parseFloat(order_amount || 0);
    let handlingCharge = 0;

    // Handling charges based on order amount
    if (orderAmt < 100) {
      handlingCharge = 10;
    } else if (orderAmt < 500) {
      handlingCharge = 20;
    } else {
      handlingCharge = 0; // Free handling for orders above 500
    }

    res.json({
      success: true,
      message: 'Handling charges calculated successfully',
      data: {
        order_amount: orderAmt,
        handling_charges: handlingCharge,
        free_handling_threshold: 500,
        is_free_handling: orderAmt >= 500
      }
    });

  } catch (error) {
    console.error('Error calculating handling charges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate handling charges'
    });
  }
});

// Get Delivery Slots
router.post('/get_delivery_slot', async (req, res) => {
  try {
    const { store_code, project_code } = req.body;

    if (!store_code || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'store_code and project_code are required'
      });
    }

    const deliverySlotsCollection = mongoose.connection.db.collection('deliveryslots');

    const slots = await deliverySlotsCollection.find({}).toArray();

    // If no slots in database, provide default slots
    const defaultSlots = slots.length > 0 ? slots : [
      {
        slot_id: 1,
        slot_name: '9:00 AM - 10:00 PM',
        display_order: 1
      },
      {
        slot_id: 2,
        slot_name: '10:00 AM - 11:00 PM',
        display_order: 2
      },
      {
        slot_id: 3,
        slot_name: '11:00 AM - 12:00 PM',
        display_order: 3
      }
    ];

    res.json({
      success: true,
      message: 'Delivery slots retrieved successfully',
      data: defaultSlots
    });

  } catch (error) {
    console.error('Error getting delivery slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get delivery slots'
    });
  }
});

// Confirm Order
router.post('/confirm_order', async (req, res) => {
  try {
    const orderData = req.body;

    if (!orderData.temp_order_id || !orderData.store_code || !orderData.project_code) {
      return res.status(400).json({
        success: false,
        message: 'temp_order_id, store_code, and project_code are required'
      });
    }

    // Generate actual order ID
    const actualOrderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const confirmedOrder = {
      ...orderData,
      actual_order_id: actualOrderId,
      order_status: 'Confirmed',
      confirmed_at: new Date(),
      created_at: new Date()
    };

    // In a real implementation, you would save this to the 'orders' collection

    res.json({
      success: true,
      message: 'Order confirmed successfully',
      data: {
        order_id: actualOrderId,
        temp_order_id: orderData.temp_order_id,
        status: 'Confirmed',
        order_details: confirmedOrder
      }
    });

  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm order'
    });
  }
});

// Order Payment Processing
router.post('/order_payment_processing', async (req, res) => {
  try {
    const orderData = req.body;

    if (!orderData.temp_order_id || !orderData.store_code || !orderData.project_code) {
      return res.status(400).json({
        success: false,
        message: 'temp_order_id, store_code, and project_code are required'
      });
    }

    // Update order status to payment processing
    const updatedOrder = {
      ...orderData,
      order_status: 'Payment Processing',
      payment_processing_at: new Date(),
      updated_at: new Date()
    };

    res.json({
      success: true,
      message: 'Order payment processing initiated',
      data: {
        temp_order_id: orderData.temp_order_id,
        status: 'Payment Processing',
        order_details: updatedOrder
      }
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment'
    });
  }
});

// Validate Cart
router.post('/validate_cart', protect, async (req, res) => {
  try {
    const {
      temp_order_id,
      store_code,
      device_id,
      cart_items
    } = req.body;

    const project_code = req.user.project_code;

    if (!temp_order_id || !store_code || !cart_items) {
      return res.status(400).json({
        success: false,
        message: 'temp_order_id, store_code, and cart_items are required'
      });
    }

    const productsCollection = mongoose.connection.db.collection('products');

    // Validate each cart item
    const validationResults = [];
    let isValid = true;

    for (const item of cart_items) {
      const product = await productsCollection.findOne({
        p_code: item.pcode || item.p_code
      });

      if (!product) {
        validationResults.push({
          pcode: item.pcode || item.p_code,
          valid: false,
          message: 'Product not found'
        });
        isValid = false;
      } else {
        validationResults.push({
          pcode: item.pcode || item.p_code,
          valid: true,
          product_name: product.product_name,
          available_quantity: product.quantity || 0,
          requested_quantity: item.quantity
        });
      }
    }

    res.json({
      success: true,
      message: isValid ? 'Cart validated successfully' : 'Some items in cart are invalid',
      data: {
        temp_order_id,
        is_valid: isValid,
        validation_results: validationResults,
        total_items: cart_items.length,
        valid_items: validationResults.filter(r => r.valid).length,
        invalid_items: validationResults.filter(r => !r.valid).length
      }
    });

  } catch (error) {
    console.error('Error validating cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate cart'
    });
  }
});

module.exports = router;
