const fs = require('fs');
const path = require('path');

// Updated model schemas with ObjectId foreign keys
const updatedModels = {
  'Category.js': `const mongoose = require('mongoose');

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
    type: mongoose.Schema.Types.ObjectId,
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

module.exports = mongoose.model('Category', categorySchema);`,

  'SubCategory.js': `const mongoose = require('mongoose');

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

module.exports = mongoose.model('SubCategory', subCategorySchema);`,

  'Product.js': `const mongoose = require('mongoose');

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
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Department'
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Category'
  },
  sub_category_id: {
    type: mongoose.Schema.Types.ObjectId,
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

module.exports = mongoose.model('Product', productSchema);`
};

// Function to update model files
const updateModelFiles = () => {
  const modelsDir = path.join(__dirname, '..', 'models');
  
  console.log('🔄 Updating model files with ObjectId foreign keys...\n');
  
  Object.entries(updatedModels).forEach(([filename, content]) => {
    const filePath = path.join(modelsDir, filename);
    
    // Backup original file
    const backupPath = filePath + '.backup';
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
      console.log(`📋 Backed up ${filename} to ${filename}.backup`);
    }
    
    // Write updated content
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${filename}`);
  });
  
  console.log('\n✅ All model files updated successfully!');
  console.log('\n📝 Note: Original files have been backed up with .backup extension');
};

// Run if this script is executed directly
if (require.main === module) {
  updateModelFiles();
}

module.exports = { updateModelFiles, updatedModels };
