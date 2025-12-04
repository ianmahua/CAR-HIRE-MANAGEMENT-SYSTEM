const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection configuration
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter.verify((error, success) => {
    if (error) {
      console.log('Email service configuration error:', error);
    } else {
      console.log('Email service is ready to send messages');
    }
  });
}

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email credentials not configured. Reset URL:', resetUrl);
      return { sent: false, url: resetUrl };
    }

    const mailOptions = {
      from: `"RESSEY TOURS CRMS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request - RESSEY TOURS CRMS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ea580c;">Password Reset Request</h2>
          <p>You requested a password reset for your RESSEY TOURS CRMS account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #ea580c; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
            Reset Password
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { sent: false, error: error.message, url: resetUrl };
  }
};

// Send user invitation email
const sendUserInvitationEmail = async (email, role, resetUrl) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email credentials not configured. User invitation for:', email, 'Role:', role);
      if (resetUrl) {
        console.log('Reset URL:', resetUrl);
      }
      return { sent: false, url: resetUrl };
    }

    const mailOptions = {
      from: `"RESSEY TOURS CRMS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Welcome to RESSEY TOURS CRMS - ${role} Account`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ea580c;">Welcome to RESSEY TOURS CRMS</h2>
          <p>Your account has been created with the role: <strong>${role}</strong></p>
          <p>To get started, please set your password by clicking the button below:</p>
          ${resetUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 12px 24px; background-color: #ea580c; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Set Your Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${resetUrl}</p>
          ` : `
          <p>To set your password:</p>
          <ol>
            <li>Go to the login page</li>
            <li>Click "Forgot Password?"</li>
            <li>Enter your email: <strong>${email}</strong></li>
            <li>Follow the instructions to set your password</li>
          </ol>
          `}
          <p>Once your password is set, you can log in with your email and selected role.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            ${resetUrl ? 'This link will expire in 7 days. ' : ''}If you have any questions, please contact your administrator.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('User invitation email sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending user invitation email:', error);
    return { sent: false, error: error.message, url: resetUrl };
  }
};

// Send booking reminder email
const sendBookingReminderEmail = async (booking) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email credentials not configured. Booking reminder for:', booking.customerEmail);
      return { sent: false };
    }

    const bookingDate = new Date(booking.bookingDate);
    const companyPhone = process.env.COMPANY_PHONE || '+254 700 000 000';

    const mailOptions = {
      from: `"The Ressey Tours" <${process.env.EMAIL_USER}>`,
      to: booking.customerEmail,
      subject: 'Booking Reminder - The Ressey Tours',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #e89d0b;">Booking Reminder</h2>
          <p>Dear ${booking.customerName},</p>
          <p>This is a reminder that your booking for <strong>${booking.vehicleMake} ${booking.vehicleModel}</strong> is tomorrow, ${bookingDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Booking Details:</strong></p>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 8px 0;">📅 <strong>Booking Date:</strong> ${bookingDate.toLocaleDateString()}</li>
              <li style="margin: 8px 0;">⏱️ <strong>Duration:</strong> ${booking.numberOfDays} day${booking.numberOfDays > 1 ? 's' : ''}</li>
              <li style="margin: 8px 0;">📍 <strong>Destination:</strong> ${booking.destination}</li>
              <li style="margin: 8px 0;">💰 <strong>Total Amount:</strong> KES ${booking.totalAmount.toLocaleString()}</li>
            </ul>
          </div>
          <p>Please confirm if you still need the vehicle by contacting us at <strong>${companyPhone}</strong>.</p>
          <p style="margin-top: 30px;">Thank you,<br><strong>The Ressey Tours & Car Hire</strong></p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking reminder email sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending booking reminder email:', error);
    return { sent: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendUserInvitationEmail,
  sendBookingReminderEmail
};




