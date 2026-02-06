const mongoose = require('mongoose');

const pollOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    maxlength: 200
  },
  votes: {
    type: Number,
    default: 0
  },
  votedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }]
});

const pollSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: String,
    required: true,
    maxlength: 500
  },
  description: {
    type: String,
    maxlength: 2000
  },
  options: [pollOptionSchema],
  category: {
    type: String,
    required: true,
    enum: [
      'general',
      'trading',
      'market_prediction',
      'technology',
      'regulation',
      'community',
      'education'
    ]
  },
  tags: [{
    type: String,
    maxlength: 50
  }],
  totalVotes: {
    type: Number,
    default: 0
  },
  allowMultipleVotes: {
    type: Boolean,
    default: false
  },
  allowAddOptions: {
    type: Boolean,
    default: false
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
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
  // Moderation
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
  // Engagement metrics
  engagementScore: {
    type: Number,
    default: 0
  },
  participationRate: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
pollSchema.index({ category: 1, createdAt: -1 });
pollSchema.index({ userId: 1, createdAt: -1 });
pollSchema.index({ expiresAt: 1, isActive: 1 });
pollSchema.index({ isFeatured: -1, engagementScore: -1 });
pollSchema.index({ question: 'text', description: 'text', tags: 'text' });

// Virtual for poll status
pollSchema.virtual('status').get(function() {
  if (!this.isActive) return 'inactive';
  if (this.isModerated) return 'moderated';
  if (new Date() > this.expiresAt) return 'expired';
  return 'active';
});

// Virtual for time remaining
pollSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const remaining = this.expiresAt - now;
  return Math.max(0, remaining);
});

// Virtual for participation rate
pollSchema.virtual('calculatedParticipationRate').get(function() {
  return this.views > 0 ? (this.totalVotes / this.views) * 100 : 0;
});

// Method to add view
pollSchema.methods.addView = function(userId) {
  // Only count unique views
  const existingView = this.viewedBy.find(view => view.userId.toString() === userId.toString());
  if (!existingView) {
    this.views += 1;
    this.viewedBy.push({ userId });
    this.updateEngagementScore();
  }
  return this.save();
};

// Method to vote on poll
pollSchema.methods.vote = function(userId, optionIds) {
  if (this.status !== 'active') {
    throw new Error('Poll is not active');
  }
  
  // Ensure optionIds is an array
  const optionIdsArray = Array.isArray(optionIds) ? optionIds : [optionIds];
  
  // Check if multiple votes are allowed
  if (!this.allowMultipleVotes && optionIdsArray.length > 1) {
    throw new Error('Multiple votes not allowed');
  }
  
  // Check if user has already voted
  const hasVoted = this.options.some(option => 
    option.votedBy.some(vote => vote.userId.toString() === userId.toString())
  );
  
  if (hasVoted) {
    // Remove existing votes
    this.options.forEach(option => {
      const voteIndex = option.votedBy.findIndex(vote => vote.userId.toString() === userId.toString());
      if (voteIndex !== -1) {
        option.votedBy.splice(voteIndex, 1);
        option.votes = Math.max(0, option.votes - 1);
        this.totalVotes = Math.max(0, this.totalVotes - 1);
      }
    });
  }
  
  // Add new votes
  optionIdsArray.forEach(optionId => {
    const option = this.options.id(optionId);
    if (option) {
      option.votedBy.push({ userId });
      option.votes += 1;
      this.totalVotes += 1;
    }
  });
  
  this.updateEngagementScore();
  return this.save();
};

// Method to add new option (if allowed)
pollSchema.methods.addOption = function(userId, optionText) {
  if (!this.allowAddOptions) {
    throw new Error('Adding options not allowed');
  }
  
  if (this.status !== 'active') {
    throw new Error('Poll is not active');
  }
  
  this.options.push({
    text: optionText,
    votes: 0,
    votedBy: []
  });
  
  return this.save();
};

// Method to update engagement score
pollSchema.methods.updateEngagementScore = function() {
  const ageInHours = (Date.now() - this.createdAt) / (1000 * 60 * 60);
  const timeDecay = Math.exp(-ageInHours / 48); // Decay over 48 hours
  
  this.participationRate = this.calculatedParticipationRate;
  
  this.engagementScore = (
    (this.totalVotes * 2) + 
    (this.views * 0.1) + 
    (this.participationRate * 0.5)
  ) * timeDecay;
};

// Method to get results
pollSchema.methods.getResults = function() {
  const results = this.options.map(option => ({
    _id: option._id,
    text: option.text,
    votes: option.votes,
    percentage: this.totalVotes > 0 ? (option.votes / this.totalVotes) * 100 : 0,
    voters: this.isAnonymous ? [] : option.votedBy.map(vote => ({
      userId: vote.userId,
      votedAt: vote.votedAt
    }))
  }));
  
  return {
    question: this.question,
    description: this.description,
    totalVotes: this.totalVotes,
    status: this.status,
    expiresAt: this.expiresAt,
    options: results,
    participationRate: this.participationRate
  };
};

// Static method to get active polls
pollSchema.statics.getActivePolls = function(options = {}) {
  const {
    category,
    limit = 20,
    skip = 0,
    sortBy = 'engagementScore',
    sortOrder = -1
  } = options;
  
  const query = {
    isActive: true,
    isModerated: false,
    expiresAt: { $gt: new Date() }
  };
  
  if (category) query.category = category;
  
  const sort = {};
  sort[sortBy] = sortOrder;
  
  return this.find(query)
    .populate('userId', 'name profile.avatar reputation')
    .sort(sort)
    .limit(limit)
    .skip(skip);
};

// Static method to get featured polls
pollSchema.statics.getFeaturedPolls = function(limit = 5) {
  return this.find({
    isFeatured: true,
    isActive: true,
    isModerated: false,
    expiresAt: { $gt: new Date() }
  })
  .populate('userId', 'name profile.avatar reputation')
  .sort({ engagementScore: -1, createdAt: -1 })
  .limit(limit);
};

// Static method to get trending polls
pollSchema.statics.getTrendingPolls = function(limit = 10) {
  return this.find({
    isActive: true,
    isModerated: false,
    expiresAt: { $gt: new Date() }
  })
  .populate('userId', 'name profile.avatar reputation')
  .sort({ engagementScore: -1, createdAt: -1 })
  .limit(limit);
};

// Static method to search polls
pollSchema.statics.searchPolls = function(searchTerm, options = {}) {
  const {
    category,
    tags,
    limit = 20,
    skip = 0
  } = options;
  
  const query = {
    $text: { $search: searchTerm },
    isActive: true,
    isModerated: false,
    expiresAt: { $gt: new Date() }
  };
  
  if (category) query.category = category;
  if (tags && tags.length > 0) query.tags = { $in: tags };
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .populate('userId', 'name profile.avatar reputation')
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to expire old polls
pollSchema.statics.expireOldPolls = function() {
  return this.updateMany(
    { 
      expiresAt: { $lte: new Date() },
      isActive: true
    },
    { 
      isActive: false
    }
  );
};

// Pre-save middleware to validate options
pollSchema.pre('save', function(next) {
  if (this.options.length < 2) {
    return next(new Error('Poll must have at least 2 options'));
  }
  
  if (this.options.length > 10) {
    return next(new Error('Poll cannot have more than 10 options'));
  }
  
  next();
});

module.exports = mongoose.model('Poll', pollSchema);