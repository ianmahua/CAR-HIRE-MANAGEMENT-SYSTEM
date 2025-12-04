const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const Rental = require('../models/Rental');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const VehicleOwner = require('../models/VehicleOwner');

// Kenyan names pool
const kenyanFirstNames = [
  'John', 'Mary', 'David', 'Sarah', 'James', 'Grace', 'Peter', 'Jane',
  'Michael', 'Lucy', 'Daniel', 'Ruth', 'Paul', 'Esther', 'Joseph', 'Faith',
  'Samuel', 'Hannah', 'Robert', 'Rebecca', 'Stephen', 'Alice', 'Patrick', 'Rose',
  'Francis', 'Margaret', 'Anthony', 'Catherine', 'Vincent', 'Nancy', 'George', 'Ann',
  'Philip', 'Joyce', 'Moses', 'Elizabeth', 'Thomas', 'Martha', 'Simon', 'Christine'
];

const kenyanLastNames = [
  'Mwangi', 'Wanjiru', 'Kamau', 'Akinyi', 'Ochieng', 'Njeri', 'Kipchoge', 'Muthoni',
  'Otieno', 'Achieng', 'Kariuki', 'Wambui', 'Kimani', 'Nyambura', 'Njoroge', 'Chebet',
  'Kiprotich', 'Chepngetich', 'Kipruto', 'Chelangat', 'Waweru', 'Wairimu', 'Mutua', 'Mutiso',
  'Omondi', 'Onyango', 'Ndungu', 'Karanja', 'Kiptoo', 'Jepkoech', 'Kibet', 'Jemutai',
  'Barasa', 'Wekesa', 'Macharia', 'Gitau', 'Ndirangu', 'Muriuki', 'Korir', 'Biwott'
];

const kenyanLocations = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Naivasha'];

const destinations = [
  'Nairobi to Mombasa', 'Nairobi to Kisumu', 'Nairobi to Nakuru', 'Nairobi to Eldoret',
  'Mombasa to Malindi', 'Nairobi to Thika', 'Nairobi to Naivasha', 'Mombasa to Diani',
  'Nairobi to Nyeri', 'Nairobi to Meru', 'Nairobi to Kitale', 'Mombasa to Lamu',
  'Kisumu to Kakamega', 'Nakuru to Naivasha', 'Eldoret to Kitale', 'Thika to Nyeri'
];

const vehicleData = [
  // Toyota (8)
  { make: 'Toyota', model: 'Prado', type: 'SUV', plate: 'KCT 890T', category: 'Executive', rate: 8000 },
  { make: 'Toyota', model: 'Land Cruiser', type: 'SUV', plate: 'KCS 567S', category: 'Executive', rate: 9000 },
  { make: 'Toyota', model: 'Rav4', type: 'SUV', plate: 'KCR 234R', category: 'Executive', rate: 7000 },
  { make: 'Toyota', model: 'Hilux', type: 'Pickup', plate: 'KCQ 901Q', category: 'Economy', rate: 6000 },
  { make: 'Toyota', model: 'Premio', type: 'Sedan', plate: 'KCP 678P', category: 'Economy', rate: 4000 },
  { make: 'Toyota', model: 'Fielder', type: 'Sedan', plate: 'KCO 345O', category: 'Economy', rate: 3500 },
  { make: 'Toyota', model: 'Axio', type: 'Sedan', plate: 'KCN 012N', category: 'Economy', rate: 3000 },
  { make: 'Toyota', model: 'Vitz', type: 'Sedan', plate: 'KCM 789M', category: 'Economy', rate: 3000 },
  // Nissan (5)
  { make: 'Nissan', model: 'X-Trail', type: 'SUV', plate: 'KCL 456L', category: 'Executive', rate: 6500 },
  { make: 'Nissan', model: 'Patrol', type: 'SUV', plate: 'KCK 123K', category: 'Executive', rate: 8500 },
  { make: 'Nissan', model: 'Navara', type: 'Pickup', plate: 'KCJ 890J', category: 'Economy', rate: 5500 },
  { make: 'Nissan', model: 'Note', type: 'Sedan', plate: 'KCI 567I', category: 'Economy', rate: 3200 },
  { make: 'Nissan', model: 'Tiida', type: 'Sedan', plate: 'KCH 234H', category: 'Economy', rate: 3300 },
  // Isuzu (4)
  { make: 'Isuzu', model: 'D-Max', type: 'Pickup', plate: 'KCG 901G', category: 'Economy', rate: 5800 },
  { make: 'Isuzu', model: 'MU-X', type: 'SUV', plate: 'KCF 678F', category: 'Executive', rate: 7200 },
  { make: 'Isuzu', model: 'Trooper', type: 'SUV', plate: 'KCE 345E', category: 'Executive', rate: 6800 },
  { make: 'Isuzu', model: 'D-Max', type: 'Pickup', plate: 'KCD 012D', category: 'Economy', rate: 5500 },
  // Mazda (3)
  { make: 'Mazda', model: 'CX-5', type: 'SUV', plate: 'KCC 789C', category: 'Executive', rate: 6800 },
  { make: 'Mazda', model: 'Demio', type: 'Sedan', plate: 'KCB 456B', category: 'Economy', rate: 3100 },
  { make: 'Mazda', model: 'Axela', type: 'Sedan', plate: 'KCA 123A', category: 'Economy', rate: 3400 },
  // Mitsubishi (3)
  { make: 'Mitsubishi', model: 'Pajero', type: 'SUV', plate: 'KCU 234U', category: 'Executive', rate: 7500 },
  { make: 'Mitsubishi', model: 'L200', type: 'Pickup', plate: 'KCV 567V', category: 'Economy', rate: 5600 },
  { make: 'Mitsubishi', model: 'Outlander', type: 'SUV', plate: 'KCW 890W', category: 'Executive', rate: 6900 },
  // Honda (2)
  { make: 'Honda', model: 'CR-V', type: 'SUV', plate: 'KCX 123X', category: 'Executive', rate: 6700 },
  { make: 'Honda', model: 'Fit', type: 'Sedan', plate: 'KCY 456Y', category: 'Economy', rate: 3200 }
];

const serviceProviders = ['ABC Motors', 'Quick Fix Garage', 'Toyota Service Center', 'Ressey Workshop'];
const serviceDescriptions = [
  'Oil change and filter replacement',
  'Brake pads replaced',
  'Tire rotation and balancing',
  'Engine tune-up',
  'Transmission service',
  'Battery replacement',
  'Air conditioning service',
  'Suspension repair',
  'Exhaust system repair',
  'Brake fluid flush',
  'Coolant system flush',
  'Wheel alignment'
];

const bookingNotes = [
  'Airport pickup requested',
  'Child seat needed',
  'Long-term rental discount applied',
  'GPS navigation required',
  'Additional driver requested',
  'Corporate booking',
  'Wedding event',
  'Safari tour',
  'Business trip',
  'Family vacation'
];

// Helper functions
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateKenyanPhone() {
  const prefixes = ['712', '713', '714', '715', '720', '721', '722', '723', '724', '725', '726', '727', '728', '729', '740', '741', '742', '743', '745', '746', '748'];
  return `254${randomElement(prefixes)}${randomInt(100000, 999999)}`;
}

function generateIdNumber() {
  return `${randomInt(10000000, 99999999)}`;
}

function generateName() {
  return `${randomElement(kenyanFirstNames)} ${randomElement(kenyanLastNames)}`;
}

function generateEmail(name) {
  return `${name.toLowerCase().replace(' ', '.')}@gmail.com`;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function subtractDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

// Connect to database
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ressey-tours-crms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Prompt for confirmation
async function promptConfirmation() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('\n⚠️  This will delete all existing data (except admin@ressytours.com). Continue? (y/n): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Main seeding function
async function reseedDatabase() {
  try {
    await connectDB();

    // Prompt for confirmation
    const confirmed = await promptConfirmation();
    if (!confirmed) {
      console.log('❌ Operation cancelled by user.');
      process.exit(0);
    }

    console.log('\n🗑️  STEP 1: CLEARING EXISTING DATA...\n');

    // Clear data in dependency order
    console.log('  → Clearing Transactions...');
    await Transaction.deleteMany({});
    
    console.log('  → Clearing Bookings...');
    await Booking.deleteMany({});
    
    console.log('  → Clearing Rentals...');
    await Rental.deleteMany({});
    
    console.log('  → Clearing Vehicles...');
    await Vehicle.deleteMany({});
    
    console.log('  → Clearing Vehicle Owners...');
    await VehicleOwner.deleteMany({});
    
    console.log('  → Clearing Customers...');
    await Customer.deleteMany({});
    
    console.log('  → Clearing Users (except admin@ressytours.com)...');
    await User.deleteMany({ email: { $ne: 'admin@ressytours.com' } });

    console.log('✅ Data cleared successfully!\n');

    // ===========================================
    // STEP 2: CREATE USERS
    // ===========================================
    console.log('👥 STEP 2: CREATING USERS...\n');

    const users = [];

    // Keep or create main admin
    let mainAdmin = await User.findOne({ email: 'admin@ressytours.com' });
    if (!mainAdmin) {
      mainAdmin = await User.create({
        name: 'Main Admin',
        email: 'admin@ressytours.com',
        password_hash: 'admin123',
        role: 'Admin',
        phone_msisdn: generateKenyanPhone(),
        is_active: true
      });
      console.log('  ✓ Created Main Admin: admin@ressytours.com');
    } else {
      console.log('  ✓ Kept existing Main Admin: admin@ressytours.com');
    }
    users.push(mainAdmin);

    // Create drivers
    const driver1 = await User.create({
      name: 'Dan Wesa',
      email: 'dan@ressytours.com',
      password_hash: 'driver123',
      role: 'Driver',
      phone_msisdn: generateKenyanPhone(),
      is_active: true
    });
    console.log('  ✓ Created Driver: Dan Wesa (dan@ressytours.com)');
    users.push(driver1);

    const driver2 = await User.create({
      name: 'James Kimani',
      email: 'james.kimani@ressytours.com',
      password_hash: 'password123',
      role: 'Driver',
      phone_msisdn: generateKenyanPhone(),
      is_active: true
    });
    console.log('  ✓ Created Driver: James Kimani');
    users.push(driver2);

    const driver3 = await User.create({
      name: 'Mary Njeri',
      email: 'mary.njeri@ressytours.com',
      password_hash: 'password123',
      role: 'Driver',
      phone_msisdn: generateKenyanPhone(),
      is_active: true
    });
    console.log('  ✓ Created Driver: Mary Njeri');
    users.push(driver3);

    const driver4 = await User.create({
      name: 'Peter Ochieng',
      email: 'peter.ochieng@ressytours.com',
      password_hash: 'password123',
      role: 'Driver',
      phone_msisdn: generateKenyanPhone(),
      is_active: true
    });
    console.log('  ✓ Created Driver: Peter Ochieng');
    users.push(driver4);

    // Create additional admins
    const admin2 = await User.create({
      name: 'Sarah Wanjiku',
      email: 'sarah.admin@ressytours.com',
      password_hash: 'password123',
      role: 'Admin',
      phone_msisdn: generateKenyanPhone(),
      is_active: true
    });
    console.log('  ✓ Created Admin: Sarah Wanjiku');
    users.push(admin2);

    const admin3 = await User.create({
      name: 'David Kariuki',
      email: 'david.admin@ressytours.com',
      password_hash: 'password123',
      role: 'Admin',
      phone_msisdn: generateKenyanPhone(),
      is_active: true
    });
    console.log('  ✓ Created Admin: David Kariuki');
    users.push(admin3);

    // Create director
    const director = await User.create({
      name: 'Robert Mwangi',
      email: 'robert.director@ressytours.com',
      password_hash: 'password123',
      role: 'Director',
      phone_msisdn: generateKenyanPhone(),
      is_active: true
    });
    console.log('  ✓ Created Director: Robert Mwangi');
    users.push(director);

    console.log(`\n✅ Created ${users.length} users\n`);

    // ===========================================
    // STEP 3: CREATE CUSTOMERS
    // ===========================================
    console.log('👤 STEP 3: CREATING CUSTOMERS...\n');

    const customers = [];
    const usedPhones = new Set();
    const usedIds = new Set();

    for (let i = 0; i < 40; i++) {
      let phone = generateKenyanPhone();
      while (usedPhones.has(phone)) {
        phone = generateKenyanPhone();
      }
      usedPhones.add(phone);

      let idNumber = generateIdNumber();
      while (usedIds.has(idNumber)) {
        idNumber = generateIdNumber();
      }
      usedIds.add(idNumber);

      const name = generateName();
      const customer = await Customer.create({
        name,
        ID_number: idNumber,
        phone,
        email: generateEmail(name),
        is_returning_client: i < 15, // First 15 are returning clients
        loyalty_points: i < 15 ? randomInt(50, 500) : 0,
        hire_history: []
      });
      customers.push(customer);
    }

    console.log(`✅ Created ${customers.length} customers\n`);

    // ===========================================
    // STEP 4: CREATE VEHICLES
    // ===========================================
    console.log('🚗 STEP 4: CREATING VEHICLES...\n');

    const vehicles = [];
    const drivers = users.filter(u => u.role === 'Driver');
    const admins = users.filter(u => u.role === 'Admin' || u.role === 'Director');
    const now = new Date();

    for (let i = 0; i < vehicleData.length; i++) {
      const vData = vehicleData[i];
      
      // Determine status
      let status;
      if (i < 12) status = 'Parking'; // 12 available
      else if (i < 22) status = 'Rented Out'; // 10 rented
      else status = 'In Garage'; // 3 in service

      // Generate service history (2-4 records per vehicle)
      const numServices = randomInt(2, 4);
      const serviceLogs = [];
      let currentMileage = randomInt(20000, 80000);
      let lastServiceMileage = currentMileage - randomInt(500, 3000);
      let lastServiceDate = subtractDays(now, randomInt(10, 90));

      for (let j = 0; j < numServices; j++) {
        const serviceDate = subtractDays(now, randomInt(30 + (j * 90), 90 + (j * 90)));
        const serviceMileage = lastServiceMileage - (j * randomInt(3000, 5000));
        const serviceType = randomElement(['Maintenance', 'Repair', 'Inspection', 'Other']);
        const performedBy = randomElement([...drivers, ...admins]);

        serviceLogs.push({
          date: serviceDate,
          cost: randomInt(5000, 25000),
          description: randomElement(serviceDescriptions),
          performed_by: performedBy.name,
          service_type: serviceType,
          odometer_reading: serviceMileage > 0 ? serviceMileage : randomInt(10000, 20000),
          next_service_due: addDays(serviceDate, 90)
        });
      }

      // Sort service logs by date (oldest first)
      serviceLogs.sort((a, b) => a.date - b.date);

      // Calculate maintenance fields based on most recent service
      const mostRecentService = serviceLogs[serviceLogs.length - 1];
      const nextServiceDueDate = addDays(mostRecentService.date, 90);
      const nextServiceDueMileage = mostRecentService.odometer_reading + 5000;

      // Some vehicles should be near service (for testing alerts)
      if (i < 5) {
        // Make these vehicles near service threshold
        currentMileage = nextServiceDueMileage - randomInt(100, 400); // Within 100-400 km of service
      }

      const vehicle = await Vehicle.create({
        make: vData.make,
        model: vData.model,
        year: randomInt(2018, 2024),
        category: vData.category,
        license_plate: vData.plate,
        owner_type: 'Company Owned',
        daily_rate: vData.rate,
        availability_status: status,
        service_log: serviceLogs,
        monthly_revenue_mtd: status === 'Rented Out' ? randomInt(50000, 200000) : 0,
        current_servicing_cost_mtd: randomInt(5000, 30000),
        last_odometer_reading: currentMileage,
        maintenance: {
          lastServiceDate: mostRecentService.date,
          lastServiceMileage: mostRecentService.odometer_reading,
          currentMileage: currentMileage,
          serviceIntervalKm: 5000,
          serviceIntervalDays: 90,
          nextServiceDueDate: nextServiceDueDate,
          nextServiceDueMileage: nextServiceDueMileage
        }
      });

      vehicles.push(vehicle);
      console.log(`  ✓ Created vehicle: ${vData.make} ${vData.model} - ${vData.plate} (${status})`);
    }

    console.log(`\n✅ Created ${vehicles.length} vehicles\n`);

    // ===========================================
    // STEP 5: CREATE RENTALS
    // ===========================================
    console.log('📅 STEP 5: CREATING RENTALS...\n');

    const rentals = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Track which vehicles are rented
    const rentedVehicles = new Set();

    // 2 Overdue rentals (past return date, still active)
    for (let i = 0; i < 2; i++) {
      const vehicle = vehicles.find(v => v.availability_status === 'Rented Out' && !rentedVehicles.has(v._id.toString()));
      if (!vehicle) continue;
      rentedVehicles.add(vehicle._id.toString());

      const customer = randomElement(customers);
      const driver = randomElement(drivers);
      const startDate = subtractDays(today, randomInt(10, 20));
      const endDate = subtractDays(today, randomInt(1, 3)); // 1-3 days overdue
      const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const totalFee = vehicle.daily_rate * durationDays;

      const rental = await Rental.create({
        vehicle_ref: vehicle._id,
        customer_ref: customer._id,
        driver_assigned: driver._id,
        booking_date: subtractDays(startDate, 2),
        start_date: startDate,
        end_date: endDate,
        duration_days: durationDays,
        destination: randomElement(destinations),
        total_fee_gross: totalFee,
        hire_type: 'Direct Client',
        payment_status: 'Paid',
        rental_status: 'Active', // Still active but overdue
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone
      });

      rentals.push(rental);
      console.log(`  ✓ Created OVERDUE rental: ${vehicle.license_plate} (${Math.ceil((today - endDate) / (1000 * 60 * 60 * 24))} days overdue)`);
    }

    // 5 Due back TODAY
    for (let i = 0; i < 5; i++) {
      const vehicle = vehicles.find(v => v.availability_status === 'Rented Out' && !rentedVehicles.has(v._id.toString()));
      if (!vehicle) continue;
      rentedVehicles.add(vehicle._id.toString());

      const customer = randomElement(customers);
      const driver = randomElement(drivers);
      const startDate = subtractDays(today, randomInt(3, 10));
      const endDate = today; // Due today
      const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const totalFee = vehicle.daily_rate * durationDays;

      const rental = await Rental.create({
        vehicle_ref: vehicle._id,
        customer_ref: customer._id,
        driver_assigned: driver._id,
        booking_date: subtractDays(startDate, 2),
        start_date: startDate,
        end_date: endDate,
        duration_days: durationDays,
        destination: randomElement(destinations),
        total_fee_gross: totalFee,
        hire_type: 'Direct Client',
        payment_status: 'Paid',
        rental_status: 'Active',
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone
      });

      rentals.push(rental);
      console.log(`  ✓ Created rental DUE TODAY: ${vehicle.license_plate}`);
    }

    // 3 Due back TOMORROW
    for (let i = 0; i < 3; i++) {
      const vehicle = vehicles.find(v => v.availability_status === 'Rented Out' && !rentedVehicles.has(v._id.toString()));
      if (!vehicle) continue;
      rentedVehicles.add(vehicle._id.toString());

      const customer = randomElement(customers);
      const driver = randomElement(drivers);
      const startDate = subtractDays(today, randomInt(3, 10));
      const tomorrow = addDays(today, 1);
      const durationDays = Math.ceil((tomorrow - startDate) / (1000 * 60 * 60 * 24));
      const totalFee = vehicle.daily_rate * durationDays;

      const rental = await Rental.create({
        vehicle_ref: vehicle._id,
        customer_ref: customer._id,
        driver_assigned: driver._id,
        booking_date: subtractDays(startDate, 2),
        start_date: startDate,
        end_date: tomorrow,
        duration_days: durationDays,
        destination: randomElement(destinations),
        total_fee_gross: totalFee,
        hire_type: 'Direct Client',
        payment_status: 'Paid',
        rental_status: 'Active',
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone
      });

      rentals.push(rental);
      console.log(`  ✓ Created rental DUE TOMORROW: ${vehicle.license_plate}`);
    }

    // 10 Active rentals (currently ongoing, due in future)
    let activeCount = rentals.filter(r => r.rental_status === 'Active').length;
    while (activeCount < 10) {
      const vehicle = vehicles.find(v => v.availability_status === 'Rented Out' && !rentedVehicles.has(v._id.toString()));
      if (!vehicle) break;
      rentedVehicles.add(vehicle._id.toString());

      const customer = randomElement(customers);
      const driver = randomElement(drivers);
      const startDate = subtractDays(today, randomInt(1, 5));
      const endDate = addDays(today, randomInt(2, 10)); // Due in future
      const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const totalFee = vehicle.daily_rate * durationDays;

      const rental = await Rental.create({
        vehicle_ref: vehicle._id,
        customer_ref: customer._id,
        driver_assigned: driver._id,
        booking_date: subtractDays(startDate, 2),
        start_date: startDate,
        end_date: endDate,
        duration_days: durationDays,
        destination: randomElement(destinations),
        total_fee_gross: totalFee,
        hire_type: 'Direct Client',
        payment_status: 'Paid',
        rental_status: 'Active',
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone
      });

      rentals.push(rental);
      activeCount++;
      console.log(`  ✓ Created active rental: ${vehicle.license_plate} (due in ${Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))} days)`);
    }

    // 30 Completed rentals (returned in past 6 months)
    const availableVehicles = vehicles.filter(v => v.availability_status === 'Parking');
    for (let i = 0; i < 30; i++) {
      const vehicle = randomElement(availableVehicles);
      const customer = randomElement(customers);
      const driver = randomElement(drivers);
      
      const startDate = subtractDays(today, randomInt(7, 180));
      const durationDays = randomInt(2, 14);
      const endDate = addDays(startDate, durationDays);
      const totalFee = vehicle.daily_rate * durationDays;

      // Some rentals have extensions (2-3 out of completed)
      const hasExtension = i < 3;
      const extensionDays = hasExtension ? randomInt(1, 5) : 0;

      const rental = await Rental.create({
        vehicle_ref: vehicle._id,
        customer_ref: customer._id,
        driver_assigned: driver._id,
        booking_date: subtractDays(startDate, randomInt(1, 7)),
        start_date: startDate,
        end_date: hasExtension ? addDays(endDate, extensionDays) : endDate,
        actual_end_date: hasExtension ? addDays(endDate, extensionDays) : endDate,
        duration_days: durationDays + extensionDays,
        destination: randomElement(destinations),
        total_fee_gross: totalFee + (hasExtension ? vehicle.daily_rate * extensionDays : 0),
        hire_type: randomElement(['Direct Client', 'Broker Handoff']),
        payment_status: 'Paid',
        rental_status: 'Completed',
        is_extended: hasExtension,
        extension_days: extensionDays,
        extension_amount: hasExtension ? vehicle.daily_rate * extensionDays : 0,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone
      });

      rentals.push(rental);

      // Add to customer's hire history
      customer.hire_history.push({
        rental_id: rental._id,
        rental_date: rental.start_date,
        vehicle_model: `${vehicle.make} ${vehicle.model}`,
        duration_days: rental.duration_days,
        total_fee: rental.total_fee_gross
      });
      await customer.save();

      if (hasExtension) {
        console.log(`  ✓ Created completed rental (with ${extensionDays}-day extension): ${vehicle.license_plate}`);
      } else if (i % 10 === 0) {
        console.log(`  ✓ Created completed rental: ${vehicle.license_plate}`);
      }
    }

    // Create one specific customer with 5 past rentals for testing
    const frequentCustomer = customers[0];
    console.log(`\n  → Adding 5 rentals to frequent customer: ${frequentCustomer.name}`);
    for (let i = 0; i < 5; i++) {
      const vehicle = randomElement(availableVehicles);
      const driver = randomElement(drivers);
      const startDate = subtractDays(today, randomInt(30 + (i * 30), 60 + (i * 30)));
      const durationDays = randomInt(3, 10);
      const endDate = addDays(startDate, durationDays);
      const totalFee = vehicle.daily_rate * durationDays;

      const rental = await Rental.create({
        vehicle_ref: vehicle._id,
        customer_ref: frequentCustomer._id,
        driver_assigned: driver._id,
        booking_date: subtractDays(startDate, 2),
        start_date: startDate,
        end_date: endDate,
        actual_end_date: endDate,
        duration_days: durationDays,
        destination: randomElement(destinations),
        total_fee_gross: totalFee,
        hire_type: 'Direct Client',
        payment_status: 'Paid',
        rental_status: 'Completed',
        customer_name: frequentCustomer.name,
        customer_email: frequentCustomer.email,
        customer_phone: frequentCustomer.phone
      });

      frequentCustomer.hire_history.push({
        rental_id: rental._id,
        rental_date: rental.start_date,
        vehicle_model: `${vehicle.make} ${vehicle.model}`,
        duration_days: rental.duration_days,
        total_fee: rental.total_fee_gross
      });
    }
    await frequentCustomer.save();
    frequentCustomer.is_returning_client = true;
    await frequentCustomer.save();

    console.log(`\n✅ Created ${rentals.length} rentals\n`);

    // ===========================================
    // STEP 6: CREATE BOOKINGS
    // ===========================================
    console.log('📋 STEP 6: CREATING BOOKINGS...\n');

    const bookings = [];

    // 6 Bookings for TODAY
    for (let i = 0; i < 6; i++) {
      const customer = randomElement(customers);
      const vehicle = randomElement(vehicleData);
      const numberOfDays = randomInt(2, 10);
      const dailyRate = vehicle.rate;
      const totalAmount = dailyRate * numberOfDays;

      const booking = await Booking.create({
        customerName: customer.name,
        customerIdNumber: customer.ID_number,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        vehicleMake: vehicle.make,
        vehicleModel: vehicle.model,
        bookingDate: today,
        numberOfDays,
        endDate: addDays(today, numberOfDays),
        destination: randomElement(destinations),
        dailyRate,
        totalAmount,
        notes: randomElement(bookingNotes),
        status: 'pending',
        createdBy: randomElement(drivers)._id
      });

      bookings.push(booking);
      console.log(`  ✓ Created booking for TODAY: ${customer.name} - ${vehicle.make} ${vehicle.model}`);
    }

    // 4 Bookings for TOMORROW
    const tomorrow = addDays(today, 1);
    for (let i = 0; i < 4; i++) {
      const customer = randomElement(customers);
      const vehicle = randomElement(vehicleData);
      const numberOfDays = randomInt(2, 8);
      const dailyRate = vehicle.rate;
      const totalAmount = dailyRate * numberOfDays;

      const booking = await Booking.create({
        customerName: customer.name,
        customerIdNumber: customer.ID_number,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        vehicleMake: vehicle.make,
        vehicleModel: vehicle.model,
        bookingDate: tomorrow,
        numberOfDays,
        endDate: addDays(tomorrow, numberOfDays),
        destination: randomElement(destinations),
        dailyRate,
        totalAmount,
        notes: randomElement(bookingNotes),
        status: 'confirmed',
        createdBy: randomElement(drivers)._id
      });

      bookings.push(booking);
      console.log(`  ✓ Created booking for TOMORROW: ${customer.name} - ${vehicle.make} ${vehicle.model}`);
    }

    // 12 Future bookings (next 30 days)
    for (let i = 0; i < 12; i++) {
      const customer = randomElement(customers);
      const vehicle = randomElement(vehicleData);
      const bookingDate = addDays(today, randomInt(3, 30));
      const numberOfDays = randomInt(2, 10);
      const dailyRate = vehicle.rate;
      const totalAmount = dailyRate * numberOfDays;

      const booking = await Booking.create({
        customerName: customer.name,
        customerIdNumber: customer.ID_number,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        vehicleMake: vehicle.make,
        vehicleModel: vehicle.model,
        bookingDate,
        numberOfDays,
        endDate: addDays(bookingDate, numberOfDays),
        destination: randomElement(destinations),
        dailyRate,
        totalAmount,
        notes: randomElement(bookingNotes),
        status: i < 8 ? 'pending' : 'confirmed',
        createdBy: randomElement(drivers)._id
      });

      bookings.push(booking);
      if (i % 4 === 0) {
        console.log(`  ✓ Created future booking: ${customer.name} (${Math.ceil((bookingDate - today) / (1000 * 60 * 60 * 24))} days ahead)`);
      }
    }

    // 8 Past bookings (4 completed, 4 cancelled)
    for (let i = 0; i < 8; i++) {
      const customer = randomElement(customers);
      const vehicle = randomElement(vehicleData);
      const bookingDate = subtractDays(today, randomInt(7, 90));
      const numberOfDays = randomInt(2, 10);
      const dailyRate = vehicle.rate;
      const totalAmount = dailyRate * numberOfDays;
      const isCompleted = i < 4;

      const booking = await Booking.create({
        customerName: customer.name,
        customerIdNumber: customer.ID_number,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        vehicleMake: vehicle.make,
        vehicleModel: vehicle.model,
        bookingDate,
        numberOfDays,
        endDate: addDays(bookingDate, numberOfDays),
        destination: randomElement(destinations),
        dailyRate,
        totalAmount,
        notes: randomElement(bookingNotes),
        status: isCompleted ? 'completed' : 'cancelled',
        createdBy: randomElement(drivers)._id,
        cancelReason: !isCompleted ? 'Customer requested cancellation' : undefined,
        cancelledAt: !isCompleted ? bookingDate : undefined
      });

      bookings.push(booking);
    }

    console.log(`\n✅ Created ${bookings.length} bookings\n`);

    // ===========================================
    // STEP 7: CREATE TRANSACTIONS
    // ===========================================
    console.log('💰 STEP 7: CREATING TRANSACTIONS...\n');

    const transactions = [];
    const paymentMethods = ['Cash', 'M-Pesa', 'Bank Transfer'];
    const methodDistribution = [0.4, 0.5, 0.1]; // 40% Cash, 50% M-Pesa, 10% Bank

    function getPaymentMethod() {
      const rand = Math.random();
      if (rand < 0.4) return 'Cash';
      if (rand < 0.9) return 'M-Pesa';
      return 'Bank Transfer';
    }

    for (const rental of rentals) {
      const method = getPaymentMethod();
      
      // Create deposit transaction (50% of total)
      const depositAmount = Math.floor(rental.total_fee_gross * 0.5);
      const depositTransaction = await Transaction.create({
        type: 'C2B',
        amount: depositAmount,
        related_rental_ref: rental._id,
        related_vehicle_ref: rental.vehicle_ref,
        source_destination_ref: rental.customer_phone || '254712345678',
        date: rental.booking_date,
        status: 'Confirmed',
        account_reference: rental.rental_id,
        description: `Deposit for rental ${rental.rental_id}`,
        metadata: {
          payment_method: method,
          payment_type: 'Deposit'
        }
      });
      transactions.push(depositTransaction);

      // Create balance transaction for completed rentals
      if (rental.rental_status === 'Completed') {
        const balanceAmount = rental.total_fee_gross - depositAmount;
        const balanceTransaction = await Transaction.create({
          type: 'C2B',
          amount: balanceAmount,
          related_rental_ref: rental._id,
          related_vehicle_ref: rental.vehicle_ref,
          source_destination_ref: rental.customer_phone || '254712345678',
          date: rental.actual_end_date || rental.end_date,
          status: 'Confirmed',
          account_reference: rental.rental_id,
          description: `Balance payment for rental ${rental.rental_id}`,
          metadata: {
            payment_method: getPaymentMethod(),
            payment_type: 'Balance'
          }
        });
        transactions.push(balanceTransaction);
      }

      // Create extension transaction for extended rentals
      if (rental.is_extended && rental.extension_amount > 0) {
        const extensionTransaction = await Transaction.create({
          type: 'C2B',
          amount: rental.extension_amount,
          related_rental_ref: rental._id,
          related_vehicle_ref: rental.vehicle_ref,
          source_destination_ref: rental.customer_phone || '254712345678',
          date: addDays(rental.end_date, -rental.extension_days + 1),
          status: 'Confirmed',
          account_reference: rental.rental_id,
          description: `Extension payment (${rental.extension_days} days) for rental ${rental.rental_id}`,
          metadata: {
            payment_method: getPaymentMethod(),
            payment_type: 'Extension'
          }
        });
        transactions.push(extensionTransaction);
      }
    }

    console.log(`✅ Created ${transactions.length} transactions\n`);

    // ===========================================
    // SUMMARY
    // ===========================================
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ DATABASE RESEEDING COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📊 SUMMARY OF CREATED RECORDS:\n');
    console.log(`   👥 Users:              ${users.length}`);
    console.log(`      - Admins:           ${users.filter(u => u.role === 'Admin').length}`);
    console.log(`      - Drivers:          ${users.filter(u => u.role === 'Driver').length}`);
    console.log(`      - Director:         ${users.filter(u => u.role === 'Director').length}`);
    console.log(`\n   👤 Customers:          ${customers.length}`);
    console.log(`      - Returning:        ${customers.filter(c => c.is_returning_client).length}`);
    console.log(`\n   🚗 Vehicles:           ${vehicles.length}`);
    console.log(`      - Parking:          ${vehicles.filter(v => v.availability_status === 'Parking').length}`);
    console.log(`      - Rented Out:       ${vehicles.filter(v => v.availability_status === 'Rented Out').length}`);
    console.log(`      - In Garage:        ${vehicles.filter(v => v.availability_status === 'In Garage').length}`);
    console.log(`\n   📅 Rentals:            ${rentals.length}`);
    console.log(`      - Active:           ${rentals.filter(r => r.rental_status === 'Active').length}`);
    console.log(`      - Completed:        ${rentals.filter(r => r.rental_status === 'Completed').length}`);
    console.log(`      - Due Today:        ${rentals.filter(r => r.rental_status === 'Active' && r.end_date.toDateString() === today.toDateString()).length}`);
    console.log(`      - Overdue:          ${rentals.filter(r => r.rental_status === 'Active' && r.end_date < today).length}`);
    console.log(`      - With Extensions:  ${rentals.filter(r => r.is_extended).length}`);
    console.log(`\n   📋 Bookings:           ${bookings.length}`);
    console.log(`      - Today:            ${bookings.filter(b => b.bookingDate.toDateString() === today.toDateString()).length}`);
    console.log(`      - Tomorrow:         ${bookings.filter(b => b.bookingDate.toDateString() === tomorrow.toDateString()).length}`);
    console.log(`      - Future:           ${bookings.filter(b => b.bookingDate > tomorrow).length}`);
    console.log(`      - Past:             ${bookings.filter(b => b.bookingDate < today).length}`);
    console.log(`\n   💰 Transactions:       ${transactions.length}`);
    console.log(`      - Deposits:         ${transactions.filter(t => t.metadata?.payment_type === 'Deposit').length}`);
    console.log(`      - Balance:          ${transactions.filter(t => t.metadata?.payment_type === 'Balance').length}`);
    console.log(`      - Extensions:       ${transactions.filter(t => t.metadata?.payment_type === 'Extension').length}`);
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎯 SPECIAL TEST SCENARIOS INCLUDED:\n');
    console.log('   ✓ Customer with 5+ rental history (for returning client testing)');
    console.log('   ✓ Vehicles with complete service history (2-4 records each)');
    console.log('   ✓ Overdue rentals (2 rentals past due date)');
    console.log('   ✓ Rentals due TODAY (5 rentals for Returns Today testing)');
    console.log('   ✓ Rentals due TOMORROW (3 rentals for Vehicles Due testing)');
    console.log('   ✓ Bookings for TODAY (6 bookings for confirmation flow testing)');
    console.log('   ✓ Vehicles near service threshold (for service alerts testing)');
    console.log('   ✓ Extended rentals (2-3 rentals with extensions)');
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔐 LOGIN CREDENTIALS:\n');
    console.log('   Main Admin:');
    console.log('   Email:    admin@ressytours.com');
    console.log('   Password: admin123\n');
    console.log('   Driver (Dan Wesa):');
    console.log('   Email:    dan@ressytours.com');
    console.log('   Password: driver123\n');
    console.log('   Other Users:');
    console.log('   Password: password123');
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✨ You can now test all system functionality!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR DURING RESEEDING:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the seed script
reseedDatabase();


