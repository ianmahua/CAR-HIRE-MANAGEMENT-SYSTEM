const STKPushLog = require('../models/STKPushLog');
const axios = require('axios');
const crypto = require('crypto');

// Generate Daraja API access token
const getAccessToken = async () => {
  try {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};

// Generate password for STK push
const generatePassword = (shortcode, passkey, timestamp) => {
  const data = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(data).toString('base64');
};

// Initiate STK Push
const initiateSTKPush = async (stkPushData) => {
  const {
    customer_ref,
    vehicle_ref,
    rental_ref,
    driver_ref,
    amount,
    phone_number
  } = stkPushData;

  try {
    // Create STK push log entry
    const stkPushLog = new STKPushLog({
      customer_ref,
      vehicle_ref,
      rental_ref,
      driver_ref,
      amount,
      phone_number,
      status: 'Pending'
    });

    await stkPushLog.save();

    // Get access token
    const accessToken = await getAccessToken();

    // Prepare STK push request
    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY;
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = generatePassword(shortcode, passkey, timestamp);
    const callbackUrl = process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/api/mpesa/stk-callback';

    const stkPushRequest = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone_number,
      PartyB: shortcode,
      PhoneNumber: phone_number,
      CallBackURL: callbackUrl,
      AccountReference: `RENTAL-${rental_ref || 'DIRECT'}`,
      TransactionDesc: `Vehicle Rental Payment - ${vehicle_ref || 'Direct Payment'}`
    };

    // Make STK push request
    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      stkPushRequest,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Update STK push log
    stkPushLog.status = 'Initiated';
    stkPushLog.checkout_request_id = response.data.CheckoutRequestID;
    stkPushLog.merchant_request_id = response.data.MerchantRequestID;
    await stkPushLog.save();

    return {
      success: true,
      checkoutRequestID: response.data.CheckoutRequestID,
      merchantRequestID: response.data.MerchantRequestID,
      stkPushLog
    };
  } catch (error) {
    console.error('STK Push error:', error);
    
    // Update log with error
    if (stkPushLog) {
      stkPushLog.status = 'Failed';
      stkPushLog.error_message = error.message;
      await stkPushLog.save();
    }

    return {
      success: false,
      error: error.message
    };
  }
};

// Handle STK push callback
const handleSTKCallback = async (callbackData) => {
  try {
    const {
      Body: {
        stkCallback: {
          CheckoutRequestID,
          ResultCode,
          ResultDesc,
          CallbackMetadata
        }
      }
    } = callbackData;

    // Find STK push log
    const stkPushLog = await STKPushLog.findOne({
      checkout_request_id: CheckoutRequestID
    });

    if (!stkPushLog) {
      throw new Error('STK push log not found');
    }

    // Update log with callback data
    stkPushLog.callback_received = true;
    stkPushLog.result_code = ResultCode.toString();
    stkPushLog.result_desc = ResultDesc;

    if (CallbackMetadata && CallbackMetadata.Item) {
      const items = CallbackMetadata.Item;
      const receiptNumber = items.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = items.find(item => item.Name === 'TransactionDate')?.Value;

      if (receiptNumber) {
        stkPushLog.mpesa_receipt_number = receiptNumber;
      }
      if (transactionDate) {
        stkPushLog.transaction_date = new Date(transactionDate);
      }
    }

    // Update status based on result code
    if (ResultCode === 0) {
      stkPushLog.status = 'Completed';
    } else {
      stkPushLog.status = 'Failed';
    }

    // Store full callback data
    const callbackMap = new Map();
    Object.keys(callbackData).forEach(key => {
      callbackMap.set(key, callbackData[key]);
    });
    stkPushLog.callback_data = callbackMap;

    await stkPushLog.save();

    return {
      success: ResultCode === 0,
      stkPushLog
    };
  } catch (error) {
    console.error('Error handling STK callback:', error);
    throw error;
  }
};

// Get STK push history
const getSTKPushHistory = async (filters = {}) => {
  const query = {};
  if (filters.driver_ref) query.driver_ref = filters.driver_ref;
  if (filters.customer_ref) query.customer_ref = filters.customer_ref;
  if (filters.status) query.status = filters.status;
  if (filters.startDate || filters.endDate) {
    query.created_at = {};
    if (filters.startDate) query.created_at.$gte = new Date(filters.startDate);
    if (filters.endDate) query.created_at.$lte = new Date(filters.endDate);
  }

  return await STKPushLog.find(query)
    .populate('customer_ref', 'name phone email')
    .populate('driver_ref', 'name email')
    .populate('vehicle_ref', 'make model license_plate')
    .populate('rental_ref')
    .sort({ created_at: -1 });
};

module.exports = {
  initiateSTKPush,
  handleSTKCallback,
  getSTKPushHistory
};







