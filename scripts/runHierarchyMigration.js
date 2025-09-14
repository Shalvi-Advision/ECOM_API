#!/usr/bin/env node

const { backupCollections } = require('./backupCollections');
const { migrateHierarchyToObjectIds } = require('./migrateHierarchyToObjectIds');

const runMigration = async () => {
  console.log('🚀 Starting Hierarchy Migration Process');
  console.log('=====================================');

  try {
    // Step 1: Create backup
    console.log('\n📦 Step 1: Creating backup...');
    await backupCollections();

    // Step 2: Run migration
    console.log('\n🔄 Step 2: Running migration...');
    await migrateHierarchyToObjectIds();

    console.log('\n✅ Migration process completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Backup created in scripts/../backups/');
    console.log('- Category dept_id fields converted from strings to ObjectId references');
    console.log('- All references validated');
    console.log('- Hierarchy now properly structured: Department -> Category -> SubCategory -> Product');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n🔄 You can restore from the backup if needed.');
    process.exit(1);
  }
};

// Run the migration
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
