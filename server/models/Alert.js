const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['price', 'sentiment', 'risk', 'volume', 'technical'],
    required: true
  },
  cryptocurrency: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    enum: ['above', 'below', 'crosses_up', 'crosses_down', 'change_percent'],
    required: true
  },
  threshold: {
    type: Number,
    required: true
  },
  currentValue: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isTriggered: {
    type: Boolean,
    default: false
  },
  triggeredAt: {
    type: Date
  },
  lastChecked: {
    type: Date,
    default: Date.now
  },
  notificationMethod: {
    type: [String],
    enum: ['email', 'push', 'sms'],
    default: ['email']
  },
  metadata: {
    sentimentScore: Number,
    riskLevel: String,
    technicalIndicator: String,
    timeframe: String
  },
  message: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
alertSchema.index({ userId: 1, isActive: 1 });
alertSchema.index({ cryptocurrency: 1, type: 1, isActive: 1 });
alertSchema.index({ isTriggered: 1, isActive: 1 });

module.exports = mongoose.model('Alert', alertSchema);