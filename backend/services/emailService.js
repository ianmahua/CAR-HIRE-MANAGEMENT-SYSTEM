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
const sendUserInvitationEmail = async (email, role) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email credentials not configured. User invitation for:', email, 'Role:', role);
      return { sent: false };
    }

    const mailOptions = {
      from: `"RESSEY TOURS CRMS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Welcome to RESSEY TOURS CRMS - ${role} Account`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ea580c;">Welcome to RESSEY TOURS CRMS</h2>
          <p>Your account has been created with the role: <strong>${role}</strong></p>
          <p>To get started, please set your password:</p>
          <ol>
            <li>Go to the login page</li>
            <li>Click "Forgot Password?"</li>
            <li>Enter your email: <strong>${email}</strong></li>
            <li>Follow the instructions to set your password</li>
          </ol>
          <p>Once your password is set, you can log in with your email and selected role.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            If you have any questions, please contact your administrator.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('User invitation email sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending user invitation email:', error);
    return { sent: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendUserInvitationEmail
};




