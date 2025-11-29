const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./backend/models/User');

dotenv.config();

async function createUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ressey-tours-crms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const users = [
      {
        name: 'Director User',
        email: 'director@ressytours.com',
        phone_msisdn: '254712345679',
        role: 'Director',
        password_hash: 'director123',
        is_active: true
      },
      {
        name: 'Driver One',
        email: 'driver1@ressytours.com',
        phone_msisdn: '254712345680',
        role: 'Driver',
        password_hash: 'driver123',
        is_active: true
      },
      {
        name: 'Driver Two',
        email: 'driver2@ressytours.com',
        phone_msisdn: '254712345681',
        role: 'Driver',
        password_hash: 'driver123',
        is_active: true
      }
    ];

    for (const userData of users) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        await User.deleteOne({ email: userData.email });
        console.log(`🗑️  Deleted existing user: ${userData.email}`);
      }
      
      const user = await User.create(userData);
      console.log(`✅ Created user: ${user.email} (${user.role})`);
    }

    console.log('\n📋 User Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 DIRECTOR:');
    console.log('   Email: director@ressytours.com');
    console.log('   Password: director123');
    console.log('\n👤 DRIVER 1:');
    console.log('   Email: driver1@ressytours.com');
    console.log('   Password: driver123');
    console.log('\n👤 DRIVER 2:');
    console.log('   Email: driver2@ressytours.com');
    console.log('   Password: driver123');
    console.log('\n👤 ADMIN (existing):');
    console.log('   Email: admin@ressytours.com');
    console.log('   Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating users:', error.message);
    process.exit(1);
  }
}

createUsers();








