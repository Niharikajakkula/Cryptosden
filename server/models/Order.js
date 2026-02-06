const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['market', 'limit', 'stop-loss', 'stop-limit'],
    required: true
  },
  side: {
    type: String,
    enum: ['buy', 'sell'],
    required: true
  },
  pair: {
    type: String,
    required: true,
    uppercase: true
  },
  baseAsset: {
    type: String,
    required: true,
    uppercase: true
  },
  quoteAsset: {
    type: String,
    required: true,
    uppercase: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    min: 0
  },
  stopPrice: {
    type: Number,
    min: 0
  },
  filled: {
    type: Number,
    default: 0,
    min: 0
  },
  remaining: {
    type: Number,
    min: 0
  },
  averagePrice: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['open', 'filled', 'partially_filled', 'cancelled', 'expired', 'rejected'],
    default: 'open'
  },
  timeInForce: {
    type: String,
    enum: ['GTC', 'IOC', 'FOK'], // Good Till Cancelled, Immediate Or Cancel, Fill Or Kill
    default: 'GTC'
  },
  // Fee information
  makerFee: {
    type: Number,
    default: 0.001 // 0.1%
  },
  takerFee: {
    type: Number,
    default: 0.001 // 0.1%
  },
  totalFee: {
    type: Number,
    default: 0
  },
  feeAsset: String,
  // Execution information
  executedAt: Date,
  cancelledAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  // Order book information
  orderBookLevel: Number,
  priority: {
    type: Number,
    default: 0
  },
  // Risk management
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  // Metadata
  clientOrderId: String,
  notes: String,
  source: {
    type: String,
    enum: ['web', 'mobile', 'api'],
    default: 'web'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
orderSchema.index({ userId: 1, status: 1, createdAt: -1 });
orderSchema.index({ pair: 1, side: 1, price: 1, createdAt: 1 });
orderSchema.index({ status: 1, type: 1 });
orderSchema.index({ clientOrderId: 1 });

// Virtual for order completion percentage
orderSchema.virtual('fillPercentage').get(function() {
  return this.amount > 0 ? (this.filled / this.amount) * 100 : 0;
});

// Virtual for remaining amount
orderSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.amount - this.filled);
});

// Virtual for total value
orderSchema.virtual('totalValue').get(function() {
  return this.amount * (this.price || 0);
});

// Virtual for filled value
orderSchema.virtual('filledValue').get(function() {
  return this.filled * this.averagePrice;
});

// Pre-save middleware to calculate remaining amount
orderSchema.pre('save', function(next) {
  this.remaining = this.remainingAmount;
  
  // Update status based on fill
  if (this.filled === 0 && this.status === 'open') {
    this.status = 'open';
  } else if (this.filled > 0 && this.filled < this.amount) {
    this.status = 'partially_filled';
  } else if (this.filled >= this.amount) {
    this.status = 'filled';
    if (!this.executedAt) {
      this.executedAt = new Date();
    }
  }
  
  next();
});

// Method to partially fill order
orderSchema.methods.fill = function(fillAmount, fillPrice) {
  if (this.status === 'filled' || this.status === 'cancelled') {
    throw new Error('Cannot fill a completed order');
  }
  
  const maxFillAmount = this.remaining;
  const actualFillAmount = Math.min(fillAmount, maxFillAmount);
  
  // Update average price
  const totalFilledValue = (this.filled * this.averagePrice) + (actualFillAmount * fillPrice);
  const newTotalFilled = this.filled + actualFillAmount;
  this.averagePrice = totalFilledValue / newTotalFilled;
  
  this.filled = newTotalFilled;
  
  // Calculate fee
  const fee = actualFillAmount * fillPrice * (this.side === 'buy' ? this.takerFee : this.makerFee);
  this.totalFee += fee;
  this.feeAsset = this.side === 'buy' ? this.baseAsset : this.quoteAsset;
  
  return this.save();
};

// Method to cancel order
orderSchema.methods.cancel = function(reason = 'User cancelled') {
  if (this.status === 'filled') {
    throw new Error('Cannot cancel a filled order');
  }
  
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.notes = reason;
  
  return this.save();
};

// Method to reject order
orderSchema.methods.reject = function(reason) {
  this.status = 'rejected';
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  
  return this.save();
};

// Static method to get user orders
orderSchema.statics.getUserOrders = function(userId, options = {}) {
  const {
    status,
    pair,
    side,
    type,
    limit = 50,
    skip = 0,
    startDate,
    endDate
  } = options;
  
  const query = { userId };
  
  if (status) query.status = status;
  if (pair) query.pair = pair;
  if (side) query.side = side;
  if (type) query.type = type;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get open orders for a trading pair
orderSchema.statics.getOpenOrders = function(pair, side = null) {
  const query = { 
    pair, 
    status: { $in: ['open', 'partially_filled'] }
  };
  
  if (side) query.side = side;
  
  return this.find(query)
    .sort({ 
      price: side === 'buy' ? -1 : 1, // Buy orders: highest price first, Sell orders: lowest price first
      createdAt: 1 // Earlier orders have priority
    });
};

// Static method to get order book
orderSchema.statics.getOrderBook = function(pair, depth = 20) {
  return Promise.all([
    // Buy orders (bids) - highest price first
    this.find({ 
      pair, 
      side: 'buy', 
      status: { $in: ['open', 'partially_filled'] }
    })
    .sort({ price: -1, createdAt: 1 })
    .limit(depth),
    
    // Sell orders (asks) - lowest price first
    this.find({ 
      pair, 
      side: 'sell', 
      status: { $in: ['open', 'partially_filled'] }
    })
    .sort({ price: 1, createdAt: 1 })
    .limit(depth)
  ]).then(([bids, asks]) => ({
    bids: bids.map(order => ({
      price: order.price,
      amount: order.remaining,
      total: order.remaining * order.price
    })),
    asks: asks.map(order => ({
      price: order.price,
      amount: order.remaining,
      total: order.remaining * order.price
    }))
  }));
};

// Static method to calculate user trading volume
orderSchema.statics.getUserTradingVolume = function(userId, days = 30) {
  const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: { $in: ['filled', 'partially_filled'] },
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$pair',
        totalVolume: { $sum: { $multiply: ['$filled', '$averagePrice'] } },
        totalTrades: { $sum: 1 },
        totalFees: { $sum: '$totalFee' }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);