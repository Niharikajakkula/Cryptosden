const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  votedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    voteType: {
      type: String,
      enum: ['up', 'down']
    }
  }],
  isModerated: {
    type: Boolean,
    default: false
  },
  moderationReason: String,
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date
}, {
  timestamps: true
});

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  category: {
    type: String,
    required: true,
    enum: [
      'general',
      'trading',
      'analysis',
      'news',
      'education',
      'support',
      'announcements',
      'defi',
      'nft',
      'altcoins',
      'bitcoin',
      'ethereum'
    ]
  },
  tags: [{
    type: String,
    maxlength: 50
  }],
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  votedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    voteType: {
      type: String,
      enum: ['up', 'down']
    }
  }],
  replies: [replySchema],
  views: {
    type: Number,
    default: 0
  },
  viewedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  isModerated: {
    type: Boolean,
    default: false
  },
  moderationReason: String,
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  lastActivity: {
    type: Date,
    default: Date.now
  },
  // Engagement metrics
  engagementScore: {
    type: Number,
    default: 0
  },
  qualityScore: {
    type: Number,
    default: 0
  },
  // Reporting system
  reports: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      required: true,
      enum: ['spam', 'harassment', 'inappropriate', 'misinformation', 'other']
    },
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Additional fields for PostDetail
  image: String, // Optional image URL
  votes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    voteType: {
      type: String,
      enum: ['upvote', 'downvote']
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ isPinned: -1, lastActivity: -1 });
postSchema.index({ engagementScore: -1 });
postSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Virtual for net score
postSchema.virtual('netScore').get(function() {
  return this.upvotes - this.downvotes;
});

// Virtual for reply count
postSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Virtual for engagement rate
postSchema.virtual('engagementRate').get(function() {
  return this.views > 0 ? ((this.upvotes + this.downvotes + this.replies.length) / this.views) * 100 : 0;
});

// Method to add view
postSchema.methods.addView = function(userId) {
  // Only count unique views
  const existingView = this.viewedBy.find(view => view.userId.toString() === userId.toString());
  if (!existingView) {
    this.views += 1;
    this.viewedBy.push({ userId });
    this.updateEngagementScore();
  }
  return this.save();
};

// Method to vote on post
postSchema.methods.vote = function(userId, voteType) {
  const existingVote = this.votedBy.find(vote => vote.userId.toString() === userId.toString());
  
  if (existingVote) {
    if (existingVote.voteType === voteType) {
      // Remove vote
      this.votedBy = this.votedBy.filter(vote => vote.userId.toString() !== userId.toString());
      if (voteType === 'up') {
        this.upvotes = Math.max(0, this.upvotes - 1);
      } else {
        this.downvotes = Math.max(0, this.downvotes - 1);
      }
    } else {
      // Change vote
      existingVote.voteType = voteType;
      if (voteType === 'up') {
        this.upvotes += 1;
        this.downvotes = Math.max(0, this.downvotes - 1);
      } else {
        this.downvotes += 1;
        this.upvotes = Math.max(0, this.upvotes - 1);
      }
    }
  } else {
    // New vote
    this.votedBy.push({ userId, voteType });
    if (voteType === 'up') {
      this.upvotes += 1;
    } else {
      this.downvotes += 1;
    }
  }
  
  this.updateEngagementScore();
  return this.save();
};

// Method to add reply
postSchema.methods.addReply = function(userId, content) {
  this.replies.push({
    userId,
    content
  });
  this.lastActivity = new Date();
  this.updateEngagementScore();
  return this.save();
};

// Method to vote on reply
postSchema.methods.voteOnReply = function(replyId, userId, voteType) {
  const reply = this.replies.id(replyId);
  if (!reply) {
    throw new Error('Reply not found');
  }
  
  const existingVote = reply.votedBy.find(vote => vote.userId.toString() === userId.toString());
  
  if (existingVote) {
    if (existingVote.voteType === voteType) {
      // Remove vote
      reply.votedBy = reply.votedBy.filter(vote => vote.userId.toString() !== userId.toString());
      if (voteType === 'up') {
        reply.upvotes = Math.max(0, reply.upvotes - 1);
      } else {
        reply.downvotes = Math.max(0, reply.downvotes - 1);
      }
    } else {
      // Change vote
      existingVote.voteType = voteType;
      if (voteType === 'up') {
        reply.upvotes += 1;
        reply.downvotes = Math.max(0, reply.downvotes - 1);
      } else {
        reply.downvotes += 1;
        reply.upvotes = Math.max(0, reply.upvotes - 1);
      }
    }
  } else {
    // New vote
    reply.votedBy.push({ userId, voteType });
    if (voteType === 'up') {
      reply.upvotes += 1;
    } else {
      reply.downvotes += 1;
    }
  }
  
  return this.save();
};

// Method to update engagement score
postSchema.methods.updateEngagementScore = function() {
  const ageInHours = (Date.now() - this.createdAt) / (1000 * 60 * 60);
  const timeDecay = Math.exp(-ageInHours / 24); // Decay over 24 hours
  
  this.engagementScore = (
    (this.upvotes * 2) + 
    (this.replies.length * 3) + 
    (this.views * 0.1) - 
    (this.downvotes * 1)
  ) * timeDecay;
  
  // Quality score based on upvote ratio and engagement
  const totalVotes = this.upvotes + this.downvotes;
  const upvoteRatio = totalVotes > 0 ? this.upvotes / totalVotes : 0;
  this.qualityScore = (upvoteRatio * 50) + (Math.min(this.engagementRate, 100) * 0.5);
};

// Static method to get trending posts
postSchema.statics.getTrendingPosts = function(limit = 20, category = null) {
  const query = { isModerated: false };
  if (category) query.category = category;
  
  return this.find(query)
    .populate('userId', 'name profile.avatar reputation')
    .sort({ engagementScore: -1, createdAt: -1 })
    .limit(limit);
};

// Static method to get posts by category
postSchema.statics.getPostsByCategory = function(category, options = {}) {
  const {
    limit = 20,
    skip = 0,
    sortBy = 'lastActivity',
    sortOrder = -1
  } = options;
  
  const query = { category, isModerated: false };
  const sort = {};
  sort[sortBy] = sortOrder;
  
  return this.find(query)
    .populate('userId', 'name profile.avatar reputation')
    .sort(sort)
    .limit(limit)
    .skip(skip);
};

// Static method to search posts
postSchema.statics.searchPosts = function(searchTerm, options = {}) {
  const {
    category,
    tags,
    limit = 20,
    skip = 0
  } = options;
  
  const query = {
    $text: { $search: searchTerm },
    isModerated: false
  };
  
  if (category) query.category = category;
  if (tags && tags.length > 0) query.tags = { $in: tags };
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .populate('userId', 'name profile.avatar reputation')
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Pre-save middleware to update last activity
postSchema.pre('save', function(next) {
  if (this.isModified('replies')) {
    this.lastActivity = new Date();
  }
  next();
});

module.exports = mongoose.model('Post', postSchema);