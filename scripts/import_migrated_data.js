const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Import migrated data into MongoDB collections
 * This script imports the centralized users collection and updates
 * addressbooks and favorites to reference user_id
 */

async function importMigratedData() {
  try {
    console.log('🔌 Connecting to MongoDB...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shalvi_ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Read migration files
    console.log('📖 Reading migration files...');
    const migrationDir = path.join(__dirname, '../migration_output');

    const usersData = JSON.parse(fs.readFileSync(path.join(migrationDir, 'users_collection.json'), 'utf8'));
    const addressbooksData = JSON.parse(fs.readFileSync(path.join(migrationDir, 'addressbooks_migrated.json'), 'utf8'));
    const favoritesData = JSON.parse(fs.readFileSync(path.join(migrationDir, 'favorites_migrated.json'), 'utf8'));

    console.log(`✅ Loaded ${usersData.length} users, ${addressbooksData.length} addresses, ${favoritesData.length} favorites`);

    // Clear existing collections (optional - remove in production)
    console.log('🧹 Clearing existing collections...');
    await db.collection('users').deleteMany({});
    await db.collection('addressbooks').deleteMany({});
    await db.collection('favorites').deleteMany({});

    // Import users collection
    console.log('👥 Importing users collection...');
    const usersResult = await db.collection('users').insertMany(usersData);
    console.log(`✅ Imported ${usersResult.insertedCount} users`);

    // Create a map of mobile_no to user _id for reference updates
    console.log('🗺️ Creating user reference map...');
    const users = await db.collection('users').find({}).toArray();
    const userMap = new Map();

    users.forEach(user => {
      userMap.set(user.mobile_no, user._id);
    });

    // Update addressbooks with actual ObjectId references
    console.log('🏠 Updating addressbooks with user references...');
    const updatedAddressbooks = addressbooksData.map(addr => {
      const mobile = addr.mobile_number?.toString().trim();
      const userId = userMap.get(mobile);

      if (!userId) {
        console.warn(`⚠️ No user found for mobile ${mobile} in addressbooks`);
        return null;
      }

      return {
        ...addr,
        user_id: userId, // Replace string index with actual ObjectId
        _id: addr._id?.$oid ? new mongoose.Types.ObjectId(addr._id.$oid) : undefined
      };
    }).filter(Boolean);

    if (updatedAddressbooks.length > 0) {
      const addressResult = await db.collection('addressbooks').insertMany(updatedAddressbooks);
      console.log(`✅ Imported ${addressResult.insertedCount} addressbook records`);
    }

    // Update favorites with actual ObjectId references
    console.log('❤️ Updating favorites with user references...');
    const updatedFavorites = favoritesData.map(fav => {
      const mobile = fav.mobile_no?.toString().trim();
      const userId = userMap.get(mobile);

      if (!userId) {
        console.warn(`⚠️ No user found for mobile ${mobile} in favorites`);
        return null;
      }

      return {
        ...fav,
        user_id: userId, // Replace string index with actual ObjectId
        _id: fav._id?.$oid ? new mongoose.Types.ObjectId(fav._id.$oid) : undefined
      };
    }).filter(Boolean);

    if (updatedFavorites.length > 0) {
      const favoritesResult = await db.collection('favorites').insertMany(updatedFavorites);
      console.log(`✅ Imported ${favoritesResult.insertedCount} favorite records`);
    }

    // Verify data integrity
    console.log('🔍 Verifying data integrity...');
    const userCount = await db.collection('users').countDocuments();
    const addressCount = await db.collection('addressbooks').countDocuments();
    const favoriteCount = await db.collection('favorites').countDocuments();

    console.log(`\n📊 FINAL COUNTS:`);
    console.log(`Users: ${userCount}`);
    console.log(`Addresses: ${addressCount}`);
    console.log(`Favorites: ${favoriteCount}`);

    // Sample verification
    console.log('\n🔍 Sample verification:');
    const sampleUser = await db.collection('users').findOne({});
    if (sampleUser) {
      console.log(`Sample user: ${sampleUser.mobile_no} (${sampleUser.name || 'No name'})`);

      const userAddresses = await db.collection('addressbooks').find({ user_id: sampleUser._id }).limit(2).toArray();
      console.log(`User addresses: ${userAddresses.length}`);

      const userFavorites = await db.collection('favorites').find({ user_id: sampleUser._id }).limit(2).toArray();
      console.log(`User favorites: ${userFavorites.length}`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n🚀 Your centralized users system is now ready!');
    console.log('\n📋 Next steps:');
    console.log('1. Test authentication with /auth/validate_otp');
    console.log('2. Test user profile endpoints');
    console.log('3. Test address management');
    console.log('4. Test favorites functionality');
    console.log('5. Update any remaining API routes that reference the old structure');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  importMigratedData();
}

module.exports = { importMigratedData };
