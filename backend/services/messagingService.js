const MessageLog = require('../models/MessageLog');
const nodemailer = require('nodemailer');
const smsService = require('./smsService');
const whatsappService = require('./whatsappService');

// Email transporter configuration
const getEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send email
const sendEmail = async (to, subject, content, attachments = []) => {
  try {
    const transporter = getEmailTransporter();
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html: content,
      attachments: attachments.map(att => ({
        filename: att.name,
        path: att.url
      }))
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Send WhatsApp message using WhatsApp Business API
const sendWhatsApp = async (phone, message, attachments = []) => {
  try {
    if (attachments.length > 0) {
      // Send with media attachment
      const result = await whatsappService.sendMediaMessage(
        phone,
        message,
        attachments[0].url,
        attachments[0].type || 'document'
      );
      return result;
    } else {
      // Send text message
      const result = await whatsappService.sendMessage(phone, message);
      return result;
    }
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return { success: false, error: error.message };
  }
};

// Send SMS using SMS gateway
const sendSMS = async (phone, message) => {
  try {
    const result = await smsService.sendSMS(phone, message);
    return result;
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error: error.message };
  }
};

// Send message via selected channel(s)
const sendMessage = async (messageData) => {
  const {
    recipient_type,
    recipient_ref,
    recipient_model,
    recipient_name,
    recipient_email,
    recipient_phone,
    message_type,
    channel,
    subject,
    content,
    attachments = [],
    rental_ref,
    vehicle_ref,
    sent_by
  } = messageData;

  // Create message log entry
  const messageLog = new MessageLog({
    recipient_type,
    recipient_ref,
    recipient_model,
    recipient_name,
    recipient_email,
    recipient_phone,
    message_type,
    channel,
    subject,
    content,
    attachments,
    rental_ref,
    vehicle_ref,
    sent_by,
    status: 'Pending'
  });

  let sendResult = { success: false };

  try {
    // Send via selected channel
    if (channel === 'Email' && recipient_email) {
      sendResult = await sendEmail(recipient_email, subject, content, attachments);
    } else if (channel === 'WhatsApp' && recipient_phone) {
      sendResult = await sendWhatsApp(recipient_phone, content, attachments);
    } else if (channel === 'SMS' && recipient_phone) {
      sendResult = await sendSMS(recipient_phone, content);
    } else {
      throw new Error(`Invalid channel or missing recipient contact info`);
    }

    // Update message log
    if (sendResult.success) {
      messageLog.status = 'Sent';
      messageLog.sent_at = new Date();
    } else {
      messageLog.status = 'Failed';
      messageLog.error_message = sendResult.error;
    }
  } catch (error) {
    messageLog.status = 'Failed';
    messageLog.error_message = error.message;
    sendResult = { success: false, error: error.message };
  }

  await messageLog.save();

  return {
    success: sendResult.success,
    messageLog: messageLog,
    error: sendResult.error
  };
};

// Send bulk messages
const sendBulkMessages = async (messages) => {
  const results = [];
  for (const message of messages) {
    const result = await sendMessage(message);
    results.push(result);
  }
  return results;
};

module.exports = {
  sendMessage,
  sendBulkMessages,
  sendEmail,
  sendWhatsApp,
  sendSMS
};

