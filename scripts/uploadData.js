const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const Department = require('../models/Department');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Product = require('../models/Product');
const Banner = require('../models/Banner');
const Pincode = require('../models/Pincode');
const PincodeStore = require('../models/PincodeStore');
const PaymentMode = require('../models/PaymentMode');
const PaymentStatus = require('../models/PaymentStatus');
const DeliverySlot = require('../models/DeliverySlot');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Helper function to read JSON file
const readJsonFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Error reading file ${filePath}:`, error.message);
    return null;
  }
};

// Helper function to process data by removing _id field
const processData = (data) => {
  return data.map(item => {
    const { _id, __v, ...itemData } = item;
    return itemData;
  });
};

// Upload departments
const uploadDepartments = async () => {
  console.log('📁 Uploading departments...');
  const dataPath = path.join(__dirname, '../../Patel Full Collection/PatelDB.departmentmasters.json');
  const departments = readJsonFile(dataPath);
  
  if (!departments) return;
  
  try {
    await Department.deleteMany({});
    const processedDepartments = processData(departments);
    await Department.insertMany(processedDepartments);
    console.log(`✅ Uploaded ${departments.length} departments`);
  } catch (error) {
    console.error('❌ Error uploading departments:', error.message);
  }
};

// Upload categories
const uploadCategories = async () => {
  console.log('📁 Uploading categories...');
  const dataPath = path.join(__dirname, '../../Patel Full Collection/PatelDB.categorymasters.json');
  const categories = readJsonFile(dataPath);
  
  if (!categories) return;
  
  try {
    await Category.deleteMany({});
    const processedCategories = processData(categories);
    await Category.insertMany(processedCategories);
    console.log(`✅ Uploaded ${categories.length} categories`);
  } catch (error) {
    console.error('❌ Error uploading categories:', error.message);
  }
};

// Upload subcategories
const uploadSubCategories = async () => {
  console.log('📁 Uploading subcategories...');
  const dataPath = path.join(__dirname, '../../Patel Full Collection/PatelDB.subcategorymasters.json');
  const subCategories = readJsonFile(dataPath);
  
  if (!subCategories) return;
  
  try {
    await SubCategory.deleteMany({});
    const processedSubCategories = processData(subCategories);
    await SubCategory.insertMany(processedSubCategories);
    console.log(`✅ Uploaded ${subCategories.length} subcategories`);
  } catch (error) {
    console.error('❌ Error uploading subcategories:', error.message);
  }
};

// Upload products (in batches due to large size)
const uploadProducts = async () => {
  console.log('📁 Uploading products...');
  const dataPath = path.join(__dirname, '../../Patel Full Collection/PatelDB.productmasters.json');
  const products = readJsonFile(dataPath);
  
  if (!products) return;
  
  try {
    await Product.deleteMany({});
    
    const processedProducts = processData(products);
    const batchSize = 1000;
    const totalBatches = Math.ceil(processedProducts.length / batchSize);
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, processedProducts.length);
      const batch = processedProducts.slice(start, end);
      
      await Product.insertMany(batch);
      console.log(`📦 Uploaded batch ${i + 1}/${totalBatches} (${batch.length} products)`);
    }
    
    console.log(`✅ Uploaded ${products.length} products`);
  } catch (error) {
    console.error('❌ Error uploading products:', error.message);
  }
};

// Upload banners
const uploadBanners = async () => {
  console.log('📁 Uploading banners...');
  const dataPath = path.join(__dirname, '../../Patel Full Collection/PatelDB.bannermasters.json');
  const banners = readJsonFile(dataPath);
  
  if (!banners) return;
  
  try {
    await Banner.deleteMany({});
    const processedBanners = processData(banners);
    await Banner.insertMany(processedBanners);
    console.log(`✅ Uploaded ${banners.length} banners`);
  } catch (error) {
    console.error('❌ Error uploading banners:', error.message);
  }
};

// Upload pincodes
const uploadPincodes = async () => {
  console.log('📁 Uploading pincodes...');
  const dataPath = path.join(__dirname, '../../Patel Full Collection/PatelDB.pincodemasters.json');
  const pincodes = readJsonFile(dataPath);
  
  if (!pincodes) return;
  
  try {
    await Pincode.deleteMany({});
    const processedPincodes = processData(pincodes);
    await Pincode.insertMany(processedPincodes);
    console.log(`✅ Uploaded ${pincodes.length} pincodes`);
  } catch (error) {
    console.error('❌ Error uploading pincodes:', error.message);
  }
};

// Upload pincode stores
const uploadPincodeStores = async () => {
  console.log('📁 Uploading pincode stores...');
  const dataPath = path.join(__dirname, '../../Patel Full Collection/PatelDB.pincodestoremasters.json');
  const pincodeStores = readJsonFile(dataPath);
  
  if (!pincodeStores) return;
  
  try {
    await PincodeStore.deleteMany({});
    const processedPincodeStores = processData(pincodeStores);
    await PincodeStore.insertMany(processedPincodeStores);
    console.log(`✅ Uploaded ${pincodeStores.length} pincode stores`);
  } catch (error) {
    console.error('❌ Error uploading pincode stores:', error.message);
  }
};

// Upload payment modes
const uploadPaymentModes = async () => {
  console.log('📁 Uploading payment modes...');
  const dataPath = path.join(__dirname, '../../Patel Full Collection/PatelDB.paymentmodes.json');
  const paymentModes = readJsonFile(dataPath);
  
  if (!paymentModes) return;
  
  try {
    await PaymentMode.deleteMany({});
    const processedPaymentModes = processData(paymentModes);
    await PaymentMode.insertMany(processedPaymentModes);
    console.log(`✅ Uploaded ${paymentModes.length} payment modes`);
  } catch (error) {
    console.error('❌ Error uploading payment modes:', error.message);
  }
};

// Upload payment statuses
const uploadPaymentStatuses = async () => {
  console.log('📁 Uploading payment statuses...');
  const dataPath = path.join(__dirname, '../../Patel Full Collection/PatelDB.paymentstatuses.json');
  const paymentStatuses = readJsonFile(dataPath);
  
  if (!paymentStatuses) return;
  
  try {
    await PaymentStatus.deleteMany({});
    const processedPaymentStatuses = processData(paymentStatuses);
    await PaymentStatus.insertMany(processedPaymentStatuses);
    console.log(`✅ Uploaded ${paymentStatuses.length} payment statuses`);
  } catch (error) {
    console.error('❌ Error uploading payment statuses:', error.message);
  }
};

// Upload delivery slots
const uploadDeliverySlots = async () => {
  console.log('📁 Uploading delivery slots...');
  const dataPath = path.join(__dirname, '../../Patel Full Collection/PatelDB.deliveryslots.json');
  const deliverySlots = readJsonFile(dataPath);
  
  if (!deliverySlots) return;
  
  try {
    await DeliverySlot.deleteMany({});
    const processedDeliverySlots = processData(deliverySlots);
    await DeliverySlot.insertMany(processedDeliverySlots);
    console.log(`✅ Uploaded ${deliverySlots.length} delivery slots`);
  } catch (error) {
    console.error('❌ Error uploading delivery slots:', error.message);
  }
};

// Main upload function
const uploadAllData = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Starting data upload process...\n');
    
    // Upload in order to maintain referential integrity
    await uploadDepartments();
    await uploadCategories();
    await uploadSubCategories();
    await uploadBanners();
    await uploadPincodes();
    await uploadPincodeStores();
    await uploadPaymentModes();
    await uploadPaymentStatuses();
    await uploadDeliverySlots();
    await uploadProducts(); // Upload products last due to large size
    
    console.log('\n🎉 All data uploaded successfully!');
    
  } catch (error) {
    console.error('❌ Upload process failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
    process.exit(0);
  }
};

// Run the upload process
uploadAllData();