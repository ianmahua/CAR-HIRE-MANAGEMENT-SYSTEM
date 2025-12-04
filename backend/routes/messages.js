const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { sendMessage, sendBulkMessages } = require('../services/messagingService');
const MessageLog = require('../models/MessageLog');
const Rental = require('../models/Rental');
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');

// @route   POST /api/messages/send
// @desc    Send message (contract, agreement, etc.)
// @access  Private (Admin, Director)
router.post('/send', protect, authorize('Admin', 'Director'), async (req, res) => {
  try {
    const {
      recipient_type,
      recipient_ref,
      recipient_model,
      message_type,
      channel,
      subject,
      content,
      attachments,
      rental_ref,
      vehicle_ref
    } = req.body;

    // Get recipient details
    let recipient;
    if (recipient_model === 'Customer') {
      recipient = await Customer.findById(recipient_ref);
    } else if (recipient_model === 'User') {
      const User = require('../models/User');
      recipient = await User.findById(recipient_ref);
    } else if (recipient_model === 'VehicleOwner') {
      const VehicleOwner = require('../models/VehicleOwner');
      recipient = await VehicleOwner.findById(recipient_ref);
    }

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    const messageData = {
      recipient_type,
      recipient_ref,
      recipient_model,
      recipient_name: recipient.name,
      recipient_email: recipient.email || recipient.contact_details?.email,
      recipient_phone: recipient.phone || recipient.phone_msisdn || recipient.contact_details?.phone,
      message_type,
      channel,
      subject,
      content,
      attachments: attachments || [],
      rental_ref,
      vehicle_ref,
      sent_by: req.user._id
    };

    const result = await sendMessage(messageData);

    if (result.success) {
      res.json({
        success: true,
        message: 'Message sent successfully',
        data: result.messageLog
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/messages/send-contract
// @desc    Send rental contract to client
// @access  Private (Admin, Director)
router.post('/send-contract', protect, authorize('Admin', 'Director'), async (req, res) => {
  try {
    const { rental_id, vehicle_id, customer_id, channels } = req.body;

    const rental = await Rental.findById(rental_id)
      .populate('customer_ref')
      .populate('vehicle_ref');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    const customer = rental.customer_ref;
    const vehicle = rental.vehicle_ref;

    // Generate contract content (simplified - in production, use PDF generation)
    const contractContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #1E3A8A;">RENTAL AGREEMENT</h1>
        <p><strong>Agreement Date:</strong> ${new Date().toLocaleDateString('en-KE')}</p>
        <p><strong>Customer:</strong> ${customer.name}</p>
        <p><strong>Vehicle:</strong> ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})</p>
        <p><strong>Rental Period:</strong> ${new Date(rental.start_date).toLocaleDateString()} to ${new Date(rental.end_date).toLocaleDateString()}</p>
        <p><strong>Duration:</strong> ${rental.duration_days} days</p>
        <p><strong>Total Fee:</strong> KES ${rental.total_fee_gross.toLocaleString()}</p>
        <p><strong>Destination:</strong> ${rental.destination}</p>
        <hr>
        <h2>Terms and Conditions</h2>
        <p>1. The vehicle must be returned in the same condition as received.</p>
        <p>2. Late returns will incur additional charges.</p>
        <p>3. The customer is responsible for any damages during the rental period.</p>
        <p>4. Fuel charges are the responsibility of the customer.</p>
        <p>By signing this agreement, you agree to the terms and conditions above.</p>
      </div>
    `;

    const selectedChannels = channels || ['Email', 'WhatsApp'];
    const results = [];

    for (const channel of selectedChannels) {
      const messageData = {
        recipient_type: 'Customer',
        recipient_ref: customer._id,
        recipient_model: 'Customer',
        recipient_name: customer.name,
        recipient_email: customer.email,
        recipient_phone: customer.phone,
        message_type: 'Rental Agreement',
        channel,
        subject: `Rental Agreement - ${vehicle.make} ${vehicle.model}`,
        content: contractContent,
        attachments: [],
        rental_ref: rental._id,
        vehicle_ref: vehicle._id,
        sent_by: req.user._id
      };

      const result = await sendMessage(messageData);
      results.push({ channel, ...result });
    }

    res.json({
      success: true,
      message: 'Contract sent successfully',
      results
    });
  } catch (error) {
    console.error('Send contract error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/messages
// @desc    Get message logs
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { message_type, channel, status, startDate, endDate, recipient_ref } = req.query;
    const query = {};

    if (message_type) query.message_type = message_type;
    if (channel) query.channel = channel;
    if (status) query.status = status;
    if (recipient_ref) query.recipient_ref = recipient_ref;
    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) query.created_at.$gte = new Date(startDate);
      if (endDate) query.created_at.$lte = new Date(endDate);
    }

    // Drivers can only see their own messages
    if (req.user.role === 'Driver') {
      query.sent_by = req.user._id;
    }

    const messages = await MessageLog.find(query)
      .populate('recipient_ref', 'name email phone')
      .populate('rental_ref', 'rental_id')
      .populate('vehicle_ref', 'make model license_plate')
      .populate('sent_by', 'name email')
      .sort({ created_at: -1 })
      .limit(100);

    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;











