const mongoose = require('mongoose');
require('dotenv').config();

const collections = [
  'addressbooks',
  'banners',
  'categories',
  'deliveryslots',
  'departments',
  'favorites',
  'paymentmodes',
  'paymentstatuses',
  'pincodes',
  'pincodestores',
  'products',
  'subcategories'
];

async function verifyData() {
  try {
    console.log('🔍 Verifying data import to MongoDB Atlas...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB Atlas\n');

    const db = mongoose.connection.db;
    let totalDocuments = 0;

    console.log('📊 COLLECTION STATISTICS:');
    console.log('========================\n');

    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();

        // Get a sample document to verify structure
        const sampleDoc = await collection.findOne({}, { projection: { _id: 1 } });

        console.log(`📁 ${collectionName}:`);
        console.log(`   Documents: ${count}`);
        console.log(`   Sample ID: ${sampleDoc ? sampleDoc._id : 'No documents'}`);
        console.log('');

        totalDocuments += count;
      } catch (error) {
        console.log(`❌ ${collectionName}: Error - ${error.message}\n`);
      }
    }

    console.log('🎯 VERIFICATION SUMMARY:');
    console.log('=======================');
    console.log(`Total collections: ${collections.length}`);
    console.log(`Total documents: ${totalDocuments}`);

    // Check if database is properly populated
    if (totalDocuments > 250000) {
      console.log('✅ Database is fully populated with all expected data!');
    } else if (totalDocuments > 0) {
      console.log('⚠️  Database has some data but may be incomplete');
    } else {
      console.log('❌ Database appears to be empty');
    }

    console.log('\n🎉 Verification completed!');

  } catch (error) {
    console.error('💥 Verification failed:', error.message);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the verification if this script is executed directly
if (require.main === module) {
  verifyData();
}

module.exports = { verifyData };
