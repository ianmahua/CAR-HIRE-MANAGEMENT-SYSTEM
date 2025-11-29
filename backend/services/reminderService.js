const Reminder = require('../models/Reminder');
const Rental = require('../models/Rental');
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const { sendMessage } = require('./messagingService');

// Create reminder for rental return
const createReturnReminder = async (rentalId, daysBefore = 1) => {
  try {
    const rental = await Rental.findById(rentalId)
      .populate('customer_ref')
      .populate('vehicle_ref');

    if (!rental) {
      throw new Error('Rental not found');
    }

    const dueDate = new Date(rental.end_date);
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - daysBefore);

    // Check if reminder already exists
    const existingReminder = await Reminder.findOne({
      rental_ref: rentalId,
      reminder_type: 'Return Date',
      days_before: daysBefore
    });

    if (existingReminder) {
      return existingReminder;
    }

    const reminder = new Reminder({
      rental_ref: rentalId,
      customer_ref: rental.customer_ref._id,
      vehicle_ref: rental.vehicle_ref._id,
      reminder_type: 'Return Date',
      due_date: dueDate,
      reminder_date: reminderDate,
      days_before: daysBefore,
      channels: ['Email', 'WhatsApp', 'SMS'],
      status: 'Pending'
    });

    await reminder.save();
    return reminder;
  } catch (error) {
    console.error('Error creating reminder:', error);
    throw error;
  }
};

// Send reminder
const sendReminder = async (reminderId) => {
  try {
    const reminder = await Reminder.findById(reminderId)
      .populate('rental_ref')
      .populate('customer_ref')
      .populate('vehicle_ref');

    if (!reminder) {
      throw new Error('Reminder not found');
    }

    if (reminder.status !== 'Pending') {
      return { success: false, message: 'Reminder already processed' };
    }

    const customer = reminder.customer_ref;
    const vehicle = reminder.vehicle_ref;
    const rental = reminder.rental_ref;

    // Generate reminder message
    const messageContent = generateReminderMessage(reminder, customer, vehicle, rental);

    // Send via all channels
    const results = [];
    for (const channel of reminder.channels) {
      const messageData = {
        recipient_type: 'Customer',
        recipient_ref: customer._id,
        recipient_model: 'Customer',
        recipient_name: customer.name,
        recipient_email: customer.email,
        recipient_phone: customer.phone,
        message_type: 'Reminder',
        channel,
        subject: `Vehicle Return Reminder - ${vehicle.make} ${vehicle.model}`,
        content: messageContent,
        rental_ref: rental._id,
        vehicle_ref: vehicle._id,
        sent_by: null // System generated
      };

      const result = await sendMessage(messageData);
      results.push({ channel, ...result });
    }

    // Update reminder status
    if (results.some(r => r.success)) {
      reminder.status = 'Sent';
      reminder.sent_at = new Date();
      if (results[0]?.messageLog) {
        reminder.message_log_ref = results[0].messageLog._id;
      }
    } else {
      reminder.status = 'Failed';
    }

    await reminder.save();

    return {
      success: results.some(r => r.success),
      results,
      reminder
    };
  } catch (error) {
    console.error('Error sending reminder:', error);
    throw error;
  }
};

// Generate reminder message content
const generateReminderMessage = (reminder, customer, vehicle, rental) => {
  const returnDate = new Date(reminder.due_date);
  const formattedDate = returnDate.toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1E3A8A;">Vehicle Return Reminder</h2>
      <p>Dear ${customer.name},</p>
      <p>This is a friendly reminder that your vehicle rental is due for return.</p>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Vehicle:</strong> ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})</p>
        <p><strong>Return Date:</strong> ${formattedDate}</p>
        <p><strong>Days Remaining:</strong> ${reminder.days_before} day(s)</p>
      </div>
      <p>Please ensure the vehicle is returned on time to avoid any late return penalties.</p>
      <p>If you have any questions, please contact us.</p>
      <p>Best regards,<br>RESSEY TOURS</p>
    </div>
  `;
};

// Process pending reminders (to be called by cron job)
const processPendingReminders = async () => {
  try {
    const now = new Date();
    const pendingReminders = await Reminder.find({
      status: 'Pending',
      reminder_date: { $lte: now }
    })
      .populate('rental_ref')
      .populate('customer_ref')
      .populate('vehicle_ref');

    const results = [];
    for (const reminder of pendingReminders) {
      // Check if rental is still active
      if (reminder.rental_ref.rental_status === 'Active') {
        const result = await sendReminder(reminder._id);
        results.push(result);
      } else {
        reminder.status = 'Cancelled';
        await reminder.save();
      }
    }

    return results;
  } catch (error) {
    console.error('Error processing reminders:', error);
    throw error;
  }
};

// Get reminders for rental
const getRemindersForRental = async (rentalId) => {
  return await Reminder.find({ rental_ref: rentalId }).sort({ created_at: -1 });
};

module.exports = {
  createReturnReminder,
  sendReminder,
  processPendingReminders,
  getRemindersForRental
};







