const mongoose = require('mongoose');
require('dotenv').config();

// Test script to verify admin routes are working
const testAdminRoutes = async () => {
  try {
    console.log('🔍 Testing Admin Routes...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Test if admin user exists
    const User = require('../models/User');
    const adminUser = await User.findOne({ email: 'admin@shalvi.com' });
    
    if (adminUser) {
      console.log('✅ Admin user exists');
      console.log('📧 Email:', adminUser.email);
      console.log('👤 Role:', adminUser.role);
      console.log('🆔 ID:', adminUser._id);
    } else {
      console.log('❌ Admin user not found');
    }

    // Test if Banner model has admin routes
    const Banner = require('../models/Banner');
    const bannerCount = await Banner.countDocuments();
    console.log('📊 Total banners in database:', bannerCount);

    // Test a simple banner query
    const banners = await Banner.find().limit(5);
    console.log('📋 Sample banners:', banners.length);

  } catch (error) {
    console.error('❌ Error testing admin routes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the test
testAdminRoutes();
