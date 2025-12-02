const VehicleOwner = require('../models/VehicleOwner');
const Rental = require('../models/Rental');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const financialService = require('./financialService');
const whatsappService = require('./whatsappService');
const nodemailer = require('nodemailer');
const moment = require('moment');

// Email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

class AlertService {
  // Check and send owner payout alerts (7 days before due date)
  async checkOwnerPayoutAlerts() {
    try {
      const today = new Date();
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(today.getDate() + 7);

      const owners = await VehicleOwner.find({
        contract_status: 'Active'
      });

      const alerts = [];

      for (const owner of owners) {
        const currentMonth = new Date();
        const payoutDueDate = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          owner.payout_due_day
        );

        // Check if payout is due in 7 days
        const daysUntilDue = Math.ceil((payoutDueDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue === 7) {
          const payout = await financialService.calculateOwnerPayout(owner._id, currentMonth);
          
          // Send email alert to admin
          const transporter = createTransporter();
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Admin email
            subject: `Owner Payout Alert: ${owner.name} - Due in 7 days`,
            html: `
              <h2>Owner Payout Alert</h2>
              <p><strong>Owner:</strong> ${owner.name}</p>
              <p><strong>Payout Due Date:</strong> ${moment(payoutDueDate).format('MMMM DD, YYYY')}</p>
              <p><strong>Calculated Payout:</strong> KES ${payout.calculated_payout.toLocaleString()}</p>
              <p><strong>Total Monthly Revenue:</strong> KES ${payout.total_monthly_revenue.toLocaleString()}</p>
              <p>Please review and approve the payout before the due date.</p>
            `
          });

          // Send WhatsApp alert if phone number available
          if (owner.contact_details?.phone) {
            try {
              await whatsappService.sendPaymentReminder(
                owner.contact_details.phone,
                `OWNER-${owner.owner_id}`,
                payout.calculated_payout,
                payoutDueDate
              );
            } catch (error) {
              console.error(`Failed to send WhatsApp alert to owner ${owner.name}:`, error.message);
            }
          }

          alerts.push({
            owner_id: owner.owner_id,
            owner_name: owner.name,
            payout_due_date: payoutDueDate,
            calculated_payout: payout.calculated_payout
          });
        }
      }

      return {
        success: true,
        alerts_sent: alerts.length,
        alerts
      };
    } catch (error) {
      console.error('Error checking owner payout alerts:', error);
      throw error;
    }
  }

  // Check and send driver payroll alerts
  async checkDriverPayrollAlerts() {
    try {
      const today = new Date();
      const drivers = await User.find({ role: 'Driver', is_active: true });

      const alerts = [];

      for (const driver of drivers) {
        // Check if driver has completed rentals this month
        const startOfMonth = moment(today).startOf('month').toDate();
        const rentals = await Rental.find({
          driver_assigned: driver._id,
          start_date: { $gte: startOfMonth },
          rental_status: 'Completed'
        });

        if (rentals.length > 0) {
          // Calculate driver payment (example: fixed per rental or percentage)
          const driverPayment = rentals.length * 2000; // Example: KES 2000 per completed rental

          // Send alert 3 days before month end
          const daysUntilMonthEnd = moment(today).endOf('month').diff(moment(today), 'days');
          
          if (daysUntilMonthEnd === 3) {
            const transporter = createTransporter();
            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: process.env.EMAIL_USER, // Admin email
              subject: `Driver Payroll Alert: ${driver.name}`,
              html: `
                <h2>Driver Payroll Alert</h2>
                <p><strong>Driver:</strong> ${driver.name}</p>
                <p><strong>Phone:</strong> ${driver.phone_msisdn}</p>
                <p><strong>Completed Rentals (MTD):</strong> ${rentals.length}</p>
                <p><strong>Estimated Payment:</strong> KES ${driverPayment.toLocaleString()}</p>
                <p>Please process driver payment before month end.</p>
              `
            });

            alerts.push({
              driver_id: driver.user_id,
              driver_name: driver.name,
              completed_rentals: rentals.length,
              estimated_payment: driverPayment
            });
          }
        }
      }

      return {
        success: true,
        alerts_sent: alerts.length,
        alerts
      };
    } catch (error) {
      console.error('Error checking driver payroll alerts:', error);
      throw error;
    }
  }

  // Check and send client payment reminders
  async checkClientPaymentAlerts() {
    try {
      const today = new Date();
      
      // Find rentals with overdue payments
      const overdueRentals = await Rental.find({
        payment_status: { $in: ['Awaiting', 'Partial'] },
        start_date: { $lte: today }
      }).populate('customer_ref').populate('vehicle_ref');

      const alerts = [];

      for (const rental of overdueRentals) {
        const daysOverdue = Math.ceil((today - new Date(rental.start_date)) / (1000 * 60 * 60 * 24));
        
        // Send reminder if overdue by 1 day, 3 days, or 7 days
        if ([1, 3, 7].includes(daysOverdue)) {
          if (rental.customer_ref?.phone) {
            try {
              await whatsappService.sendPaymentReminder(
                rental.customer_ref.phone,
                rental.rental_id,
                rental.total_fee_gross,
                rental.start_date
              );
            } catch (error) {
              console.error(`Failed to send WhatsApp reminder for rental ${rental.rental_id}:`, error.message);
            }
          }

          // Send email reminder
          if (rental.customer_ref?.email) {
            try {
              const transporter = createTransporter();
              await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: rental.customer_ref.email,
                subject: `Payment Reminder: Rental ${rental.rental_id}`,
                html: `
                  <h2>Payment Reminder</h2>
                  <p>Dear ${rental.customer_ref.name},</p>
                  <p>This is a reminder that payment is due for your rental:</p>
                  <ul>
                    <li><strong>Rental ID:</strong> ${rental.rental_id}</li>
                    <li><strong>Vehicle:</strong> ${rental.vehicle_ref?.make} ${rental.vehicle_ref?.model}</li>
                    <li><strong>Amount Due:</strong> KES ${rental.total_fee_gross.toLocaleString()}</li>
                    <li><strong>Days Overdue:</strong> ${daysOverdue}</li>
                  </ul>
                  <p>Please make payment via M-Pesa to complete your rental.</p>
                `
              });
            } catch (error) {
              console.error(`Failed to send email reminder for rental ${rental.rental_id}:`, error.message);
            }
          }

          alerts.push({
            rental_id: rental.rental_id,
            customer_name: rental.customer_ref?.name,
            amount_due: rental.total_fee_gross,
            days_overdue: daysOverdue
          });
        }
      }

      return {
        success: true,
        alerts_sent: alerts.length,
        alerts
      };
    } catch (error) {
      console.error('Error checking client payment alerts:', error);
      throw error;
    }
  }

  // Check and send service schedule alerts (30 days before due)
  async checkServiceScheduleAlerts() {
    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const vehicles = await Vehicle.find({
        availability_status: { $in: ['Parking', 'Rented Out'] }
      });

      const alerts = [];

      for (const vehicle of vehicles) {
        // Check service log for next service due date
        if (vehicle.service_log && vehicle.service_log.length > 0) {
          const lastService = vehicle.service_log[vehicle.service_log.length - 1];
          
          if (lastService.next_service_due) {
            const serviceDueDate = new Date(lastService.next_service_due);
            const daysUntilService = Math.ceil((serviceDueDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilService === 30) {
              // Send email alert to admin
              const transporter = createTransporter();
              await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER, // Admin email
                subject: `Service Schedule Alert: ${vehicle.license_plate} - Service Due in 30 Days`,
                html: `
                  <h2>Service Schedule Alert</h2>
                  <p><strong>Vehicle:</strong> ${vehicle.make} ${vehicle.model}</p>
                  <p><strong>License Plate:</strong> ${vehicle.license_plate}</p>
                  <p><strong>Service Due Date:</strong> ${moment(serviceDueDate).format('MMMM DD, YYYY')}</p>
                  <p><strong>Last Service:</strong> ${moment(lastService.date).format('MMMM DD, YYYY')}</p>
                  <p><strong>Last Odometer Reading:</strong> ${lastService.odometer_reading || 'N/A'} km</p>
                  <p>Please schedule service appointment before the due date.</p>
                `
              });

              alerts.push({
                vehicle_id: vehicle.vehicle_id,
                license_plate: vehicle.license_plate,
                service_due_date: serviceDueDate,
                last_service_date: lastService.date
              });
            }
          }
        }
      }

      return {
        success: true,
        alerts_sent: alerts.length,
        alerts
      };
    } catch (error) {
      console.error('Error checking service schedule alerts:', error);
      throw error;
    }
  }
}

module.exports = new AlertService();









