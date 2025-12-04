const axios = require('axios');

/**
 * Bulk SMS Service
 * Integrates with SMS gateway APIs (e.g., Africa's Talking, Twilio, etc.)
 */
class SMSService {
  constructor() {
    // Configure SMS provider credentials from environment variables
    this.apiKey = process.env.SMS_API_KEY || '';
    this.apiUrl = process.env.SMS_API_URL || 'https://api.africastalking.com/version1/messaging';
    this.senderId = process.env.SMS_SENDER_ID || 'RESSEY';
    this.username = process.env.SMS_USERNAME || '';
  }

  /**
   * Send SMS to a single recipient
   * @param {string} phoneNumber - Phone number in format 254XXXXXXXXX
   * @param {string} message - Message content
   * @returns {Promise<Object>} - Response from SMS provider
   */
  async sendSMS(phoneNumber, message) {
    try {
      // Format phone number if needed
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Example: Africa's Talking API
      const response = await axios.post(
        this.apiUrl,
        {
          username: this.username,
          to: formattedPhone,
          message: message,
          from: this.senderId
        },
        {
          headers: {
            'ApiKey': this.apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data?.SMSMessageData?.Recipients?.[0]?.messageId || null,
        status: response.data?.SMSMessageData?.Recipients?.[0]?.status || 'Sent',
        cost: response.data?.SMSMessageData?.Recipients?.[0]?.cost || null,
        providerResponse: response.data
      };
    } catch (error) {
      console.error('SMS sending error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        providerResponse: error.response?.data || null
      };
    }
  }

  /**
   * Send bulk SMS to multiple recipients
   * @param {Array<string>} phoneNumbers - Array of phone numbers
   * @param {string} message - Message content
   * @returns {Promise<Object>} - Response with success/failure counts
   */
  async sendBulkSMS(phoneNumbers, message) {
    try {
      const results = {
        total: phoneNumbers.length,
        successful: 0,
        failed: 0,
        details: []
      };

      // Send SMS to each recipient
      for (const phoneNumber of phoneNumbers) {
        const result = await this.sendSMS(phoneNumber, message);
        if (result.success) {
          results.successful++;
        } else {
          results.failed++;
        }
        results.details.push({
          phoneNumber,
          ...result
        });
      }

      return results;
    } catch (error) {
      console.error('Bulk SMS error:', error);
      return {
        success: false,
        error: error.message,
        total: phoneNumbers.length,
        successful: 0,
        failed: phoneNumbers.length
      };
    }
  }

  /**
   * Format phone number to standard format (254XXXXXXXXX)
   * @param {string} phoneNumber - Phone number in any format
   * @returns {string} - Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // If starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }

    // If doesn't start with 254, add it
    if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }

    return cleaned;
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} - True if valid
   */
  isValidPhoneNumber(phoneNumber) {
    const formatted = this.formatPhoneNumber(phoneNumber);
    return /^254\d{9}$/.test(formatted);
  }
}

module.exports = new SMSService();











