const fs = require('fs');
const path = require('path');

// Create .env file for backend
const backendEnv = `# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ressey-tours-crms

# JWT Configuration
JWT_SECRET=ressey-tours-super-secret-jwt-key-change-in-production-2024
JWT_EXPIRE=7d

# M-Pesa Daraja API Configuration
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_SHORTCODE=your-paybill-shortcode
MPESA_PASSKEY=your-passkey
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=http://localhost:5000/api/mpesa/callback
MPESA_VALIDATION_URL=http://localhost:5000/api/mpesa/validation
MPESA_INITIATOR_NAME=testapi
MPESA_SECURITY_CREDENTIAL=

# E-Signature API Configuration
ESIGNATURE_API_KEY=your-esignature-api-key
ESIGNATURE_API_URL=https://api.esignature-provider.com

# WhatsApp Business API Configuration
WHATSAPP_API_KEY=your-whatsapp-api-key
WHATSAPP_API_URL=https://api.whatsapp.com/v1
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id

# Email Configuration (for reports)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
DIRECTOR_EMAIL=director@ressytours.com

# Telematics/GPS API Configuration
TELEMATICS_API_KEY=your-telematics-api-key
TELEMATICS_API_URL=https://api.telematics-provider.com

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_PATH=./uploads
`;

// Create .env file for frontend
const frontendEnv = `REACT_APP_API_URL=http://localhost:5000
`;

try {
  // Create backend .env
  if (!fs.existsSync('.env')) {
    fs.writeFileSync('.env', backendEnv);
    console.log('✅ Created .env file for backend');
  } else {
    console.log('⚠️  .env file already exists');
  }

  // Create frontend .env
  const frontendEnvPath = path.join('frontend', '.env');
  if (!fs.existsSync(frontendEnvPath)) {
    fs.writeFileSync(frontendEnvPath, frontendEnv);
    console.log('✅ Created frontend/.env file');
  } else {
    console.log('⚠️  frontend/.env file already exists');
  }

  console.log('\n✅ Environment files created successfully!');
  console.log('📝 Please update the .env file with your actual API credentials when ready.');
} catch (error) {
  console.error('❌ Error creating environment files:', error.message);
}

