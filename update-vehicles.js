const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Vehicle = require('./backend/models/Vehicle');

dotenv.config();

async function updateVehicles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ressey-tours-crms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Delete all existing vehicles
    const deleted = await Vehicle.deleteMany({});
    console.log(`🗑️  Deleted ${deleted.deletedCount} existing vehicles`);

    // Create the 2 new Toyota Prado vehicles
    const vehicles = [
      {
        make: 'Toyota',
        model: 'Prado',
        year: 2024,
        category: 'Executive',
        license_plate: 'KDV 608V',
        owner_type: 'Company Owned',
        daily_rate: 15000,
        availability_status: 'Parking',
        monthly_revenue_mtd: 0,
        current_servicing_cost_mtd: 0,
        last_odometer_reading: 15000,
        insurance_details: {
          policy_number: 'INS-KDV608V',
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          provider: 'Jubilee Insurance'
        },
        registration_details: {
          registration_number: 'KDV 608V',
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      },
      {
        make: 'Toyota',
        model: 'Prado',
        year: 2024,
        category: 'Executive',
        license_plate: 'KDH 404T',
        owner_type: 'Company Owned',
        daily_rate: 15000,
        availability_status: 'Parking',
        monthly_revenue_mtd: 0,
        current_servicing_cost_mtd: 0,
        last_odometer_reading: 12000,
        insurance_details: {
          policy_number: 'INS-KDH404T',
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          provider: 'Jubilee Insurance'
        },
        registration_details: {
          registration_number: 'KDH 404T',
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      }
    ];

    const created = await Vehicle.insertMany(vehicles);
    console.log(`✅ Created ${created.length} vehicles:`);
    created.forEach(v => {
      console.log(`   ${v.license_plate} - ${v.make} ${v.model} (${v.availability_status})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating vehicles:', error.message);
    process.exit(1);
  }
}

updateVehicles();









