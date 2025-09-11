const mongoose = require('mongoose');

const pincodeSchema = new mongoose.Schema({
  idpincode_master: {
    type: Number,
    required: true,
    unique: true
  },
  pincode: {
    type: String,
    required: true,
    unique: true,
    match: /^[1-9][0-9]{5}$/
  },
  is_enabled: {
    type: String,
    required: true,
    enum: ['Enabled', 'Disabled'],
    default: 'Enabled'
  }
}, {
  timestamps: true
});

// Index for better query performance
pincodeSchema.index({ pincode: 1 });
pincodeSchema.index({ is_enabled: 1 });

module.exports = mongoose.model('Pincode', pincodeSchema);
