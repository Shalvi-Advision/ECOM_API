const mongoose = require('mongoose');

const deliverySlotSchema = new mongoose.Schema({
  iddelivery_slot: {
    type: Number,
    required: true,
    unique: true
  },
  delivery_slot_from: {
    type: String,
    required: true
  },
  delivery_slot_to: {
    type: String,
    required: true
  },
  store_code: {
    type: String,
    required: true
  },
  is_active: {
    type: String,
    enum: ['yes', 'no'],
    default: 'yes'
  }
}, {
  timestamps: true
});

// Index for better query performance
deliverySlotSchema.index({ is_active: 1 });

module.exports = mongoose.model('DeliverySlot', deliverySlotSchema);
