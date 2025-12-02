require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./backend/models/User');
const Vehicle = require('./backend/models/Vehicle');
const Customer = require('./backend/models/Customer');
const Rental = require('./backend/models/Rental');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ressey-tours-crms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected');

  try {
    // Create driver "dan"
    const existingDan = await User.findOne({ email: 'dan@ressytours.com' });
    if (existingDan) {
      console.log('Driver Dan already exists');
    } else {
      const dan = await User.create({
        name: 'Dan',
        email: 'dan@ressytours.com',
        phone_msisdn: '254712345678',
        role: 'Driver',
        password_hash: 'driver123', // Will be hashed by pre-save hook
        is_active: true
      });
      console.log('✓ Driver Dan created:', dan.email);
    }

    // Get or create Dan
    const dan = await User.findOne({ email: 'dan@ressytours.com' });

    // Create 2 Land Cruiser Prados if they don't exist
    const prado1Plate = 'KDV 608V';
    const prado2Plate = 'KDH 404T';

    let prado1 = await Vehicle.findOne({ license_plate: prado1Plate });
    if (!prado1) {
      prado1 = await Vehicle.create({
        make: 'Toyota',
        model: 'Land Cruiser Prado',
        year: 2020,
        license_plate: prado1Plate,
        category: 'Executive',
        owner_type: 'Company Owned',
        daily_rate: 15000,
        availability_status: 'Rented Out'
      });
      console.log('✓ Created Prado 1:', prado1.license_plate);
    }

    let prado2 = await Vehicle.findOne({ license_plate: prado2Plate });
    if (!prado2) {
      prado2 = await Vehicle.create({
        make: 'Toyota',
        model: 'Land Cruiser Prado',
        year: 2021,
        license_plate: prado2Plate,
        category: 'Executive',
        owner_type: 'Company Owned',
        daily_rate: 15000,
        availability_status: 'Rented Out'
      });
      console.log('✓ Created Prado 2:', prado2.license_plate);
    }

    // Create dummy customers
    const customer1 = await Customer.findOneAndUpdate(
      { ID_number: '12345678' },
      {
        name: 'John Kamau',
        ID_number: '12345678',
        phone: '254700000001',
        email: 'john.kamau@email.com'
      },
      { upsert: true, new: true }
    );

    const customer2 = await Customer.findOneAndUpdate(
      { ID_number: '87654321' },
      {
        name: 'Mary Wanjiku',
        ID_number: '87654321',
        phone: '254700000002',
        email: 'mary.wanjiku@email.com'
      },
      { upsert: true, new: true }
    );

    console.log('✓ Customers created/updated');

    // Create rental for Prado 1
    const startDate1 = new Date();
    startDate1.setDate(startDate1.getDate() - 5); // 5 days ago
    const endDate1 = new Date();
    endDate1.setDate(endDate1.getDate() + 2); // 2 days from now

    const rental1 = await Rental.findOneAndUpdate(
      { vehicle_ref: prado1._id, customer_ref: customer1._id },
      {
        vehicle_ref: prado1._id,
        customer_ref: customer1._id,
        driver_assigned: dan._id,
        start_date: startDate1,
        end_date: endDate1,
        duration_days: 7,
        destination: 'Nairobi to Mombasa',
        total_fee_gross: 105000,
        rental_status: 'Active',
        payment_status: 'Paid',
        hire_type: 'Direct Client'
      },
      { upsert: true, new: true }
    );

    console.log('✓ Created rental 1: Prado 1 to', customer1.name, '- KES 105,000');

    // Create rental for Prado 2 (completed)
    const startDate2 = new Date();
    startDate2.setDate(startDate2.getDate() - 15); // 15 days ago
    const endDate2 = new Date();
    endDate2.setDate(endDate2.getDate() - 8); // 8 days ago

    const rental2 = await Rental.findOneAndUpdate(
      { vehicle_ref: prado2._id, customer_ref: customer2._id },
      {
        vehicle_ref: prado2._id,
        customer_ref: customer2._id,
        driver_assigned: dan._id,
        start_date: startDate2,
        end_date: endDate2,
        actual_end_date: endDate2,
        duration_days: 7,
        destination: 'Nairobi to Kisumu',
        total_fee_gross: 105000,
        rental_status: 'Completed',
        payment_status: 'Paid',
        hire_type: 'Direct Client'
      },
      { upsert: true, new: true }
    );

    console.log('✓ Created rental 2: Prado 2 to', customer2.name, '- KES 105,000 (Completed)');

    // Update customer hire history
    await customer1.addRentalToHistory({
      rental_id: rental1._id,
      rental_date: startDate1,
      vehicle_model: 'Toyota Land Cruiser Prado',
      duration_days: 7,
      total_fee: 105000
    });

    await customer2.addRentalToHistory({
      rental_id: rental2._id,
      rental_date: startDate2,
      vehicle_model: 'Toyota Land Cruiser Prado',
      duration_days: 7,
      total_fee: 105000
    });

    console.log('\n✅ All data created successfully!');
    console.log('\nDriver Dan login:');
    console.log('  Email: dan@ressytours.com');
    console.log('  Password: driver123');
    console.log('\nVehicles:');
    console.log('  - Toyota Land Cruiser Prado - KDV 608V (Active rental)');
    console.log('  - Toyota Land Cruiser Prado - KDH 404T (Completed rental)');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});








