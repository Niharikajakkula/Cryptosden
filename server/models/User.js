const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// UserProfile schema for extended user information
const userProfileSchema = new mongoose.Schema({
  avatar: String,
  bio: String,
  location: String,
  website: String,
  socialLinks: {
    twitter: String,
    linkedin: String,
    github: String
  },
  privacySettings: {
    showProfile: {
      type: Boolean,
      default: true
    },
    showActivity: {
      type: Boolean,
      default: true
    },
    showWatchlist: {
      type: Boolean,
      default: false
    }
  }
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId && !this.facebookId;
    }
  },
  name: {
    type: String,
    required: true
  },
  // Enhanced authentication fields
  role: {
    type: String,
    enum: ['user', 'trader', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'not_submitted'],
    default: 'not_submitted'
  },
  kycDocuments: {
    idDocument: String,
    proofOfAddress: String,
    selfie: String,
    submittedAt: Date,
    reviewedAt: Date,
    reviewNotes: String
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String,
  backupCodes: [String],
  reputation: {
    type: Number,
    default: 0
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  // OAuth fields
  googleId: String,
  facebookId: String,
  // Profile information
  profile: userProfileSchema,
  // Existing fields
  watchlist: [{
    coinId: String,
    symbol: String,
    name: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    currency: {
      type: String,
      default: 'USD'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['dark', 'light'],
      default: 'dark'
    }
  },
  
  // Notification settings
  phoneNumber: {
    type: String,
    sparse: true // Allows multiple null values
  },
  pushSubscriptions: [{
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String
    },
    userAgent: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  notificationPreferences: {
    email: {
      enabled: { type: Boolean, default: true },
      alerts: { type: Boolean, default: true },
      marketUpdates: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false },
      security: { type: Boolean, default: true }
    },
    push: {
      enabled: { type: Boolean, default: false },
      alerts: { type: Boolean, default: true },
      marketUpdates: { type: Boolean, default: false },
      newsletter: { type: Boolean, default: false },
      security: { type: Boolean, default: true }
    },
    sms: {
      enabled: { type: Boolean, default: false },
      alerts: { type: Boolean, default: false },
      marketUpdates: { type: Boolean, default: false },
      newsletter: { type: Boolean, default: false },
      security: { type: Boolean, default: false }
    },
    frequency: {
      immediate: { type: Boolean, default: true },
      daily: { type: Boolean, default: false },
      weekly: { type: Boolean, default: false }
    },
    quietHours: {
      enabled: { type: Boolean, default: false },
      start: { type: String, default: '22:00' },
      end: { type: String, default: '08:00' },
      timezone: { type: String, default: 'UTC' }
    }
  },
  // Account deletion fields
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletionReason: String,
  originalEmail: String, // Store original email for restoration
  
  // Community features
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  
  // OTP fields
  emailOTP: {
    code: String,
    expiresAt: Date,
    purpose: {
      type: String,
      enum: ['registration', 'login', 'email_change']
    },
    attempts: {
      type: Number,
      default: 0
    }
  },
  
  // Password reset fields
  passwordResetToken: String,
  passwordResetExpiry: Date
}, {
  timestamps: true
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware for password hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Method to check if user can upgrade to trader
userSchema.methods.canUpgradeToTrader = function() {
  return this.role === 'user' && 
         this.isVerified && 
         this.kycStatus === 'approved';
};

// Method to upgrade user role
userSchema.methods.upgradeRole = function(newRole) {
  if (newRole === 'trader' && this.canUpgradeToTrader()) {
    this.role = 'trader';
    return this.save();
  }
  throw new Error('Cannot upgrade to requested role');
};

// Method to set OTP
userSchema.methods.setOTP = function(code, purpose = 'registration') {
  this.emailOTP = {
    code,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    purpose,
    attempts: 0
  };
  return this.save();
};

// Method to verify OTP
userSchema.methods.verifyOTP = function(code, purpose) {
  if (!this.emailOTP || !this.emailOTP.code) {
    return { success: false, error: 'No OTP found' };
  }
  
  if (this.emailOTP.expiresAt < new Date()) {
    return { success: false, error: 'OTP has expired' };
  }
  
  if (this.emailOTP.purpose !== purpose) {
    return { success: false, error: 'Invalid OTP purpose' };
  }
  
  if (this.emailOTP.attempts >= 3) {
    return { success: false, error: 'Too many OTP attempts' };
  }
  
  if (this.emailOTP.code !== code) {
    this.emailOTP.attempts += 1;
    this.save();
    return { success: false, error: 'Invalid OTP code' };
  }
  
  return { success: true };
};

// Method to clear OTP
userSchema.methods.clearOTP = function() {
  this.emailOTP = undefined;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);