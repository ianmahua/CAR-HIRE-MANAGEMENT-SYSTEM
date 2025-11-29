const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./backend/models/User');
const Customer = require('./backend/models/Customer');
const Vehicle = require('./backend/models/Vehicle');
const Rental = require('./backend/models/Rental');
const Transaction = require('./backend/models/Transaction');
const VehicleOwner = require('./backend/models/VehicleOwner');

async function fetchAllData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ressey-tours-crms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Fetch Users
    console.log('📋 USERS:');
    console.log('═══════════════════════════════════════════');
    const users = await User.find().select('-password_hash');
    console.log(`Total Users: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name} (${user.role})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Phone: ${user.phone_msisdn}`);
      console.log(`   Active: ${user.is_active}`);
    });
    console.log('\n');

    // Fetch Customers
    console.log('📋 CUSTOMERS:');
    console.log('═══════════════════════════════════════════');
    const customers = await Customer.find();
    console.log(`Total Customers: ${customers.length}`);
    customers.forEach((customer, index) => {
      console.log(`\n${index + 1}. ${customer.name}`);
      console.log(`   ID: ${customer.ID_number}`);
      console.log(`   Phone: ${customer.phone}`);
      console.log(`   Returning Client: ${customer.is_returning_client}`);
      console.log(`   Rentals: ${customer.hire_history.length}`);
    });
    console.log('\n');

    // Fetch Vehicles
    console.log('📋 VEHICLES:');
    console.log('═══════════════════════════════════════════');
    const vehicles = await Vehicle.find();
    console.log(`Total Vehicles: ${vehicles.length}`);
    vehicles.forEach((vehicle, index) => {
      console.log(`\n${index + 1}. ${vehicle.make} ${vehicle.model}`);
      console.log(`   License: ${vehicle.license_plate}`);
      console.log(`   Category: ${vehicle.category}`);
      console.log(`   Status: ${vehicle.availability_status}`);
      console.log(`   Daily Rate: KES ${vehicle.daily_rate}`);
      console.log(`   Owner Type: ${vehicle.owner_type}`);
    });
    console.log('\n');

    // Fetch Rentals
    console.log('📋 RENTALS:');
    console.log('═══════════════════════════════════════════');
    const rentals = await Rental.find().populate('customer_ref', 'name').populate('vehicle_ref', 'license_plate');
    console.log(`Total Rentals: ${rentals.length}`);
    rentals.forEach((rental, index) => {
      console.log(`\n${index + 1}. Rental ID: ${rental.rental_id}`);
      console.log(`   Customer: ${rental.customer_ref?.name || 'N/A'}`);
      console.log(`   Vehicle: ${rental.vehicle_ref?.license_plate || 'N/A'}`);
      console.log(`   Status: ${rental.rental_status}`);
      console.log(`   Payment: ${rental.payment_status}`);
      console.log(`   Amount: KES ${rental.total_fee_gross}`);
      console.log(`   Dates: ${new Date(rental.start_date).toLocaleDateString()} - ${new Date(rental.end_date).toLocaleDateString()}`);
    });
    console.log('\n');

    // Fetch Transactions
    console.log('📋 TRANSACTIONS:');
    console.log('═══════════════════════════════════════════');
    const transactions = await Transaction.find().sort({ date: -1 }).limit(10);
    console.log(`Recent Transactions: ${transactions.length}`);
    transactions.forEach((txn, index) => {
      console.log(`\n${index + 1}. ${txn.transaction_id}`);
      console.log(`   Type: ${txn.type}`);
      console.log(`   Amount: KES ${txn.amount}`);
      console.log(`   Status: ${txn.status}`);
      console.log(`   Date: ${new Date(txn.date).toLocaleDateString()}`);
    });
    console.log('\n');

    // Fetch Vehicle Owners
    console.log('📋 VEHICLE OWNERS:');
    console.log('═══════════════════════════════════════════');
    const owners = await VehicleOwner.find();
    console.log(`Total Owners: ${owners.length}`);
    owners.forEach((owner, index) => {
      console.log(`\n${index + 1}. ${owner.name}`);
      console.log(`   Phone: ${owner.contact_details.phone}`);
      console.log(`   Payout Rate: ${owner.payout_rate.value}${owner.payout_rate.type === 'percentage' ? '%' : ' KES'}`);
      console.log(`   Payout Day: ${owner.payout_due_day}`);
      console.log(`   Vehicles: ${owner.linked_vehicles.length}`);
    });
    console.log('\n');

    // Summary
    console.log('📊 SUMMARY:');
    console.log('═══════════════════════════════════════════');
    console.log(`Users: ${users.length}`);
    console.log(`Customers: ${customers.length}`);
    console.log(`Vehicles: ${vehicles.length}`);
    console.log(`Rentals: ${rentals.length}`);
    console.log(`Transactions: ${await Transaction.countDocuments()}`);
    console.log(`Vehicle Owners: ${owners.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fetchAllData();




