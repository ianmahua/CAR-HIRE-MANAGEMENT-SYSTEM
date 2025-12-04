const nodemailer = require('nodemailer');

// Reuse a simple transporter (can be aligned with emailService if desired)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendBookingConfirmationEmail = async (booking) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email credentials not configured. Booking confirmation:', booking._id);
      return { sent: false };
    }

    const subject = 'Your Booking Request - RESSEY TOURS';
    const pickupDate = booking.bookingDate
      ? new Date(booking.bookingDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : 'N/A';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e89d0b;">Booking Request Received</h2>
        <p>Hi ${booking.customerName},</p>
        <p>Thank you for your booking request with RESSEY TOURS. Here are your booking details:</p>
        <h3>Customer Details</h3>
        <ul>
          <li><strong>Name:</strong> ${booking.customerName}</li>
          <li><strong>ID Number:</strong> ${booking.customerIdNumber}</li>
          <li><strong>Phone:</strong> ${booking.customerPhone}</li>
          <li><strong>Email:</strong> ${booking.customerEmail}</li>
        </ul>
        <h3>Booking Details</h3>
        <ul>
          <li><strong>Vehicle:</strong> ${booking.vehicleMake} ${booking.vehicleModel}</li>
          <li><strong>Pickup Date:</strong> ${pickupDate}</li>
          <li><strong>Number of Days:</strong> ${booking.numberOfDays}</li>
          <li><strong>Destination:</strong> ${booking.destination}</li>
          <li><strong>Daily Rate:</strong> KES ${booking.dailyRate.toLocaleString()}</li>
          <li><strong>Total Amount:</strong> KES ${booking.totalAmount.toLocaleString()}</li>
          <li><strong>Status:</strong> ${booking.status}</li>
        </ul>
        ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
        <p>Our team will review your request and contact you to confirm availability and finalize the booking.</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If you did not make this request, please ignore this email.
        </p>
      </div>
    `;

    const mailOptions = {
      from: `"RESSEY TOURS" <${process.env.EMAIL_USER}>`,
      to: booking.customerEmail,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return { sent: false, error: error.message };
  }
};

module.exports = {
  sendBookingConfirmationEmail
};





