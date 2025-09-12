const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');

// Import models
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');

// Migration endpoint to fix SubCategory ObjectId issues
router.post('/fix-subcategory-objectids', adminAuth, async (req, res) => {
  try {
    console.log('🔄 Starting SubCategory ObjectId migration...');
    
    // Get all categories to create mapping
    const categories = await Category.find({});
    const categoryMapping = {};
    
    categories.forEach(cat => {
      categoryMapping[cat.idcategory_master] = cat._id;
    });
    
    console.log(`📋 Created mapping for ${Object.keys(categoryMapping).length} categories`);
    
    // Get all subcategories
    const subCategories = await SubCategory.find({});
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const subCategory of subCategories) {
      try {
        // Check if category_id is already an ObjectId
        if (subCategory.category_id && typeof subCategory.category_id === 'string') {
          // Try to find the corresponding ObjectId
          const objectId = categoryMapping[subCategory.category_id];
          
          if (objectId) {
            await SubCategory.updateOne(
              { _id: subCategory._id },
              { 
                $set: { 
                  category_id: objectId 
                } 
              }
            );
            updatedCount++;
          } else {
            console.log(`⚠️  Warning: Category ID ${subCategory.category_id} not found for subcategory ${subCategory.sub_category_name}`);
            errors.push(`Category ID ${subCategory.category_id} not found for subcategory ${subCategory.sub_category_name}`);
          }
        }
      } catch (error) {
        errorCount++;
        errors.push(`Error updating subcategory ${subCategory.sub_category_name}: ${error.message}`);
      }
    }
    
    console.log(`✅ Migration completed: Updated ${updatedCount} subcategories`);
    
    res.json({
      success: true,
      message: 'SubCategory ObjectId migration completed',
      data: {
        totalSubcategories: subCategories.length,
        updatedCount,
        errorCount,
        errors: errors.slice(0, 10) // Only return first 10 errors
      }
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

// Test endpoint to check subcategories
router.get('/test-subcategories', adminAuth, async (req, res) => {
  try {
    const subCategories = await SubCategory.find({}).limit(5);
    const categoryIds = subCategories.map(sc => ({
      id: sc._id,
      name: sc.sub_category_name,
      category_id: sc.category_id,
      category_id_type: typeof sc.category_id
    }));
    
    res.json({
      success: true,
      data: categoryIds
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

module.exports = router;
