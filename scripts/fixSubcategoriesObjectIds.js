const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');

// MongoDB connection - try different possible URIs
const connectDB = async () => {
  try {
    // Try the hosted database URI that the API is using
    const possibleURIs = [
      process.env.MONGODB_URI,
      'mongodb+srv://gauravpawar2004:gauravpawar2004@cluster0.q6dqe.mongodb.net/patelmart',
      'mongodb+srv://username:password@cluster0.mongodb.net/patelmart',
      'mongodb://localhost:27017/patelmart'
    ];

    for (const uri of possibleURIs) {
      if (uri) {
        try {
          console.log('🔌 Trying to connect to MongoDB...');
          await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          });
          console.log('✅ MongoDB connected successfully');
          return true;
        } catch (error) {
          console.log(`❌ Failed to connect with URI: ${uri.replace(/\/\/.*@/, '//***:***@')}`);
          continue;
        }
      }
    }
    throw new Error('All connection attempts failed');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
};

// Fix subcategories ObjectId issues
const fixSubcategoriesObjectIds = async () => {
  try {
    console.log('🔄 Starting SubCategory ObjectId fix...');
    
    // First, let's see what we're dealing with
    console.log('📊 Analyzing current data...');
    
    // Get sample subcategories to understand the issue
    const sampleSubCategories = await SubCategory.find({}).limit(5).lean();
    console.log('Sample subcategories:', sampleSubCategories.map(sc => ({
      name: sc.sub_category_name,
      category_id: sc.category_id,
      category_id_type: typeof sc.category_id
    })));
    
    // Get all categories to create mapping from string ID to ObjectId
    const categories = await Category.find({}).lean();
    console.log(`📋 Found ${categories.length} categories`);
    
    // Create mapping from idcategory_master (string) to _id (ObjectId)
    const categoryMapping = {};
    categories.forEach(cat => {
      categoryMapping[cat.idcategory_master] = cat._id;
    });
    
    console.log(`📋 Created mapping for ${Object.keys(categoryMapping).length} categories`);
    
    // Get all subcategories that need fixing
    const subCategories = await SubCategory.find({}).lean();
    console.log(`📋 Found ${subCategories.length} subcategories`);
    
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const subCategory of subCategories) {
      try {
        // Check if category_id is a string that needs conversion
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
            if (updatedCount % 100 === 0) {
              console.log(`✅ Updated ${updatedCount} subcategories...`);
            }
          } else {
            console.log(`⚠️  Warning: Category ID '${subCategory.category_id}' not found for subcategory '${subCategory.sub_category_name}'`);
            errors.push(`Category ID '${subCategory.category_id}' not found for subcategory '${subCategory.sub_category_name}'`);
          }
        }
      } catch (error) {
        errorCount++;
        errors.push(`Error updating subcategory '${subCategory.sub_category_name}': ${error.message}`);
        console.error(`❌ Error updating subcategory '${subCategory.sub_category_name}':`, error.message);
      }
    }
    
    console.log('\n✅ Migration completed!');
    console.log(`📊 Results:`);
    console.log(`   - Total subcategories: ${subCategories.length}`);
    console.log(`   - Updated: ${updatedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errors.slice(0, 5).forEach(error => console.log(`   - ${error}`));
      if (errors.length > 5) {
        console.log(`   ... and ${errors.length - 5} more errors`);
      }
    }
    
    // Test the fix by trying to fetch subcategories with population
    console.log('\n🧪 Testing the fix...');
    try {
      const testSubCategories = await SubCategory.find({})
        .populate('category_id', 'category_name')
        .limit(3);
      
      console.log('✅ Test successful! Sample populated subcategories:');
      testSubCategories.forEach(sc => {
        console.log(`   - ${sc.sub_category_name} -> ${sc.category_id ? sc.category_id.category_name : 'NO CATEGORY'}`);
      });
    } catch (error) {
      console.log('❌ Test failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
};

// Main function
const runFix = async () => {
  const connected = await connectDB();
  if (!connected) {
    console.log('\n💡 Could not connect to database. Please check your connection settings.');
    process.exit(1);
  }
  
  try {
    await fixSubcategoriesObjectIds();
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the fix
runFix();
