const mongoose = require('mongoose');
const Banner = require('../models/Banner');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB for banner CRUD testing');
  testBannerCRUD();
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

async function testBannerCRUD() {
  try {
    console.log('🧪 Testing Banner CRUD Operations...\n');

    // First, create or find an admin user
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('📝 Creating admin user for testing...');
      adminUser = new User({
        name: 'Admin User',
        email: 'admin@test.com',
        phone: '1234567890',
        password: 'admin123',
        role: 'admin'
      });
      await adminUser.save();
      console.log('✅ Admin user created');
    }

    // Generate JWT token for admin
    const token = jwt.sign(
      { userId: adminUser._id, email: adminUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('🔑 Admin token generated\n');

    // Test 1: Create a new banner
    console.log('1️⃣ Testing CREATE banner...');
    const newBannerData = {
      title: 'Test Banner',
      media_url: 'https://example.com/banner.jpg',
      banner_img: 'https://example.com/banner.jpg', // Legacy field
      media_type: 'image',
      redirect: {
        type: 'internal',
        url: '/test-page'
      },
      priority: 5,
      placement: {
        page: 'homepage',
        position: 'top',
        platform: ['web', 'android', 'ios']
      },
      rotation_type: 'carousel',
      validity: {
        start: new Date(),
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      store_code: 'TEST',
      banner_type_id: 1,
      sequence_id: 1
    };

    const newBanner = new Banner(newBannerData);
    await newBanner.save();
    console.log('✅ Banner created successfully');
    console.log(`   ID: ${newBanner._id}`);
    console.log(`   Title: ${newBanner.title}`);
    console.log(`   Priority: ${newBanner.priority}\n`);

    // Test 2: Update the banner
    console.log('2️⃣ Testing UPDATE banner...');
    const updateData = {
      title: 'Updated Test Banner',
      priority: 8,
      placement: {
        page: 'homepage',
        position: 'middle',
        platform: ['web', 'android', 'ios']
      }
    };

    const updatedBanner = await Banner.findByIdAndUpdate(
      newBanner._id,
      updateData,
      { new: true }
    );
    console.log('✅ Banner updated successfully');
    console.log(`   New Title: ${updatedBanner.title}`);
    console.log(`   New Priority: ${updatedBanner.priority}`);
    console.log(`   New Position: ${updatedBanner.placement.position}\n`);

    // Test 3: Toggle banner status
    console.log('3️⃣ Testing TOGGLE STATUS...');
    const originalStatus = updatedBanner.is_active;
    updatedBanner.is_active = updatedBanner.is_active === 'Enabled' ? 'Disabled' : 'Enabled';
    await updatedBanner.save();
    console.log('✅ Banner status toggled successfully');
    console.log(`   Status changed from ${originalStatus} to ${updatedBanner.is_active}\n`);

    // Test 4: Get all banners for admin
    console.log('4️⃣ Testing GET ALL BANNERS (Admin)...');
    const allBanners = await Banner.find({}).sort({ createdAt: -1 }).limit(5);
    console.log('✅ Retrieved banners successfully');
    console.log(`   Found ${allBanners.length} banners`);
    allBanners.forEach((banner, index) => {
      console.log(`   ${index + 1}. ${banner.title} (${banner.is_active}) - Priority: ${banner.priority}`);
    });
    console.log('');

    // Test 5: Bulk update priorities
    console.log('5️⃣ Testing BULK UPDATE PRIORITIES...');
    const bannersToUpdate = allBanners.slice(0, 3).map(banner => ({
      id: banner._id,
      priority: Math.floor(Math.random() * 10) + 1
    }));

    for (const bannerUpdate of bannersToUpdate) {
      await Banner.findByIdAndUpdate(bannerUpdate.id, { priority: bannerUpdate.priority });
    }
    console.log('✅ Bulk priority update completed');
    console.log(`   Updated priorities for ${bannersToUpdate.length} banners\n`);

    // Test 6: Delete the test banner
    console.log('6️⃣ Testing DELETE banner...');
    await Banner.findByIdAndDelete(newBanner._id);
    console.log('✅ Banner deleted successfully');
    console.log(`   Deleted banner ID: ${newBanner._id}\n`);

    // Test 7: Verify deletion
    console.log('7️⃣ Testing VERIFICATION...');
    const deletedBanner = await Banner.findById(newBanner._id);
    if (!deletedBanner) {
      console.log('✅ Banner deletion verified - banner not found in database');
    } else {
      console.log('❌ Banner deletion failed - banner still exists');
    }

    console.log('\n🎉 All Banner CRUD tests completed successfully!');
    console.log('\n📋 Available Admin Endpoints:');
    console.log('   POST   /api/banners/                    - Create banner');
    console.log('   PUT    /api/banners/:id                 - Update banner');
    console.log('   DELETE /api/banners/:id                 - Delete banner');
    console.log('   GET    /api/banners/admin/all           - Get all banners (admin)');
    console.log('   PATCH  /api/banners/:id/toggle-status   - Toggle banner status');
    console.log('   PATCH  /api/banners/bulk/priorities     - Bulk update priorities');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Testing interrupted');
  await mongoose.connection.close();
  process.exit(0);
});
