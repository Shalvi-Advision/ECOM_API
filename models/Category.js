const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  idcategory_master: {
    type: String,
    required: true
  },
  category_name: {
    type: String,
    required: true
  },
  dept_id: {
    type: String,
    required: true,
    ref: 'Department'
  },
  sequence_id: {
    type: Number,
    required: true
  },
  store_code: {
    type: String,
    required: true
  },
  no_of_col: {
    type: String,
    default: "12"
  },
  image_link: {
    type: String,
    required: true
  },
  category_bg_color: {
    type: String,
    default: "#FFFFFF"
  }
}, {
  timestamps: true
});

// Index for better query performance
categorySchema.index({ dept_id: 1, store_code: 1 });
categorySchema.index({ category_name: 1 });

module.exports = mongoose.model('Category', categorySchema);
