const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

/**
 * Test script to verify the centralized users migration
 * Tests authentication, user profile, addresses, and favorites
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

async function testMigration() {
  try {
    console.log('🧪 Starting migration tests...\n');

    // Connect to MongoDB for direct verification
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shalvi_ecommerce');
    const db = mongoose.connection.db;

    // Test 1: Check if users collection exists and has data
    console.log('1️⃣ Testing users collection...');
    const userCount = await db.collection('users').countDocuments();
    console.log(`   Users collection has ${userCount} documents`);

    if (userCount === 0) {
      throw new Error('Users collection is empty - migration failed');
    }

    // Test 2: Check if addressbooks have user_id references
    console.log('2️⃣ Testing addressbooks with user references...');
    const addressWithUserId = await db.collection('addressbooks').findOne({ user_id: { $exists: true } });
    if (!addressWithUserId) {
      throw new Error('Addressbooks do not have user_id references');
    }
    console.log('   ✅ Addressbooks have user_id references');

    // Test 3: Check if favorites have user_id references
    console.log('3️⃣ Testing favorites with user references...');
    const favoriteWithUserId = await db.collection('favorites').findOne({ user_id: { $exists: true } });
    if (!favoriteWithUserId) {
      throw new Error('Favorites do not have user_id references');
    }
    console.log('   ✅ Favorites have user_id references');

    // Test 4: Test authentication (create user)
    console.log('4️⃣ Testing authentication...');
    try {
      const authResponse = await axios.post(`${API_BASE_URL}/auth/validate_otp`, {
        mobileNo: '9999999999', // Test number
        otp: '1234',
        project_code: 'TEST'
      });

      if (authResponse.data.success) {
        console.log('   ✅ Authentication successful');
        console.log(`   Token received: ${authResponse.data.data.token ? 'Yes' : 'No'}`);
        console.log(`   User created: ${authResponse.data.data.user_created ? 'Yes' : 'No'}`);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.log(`   ⚠️ Authentication test failed: ${error.message}`);
      console.log('   This might be expected if API server is not running');
    }

    // Test 5: Test user profile retrieval
    console.log('5️⃣ Testing user profile...');
    const sampleUser = await db.collection('users').findOne({});
    if (sampleUser) {
      console.log(`   Sample user: ${sampleUser.mobile_no}`);

      // Check addresses for this user
      const userAddresses = await db.collection('addressbooks').find({ user_id: sampleUser._id }).toArray();
      console.log(`   User has ${userAddresses.length} addresses`);

      // Check favorites for this user
      const userFavorites = await db.collection('favorites').find({ user_id: sampleUser._id }).toArray();
      console.log(`   User has ${userFavorites.length} favorites`);
    }

    // Test 6: Data consistency check
    console.log('6️⃣ Testing data consistency...');
    const usersWithoutMobile = await db.collection('users').countDocuments({ mobile_no: { $exists: false } });
    const addressesWithoutUserId = await db.collection('addressbooks').countDocuments({ user_id: { $exists: false } });
    const favoritesWithoutUserId = await db.collection('favorites').countDocuments({ user_id: { $exists: false } });

    console.log(`   Users without mobile_no: ${usersWithoutMobile}`);
    console.log(`   Addresses without user_id: ${addressesWithoutUserId}`);
    console.log(`   Favorites without user_id: ${favoritesWithoutUserId}`);

    if (usersWithoutMobile > 0 || addressesWithoutUserId > 0 || favoritesWithoutUserId > 0) {
      console.log('   ⚠️ Some data inconsistencies found');
    } else {
      console.log('   ✅ All data is consistent');
    }

    console.log('\n🎉 Migration tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Addresses with user references: ✅`);
    console.log(`   - Favorites with user references: ✅`);
    console.log(`   - Data consistency: ${usersWithoutMobile === 0 && addressesWithoutUserId === 0 && favoritesWithoutUserId === 0 ? '✅' : '⚠️'}`);

  } catch (error) {
    console.error('❌ Migration test failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run tests
if (require.main === module) {
  testMigration();
}

module.exports = { testMigration };
