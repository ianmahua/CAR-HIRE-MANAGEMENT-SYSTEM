const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const EmailLog = require('../models/EmailLog');

class EmailSender {
  constructor() {
    this.transporter = null;
    this.logoBase64 = this.loadLogo();
    this.initializeTransporter();
  }

  async logEmail({ rentalId, recipientEmail, recipientName, emailType, subject, messageId, status, error }) {
    try {
      await EmailLog.create({
        rental_id: rentalId || null,
        recipient_email: recipientEmail,
        recipient_name: recipientName || '',
        email_type: emailType,
        subject,
        sent_at: new Date(),
        message_id: messageId || '',
        status: status || 'sent',
        error_message: error || ''
      });
    } catch (e) {
      console.error('[EmailLog] Failed to log email:', e.message);
    }
  }

  loadLogo() {
    try {
      const logoPath = path.join(__dirname, '..', 'assets', 'logo.png');
      if (fs.existsSync(logoPath)) {
        const buffer = fs.readFileSync(logoPath);
        return buffer.toString('base64');
      }
    } catch (e) {
      console.warn('Failed to load logo for email template:', e.message);
    }
    return null;
  }

  initializeTransporter() {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      console.warn('Email credentials not configured. Email sending will not work.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPassword
      }
    });
  }

  async testConnection() {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized. Check EMAIL_USER and EMAIL_PASSWORD in .env');
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Email connection successful' };
    } catch (error) {
      return { success: false, message: 'Email connection failed', error: error.message };
    }
  }

  formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatCurrency(amount) {
    if (!amount) return '0';
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  calculateDuration(startDate, endDate) {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    if (Number.isNaN(diffTime) || diffTime <= 0) return 'N/A';
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day(s)`;
  }

  // Brand-styled HTML email template (user-provided design)
  generateEmailHTML(options) {
    const {
      customerName,
      bookingId,
      vehicleDetails,
      pickupDate,
      returnDate,
      totalAmount,
      destination
    } = options;

    const companyName = process.env.COMPANY_NAME || 'RESSEY TOURS & CAR HIRE COMPANY';
    const companyAddress = process.env.COMPANY_ADDRESS || 'Nairobi-Muthaiga Square Block B';
    const companyEmail = process.env.COMPANY_EMAIL || 'ressytourscarhire@gmail.com';
    const companyPhone1 = process.env.COMPANY_PHONE_1 || '0727347926';
    const companyPhone2 = process.env.COMPANY_PHONE_2 || '0725997121';

    const logoSrc = this.logoBase64
      ? `data:image/png;base64,${this.logoBase64}`
      : '';

    const durationText = this.calculateDuration(pickupDate, returnDate);
    const contractId = bookingId || 'N/A';
    const vehicleName = vehicleDetails || 'N/A';
    let vehicleReg = 'N/A';
    if (vehicleDetails && vehicleDetails.includes('-')) {
      const parts = vehicleDetails.split('-');
      vehicleReg = parts[parts.length - 1].trim();
    }
    const destText = destination || 'Not specified';

    return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0; padding:0; background:#f4f4f4; font-family: Arial, Helvetica, sans-serif;">
  <!-- Outer Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f4f4f4">
    <tr>
      <td align="center" style="padding: 30px 0;">

        <!-- Inner Container -->
        <table width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="border-radius:8px; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td bgcolor="#F7C948" style="padding: 25px; text-align:center;">
              ${logoSrc ? `<img src="${logoSrc}" alt="Ressey Tours Logo" width="80" style="display:block; margin:auto;" />` : ''}
              <h1 style="margin:10px 0 0 0; font-size:22px; color:#0E1A2B; font-weight:bold;">
                ${companyName}
              </h1>
              <p style="margin:5px 0 0 0; color:#0E1A2B; font-size:13px;">
                ${companyAddress} &nbsp; | &nbsp; Tel: ${companyPhone1} / ${companyPhone2}
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 25px 30px;">
              <p style="margin:0; font-size:16px; color:#111;">
                Dear <strong>${customerName || 'Valued Customer'}</strong>,
              </p>
              <p style="margin:12px 0 0 0; font-size:15px; color:#333; line-height:1.6;">
                Thank you for choosing <strong>${companyName}</strong>.  
                Your booking has been successfully processed, and we are delighted to serve you.
              </p>
            </td>
          </tr>

          <!-- Booking Summary -->
          <tr>
            <td style="padding: 0 30px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#1E3A8A; border-radius:6px; padding:20px; color:#ffffff;">
                <tr>
                  <td>
                    <h2 style="margin:0 0 10px 0; font-size:18px; color:#F7C948;">
                      BOOKING SUMMARY
                    </h2>

                    <p style="margin:8px 0; font-size:14px;">
                      <strong>Contract ID:</strong> ${contractId}
                    </p>
                    <p style="margin:8px 0; font-size:14px;">
                      <strong>Vehicle:</strong> ${vehicleName} ${vehicleReg !== 'N/A' ? `(${vehicleReg})` : ''}
                    </p>
                    <p style="margin:8px 0; font-size:14px;">
                      <strong>Hire Dates:</strong> ${this.formatDate(pickupDate)} to ${this.formatDate(returnDate)} (${durationText})
                    </p>
                    <p style="margin:8px 0; font-size:14px;">
                      <strong>Destination:</strong> ${destText}
                    </p>
                    <p style="margin:8px 0 0 0; font-size:14px;">
                      <strong>Total Amount:</strong> <span style="color:#F7C948;">KES ${this.formatCurrency(totalAmount || 0)}</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contract Attachment Notice -->
          <tr>
            <td style="padding: 25px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#FFF9E5; border-left:4px solid #F7C948; padding:18px; border-radius:4px;">
                <tr>
                  <td style="font-size:14px; color:#333;">
                    <strong>Your official contract is attached to this email.</strong>
                    <br><br>
                    Please ensure you bring the following on pickup:
                    <ul style="padding-left:20px; margin:10px 0; line-height:1.5;">
                      <li>Original National ID/Passport</li>
                      <li>Valid Driving License</li>
                      <li>Payment confirmation if paying via mobile/online</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Important Reminders -->
          <tr>
            <td style="padding: 0 30px 25px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#E7F1FF; border-left:4px solid #1E40AF; padding:18px; border-radius:4px;">
                <tr>
                  <td style="font-size:14px; color:#333;">
                    <strong>Important:</strong>
                    <ul style="padding-left:20px; margin:10px 0; line-height:1.5;">
                      <li>Please arrive on time for your pickup.</li>
                      <li>Ensure the vehicle is returned in the same condition.</li>
                      <li>Report any issues or delays in advance.</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contact Card -->
          <tr>
            <td style="padding: 0 30px 25px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="border:1px solid #ddd; border-radius:6px; padding:20px;">
                <tr>
                  <td style="font-size:14px; color:#333; line-height:1.6;">
                    <strong>Need Assistance?</strong><br>
                    Phone: ${companyPhone1} / ${companyPhone2}<br>
                    Email: ${companyEmail}<br>
                    Location: ${companyAddress}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#0E1A2B" style="padding:20px; text-align:center;">
              <p style="margin:0; color:#F7C948; font-size:14px; font-weight:bold;">
                ${companyName}
              </p>
              <p style="margin:5px 0 0 0; color:#ffffff; font-size:12px;">
                Your Journey, Our Commitment.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  async sendContract(options) {
    const {
      customerEmail,
      customerName,
      bookingId,
      vehicleDetails,
      pickupDate,
      returnDate,
      totalAmount,
      destination,
      contractPath
    } = options;

    if (!customerEmail) throw new Error('Customer email is required');
    if (!contractPath) throw new Error('Contract PDF path is required');
    if (!fs.existsSync(contractPath)) {
      throw new Error(`Contract file not found: ${contractPath}`);
    }
    if (!this.transporter) {
      throw new Error('Email transporter not initialized. Check EMAIL_USER and EMAIL_PASSWORD in .env');
    }

    const companyName = process.env.COMPANY_NAME || 'The Ressey Tours & Car Hire Company';
    const emailFromName = process.env.EMAIL_FROM_NAME || companyName;

    const htmlContent = this.generateEmailHTML({
      customerName,
      bookingId,
      vehicleDetails,
      pickupDate,
      returnDate,
      totalAmount,
      destination
    });

    const mailOptions = {
      from: `"${emailFromName}" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Your Car Hire Contract - Booking ${bookingId || 'Confirmation'}`,
      html: htmlContent,
      attachments: [
        {
          filename: path.basename(contractPath),
          path: contractPath,
          contentType: 'application/pdf'
        }
      ]
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);

      await this.logEmail({
        rentalId: options.rentalId || null,
        recipientEmail: customerEmail,
        recipientName: customerName,
        emailType: 'contract',
        subject: mailOptions.subject,
        messageId: info.messageId,
        status: 'sent'
      });

      return { success: true, messageId: info.messageId, message: 'Contract email sent successfully' };
    } catch (error) {
      console.error('Error sending contract email:', error);

      await this.logEmail({
        rentalId: options.rentalId || null,
        recipientEmail: customerEmail,
        recipientName: customerName,
        emailType: 'contract',
        subject: mailOptions.subject,
        status: 'failed',
        error: error.message
      });

      return { success: false, error: error.message, message: 'Failed to send contract email' };
    }
  }

  buildBasicShell({ subject, bodyHtml }) {
    const companyName = process.env.COMPANY_NAME || 'THE RESSEY TOURS & CAR HIRE COMPANY';
    const companyAddress = process.env.COMPANY_ADDRESS || 'Nairobi-Muthaiga Square Block B';
    const companyEmail = process.env.COMPANY_EMAIL || 'ressytourscarhire@gmail.com';
    const companyPhone1 = process.env.COMPANY_PHONE_1 || '0727347926';
    const companyPhone2 = process.env.COMPANY_PHONE_2 || '0725997121';

    return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0; padding:0; background:#f4f4f4; font-family: Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f4f4f4">
    <tr>
      <td align="center" style="padding: 30px 0;">
        <table width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="border-radius:8px; overflow:hidden;">
          <tr>
            <td style="padding:0;">
              <div style="background:#FFB800; padding:30px; text-align:center;">
                <h1 style="color:#1E293B; margin:0; font-size:28px; font-weight:bold; text-transform:uppercase; letter-spacing:0.04em;">
                  ${companyName}
                </h1>
                <p style="color:#1E293B; margin:10px 0 0 0; font-size:14px;">
                  ${companyAddress} | Tel: ${companyPhone1} / ${companyPhone2}
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 28px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 24px 20px 24px; border-top:1px solid #e5e7eb; background:#0E1A2B; text-align:center;">
              <p style="margin:0; color:#FFB800; font-size:13px; font-weight:bold;">
                ${companyName}
              </p>
              <p style="margin:4px 0 0 0; color:#ffffff; font-size:12px;">
                📧 ${companyEmail} &nbsp;|&nbsp; 📞 ${companyPhone1} / ${companyPhone2}
              </p>
              <p style="margin:4px 0 0 0; color:#9CA3AF; font-size:11px;">
                ${companyAddress}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  async sendReturnReminder24Hours(rentalData) {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized. Check EMAIL_USER and EMAIL_PASSWORD in .env');
    }

    const customerEmail = rentalData.customer_email;
    const customerName = rentalData.customer_name || rentalData.customer_ref?.name;
    if (!customerEmail) throw new Error('Customer email is required for return reminder');

    const vehicle = rentalData.vehicle_ref || rentalData.vehicle || {};
    const vehicleLabel = `${vehicle.make || ''} ${vehicle.model || ''}`.trim();
    const reg = vehicle.license_plate || rentalData.vehicle_license_plate || '';

    const returnDate = rentalData.end_date || rentalData.return_date;
    const startDate = rentalData.start_date || rentalData.pickup_date;

    const durationDays = this.calculateDuration(startDate, returnDate).replace(' day(s)', '');
    const totalPaid = rentalData.total_fee_gross || rentalData.total_amount || 0;

    const subject = `Reminder: Vehicle Return Tomorrow - ${vehicleLabel || 'Your Vehicle'}`;

    const bodyHtml = `
      <p style="margin:0 0 12px 0; font-size:15px; color:#111;">
        Hi <strong>${customerName || 'Valued Customer'}</strong>,
      </p>
      <p style="margin:0 0 16px 0; font-size:14px; color:#374151; line-height:1.6;">
        Your rental period is coming to an end tomorrow. Thank you for choosing <strong>The Ressey Tours &amp; Car Hire Company</strong>!
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0; background:#EFF6FF; border-radius:6px; padding:18px; border:1px solid #BFDBFE;">
        <tr>
          <td style="font-size:14px; color:#111827;">
            <strong style="display:block; margin-bottom:8px; color:#1E40AF;">📅 RETURN DETAILS</strong>
            <p style="margin:4px 0;"><strong>Vehicle:</strong> ${vehicleLabel || 'Vehicle'}${reg ? ` - ${reg}` : ''}</p>
            <p style="margin:4px 0;"><strong>Return Date:</strong> ${this.formatDate(returnDate)}</p>
            <p style="margin:4px 0;"><strong>Return Time:</strong> 5:00 PM (EAT)</p>
            <p style="margin:4px 0;"><strong>Location:</strong> Nairobi-Muthaiga Square Block B</p>
            <p style="margin:4px 0;"><strong>Duration:</strong> ${durationDays || 'N/A'} days</p>
            <p style="margin:4px 0;"><strong>Total Paid:</strong> KES ${this.formatCurrency(totalPaid)}</p>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0; background:#FFF9E6; border-radius:6px; padding:18px; border:1px solid #FBBF24;">
        <tr>
          <td style="font-size:14px; color:#92400E;">
            <strong style="display:block; margin-bottom:8px;">⚠️ IMPORTANT REMINDERS</strong>
            <ul style="padding-left:18px; margin:0; line-height:1.6;">
              <li>Return the vehicle with the same fuel level.</li>
              <li>Check for all personal belongings.</li>
              <li>Inspect the vehicle together with our staff.</li>
              <li>Report any damage immediately.</li>
              <li>Late return fee: <strong>KES 2,000 per hour</strong>.</li>
            </ul>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 10px 0; font-size:14px; color:#374151;">
        <strong>Need more time?</strong> If you need to extend your rental, please contact us:
      </p>
      <p style="margin:0 0 4px 0; font-size:14px; color:#111827;">
        📞 0727347926 / 0725997121<br/>
        📧 ressytourscarhire@gmail.com
      </p>

      <p style="margin:16px 0 0 0; font-size:14px; color:#111827;">
        We appreciate your business!<br/>
        <span style="display:block; margin-top:4px;">Best regards,<br/>The Ressey Tours Team</span>
      </p>
    `;

    const htmlContent = this.buildBasicShell({ subject, bodyHtml });

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'The Ressey Tours'}" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject,
      html: htmlContent,
      text: `Hi ${customerName || 'Customer'}, your rental ends tomorrow. Vehicle: ${vehicleLabel} ${reg ? `(${reg})` : ''}. Return date: ${this.formatDate(returnDate)}. Location: Nairobi-Muthaiga Square Block B.`
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      await this.logEmail({
        rentalId: rentalData._id,
        recipientEmail: customerEmail,
        recipientName: customerName,
        emailType: 'return_reminder_24h',
        subject,
        messageId: info.messageId,
        status: 'sent'
      });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending 24h return reminder:', error);
      await this.logEmail({
        rentalId: rentalData._id,
        recipientEmail: customerEmail,
        recipientName: customerName,
        emailType: 'return_reminder_24h',
        subject,
        status: 'failed',
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  async sendReturnReminderMorning(rentalData) {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized. Check EMAIL_USER and EMAIL_PASSWORD in .env');
    }

    const customerEmail = rentalData.customer_email;
    const customerName = rentalData.customer_name || rentalData.customer_ref?.name;
    if (!customerEmail) throw new Error('Customer email is required for return reminder');

    const vehicle = rentalData.vehicle_ref || rentalData.vehicle || {};
    const vehicleLabel = `${vehicle.make || ''} ${vehicle.model || ''}`.trim();
    const reg = vehicle.license_plate || rentalData.vehicle_license_plate || '';

    const returnDate = rentalData.end_date || rentalData.return_date;

    const subject = `Today: Please Return ${vehicleLabel || 'Your Vehicle'}`;

    const bodyHtml = `
      <p style="margin:0 0 12px 0; font-size:15px; color:#111;">
        Hi <strong>${customerName || 'Valued Customer'}</strong>,
      </p>
      <p style="margin:0 0 16px 0; font-size:14px; color:#374151; line-height:1.6;">
        This is a friendly reminder that today is your vehicle return day.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0; background:#EFF6FF; border-radius:6px; padding:18px; border:1px solid #BFDBFE;">
        <tr>
          <td style="font-size:14px; color:#111827;">
            <strong style="display:block; margin-bottom:8px; color:#1E40AF;">📅 RETURN TODAY</strong>
            <p style="margin:4px 0;"><strong>Vehicle:</strong> ${vehicleLabel || 'Vehicle'}${reg ? ` - ${reg}` : ''}</p>
            <p style="margin:4px 0;"><strong>Time:</strong> 5:00 PM (EAT)</p>
            <p style="margin:4px 0;"><strong>Location:</strong> Nairobi-Muthaiga Square Block B</p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 8px 0; font-size:14px; color:#111827;"><strong>Quick reminders:</strong></p>
      <ul style="padding-left:18px; margin:0 0 16px 0; line-height:1.6; font-size:14px; color:#374151;">
        <li>Same fuel level as at pickup.</li>
        <li>Check and remove all personal belongings.</li>
        <li>On-time return (Late fee: <strong>KES 2,000 per hour</strong>).</li>
      </ul>

      <p style="margin:0 0 10px 0; font-size:14px; color:#374151;">
        Thank you for choosing Ressey Tours!
      </p>
      <p style="margin:0; font-size:14px; color:#111827;">
        Need help? 📞 0727347926 / 0725997121
      </p>

      <p style="margin:16px 0 0 0; font-size:14px; color:#111827;">
        Best regards,<br/>
        <span style="display:block; margin-top:4px;">The Ressey Tours Team</span>
      </p>
    `;

    const htmlContent = this.buildBasicShell({ subject, bodyHtml });

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'The Ressey Tours'}" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject,
      html: htmlContent,
      text: `Hi ${customerName || 'Customer'}, this is a reminder that today is your vehicle return day for ${vehicleLabel} ${reg ? `(${reg})` : ''}.`
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      await this.logEmail({
        rentalId: rentalData._id,
        recipientEmail: customerEmail,
        recipientName: customerName,
        emailType: 'return_reminder_morning',
        subject,
        messageId: info.messageId,
        status: 'sent'
      });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending morning return reminder:', error);
      await this.logEmail({
        rentalId: rentalData._id,
        recipientEmail: customerEmail,
        recipientName: customerName,
        emailType: 'return_reminder_morning',
        subject,
        status: 'failed',
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  async sendExtensionConfirmation(rentalData, extensionData) {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized. Check EMAIL_USER and EMAIL_PASSWORD in .env');
    }

    const customerEmail = rentalData.customer_email;
    const customerName = rentalData.customer_name || rentalData.customer_ref?.name;
    if (!customerEmail) throw new Error('Customer email is required for extension confirmation');

    const vehicle = rentalData.vehicle_ref || rentalData.vehicle || {};
    const vehicleLabel = `${vehicle.make || ''} ${vehicle.model || ''}`.trim();
    const reg = vehicle.license_plate || rentalData.vehicle_license_plate || '';

    const subject = `Extension Approved - ${vehicleLabel || 'Your Vehicle'}`;

    const originalAmount = rentalData.total_fee_gross || rentalData.total_amount || 0;
    const additionalCost = extensionData.additionalCost || 0;
    const newTotal = extensionData.newTotalCost || originalAmount + additionalCost;

    const bodyHtml = `
      <p style="margin:0 0 12px 0; font-size:15px; color:#111;">
        Hi <strong>${customerName || 'Valued Customer'}</strong>,
      </p>
      <p style="margin:0 0 16px 0; font-size:14px; color:#374151; line-height:1.6;">
        Great news! Your rental extension has been approved.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0; background:#D1FAE5; border-radius:6px; padding:18px; border:1px solid #6EE7B7;">
        <tr>
          <td style="font-size:14px; color:#065F46;">
            <strong style="display:block; margin-bottom:8px;">✅ EXTENSION CONFIRMED</strong>
            <p style="margin:4px 0;"><strong>Vehicle:</strong> ${vehicleLabel || 'Vehicle'}${reg ? ` - ${reg}` : ''}</p>
            <p style="margin:4px 0;"><strong>Original Return:</strong> ${this.formatDate(extensionData.originalReturnDate)}</p>
            <p style="margin:4px 0;"><strong>NEW Return Date:</strong> ${this.formatDate(extensionData.newReturnDate)} ⭐</p>
            <p style="margin:4px 0;"><strong>Extension:</strong> ${extensionData.additionalDays || 0} additional days</p>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0; background:#F9FAFB; border-radius:6px; padding:18px; border:1px solid #E5E7EB;">
        <tr>
          <td style="font-size:14px; color:#111827;">
            <strong style="display:block; margin-bottom:8px;">💰 PAYMENT DETAILS</strong>
            <p style="margin:4px 0;"><strong>Original Amount:</strong> KES ${this.formatCurrency(originalAmount)}</p>
            <p style="margin:4px 0;"><strong>Additional Cost:</strong> KES ${this.formatCurrency(additionalCost)}</p>
            <p style="margin:8px 0 0 0; border-top:1px solid #E5E7EB; padding-top:8px;">
              <strong>NEW TOTAL:</strong>
              <span style="font-size:18px; font-weight:700; color:#1E40AF; margin-left:6px;">
                KES ${this.formatCurrency(newTotal)}
              </span>
            </p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 10px 0; font-size:14px; color:#374151;">
        <strong>Payment instructions:</strong> Please complete payment via your usual channel (cash, bank, or mobile) as agreed with our team.
      </p>

      <p style="margin:0 0 10px 0; font-size:14px; color:#374151;">
        Your new return date is <strong>${this.formatDate(extensionData.newReturnDate)}</strong>. Please ensure timely return to avoid late fees.
      </p>

      <p style="margin:16px 0 0 0; font-size:14px; color:#111827;">
        Thank you for choosing Ressey Tours!<br/>
        <span style="display:block; margin-top:4px;">Best regards,<br/>The Ressey Tours Team</span>
      </p>
    `;

    const htmlContent = this.buildBasicShell({ subject, bodyHtml });

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'The Ressey Tours'}" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject,
      html: htmlContent,
      text: `Your rental extension has been approved. New return date: ${this.formatDate(extensionData.newReturnDate)}. New total: KES ${this.formatCurrency(newTotal)}.`
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      await this.logEmail({
        rentalId: rentalData._id,
        recipientEmail: customerEmail,
        recipientName: customerName,
        emailType: 'extension_confirmation',
        subject,
        messageId: info.messageId,
        status: 'sent'
      });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending extension confirmation:', error);
      await this.logEmail({
        rentalId: rentalData._id,
        recipientEmail: customerEmail,
        recipientName: customerName,
        emailType: 'extension_confirmation',
        subject,
        status: 'failed',
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  async sendThankYouEmail(rentalData) {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized. Check EMAIL_USER and EMAIL_PASSWORD in .env');
    }

    const customerEmail = rentalData.customer_email;
    const customerName = rentalData.customer_name || rentalData.customer_ref?.name;
    if (!customerEmail) throw new Error('Customer email is required for thank-you email');

    const vehicle = rentalData.vehicle_ref || rentalData.vehicle || {};
    const vehicleLabel = `${vehicle.make || ''} ${vehicle.model || ''}`.trim();
    const reg = vehicle.license_plate || rentalData.vehicle_license_plate || '';

    const startDate = rentalData.start_date || rentalData.pickup_date;
    const endDate = rentalData.end_date || rentalData.return_date;
    const durationText = this.calculateDuration(startDate, endDate);
    const totalPaid = rentalData.total_fee_gross || rentalData.total_amount || 0;

    const subject = 'Thank You for Choosing Ressey Tours!';

    const now = new Date();
    const promoExpiry = new Date(now);
    promoExpiry.setMonth(promoExpiry.getMonth() + 3);

    const bodyHtml = `
      <p style="margin:0 0 12px 0; font-size:15px; color:#111;">
        Hi <strong>${customerName || 'Valued Customer'}</strong>,
      </p>
      <p style="margin:0 0 16px 0; font-size:14px; color:#374151; line-height:1.6;">
        Thank you for returning your vehicle! We truly appreciate your business and hope you had a wonderful experience with us.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0; background:#EFF6FF; border-radius:6px; padding:18px; border:1px solid #BFDBFE;">
        <tr>
          <td style="font-size:14px; color:#111827;">
            <strong style="display:block; margin-bottom:8px;">📋 RENTAL SUMMARY</strong>
            <p style="margin:4px 0;"><strong>Vehicle:</strong> ${vehicleLabel || 'Vehicle'}${reg ? ` - ${reg}` : ''}</p>
            <p style="margin:4px 0;"><strong>Period:</strong> ${this.formatDate(startDate)} - ${this.formatDate(endDate)}</p>
            <p style="margin:4px 0;"><strong>Duration:</strong> ${durationText}</p>
            <p style="margin:4px 0;"><strong>Total Paid:</strong> KES ${this.formatCurrency(totalPaid)}</p>
            <p style="margin:4px 0;"><strong>Status:</strong> ✅ Completed Successfully</p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 14px 0; font-size:14px; color:#374151;">
        <strong>We'd love your feedback!</strong> Your feedback helps us improve our service. How was your experience?
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0; background:#FFF9E6; border-radius:6px; padding:18px; border:1px solid #FBBF24;">
        <tr>
          <td style="font-size:14px; color:#92400E;">
            <strong style="display:block; margin-bottom:8px;">🎁 SPECIAL OFFER FOR YOU!</strong>
            <p style="margin:4px 0 8px 0;">
              Enjoy <strong>10% OFF</strong> your next rental with us.
            </p>
            <p style="margin:4px 0;"><strong>Promo Code:</strong> RETURN10</p>
            <p style="margin:4px 0;"><strong>Valid until:</strong> ${this.formatDate(promoExpiry)}</p>
            <p style="margin:8px 0 0 0;">
              Book your next adventure with us! 📞 0727347926 / 0725997121
            </p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 10px 0; font-size:14px; color:#374151;">
        Know someone who needs a reliable car hire? Share Ressey Tours with them!
      </p>

      <p style="margin:16px 0 0 0; font-size:14px; color:#111827;">
        We look forward to serving you again soon.<br/>
        <span style="display:block; margin-top:4px;">Warm regards,<br/>The Ressey Tours &amp; Car Hire Team</span>
      </p>
    `;

    const htmlContent = this.buildBasicShell({ subject, bodyHtml });

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'The Ressey Tours'}" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject,
      html: htmlContent,
      text: `Thank you for renting with Ressey Tours. Vehicle: ${vehicleLabel} ${reg ? `(${reg})` : ''}. Total paid: KES ${this.formatCurrency(totalPaid)}. Promo code RETURN10 valid until ${this.formatDate(promoExpiry)}.`
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      await this.logEmail({
        rentalId: rentalData._id,
        recipientEmail: customerEmail,
        recipientName: customerName,
        emailType: 'thank_you',
        subject,
        messageId: info.messageId,
        status: 'sent'
      });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending thank-you email:', error);
      await this.logEmail({
        rentalId: rentalData._id,
        recipientEmail: customerEmail,
        recipientName: customerName,
        emailType: 'thank_you',
        subject,
        status: 'failed',
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }
}

module.exports = EmailSender;


