const mongoose = require('mongoose');
require('dotenv').config();

// Import the Banner model
const Banner = require('../models/Banner');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB for banner migration');
  migrateBanners();
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

async function migrateBanners() {
  try {
    console.log('🔄 Starting banner migration...');
    
    // Get all existing banners
    const existingBanners = await Banner.find({});
    console.log(`📊 Found ${existingBanners.length} banners to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const banner of existingBanners) {
      try {
        // Check if banner already has new fields
        if (banner.title && banner.media_url && banner.placement) {
          console.log(`⏭️  Skipping banner ${banner._id} - already migrated`);
          skippedCount++;
          continue;
        }
        
        // Determine media type based on file extension
        const mediaUrl = banner.banner_img || '';
        let mediaType = 'image';
        if (mediaUrl.toLowerCase().includes('.gif')) {
          mediaType = 'gif';
        } else if (mediaUrl.toLowerCase().match(/\.(mp4|webm|mov|avi)$/)) {
          mediaType = 'video';
        }
        
        // Determine redirect type based on redirect_link
        let redirectType = 'internal';
        let redirectId = null;
        let redirectUrl = banner.redirect_link || '/';
        
        if (banner.redirect_link && banner.redirect_link.startsWith('http')) {
          redirectType = 'external';
          redirectUrl = banner.redirect_link;
        } else if (banner.redirect_link && banner.redirect_link.includes('/product/')) {
          redirectType = 'product';
          const productIdMatch = banner.redirect_link.match(/\/product\/([^\/]+)/);
          if (productIdMatch) {
            redirectId = productIdMatch[1];
          }
        } else if (banner.redirect_link && banner.redirect_link.includes('/category/')) {
          redirectType = 'category';
          const categoryIdMatch = banner.redirect_link.match(/\/category\/([^\/]+)/);
          if (categoryIdMatch) {
            redirectId = categoryIdMatch[1];
          }
        }
        
        // Determine placement based on banner_type_id
        let page = 'homepage';
        let position = 'top';
        
        // Map banner_type_id to placement
        switch (banner.banner_type_id) {
          case 1:
          case 10:
            page = 'homepage';
            position = 'top';
            break;
          case 2:
            page = 'homepage';
            position = 'middle';
            break;
          case 3:
            page = 'homepage';
            position = 'bottom';
            break;
          case 4:
            page = 'category';
            position = 'top';
            break;
          case 5:
            page = 'product';
            position = 'sidebar';
            break;
          default:
            page = 'homepage';
            position = 'top';
        }
        
        // Update banner with new fields
        const updateData = {
          title: `Banner ${banner.sequence_id}`,
          media_type: mediaType,
          media_url: banner.banner_img,
          redirect: {
            type: redirectType,
            id: redirectId,
            url: redirectUrl
          },
          priority: Math.max(1, 11 - banner.sequence_id), // Higher sequence = higher priority
          validity: {
            start: banner.createdAt || new Date(),
            end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          },
          tracking: {
            impressions: 0,
            clicks: 0
          },
          placement: {
            page: page,
            position: position,
            platform: ['web', 'android', 'ios']
          },
          rotation_type: 'carousel'
        };
        
        await Banner.findByIdAndUpdate(banner._id, updateData);
        console.log(`✅ Migrated banner ${banner._id} (${banner.store_code})`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating banner ${banner._id}:`, error.message);
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} banners`);
    console.log(`⏭️  Skipped (already migrated): ${skippedCount} banners`);
    console.log(`📊 Total processed: ${migratedCount + skippedCount} banners`);
    
    // Test the new format by fetching a few banners
    console.log('\n🧪 Testing new format...');
    const testBanners = await Banner.find({ is_active: 'Enabled' }).limit(3);
    
    for (const banner of testBanners) {
      console.log(`\n📋 Banner ${banner._id}:`);
      console.log(`   Title: ${banner.title}`);
      console.log(`   Media Type: ${banner.media_type}`);
      console.log(`   Media URL: ${banner.media_url}`);
      console.log(`   Redirect: ${banner.redirect.type} - ${banner.redirect.url}`);
      console.log(`   Placement: ${banner.placement.page} - ${banner.placement.position}`);
      console.log(`   Priority: ${banner.priority}`);
    }
    
    console.log('\n🎉 Banner migration completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Migration interrupted');
  await mongoose.connection.close();
  process.exit(0);
});
