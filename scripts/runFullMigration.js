#!/usr/bin/env node

const { runMigration, connectDB } = require('./migrateStringIdsToObjectIds');
const { updateModelFiles } = require('./updateModelsToObjectIds');

const runFullMigration = async () => {
  console.log('🚀 Starting Full Migration Process');
  console.log('=====================================\n');
  
  try {
    // Step 1: Update model files
    console.log('📝 Step 1: Updating model schemas...');
    updateModelFiles();
    console.log('✅ Model schemas updated\n');
    
    // Step 2: Connect to database
    console.log('🔌 Step 2: Connecting to database...');
    await connectDB();
    console.log('✅ Database connected\n');
    
    // Step 3: Run data migration
    console.log('🔄 Step 3: Running data migration...');
    await runMigration();
    console.log('✅ Data migration completed\n');
    
    console.log('🎉 Full migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('1. ✅ Model schemas updated to use ObjectId foreign keys');
    console.log('2. ✅ Database data migrated from string IDs to ObjectIds');
    console.log('3. ✅ All foreign key relationships updated');
    
    console.log('\n🔧 Next steps:');
    console.log('1. Restart your API server');
    console.log('2. Test all API endpoints');
    console.log('3. Verify that categories, subcategories, and products APIs work');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
runFullMigration();
