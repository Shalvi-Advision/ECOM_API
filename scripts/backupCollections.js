const mongoose = require('mongoose');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Product = require('../models/Product');
const Department = require('../models/Department');
require('dotenv').config();

const backupCollections = async () => {
  try {
    console.log('Starting backup of collections...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shalvi_ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Backup data
    const departments = await Department.find({}).lean();
    const categories = await Category.find({}).lean();
    const subCategories = await SubCategory.find({}).lean();
    const products = await Product.find({}).lean();

    const backup = {
      timestamp: new Date().toISOString(),
      departments,
      categories,
      subCategories,
      products
    };

    // Save backup to file
    const fs = require('fs');
    const path = require('path');

    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const backupFile = path.join(backupDir, `backup_${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    console.log(`Backup saved to: ${backupFile}`);
    console.log(`Departments: ${departments.length}`);
    console.log(`Categories: ${categories.length}`);
    console.log(`SubCategories: ${subCategories.length}`);
    console.log(`Products: ${products.length}`);

  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the backup
if (require.main === module) {
  backupCollections();
}

module.exports = { backupCollections };
