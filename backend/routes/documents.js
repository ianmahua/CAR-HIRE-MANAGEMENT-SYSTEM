const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Customer = require('../models/Customer');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/documents');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  }
});

// @route   POST /api/documents/upload-id
// @desc    Upload customer ID scan
// @access  Private (Admin)
router.post('/upload-id', protect, authorize('Admin'), upload.single('id_scan'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { customer_id } = req.body;
    const customer = await Customer.findOne({ customer_id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    customer.documents.id_scan = {
      url: `/uploads/documents/${req.file.filename}`,
      uploaded_at: new Date(),
      verified: false
    };

    await customer.save();

    res.json({
      success: true,
      data: {
        url: customer.documents.id_scan.url,
        uploaded_at: customer.documents.id_scan.uploaded_at
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/documents/upload-license
// @desc    Upload customer license scan
// @access  Private (Admin)
router.post('/upload-license', protect, authorize('Admin'), upload.single('license_scan'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { customer_id } = req.body;
    const customer = await Customer.findOne({ customer_id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    customer.documents.license_scan = {
      url: `/uploads/documents/${req.file.filename}`,
      uploaded_at: new Date(),
      verified: false
    };

    await customer.save();

    res.json({
      success: true,
      data: {
        url: customer.documents.license_scan.url,
        uploaded_at: customer.documents.license_scan.uploaded_at
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;








