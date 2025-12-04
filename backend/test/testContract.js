require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const ContractService = require('../utils/contractService');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

// Create sample booking data
function createSampleBookingData() {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() + 3);
  
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + 6);

  return {
    rental_id: 'BKG20251201001',
    booking_id: 'BKG20251201001',
    customer_name: 'Ian Njoroge',
    customer_email: 'iannjosh123@gmail.com',
    customer_phone: '0727347926',
    customer_phone_msisdn: '254727347926',
    customer_address: 'Nairobi, Kenya',
    customer_id_number: '12345678',
    vehicle_make: 'Toyota',
    vehicle_model: 'Land Cruiser Prado',
    vehicle_year: 2023,
    vehicle_license_plate: 'KCB 123A',
    license_plate: 'KCB 123A',
    vehicle_color: 'White',
    color: 'White',
    vehicle_fuel_type: 'Petrol',
    fuel_type: 'Petrol',
    start_date: startDate,
    pickup_date: startDate,
    end_date: endDate,
    return_date: endDate,
    duration_days: 3,
    duration: 3,
    destination: 'Nairobi → Mombasa → Nairobi',
    daily_rate: 12000,
    total_fee_gross: 36000,
    total_amount: 36000,
    booking_date: now,
    created_at: now
  };
}

// Main test function
async function testContractSystem() {
  logSection('🧪 CONTRACT SYSTEM TEST');
  
  // Check environment variables
  log('\n📋 Checking Environment Variables...', 'yellow');
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
  
  if (!emailUser || !emailPass) {
    log('❌ ERROR: Email credentials not found in .env file', 'red');
    log('   Please ensure EMAIL_USER and EMAIL_PASS (or EMAIL_PASSWORD) are set', 'yellow');
    process.exit(1);
  }
  
  log(`✓ EMAIL_USER: ${emailUser}`, 'green');
  log(`✓ EMAIL_PASSWORD: ${emailPass ? '***' + emailPass.slice(-4) : 'NOT SET'}`, 'green');
  
  // Initialize ContractService
  log('\n🔧 Initializing ContractService...', 'yellow');
  const contractService = new ContractService();
  
  // Test email connection
  log('\n📧 Testing Email Connection...', 'yellow');
  const emailTest = await contractService.testEmailConnection();
  
  if (!emailTest.success) {
    log('❌ Email connection test failed!', 'red');
    log(`   Error: ${emailTest.message || emailTest.error}`, 'red');
    log('\n⚠️  Continuing anyway, but email sending may fail...', 'yellow');
  } else {
    log('✓ Email connection test successful!', 'green');
  }
  
  // Create sample booking data
  log('\n📝 Creating Sample Booking Data...', 'yellow');
  const bookingData = createSampleBookingData();
  
  log('Sample Booking Data:', 'cyan');
  console.log(JSON.stringify(bookingData, null, 2));
  
  // Generate and send contract
  logSection('🚀 GENERATING AND SENDING CONTRACT');
  
  try {
    log('Starting contract generation and email sending process...\n', 'blue');
    
    const result = await contractService.generateAndSendContract(bookingData);
    
    // Display results
    logSection('📊 TEST RESULTS');
    
    if (result.success) {
      log('✅ SUCCESS! Contract generated and email sent successfully!', 'green');
      log('\n📄 Contract Details:', 'cyan');
      log(`   Contract Path: ${result.contractPath}`, 'white');
      log(`   Email Message ID: ${result.emailMessageId}`, 'white');
      log(`   Customer Email: ${result.customerEmail}`, 'white');
      log(`   Booking ID: ${result.bookingId}`, 'white');
      log(`   Processing Time: ${result.duration}`, 'white');
      
      log('\n📧 Email Information:', 'cyan');
      log(`   ✓ Email sent to: ${result.customerEmail}`, 'green');
      log(`   ✓ Check your inbox (and spam folder) for the contract`, 'green');
      log(`   ✓ The PDF contract is attached to the email`, 'green');
      
      log('\n📁 File Location:', 'cyan');
      log(`   ${result.contractPath}`, 'white');
      log(`   You can also find the contract PDF in: backend/contracts/`, 'white');
      
    } else {
      log('❌ PARTIAL SUCCESS OR FAILURE', 'yellow');
      
      if (result.contractGenerated) {
        log('\n✓ Contract PDF Generated Successfully', 'green');
        log(`   Contract Path: ${result.contractPath}`, 'white');
      } else {
        log('\n❌ Contract PDF Generation Failed', 'red');
        log(`   Error: ${result.error || result.message}`, 'red');
      }
      
      if (result.emailSent) {
        log('\n✓ Email Sent Successfully', 'green');
        log(`   Email Message ID: ${result.emailMessageId}`, 'white');
      } else {
        log('\n❌ Email Sending Failed', 'red');
        log(`   Error: ${result.emailError || result.error || result.message}`, 'red');
        log(`   Note: The contract PDF was still generated at: ${result.contractPath}`, 'yellow');
      }
    }
    
    log('\n' + '='.repeat(60), 'cyan');
    log('Test completed!', 'bright');
    log('='.repeat(60) + '\n', 'cyan');
    
  } catch (error) {
    logSection('❌ TEST FAILED');
    log(`Error: ${error.message}`, 'red');
    log(`Stack: ${error.stack}`, 'red');
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testContractSystem()
    .then(() => {
      log('\n✅ Test script completed successfully', 'green');
      process.exit(0);
    })
    .catch((error) => {
      log(`\n❌ Test script failed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { testContractSystem, createSampleBookingData };




