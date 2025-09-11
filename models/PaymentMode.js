const mongoose = require('mongoose');

const paymentModeSchema = new mongoose.Schema({
  idpayment_mode: {
    type: Number,
    required: true,
    unique: true
  },
  payment_mode_name: {
    type: String,
    required: true
  },
  is_enabled: {
    type: String,
    required: true,
    enum: ['Yes', 'No'],
    default: 'Yes'
  }
}, {
  timestamps: true
});

// Index for better query performance
paymentModeSchema.index({ is_enabled: 1 });

module.exports = mongoose.model('PaymentMode', paymentModeSchema);
