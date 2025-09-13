const mongoose = require('mongoose');
const Category = require('../models/Category');
const Department = require('../models/Department');
require('dotenv').config();

async function migrateCategoryDeptIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all categories
    const categories = await Category.find({});
    console.log(`Found ${categories.length} categories to migrate`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const category of categories) {
      try {
        // Check if dept_id is an ObjectId
        if (category.dept_id && typeof category.dept_id === 'object' && category.dept_id.constructor.name === 'ObjectId') {
          // Find the department by ObjectId to get its department_id
          const department = await Department.findById(category.dept_id);

          if (department) {
            // Update the category's dept_id to be the string department_id
            await Category.findByIdAndUpdate(category._id, {
              dept_id: department.department_id
            });
            updatedCount++;
            console.log(`Updated category ${category.idcategory_master}: ${category.dept_id} -> ${department.department_id}`);
          } else {
            console.log(`Department not found for category ${category.idcategory_master} with dept_id ${category.dept_id}`);
            errorCount++;
          }
        } else if (typeof category.dept_id === 'string') {
          console.log(`Category ${category.idcategory_master} already has string dept_id: ${category.dept_id}`);
        } else {
          console.log(`Category ${category.idcategory_master} has unexpected dept_id type:`, typeof category.dept_id, category.dept_id);
          errorCount++;
        }
      } catch (error) {
        console.error(`Error updating category ${category.idcategory_master}:`, error);
        errorCount++;
      }
    }

    console.log(`\nMigration completed:`);
    console.log(`- Updated: ${updatedCount} categories`);
    console.log(`- Errors: ${errorCount} categories`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateCategoryDeptIds();
