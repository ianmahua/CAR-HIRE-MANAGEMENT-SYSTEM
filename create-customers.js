const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Customer = require('./backend/models/Customer');

dotenv.config();

const customerData = [
  {
    name: 'John Kamau',
    email: 'john.kamau@email.com',
    phone: '254712345001',
    ID_number: '12345678'
  },
  {
    name: 'Mary Wanjiku',
    email: 'mary.wanjiku@email.com',
    phone: '254712345002',
    ID_number: '12345679'
  },
  {
    name: 'Peter Ochieng',
    email: 'peter.ochieng@email.com',
    phone: '254712345003',
    ID_number: '12345680'
  },
  {
    name: 'Sarah Muthoni',
    email: 'sarah.muthoni@email.com',
    phone: '254712345004',
    ID_number: '12345681'
  },
  {
    name: 'David Kipchoge',
    email: 'david.kipchoge@email.com',
    phone: '254712345005',
    ID_number: '12345682'
  },
  {
    name: 'Grace Akinyi',
    email: 'grace.akinyi@email.com',
    phone: '254712345006',
    ID_number: '12345683'
  },
  {
    name: 'James Mutua',
    email: 'james.mutua@email.com',
    phone: '254712345007',
    ID_number: '12345684'
  },
  {
    name: 'Lucy Njeri',
    email: 'lucy.njeri@email.com',
    phone: '254712345008',
    ID_number: '12345685'
  },
  {
    name: 'Michael Otieno',
    email: 'michael.otieno@email.com',
    phone: '254712345009',
    ID_number: '12345686'
  },
  {
    name: 'Esther Wambui',
    email: 'esther.wambui@email.com',
    phone: '254712345010',
    ID_number: '12345687'
  },
  {
    name: 'Robert Mwangi',
    email: 'robert.mwangi@email.com',
    phone: '254712345011',
    ID_number: '12345688'
  },
  {
    name: 'Catherine Nyambura',
    email: 'catherine.nyambura@email.com',
    phone: '254712345012',
    ID_number: '12345689'
  },
  {
    name: 'Daniel Kariuki',
    email: 'daniel.kariuki@email.com',
    phone: '254712345013',
    ID_number: '12345690'
  },
  {
    name: 'Ruth Chebet',
    email: 'ruth.chebet@email.com',
    phone: '254712345014',
    ID_number: '12345691'
  },
  {
    name: 'Simon Njoroge',
    email: 'simon.njoroge@email.com',
    phone: '254712345015',
    ID_number: '12345692'
  }
];

async function createCustomers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ressey-tours-crms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Delete existing customers
    const existingCount = await Customer.countDocuments();
    if (existingCount > 0) {
      await Customer.deleteMany({});
      console.log(`🗑️  Deleted ${existingCount} existing customers`);
    }

    const created = await Customer.insertMany(customerData);
    console.log(`✅ Created ${created.length} customers`);
    console.log('\n📋 Sample customers:');
    created.slice(0, 5).forEach(c => {
      console.log(`   ${c.name} - ${c.phone} - ${c.email}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating customers:', error.message);
    process.exit(1);
  }
}

createCustomers();

