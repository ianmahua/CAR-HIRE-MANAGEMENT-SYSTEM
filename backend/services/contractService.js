const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const Contract = require('../models/Contract');
const Rental = require('../models/Rental');
const VehicleOwner = require('../models/VehicleOwner');
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const axios = require('axios');

class ContractService {
  constructor() {
    this.esignatureApiKey = process.env.ESIGNATURE_API_KEY;
    this.esignatureApiUrl = process.env.ESIGNATURE_API_URL;
    this.contractsDir = path.join(__dirname, '../uploads/contracts');
    this.ensureContractsDir();
  }

  async ensureContractsDir() {
    try {
      await fs.mkdir(this.contractsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating contracts directory:', error);
    }
  }

  // Generate Rental Agreement PDF
  async generateRentalAgreement(rentalId) {
    try {
      const rental = await Rental.findById(rentalId)
        .populate('customer_ref')
        .populate('vehicle_ref')
        .populate('driver_assigned');

      if (!rental) {
        throw new Error('Rental not found');
      }

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4 size
      const { width, height } = page.getSize();

      let yPosition = height - 50;
      const fontSize = 12;
      const lineHeight = 20;

      // Title
      page.drawText('CAR RENTAL AGREEMENT', {
        x: 50,
        y: yPosition,
        size: 18,
        color: rgb(0, 0, 0),
      });
      yPosition -= 40;

      // Contract Details
      const contractDetails = [
        `Contract ID: ${rental.rental_id}`,
        `Date: ${new Date(rental.booking_date).toLocaleDateString()}`,
        '',
        'CUSTOMER INFORMATION:',
        `Name: ${rental.customer_ref.name}`,
        `ID Number: ${rental.customer_ref.ID_number}`,
        `Phone: ${rental.customer_ref.phone}`,
        `Email: ${rental.customer_ref.email || 'N/A'}`,
        '',
        'VEHICLE INFORMATION:',
        `Model: ${rental.vehicle_ref.make} ${rental.vehicle_ref.model}`,
        `License Plate: ${rental.vehicle_ref.license_plate}`,
        `Category: ${rental.vehicle_ref.category}`,
        '',
        'RENTAL TERMS:',
        `Start Date: ${new Date(rental.start_date).toLocaleDateString()}`,
        `End Date: ${new Date(rental.end_date).toLocaleDateString()}`,
        `Duration: ${rental.duration_days} days`,
        `Destination: ${rental.destination}`,
        `Total Fee: KES ${rental.total_fee_gross.toLocaleString()}`,
        '',
        'TERMS AND CONDITIONS:',
        '1. The vehicle must be returned in the same condition as received.',
        '2. Any damages will be charged to the customer.',
        '3. Late returns are subject to additional charges.',
        '4. The customer is responsible for fuel costs.',
        '5. Insurance coverage is as per the rental agreement.',
        '',
        'By signing below, both parties agree to the terms and conditions stated above.',
      ];

      // Draw contract text
      contractDetails.forEach((line) => {
        if (yPosition < 50) {
          // Add new page if needed
          const newPage = pdfDoc.addPage([595, 842]);
          yPosition = height - 50;
        }
        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      });

      // Signature sections
      yPosition -= 40;
      page.drawText('Customer Signature: _________________', {
        x: 50,
        y: yPosition,
        size: fontSize,
      });
      yPosition -= 30;
      page.drawText('Date: _________________', {
        x: 50,
        y: yPosition,
        size: fontSize,
      });

      yPosition -= 40;
      page.drawText('THE RESSEY TOURS AND CAR HIRE', {
        x: 50,
        y: yPosition,
        size: fontSize,
      });
      yPosition -= 30;
      page.drawText('Authorized Signature: _________________', {
        x: 50,
        y: yPosition,
        size: fontSize,
      });

      // Save PDF
      const pdfBytes = await pdfDoc.save();
      const fileName = `rental_agreement_${rental.rental_id}_${Date.now()}.pdf`;
      const filePath = path.join(this.contractsDir, fileName);

      await fs.writeFile(filePath, pdfBytes);

      return {
        filePath,
        fileName,
        url: `/uploads/contracts/${fileName}`
      };
    } catch (error) {
      console.error('Error generating rental agreement:', error);
      throw error;
    }
  }

  // Generate Owner Lease Agreement PDF
  async generateOwnerLeaseAgreement(ownerId) {
    try {
      const owner = await VehicleOwner.findById(ownerId).populate('linked_vehicles');

      if (!owner) {
        throw new Error('Owner not found');
      }

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);
      const { width, height } = page.getSize();

      let yPosition = height - 50;

      // Title
      page.drawText('VEHICLE OWNER LEASE AGREEMENT', {
        x: 50,
        y: yPosition,
        size: 18,
        color: rgb(0, 0, 0),
      });
      yPosition -= 40;

      const agreementDetails = [
        `Agreement ID: ${owner.owner_id}`,
        `Date: ${new Date().toLocaleDateString()}`,
        '',
        'OWNER INFORMATION:',
        `Name: ${owner.name}`,
        `Phone: ${owner.contact_details.phone}`,
        `Email: ${owner.contact_details.email || 'N/A'}`,
        '',
        'PAYOUT TERMS:',
        `Payout Type: ${owner.payout_rate.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}`,
        `Payout Rate: ${owner.payout_rate.value}${owner.payout_rate.type === 'percentage' ? '%' : ' KES'}`,
        `Payout Due Day: ${owner.payout_due_day} of each month`,
        '',
        `Number of Vehicles: ${owner.linked_vehicles.length}`,
        '',
        'TERMS AND CONDITIONS:',
        '1. Payouts will be processed on the specified due day each month.',
        '2. Payout amount is calculated based on vehicle revenue and agreed rate.',
        '3. The company reserves the right to deduct maintenance costs.',
        '4. This agreement can be terminated with 30 days notice.',
        '',
        'By signing below, both parties agree to the terms and conditions.',
      ];

      agreementDetails.forEach((line) => {
        if (yPosition < 50) {
          const newPage = pdfDoc.addPage([595, 842]);
          yPosition = height - 50;
        }
        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: 12,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
      });

      const pdfBytes = await pdfDoc.save();
      const fileName = `owner_lease_${owner.owner_id}_${Date.now()}.pdf`;
      const filePath = path.join(this.contractsDir, fileName);

      await fs.writeFile(filePath, pdfBytes);

      return {
        filePath,
        fileName,
        url: `/uploads/contracts/${fileName}`
      };
    } catch (error) {
      console.error('Error generating owner lease agreement:', error);
      throw error;
    }
  }

  // Send contract for e-signature
  async sendForESignature(contractId, recipientEmail, recipientPhone) {
    try {
      const contract = await Contract.findById(contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      // Read the PDF file
      const filePath = path.join(this.contractsDir, path.basename(contract.document_url));
      const pdfBuffer = await fs.readFile(filePath);

      // Upload to e-signature platform (example using generic API)
      const formData = new FormData();
      formData.append('file', pdfBuffer, { filename: path.basename(contract.document_url) });
      formData.append('recipient_email', recipientEmail);
      formData.append('recipient_phone', recipientPhone);
      formData.append('contract_id', contract.contract_id);

      const response = await axios.post(
        `${this.esignatureApiUrl}/documents`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.esignatureApiKey}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Update contract with signing URL
      contract.signing_url = response.data.signing_url;
      contract.status = 'Sent';
      await contract.addAuditEntry({
        step: 'Contract sent for e-signature',
        action: 'Sent',
        actor: 'System',
        verification_method: 'Email',
        metadata: {
          recipient_email: recipientEmail,
          recipient_phone: recipientPhone
        }
      });

      await contract.save();

      return {
        success: true,
        signing_url: contract.signing_url,
        contract_id: contract.contract_id
      };
    } catch (error) {
      console.error('Error sending contract for e-signature:', error);
      throw error;
    }
  }

  // Handle e-signature webhook
  async handleESignatureWebhook(webhookData) {
    try {
      const { contract_id, status, signature_data } = webhookData;

      const contract = await Contract.findOne({ contract_id });
      if (!contract) {
        throw new Error('Contract not found');
      }

      if (status === 'signed') {
        contract.status = 'Signed';
        contract.digital_signature_data = {
          signatory_name: signature_data.name,
          signatory_id: signature_data.id,
          signatory_email: signature_data.email,
          signatory_phone: signature_data.phone,
          signature_timestamp: new Date(signature_data.timestamp),
          signature_method: 'E-Signature API',
          signature_certificate: signature_data.certificate,
          signature_hash: signature_data.hash
        };
        contract.signed_document_url = signature_data.signed_document_url;

        await contract.addAuditEntry({
          step: 'Contract signed via e-signature',
          action: 'Signed',
          actor: signature_data.name,
          verification_method: 'E-Signature API',
          metadata: signature_data
        });
      }

      await contract.save();

      return { success: true };
    } catch (error) {
      console.error('Error handling e-signature webhook:', error);
      throw error;
    }
  }
}

module.exports = new ContractService();

