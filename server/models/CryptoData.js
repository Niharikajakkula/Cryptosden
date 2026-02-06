const mongoose = require('mongoose');

const cryptoDataSchema = new mongoose.Schema({
  coinId: {
    type: String,
    required: true,
    unique: true
  },
  symbol: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  currentPrice: Number,
  marketCap: Number,
  volume24h: Number,
  priceChange24h: Number,
  priceChangePercentage24h: Number,
  circulatingSupply: Number,
  totalSupply: Number,
  maxSupply: Number,
  ath: Number,
  athDate: Date,
  atl: Number,
  atlDate: Date,
  
  // Custom Cryptosden features
  trustScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  emotionalVolatilityIndex: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  
  // Historical data points
  priceHistory: [{
    timestamp: Date,
    price: Number,
    volume: Number
  }],
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
cryptoDataSchema.index({ symbol: 1 });
cryptoDataSchema.index({ marketCap: -1 });
cryptoDataSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('CryptoData', cryptoDataSchema);