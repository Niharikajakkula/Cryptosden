const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId).select('-password -twoFactorSecret');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({ 
        message: 'Account temporarily locked due to too many failed login attempts',
        lockUntil: user.lockUntil
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Middleware to check user roles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

// Middleware to check if user is verified
const requireVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({ 
      message: 'Email verification required',
      action: 'verify_email'
    });
  }

  next();
};

// Middleware to check KYC status
const requireKYC = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.kycStatus !== 'approved') {
    return res.status(403).json({ 
      message: 'KYC verification required',
      kycStatus: req.user.kycStatus,
      action: 'complete_kyc'
    });
  }

  next();
};

// Middleware to check 2FA when enabled
const require2FA = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // If 2FA is enabled but not verified in this session
  if (req.user.twoFactorEnabled && !req.session?.twoFactorVerified) {
    return res.status(403).json({ 
      message: '2FA verification required',
      action: 'verify_2fa'
    });
  }

  next();
};

// Combined middleware for trader-level access
const requireTrader = [
  authenticateToken,
  requireVerification,
  requireKYC,
  requireRole(['trader', 'admin'])
];

// Combined middleware for admin access
const requireAdmin = [
  authenticateToken,
  requireVerification,
  requireRole('admin')
];

// Combined middleware for secure operations
const requireSecureAccess = [
  authenticateToken,
  requireVerification,
  require2FA
];

module.exports = {
  authenticateToken,
  requireRole,
  requireVerification,
  requireKYC,
  require2FA,
  requireTrader,
  requireAdmin,
  requireSecureAccess
};