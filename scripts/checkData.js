const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Department = require('../models/Department');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');

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

// Check category data
const checkCategories = async () => {
  console.log('🔍 Checking categories...');

  try {
    const categories = await Category.find({}).limit(5).lean();

    console.log(`📊 Found ${categories.length} categories`);
    console.log('📋 Sample categories:');

    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.category_name}`);
      console.log(`   ID: ${cat._id}`);
      console.log(`   dept_id: ${cat.dept_id} (type: ${typeof cat.dept_id})`);
      console.log(`   idcategory_master: ${cat.idcategory_master}`);
      console.log();
    });

  } catch (error) {
    console.error('❌ Error checking categories:', error);
  }
};

// Check subcategory data
const checkSubCategories = async () => {
  console.log('🔍 Checking subcategories...');

  try {
    const subCategories = await SubCategory.find({}).limit(5).lean();

    console.log(`📊 Found ${subCategories.length} subcategories`);
    console.log('📋 Sample subcategories:');

    subCategories.forEach((subCat, index) => {
      console.log(`${index + 1}. ${subCat.sub_category_name}`);
      console.log(`   ID: ${subCat._id}`);
      console.log(`   category_id: ${subCat.category_id} (type: ${typeof subCat.category_id})`);
      console.log(`   idsub_category_master: ${subCat.idsub_category_master}`);
      console.log();
    });

  } catch (error) {
    console.error('❌ Error checking subcategories:', error);
  }
};

// Main function
const runCheck = async () => {
  try {
    console.log('🚀 Starting Data Check Process\n');
    console.log('================================\n');

    await connectDB();

    await checkCategories();
    console.log();
    await checkSubCategories();

    console.log('✅ Data check completed!');

  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the check
runCheck();
