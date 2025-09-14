const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
  idsub_category_master: {
    type: String,
    required: true,
    unique: true
  },
  sub_category_name: {
    type: String,
    required: true
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Category'
  },
  main_category_name: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
subCategorySchema.index({ category_id: 1 });
subCategorySchema.index({ sub_category_name: 1 });

// Add compound index for hierarchical queries
subCategorySchema.index({ category_id: 1, sub_category_name: 1 });

module.exports = mongoose.model('SubCategory', subCategorySchema);