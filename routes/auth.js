const express = require('express');
const router = express.Router();

// Get OTP (SMS API)
router.post('/get_otp', async (req, res) => {
  try {
    const { mobileNo, project_code } = req.body;

    if (!mobileNo || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and project_code are required'
      });
    }

    // Validate mobile number format
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobileNo.toString())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number format'
      });
    }

    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // In a real implementation, you would:
    // 1. Send SMS via SMS service provider (Twilio, AWS SNS, etc.)
    // 2. Store OTP in database/cache with expiration
    // 3. Implement rate limiting

    console.log(`OTP for ${mobileNo}: ${otp}`); // For development - remove in production

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        mobile_no: mobileNo,
        otp_sent: true,
        otp_length: 4,
        expires_in: 300 // 5 minutes
      }
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
});

// Validate OTP
router.post('/validate_otp', async (req, res) => {
  try {
    const { mobileNo, otp, project_code } = req.body;

    if (!mobileNo || !otp || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number, OTP, and project_code are required'
      });
    }

    // In a real implementation, you would:
    // 1. Retrieve stored OTP from database/cache
    // 2. Check if OTP is expired
    // 3. Compare provided OTP with stored OTP

    // For demo purposes, accept OTPs ending with '1234'
    const isValidOtp = otp.toString() === '1234'; // Demo OTP

    if (!isValidOtp) {
      return res.json({
        success: false,
        message: 'Invalid OTP',
        data: {
          mobile_no: mobileNo,
          otp_valid: false
        }
      });
    }

    // Generate access key for authenticated user
    const accessKey = `T${Date.now()}RnNU1ETTFORGcxT0g1K2ZuNDVNak15`;

    res.json({
      success: true,
      message: 'OTP validated successfully',
      data: {
        mobile_no: mobileNo,
        otp_valid: true,
        access_key: accessKey,
        user_authenticated: true
      }
    });

  } catch (error) {
    console.error('Error validating OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate OTP'
    });
  }
});

module.exports = router;
