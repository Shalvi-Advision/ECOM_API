const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Generate JWT Token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

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

// Validate OTP and Generate JWT Token
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

    // Generate JWT token for authenticated user
    const tokenPayload = {
      mobile_no: mobileNo,
      project_code: project_code,
      user_type: 'customer',
      login_time: new Date().toISOString()
    };

    const token = generateToken(tokenPayload);

    res.json({
      success: true,
      message: 'OTP validated successfully',
      data: {
        mobile_no: mobileNo,
        otp_valid: true,
        token: token,
        token_type: 'Bearer',
        expires_in: process.env.JWT_EXPIRE || '7d',
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

// Verify JWT Token (for testing purposes)
router.post('/verify_token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        decoded: decoded,
        valid: true,
        expires_at: new Date(decoded.exp * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      data: {
        valid: false,
        error: error.message
      }
    });
  }
});

// Refresh Token
router.post('/refresh_token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Verify the current token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Generate new token with same payload
    const newToken = generateToken({
      mobile_no: decoded.mobile_no,
      project_code: decoded.project_code,
      user_type: decoded.user_type,
      login_time: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        token_type: 'Bearer',
        expires_in: process.env.JWT_EXPIRE || '7d'
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token, please login again',
      data: {
        error: error.message
      }
    });
  }
});

// Logout (for client-side token removal)
router.post('/logout', async (req, res) => {
  try {
    // In a real implementation, you might want to:
    // 1. Add the token to a blacklist
    // 2. Clear any server-side sessions
    // 3. Log the logout event

    res.json({
      success: true,
      message: 'Logged out successfully',
      data: {
        logged_out: true,
        message: 'Token invalidated on client side'
      }
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout'
    });
  }
});

module.exports = router;
