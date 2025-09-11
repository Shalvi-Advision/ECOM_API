const express = require('express');
const router = express.Router();
const PaymentMode = require('../models/PaymentMode');
const PaymentStatus = require('../models/PaymentStatus');

// Get all payment modes
router.get('/modes', async (req, res) => {
  try {
    const paymentModes = await PaymentMode.find({ is_enabled: 'Yes' })
      .sort({ idpayment_mode: 1 })
      .lean();

    res.json({
      success: true,
      data: paymentModes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment modes',
      error: error.message
    });
  }
});

// Get all payment statuses
router.get('/statuses', async (req, res) => {
  try {
    const paymentStatuses = await PaymentStatus.find({ is_enabled: 'Yes' })
      .sort({ idpayment_status: 1 })
      .lean();

    res.json({
      success: true,
      data: paymentStatuses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment statuses',
      error: error.message
    });
  }
});

module.exports = router;
