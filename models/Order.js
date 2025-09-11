const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  order_id: {
    type: String,
    required: true,
    unique: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  items: [{
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Product'
    },
    p_code: String,
    product_name: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unit_price: {
      type: mongoose.Schema.Types.Decimal128,
      required: true
    },
    total_price: {
      type: mongoose.Schema.Types.Decimal128,
      required: true
    }
  }],
  delivery_address: {
    name: String,
    phone: String,
    address_line_1: String,
    address_line_2: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },
  store_code: {
    type: String,
    required: true
  },
  order_status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  payment_mode: {
    type: String,
    required: true
  },
  payment_id: String,
  subtotal: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  delivery_charge: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0
  },
  total_amount: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  delivery_slot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliverySlot'
  },
  delivery_date: Date,
  notes: String,
  cancelled_reason: String
}, {
  timestamps: true
});

// Index for better query performance
orderSchema.index({ user_id: 1 });
orderSchema.index({ order_id: 1 });
orderSchema.index({ order_status: 1 });
orderSchema.index({ payment_status: 1 });
orderSchema.index({ store_code: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
