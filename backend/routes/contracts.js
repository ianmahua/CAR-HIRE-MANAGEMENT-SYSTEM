const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');
const contractService = require('../services/contractService');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/contracts/generate-rental
// @desc    Generate rental agreement
// @access  Private (Admin)
router.post('/generate-rental', protect, authorize('Admin'), async (req, res) => {
  try {
    const { rental_id } = req.body;

    const { filePath, fileName, url } = await contractService.generateRentalAgreement(rental_id);

    // Create contract record
    const contract = await Contract.create({
      type: 'Rental Agreement',
      'related_entity.rental_ref': rental_id,
      document_url: url,
      signing_url: '', // Will be set when sent for e-signature
      expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    res.json({
      success: true,
      data: contract
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/contracts/send-for-signature
// @desc    Send contract for e-signature
// @access  Private (Admin)
router.post('/send-for-signature', protect, authorize('Admin'), async (req, res) => {
  try {
    const { contract_id, recipient_email, recipient_phone } = req.body;

    const result = await contractService.sendForESignature(contract_id, recipient_email, recipient_phone);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/contracts/webhook
// @desc    Handle e-signature webhook
// @access  Public (webhook)
router.post('/webhook', async (req, res) => {
  try {
    await contractService.handleESignatureWebhook(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/contracts
// @desc    Get all contracts
// @access  Private (Admin, Director)
router.get('/', protect, authorize('Admin', 'Director'), async (req, res) => {
  try {
    const { type, status } = req.query;
    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;

    const contracts = await Contract.find(query)
      .populate('related_entity.rental_ref')
      .populate('related_entity.owner_ref')
      .sort({ created_at: -1 });

    res.json({
      success: true,
      count: contracts.length,
      data: contracts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

