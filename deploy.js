const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Deployment Process...\n');

// Step 1: Build frontend
console.log('📦 Building frontend...');
try {
  process.chdir('frontend');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Frontend built successfully\n');
  process.chdir('..');
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}

// Step 2: Check environment
console.log('🔍 Checking environment configuration...');
if (!fs.existsSync('.env')) {
  console.log('⚠️  .env file not found. Creating from template...');
  require('./setup-env.js');
}

// Step 3: Verify MongoDB connection
console.log('🔍 Verifying MongoDB connection...');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ressey-tours-crms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connection verified\n');
  mongoose.connection.close();
  
  console.log('✅ Deployment preparation complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Update .env with production credentials');
  console.log('2. Start server: npm start');
  console.log('3. Serve frontend: serve -s frontend/build -l 3000');
  console.log('\n🎉 System is ready for deployment!');
})
.catch((error) => {
  console.error('❌ MongoDB connection failed:', error.message);
  console.log('⚠️  Please ensure MongoDB is running or update MONGODB_URI in .env');
  process.exit(1);
});

