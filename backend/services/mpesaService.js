const axios = require('axios');
const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const Rental = require('../models/Rental');

class MpesaService {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.shortcode = process.env.MPESA_SHORTCODE;
    this.passkey = process.env.MPESA_PASSKEY;
    this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
    this.baseUrl = this.environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Get access token
  async getAccessToken() {
    try {
      // Check if token is still valid
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.accessToken;
      }

      const url = `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`;
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      this.accessToken = response.data.access_token;
      // Set expiry to 55 minutes (tokens expire in 1 hour)
      this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting M-Pesa access token:', error.response?.data || error.message);
      throw new Error('Failed to get M-Pesa access token');
    }
  }

  // Generate password for API calls
  generatePassword() {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');
    return { password, timestamp };
  }

  // C2B STK Push - Initiate payment request
  async initiateSTKPush(phoneNumber, amount, accountReference, description) {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();
      
      // Format phone number (254XXXXXXXXX)
      const formattedPhone = phoneNumber.startsWith('0') 
        ? `254${phoneNumber.substring(1)}` 
        : phoneNumber;

      const url = `${this.baseUrl}/mpesa/stkpush/v1/processrequest`;
      
      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: this.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: accountReference,
        TransactionDesc: description
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        checkoutRequestID: response.data.CheckoutRequestID,
        customerMessage: response.data.CustomerMessage,
        responseCode: response.data.ResponseCode
      };
    } catch (error) {
      console.error('Error initiating STK Push:', error.response?.data || error.message);
      throw new Error('Failed to initiate M-Pesa payment');
    }
  }

  // B2C - Send money to customer/owner/driver
  async sendB2C(phoneNumber, amount, remarks, occasion) {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();
      
      // Format phone number
      const formattedPhone = phoneNumber.startsWith('0') 
        ? `254${phoneNumber.substring(1)}` 
        : phoneNumber;

      const url = `${this.baseUrl}/mpesa/b2c/v1/paymentrequest`;
      
      const payload = {
        InitiatorName: process.env.MPESA_INITIATOR_NAME || 'testapi',
        SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL || '',
        CommandID: 'SalaryPayment',
        Amount: amount,
        PartyA: this.shortcode,
        PartyB: formattedPhone,
        Remarks: remarks,
        QueueTimeOutURL: `${process.env.MPESA_CALLBACK_URL}/b2c-timeout`,
        ResultURL: `${process.env.MPESA_CALLBACK_URL}/b2c-result`,
        Occasion: occasion
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        conversationID: response.data.ConversationID,
        originatorConversationID: response.data.OriginatorConversationID,
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription
      };
    } catch (error) {
      console.error('Error sending B2C:', error.response?.data || error.message);
      throw new Error('Failed to send B2C payment');
    }
  }

  // Bill Manager API - Create invoice
  async createBill(invoiceData) {
    try {
      const accessToken = await this.getAccessToken();
      
      const url = `${this.baseUrl}/v1/billmanager-invoice/invoice`;
      
      const payload = {
        externalReference: invoiceData.accountReference,
        billedFullName: invoiceData.customerName,
        billedPhoneNumber: invoiceData.phoneNumber,
        billedPeriod: invoiceData.billingPeriod,
        invoiceName: invoiceData.invoiceName,
        dueDate: invoiceData.dueDate,
        amount: invoiceData.amount,
        accountReference: invoiceData.accountReference
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        invoiceID: response.data.invoiceID,
        status: response.data.status
      };
    } catch (error) {
      console.error('Error creating bill:', error.response?.data || error.message);
      throw new Error('Failed to create bill');
    }
  }

  // Handle M-Pesa callback
  async handleCallback(callbackData) {
    try {
      const { Body } = callbackData;
      const stkCallback = Body.stkCallback;
      
      if (stkCallback.ResultCode === 0) {
        // Payment successful
        const metadata = stkCallback.CallbackMetadata?.Item || [];
        const amount = metadata.find(item => item.Name === 'Amount')?.Value;
        const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
        const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;
        const transactionDate = metadata.find(item => item.Name === 'TransactionDate')?.Value;
        
        // Find transaction by checkout request ID
        const checkoutRequestID = stkCallback.CheckoutRequestID;
        
        // Update rental payment status
        // This would typically involve finding the rental by account reference
        // and updating its payment status
        
        return {
          success: true,
          mpesaReceiptNumber,
          amount,
          phoneNumber,
          transactionDate
        };
      } else {
        // Payment failed
        return {
          success: false,
          errorCode: stkCallback.ResultCode,
          errorMessage: stkCallback.ResultDesc
        };
      }
    } catch (error) {
      console.error('Error handling M-Pesa callback:', error);
      throw error;
    }
  }
}

module.exports = new MpesaService();

