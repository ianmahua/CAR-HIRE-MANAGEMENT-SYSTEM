const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Notification Helper Utility
 * Provides functions to create different types of notifications
 */

/**
 * Create a booking reminder notification
 * @param {Object} booking - Booking document
 * @param {String} urgency - 'today' or 'tomorrow'
 */
async function createBookingReminder(booking, urgency = 'tomorrow') {
  try {
    // Find all drivers to notify
    const drivers = await User.find({ role: 'Driver', is_active: true });
    
    const notifications = drivers.map(driver => ({
      type: 'booking_reminder',
      title: `Booking ${urgency === 'today' ? 'Today' : 'Tomorrow'}`,
      message: `${booking.customerName} has a booking ${urgency === 'today' ? 'TODAY' : 'TOMORROW'} for ${booking.vehicleMake} ${booking.vehicleModel}`,
      relatedId: booking._id,
      relatedModel: 'Booking',
      recipient: driver._id,
      priority: urgency === 'today' ? 'high' : 'medium',
      actionUrl: `/driver/bookings`,
      actionButtons: [
        { label: 'View Booking', action: 'view_booking' },
        { label: 'Confirm Client', action: 'confirm_client' }
      ],
      expiresAt: new Date(booking.bookingDate.getTime() + 24 * 60 * 60 * 1000) // Expire after booking date
    }));

    await Notification.insertMany(notifications);
    return { success: true, count: notifications.length };
  } catch (error) {
    console.error('Error creating booking reminder:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a return due notification
 * @param {Object} rental - Rental document
 */
async function createReturnDueNotification(rental) {
  try {
    // Notify assigned driver or all drivers
    const recipients = rental.driver_assigned 
      ? [rental.driver_assigned]
      : await User.find({ role: 'Driver', is_active: true }).select('_id');

    const notifications = recipients.map(driver => ({
      type: 'return_due',
      title: 'Vehicle Return Due Today',
      message: `${rental.vehicle_ref?.license_plate || 'Vehicle'} should be returned today by ${rental.customer_ref?.name || 'customer'}`,
      relatedId: rental._id,
      relatedModel: 'Rental',
      recipient: driver._id || driver,
      priority: 'high',
      actionUrl: `/driver/vehicles-due`,
      actionButtons: [
        { label: 'Process Return', action: 'process_return' },
        { label: 'Request Extension', action: 'request_extension' }
      ],
      expiresAt: new Date(rental.end_date.getTime() + 24 * 60 * 60 * 1000)
    }));

    await Notification.insertMany(notifications);
    return { success: true, count: notifications.length };
  } catch (error) {
    console.error('Error creating return due notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create an extension request notification
 * @param {Object} rental - Rental document
 * @param {Number} additionalDays - Number of days to extend
 */
async function createExtensionRequestNotification(rental, additionalDays = 1) {
  try {
    const drivers = await User.find({ role: 'Driver', is_active: true });

    const notifications = drivers.map(driver => ({
      type: 'extension_request',
      title: 'Extension Request',
      message: `${rental.customer_ref?.name || 'Customer'} wants to extend rental for ${rental.vehicle_ref?.license_plate || 'vehicle'} by ${additionalDays} day(s)`,
      relatedId: rental._id,
      relatedModel: 'Rental',
      recipient: driver._id,
      priority: 'medium',
      actionUrl: `/driver/active-rentals`,
      actionButtons: [
        { label: 'Approve Extension', action: 'approve_extension' },
        { label: 'Decline', action: 'decline_extension' }
      ],
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // Expire in 48 hours
    }));

    await Notification.insertMany(notifications);
    return { success: true, count: notifications.length };
  } catch (error) {
    console.error('Error creating extension request notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a service due notification
 * @param {Object} vehicle - Vehicle document
 * @param {String} reason - 'mileage' or 'date'
 */
async function createServiceDueNotification(vehicle, reason = 'mileage') {
  try {
    const drivers = await User.find({ role: 'Driver', is_active: true });

    const reasonText = reason === 'mileage' 
      ? `has reached ${vehicle.maintenance?.currentMileage || 'service'} mileage`
      : 'is due for scheduled service';

    const notifications = drivers.map(driver => ({
      type: 'service_due',
      title: 'Vehicle Service Required',
      message: `${vehicle.license_plate} (${vehicle.make} ${vehicle.model}) ${reasonText}`,
      relatedId: vehicle._id,
      relatedModel: 'Vehicle',
      recipient: driver._id,
      priority: 'medium',
      actionUrl: `/driver/vehicles`,
      actionButtons: [
        { label: 'Schedule Service', action: 'schedule_service' },
        { label: 'Mark as Serviced', action: 'mark_serviced' }
      ],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expire in 30 days
    }));

    await Notification.insertMany(notifications);
    return { success: true, count: notifications.length };
  } catch (error) {
    console.error('Error creating service due notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a mileage check notification
 * @param {Object} vehicle - Vehicle document
 */
async function createMileageCheckNotification(vehicle) {
  try {
    const drivers = await User.find({ role: 'Driver', is_active: true });

    const lastUpdate = vehicle.maintenance?.lastMileageUpdate 
      ? new Date(vehicle.maintenance.lastMileageUpdate).toLocaleDateString()
      : 'Unknown';

    const notifications = drivers.map(driver => ({
      type: 'mileage_check',
      title: 'Mileage Update Needed',
      message: `Please update mileage for ${vehicle.license_plate} (${vehicle.make} ${vehicle.model}). Last updated: ${lastUpdate}`,
      relatedId: vehicle._id,
      relatedModel: 'Vehicle',
      recipient: driver._id,
      priority: 'low',
      actionUrl: `/driver/vehicles`,
      actionButtons: [
        { label: 'Update Mileage', action: 'update_mileage' }
      ],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expire in 7 days
    }));

    await Notification.insertMany(notifications);
    return { success: true, count: notifications.length };
  } catch (error) {
    console.error('Error creating mileage check notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a custom notification
 * @param {Object} data - Notification data
 */
async function createCustomNotification(data) {
  try {
    const notification = await Notification.createNotification(data);
    return { success: true, notification };
  } catch (error) {
    console.error('Error creating custom notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cleanup expired notifications
 */
async function cleanupExpiredNotifications() {
  try {
    const result = await Notification.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    console.log(`Cleaned up ${result.deletedCount} expired notifications`);
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  createBookingReminder,
  createReturnDueNotification,
  createExtensionRequestNotification,
  createServiceDueNotification,
  createMileageCheckNotification,
  createCustomNotification,
  cleanupExpiredNotifications
};


