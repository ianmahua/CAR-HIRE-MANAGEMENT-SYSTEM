const cron = require('node-cron');
const Rental = require('../models/Rental');
const Booking = require('../models/Booking');
const EmailLog = require('../models/EmailLog');
const EmailSender = require('../utils/emailSender');
const { sendBookingReminderEmail } = require('../services/emailService');

const emailSender = new EmailSender();

// Helper: simple delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// JOB 1: Daily at 8:00 AM EAT - 24-hour return reminders
cron.schedule(
  '0 8 * * *',
  async () => {
    console.log('[Cron] Running 24-hour return reminder job...');

    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);

      // Find active rentals ending tomorrow
      const rentals = await Rental.find({
        end_date: { $gte: tomorrow, $lte: tomorrowEnd },
        rental_status: { $in: ['Active'] }
      })
        .populate('vehicle_ref')
        .populate('customer_ref');

      console.log(`[Cron] Found ${rentals.length} rentals ending tomorrow`);

      const batchSize = 20;
      for (let i = 0; i < rentals.length; i += batchSize) {
        const batch = rentals.slice(i, i + batchSize);

        for (const rental of batch) {
          try {
            // Skip if no customer email on rental
            if (!rental.customer_email && !rental.customer_ref?.email) {
              console.log(
                `[Cron] Skipping rental ${rental.rental_id} - no customer email on record`
              );
              continue;
            }

            // Check if email already sent
            const existingLog = await EmailLog.findOne({
              rental_id: rental._id,
              email_type: 'return_reminder_24h',
              status: 'sent'
            });

            if (existingLog) {
              console.log(
                `[Cron] Skipping rental ${rental.rental_id} - 24h reminder already sent`
              );
              continue;
            }

            // Ensure rental has flat customer_* fields for emailSender
            if (!rental.customer_name && rental.customer_ref) {
              rental.customer_name = rental.customer_ref.name;
              rental.customer_email = rental.customer_ref.email;
              rental.customer_phone = rental.customer_ref.phone;
            }

            const result = await emailSender.sendReturnReminder24Hours(rental);

            if (result?.success) {
              console.log(
                `[Cron] ✅ Sent 24h reminder to ${rental.customer_email || rental.customer_ref?.email}`
              );
            } else {
              console.warn(
                `[Cron] ⚠️ 24h reminder send result not successful for rental ${rental.rental_id}`,
                result?.error || result
              );
            }
          } catch (error) {
            console.error(
              `[Cron] ❌ Failed 24h reminder for rental ${rental.rental_id}:`,
              error.message
            );
          }
        }

        if (i + batchSize < rentals.length) {
          await delay(1000);
        }
      }

      console.log('[Cron] ✅ 24-hour reminder job completed');
    } catch (error) {
      console.error('[Cron] ❌ Error in 24-hour reminder job:', error);
    }
  },
  {
    timezone: 'Africa/Nairobi'
  }
);

// JOB 2: Daily at 8:00 AM EAT - Morning return reminders
cron.schedule(
  '0 8 * * *',
  async () => {
    console.log('[Cron] Running morning return reminder job...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      // Find active rentals ending today
      const rentals = await Rental.find({
        end_date: { $gte: today, $lte: todayEnd },
        rental_status: { $in: ['Active'] }
      })
        .populate('vehicle_ref')
        .populate('customer_ref');

      console.log(`[Cron] Found ${rentals.length} rentals ending today`);

      const batchSize = 20;
      for (let i = 0; i < rentals.length; i += batchSize) {
        const batch = rentals.slice(i, i + batchSize);

        for (const rental of batch) {
          try {
            if (!rental.customer_email && !rental.customer_ref?.email) {
              console.log(
                `[Cron] Skipping rental ${rental.rental_id} - no customer email on record`
              );
              continue;
            }

            // Check if email already sent
            const existingLog = await EmailLog.findOne({
              rental_id: rental._id,
              email_type: 'return_reminder_morning',
              status: 'sent'
            });

            if (existingLog) {
              console.log(
                `[Cron] Skipping rental ${rental.rental_id} - morning reminder already sent`
              );
              continue;
            }

            // Ensure rental has flat customer_* fields for emailSender
            if (!rental.customer_name && rental.customer_ref) {
              rental.customer_name = rental.customer_ref.name;
              rental.customer_email = rental.customer_ref.email;
              rental.customer_phone = rental.customer_ref.phone;
            }

            const result = await emailSender.sendReturnReminderMorning(rental);

            if (result?.success) {
              console.log(
                `[Cron] ✅ Sent morning reminder to ${rental.customer_email || rental.customer_ref?.email}`
              );
            } else {
              console.warn(
                `[Cron] ⚠️ Morning reminder send result not successful for rental ${rental.rental_id}`,
                result?.error || result
              );
            }
          } catch (error) {
            console.error(
              `[Cron] ❌ Failed morning reminder for rental ${rental.rental_id}:`,
              error.message
            );
          }
        }

        if (i + batchSize < rentals.length) {
          await delay(1000);
        }
      }

      console.log('[Cron] ✅ Morning reminder job completed');
    } catch (error) {
      console.error('[Cron] ❌ Error in morning reminder job:', error);
    }
  },
  {
    timezone: 'Africa/Nairobi'
  }
);

// JOB 3: Daily at 9:00 AM EAT - Booking reminders
cron.schedule(
  '0 9 * * *',
  async () => {
    console.log('[Cron] Running booking reminder job...');

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const endOfTomorrow = new Date(tomorrow);
      endOfTomorrow.setHours(23, 59, 59, 999);

      // Find bookings for tomorrow with status 'pending'
      const bookings = await Booking.find({
        bookingDate: { $gte: tomorrow, $lte: endOfTomorrow },
        status: 'pending'
      });

      console.log(`[Cron] Found ${bookings.length} bookings for tomorrow`);

      for (const booking of bookings) {
        try {
          if (!booking.customerEmail) {
            console.log(`[Cron] Skipping booking ${booking._id} - no customer email`);
            continue;
          }

          const result = await sendBookingReminderEmail(booking);

          if (result?.sent) {
            console.log(`[Cron] ✅ Sent booking reminder to ${booking.customerEmail}`);
          } else {
            console.warn(`[Cron] ⚠️ Failed to send booking reminder for booking ${booking._id}`, result?.error);
          }
        } catch (error) {
          console.error(`[Cron] ❌ Error sending booking reminder for booking ${booking._id}:`, error.message);
        }
      }

      console.log('[Cron] ✅ Booking reminder job completed');
    } catch (error) {
      console.error('[Cron] ❌ Error in booking reminder job:', error);
    }
  },
  {
    timezone: 'Africa/Nairobi'
  }
);

console.log('✅ Email reminder cron jobs initialized');
console.log('   - 24-hour reminders: Daily at 8:00 AM EAT');
console.log('   - Morning reminders: Daily at 8:00 AM EAT');
console.log('   - Booking reminders: Daily at 9:00 AM EAT');



