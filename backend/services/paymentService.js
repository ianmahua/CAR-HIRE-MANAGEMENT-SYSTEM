const DriverPayment = require('../models/DriverPayment');
const VehicleOwnerPayment = require('../models/VehicleOwnerPayment');
const Rental = require('../models/Rental');
const Vehicle = require('../models/Vehicle');
const VehicleOwner = require('../models/VehicleOwner');
const User = require('../models/User');
const { sendMessage } = require('./messagingService');

// Calculate and create driver payment
const createDriverPayment = async (driverId, rentalId, amount) => {
  try {
    const rental = await Rental.findById(rentalId);
    if (!rental) {
      throw new Error('Rental not found');
    }

    // Calculate due date (e.g., end of rental + 7 days)
    const dueDate = new Date(rental.end_date);
    dueDate.setDate(dueDate.getDate() + 7);

    const driverPayment = new DriverPayment({
      driver_ref: driverId,
      rental_ref: rentalId,
      amount_owed: amount,
      payment_status: 'Not Paid',
      due_date: dueDate
    });

    await driverPayment.save();
    return driverPayment;
  } catch (error) {
    console.error('Error creating driver payment:', error);
    throw error;
  }
};

// Update driver payment status
const updateDriverPayment = async (paymentId, paymentData) => {
  try {
    const payment = await DriverPayment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    const { amount_paid, payment_method, payment_reference, notes, paid_by } = paymentData;

    payment.amount_paid = amount_paid || payment.amount_paid;
    payment.payment_method = payment_method;
    payment.payment_reference = payment_reference;
    payment.notes = notes;
    payment.paid_by = paid_by;

    // Update payment status
    if (payment.amount_paid >= payment.amount_owed) {
      payment.payment_status = 'Paid';
      payment.paid_date = new Date();
    } else if (payment.amount_paid > 0) {
      payment.payment_status = 'Partial';
    } else {
      payment.payment_status = 'Not Paid';
    }

    await payment.save();
    return payment;
  } catch (error) {
    console.error('Error updating driver payment:', error);
    throw error;
  }
};

// Calculate and create vehicle owner payment
const createVehicleOwnerPayment = async (ownerId, vehicleId, rentalId, amount) => {
  try {
    const owner = await VehicleOwner.findById(ownerId);
    if (!owner) {
      throw new Error('Owner not found');
    }

    // Calculate due date based on owner's payout_due_day
    const now = new Date();
    const dueDate = new Date(now.getFullYear(), now.getMonth(), owner.payout_due_day);
    if (dueDate < now) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }

    const ownerPayment = new VehicleOwnerPayment({
      owner_ref: ownerId,
      vehicle_ref: vehicleId,
      rental_ref: rentalId,
      amount_owed: amount,
      payment_status: 'Not Paid',
      due_date: dueDate
    });

    await ownerPayment.save();
    return ownerPayment;
  } catch (error) {
    console.error('Error creating owner payment:', error);
    throw error;
  }
};

// Update vehicle owner payment status
const updateVehicleOwnerPayment = async (paymentId, paymentData) => {
  try {
    const payment = await VehicleOwnerPayment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    const { amount_paid, payment_method, payment_reference, notes, paid_by } = paymentData;

    payment.amount_paid = amount_paid || payment.amount_paid;
    payment.payment_method = payment_method;
    payment.payment_reference = payment_reference;
    payment.notes = notes;
    payment.paid_by = paid_by;

    // Update payment status
    if (payment.amount_paid >= payment.amount_owed) {
      payment.payment_status = 'Paid';
      payment.paid_date = new Date();
    } else if (payment.amount_paid > 0) {
      payment.payment_status = 'Partial';
    } else {
      payment.payment_status = 'Not Paid';
    }

    await payment.save();
    return payment;
  } catch (error) {
    console.error('Error updating owner payment:', error);
    throw error;
  }
};

// Get pending driver payments
const getPendingDriverPayments = async () => {
  return await DriverPayment.find({ payment_status: { $ne: 'Paid' } })
    .populate('driver_ref', 'name email phone_msisdn')
    .populate('rental_ref', 'rental_id start_date end_date')
    .sort({ due_date: 1 });
};

// Get pending vehicle owner payments
const getPendingOwnerPayments = async () => {
  return await VehicleOwnerPayment.find({ payment_status: { $ne: 'Paid' } })
    .populate('owner_ref', 'name contact_details')
    .populate('vehicle_ref', 'make model license_plate')
    .populate('rental_ref', 'rental_id')
    .sort({ due_date: 1 });
};

// Send payment reminder to vehicle owner
const sendOwnerPaymentReminder = async (paymentId, daysBefore) => {
  try {
    const payment = await VehicleOwnerPayment.findById(paymentId)
      .populate('owner_ref')
      .populate('vehicle_ref');

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Check if reminder already sent
    if (daysBefore === 2 && payment.reminder_sent_2days) {
      return { success: false, message: '2-day reminder already sent' };
    }
    if (daysBefore === 1 && payment.reminder_sent_1day) {
      return { success: false, message: '1-day reminder already sent' };
    }

    const owner = payment.owner_ref;
    const vehicle = payment.vehicle_ref;
    const dueDate = new Date(payment.due_date);
    const daysRemaining = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));

    const messageContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1E3A8A;">Payment Reminder</h2>
        <p>Dear ${owner.name},</p>
        <p>This is a reminder that a payment is due for vehicle rental.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Vehicle:</strong> ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})</p>
          <p><strong>Amount Owed:</strong> KES ${payment.amount_owed.toLocaleString()}</p>
          <p><strong>Due Date:</strong> ${dueDate.toLocaleDateString('en-KE')}</p>
          <p><strong>Days Remaining:</strong> ${daysRemaining} day(s)</p>
        </div>
        <p>Please ensure payment is processed on time.</p>
        <p>Best regards,<br>RESSEY TOURS</p>
      </div>
    `;

    const messageData = {
      recipient_type: 'Owner',
      recipient_ref: owner._id,
      recipient_model: 'VehicleOwner',
      recipient_name: owner.name,
      recipient_email: owner.contact_details?.email,
      recipient_phone: owner.contact_details?.phone,
      message_type: 'Payment Request',
      channel: 'Email',
      subject: `Payment Reminder - ${vehicle.make} ${vehicle.model}`,
      content: messageContent,
      vehicle_ref: vehicle._id,
      sent_by: null
    };

    const result = await sendMessage(messageData);

    // Update reminder flags
    if (daysBefore === 2) {
      payment.reminder_sent_2days = true;
    } else if (daysBefore === 1) {
      payment.reminder_sent_1day = true;
    }
    await payment.save();

    return result;
  } catch (error) {
    console.error('Error sending owner payment reminder:', error);
    throw error;
  }
};

// Process payment reminders (cron job)
const processPaymentReminders = async () => {
  try {
    const now = new Date();
    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    // Get payments due in 2 days
    const paymentsDue2Days = await VehicleOwnerPayment.find({
      payment_status: { $ne: 'Paid' },
      due_date: {
        $gte: new Date(twoDaysFromNow.setHours(0, 0, 0, 0)),
        $lt: new Date(twoDaysFromNow.setHours(23, 59, 59, 999))
      },
      reminder_sent_2days: false
    });

    // Get payments due in 1 day
    const paymentsDue1Day = await VehicleOwnerPayment.find({
      payment_status: { $ne: 'Paid' },
      due_date: {
        $gte: new Date(oneDayFromNow.setHours(0, 0, 0, 0)),
        $lt: new Date(oneDayFromNow.setHours(23, 59, 59, 999))
      },
      reminder_sent_1day: false
    });

    const results = [];

    // Send 2-day reminders
    for (const payment of paymentsDue2Days) {
      const result = await sendOwnerPaymentReminder(payment._id, 2);
      results.push({ payment: payment._id, daysBefore: 2, ...result });
    }

    // Send 1-day reminders
    for (const payment of paymentsDue1Day) {
      const result = await sendOwnerPaymentReminder(payment._id, 1);
      results.push({ payment: payment._id, daysBefore: 1, ...result });
    }

    return results;
  } catch (error) {
    console.error('Error processing payment reminders:', error);
    throw error;
  }
};

module.exports = {
  createDriverPayment,
  updateDriverPayment,
  createVehicleOwnerPayment,
  updateVehicleOwnerPayment,
  getPendingDriverPayments,
  getPendingOwnerPayments,
  sendOwnerPaymentReminder,
  processPaymentReminders
};











