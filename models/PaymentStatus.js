const mongoose = require('mongoose');

const paymentStatusSchema = new mongoose.Schema({
  idpayment_status: {
    type: Number,
    required: true,
    unique: true
  },
  payment_status_name: {
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
paymentStatusSchema.index({ is_enabled: 1 });

module.exports = mongoose.model('PaymentStatus', paymentStatusSchema);
