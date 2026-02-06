const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer', 'trade', 'fee'],
    required: true
  },
  cryptocurrency: {
    type: String,
    required: true,
    uppercase: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  fee: {
    type: Number,
    default: 0,
    min: 0
  },
  netAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'cancelled'],
    default: 'pending'
  },
  // Blockchain information
  txHash: String,
  blockNumber: Number,
  confirmations: {
    type: Number,
    default: 0
  },
  requiredConfirmations: {
    type: Number,
    default: 6
  },
  // Address information
  fromAddress: String,
  toAddress: String,
  // Internal transfer information
  toWalletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet'
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Trading information
  tradeOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  tradePair: String,
  tradePrice: Number,
  // Metadata
  description: String,
  notes: String,
  reference: String,
  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: Date,
  failedAt: Date,
  // Risk management
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  flagged: {
    type: Boolean,
    default: false
  },
  flagReason: String
}, {
  timestamps: true
});

// Indexes for efficient queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ walletId: 1, createdAt: -1 });
transactionSchema.index({ txHash: 1 });
transactionSchema.index({ status: 1, type: 1 });
transactionSchema.index({ userId: 1, status: 1, type: 1 });

// Virtual for transaction age in minutes
transactionSchema.virtual('ageInMinutes').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60));
});

// Virtual for confirmation status
transactionSchema.virtual('isConfirmed').get(function() {
  return this.status === 'confirmed' || 
         (this.confirmations >= this.requiredConfirmations && this.status === 'pending');
});

// Method to update confirmation count
transactionSchema.methods.updateConfirmations = function(confirmations, blockNumber) {
  this.confirmations = confirmations;
  if (blockNumber) {
    this.blockNumber = blockNumber;
  }
  
  // Auto-confirm if required confirmations reached
  if (confirmations >= this.requiredConfirmations && this.status === 'pending') {
    this.status = 'confirmed';
    this.confirmedAt = new Date();
  }
  
  return this.save();
};

// Method to mark as failed
transactionSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.failedAt = new Date();
  if (reason) {
    this.notes = reason;
  }
  return this.save();
};

// Method to mark as confirmed
transactionSchema.methods.markAsConfirmed = function(txHash, blockNumber) {
  this.status = 'confirmed';
  this.confirmedAt = new Date();
  if (txHash) {
    this.txHash = txHash;
  }
  if (blockNumber) {
    this.blockNumber = blockNumber;
  }
  return this.save();
};

// Static method to get user transaction history
transactionSchema.statics.getUserTransactions = function(userId, options = {}) {
  const {
    type,
    status,
    cryptocurrency,
    limit = 50,
    skip = 0,
    startDate,
    endDate
  } = options;
  
  const query = { userId };
  
  if (type) query.type = type;
  if (status) query.status = status;
  if (cryptocurrency) query.cryptocurrency = cryptocurrency;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .populate('walletId', 'cryptocurrency address label')
    .populate('toWalletId', 'cryptocurrency address label')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get pending transactions
transactionSchema.statics.getPendingTransactions = function(olderThanMinutes = 0) {
  const query = { status: 'pending' };
  
  if (olderThanMinutes > 0) {
    const cutoffTime = new Date(Date.now() - (olderThanMinutes * 60 * 1000));
    query.createdAt = { $lte: cutoffTime };
  }
  
  return this.find(query)
    .populate('userId', 'name email')
    .populate('walletId', 'cryptocurrency address')
    .sort({ createdAt: 1 });
};

// Static method to calculate user transaction volume
transactionSchema.statics.getUserVolume = function(userId, days = 30) {
  const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'confirmed',
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$cryptocurrency',
        totalVolume: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
        totalFees: { $sum: '$fee' }
      }
    }
  ]);
};

// Pre-save middleware to calculate net amount
transactionSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('fee')) {
    if (this.type === 'withdrawal' || this.type === 'trade') {
      this.netAmount = this.amount - this.fee;
    } else {
      this.netAmount = this.amount;
    }
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);