const cron = require('node-cron');
const Booking = require('../models/Booking');
const Rental = require('../models/Rental');
const Vehicle = require('../models/Vehicle');
const {
  createBookingReminder,
  createReturnDueNotification,
  createMileageCheckNotification,
  createServiceDueNotification,
  cleanupExpiredNotifications
} = require('../utils/notificationHelper');

// Helper: simple delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// JOB 1: Daily at 8:00 AM EAT - Check for bookings today and tomorrow
cron.schedule(
  '0 8 * * *',
  async () => {
    console.log('[Notification Cron] Checking for booking reminders...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // Find bookings for today
      const bookingsToday = await Booking.find({
        bookingDate: { $gte: today, $lt: tomorrow },
        status: { $in: ['pending', 'confirmed'] }
      });

      console.log(`[Notification Cron] Found ${bookingsToday.length} bookings for today`);

      for (const booking of bookingsToday) {
        await createBookingReminder(booking, 'today');
        await delay(100); // Small delay to avoid overwhelming the system
      }

      // Find bookings for tomorrow
      const bookingsTomorrow = await Booking.find({
        bookingDate: { $gte: tomorrow, $lt: dayAfterTomorrow },
        status: { $in: ['pending', 'confirmed'] }
      });

      console.log(`[Notification Cron] Found ${bookingsTomorrow.length} bookings for tomorrow`);

      for (const booking of bookingsTomorrow) {
        await createBookingReminder(booking, 'tomorrow');
        await delay(100);
      }

      console.log('[Notification Cron] ✅ Booking reminders processed');
    } catch (error) {
      console.error('[Notification Cron] ❌ Error processing booking reminders:', error);
    }
  },
  {
    timezone: 'Africa/Nairobi'
  }
);

// JOB 2: Daily at 7:00 AM EAT - Check for vehicles due for return today
cron.schedule(
  '0 7 * * *',
  async () => {
    console.log('[Notification Cron] Checking for vehicles due for return...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find rentals ending today
      const rentalsDueToday = await Rental.find({
        end_date: { $gte: today, $lt: tomorrow },
        rental_status: 'Active'
      })
        .populate('vehicle_ref', 'license_plate make model')
        .populate('customer_ref', 'name phone')
        .populate('driver_assigned', 'name');

      console.log(`[Notification Cron] Found ${rentalsDueToday.length} rentals due today`);

      for (const rental of rentalsDueToday) {
        await createReturnDueNotification(rental);
        await delay(100);
      }

      console.log('[Notification Cron] ✅ Return due notifications processed');
    } catch (error) {
      console.error('[Notification Cron] ❌ Error processing return due notifications:', error);
    }
  },
  {
    timezone: 'Africa/Nairobi'
  }
);

// JOB 3: Daily at 9:00 AM EAT - Check for extension requests (1 day before + on return date)
cron.schedule(
  '0 9 * * *',
  async () => {
    console.log('[Notification Cron] Checking for extension requests...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // Find rentals ending today or tomorrow
      const rentalsNeedingExtensionCheck = await Rental.find({
        end_date: { $gte: today, $lt: dayAfterTomorrow },
        rental_status: 'Active'
      })
        .populate('vehicle_ref', 'license_plate make model')
        .populate('customer_ref', 'name phone')
        .populate('driver_assigned', 'name');

      console.log(`[Notification Cron] Found ${rentalsNeedingExtensionCheck.length} rentals needing extension check`);

      const Notification = require('../models/Notification');
      const User = require('../models/User');

      for (const rental of rentalsNeedingExtensionCheck) {
        // Check if notification already exists for this rental
        const existingNotification = await Notification.findOne({
          type: 'extension_request',
          relatedId: rental._id,
          isRead: false
        });

        if (existingNotification) {
          console.log(`[Notification Cron] Extension request notification already exists for rental ${rental.rental_id}`);
          continue;
        }

        const returnDate = new Date(rental.end_date);
        const isToday = returnDate.toDateString() === today.toDateString();
        const isTomorrow = returnDate.toDateString() === tomorrow.toDateString();

        const timeLabel = isToday ? 'TODAY' : 'TOMORROW';
        const timeString = returnDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        // Create extension request notification
        await Notification.create({
          type: 'extension_request',
          title: 'Extension Check Required',
          message: `${rental.vehicle_ref?.license_plate || 'Vehicle'} rented by ${rental.customer_ref?.name || 'Customer'} is due back ${timeLabel} at ${timeString}. Check if client wants to extend.`,
          relatedId: rental._id,
          relatedModel: 'Rental',
          recipient: rental.driver_assigned?._id,
          priority: 'medium',
          actionUrl: '/driver?tab=active-rentals',
          actionButtons: [
            { label: 'No Extension', action: 'no_extension' },
            { label: 'Request Extension', action: 'request_extension' }
          ]
        });

        console.log(`[Notification Cron] Created extension request notification for rental ${rental.rental_id}`);
        await delay(100);
      }

      console.log('[Notification Cron] ✅ Extension request notifications processed');
    } catch (error) {
      console.error('[Notification Cron] ❌ Error processing extension requests:', error);
    }
  },
  {
    timezone: 'Africa/Nairobi'
  }
);

// JOB 4: Every 14 days at 9:00 AM EAT - Check for vehicles needing mileage updates
cron.schedule(
  '0 9 */14 * *',
  async () => {
    console.log('[Notification Cron] Checking for vehicles needing mileage updates...');

    try {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      // Find vehicles that haven't had mileage updated in 14 days
      const vehicles = await Vehicle.find({
        availability_status: { $in: ['Available', 'Rented'] },
        $or: [
          { 'maintenance.lastMileageUpdate': { $lt: fourteenDaysAgo } },
          { 'maintenance.lastMileageUpdate': { $exists: false } }
        ]
      });

      console.log(`[Notification Cron] Found ${vehicles.length} vehicles needing mileage update`);

      for (const vehicle of vehicles) {
        await createMileageCheckNotification(vehicle);
        await delay(100);
      }

      console.log('[Notification Cron] ✅ Mileage check notifications processed');
    } catch (error) {
      console.error('[Notification Cron] ❌ Error processing mileage check notifications:', error);
    }
  },
  {
    timezone: 'Africa/Nairobi'
  }
);

// JOB 5: Daily at 6:00 AM EAT - Check for vehicles due for service
cron.schedule(
  '0 6 * * *',
  async () => {
    console.log('[Notification Cron] Checking for vehicles due for service...');

    try {
      const vehicles = await Vehicle.find({
        availability_status: { $in: ['Available', 'Rented'] }
      });

      let serviceNotifications = 0;

      for (const vehicle of vehicles) {
        let needsService = false;
        let reason = '';

        // Check mileage-based service (every 5000 km)
        if (vehicle.maintenance?.currentMileage && vehicle.maintenance?.lastServiceMileage) {
          const mileageSinceService = vehicle.maintenance.currentMileage - vehicle.maintenance.lastServiceMileage;
          if (mileageSinceService >= 5000) {
            needsService = true;
            reason = 'mileage';
          }
        }

        // Check date-based service (every 3 months)
        if (!needsService && vehicle.maintenance?.lastServiceDate) {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          
          if (new Date(vehicle.maintenance.lastServiceDate) < threeMonthsAgo) {
            needsService = true;
            reason = 'date';
          }
        }

        if (needsService) {
          await createServiceDueNotification(vehicle, reason);
          serviceNotifications++;
          await delay(100);
        }
      }

      console.log(`[Notification Cron] ✅ Created ${serviceNotifications} service due notifications`);
    } catch (error) {
      console.error('[Notification Cron] ❌ Error processing service due notifications:', error);
    }
  },
  {
    timezone: 'Africa/Nairobi'
  }
);

// JOB 6: Daily at 2:00 AM EAT - Cleanup expired notifications
cron.schedule(
  '0 2 * * *',
  async () => {
    console.log('[Notification Cron] Cleaning up expired notifications...');

    try {
      const result = await cleanupExpiredNotifications();
      console.log(`[Notification Cron] ✅ Cleaned up ${result.deletedCount} expired notifications`);
    } catch (error) {
      console.error('[Notification Cron] ❌ Error cleaning up notifications:', error);
    }
  },
  {
    timezone: 'Africa/Nairobi'
  }
);

console.log('✅ Notification cron jobs initialized');
console.log('   - Booking reminders: Daily at 8:00 AM EAT');
console.log('   - Return due checks: Daily at 7:00 AM EAT');
console.log('   - Mileage checks: Every 14 days at 9:00 AM EAT');
console.log('   - Service due checks: Daily at 6:00 AM EAT');
console.log('   - Notification cleanup: Daily at 2:00 AM EAT');

