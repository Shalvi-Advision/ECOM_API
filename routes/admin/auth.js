const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Generate JWT Token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Admin Login
router.post('/admin_login', async (req, res) => {
  try {
    const { username, password, project_code } = req.body;

    if (!username || !password || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and project_code are required'
      });
    }

    // In a real implementation, you would:
    // 1. Validate admin credentials against database
    // 2. Check admin permissions and roles
    // 3. Implement password hashing/verification

    // Demo admin credentials (replace with database validation)
    const demoAdmins = [
      { username: 'admin', password: 'admin123', role: 'super_admin' },
      { username: 'manager', password: 'manager123', role: 'manager' },
      { username: 'staff', password: 'staff123', role: 'staff' }
    ];

    const adminUser = demoAdmins.find(admin =>
      admin.username === username && admin.password === password
    );

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials',
        data: {
          authenticated: false
        }
      });
    }

    // Generate JWT token for admin
    const tokenPayload = {
      mobile_no: username, // Using username as mobile_no for consistency
      project_code: project_code,
      user_type: 'admin',
      admin_role: adminUser.role,
      login_time: new Date().toISOString()
    };

    const token = generateToken(tokenPayload);

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        username: username,
        admin_role: adminUser.role,
        authenticated: true,
        token: token,
        token_type: 'Bearer',
        expires_in: process.env.JWT_EXPIRE || '7d'
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin login failed',
      error: error.message
    });
  }
});

// Admin Logout
router.post('/admin_logout', async (req, res) => {
  try {
    // In a real implementation, you might want to:
    // 1. Add the token to a blacklist
    // 2. Clear any server-side sessions
    // 3. Log the admin logout event

    res.json({
      success: true,
      message: 'Admin logged out successfully',
      data: {
        logged_out: true,
        message: 'Admin token invalidated'
      }
    });

  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin logout failed'
    });
  }
});

// Verify Admin Token
router.post('/verify_admin_token', async (req, res) => {
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

    // Check if user is admin
    if (decoded.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
        data: {
          valid: false,
          user_type: decoded.user_type
        }
      });
    }

    res.json({
      success: true,
      message: 'Admin token is valid',
      data: {
        decoded: decoded,
        valid: true,
        admin_role: decoded.admin_role,
        expires_at: new Date(decoded.exp * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error('Admin token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired admin token',
      data: {
        valid: false,
        error: error.message
      }
    });
  }
});

// Refresh Admin Token
router.post('/refresh_admin_token', async (req, res) => {
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

    // Check if user is admin
    if (decoded.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Generate new token with same payload
    const newToken = generateToken({
      mobile_no: decoded.mobile_no,
      project_code: decoded.project_code,
      user_type: 'admin',
      admin_role: decoded.admin_role,
      login_time: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Admin token refreshed successfully',
      data: {
        token: newToken,
        token_type: 'Bearer',
        expires_in: process.env.JWT_EXPIRE || '7d',
        admin_role: decoded.admin_role
      }
    });

  } catch (error) {
    console.error('Admin token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid admin token, please login again',
      data: {
        error: error.message
      }
    });
  }
});

// Get Admin Profile
router.post('/get_admin_profile', async (req, res) => {
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

    // Check if user is admin
    if (decoded.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    res.json({
      success: true,
      message: 'Admin profile retrieved successfully',
      data: {
        username: decoded.mobile_no, // username stored as mobile_no
        admin_role: decoded.admin_role,
        project_code: decoded.project_code,
        login_time: decoded.login_time,
        last_login: decoded.login_time
      }
    });

  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid admin token',
      error: error.message
    });
  }
});

module.exports = router;
