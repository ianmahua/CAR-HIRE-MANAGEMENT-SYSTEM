const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.apiKey = process.env.WHATSAPP_API_KEY;
    this.apiUrl = process.env.WHATSAPP_API_URL;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  }

  // Send contract via WhatsApp
  async sendContract(phoneNumber, contractUrl, contractId) {
    try {
      const message = `Hello! Please review and sign your rental agreement.\n\nContract Link: ${contractUrl}\n\nContract ID: ${contractId}\n\nPlease click the link to sign digitally.`;

      const response = await axios.post(
        `${this.apiUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0]?.id
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error.response?.data || error.message);
      throw new Error('Failed to send WhatsApp message');
    }
  }

  // Send payment reminder via WhatsApp
  async sendPaymentReminder(phoneNumber, rentalId, amount, dueDate) {
    try {
      const message = `Payment Reminder\n\nRental ID: ${rentalId}\nAmount Due: KES ${amount.toLocaleString()}\nDue Date: ${new Date(dueDate).toLocaleDateString()}\n\nPlease make payment via M-Pesa.`;

      const response = await axios.post(
        `${this.apiUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0]?.id
      };
    } catch (error) {
      console.error('Error sending WhatsApp reminder:', error.response?.data || error.message);
      throw new Error('Failed to send WhatsApp reminder');
    }
  }

  // Send contract signing reminder
  async sendContractReminder(phoneNumber, contractUrl, contractId) {
    try {
      const message = `Reminder: Please sign your rental agreement.\n\nContract Link: ${contractUrl}\n\nContract ID: ${contractId}\n\nYour signature is required to proceed with the rental.`;

      const response = await axios.post(
        `${this.apiUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0]?.id
      };
    } catch (error) {
      console.error('Error sending WhatsApp contract reminder:', error.response?.data || error.message);
      throw new Error('Failed to send WhatsApp contract reminder');
    }
  }
}

module.exports = new WhatsAppService();

