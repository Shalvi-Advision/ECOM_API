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
    console.log('📍 URI:', mongoUri.replace(/\/\/.*@/, '//***:***@'));

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

// Fix category-department relationships
const fixCategoryDepartmentRelationships = async () => {
  console.log('🔄 Fixing category-department relationships...');

  try {
    // Get all categories
    const allCategories = await Category.find({});

    console.log(`📊 Found ${allCategories.length} total categories`);

    // Get all departments for mapping
    const departments = await Department.find({});
    const deptMap = {};
    departments.forEach(dept => {
      deptMap[dept.department_id] = dept._id;
    });

    console.log(`📋 Department mapping:`, deptMap);

    let fixedCount = 0;

    for (const category of allCategories) {
      let newDeptId = null;

      // Check if dept_id is already a valid ObjectId
      if (category.dept_id && mongoose.Types.ObjectId.isValid(category.dept_id)) {
        // Already an ObjectId, skip
        continue;
      }

      // If it's a string, try to map it to the correct department ObjectId
      if (typeof category.dept_id === 'string') {
        // Check if it's a valid department_id
        if (deptMap[category.dept_id]) {
          newDeptId = deptMap[category.dept_id];
        } else {
          // Invalid department_id, try to match by category name
          const categoryName = category.category_name.toLowerCase();

          if (categoryName.includes('atta') || categoryName.includes('flour') ||
              categoryName.includes('rice') || categoryName.includes('pulses') ||
              categoryName.includes('salt') || categoryName.includes('sugar') ||
              categoryName.includes('oil') || categoryName.includes('ghee') ||
              categoryName.includes('spices') || categoryName.includes('masala') ||
              categoryName.includes('wheat') || categoryName.includes('cereals')) {
            newDeptId = deptMap['2']; // GROCERY & STAPLES
          } else if (categoryName.includes('soap') || categoryName.includes('shampoo') ||
                     categoryName.includes('toothpaste') || categoryName.includes('cosmetic') ||
                     categoryName.includes('cream') || categoryName.includes('lotion') ||
                     categoryName.includes('face') || categoryName.includes('hair') ||
                     categoryName.includes('bath') || categoryName.includes('body')) {
            newDeptId = deptMap['3']; // PERSONAL CARE
          } else if (categoryName.includes('milk') || categoryName.includes('dairy') ||
                     categoryName.includes('bread') || categoryName.includes('cake') ||
                     categoryName.includes('bakery') || categoryName.includes('frozen')) {
            newDeptId = deptMap['7']; // BAKERY, DAIRY & FROZEN
          } else if (categoryName.includes('chips') || categoryName.includes('snacks') ||
                     categoryName.includes('biscuits') || categoryName.includes('chocolate') ||
                     categoryName.includes('sweets')) {
            newDeptId = deptMap['8']; // BISCUITS, SNACKS & CHOCOLATES
          } else if (categoryName.includes('juice') || categoryName.includes('drink') ||
                     categoryName.includes('beverage') || categoryName.includes('tea') ||
                     categoryName.includes('coffee') || categoryName.includes('water')) {
            newDeptId = deptMap['5']; // BEVERAGES
          } else if (categoryName.includes('cleaner') || categoryName.includes('detergent') ||
                     categoryName.includes('dishwash') || categoryName.includes('wiper') ||
                     categoryName.includes('brush') || categoryName.includes('mop')) {
            newDeptId = deptMap['1']; // HOUSEHOLD ITEMS
          } else if (categoryName.includes('maha') || categoryName.includes('bachat') ||
                     categoryName.includes('special') || categoryName.includes('seasonal')) {
            newDeptId = deptMap['11']; // SEASONAL PICKS
          } else {
            // Default to GROCERY & STAPLES for unknown categories
            newDeptId = deptMap['2'];
          }
        }
      }

      if (newDeptId && newDeptId !== category.dept_id) {
        await Category.updateOne(
          { _id: category._id },
          { $set: { dept_id: newDeptId } }
        );
        fixedCount++;
        console.log(`✅ Fixed category "${category.category_name}" dept_id: ${category.dept_id} -> ${newDeptId}`);
      }
    }

    console.log(`✅ Fixed ${fixedCount} category-department relationships`);

  } catch (error) {
    console.error('❌ Error fixing category-department relationships:', error);
  }
};

// Fix subcategory-category relationships
const fixSubCategoryCategoryRelationships = async () => {
  console.log('🔄 Fixing subcategory-category relationships...');

  try {
    // Get all subcategories
    const allSubCategories = await SubCategory.find({});

    console.log(`📊 Found ${allSubCategories.length} total subcategories`);

    // Get all categories for mapping
    const categories = await Category.find({});
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.idcategory_master] = cat._id;
    });

    console.log(`📋 Category mapping created for ${Object.keys(categoryMap).length} categories`);

    let fixedCount = 0;

    for (const subCategory of allSubCategories) {
      let newCategoryId = null;

      // Check if category_id is already a valid ObjectId
      if (subCategory.category_id && mongoose.Types.ObjectId.isValid(subCategory.category_id)) {
        // Already an ObjectId, skip
        continue;
      }

      // If it's a string, try to convert it to ObjectId or find by idcategory_master
      if (typeof subCategory.category_id === 'string') {
        // Check if it's a valid ObjectId string
        if (mongoose.Types.ObjectId.isValid(subCategory.category_id)) {
          newCategoryId = mongoose.Types.ObjectId(subCategory.category_id);
        } else if (categoryMap[subCategory.category_id]) {
          // It's an idcategory_master string, map to ObjectId
          newCategoryId = categoryMap[subCategory.category_id];
        } else {
          // Try to find matching category by name similarity
          const subCategoryName = subCategory.sub_category_name.toLowerCase();

          for (const category of categories) {
            const categoryName = category.category_name.toLowerCase();
            if (subCategoryName.includes(categoryName) ||
                categoryName.includes(subCategoryName) ||
                subCategory.main_category_name.toLowerCase().includes(categoryName)) {
              newCategoryId = category._id;
              break;
            }
          }
        }
      }

      if (newCategoryId && newCategoryId.toString() !== (subCategory.category_id || '').toString()) {
        await SubCategory.updateOne(
          { _id: subCategory._id },
          { $set: { category_id: newCategoryId } }
        );
        fixedCount++;
        console.log(`✅ Fixed subcategory "${subCategory.sub_category_name}" category_id: ${subCategory.category_id} -> ${newCategoryId}`);
      }
    }

    console.log(`✅ Fixed ${fixedCount} subcategory-category relationships`);

  } catch (error) {
    console.error('❌ Error fixing subcategory-category relationships:', error);
  }
};

// Main function
const runFix = async () => {
  try {
    console.log('🚀 Starting Relationship Fix Process\n');
    console.log('=====================================\n');

    await connectDB();

    await fixCategoryDepartmentRelationships();
    console.log();
    await fixSubCategoryCategoryRelationships();

    console.log('\n🎉 Relationship fix completed successfully!');
    console.log('\n📋 Summary:');
    console.log('1. ✅ Fixed category-department relationships');
    console.log('2. ✅ Fixed subcategory-category relationships');
    console.log('\n🔧 Next steps:');
    console.log('1. Restart your API server');
    console.log('2. Test categories and subcategories APIs');

  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the fix
runFix();
