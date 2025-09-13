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

// Force fix category-department relationships
const forceFixCategoryDepartments = async () => {
  console.log('🔄 Force fixing category-department relationships...');

  try {
    // Get SEASONAL PICKS department (id: 11)
    const seasonalDept = await Department.findOne({ department_id: '11' });
    if (!seasonalDept) {
      console.error('❌ SEASONAL PICKS department not found');
      return;
    }

    console.log(`📍 Using SEASONAL PICKS department: ${seasonalDept._id}`);

    // Use native MongoDB collection to bypass Mongoose casting
    const db = mongoose.connection.db;
    const categoriesCollection = db.collection('categories');

    // Update all categories with dept_id "18" to use the SEASONAL PICKS ObjectId
    const result = await categoriesCollection.updateMany(
      { dept_id: "18" },
      { $set: { dept_id: seasonalDept._id } }
    );

    console.log(`✅ Updated ${result.modifiedCount} categories with dept_id "18"`);

    // Also fix any other invalid department references
    const allCategories = await categoriesCollection.find({}).toArray();
    let otherFixes = 0;

    for (const category of allCategories) {
      if (typeof category.dept_id === 'string' && category.dept_id !== "18") {
        // Check if it's a valid department_id
        const dept = await Department.findOne({ department_id: category.dept_id });
        if (dept) {
          await categoriesCollection.updateOne(
            { _id: category._id },
            { $set: { dept_id: dept._id } }
          );
          otherFixes++;
        }
      }
    }

    console.log(`✅ Updated ${otherFixes} other categories with invalid dept_id references`);

  } catch (error) {
    console.error('❌ Error force fixing category-department relationships:', error);
  }
};

// Force fix subcategory-category relationships
const forceFixSubCategoryCategories = async () => {
  console.log('🔄 Force fixing subcategory-category relationships...');

  try {
    // Use native MongoDB collection to bypass Mongoose casting
    const db = mongoose.connection.db;
    const subCategoriesCollection = db.collection('subcategories');

    const allSubCategories = await subCategoriesCollection.find({}).toArray();
    let fixedCount = 0;

    for (const subCategory of allSubCategories) {
      if (typeof subCategory.category_id === 'string' && mongoose.Types.ObjectId.isValid(subCategory.category_id)) {
        // Convert string ObjectId to actual ObjectId
        const objectId = new mongoose.Types.ObjectId(subCategory.category_id);
        await subCategoriesCollection.updateOne(
          { _id: subCategory._id },
          { $set: { category_id: objectId } }
        );
        fixedCount++;
      }
    }

    console.log(`✅ Updated ${fixedCount} subcategories with string ObjectId references`);

  } catch (error) {
    console.error('❌ Error force fixing subcategory-category relationships:', error);
  }
};

// Main function
const runForceFix = async () => {
  try {
    console.log('🚀 Starting Force Fix Process\n');
    console.log('==================================\n');

    await connectDB();

    await forceFixCategoryDepartments();
    console.log();
    await forceFixSubCategoryCategories();

    console.log('\n🎉 Force fix completed successfully!');
    console.log('\n📋 Summary:');
    console.log('1. ✅ Force fixed category-department relationships');
    console.log('2. ✅ Force fixed subcategory-category relationships');
    console.log('\n🔧 Next steps:');
    console.log('1. Restart your API server');
    console.log('2. Test categories and subcategories APIs');

  } catch (error) {
    console.error('❌ Force fix failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the force fix
runForceFix();
