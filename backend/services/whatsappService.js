const axios = require('axios');

/**
 * WhatsApp Business API Service
 * Integrates with WhatsApp Business API (e.g., Twilio, 360dialog, etc.)
 */
class WhatsAppService {
  constructor() {
    // Configure WhatsApp provider credentials from environment variables
    this.apiKey = process.env.WHATSAPP_API_KEY || '';
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://api.360dialog.com/v1/messages';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
  }

  /**
   * Send WhatsApp message to a single recipient
   * @param {string} phoneNumber - Phone number in format 254XXXXXXXXX
   * @param {string} message - Message content
   * @param {Array} attachments - Optional array of file attachments
   * @returns {Promise<Object>} - Response from WhatsApp provider
   */
  async sendMessage(phoneNumber, message, attachments = []) {
    try {
      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Example: 360dialog API format
      const payload = {
        to: formattedPhone,
        type: attachments.length > 0 ? 'document' : 'text',
        text: attachments.length === 0 ? { body: message } : undefined,
        document: attachments.length > 0 ? {
          link: attachments[0].url,
          filename: attachments[0].filename || 'document.pdf',
          caption: message
        } : undefined
      };

      const response = await axios.post(
        this.apiUrl,
        payload,
        {
          headers: {
            'D360-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data?.messages?.[0]?.id || null,
        status: 'sent',
        providerResponse: response.data
      };
    } catch (error) {
      console.error('WhatsApp sending error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        providerResponse: error.response?.data || null
      };
    }
  }

  /**
   * Send WhatsApp message with media (image, document, etc.)
   * @param {string} phoneNumber - Phone number
   * @param {string} message - Message text
   * @param {string} mediaUrl - URL of media file
   * @param {string} mediaType - Type: image, document, video
   * @returns {Promise<Object>} - Response
   */
  async sendMediaMessage(phoneNumber, message, mediaUrl, mediaType = 'document') {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const payload = {
        to: formattedPhone,
        type: mediaType,
        [mediaType]: {
          link: mediaUrl,
          caption: message
        }
      };

      const response = await axios.post(
        this.apiUrl,
        payload,
        {
          headers: {
            'D360-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data?.messages?.[0]?.id || null,
        status: 'sent',
        providerResponse: response.data
      };
    } catch (error) {
      console.error('WhatsApp media sending error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        providerResponse: error.response?.data || null
      };
    }
  }

  /**
   * Send bulk WhatsApp messages
   * @param {Array<string>} phoneNumbers - Array of phone numbers
   * @param {string} message - Message content
   * @returns {Promise<Object>} - Response with success/failure counts
   */
  async sendBulkMessages(phoneNumbers, message) {
    try {
      const results = {
        total: phoneNumbers.length,
        successful: 0,
        failed: 0,
        details: []
      };

      // Send message to each recipient
      for (const phoneNumber of phoneNumbers) {
        const result = await this.sendMessage(phoneNumber, message);
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
      console.error('Bulk WhatsApp error:', error);
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

module.exports = new WhatsAppService();
