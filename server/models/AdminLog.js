const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'user_created',
      'user_updated',
      'user_deleted',
      'user_banned',
      'user_unbanned',
      'user_role_changed',
      'kyc_approved',
      'kyc_rejected',
      'post_moderated',
      'post_deleted',
      'poll_moderated',
      'poll_deleted',
      'transaction_flagged',
      'transaction_reviewed',
      'wallet_frozen',
      'wallet_unfrozen',
      'order_cancelled',
      'system_settings_changed',
      'backup_created',
      'security_alert',
      'login_attempt',
      'password_reset',
      'api_key_generated',
      'api_key_revoked'
    ]
  },
  targetType: {
    type: String,
    enum: ['user', 'post', 'poll', 'transaction', 'wallet', 'order', 'system'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String,
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['user_management', 'content_moderation', 'financial', 'security', 'system'],
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
adminLogSchema.index({ adminId: 1, createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });
adminLogSchema.index({ targetType: 1, targetId: 1 });
adminLogSchema.index({ severity: 1, createdAt: -1 });
adminLogSchema.index({ category: 1, createdAt: -1 });

// Static method to log admin action
adminLogSchema.statics.logAction = function(adminId, action, targetType, targetId, description, details = {}, metadata = {}) {
  return this.create({
    adminId,
    action,
    targetType,
    targetId,
    description,
    details,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    severity: metadata.severity || 'medium',
    category: metadata.category || this.getCategoryForAction(action)
  });
};

// Static method to get category for action
adminLogSchema.statics.getCategoryForAction = function(action) {
  const categoryMap = {
    user_created: 'user_management',
    user_updated: 'user_management',
    user_deleted: 'user_management',
    user_banned: 'user_management',
    user_unbanned: 'user_management',
    user_role_changed: 'user_management',
    kyc_approved: 'user_management',
    kyc_rejected: 'user_management',
    post_moderated: 'content_moderation',
    post_deleted: 'content_moderation',
    poll_moderated: 'content_moderation',
    poll_deleted: 'content_moderation',
    transaction_flagged: 'financial',
    transaction_reviewed: 'financial',
    wallet_frozen: 'financial',
    wallet_unfrozen: 'financial',
    order_cancelled: 'financial',
    system_settings_changed: 'system',
    backup_created: 'system',
    security_alert: 'security',
    login_attempt: 'security',
    password_reset: 'security',
    api_key_generated: 'security',
    api_key_revoked: 'security'
  };
  
  return categoryMap[action] || 'system';
};

// Static method to get recent logs
adminLogSchema.statics.getRecentLogs = function(options = {}) {
  const {
    adminId,
    action,
    category,
    severity,
    limit = 50,
    skip = 0,
    startDate,
    endDate
  } = options;
  
  const query = {};
  
  if (adminId) query.adminId = adminId;
  if (action) query.action = action;
  if (category) query.category = category;
  if (severity) query.severity = severity;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .populate('adminId', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get activity summary
adminLogSchema.statics.getActivitySummary = function(days = 30) {
  const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          category: '$category',
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          }
        },
        count: { $sum: 1 },
        actions: { $addToSet: '$action' }
      }
    },
    {
      $group: {
        _id: '$_id.category',
        totalActions: { $sum: '$count' },
        dailyBreakdown: {
          $push: {
            date: '$_id.date',
            count: '$count',
            actions: '$actions'
          }
        }
      }
    },
    {
      $sort: { totalActions: -1 }
    }
  ]);
};

module.exports = mongoose.model('AdminLog', adminLogSchema);