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
    // Try to get MongoDB URI from environment or use a default
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecom_db';
    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 URI:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('\n💡 Make sure to set MONGODB_URI environment variable');
    console.log('   Example: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname');
    process.exit(1);
  }
};

// Create mapping functions
const createDepartmentMapping = async () => {
  console.log('📋 Creating department ID mapping...');
  const departments = await Department.find({});
  const mapping = {};
  
  departments.forEach(dept => {
    mapping[dept.department_id] = dept._id;
  });
  
  console.log(`✅ Created mapping for ${Object.keys(mapping).length} departments`);
  return mapping;
};

const createCategoryMapping = async () => {
  console.log('📋 Creating category ID mapping...');
  const categories = await Category.find({});
  const mapping = {};
  
  categories.forEach(cat => {
    mapping[cat.idcategory_master] = cat._id;
  });
  
  console.log(`✅ Created mapping for ${Object.keys(mapping).length} categories`);
  return mapping;
};

const createSubCategoryMapping = async () => {
  console.log('📋 Creating subcategory ID mapping...');
  const subCategories = await SubCategory.find({});
  const mapping = {};
  
  subCategories.forEach(subCat => {
    mapping[subCat.idsub_category_master] = subCat._id;
  });
  
  console.log(`✅ Created mapping for ${Object.keys(mapping).length} subcategories`);
  return mapping;
};

// Migration functions
const migrateCategories = async (deptMapping) => {
  console.log('🔄 Migrating categories...');
  const categories = await Category.find({});
  let updatedCount = 0;
  
  for (const category of categories) {
    if (deptMapping[category.dept_id]) {
      await Category.updateOne(
        { _id: category._id },
        { 
          $set: { 
            dept_id: deptMapping[category.dept_id] 
          } 
        }
      );
      updatedCount++;
    } else {
      console.log(`⚠️  Warning: Department ID ${category.dept_id} not found for category ${category.category_name}`);
    }
  }
  
  console.log(`✅ Updated ${updatedCount} categories`);
};

const migrateSubCategories = async (catMapping) => {
  console.log('🔄 Migrating subcategories...');
  const subCategories = await SubCategory.find({});
  let updatedCount = 0;
  
  for (const subCategory of subCategories) {
    if (catMapping[subCategory.category_id]) {
      await SubCategory.updateOne(
        { _id: subCategory._id },
        { 
          $set: { 
            category_id: catMapping[subCategory.category_id] 
          } 
        }
      );
      updatedCount++;
    } else {
      console.log(`⚠️  Warning: Category ID ${subCategory.category_id} not found for subcategory ${subCategory.sub_category_name}`);
    }
  }
  
  console.log(`✅ Updated ${updatedCount} subcategories`);
};

const migrateProducts = async (deptMapping, catMapping, subCatMapping) => {
  console.log('🔄 Migrating products...');
  const products = await Product.find({});
  let updatedCount = 0;
  
  for (const product of products) {
    const updates = {};
    
    if (deptMapping[product.dept_id]) {
      updates.dept_id = deptMapping[product.dept_id];
    } else {
      console.log(`⚠️  Warning: Department ID ${product.dept_id} not found for product ${product.product_name}`);
    }
    
    if (catMapping[product.category_id]) {
      updates.category_id = catMapping[product.category_id];
    } else {
      console.log(`⚠️  Warning: Category ID ${product.category_id} not found for product ${product.product_name}`);
    }
    
    if (subCatMapping[product.sub_category_id]) {
      updates.sub_category_id = subCatMapping[product.sub_category_id];
    } else {
      console.log(`⚠️  Warning: SubCategory ID ${product.sub_category_id} not found for product ${product.product_name}`);
    }
    
    if (Object.keys(updates).length > 0) {
      await Product.updateOne(
        { _id: product._id },
        { $set: updates }
      );
      updatedCount++;
    }
  }
  
  console.log(`✅ Updated ${updatedCount} products`);
};

// Main migration function
const runMigration = async () => {
  try {
    console.log('🚀 Starting String ID to ObjectId migration...\n');
    
    // Create mappings
    const deptMapping = await createDepartmentMapping();
    const catMapping = await createCategoryMapping();
    const subCatMapping = await createSubCategoryMapping();
    
    console.log('\n📊 Migration Statistics:');
    console.log(`- Departments: ${Object.keys(deptMapping).length}`);
    console.log(`- Categories: ${Object.keys(catMapping).length}`);
    console.log(`- SubCategories: ${Object.keys(subCatMapping).length}`);
    
    // Run migrations
    console.log('\n🔄 Starting data migration...\n');
    
    await migrateCategories(deptMapping);
    await migrateSubCategories(catMapping);
    await migrateProducts(deptMapping, catMapping, subCatMapping);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your model schemas to use ObjectId types for foreign keys');
    console.log('2. Test your API endpoints');
    console.log('3. Update your frontend code if needed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run migration if this script is executed directly
if (require.main === module) {
  connectDB().then(() => {
    runMigration();
  });
}

module.exports = { runMigration, connectDB };
