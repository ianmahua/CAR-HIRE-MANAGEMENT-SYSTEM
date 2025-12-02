const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Important: register all models used in population before queries
const Vehicle = require('../models/Vehicle');
const Customer = require('../models/Customer');
const Rental = require('../models/Rental');
const EmailSender = require('../utils/emailSender');

async function main() {
  console.log('============================================================');
  console.log('🧪 TESTING MANUAL EMAIL SENDING (return_reminder_24h)');
  console.log('============================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ressey-tours-crms';

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected\n');
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  try {
    console.log('🔍 Finding a recent active rental with customer email...');

    // Prefer an active rental with an email, otherwise fall back to most recent
    let rental = await Rental.findOne({
      rental_status: 'Active',
      $or: [
        { customer_email: { $exists: true, $ne: '' } },
        { 'customer_ref.email': { $exists: true, $ne: '' } }
      ]
    })
      .populate('vehicle_ref')
      .populate('customer_ref')
      .sort({ booking_date: -1 });

    if (!rental) {
      console.log('No active rental with email found. Falling back to most recent rental...');
      rental = await Rental.findOne({})
        .populate('vehicle_ref')
        .populate('customer_ref')
        .sort({ booking_date: -1 });
    }

    if (!rental) {
      console.error('❌ No rentals found in the database. Cannot test email sending.');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Ensure flat customer fields on rental
    if (!rental.customer_name && rental.customer_ref) {
      rental.customer_name = rental.customer_ref.name;
    }
    if (!rental.customer_email && rental.customer_ref) {
      rental.customer_email = rental.customer_ref.email;
    }
    if (!rental.customer_phone && rental.customer_ref) {
      rental.customer_phone = rental.customer_ref.phone;
    }

    const vehicle = rental.vehicle_ref || {};

    console.log(`Testing email with rental: ${rental.rental_id || rental._id}`);
    console.log(
      `Customer: ${rental.customer_name || rental.customer_ref?.name || 'Unknown'} (${rental.customer_email ||
        rental.customer_ref?.email ||
        'no-email'})`
    );
    console.log(
      `Vehicle: ${vehicle.make || ''} ${vehicle.model || ''} - ${vehicle.license_plate || 'No Reg'}`
    );
    console.log(
      `Return Date: ${rental.end_date ? new Date(rental.end_date).toISOString() : 'N/A'}\n`
    );

    const emailSender = new EmailSender();

    console.log('📧 Sending 24-hour return reminder (simulating manual endpoint)...');
    const result = await emailSender.sendReturnReminder24Hours(rental);

    if (result && result.success) {
      console.log('✅ Email sent successfully!');
      if (result.messageId) {
        console.log(`Message ID: ${result.messageId}`);
      }
    } else {
      console.error('❌ Email sending reported failure:', result?.error || 'Unknown error');
    }
  } catch (err) {
    console.error('❌ Error during testEmail script:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB connection closed.');
    console.log('✅ Test script finished.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Unexpected error in testEmail.js:', err);
  process.exit(1);
});


