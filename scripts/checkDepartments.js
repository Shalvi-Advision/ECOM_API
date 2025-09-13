const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Department = require('../models/Department');

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecom_db';
    console.log('🔌 Connecting to MongoDB...');

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Check department data
const checkDepartments = async () => {
  console.log('🔍 Checking departments...');

  try {
    const departments = await Department.find({}).lean();

    console.log(`📊 Found ${departments.length} departments`);
    console.log('📋 All departments:');

    departments.forEach((dept, index) => {
      console.log(`${index + 1}. ${dept.department_name}`);
      console.log(`   ID: ${dept._id}`);
      console.log(`   department_id: ${dept.department_id}`);
      console.log();
    });

    // Check if department with id "18" exists
    const dept18 = departments.find(d => d.department_id === "18");
    if (dept18) {
      console.log(`✅ Department with id "18" found: ${dept18.department_name}`);
    } else {
      console.log(`❌ Department with id "18" NOT found`);
      console.log(`📋 Available department_ids: ${departments.map(d => d.department_id).join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Error checking departments:', error);
  }
};

// Main function
const runCheck = async () => {
  try {
    console.log('🚀 Starting Department Check Process\n');
    console.log('=====================================\n');

    await connectDB();
    await checkDepartments();

    console.log('✅ Department check completed!');

  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the check
runCheck();
