const express = require('express');
const router = express.Router();
const Rental = require('../models/Rental');
const Vehicle = require('../models/Vehicle');
const Customer = require('../models/Customer');
const { protect, authorize } = require('../middleware/auth');
const ContractService = require('../utils/contractService');
const EmailSender = require('../utils/emailSender');

const emailSender = new EmailSender();

// @route   GET /api/rentals
// @desc    Get all rentals
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, payment_status, hire_type, start_date, end_date } = req.query;
    const query = {};

    if (status) query.rental_status = status;
    if (payment_status) query.payment_status = payment_status;
    if (hire_type) query.hire_type = hire_type;
    if (start_date || end_date) {
      query.start_date = {};
      if (start_date) query.start_date.$gte = new Date(start_date);
      if (end_date) query.start_date.$lte = new Date(end_date);
    }

    // Drivers can only see their own rentals
    if (req.user.role === 'Driver') {
      query.driver_assigned = req.user._id;
    }

    const rentals = await Rental.find(query)
      .populate('vehicle_ref')
      .populate('customer_ref')
      .populate('driver_assigned', 'name phone_msisdn')
      .populate('broker_ref')
      .sort({ booking_date: -1 });

    res.json({
      success: true,
      count: rentals.length,
      data: rentals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/rentals/:id
// @desc    Get single rental
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate('vehicle_ref')
      .populate('customer_ref')
      .populate('driver_assigned')
      .populate('broker_ref')
      .populate('contract_ref');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    // Drivers can only see their own rentals
    if (req.user.role === 'Driver' && rental.driver_assigned?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this rental'
      });
    }

    res.json({
      success: true,
      data: rental
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/rentals
// @desc    Create new rental (handles customer creation internally)
// @access  Private (Admin, Driver)
router.post('/', protect, authorize('Admin', 'Driver'), async (req, res) => {
  try {
    const { 
      vehicle_ref, 
      customer_ref, 
      start_date, 
      end_date, 
      destination, 
      hire_type, 
      broker_ref, 
      broker_commission_rate,
      // Customer data from form (for contract generation and creation)
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      customer_id_number
    } = req.body;

    // Validate required fields
    if (!vehicle_ref) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle selection is required'
      });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Validate date logic
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Find or create customer if customer_ref is not provided but customer data is
    let finalCustomerRef = customer_ref;
    if (!finalCustomerRef && customer_phone) {
      try {
        // Try to find existing customer by phone
        const existingCustomer = await Customer.findOne({ phone: customer_phone });
        
        if (existingCustomer) {
          finalCustomerRef = existingCustomer._id;
          // Update customer info if provided
          if (customer_email && !existingCustomer.email) {
            existingCustomer.email = customer_email;
            await existingCustomer.save();
          }
          if (customer_name && existingCustomer.name !== customer_name) {
            existingCustomer.name = customer_name;
            await existingCustomer.save();
          }
        } else {
          // Create new customer (allowed during hire-out process)
          const newCustomer = await Customer.create({
            name: customer_name,
            phone: customer_phone,
            email: customer_email || '',
            ID_number: customer_id_number || '',
            contact_details: {
              address: customer_address || 'Nairobi'
            }
          });
          finalCustomerRef = newCustomer._id;
          console.log('[Rental Creation] Created new customer:', newCustomer._id);
        }
      } catch (customerError) {
        console.error('[Rental Creation] Error finding/creating customer:', customerError);
        return res.status(400).json({
          success: false,
          message: `Failed to process customer information: ${customerError.message}`
        });
      }
    }

    // Validate customer_ref exists
    if (!finalCustomerRef) {
      return res.status(400).json({
        success: false,
        message: 'Customer information is required. Please provide customer_ref or customer details (name, phone, email).'
      });
    }

    // Check vehicle availability
    const vehicle = await Vehicle.findById(vehicle_ref);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    if (vehicle.availability_status !== 'Parking') {
      return res.status(400).json({
        success: false,
        message: `Vehicle is not available for rental. Current status: ${vehicle.availability_status}`
      });
    }

    // Calculate duration and total fee (dates already validated above)
    const duration_days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    // Apply dynamic pricing if seasons are configured
    const PricingSeason = require('../models/PricingSeason');
    let rateModifier = 1.0;
    try {
      rateModifier = await PricingSeason.getRateModifierForDate(start, vehicle.category);
    } catch (error) {
      console.error('Error getting rate modifier:', error);
    }
    
    const total_fee_gross = vehicle.daily_rate * duration_days * rateModifier;

    // Create rental
    const rentalData = {
      vehicle_ref,
      customer_ref: finalCustomerRef,
      start_date: start,
      end_date: end,
      duration_days,
      destination,
      total_fee_gross,
      hire_type: hire_type || 'Direct Client',
      broker_ref,
      broker_commission_rate: broker_commission_rate || 0
    };

    // Use customer data from form if provided, otherwise fetch from database
    let contractCustomerName = customer_name || '';
    let contractCustomerEmail = customer_email || '';
    let contractCustomerPhone = customer_phone || '';
    let contractCustomerAddress = customer_address || 'Nairobi';
    let contractCustomerIdNumber = customer_id_number || '';

    // Fetch customer if we need additional data
    const customer = await Customer.findById(finalCustomerRef);
    if (customer) {
      // Use form data if provided, otherwise use customer data
      contractCustomerName = contractCustomerName || customer.name || '';
      contractCustomerEmail = contractCustomerEmail || customer.email || '';
      contractCustomerPhone = contractCustomerPhone || customer.phone || '';
      contractCustomerAddress = contractCustomerAddress || customer.contact_details?.address || 'Nairobi';
      contractCustomerIdNumber = contractCustomerIdNumber || customer.ID_number || '';
    }

    // Create rental with all customer details included
    const rentalDataWithCustomer = {
      ...rentalData,
      customer_name: contractCustomerName,
      customer_email: contractCustomerEmail,
      customer_phone: contractCustomerPhone,
      customer_address: contractCustomerAddress,
      customer_id_number: contractCustomerIdNumber
    };

    // Calculate broker commission before creating rental
    let brokerCommission = 0;
    let brokerCommissionRate = broker_commission_rate || 0;
    if (broker_ref && brokerCommissionRate > 0) {
      brokerCommission = total_fee_gross * (brokerCommissionRate / 100);
    }

    // Create rental with all data including broker commission
    const rentalDataWithAll = {
      ...rentalDataWithCustomer,
      broker_commission_rate: brokerCommissionRate,
      broker_commission_amount: brokerCommission
    };

    const rental = await Rental.create(rentalDataWithAll);

    // Update vehicle status using findOneAndUpdate to avoid race conditions
    await Vehicle.findByIdAndUpdate(
      vehicle_ref,
      { availability_status: 'Rented Out' },
      { new: true }
    );

    // Update customer history (if customer exists)
    if (customer) {
      try {
        await customer.addRentalToHistory({
          rental_id: rental._id,
          rental_date: rental.booking_date,
          vehicle_model: `${vehicle.make} ${vehicle.model}`,
          duration_days: rental.duration_days,
          total_fee: rental.total_fee_gross
        });
      } catch (historyError) {
        console.error('[Rental Creation] Error updating customer history:', historyError);
        // Don't fail rental creation if history update fails
      }
    }

    // Populate rental with vehicle and customer for contract generation
    await rental.populate('vehicle_ref');
    await rental.populate('customer_ref');

    // Automatically generate and send contract if customer email is provided
    let contractResult = null;
    let contractError = null;
    
    if (contractCustomerEmail && contractCustomerName) {
      try {
        // Validate required fields for contract
        if (!contractCustomerEmail || !contractCustomerName || !rental.rental_id) {
          throw new Error('Missing required fields for contract generation');
        }

        // Prepare booking data for contract service
        const bookingData = {
          rental_id: rental.rental_id,
          customer_name: contractCustomerName,
          customer_email: contractCustomerEmail,
          customer_phone: contractCustomerPhone,
          customer_phone_msisdn: contractCustomerPhone,
          customer_address: contractCustomerAddress,
          customer_id_number: contractCustomerIdNumber,
          vehicle: {
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            license_plate: vehicle.license_plate,
            color: vehicle.color || 'N/A',
            fuel_type: vehicle.fuel_type || 'N/A',
            daily_rate: vehicle.daily_rate
          },
          start_date: rental.start_date,
          end_date: rental.end_date,
          duration_days: rental.duration_days,
          destination: rental.destination || '',
          daily_rate: vehicle.daily_rate,
          total_fee_gross: rental.total_fee_gross,
          booking_date: rental.booking_date
        };

        console.log('[Rental Creation] Generating contract for rental:', rental.rental_id);
        const contractService = new ContractService();
        contractResult = await contractService.generateAndSendContract(bookingData);

        // Update rental with contract information (use findOneAndUpdate to avoid duplicate save)
        if (contractResult.success && contractResult.contractPath) {
          await Rental.findByIdAndUpdate(
            rental._id,
            {
              contract_url: contractResult.contractPath,
              contract_generated_at: new Date(),
              contract_sent_via_email: contractResult.emailSent || false
            },
            { new: true }
          );
          console.log('[Rental Creation] Contract generated and sent successfully');
        } else {
          console.warn('[Rental Creation] Contract generation failed:', contractResult.message);
          contractError = contractResult.message || 'Contract generation failed';
        }
      } catch (contractErr) {
        console.error('[Rental Creation] Error generating contract:', contractErr);
        contractError = contractErr.message || 'Failed to generate contract';
        contractResult = {
          success: false,
          error: contractError,
          contractGenerated: false,
          emailSent: false
        };
      }
    } else {
      console.log('[Rental Creation] Skipping contract generation - customer email or name not provided');
    }

    res.status(201).json({
      success: true,
      message: contractResult?.success 
        ? `Vehicle hired out successfully! Contract sent to ${contractCustomerEmail}`
        : contractError
          ? `Vehicle hired out successfully, but contract could not be sent: ${contractError}`
          : 'Vehicle hired out successfully!',
      data: rental,
      contract: {
        generated: contractResult?.contractGenerated || false,
        sent: contractResult?.emailSent || false,
        email: contractCustomerEmail || null,
        message: contractResult?.message || contractError || null,
        error: contractError || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/rentals/:id
// @desc    Update rental
// @access  Private (Admin)
router.put('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const rental = await Rental.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    res.json({
      success: true,
      data: rental
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/rentals/:id/handover
// @desc    Record vehicle handover (delivery or pickup)
// @access  Private (Driver, Admin)
router.post('/:id/handover', protect, async (req, res) => {
  try {
    const { type, ...handoverData } = req.body; // type: 'delivery' or 'pickup'
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    // Drivers can only update their assigned rentals
    if (req.user.role === 'Driver' && rental.driver_assigned?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this rental'
      });
    }

    if (type === 'delivery') {
      rental.handover_data.delivery = {
        ...handoverData,
        date: new Date(),
        driver_id: req.user._id
      };
      rental.actual_start_date = new Date();
      rental.rental_status = 'Active';
    } else if (type === 'pickup') {
      rental.handover_data.pickup = {
        ...handoverData,
        date: new Date(),
        driver_id: req.user._id
      };
      rental.actual_end_date = new Date();
      rental.rental_status = 'Completed';

      // Update vehicle status
      const vehicle = await Vehicle.findById(rental.vehicle_ref);
      if (vehicle) {
        vehicle.availability_status = 'Parking';
        vehicle.last_odometer_reading = handoverData.odometer_reading;
        await vehicle.save();
      }
    }

    await rental.save();

    res.json({
      success: true,
      data: rental
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/rentals/:id/extend
// @desc    Extend rental period
// @access  Private (Driver, Admin)
router.put('/:id/extend', protect, async (req, res) => {
  try {
    const { extension_days, payment_status, notes } = req.body;
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    // Drivers can only extend their assigned rentals
    if (req.user.role === 'Driver' && rental.driver_assigned?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to extend this rental'
      });
    }

    if (rental.rental_status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Can only extend active rentals'
      });
    }

    // Extend end date
    const originalEndDate = new Date(rental.end_date);
    const newEndDate = new Date(originalEndDate);
    newEndDate.setDate(newEndDate.getDate() + (extension_days || 0));
    rental.end_date = newEndDate;
    rental.duration_days = rental.duration_days + (extension_days || 0);

    // Update payment status if provided
    if (payment_status) {
      rental.payment_status = payment_status;
    }

    // Add extension note
    if (notes) {
      rental.notes = rental.notes ? `${rental.notes}\nExtension: ${notes}` : `Extension: ${notes}`;
    }

    // Recalculate total fee if needed
    const vehicle = await Vehicle.findById(rental.vehicle_ref);
    let additionalFee = 0;
    if (vehicle) {
      const additionalDays = extension_days || 0;
      additionalFee = vehicle.daily_rate * additionalDays;
      rental.total_fee_gross = (rental.total_fee_gross || 0) + additionalFee;
    }

    await rental.save();

    // Send extension confirmation email (non-blocking for main flow)
    (async () => {
      try {
        const extensionData = {
          newReturnDate: rental.end_date,
          originalReturnDate: originalEndDate,
          additionalDays: extension_days || 0,
          additionalCost: additionalFee,
          newTotalCost: rental.total_fee_gross || 0
        };

        // Ensure minimal customer fields for email sender
        if (!rental.customer_email && rental.customer_ref) {
          rental.customer_name = rental.customer_ref.name;
          rental.customer_email = rental.customer_ref.email;
          rental.customer_phone = rental.customer_ref.phone;
        }

        await emailSender.sendExtensionConfirmation(rental, extensionData);
        console.log(
          `✅ Extension confirmation email sent to ${rental.customer_email || rental.customer_ref?.email}`
        );
      } catch (err) {
        console.error('❌ Failed to send extension confirmation email:', err.message);
      }
    })();

    res.json({
      success: true,
      data: rental,
      message: `Rental extended by ${extension_days} days`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/rentals/:id/send-contract
// @desc    Generate and send contract for a rental
// @access  Private (Admin)
router.post('/:id/send-contract', protect, authorize('Admin'), async (req, res) => {
  try {
    // Find rental and populate related data
    const rental = await Rental.findById(req.params.id)
      .populate('vehicle_ref')
      .populate('customer_ref');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    // Check if vehicle exists
    if (!rental.vehicle_ref) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle not found for this rental'
      });
    }

    // Check if customer exists
    if (!rental.customer_ref) {
      return res.status(400).json({
        success: false,
        message: 'Customer not found for this rental'
      });
    }

    const customer = rental.customer_ref;
    const vehicle = rental.vehicle_ref;

    // Validate customer has email address
    if (!customer.email) {
      return res.status(400).json({
        success: false,
        message: 'Customer email address is required to send contract. Please update customer profile with email address.'
      });
    }

    // Prepare customer details in rental for contract generation
    rental.customer_name = customer.name;
    rental.customer_email = customer.email;
    rental.customer_phone = customer.phone;
    rental.customer_address = customer.contact_details?.address || '';
    rental.customer_id_number = customer.ID_number;

    // Prepare booking data for contract service
    const bookingData = {
      rental_id: rental.rental_id,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      customer_phone_msisdn: customer.phone,
      customer_address: customer.contact_details?.address || '',
      customer_id_number: customer.ID_number,
      vehicle: {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        license_plate: vehicle.license_plate,
        color: vehicle.color || 'N/A',
        fuel_type: vehicle.fuel_type || 'N/A',
        daily_rate: vehicle.daily_rate
      },
      start_date: rental.start_date,
      end_date: rental.end_date,
      duration_days: rental.duration_days,
      destination: rental.destination,
      daily_rate: vehicle.daily_rate,
      total_fee_gross: rental.total_fee_gross,
      booking_date: rental.booking_date
    };

    // Generate and send contract
    const contractService = new ContractService();
    const contractResult = await contractService.generateAndSendContract(bookingData);

    if (!contractResult.success) {
      return res.status(500).json({
        success: false,
        message: contractResult.message || 'Failed to generate and send contract',
        error: contractResult.error,
        contractGenerated: contractResult.contractGenerated || false,
        emailSent: contractResult.emailSent || false
      });
    }

    // Update rental with contract information
    rental.contract_url = contractResult.contractPath;
    rental.contract_generated_at = new Date();
    rental.contract_sent_via_email = contractResult.emailSent;
    await rental.save();

    res.json({
      success: true,
      message: 'Contract generated and sent successfully',
      data: {
        rental_id: rental.rental_id,
        contract_url: contractResult.contractPath,
        contract_generated_at: rental.contract_generated_at,
        email_sent: contractResult.emailSent,
        email_message_id: contractResult.emailMessageId,
        customer_email: customer.email
      }
    });
  } catch (error) {
    console.error('Error in send-contract endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating and sending contract',
      error: error.message
    });
  }
});

// @route   PUT /api/rentals/:id/return
// @desc    Mark vehicle as returned
// @access  Private (Driver, Admin)
router.put('/:id/return', protect, async (req, res) => {
  try {
    const { payment_status, notes } = req.body;
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    // Drivers can only return their assigned rentals
    if (req.user.role === 'Driver' && rental.driver_assigned?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to return this rental'
      });
    }

    if (rental.rental_status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Rental is already completed'
      });
    }

    // Mark as completed
    rental.rental_status = 'Completed';
    rental.actual_end_date = new Date();

    // Update payment status if provided
    if (payment_status) {
      rental.payment_status = payment_status;
    }

    // Add return note
    if (notes) {
      rental.notes = rental.notes ? `${rental.notes}\nReturn: ${notes}` : `Return: ${notes}`;
    }

    // Update vehicle status
    const vehicle = await Vehicle.findById(rental.vehicle_ref);
    if (vehicle) {
      vehicle.availability_status = 'Parking';
      await vehicle.save();
    }

    await rental.save();

    // After successful return, send thank-you email (fire-and-forget)
    (async () => {
      try {
        const populatedRental = await Rental.findById(rental._id).populate('vehicle_ref');
        if (!populatedRental) return;

        // Ensure flat customer fields
        if (!populatedRental.customer_email && populatedRental.customer_ref) {
          populatedRental.customer_name = populatedRental.customer_ref.name;
          populatedRental.customer_email = populatedRental.customer_ref.email;
          populatedRental.customer_phone = populatedRental.customer_ref.phone;
        }

        await emailSender.sendThankYouEmail(populatedRental);
        console.log(
          `✅ Thank-you email sent to ${populatedRental.customer_email || populatedRental.customer_ref?.email}`
        );
      } catch (err) {
        console.error('❌ Failed to send thank-you email:', err.message);
      }
    })();

    res.json({
      success: true,
      data: rental,
      message: 'Vehicle marked as returned successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/rentals/:id/send-email
// @desc    Manually trigger reminder / thank-you emails for a rental
// @access  Private (Admin)
router.post('/:id/send-email', protect, authorize('Admin'), async (req, res) => {
  try {
    const { emailType } = req.body;
    if (!emailType) {
      return res.status(400).json({
        success: false,
        message: 'emailType is required'
      });
    }

    const rental = await Rental.findById(req.params.id)
      .populate('vehicle_ref')
      .populate('customer_ref');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    // Ensure flat customer fields
    if (!rental.customer_email && rental.customer_ref) {
      rental.customer_name = rental.customer_ref.name;
      rental.customer_email = rental.customer_ref.email;
      rental.customer_phone = rental.customer_ref.phone;
    }

    let result;
    switch (emailType) {
      case 'return_reminder_24h':
        result = await emailSender.sendReturnReminder24Hours(rental);
        break;
      case 'return_reminder_morning':
        result = await emailSender.sendReturnReminderMorning(rental);
        break;
      case 'thank_you':
        result = await emailSender.sendThankYouEmail(rental);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid emailType'
        });
    }

    if (!result?.success) {
      return res.status(500).json({
        success: false,
        message: result?.error || 'Failed to send email'
      });
    }

    res.json({
      success: true,
      message: `Email (${emailType}) sent successfully to ${rental.customer_email}`,
      emailType
    });
  } catch (error) {
    console.error('Error sending manual rental email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

module.exports = router;

