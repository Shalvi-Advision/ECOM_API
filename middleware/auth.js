const jwt = require('jsonwebtoken');

// Protect routes - JWT Authentication Middleware
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in body (for backward compatibility)
    if (!token && req.body && req.body.token) {
      token = req.body.token;
    }

    // Check for token in query params (for testing)
    if (!token && req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
        error: 'No token provided'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Add user info to request
      req.user = {
        mobile_no: decoded.mobile_no,
        project_code: decoded.project_code,
        user_type: decoded.user_type,
        login_time: decoded.login_time,
        iat: decoded.iat,
        exp: decoded.exp
      };

      next();

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
        error: 'Token verification failed',
        details: error.message
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication',
      error: error.message
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in body
    if (!token && req.body && req.body.token) {
      token = req.body.token;
    }

    // Check for token in query params
    if (!token && req.query && req.query.token) {
      token = req.query.token;
    }

    if (token) {
      try {
        // Verify token if provided
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Add user info to request
        req.user = {
          mobile_no: decoded.mobile_no,
          project_code: decoded.project_code,
          user_type: decoded.user_type,
          login_time: decoded.login_time,
          iat: decoded.iat,
          exp: decoded.exp
        };
      } catch (error) {
        // Don't fail, just don't add user info
        console.log('Optional auth token invalid:', error.message);
      }
    }

    next();

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

// Admin only middleware
const adminOnly = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.user_type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      error: 'Insufficient permissions'
    });
  }

  next();
};

// Generate JWT Token (utility function)
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = {
  protect,
  optionalAuth,
  adminOnly,
  generateToken
};
