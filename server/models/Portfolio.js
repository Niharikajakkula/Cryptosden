const mongoose = require('mongoose');

const portfolioHoldingSchema = new mongoose.Schema({
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
  averageBuyPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  totalInvested: {
    type: Number,
    default: 0,
    min: 0
  },
  currentPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  currentValue: {
    type: Number,
    default: 0,
    min: 0
  },
  unrealizedPnL: {
    type: Number,
    default: 0
  },
  unrealizedPnLPercentage: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  holdings: [portfolioHoldingSchema],
  totalValue: {
    type: Number,
    default: 0,
    min: 0
  },
  totalInvested: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPnL: {
    type: Number,
    default: 0
  },
  totalPnLPercentage: {
    type: Number,
    default: 0
  },
  // Performance metrics
  dayChange: {
    type: Number,
    default: 0
  },
  dayChangePercentage: {
    type: Number,
    default: 0
  },
  weekChange: {
    type: Number,
    default: 0
  },
  weekChangePercentage: {
    type: Number,
    default: 0
  },
  monthChange: {
    type: Number,
    default: 0
  },
  monthChangePercentage: {
    type: Number,
    default: 0
  },
  // Historical data
  allTimeHigh: {
    value: {
      type: Number,
      default: 0
    },
    date: Date
  },
  allTimeLow: {
    value: {
      type: Number,
      default: 0
    },
    date: Date
  },
  // Diversification metrics
  diversificationScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  topHoldingPercentage: {
    type: Number,
    default: 0
  },
  // Risk metrics
  volatilityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  riskScore: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
portfolioSchema.index({ userId: 1 });
portfolioSchema.index({ totalValue: -1 });
portfolioSchema.index({ lastUpdated: 1 });

// Virtual for portfolio allocation
portfolioSchema.virtual('allocation').get(function() {
  if (this.totalValue === 0) return [];
  
  return this.holdings.map(holding => ({
    cryptocurrency: holding.cryptocurrency,
    amount: holding.amount,
    value: holding.currentValue,
    percentage: (holding.currentValue / this.totalValue) * 100
  })).sort((a, b) => b.percentage - a.percentage);
});

// Method to update holding
portfolioSchema.methods.updateHolding = function(cryptocurrency, amount, price, type = 'buy') {
  const existingHolding = this.holdings.find(h => h.cryptocurrency === cryptocurrency);
  
  if (existingHolding) {
    if (type === 'buy') {
      // Calculate new average buy price
      const totalCost = existingHolding.totalInvested + (amount * price);
      const totalAmount = existingHolding.amount + amount;
      
      existingHolding.averageBuyPrice = totalAmount > 0 ? totalCost / totalAmount : 0;
      existingHolding.amount = totalAmount;
      existingHolding.totalInvested = totalCost;
    } else if (type === 'sell') {
      // Reduce holding proportionally
      const sellRatio = amount / existingHolding.amount;
      existingHolding.amount = Math.max(0, existingHolding.amount - amount);
      existingHolding.totalInvested = Math.max(0, existingHolding.totalInvested * (1 - sellRatio));
      
      // Remove holding if amount becomes zero
      if (existingHolding.amount === 0) {
        this.holdings = this.holdings.filter(h => h.cryptocurrency !== cryptocurrency);
        return;
      }
    }
    
    existingHolding.lastUpdated = new Date();
  } else if (type === 'buy' && amount > 0) {
    // Add new holding
    this.holdings.push({
      cryptocurrency,
      amount,
      averageBuyPrice: price,
      totalInvested: amount * price,
      currentPrice: price,
      currentValue: amount * price,
      lastUpdated: new Date()
    });
  }
};

// Method to update current prices and calculate metrics
portfolioSchema.methods.updatePrices = function(priceData) {
  let totalValue = 0;
  let totalInvested = 0;
  
  this.holdings.forEach(holding => {
    const currentPrice = priceData[holding.cryptocurrency] || holding.currentPrice;
    holding.currentPrice = currentPrice;
    holding.currentValue = holding.amount * currentPrice;
    holding.unrealizedPnL = holding.currentValue - holding.totalInvested;
    holding.unrealizedPnLPercentage = holding.totalInvested > 0 
      ? (holding.unrealizedPnL / holding.totalInvested) * 100 
      : 0;
    holding.lastUpdated = new Date();
    
    totalValue += holding.currentValue;
    totalInvested += holding.totalInvested;
  });
  
  this.totalValue = totalValue;
  this.totalInvested = totalInvested;
  this.totalPnL = totalValue - totalInvested;
  this.totalPnLPercentage = totalInvested > 0 ? (this.totalPnL / totalInvested) * 100 : 0;
  
  // Update diversification metrics
  this.updateDiversificationMetrics();
  
  // Update all-time high/low
  if (totalValue > (this.allTimeHigh.value || 0)) {
    this.allTimeHigh = { value: totalValue, date: new Date() };
  }
  if (totalValue < (this.allTimeLow.value || Infinity) || this.allTimeLow.value === 0) {
    this.allTimeLow = { value: totalValue, date: new Date() };
  }
  
  this.lastUpdated = new Date();
};

// Method to update diversification metrics
portfolioSchema.methods.updateDiversificationMetrics = function() {
  if (this.holdings.length === 0) {
    this.diversificationScore = 0;
    this.topHoldingPercentage = 0;
    return;
  }
  
  // Calculate Herfindahl-Hirschman Index for diversification
  let hhi = 0;
  let maxPercentage = 0;
  
  this.holdings.forEach(holding => {
    const percentage = this.totalValue > 0 ? (holding.currentValue / this.totalValue) * 100 : 0;
    hhi += Math.pow(percentage, 2);
    maxPercentage = Math.max(maxPercentage, percentage);
  });
  
  // Convert HHI to diversification score (0-100, higher is more diversified)
  this.diversificationScore = Math.max(0, 100 - (hhi / 100));
  this.topHoldingPercentage = maxPercentage;
  
  // Calculate risk score based on diversification and volatility
  if (this.diversificationScore > 70 && this.volatilityScore < 30) {
    this.riskScore = 'low';
  } else if (this.diversificationScore > 40 && this.volatilityScore < 60) {
    this.riskScore = 'medium';
  } else {
    this.riskScore = 'high';
  }
};

// Static method to get or create portfolio
portfolioSchema.statics.getOrCreatePortfolio = async function(userId) {
  let portfolio = await this.findOne({ userId });
  
  if (!portfolio) {
    portfolio = new this({ userId });
    await portfolio.save();
  }
  
  return portfolio;
};

// Static method to update all portfolios with new price data
portfolioSchema.statics.updateAllPortfolios = async function(priceData) {
  const portfolios = await this.find({ 'holdings.0': { $exists: true } });
  
  for (const portfolio of portfolios) {
    portfolio.updatePrices(priceData);
    await portfolio.save();
  }
  
  return portfolios.length;
};

module.exports = mongoose.model('Portfolio', portfolioSchema);