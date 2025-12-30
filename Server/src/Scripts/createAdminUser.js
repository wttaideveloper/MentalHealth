/**
 * Script to create an admin user
 * Run with: node Server/src/Scripts/createAdminUser.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../Model/User');

async function createAdminUser() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI not found in environment variables.');
      console.error('Please check your .env file at the root of the project.');
      process.exit(1);
    }
    
    console.log('🔌 Connecting to MongoDB...');
    mongoose.set("strictQuery", true);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB successfully');

    // Admin user details
    const adminEmail = "admin@gmail.com";
    const adminPassword = "password";
    const adminFirstName = "Admin";
    const adminLastName = "User";

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingAdmin) {
      // Update to admin if not already
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        existingAdmin.isEmailVerified = true;
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        existingAdmin.passwordHash = passwordHash;
        await existingAdmin.save();
        console.log('✅ Existing user updated to admin role');
        console.log('📧 Email:', adminEmail);
        console.log('🔑 Password:', adminPassword);
      } else {
        // Update password if admin already exists
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        existingAdmin.passwordHash = passwordHash;
        existingAdmin.isEmailVerified = true;
        await existingAdmin.save();
        console.log('✅ Admin user already exists - password updated');
        console.log('📧 Email:', adminEmail);
        console.log('🔑 Password:', adminPassword);
      }
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const adminUser = await User.create({
      email: adminEmail.toLowerCase(),
      passwordHash: passwordHash,
      firstName: adminFirstName,
      lastName: adminLastName,
      role: 'admin',
      isEmailVerified: true
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 Name:', adminFirstName, adminLastName);
    console.log('🔐 Role: admin');
    console.log('✅ Email Verified: true');
    console.log('\n🎉 You can now login at: http://localhost:5000/admin-login\n');
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    if (error.name === 'MongooseServerSelectionError') {
      console.error('\n❌ MongoDB Connection Error:');
      console.error('MongoDB is not running or connection string is incorrect.');
      console.error('\n📝 Please check:');
      console.error('1. Is MongoDB running? (Start MongoDB service)');
      console.error('2. Is MONGO_URI correct in your .env file?');
      console.error('3. For MongoDB Atlas, check your connection string');
      console.error('\n💡 Error details:', error.message);
    } else {
      console.error('\n❌ Error creating admin user:', error.message);
      console.error('Full error:', error);
    }
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

createAdminUser();

