const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../services/auth-service/.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ai_sinav_db';
const User = require('../services/auth-service/src/models/User');
const userService = require('../services/auth-service/src/services/userService');

async function test() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB:', MONGO_URI);
    
    // Find an admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('No admin user found! Please seed the database first.');
      process.exit(1);
    }
    console.log('Found Admin:', admin.email, 'ID:', admin._id);
    
    // Test generating instructor code
    console.log('Generating instructor code...');
    const newCode = await userService.generateInstructorCode(admin._id);
    console.log('SUCCESS! Generated Code Document:', newCode);
    
    // List instructor codes
    console.log('Listing all instructor codes...');
    const codes = await userService.listInstructorCodes();
    console.log('Found codes count:', codes.length);
    console.log('Codes:', codes);
    
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await mongoose.disconnect();
  }
}

test();
