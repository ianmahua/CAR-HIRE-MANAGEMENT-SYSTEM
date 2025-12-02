const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Vehicle = require('./backend/models/Vehicle');

dotenv.config();

// Kenyan license plate formats: KCA 123A, KCB 456B, KCD 789C, etc.
const kenyanPlates = [
  'KCA 123A', 'KCA 456B', 'KCA 789C', 'KCA 234D', 'KCA 567E',
  'KCB 111F', 'KCB 222G', 'KCB 333H', 'KCB 444J', 'KCB 555K',
  'KCD 666L', 'KCD 777M', 'KCD 888N', 'KCD 999P', 'KCD 101Q',
  'KCE 202R', 'KCE 303S', 'KCE 404T', 'KCE 505U', 'KCE 606V',
  'KCF 707W', 'KCF 808X', 'KCF 909Y', 'KCF 110Z', 'KCF 220A',
  'KCG 330B', 'KCG 440C', 'KCG 550D', 'KCG 660E', 'KCG 770F'
];

const vehicleData = [
  { make: 'Toyota', model: 'Land Cruiser Prado', year: 2024, category: 'Executive', daily_rate: 15000 },
  { make: 'Toyota', model: 'RAV4', year: 2024, category: 'Executive', daily_rate: 12000 },
  { make: 'Toyota', model: 'Hilux Double Cab', year: 2024, category: 'Executive', daily_rate: 10000 },
  { make: 'Toyota', model: 'Corolla Cross', year: 2024, category: 'Economy', daily_rate: 8000 },
  { make: 'Toyota', model: 'Axio', year: 2024, category: 'Economy', daily_rate: 6000 },
  { make: 'Nissan', model: 'X-Trail', year: 2024, category: 'Executive', daily_rate: 11000 },
  { make: 'Nissan', model: 'Note', year: 2024, category: 'Economy', daily_rate: 5500 },
  { make: 'Mazda', model: 'CX-5', year: 2024, category: 'Executive', daily_rate: 10000 },
  { make: 'Mazda', model: 'Demio', year: 2024, category: 'Economy', daily_rate: 5000 },
  { make: 'Subaru', model: 'Forester', year: 2024, category: 'Executive', daily_rate: 9500 },
  { make: 'Subaru', model: 'Impreza', year: 2024, category: 'Economy', daily_rate: 7000 },
  { make: 'Mitsubishi', model: 'Outlander', year: 2024, category: 'Executive', daily_rate: 9000 },
  { make: 'Mitsubishi', model: 'Lancer', year: 2024, category: 'Economy', daily_rate: 6500 },
  { make: 'Honda', model: 'CR-V', year: 2024, category: 'Executive', daily_rate: 10500 },
  { make: 'Honda', model: 'Fit', year: 2024, category: 'Economy', daily_rate: 5800 },
  { make: 'Toyota', model: 'Vitz', year: 2024, category: 'Economy', daily_rate: 4500 },
  { make: 'Toyota', model: 'Passo', year: 2024, category: 'Economy', daily_rate: 4000 },
  { make: 'Toyota', model: 'Fielder', year: 2024, category: 'Economy', daily_rate: 5200 },
  { make: 'Nissan', model: 'Almera', year: 2024, category: 'Economy', daily_rate: 4800 },
  { make: 'Nissan', model: 'March', year: 2024, category: 'Economy', daily_rate: 4200 },
  { make: 'Toyota', model: 'Premio', year: 2024, category: 'Executive', daily_rate: 8500 },
  { make: 'Toyota', model: 'Allion', year: 2024, category: 'Executive', daily_rate: 9000 },
  { make: 'Toyota', model: 'Harrier', year: 2024, category: 'Executive', daily_rate: 13000 },
  { make: 'Toyota', model: 'Noah', year: 2024, category: 'Executive', daily_rate: 11000 },
  { make: 'Toyota', model: 'Voxy', year: 2024, category: 'Executive', daily_rate: 11500 },
  { make: 'Nissan', model: 'Teana', year: 2024, category: 'Executive', daily_rate: 9500 },
  { make: 'Nissan', model: 'Serena', year: 2024, category: 'Executive', daily_rate: 10000 },
  { make: 'Mazda', model: 'Atenza', year: 2024, category: 'Executive', daily_rate: 8800 },
  { make: 'Subaru', model: 'Legacy', year: 2024, category: 'Executive', daily_rate: 9200 },
  { make: 'Honda', model: 'Accord', year: 2024, category: 'Executive', daily_rate: 9800 }
];

async function createDummyVehicles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ressey-tours-crms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing vehicles
    const existingCount = await Vehicle.countDocuments();
    if (existingCount > 0) {
      await Vehicle.deleteMany({});
      console.log(`🗑️  Deleted ${existingCount} existing vehicles`);
    }

    // Create vehicles with Kenyan plates
    const vehicles = [];
    for (let i = 0; i < Math.min(vehicleData.length, kenyanPlates.length); i++) {
      const vehicle = {
        ...vehicleData[i],
        license_plate: kenyanPlates[i],
        owner_type: 'Company Owned',
        availability_status: i % 4 === 0 ? 'Rented' : i % 4 === 1 ? 'Servicing' : 'In-Fleet',
        monthly_revenue_mtd: Math.floor(Math.random() * 200000) + 50000,
        current_servicing_cost_mtd: Math.floor(Math.random() * 50000) + 10000,
        last_odometer_reading: Math.floor(Math.random() * 50000) + 10000,
        insurance_details: {
          policy_number: `INS-${kenyanPlates[i].replace(/\s/g, '')}`,
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          provider: 'Jubilee Insurance'
        },
        registration_details: {
          registration_number: kenyanPlates[i],
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      };
      vehicles.push(vehicle);
    }

    const created = await Vehicle.insertMany(vehicles);
    console.log(`✅ Created ${created.length} vehicles with Kenyan license plates`);
    console.log('\n📋 Sample vehicles:');
    created.slice(0, 5).forEach(v => {
      console.log(`   ${v.license_plate} - ${v.make} ${v.model} (${v.category}) - KES ${v.daily_rate}/day`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating dummy vehicles:', error.message);
    process.exit(1);
  }
}

createDummyVehicles();









