const mongoose = require('mongoose');
const crypto = require('crypto');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cryptocurrency: {
    type: String,
    required: true,
    uppercase: true
  },
  address: {
    type: String,
    required: true,
    unique: true
  },
  privateKeyEncrypted: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  lockedBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  // Wallet metadata
  label: String,
  isDefault: {
    type: Boolean,
    default: false
  },
  // Security features
  requiresConfirmation: {
    type: Boolean,
    default: true
  },
  dailyLimit: {
    type: Number,
    default: 10000 // Default daily withdrawal limit in USD
  },
  // Backup information
  seedPhraseEncrypted: String,
  backupStatus: {
    type: String,
    enum: ['not_backed_up', 'backed_up', 'verified'],
    default: 'not_backed_up'
  },
  backupDate: Date
}, {
  timestamps: true
});

// Index for efficient queries
walletSchema.index({ userId: 1, cryptocurrency: 1 });
walletSchema.index({ address: 1 });
walletSchema.index({ userId: 1, isActive: 1 });

// Virtual for available balance (balance - lockedBalance)
walletSchema.virtual('availableBalance').get(function() {
  return Math.max(0, this.balance - this.lockedBalance);
});

// Method to encrypt private key
walletSchema.methods.encryptPrivateKey = function(privateKey, password) {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(password, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

// Method to decrypt private key
walletSchema.methods.decryptPrivateKey = function(encryptedData, password) {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(password, 'salt', 32);
  
  const decipher = crypto.createDecipher(algorithm, key);
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Method to lock balance for pending transactions
walletSchema.methods.lockBalance = function(amount) {
  if (this.availableBalance < amount) {
    throw new Error('Insufficient available balance');
  }
  this.lockedBalance += amount;
  return this.save();
};

// Method to unlock balance
walletSchema.methods.unlockBalance = function(amount) {
  this.lockedBalance = Math.max(0, this.lockedBalance - amount);
  return this.save();
};

// Method to update balance
walletSchema.methods.updateBalance = function(amount, type = 'add') {
  if (type === 'add') {
    this.balance += amount;
  } else if (type === 'subtract') {
    if (this.balance < amount) {
      throw new Error('Insufficient balance');
    }
    this.balance -= amount;
  }
  this.lastActivity = new Date();
  return this.save();
};

// Static method to find user wallets
walletSchema.statics.findUserWallets = function(userId, activeOnly = true) {
  const query = { userId };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query).sort({ cryptocurrency: 1, createdAt: -1 });
};

// Static method to find wallet by address
walletSchema.statics.findByAddress = function(address) {
  return this.findOne({ address, isActive: true });
};

// Pre-save middleware to ensure only one default wallet per cryptocurrency per user
walletSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Remove default status from other wallets of the same cryptocurrency
    await this.constructor.updateMany(
      { 
        userId: this.userId, 
        cryptocurrency: this.cryptocurrency, 
        _id: { $ne: this._id } 
      },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model('Wallet', walletSchema);