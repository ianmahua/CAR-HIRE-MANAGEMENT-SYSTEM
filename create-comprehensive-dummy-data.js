const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./backend/models/User');
const Vehicle = require('./backend/models/Vehicle');
const VehicleOwner = require('./backend/models/VehicleOwner');
const Customer = require('./backend/models/Customer');
const Rental = require('./backend/models/Rental');
const DriverPayment = require('./backend/models/DriverPayment');
const VehicleOwnerPayment = require('./backend/models/VehicleOwnerPayment');
const STKPushLog = require('./backend/models/STKPushLog');
const Reminder = require('./backend/models/Reminder');
const MessageLog = require('./backend/models/MessageLog');

const connectDB = async () => {
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
};

const kenyanNames = [
  'James Kamau', 'Mary Wanjiku', 'Peter Kipchoge', 'Grace Akinyi', 'David Ochieng',
  'Sarah Muthoni', 'John Mwangi', 'Esther Njeri', 'Michael Otieno', 'Lucy Achieng',
  'Robert Kariuki', 'Jane Wambui', 'Daniel Kimani', 'Ruth Nyambura', 'Paul Njoroge',
  'Hannah Chebet', 'Samuel Kiprotich', 'Faith Chepngetich', 'Joseph Kipruto', 'Mercy Chelangat'
];

const kenyanPlates = [
  'KCA 123A', 'KCB 456B', 'KCC 789C', 'KCD 012D', 'KCE 345E',
  'KCF 678F', 'KCG 901G', 'KCH 234H', 'KCI 567I', 'KCJ 890J',
  'KCK 123K', 'KCL 456L', 'KCM 789M', 'KCN 012N', 'KCO 345O',
  'KCP 678P', 'KCQ 901Q', 'KCR 234R', 'KCS 567S', 'KCT 890T'
];

const vehicleMakes = ['Toyota', 'Nissan', 'Mazda', 'Subaru', 'Mitsubishi', 'Honda', 'Isuzu'];
const vehicleModels = {
  'Toyota': ['Prado', 'Land Cruiser', 'Rav4', 'Hilux', 'Corolla', 'Camry', 'Vitz'],
  'Nissan': ['X-Trail', 'Patrol', 'Navara', 'Note', 'Almera'],
  'Mazda': ['CX-5', 'Demio', 'Axela', 'BT-50'],
  'Subaru': ['Forester', 'Outback', 'Impreza'],
  'Mitsubishi': ['Pajero', 'L200', 'Outlander'],
  'Honda': ['CR-V', 'Civic', 'Accord'],
  'Isuzu': ['D-Max', 'MU-X']
};

const destinations = [
  'Nairobi to Mombasa', 'Nairobi to Kisumu', 'Nairobi to Nakuru',
  'Mombasa to Malindi', 'Nairobi to Eldoret', 'Nairobi to Thika',
  'Nairobi to Naivasha', 'Mombasa to Diani', 'Nairobi to Nyeri',
  'Nairobi to Meru', 'Nairobi to Kitale', 'Mombasa to Lamu'
];

async function createDummyData() {
  try {
    await connectDB();

    console.log('🗑️  Clearing existing data...');
    await VehicleOwner.deleteMany({});
    await Vehicle.deleteMany({});
    await Customer.deleteMany({});
    await Rental.deleteMany({});
    await DriverPayment.deleteMany({});
    await VehicleOwnerPayment.deleteMany({});
    await STKPushLog.deleteMany({});
    await Reminder.deleteMany({});
    await MessageLog.deleteMany({});

    // Get existing users (drivers)
    const drivers = await User.find({ role: 'Driver' });
    const admin = await User.findOne({ role: 'Admin' });

    console.log('👥 Creating Vehicle Owners...');
    const owners = [];
    for (let i = 0; i < 5; i++) {
      const owner = await VehicleOwner.create({
        name: kenyanNames[i * 2],
        contact_details: {
          phone: `25471234567${i}`,
          email: `owner${i + 1}@example.com`,
          address: `Nairobi, Kenya`
        },
        payout_rate: {
          type: i % 2 === 0 ? 'percentage' : 'fixed',
          value: i % 2 === 0 ? 70 : 50000
        },
        payout_due_day: (i + 1) * 5,
        contract_status: 'Active',
        total_earnings: Math.floor(Math.random() * 500000) + 100000
      });
      owners.push(owner);
      console.log(`  ✓ Created owner: ${owner.name}`);
    }

    console.log('🚗 Creating Vehicles...');
    const vehicles = [];
    for (let i = 0; i < 20; i++) {
      const make = vehicleMakes[Math.floor(Math.random() * vehicleMakes.length)];
      const model = vehicleModels[make][Math.floor(Math.random() * vehicleModels[make].length)];
      const isLeased = i < 8; // First 8 vehicles are leased
      const owner = isLeased ? owners[Math.floor(Math.random() * owners.length)] : null;

      const vehicle = await Vehicle.create({
        make,
        model,
        year: 2018 + Math.floor(Math.random() * 6),
        category: i % 3 === 0 ? 'Executive' : 'Economy',
        license_plate: kenyanPlates[i] || `KC${String(i).padStart(3, '0')}X`,
        owner_type: isLeased ? 'Leased' : 'Company Owned',
        owner_ref: owner ? owner._id : undefined,
        daily_rate: i % 3 === 0 ? 15000 : 8000 + Math.floor(Math.random() * 4000),
        availability_status: i < 5 ? 'Rented Out' : i < 10 ? 'Parking' : i < 15 ? 'Parking' : 'In Garage',
        monthly_revenue_mtd: Math.floor(Math.random() * 200000) + 50000,
        current_servicing_cost_mtd: Math.floor(Math.random() * 50000),
        last_odometer_reading: Math.floor(Math.random() * 100000) + 50000
      });

      if (owner) {
        owner.linked_vehicles.push(vehicle._id);
        await owner.save();
      }

      vehicles.push(vehicle);
      console.log(`  ✓ Created vehicle: ${make} ${model} - ${vehicle.license_plate}`);
    }

    console.log('👤 Creating Customers...');
    const customers = [];
    for (let i = 0; i < 25; i++) {
      const customer = await Customer.create({
        name: kenyanNames[i % kenyanNames.length] + (i >= kenyanNames.length ? ` ${Math.floor(i / kenyanNames.length) + 1}` : ''),
        ID_number: `1234567${String(i).padStart(2, '0')}`,
        phone: `2547123456${String(i).padStart(2, '0')}`,
        email: `customer${i + 1}@example.com`,
        is_returning_client: i < 10,
        loyalty_points: i < 10 ? Math.floor(Math.random() * 500) + 100 : 0
      });
      customers.push(customer);
    }
    console.log(`  ✓ Created ${customers.length} customers`);

    console.log('📅 Creating Rentals...');
    const rentals = [];
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const driver = drivers.length > 0 ? drivers[Math.floor(Math.random() * drivers.length)] : null;
      
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 60));
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 14) + 1);
      
      const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const totalFee = vehicle.daily_rate * durationDays;

      const rental = await Rental.create({
        vehicle_ref: vehicle._id,
        customer_ref: customer._id,
        driver_assigned: driver ? driver._id : undefined,
        start_date: startDate,
        end_date: endDate,
        duration_days: durationDays,
        destination: destinations[Math.floor(Math.random() * destinations.length)],
        total_fee_gross: totalFee,
        hire_type: i % 3 === 0 ? 'Direct Client' : i % 3 === 1 ? 'Broker Handoff' : 'External Brokerage Rental',
        payment_status: i < 20 ? 'Paid' : i < 25 ? 'Partial' : 'Awaiting',
        rental_status: i < 15 ? 'Completed' : i < 25 ? 'Active' : 'Pending'
      });

      // Update customer history
      customer.hire_history.push({
        rental_id: rental._id,
        rental_date: rental.booking_date,
        vehicle_model: `${vehicle.make} ${vehicle.model}`,
        duration_days: durationDays,
        total_fee: totalFee
      });
      await customer.save();

      rentals.push(rental);
    }
    console.log(`  ✓ Created ${rentals.length} rentals`);

    console.log('💰 Creating Driver Payments...');
    for (let i = 0; i < 15; i++) {
      const driver = drivers[Math.floor(Math.random() * drivers.length)];
      if (!driver) continue;
      
      const paymentDate = new Date(now);
      paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 30));

      await DriverPayment.create({
        driver_ref: driver._id,
        amount: Math.floor(Math.random() * 50000) + 10000,
        payment_date: paymentDate,
        payment_status: i < 12 ? 'Paid' : 'Pending',
        description: `Payment for rental services - ${paymentDate.toLocaleDateString()}`,
        payment_method: 'M-Pesa'
      });
    }
    console.log('  ✓ Created driver payments');

    console.log('💵 Creating Vehicle Owner Payments...');
    for (let i = 0; i < 20; i++) {
      const owner = owners[Math.floor(Math.random() * owners.length)];
      const vehicle = vehicles.find(v => v.owner_ref && v.owner_ref.toString() === owner._id.toString());
      if (!vehicle) continue;

      const dueDate = new Date(now);
      dueDate.setDate(owner.payout_due_day);
      if (dueDate < now) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      await VehicleOwnerPayment.create({
        owner_ref: owner._id,
        vehicle_ref: vehicle._id,
        amount_due: Math.floor(Math.random() * 100000) + 30000,
        due_date: dueDate,
        payment_status: i < 15 ? 'Paid' : 'Not Paid',
        payment_date: i < 15 ? new Date(dueDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        description: `Monthly payout for ${vehicle.make} ${vehicle.model} - ${vehicle.license_plate}`
      });
    }
    console.log('  ✓ Created vehicle owner payments');

    console.log('📱 Creating STK Push Logs...');
    for (let i = 0; i < 20; i++) {
      const rental = rentals[Math.floor(Math.random() * rentals.length)];
      const customer = await Customer.findById(rental.customer_ref);
      if (!customer) continue;

      await STKPushLog.create({
        customer_ref: customer._id,
        rental_ref: rental._id,
        vehicle_ref: rental.vehicle_ref,
        driver_ref: rental.driver_assigned || null,
        amount: Math.floor(Math.random() * 50000) + 10000,
        phone_number: customer.phone,
        status: i < 15 ? 'Success' : 'Failed',
        mpesa_response: i < 15 ? { ResponseCode: '0', ResponseDescription: 'Success' } : { ResponseCode: '1', ResponseDescription: 'Failed' },
        created_at: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
    }
    console.log('  ✓ Created STK push logs');

    console.log('🔔 Creating Reminders...');
    for (let i = 0; i < 10; i++) {
      const rental = rentals[Math.floor(Math.random() * rentals.length)];
      const customer = await Customer.findById(rental.customer_ref);
      if (!customer) continue;

      await Reminder.create({
        rental_ref: rental._id,
        customer_ref: customer._id,
        reminder_type: 'Return Date',
        reminder_date: new Date(rental.end_date.getTime() - 24 * 60 * 60 * 1000),
        message: `Reminder: Your vehicle rental ends tomorrow. Please return the vehicle on ${rental.end_date.toLocaleDateString()}.`,
        status: i < 7 ? 'Sent' : 'Pending',
        sent_at: i < 7 ? new Date(rental.end_date.getTime() - 24 * 60 * 60 * 1000) : null,
        delivery_method: ['Email', 'WhatsApp', 'SMS'][Math.floor(Math.random() * 3)]
      });
    }
    console.log('  ✓ Created reminders');

    console.log('📧 Creating Message Logs...');
    for (let i = 0; i < 15; i++) {
      const rental = rentals[Math.floor(Math.random() * rentals.length)];
      const customer = await Customer.findById(rental.customer_ref);
      if (!customer) continue;

      await MessageLog.create({
        recipient_type: 'Customer',
        recipient_id: customer._id,
        recipient_contact: customer.phone,
        message_type: ['Email', 'WhatsApp', 'SMS'][Math.floor(Math.random() * 3)],
        subject: ['Rental Agreement', 'Contract Renewal', 'Terms & Conditions'][Math.floor(Math.random() * 3)],
        message_body: `This is a ${['rental agreement', 'contract renewal', 'terms & conditions'][Math.floor(Math.random() * 3)]} message.`,
        status: i < 12 ? 'Sent' : 'Failed',
        sent_at: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        related_rental_ref: rental._id
      });
    }
    console.log('  ✓ Created message logs');

    console.log('\n✅ Dummy data creation completed!');
    console.log(`   - ${owners.length} Vehicle Owners`);
    console.log(`   - ${vehicles.length} Vehicles`);
    console.log(`   - ${customers.length} Customers`);
    console.log(`   - ${rentals.length} Rentals`);
    console.log(`   - Driver Payments`);
    console.log(`   - Owner Payments`);
    console.log(`   - STK Push Logs`);
    console.log(`   - Reminders`);
    console.log(`   - Message Logs`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating dummy data:', error);
    process.exit(1);
  }
}

createDummyData();

