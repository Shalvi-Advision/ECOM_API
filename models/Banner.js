const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  redirect_link: {
    type: String,
    required: true,
    default: '/'
  },
  banner_img: {
    type: String,
    required: true
  },
  is_active: {
    type: String,
    required: true,
    enum: ['Enabled', 'Disabled'],
    default: 'Enabled'
  },
  banner_type_id: {
    type: Number,
    required: true
  },
  sequence_id: {
    type: Number,
    required: true
  },
  store_code: {
    type: String,
    required: true
  },
  banner_bg_color: {
    type: String,
    default: '#FFFFFF'
  }
}, {
  timestamps: true
});

// Index for better query performance
bannerSchema.index({ store_code: 1, is_active: 1, sequence_id: 1 });
bannerSchema.index({ banner_type_id: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
