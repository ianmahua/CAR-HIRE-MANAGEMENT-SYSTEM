const { generateContractPDF } = require('./contractGenerator');
const EmailSender = require('./emailSender');
const path = require('path');

class ContractService {
  constructor() {
    this.emailSender = new EmailSender();
  }

  // Format date for display
  formatDateForDisplay(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Format vehicle details string
  formatVehicleDetails(vehicle) {
    if (!vehicle) return 'N/A';
    
    const parts = [];
    if (vehicle.make) parts.push(vehicle.make);
    if (vehicle.model) parts.push(vehicle.model);
    if (vehicle.year) parts.push(`(${vehicle.year})`);
    if (vehicle.license_plate) parts.push(`- ${vehicle.license_plate}`);
    
    return parts.length > 0 ? parts.join(' ') : 'N/A';
  }

  // Main method to generate and send contract
  async generateAndSendContract(bookingData) {
    const startTime = Date.now();
    
    try {
      console.log(`[ContractService] Starting contract generation for booking: ${bookingData.rental_id || 'N/A'}`);

      // Validate required booking data
      if (!bookingData) {
        throw new Error('Booking data is required');
      }

      // Extract and validate required fields
      const requiredFields = ['customer_email', 'customer_name', 'rental_id'];
      const missingFields = requiredFields.filter(field => !bookingData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Step 1: Prepare contract data
      console.log('[ContractService] Step 1: Preparing contract data...');
      
      const contractData = {
        rental_id: bookingData.rental_id,
        customer_name: bookingData.customer_name,
        customer_id_number: bookingData.customer_id_number || bookingData.customer_ID_number,
        customer_phone: bookingData.customer_phone || bookingData.customer_phone_msisdn,
        customer_email: bookingData.customer_email,
        customer_address: bookingData.customer_address,
        vehicle_make: bookingData.vehicle_make || (bookingData.vehicle && bookingData.vehicle.make),
        vehicle_model: bookingData.vehicle_model || (bookingData.vehicle && bookingData.vehicle.model),
        vehicle_year: bookingData.vehicle_year || (bookingData.vehicle && bookingData.vehicle.year),
        vehicle_license_plate: bookingData.vehicle_license_plate || (bookingData.vehicle && bookingData.vehicle.license_plate),
        vehicle_color: bookingData.vehicle_color || (bookingData.vehicle && bookingData.vehicle.color),
        vehicle_fuel_type: bookingData.vehicle_fuel_type || (bookingData.vehicle && bookingData.vehicle.fuel_type),
        start_date: bookingData.start_date || bookingData.pickup_date,
        end_date: bookingData.end_date || bookingData.return_date,
        duration_days: bookingData.duration_days,
        destination: bookingData.destination,
        daily_rate: bookingData.daily_rate || (bookingData.vehicle && bookingData.vehicle.daily_rate),
        total_fee_gross: bookingData.total_fee_gross || bookingData.total_amount,
        booking_date: bookingData.booking_date || new Date()
      };

      console.log(`[ContractService] Contract data prepared for rental: ${contractData.rental_id}`);

      // Step 2: Generate PDF contract
      console.log('[ContractService] Step 2: Generating PDF contract...');

      let contractPath;
      try {
        contractPath = await generateContractPDF(contractData);
        console.log(`[ContractService] ✓ PDF contract generated successfully: ${path.basename(contractPath)}`);
      } catch (error) {
        console.error('[ContractService] ✗ Error generating PDF contract:', error.message);
        throw new Error(`Failed to generate PDF contract: ${error.message}`);
      }

      // Step 3: Prepare email data
      console.log('[ContractService] Step 3: Preparing email data...');
      
      const vehicleDetails = this.formatVehicleDetails(bookingData.vehicle || {
        make: contractData.vehicle_make,
        model: contractData.vehicle_model,
        year: contractData.vehicle_year,
        license_plate: contractData.vehicle_license_plate
      });

      const emailOptions = {
        customerEmail: bookingData.customer_email,
        customerName: bookingData.customer_name,
        bookingId: bookingData.rental_id,
        vehicleDetails: vehicleDetails,
        pickupDate: contractData.start_date,
        returnDate: contractData.end_date,
        totalAmount: contractData.total_fee_gross,
        destination: contractData.destination,
        contractPath: contractPath
      };

      console.log(`[ContractService] Email data prepared for: ${emailOptions.customerEmail}`);

      // Step 4: Send email with contract attachment
      console.log('[ContractService] Step 4: Sending email with contract attachment...');
      
      let emailResult;
      try {
        emailResult = await this.emailSender.sendContract(emailOptions);
        
        if (emailResult.success) {
          console.log(`[ContractService] ✓ Email sent successfully. Message ID: ${emailResult.messageId}`);
        } else {
          console.error(`[ContractService] ✗ Email sending failed: ${emailResult.message}`);
          // Contract was generated but email failed - still return partial success
          return {
            success: false,
            contractGenerated: true,
            contractPath: contractPath,
            emailSent: false,
            emailError: emailResult.error || emailResult.message,
            message: 'Contract generated successfully but email sending failed',
            error: emailResult.error
          };
        }
      } catch (error) {
        console.error('[ContractService] ✗ Error sending email:', error.message);
        // Contract was generated but email failed - still return partial success
        return {
          success: false,
          contractGenerated: true,
          contractPath: contractPath,
          emailSent: false,
          emailError: error.message,
          message: 'Contract generated successfully but email sending failed',
          error: error.message
        };
      }

      // Step 5: Success - calculate duration
      const duration = Date.now() - startTime;
      console.log(`[ContractService] ✓ Contract generation and email sending completed in ${duration}ms`);

      // Return success result
      return {
        success: true,
        contractGenerated: true,
        contractPath: contractPath,
        emailSent: true,
        emailMessageId: emailResult.messageId,
        message: 'Contract generated and email sent successfully',
        duration: `${duration}ms`,
        bookingId: bookingData.rental_id,
        customerEmail: bookingData.customer_email
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[ContractService] ✗ Error in generateAndSendContract: ${error.message}`);
      console.error(`[ContractService] Duration: ${duration}ms`);
      
      return {
        success: false,
        contractGenerated: false,
        emailSent: false,
        message: `Contract generation failed: ${error.message}`,
        error: error.message,
        duration: `${duration}ms`
      };
    }
  }

  // Test email connection
  async testEmailConnection() {
    try {
      console.log('[ContractService] Testing email connection...');
      const result = await this.emailSender.testConnection();
      
      if (result.success) {
        console.log('[ContractService] ✓ Email connection test successful');
      } else {
        console.error('[ContractService] ✗ Email connection test failed:', result.message);
      }
      
      return result;
    } catch (error) {
      console.error('[ContractService] ✗ Error testing email connection:', error.message);
      return {
        success: false,
        message: `Email connection test failed: ${error.message}`,
        error: error.message
      };
    }
  }
}

module.exports = ContractService;

