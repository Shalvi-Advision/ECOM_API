const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Collection mapping based on file names
const collectionMapping = {
  'PatelDB.addressbooks.json': 'addressbooks',
  'PatelDB.bannermasters.json': 'banners',
  'PatelDB.categorymasters.json': 'categories',
  'PatelDB.deliveryslots.json': 'deliveryslots',
  'PatelDB.departmentmasters.json': 'departments',
  'PatelDB.favoritemasters.json': 'favorites',
  'PatelDB.paymentmodes.json': 'paymentmodes',
  'PatelDB.paymentstatuses.json': 'paymentstatuses',
  'PatelDB.pincodemasters.json': 'pincodes',
  'PatelDB.pincodestoremasters.json': 'pincodestores',
  'PatelDB.productmasters.json': 'products',
  'PatelDB.subcategorymasters.json': 'subcategories'
};

// Function to convert $oid to ObjectId
function convertObjectIds(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertObjectIds);
  } else if (obj !== null && typeof obj === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === '_id' && value && value.$oid) {
        converted[key] = new mongoose.Types.ObjectId(value.$oid);
      } else if (key === '$oid') {
        return new mongoose.Types.ObjectId(value);
      } else {
        converted[key] = convertObjectIds(value);
      }
    }
    return converted;
  }
  return obj;
}

// Function to process a single file
async function processFile(filePath, collectionName) {
  try {
    console.log(`📂 Processing ${collectionName}...`);

    // Read the JSON file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    // Convert ObjectIds
    const convertedData = convertObjectIds(data);

    // Get the collection
    const collection = mongoose.connection.db.collection(collectionName);

    // Clear existing data
    await collection.deleteMany({});
    console.log(`🗑️  Cleared existing data from ${collectionName}`);

    // Insert new data in batches for large files
    const batchSize = 1000;
    if (convertedData.length > batchSize) {
      console.log(`📊 Large file detected. Processing in batches of ${batchSize}...`);
      for (let i = 0; i < convertedData.length; i += batchSize) {
        const batch = convertedData.slice(i, i + batchSize);
        await collection.insertMany(batch);
        console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(convertedData.length / batchSize)} (${batch.length} documents)`);
      }
    } else {
      await collection.insertMany(convertedData);
      console.log(`✅ Inserted ${convertedData.length} documents into ${collectionName}`);
    }

    return convertedData.length;
  } catch (error) {
    console.error(`❌ Error processing ${collectionName}:`, error.message);
    throw error;
  }
}

// Main upload function
async function uploadAllData() {
  try {
    console.log('🚀 Starting data upload to MongoDB Atlas...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB Atlas\n');

    // Path to the data folder
    const dataFolder = path.join(__dirname, '..', 'Patel Full Collection');

    // Check if folder exists
    if (!fs.existsSync(dataFolder)) {
      throw new Error(`Data folder not found: ${dataFolder}`);
    }

    // Get all JSON files
    const files = fs.readdirSync(dataFolder).filter(file => file.endsWith('.json'));
    console.log(`📁 Found ${files.length} JSON files to process:\n`);

    let totalDocuments = 0;
    const results = [];

    // Process each file
    for (const file of files) {
      const filePath = path.join(dataFolder, file);
      const collectionName = collectionMapping[file];

      if (!collectionName) {
        console.log(`⚠️  Skipping ${file} - no collection mapping found`);
        continue;
      }

      try {
        const documentCount = await processFile(filePath, collectionName);
        totalDocuments += documentCount;
        results.push({ file, collection: collectionName, documents: documentCount, status: 'success' });
        console.log(`\n`);
      } catch (error) {
        results.push({ file, collection: collectionName, error: error.message, status: 'failed' });
        console.log(`❌ Failed to process ${file}\n`);
      }
    }

    // Summary
    console.log('📊 UPLOAD SUMMARY:');
    console.log('==================');
    console.log(`Total files processed: ${results.length}`);
    console.log(`Total documents uploaded: ${totalDocuments}`);

    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'failed');

    console.log(`✅ Successful uploads: ${successful.length}`);
    console.log(`❌ Failed uploads: ${failed.length}`);

    if (failed.length > 0) {
      console.log('\n❌ FAILED FILES:');
      failed.forEach(f => console.log(`  - ${f.file}: ${f.error}`));
    }

    console.log('\n🎉 Data upload completed!');
    console.log(`📈 Total documents in database: ${totalDocuments}`);

  } catch (error) {
    console.error('💥 Upload failed:', error.message);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the upload if this script is executed directly
if (require.main === module) {
  uploadAllData();
}

module.exports = { uploadAllData };
