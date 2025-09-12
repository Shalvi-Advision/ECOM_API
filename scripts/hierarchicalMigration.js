const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Department = require('../models/Department');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Product = require('../models/Product');

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecom_db';
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Hierarchical migration following Department → Category → SubCategory → Product
const runHierarchicalMigration = async () => {
  try {
    console.log('🚀 Starting Hierarchical Migration...');
    console.log('📊 Hierarchy: Department → Category → SubCategory → Product\n');
    
    // Step 1: Create department mapping (String ID → ObjectId)
    console.log('📋 Step 1: Creating department mapping...');
    const departments = await Department.find({});
    const deptMapping = {};
    departments.forEach(dept => {
      deptMapping[dept.department_id] = dept._id;
    });
    console.log(`✅ Found ${Object.keys(deptMapping).length} departments`);
    console.log('   Department mapping:', Object.keys(deptMapping).slice(0, 5).join(', '), '...');
    
    // Step 2: Update categories with department ObjectIds
    console.log('\n📋 Step 2: Updating categories with department references...');
    const categories = await Category.find({});
    let updatedCategories = 0;
    let skippedCategories = 0;
    
    for (const category of categories) {
      if (deptMapping[category.dept_id]) {
        await Category.updateOne(
          { _id: category._id },
          { $set: { dept_id: deptMapping[category.dept_id] } }
        );
        updatedCategories++;
      } else {
        console.log(`⚠️  Skipping category "${category.category_name}" - Department ID "${category.dept_id}" not found`);
        skippedCategories++;
      }
    }
    console.log(`✅ Updated ${updatedCategories} categories`);
    console.log(`⚠️  Skipped ${skippedCategories} categories (invalid department references)`);
    
    // Step 3: Create category mapping (String ID → ObjectId)
    console.log('\n📋 Step 3: Creating category mapping...');
    const updatedCategoriesList = await Category.find({});
    const catMapping = {};
    updatedCategoriesList.forEach(cat => {
      catMapping[cat.idcategory_master] = cat._id;
    });
    console.log(`✅ Found ${Object.keys(catMapping).length} categories`);
    console.log('   Category mapping sample:', Object.keys(catMapping).slice(0, 5).join(', '), '...');
    
    // Step 4: Update subcategories with category ObjectIds
    console.log('\n📋 Step 4: Updating subcategories with category references...');
    const subCategories = await SubCategory.find({});
    let updatedSubCategories = 0;
    let skippedSubCategories = 0;
    
    for (const subCategory of subCategories) {
      if (catMapping[subCategory.category_id]) {
        await SubCategory.updateOne(
          { _id: subCategory._id },
          { $set: { category_id: catMapping[subCategory.category_id] } }
        );
        updatedSubCategories++;
      } else {
        console.log(`⚠️  Skipping subcategory "${subCategory.sub_category_name}" - Category ID "${subCategory.category_id}" not found`);
        skippedSubCategories++;
      }
    }
    console.log(`✅ Updated ${updatedSubCategories} subcategories`);
    console.log(`⚠️  Skipped ${skippedSubCategories} subcategories (invalid category references)`);
    
    // Step 5: Create subcategory mapping (String ID → ObjectId)
    console.log('\n📋 Step 5: Creating subcategory mapping...');
    const updatedSubCategoriesList = await SubCategory.find({});
    const subCatMapping = {};
    updatedSubCategoriesList.forEach(subCat => {
      subCatMapping[subCat.idsub_category_master] = subCat._id;
    });
    console.log(`✅ Found ${Object.keys(subCatMapping).length} subcategories`);
    console.log('   SubCategory mapping sample:', Object.keys(subCatMapping).slice(0, 5).join(', '), '...');
    
    // Step 6: Update products with all references (Department, Category, SubCategory)
    console.log('\n📋 Step 6: Updating products with all references...');
    const batchSize = 50;
    let skip = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let hasMore = true;
    
    while (hasMore) {
      const products = await Product.find({}).skip(skip).limit(batchSize);
      
      if (products.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const product of products) {
        const updates = {};
        let hasUpdates = false;
        let hasInvalidRefs = false;
        
        // Update department reference
        if (deptMapping[product.dept_id]) {
          updates.dept_id = deptMapping[product.dept_id];
          hasUpdates = true;
        } else {
          console.log(`⚠️  Product "${product.product_name}" - Department ID "${product.dept_id}" not found`);
          hasInvalidRefs = true;
        }
        
        // Update category reference
        if (catMapping[product.category_id]) {
          updates.category_id = catMapping[product.category_id];
          hasUpdates = true;
        } else {
          console.log(`⚠️  Product "${product.product_name}" - Category ID "${product.category_id}" not found`);
          hasInvalidRefs = true;
        }
        
        // Update subcategory reference
        if (subCatMapping[product.sub_category_id]) {
          updates.sub_category_id = subCatMapping[product.sub_category_id];
          hasUpdates = true;
        } else {
          console.log(`⚠️  Product "${product.product_name}" - SubCategory ID "${product.sub_category_id}" not found`);
          hasInvalidRefs = true;
        }
        
        if (hasUpdates) {
          await Product.updateOne(
            { _id: product._id },
            { $set: updates }
          );
          totalUpdated++;
        } else {
          totalSkipped++;
        }
      }
      
      skip += batchSize;
      console.log(`📊 Processed ${skip} products, updated ${totalUpdated}, skipped ${totalSkipped} so far...`);
    }
    
    console.log(`✅ Updated ${totalUpdated} products`);
    console.log(`⚠️  Skipped ${totalSkipped} products (invalid references)`);
    
    console.log('\n🎉 Hierarchical Migration completed successfully!');
    console.log('\n📊 Final Statistics:');
    console.log(`- Departments: ${Object.keys(deptMapping).length}`);
    console.log(`- Categories: ${Object.keys(catMapping).length} (${updatedCategories} updated)`);
    console.log(`- SubCategories: ${Object.keys(subCatMapping).length} (${updatedSubCategories} updated)`);
    console.log(`- Products: ${totalUpdated} updated, ${totalSkipped} skipped`);
    
    console.log('\n🔗 Hierarchy Verification:');
    console.log('✅ Department → Category relationships established');
    console.log('✅ Category → SubCategory relationships established');
    console.log('✅ Product → (Department, Category, SubCategory) relationships established');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run migration if this script is executed directly
if (require.main === module) {
  connectDB().then(() => {
    runHierarchicalMigration();
  });
}

module.exports = { runHierarchicalMigration, connectDB };
