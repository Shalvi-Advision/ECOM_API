const mongoose = require('mongoose');

const pincodeStoreSchema = new mongoose.Schema({
  pincode: {
    type: String,
    required: true,
    ref: 'Pincode'
  },
  store_code: {
    type: String,
    required: true
  },
  delivery_charge: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0
  },
  min_order_amount: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0
  },
  delivery_time: {
    type: String,
    default: 'Same Day'
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
pincodeStoreSchema.index({ pincode: 1, store_code: 1 });
pincodeStoreSchema.index({ store_code: 1 });

module.exports = mongoose.model('PincodeStore', pincodeStoreSchema);
