const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Notification = require('../models/Notification');
const Booking = require('../models/Booking');
const Rental = require('../models/Rental');
const Vehicle = require('../models/Vehicle');

const addTestNotifications = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-rental-db');
    console.log('✅ Connected to MongoDB');

    // Find Dan Wesa (driver)
    const driver = await User.findOne({ email: 'dan@ressytours.com' });
    if (!driver) {
      console.error('❌ Driver not found');
      process.exit(1);
    }
    console.log(`✅ Found driver: ${driver.name}`);

    // Get some sample data for realistic notifications
    const sampleBooking = await Booking.findOne().limit(1);
    const sampleRental = await Rental.findOne().limit(1);
    const sampleVehicle = await Vehicle.findOne().limit(1);

    // Clear existing notifications for this driver
    await Notification.deleteMany({ recipient: driver._id });
    console.log('🗑️  Cleared existing notifications');

    // Create test notifications
    const notifications = [
      {
        type: 'booking_reminder',
        title: 'Booking Reminder: TODAY',
        message: 'John Kamau has a booking TODAY for Toyota Prado. Confirm with client.',
        relatedId: sampleBooking?._id,
        relatedModel: 'Booking',
        recipient: driver._id,
        priority: 'high',
        actionUrl: '/driver/bookings',
        actionButtons: [
          { label: 'Confirm Client', action: 'confirm_client' },
          { label: 'View Booking', action: 'view_booking' }
        ],
        isRead: false
      },
      {
        type: 'return_due',
        title: 'Return Due: TOMORROW',
        message: 'KCT 890T (Toyota Prado) is due for return TOMORROW. Customer: Mary Wanjiru.',
        relatedId: sampleRental?._id,
        relatedModel: 'Rental',
        recipient: driver._id,
        priority: 'high',
        actionUrl: '/driver/active-rentals',
        actionButtons: [
          { label: 'Process Return', action: 'process_return' }
        ],
        isRead: false
      },
      {
        type: 'mileage_check',
        title: 'Mileage Update Reminder',
        message: 'Please update the mileage for KCS 567S (Toyota Land Cruiser). Last updated: 2 weeks ago.',
        relatedId: sampleVehicle?._id,
        relatedModel: 'Vehicle',
        recipient: driver._id,
        priority: 'medium',
        actionUrl: '/driver/vehicles',
        actionButtons: [
          { label: 'Update Mileage', action: 'update_mileage' }
        ],
        isRead: false
      },
      {
        type: 'service_due',
        title: 'Vehicle Service Due!',
        message: 'KCR 234R (Toyota Rav4) needs service due to mileage. Current mileage: 95,000 km.',
        relatedId: sampleVehicle?._id,
        relatedModel: 'Vehicle',
        recipient: driver._id,
        priority: 'high',
        actionUrl: '/driver/vehicles',
        actionButtons: [
          { label: 'Mark Serviced', action: 'mark_serviced' },
          { label: 'Schedule Service', action: 'schedule_service' }
        ],
        isRead: false
      },
      {
        type: 'extension_request',
        title: 'Extension Request',
        message: 'Customer David Kariuki wants to extend rental for KCQ 901Q (Toyota Hilux) by 3 days.',
        relatedId: sampleRental?._id,
        relatedModel: 'Rental',
        recipient: driver._id,
        priority: 'medium',
        actionUrl: '/driver/active-rentals',
        actionButtons: [
          { label: 'Approve Extension', action: 'approve_extension' },
          { label: 'Contact Customer', action: 'contact_customer' }
        ],
        isRead: false
      },
      {
        type: 'booking_reminder',
        title: 'Booking Reminder: TOMORROW',
        message: 'Sarah Njeri has a booking TOMORROW for Nissan X-Trail. Confirm with client.',
        relatedId: sampleBooking?._id,
        relatedModel: 'Booking',
        recipient: driver._id,
        priority: 'medium',
        actionUrl: '/driver/bookings',
        actionButtons: [
          { label: 'Confirm Client', action: 'confirm_client' }
        ],
        isRead: false
      },
      // Add some read notifications
      {
        type: 'mileage_check',
        title: 'Mileage Updated Successfully',
        message: 'Mileage for KCP 678P (Toyota Premio) has been updated to 78,500 km.',
        relatedId: sampleVehicle?._id,
        relatedModel: 'Vehicle',
        recipient: driver._id,
        priority: 'low',
        actionUrl: '/driver/vehicles',
        isRead: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        type: 'return_due',
        title: 'Vehicle Returned',
        message: 'KCO 345O (Toyota Fielder) has been returned by customer James Ochieng.',
        relatedId: sampleRental?._id,
        relatedModel: 'Rental',
        recipient: driver._id,
        priority: 'low',
        actionUrl: '/driver/rentals',
        isRead: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      }
    ];

    // Insert notifications
    const createdNotifications = await Notification.insertMany(notifications);
    console.log(`✅ Created ${createdNotifications.length} test notifications`);

    // Display summary
    const unreadCount = await Notification.countDocuments({ recipient: driver._id, isRead: false });
    const readCount = await Notification.countDocuments({ recipient: driver._id, isRead: true });
    
    console.log('\n📊 Notification Summary:');
    console.log(`   - Total: ${createdNotifications.length}`);
    console.log(`   - Unread: ${unreadCount}`);
    console.log(`   - Read: ${readCount}`);
    console.log(`   - High Priority: ${notifications.filter(n => n.priority === 'high').length}`);
    console.log(`   - Medium Priority: ${notifications.filter(n => n.priority === 'medium').length}`);
    console.log(`   - Low Priority: ${notifications.filter(n => n.priority === 'low').length}`);

    console.log('\n✅ Test notifications added successfully!');
    console.log('🌐 Login at http://localhost:3001/login with:');
    console.log('   Email: dan@ressytours.com');
    console.log('   Password: driver123');
    console.log('   Then navigate to Notifications tab');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding test notifications:', error);
    process.exit(1);
  }
};

addTestNotifications();


