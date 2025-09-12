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
    const categoryIdMapping = {}; // Map _id to _id for direct ObjectId references
    
    categories.forEach(cat => {
      // Map idcategory_master (string) to _id (ObjectId)
      categoryMapping[cat.idcategory_master] = cat._id;
      // Map _id string to _id ObjectId for direct references
      categoryIdMapping[cat._id.toString()] = cat._id;
    });
    
    console.log(`📋 Created mapping for ${Object.keys(categoryMapping).length} categories`);
    
    // Get all subcategories
    const subCategories = await SubCategory.find({});
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    for (const subCategory of subCategories) {
      try {
        if (subCategory.category_id && typeof subCategory.category_id === 'string') {
          let targetObjectId = null;
          
          // First try direct ObjectId mapping (for valid ObjectId strings)
          if (subCategory.category_id.match(/^[0-9a-fA-F]{24}$/)) {
            targetObjectId = categoryIdMapping[subCategory.category_id];
          }
          
          // If not found, try idcategory_master mapping (for string IDs like "94")
          if (!targetObjectId) {
            targetObjectId = categoryMapping[subCategory.category_id];
          }
          
          if (targetObjectId) {
            await SubCategory.updateOne(
              { _id: subCategory._id },
              { 
                $set: { 
                  category_id: targetObjectId 
                } 
              }
            );
            updatedCount++;
          } else {
            console.log(`⚠️  Warning: Category ID ${subCategory.category_id} not found for subcategory ${subCategory.sub_category_name}`);
            errors.push(`Category ID ${subCategory.category_id} not found for subcategory ${subCategory.sub_category_name}`);
          }
        } else if (subCategory.category_id && typeof subCategory.category_id === 'object') {
          // Already an ObjectId, skip
          skippedCount++;
        }
      } catch (error) {
        errorCount++;
        errors.push(`Error updating subcategory ${subCategory.sub_category_name}: ${error.message}`);
      }
    }
    
    console.log(`✅ Migration completed: Updated ${updatedCount} subcategories, Skipped ${skippedCount}, Errors ${errorCount}`);
    
    res.json({
      success: true,
      message: 'SubCategory ObjectId migration completed',
      data: {
        totalSubcategories: subCategories.length,
        updatedCount,
        skippedCount,
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
