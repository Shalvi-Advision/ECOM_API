const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  // Legacy fields for backward compatibility
  redirect_link: {
    type: String,
    default: '/'
  },
  banner_img: {
    type: String,
    required: function() {
      return !this.media_url; // Only required if media_url is not provided
    }
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
  },
  
  // New enhanced fields
  title: {
    type: String,
    required: true,
    default: 'Banner'
  },
  media_type: {
    type: String,
    enum: ['image', 'video', 'gif'],
    default: 'image'
  },
  media_url: {
    type: String,
    required: true
  },
  redirect: {
    type: {
      type: String,
      enum: ['product', 'category', 'external', 'internal'],
      default: 'internal'
    },
    id: String,
    url: String
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  validity: {
    start: {
      type: Date,
      default: Date.now
    },
    end: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
  },
  tracking: {
    impressions: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    }
  },
  placement: {
    page: {
      type: String,
      enum: ['homepage', 'category', 'product', 'cart', 'checkout'],
      default: 'homepage'
    },
    position: {
      type: String,
      enum: ['top', 'middle', 'bottom', 'sidebar', 'popup'],
      default: 'top'
    },
    platform: [{
      type: String,
      enum: ['web', 'android', 'ios', 'mobile'],
      default: ['web', 'android', 'ios']
    }]
  },
  rotation_type: {
    type: String,
    enum: ['carousel', 'static', 'random', 'priority'],
    default: 'carousel'
  }
}, {
  timestamps: true
});

// Index for better query performance
bannerSchema.index({ store_code: 1, is_active: 1, sequence_id: 1 });
bannerSchema.index({ banner_type_id: 1 });
bannerSchema.index({ 'placement.page': 1, 'placement.position': 1 });
bannerSchema.index({ 'validity.start': 1, 'validity.end': 1 });
bannerSchema.index({ priority: -1 });

// Virtual for backward compatibility
bannerSchema.virtual('id').get(function() {
  return this._id;
});

// Ensure virtual fields are serialized
bannerSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Banner', bannerSchema);
