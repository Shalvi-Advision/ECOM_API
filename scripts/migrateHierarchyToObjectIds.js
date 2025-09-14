const mongoose = require('mongoose');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Product = require('../models/Product');
const Department = require('../models/Department');
require('dotenv').config();

const migrateHierarchyToObjectIds = async () => {
  try {
    console.log('Starting hierarchy migration to ObjectIds...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shalvi_ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Step 1: Migrate Category dept_id strings to ObjectIds
    console.log('Step 1: Migrating Category dept_ids...');

    const categories = await Category.find({}).lean();
    let categoryUpdateCount = 0;

    for (const category of categories) {
      if (typeof category.dept_id === 'string' && category.dept_id) {
        // Find the department by department_id string
        const department = await Department.findOne({ department_id: category.dept_id });

        if (department) {
          await Category.findByIdAndUpdate(category._id, {
            dept_id: department._id
          });
          categoryUpdateCount++;
          console.log(`Updated category ${category.idcategory_master}: dept_id ${category.dept_id} -> ${department._id}`);
        } else {
          console.warn(`Department not found for category ${category.idcategory_master} with dept_id ${category.dept_id}`);
        }
      }
    }

    console.log(`Updated ${categoryUpdateCount} categories`);

    // Step 2: Verify all categories have valid ObjectId dept_id references
    console.log('Step 2: Verifying category dept_id references...');

    const invalidCategories = await Category.find({
      dept_id: { $type: 'string' }
    });

    if (invalidCategories.length > 0) {
      console.warn(`Found ${invalidCategories.length} categories with string dept_ids that couldn't be migrated:`);
      invalidCategories.forEach(cat => {
        console.warn(`- Category: ${cat.idcategory_master}, dept_id: ${cat.dept_id}`);
      });
    } else {
      console.log('All categories have valid ObjectId dept_id references ✓');
    }

    // Step 3: Check for any orphaned references
    console.log('Step 3: Checking for orphaned references...');

    const categoriesWithInvalidDeptRefs = await Category.find({
      dept_id: { $ne: null }
    }).populate('dept_id');

    let orphanedCount = 0;
    for (const category of categoriesWithInvalidDeptRefs) {
      if (!category.dept_id) {
        console.warn(`Orphaned category: ${category.idcategory_master} references non-existent department`);
        orphanedCount++;
      }
    }

    if (orphanedCount === 0) {
      console.log('No orphaned category references found ✓');
    }

    // Step 4: Verify SubCategory category_id references
    console.log('Step 4: Verifying SubCategory category_id references...');

    const subCategories = await SubCategory.find({}).populate('category_id');
    let subCategoryOrphanedCount = 0;

    for (const subCategory of subCategories) {
      if (!subCategory.category_id) {
        console.warn(`Orphaned subcategory: ${subCategory.idsub_category_master} references non-existent category`);
        subCategoryOrphanedCount++;
      }
    }

    if (subCategoryOrphanedCount === 0) {
      console.log('No orphaned subcategory references found ✓');
    }

    // Step 5: Verify Product references
    console.log('Step 5: Verifying Product references...');

    const products = await Product.find({}).populate(['dept_id', 'category_id', 'sub_category_id']);
    let productOrphanedCount = 0;

    for (const product of products) {
      if (!product.dept_id) {
        console.warn(`Product ${product.p_code} has invalid dept_id reference`);
        productOrphanedCount++;
      }
      if (!product.category_id) {
        console.warn(`Product ${product.p_code} has invalid category_id reference`);
        productOrphanedCount++;
      }
      if (!product.sub_category_id) {
        console.warn(`Product ${product.p_code} has invalid sub_category_id reference`);
        productOrphanedCount++;
      }
    }

    if (productOrphanedCount === 0) {
      console.log('No orphaned product references found ✓');
    }

    // Step 6: Summary
    console.log('\n=== Migration Summary ===');
    console.log(`Categories updated: ${categoryUpdateCount}`);
    console.log(`Invalid categories remaining: ${invalidCategories.length}`);
    console.log(`Orphaned category references: ${orphanedCount}`);
    console.log(`Orphaned subcategory references: ${subCategoryOrphanedCount}`);
    console.log(`Orphaned product references: ${productOrphanedCount}`);

    if (invalidCategories.length === 0 && orphanedCount === 0 && subCategoryOrphanedCount === 0 && productOrphanedCount === 0) {
      console.log('\n✅ Migration completed successfully! Hierarchy is now properly structured.');
    } else {
      console.log('\n⚠️  Migration completed with warnings. Some references may need manual review.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the migration
if (require.main === module) {
  migrateHierarchyToObjectIds();
}

module.exports = { migrateHierarchyToObjectIds };
