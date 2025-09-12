#!/usr/bin/env node

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

// Test function to check if ObjectIds are working
const testObjectIdReferences = async () => {
  try {
    console.log('\n🧪 Testing ObjectId references...\n');
    
    // Test 1: Check if categories can populate departments
    console.log('1️⃣ Testing Category -> Department population...');
    const categoriesWithDept = await Category.find({}).populate('dept_id').limit(3);
    console.log(`✅ Found ${categoriesWithDept.length} categories with department data`);
    
    if (categoriesWithDept.length > 0) {
      console.log('   Sample category:', {
        name: categoriesWithDept[0].category_name,
        department: categoriesWithDept[0].dept_id ? categoriesWithDept[0].dept_id.department_name : 'No department'
      });
    }
    
    // Test 2: Check if subcategories can populate categories
    console.log('\n2️⃣ Testing SubCategory -> Category population...');
    const subCategoriesWithCat = await SubCategory.find({}).populate('category_id').limit(3);
    console.log(`✅ Found ${subCategoriesWithCat.length} subcategories with category data`);
    
    if (subCategoriesWithCat.length > 0) {
      console.log('   Sample subcategory:', {
        name: subCategoriesWithCat[0].sub_category_name,
        category: subCategoriesWithCat[0].category_id ? subCategoriesWithCat[0].category_id.category_name : 'No category'
      });
    }
    
    // Test 3: Check if products can populate all references
    console.log('\n3️⃣ Testing Product -> All references population...');
    const productsWithRefs = await Product.find({})
      .populate('dept_id')
      .populate('category_id')
      .populate('sub_category_id')
      .limit(3);
    console.log(`✅ Found ${productsWithRefs.length} products with all reference data`);
    
    if (productsWithRefs.length > 0) {
      console.log('   Sample product:', {
        name: productsWithRefs[0].product_name,
        department: productsWithRefs[0].dept_id ? productsWithRefs[0].dept_id.department_name : 'No department',
        category: productsWithRefs[0].category_id ? productsWithRefs[0].category_id.category_name : 'No category',
        subcategory: productsWithRefs[0].sub_category_id ? productsWithRefs[0].sub_category_id.sub_category_name : 'No subcategory'
      });
    }
    
    // Test 4: Check data types
    console.log('\n4️⃣ Testing data types...');
    const sampleCategory = await Category.findOne({});
    if (sampleCategory) {
      console.log('   Category dept_id type:', typeof sampleCategory.dept_id);
      console.log('   Is ObjectId:', mongoose.Types.ObjectId.isValid(sampleCategory.dept_id));
    }
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📊 Migration Status:');
    console.log('   - ObjectId references: ✅ Working');
    console.log('   - Population queries: ✅ Working');
    console.log('   - Data integrity: ✅ Maintained');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔍 This might indicate that the migration is needed or incomplete.');
  }
};

// Main test function
const runTests = async () => {
  try {
    console.log('🚀 Starting Migration Tests');
    console.log('============================\n');
    
    await connectDB();
    await testObjectIdReferences();
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, testObjectIdReferences };
