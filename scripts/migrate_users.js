const fs = require('fs');
const path = require('path');

/**
 * Migration script to create centralized users collection
 * from existing addressbooks and favorites data
 */

console.log('🟡 Starting user migration process...\n');

// Read existing data
console.log('📖 Reading existing data files...');
const addressbooksPath = path.join(__dirname, '../Patel Full Collection/PatelDB.addressbooks.json');
const favoritesPath = path.join(__dirname, '../Patel Full Collection/PatelDB.favoritemasters.json');

const addressbooks = JSON.parse(fs.readFileSync(addressbooksPath, 'utf8'));
const favorites = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));

console.log(`✅ Loaded ${addressbooks.length} addressbook records`);
console.log(`✅ Loaded ${favorites.length} favorite records\n`);

// Extract unique users from addressbooks
console.log('👥 Extracting unique users from addressbooks...');
const userMap = new Map(); // mobile_number -> user data
const addressMap = new Map(); // mobile_number -> addresses array

addressbooks.forEach((addr, index) => {
  const mobile = addr.mobile_number?.toString().trim();

  if (!mobile) {
    console.log(`⚠️  Skipping address record ${index} - no mobile number`);
    return;
  }

  // Initialize user data if not exists
  if (!userMap.has(mobile)) {
    userMap.set(mobile, {
      mobile_no: mobile,
      name: addr.full_name || '',
      email: addr.email_id || '',
      user_type: 'customer',
      is_active: true,
      addresses: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: null
    });

    addressMap.set(mobile, []);
  }

  // Add address to user's address list
  const addressData = {
    idaddress_book: addr.idaddress_book,
    full_name: addr.full_name,
    delivery_addr_line_1: addr.delivery_addr_line_1,
    delivery_addr_line_2: addr.delivery_addr_line_2,
    delivery_addr_city: addr.delivery_addr_city,
    delivery_addr_pincode: addr.delivery_addr_pincode,
    is_default: addr.is_default,
    latitude: addr.latitude,
    longitude: addr.longitude,
    area_id: addr.area_id,
    original_id: addr._id?.$oid
  };

  addressMap.get(mobile).push(addressData);
});

// Extract users from favorites (who might not have addresses)
console.log('⭐ Processing favorites data...');
const favoriteMap = new Map(); // mobile_number -> favorites array

favorites.forEach((fav, index) => {
  const mobile = fav.mobile_no?.toString().trim();

  if (!mobile) {
    console.log(`⚠️  Skipping favorite record ${index} - no mobile number`);
    return;
  }

  // Initialize user if not already exists
  if (!userMap.has(mobile)) {
    userMap.set(mobile, {
      mobile_no: mobile,
      name: '',
      email: '',
      user_type: 'customer',
      is_active: true,
      addresses: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: null
    });

    addressMap.set(mobile, []);
  }

  // Add favorite
  if (!favoriteMap.has(mobile)) {
    favoriteMap.set(mobile, []);
  }

  favoriteMap.get(mobile).push({
    p_code: fav.p_code,
    store_code: fav.store_code,
    original_id: fav._id?.$oid
  });
});

// Create final users array
const users = Array.from(userMap.values());
console.log(`✅ Created ${users.length} unique user records\n`);

// Create updated addressbooks with user references
console.log('🏠 Creating updated addressbooks with user references...');
const updatedAddressbooks = [];

addressbooks.forEach((addr) => {
  const mobile = addr.mobile_number?.toString().trim();
  if (!mobile || !userMap.has(mobile)) return;

  // Find user index to create reference
  const userIndex = users.findIndex(u => u.mobile_no === mobile);

  updatedAddressbooks.push({
    ...addr,
    user_id: userIndex.toString(), // Reference to users array index (will be ObjectId in MongoDB)
    // Keep original fields for backward compatibility during migration
  });
});

console.log(`✅ Updated ${updatedAddressbooks.length} addressbook records\n`);

// Create updated favorites with user references
console.log('❤️ Creating updated favorites with user references...');
const updatedFavorites = [];

favorites.forEach((fav) => {
  const mobile = fav.mobile_no?.toString().trim();
  if (!mobile || !userMap.has(mobile)) return;

  // Find user index to create reference
  const userIndex = users.findIndex(u => u.mobile_no === mobile);

  updatedFavorites.push({
    ...fav,
    user_id: userIndex.toString(), // Reference to users array index (will be ObjectId in MongoDB)
    // Keep original mobile_no for backward compatibility during migration
  });
});

console.log(`✅ Updated ${updatedFavorites.length} favorite records\n`);

// Create migration output
const migrationData = {
  metadata: {
    migration_date: new Date().toISOString(),
    total_users: users.length,
    total_addresses: updatedAddressbooks.length,
    total_favorites: updatedFavorites.length,
    source_files: {
      addressbooks: 'PatelDB.addressbooks.json',
      favorites: 'PatelDB.favoritemasters.json'
    }
  },
  users: users,
  addressbooks: updatedAddressbooks,
  favorites: updatedFavorites
};

// Write migration files
const outputDir = path.join(__dirname, '../migration_output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write users collection
fs.writeFileSync(
  path.join(outputDir, 'users_collection.json'),
  JSON.stringify(users, null, 2)
);

// Write updated addressbooks
fs.writeFileSync(
  path.join(outputDir, 'addressbooks_migrated.json'),
  JSON.stringify(updatedAddressbooks, null, 2)
);

// Write updated favorites
fs.writeFileSync(
  path.join(outputDir, 'favorites_migrated.json'),
  JSON.stringify(updatedFavorites, null, 2)
);

// Write complete migration data
fs.writeFileSync(
  path.join(outputDir, 'migration_data.json'),
  JSON.stringify(migrationData, null, 2)
);

console.log('💾 Migration files written to migration_output/ directory\n');

// Print summary
console.log('📊 MIGRATION SUMMARY:');
console.log('===================');
console.log(`Total unique users created: ${users.length}`);
console.log(`Addressbook records migrated: ${updatedAddressbooks.length}`);
console.log(`Favorite records migrated: ${updatedFavorites.length}`);
console.log('\n📁 Output files:');
console.log('- users_collection.json');
console.log('- addressbooks_migrated.json');
console.log('- favorites_migrated.json');
console.log('- migration_data.json');

console.log('\n✅ Migration preparation complete!');
console.log('\n📋 NEXT STEPS:');
console.log('1. Review the generated files in migration_output/');
console.log('2. Import users_collection.json into MongoDB users collection');
console.log('3. Update MongoDB addressbooks collection with addressbooks_migrated.json');
console.log('4. Update MongoDB favorites collection with favorites_migrated.json');
console.log('5. Update API routes to use new user references');
console.log('6. Test the updated system');
