const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const TwoFactorAuthService = require('../services/twoFactorAuth');
const EmailService = require('../services/emailService');
const { 
  authenticateToken, 
  requireRole, 
  requireVerification,
  requireKYC,
  requireAdmin 
} = require('../middleware/auth');
const router = express.Router();

// Register with role selection
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'user' } = req.body;
    
    // Validate role
    const allowedRoles = ['user', 'trader'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const user = new User({ 
      email, 
      password, 
      name, 
      role,
      profile: {
        privacySettings: {
          showProfile: true,
          showActivity: true,
          showWatchlist: false
        }
      }
    });
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        kycStatus: user.kycStatus,
        twoFactorEnabled: user.twoFactorEnabled,
        reputation: user.reputation,
        avatar: user.profile?.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// OTP-based registration - Step 1: Send OTP
router.post('/register/send-otp', async (req, res) => {
  try {
    const { email, name, password, role = 'user' } = req.body;
    
    // Validate role
    const allowedRoles = ['user', 'trader'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Generate OTP
    const otp = EmailService.generateOTP();
    const emailService = new EmailService();
    
    // Send OTP email
    const emailSent = await emailService.sendOTPEmail(email, otp, 'registration');
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }
    
    // Create or update user with OTP
    let user;
    if (existingUser) {
      user = existingUser;
      user.name = name;
      user.password = password;
      user.role = role;
    } else {
      user = new User({ 
        email, 
        password, 
        name, 
        role,
        isVerified: false,
        profile: {
          privacySettings: {
            showProfile: true,
            showActivity: true,
            showWatchlist: false
          }
        }
      });
    }
    
    await user.setOTP(otp, 'registration');
    
    res.json({
      message: 'OTP sent to your email address',
      email: email
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// OTP-based registration - Step 2: Verify OTP and complete registration
router.post('/register/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify OTP
    const otpResult = user.verifyOTP(otp, 'registration');
    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.error });
    }
    
    // Mark user as verified and clear OTP
    user.isVerified = true;
    await user.clearOTP();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        kycStatus: user.kycStatus,
        twoFactorEnabled: user.twoFactorEnabled,
        reputation: user.reputation,
        avatar: user.profile?.avatar
      },
      message: 'Registration completed successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Enhanced login with 2FA support
router.post('/login', async (req, res) => {
  try {
    const { email, password, twoFactorCode, backupCode } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({ 
        message: 'Account temporarily locked due to too many failed login attempts',
        lockUntil: user.lockUntil
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // If 2FA is enabled, verify the code
    if (user.twoFactorEnabled) {
      let twoFactorValid = false;

      if (twoFactorCode) {
        twoFactorValid = TwoFactorAuthService.verifyToken(user.twoFactorSecret, twoFactorCode);
      } else if (backupCode) {
        const codeIndex = TwoFactorAuthService.verifyBackupCode(user.backupCodes, backupCode);
        if (codeIndex !== false) {
          // Remove used backup code
          user.backupCodes = TwoFactorAuthService.removeBackupCode(user.backupCodes, codeIndex);
          await user.save();
          twoFactorValid = true;
        }
      }

      if (!twoFactorValid) {
        await user.incLoginAttempts();
        return res.status(401).json({ 
          message: '2FA verification required',
          requires2FA: true
        });
      }
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    // Set 2FA verification in session if applicable
    if (user.twoFactorEnabled && req.session) {
      req.session.twoFactorVerified = true;
    }
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        kycStatus: user.kycStatus,
        twoFactorEnabled: user.twoFactorEnabled,
        reputation: user.reputation,
        avatar: user.profile?.avatar,
        watchlist: user.watchlist,
        preferences: user.preferences
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// OTP-based login - Step 1: Send OTP
router.post('/login/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email first' });
    }
    
    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({ 
        message: 'Account temporarily locked due to too many failed login attempts',
        lockUntil: user.lockUntil
      });
    }
    
    // Generate OTP
    const otp = EmailService.generateOTP();
    const emailService = new EmailService();
    
    // Send OTP email
    const emailSent = await emailService.sendOTPEmail(email, otp, 'login');
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }
    
    // Set OTP for user
    await user.setOTP(otp, 'login');
    
    res.json({
      message: 'OTP sent to your email address',
      email: email
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// OTP-based login - Step 2: Verify OTP and login
router.post('/login/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({ 
        message: 'Account temporarily locked due to too many failed login attempts',
        lockUntil: user.lockUntil
      });
    }
    
    // Verify OTP
    const otpResult = user.verifyOTP(otp, 'login');
    if (!otpResult.success) {
      await user.incLoginAttempts();
      return res.status(400).json({ message: otpResult.error });
    }
    
    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }
    
    // Update last login and clear OTP
    user.lastLogin = new Date();
    await user.clearOTP();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        kycStatus: user.kycStatus,
        twoFactorEnabled: user.twoFactorEnabled,
        reputation: user.reputation,
        avatar: user.profile?.avatar,
        watchlist: user.watchlist,
        preferences: user.preferences
      },
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -twoFactorSecret');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Setup 2FA - Generate secret and QR code
router.post('/2fa/setup', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled' });
    }

    const { secret, otpauthUrl } = TwoFactorAuthService.generateSecret(user.email);
    const qrCode = await TwoFactorAuthService.generateQRCode(otpauthUrl);

    // Store secret temporarily (not yet enabled)
    user.twoFactorSecret = secret;
    await user.save();

    res.json({
      secret,
      qrCode,
      message: 'Scan the QR code with your authenticator app and verify with a code to enable 2FA'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify and enable 2FA
router.post('/2fa/verify', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    const user = req.user;

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: 'Please setup 2FA first' });
    }

    const isValid = TwoFactorAuthService.verifyToken(user.twoFactorSecret, code);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Enable 2FA and generate backup codes
    const backupCodes = TwoFactorAuthService.generateBackupCodes();
    
    user.twoFactorEnabled = true;
    user.backupCodes = backupCodes;
    await user.save();

    res.json({
      message: '2FA enabled successfully',
      backupCodes,
      warning: 'Save these backup codes in a secure location. They can be used to access your account if you lose your authenticator device.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Disable 2FA
router.post('/2fa/disable', authenticateToken, async (req, res) => {
  try {
    const { password, code } = req.body;
    const user = req.user;

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Verify 2FA code
    const isCodeValid = TwoFactorAuthService.verifyToken(user.twoFactorSecret, code);
    if (!isCodeValid) {
      return res.status(400).json({ message: 'Invalid 2FA code' });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.backupCodes = [];
    await user.save();

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate new backup codes
router.post('/2fa/backup-codes', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    const user = req.user;

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate new backup codes
    const backupCodes = TwoFactorAuthService.regenerateBackupCodes();
    user.backupCodes = backupCodes;
    await user.save();

    res.json({
      backupCodes,
      message: 'New backup codes generated. Previous codes are no longer valid.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Request role upgrade to trader
router.post('/upgrade-role', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== 'user') {
      return res.status(400).json({ message: 'Only users can upgrade to trader role' });
    }

    // For development: Skip KYC requirement
    const isDemoMode = process.env.NODE_ENV === 'development' || process.env.TRADING_DEMO_MODE === 'true';
    
    if (!isDemoMode && user.kycStatus !== 'approved') {
      return res.status(400).json({ 
        message: 'KYC verification required for trader role',
        kycStatus: user.kycStatus,
        action: 'complete_kyc'
      });
    }

    if (!isDemoMode && !user.isVerified) {
      return res.status(400).json({ 
        message: 'Email verification required for trader role',
        action: 'verify_email'
      });
    }

    // Upgrade to trader
    user.role = 'trader';
    if (isDemoMode) {
      user.isVerified = true; // Auto-verify in demo mode
    }
    await user.save();

    res.json({
      message: 'Successfully upgraded to trader role',
      user: {
        id: user._id,
        role: user.role,
        kycStatus: user.kycStatus,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit KYC documents
router.post('/kyc/submit', authenticateToken, async (req, res) => {
  try {
    const { idDocument, proofOfAddress, selfie } = req.body;
    const user = req.user;

    if (user.kycStatus === 'approved') {
      return res.status(400).json({ message: 'KYC already approved' });
    }

    // Update KYC documents
    user.kycDocuments = {
      idDocument,
      proofOfAddress,
      selfie,
      submittedAt: new Date()
    };
    user.kycStatus = 'pending';
    await user.save();

    res.json({
      message: 'KYC documents submitted successfully',
      kycStatus: user.kycStatus,
      submittedAt: user.kycDocuments.submittedAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get KYC status
router.get('/kyc/status', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      kycStatus: user.kycStatus,
      submittedAt: user.kycDocuments?.submittedAt,
      reviewedAt: user.kycDocuments?.reviewedAt,
      reviewNotes: user.kycDocuments?.reviewNotes
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Review KYC documents
router.post('/kyc/review/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.kycStatus = status;
    user.kycDocuments.reviewedAt = new Date();
    user.kycDocuments.reviewNotes = notes;
    
    // If approved, verify the user
    if (status === 'approved') {
      user.isVerified = true;
    }

    await user.save();

    res.json({
      message: `KYC ${status} successfully`,
      userId: user._id,
      kycStatus: user.kycStatus
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get pending KYC reviews
router.get('/kyc/pending', requireAdmin, async (req, res) => {
  try {
    const pendingUsers = await User.find({ kycStatus: 'pending' })
      .select('name email kycDocuments.submittedAt')
      .sort({ 'kycDocuments.submittedAt': 1 });

    res.json({
      pendingReviews: pendingUsers,
      count: pendingUsers.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user watchlist
router.post('/watchlist', authenticateToken, async (req, res) => {
  try {
    const { coinId, symbol, name, action } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (action === 'add') {
      const existingItem = user.watchlist.find(item => item.coinId === coinId);
      if (!existingItem) {
        user.watchlist.push({ coinId, symbol, name });
        await user.save();
      }
    } else if (action === 'remove') {
      user.watchlist = user.watchlist.filter(item => item.coinId !== coinId);
      await user.save();
    }

    res.json({ watchlist: user.watchlist });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete account (GDPR compliance)
router.delete('/delete-account', authenticateToken, async (req, res) => {
  try {
    const { password, confirmationText, reason } = req.body;
    
    // Get user with password field for verification
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password (only for users with password-based accounts)
    if (user.password) {
      if (!password) {
        return res.status(400).json({ message: 'Password is required' });
      }
      
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid password' });
      }
    } else if (!user.googleId && !user.facebookId) {
      // User has no password and no OAuth - this shouldn't happen
      return res.status(400).json({ message: 'Account verification failed' });
    }
    // For OAuth users, we skip password verification

    // Verify confirmation text
    if (confirmationText !== 'DELETE MY ACCOUNT') {
      return res.status(400).json({ message: 'Confirmation text does not match' });
    }

    // Log deletion request for audit
    console.log(`Account deletion requested - User: ${user.email}, Reason: ${reason || 'Not specified'}`);

    // In production, you might want to:
    // 1. Soft delete (mark as deleted but keep data for legal/audit purposes)
    // 2. Schedule deletion after a grace period
    // 3. Export user data before deletion (GDPR right to data portability)
    
    const isDemoMode = process.env.NODE_ENV === 'development' || process.env.ACCOUNT_DELETION_DEMO === 'true';
    
    if (isDemoMode) {
      // Demo mode: Soft delete
      user.isDeleted = true;
      user.deletedAt = new Date();
      user.deletionReason = reason;
      user.originalEmail = user.email; // Store original email for restoration
      user.email = `deleted_${Date.now()}@cryptosden.com`; // Anonymize email
      await user.save();
      
      res.json({
        message: 'Account marked for deletion successfully',
        deletedAt: user.deletedAt,
        gracePeriod: '30 days'
      });
    } else {
      // Production mode: Implement proper deletion workflow
      // This should include:
      // - Data export
      // - Cascade deletion of related data
      // - Audit logging
      // - Grace period implementation
      
      res.status(501).json({ 
        message: 'Account deletion is not yet implemented in production mode',
        contact: 'Please contact support for account deletion requests'
      });
    }
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ message: 'Server error during account deletion', error: error.message });
  }
});

// Restore deleted account (within grace period)
router.post('/restore-account', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ 
      originalEmail: { $regex: new RegExp(email, 'i') },
      isDeleted: true 
    });
    
    if (!user) {
      return res.status(404).json({ message: 'No deleted account found with this email' });
    }

    // Check if within grace period (30 days)
    const gracePeriod = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const deletionTime = new Date(user.deletedAt).getTime();
    const now = Date.now();
    
    if (now - deletionTime > gracePeriod) {
      return res.status(410).json({ 
        message: 'Account restoration period has expired',
        deletedAt: user.deletedAt
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Restore account
    user.isDeleted = false;
    user.deletedAt = undefined;
    user.deletionReason = undefined;
    user.email = user.originalEmail; // Restore original email
    user.originalEmail = undefined; // Clear the backup
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Account restored successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        kycStatus: user.kycStatus,
        twoFactorEnabled: user.twoFactorEnabled,
        reputation: user.reputation
      }
    });
  } catch (error) {
    console.error('Account restoration error:', error);
    res.status(500).json({ message: 'Server error during account restoration', error: error.message });
  }
});

// Password Reset - Step 1: Request reset token
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }
    
    // Generate reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    // Save reset token to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpiry = resetTokenExpiry;
    await user.save();
    
    // Send reset email
    const emailService = new EmailService();
    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const emailSent = await emailService.sendPasswordResetEmail(email, resetLink, user.name);
    
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send reset email' });
    }
    
    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Password Reset - Step 2: Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Update password and clear reset token
    user.password = newPassword; // Will be hashed by pre-save middleware
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();
    
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify reset token (optional - for frontend validation)
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ valid: false, message: 'Invalid or expired reset token' });
    }
    
    res.json({ valid: true, email: user.email });
  } catch (error) {
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

// Google OAuth routes (must be before module.exports)
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=oauth_failed` 
  }),
  async (req, res) => {
    try {
      const token = jwt.sign(
        { userId: req.user._id },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '7d' }
      );
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      res.redirect(`${clientUrl}/auth/success?token=${token}`);
    } catch (error) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      res.redirect(`${clientUrl}/login?error=oauth_failed`);
    }
  }
);

// Facebook OAuth routes
router.get('/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=oauth_failed` 
  }),
  async (req, res) => {
    try {
      const token = jwt.sign(
        { userId: req.user._id },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '7d' }
      );
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      res.redirect(`${clientUrl}/auth/success?token=${token}`);
    } catch (error) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      res.redirect(`${clientUrl}/login?error=oauth_failed`);
    }
  }
);

module.exports = router;