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

// Simple migration that only updates valid references
const runSimpleMigration = async () => {
  try {
    console.log('🚀 Starting Simple Migration...\n');
    
    // Step 1: Get all departments and create mapping
    console.log('📋 Step 1: Creating department mapping...');
    const departments = await Department.find({});
    const deptMapping = {};
    departments.forEach(dept => {
      deptMapping[dept.department_id] = dept._id;
    });
    console.log(`✅ Found ${Object.keys(deptMapping).length} departments`);
    
    // Step 2: Update categories with valid department references
    console.log('\n📋 Step 2: Updating categories...');
    const categories = await Category.find({});
    let updatedCategories = 0;
    
    for (const category of categories) {
      if (deptMapping[category.dept_id]) {
        await Category.updateOne(
          { _id: category._id },
          { $set: { dept_id: deptMapping[category.dept_id] } }
        );
        updatedCategories++;
      }
    }
    console.log(`✅ Updated ${updatedCategories} categories`);
    
    // Step 3: Get all categories and create mapping
    console.log('\n📋 Step 3: Creating category mapping...');
    const updatedCategoriesList = await Category.find({});
    const catMapping = {};
    updatedCategoriesList.forEach(cat => {
      catMapping[cat.idcategory_master] = cat._id;
    });
    console.log(`✅ Found ${Object.keys(catMapping).length} categories`);
    
    // Step 4: Update subcategories with valid category references
    console.log('\n📋 Step 4: Updating subcategories...');
    const subCategories = await SubCategory.find({});
    let updatedSubCategories = 0;
    
    for (const subCategory of subCategories) {
      if (catMapping[subCategory.category_id]) {
        await SubCategory.updateOne(
          { _id: subCategory._id },
          { $set: { category_id: catMapping[subCategory.category_id] } }
        );
        updatedSubCategories++;
      }
    }
    console.log(`✅ Updated ${updatedSubCategories} subcategories`);
    
    // Step 5: Get all subcategories and create mapping
    console.log('\n📋 Step 5: Creating subcategory mapping...');
    const updatedSubCategoriesList = await SubCategory.find({});
    const subCatMapping = {};
    updatedSubCategoriesList.forEach(subCat => {
      subCatMapping[subCat.idsub_category_master] = subCat._id;
    });
    console.log(`✅ Found ${Object.keys(subCatMapping).length} subcategories`);
    
    // Step 6: Update products with valid references (in batches)
    console.log('\n📋 Step 6: Updating products in batches...');
    const batchSize = 100;
    let skip = 0;
    let totalUpdated = 0;
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
        
        if (deptMapping[product.dept_id]) {
          updates.dept_id = deptMapping[product.dept_id];
          hasUpdates = true;
        }
        
        if (catMapping[product.category_id]) {
          updates.category_id = catMapping[product.category_id];
          hasUpdates = true;
        }
        
        if (subCatMapping[product.sub_category_id]) {
          updates.sub_category_id = subCatMapping[product.sub_category_id];
          hasUpdates = true;
        }
        
        if (hasUpdates) {
          await Product.updateOne(
            { _id: product._id },
            { $set: updates }
          );
          totalUpdated++;
        }
      }
      
      skip += batchSize;
      console.log(`📊 Processed ${skip} products, updated ${totalUpdated} so far...`);
    }
    
    console.log(`✅ Updated ${totalUpdated} products`);
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Final Statistics:');
    console.log(`- Departments: ${Object.keys(deptMapping).length}`);
    console.log(`- Categories: ${Object.keys(catMapping).length}`);
    console.log(`- SubCategories: ${Object.keys(subCatMapping).length}`);
    console.log(`- Updated Products: ${totalUpdated}`);
    
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
    runSimpleMigration();
  });
}

module.exports = { runSimpleMigration, connectDB };
