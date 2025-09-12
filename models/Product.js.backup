const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  p_code: {
    type: String,
    required: true
  },
  barcode: {
    type: String,
    required: true
  },
  product_name: {
    type: String,
    required: true
  },
  product_description: {
    type: String,
    required: true
  },
  package_size: {
    type: Number,
    required: true
  },
  package_unit: {
    type: String,
    required: true
  },
  product_mrp: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  our_price: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  brand_name: {
    type: String,
    required: true
  },
  store_code: {
    type: String,
    required: true
  },
  pcode_status: {
    type: String,
    required: true,
    enum: ['Y', 'N'],
    default: 'Y'
  },
  dept_id: {
    type: String,
    required: true,
    ref: 'Department'
  },
  category_id: {
    type: String,
    required: true,
    ref: 'Category'
  },
  sub_category_id: {
    type: String,
    required: true,
    ref: 'SubCategory'
  },
  store_quantity: {
    type: Number,
    required: true,
    default: 0
  },
  max_quantity_allowed: {
    type: Number,
    required: true,
    default: 10
  },
  pcode_img: {
    type: String,
    required: true
  },
  is_featured: {
    type: Boolean,
    default: false
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
productSchema.index({ p_code: 1, store_code: 1 });
productSchema.index({ category_id: 1 });
productSchema.index({ sub_category_id: 1 });
productSchema.index({ dept_id: 1 });
productSchema.index({ product_name: 'text', product_description: 'text', brand_name: 'text' });
productSchema.index({ store_code: 1, pcode_status: 1 });
productSchema.index({ our_price: 1 });

// Virtual for discount percentage
productSchema.virtual('discount_percentage').get(function() {
  const mrp = parseFloat(this.product_mrp.toString());
  const price = parseFloat(this.our_price.toString());
  return Math.round(((mrp - price) / mrp) * 100);
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
