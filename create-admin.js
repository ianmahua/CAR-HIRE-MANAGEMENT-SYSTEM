const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./backend/models/User');

dotenv.config();

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ressey-tours-crms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@ressytours.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      process.exit(0);
    }

    // Create admin user (password will be hashed by User model pre-save hook)
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@ressytours.com',
      phone_msisdn: '254712345678',
      role: 'Admin',
      password_hash: 'admin123', // Plain password - will be hashed by pre-save hook
      is_active: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@ressytours.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdmin();

