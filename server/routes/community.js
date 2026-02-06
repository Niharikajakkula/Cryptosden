const express = require('express');
const Post = require('../models/Post');
const Poll = require('../models/Poll');
const User = require('../models/User');
const { authenticateToken, requireVerification } = require('../middleware/auth');
const router = express.Router();

// ============ POSTS ROUTES ============

// Get posts by category or trending
router.get('/posts', async (req, res) => {
  try {
    const { 
      category, 
      sort = 'lastActivity', 
      limit = 20, 
      skip = 0,
      trending = false 
    } = req.query;

    let posts;
    
    if (trending === 'true') {
      posts = await Post.getTrendingPosts(parseInt(limit), category);
    } else if (category) {
      posts = await Post.getPostsByCategory(category, {
        limit: parseInt(limit),
        skip: parseInt(skip),
        sortBy: sort,
        sortOrder: -1
      });
    } else {
      posts = await Post.find({ isModerated: false })
        .populate('userId', 'name profile.avatar reputation')
        .sort({ [sort]: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));
    }

    res.json({
      posts,
      hasMore: posts.length === parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single post with replies
router.get('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.query;

    const post = await Post.findById(postId)
      .populate('userId', 'name profile.avatar reputation')
      .populate('replies.userId', 'name profile.avatar reputation');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Add view if user is provided
    if (userId) {
      await post.addView(userId);
    }

    // Transform the response to match frontend expectations
    const transformedPost = {
      ...post.toObject(),
      author: post.userId, // Map userId to author
      upvotes: post.upvotes || 0,
      downvotes: post.downvotes || 0,
      votes: post.votes || []
    };

    res.json(transformedPost);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get comments for a post
router.get('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('replies.userId', 'name profile.avatar reputation');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Transform replies to comments format
    const comments = post.replies.map(reply => ({
      _id: reply._id,
      content: reply.content,
      author: reply.userId,
      createdAt: reply.createdAt,
      upvotes: reply.upvotes || 0,
      downvotes: reply.downvotes || 0
    }));

    res.json({ comments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add comment to post
router.post('/posts/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.isLocked) {
      return res.status(403).json({ message: 'Post is locked for comments' });
    }

    await post.addReply(userId, content);
    await post.populate('replies.userId', 'name profile.avatar reputation');

    // Update user reputation
    await User.findByIdAndUpdate(userId, { $inc: { reputation: 1 } });

    const newReply = post.replies[post.replies.length - 1];
    const comment = {
      _id: newReply._id,
      content: newReply.content,
      author: newReply.userId,
      createdAt: newReply.createdAt,
      upvotes: newReply.upvotes || 0,
      downvotes: newReply.downvotes || 0
    };

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Report post
router.post('/posts/:postId/report', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Add report to post
    if (!post.reports) {
      post.reports = [];
    }

    // Check if user already reported this post
    const existingReport = post.reports.find(report => 
      report.userId.toString() === userId.toString()
    );

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this post' });
    }

    post.reports.push({
      userId,
      reason,
      reportedAt: new Date()
    });

    // Auto-moderate if too many reports
    if (post.reports.length >= 5) {
      post.isModerated = true;
      post.moderationReason = 'Multiple reports received';
    }

    await post.save();

    res.json({ message: 'Post reported successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete post
router.delete('/posts/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post or is admin
    if (post.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(postId);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new post
router.post('/posts', authenticateToken, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const userId = req.user._id;

    const post = new Post({
      userId,
      title,
      content,
      category,
      tags: tags || []
    });

    await post.save();
    await post.populate('userId', 'name profile.avatar reputation');

    // Update user reputation
    await User.findByIdAndUpdate(userId, { $inc: { reputation: 1 } });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Vote on post
router.post('/posts/:postId/vote', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { voteType } = req.body; // 'upvote' or 'downvote'
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Convert voteType to match Post model expectations
    const modelVoteType = voteType === 'upvote' ? 'up' : 'down';
    await post.vote(userId, modelVoteType);

    // Update post author reputation
    const reputationChange = voteType === 'upvote' ? 2 : -1;
    await User.findByIdAndUpdate(post.userId, { $inc: { reputation: reputationChange } });

    res.json({
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      netScore: post.netScore
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add reply to post
router.post('/posts/:postId/replies', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.isLocked) {
      return res.status(403).json({ message: 'Post is locked for replies' });
    }

    await post.addReply(userId, content);
    await post.populate('replies.userId', 'name profile.avatar reputation');

    // Update user reputation
    await User.findByIdAndUpdate(userId, { $inc: { reputation: 1 } });

    const newReply = post.replies[post.replies.length - 1];
    res.status(201).json(newReply);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Vote on reply
router.post('/posts/:postId/replies/:replyId/vote', authenticateToken, async (req, res) => {
  try {
    const { postId, replyId } = req.params;
    const { voteType } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await post.voteOnReply(replyId, userId, voteType);

    const reply = post.replies.id(replyId);
    
    // Update reply author reputation
    const reputationChange = voteType === 'up' ? 1 : -0.5;
    await User.findByIdAndUpdate(reply.userId, { $inc: { reputation: reputationChange } });

    res.json({
      upvotes: reply.upvotes,
      downvotes: reply.downvotes,
      netScore: reply.upvotes - reply.downvotes
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search posts
router.get('/posts/search', async (req, res) => {
  try {
    const { q, category, tags, limit = 20, skip = 0 } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query required' });
    }

    const posts = await Post.searchPosts(q, {
      category,
      tags: tags ? tags.split(',') : undefined,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });

    res.json({
      posts,
      hasMore: posts.length === parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============ POLLS ROUTES ============

// Get polls
router.get('/polls', async (req, res) => {
  try {
    const { 
      category, 
      featured = false,
      trending = false,
      limit = 20, 
      skip = 0 
    } = req.query;

    let polls;
    
    if (featured === 'true') {
      polls = await Poll.getFeaturedPolls(parseInt(limit));
    } else if (trending === 'true') {
      polls = await Poll.getTrendingPolls(parseInt(limit));
    } else {
      polls = await Poll.getActivePolls({
        category,
        limit: parseInt(limit),
        skip: parseInt(skip)
      });
    }

    res.json({
      polls,
      hasMore: polls.length === parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single poll
router.get('/polls/:pollId', async (req, res) => {
  try {
    const { pollId } = req.params;
    const { userId } = req.query;

    const poll = await Poll.findById(pollId)
      .populate('userId', 'name profile.avatar reputation');

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Add view if user is provided
    if (userId) {
      await poll.addView(userId);
    }

    const results = poll.getResults();
    res.json({ ...poll.toObject(), results });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new poll
router.post('/polls', authenticateToken, async (req, res) => {
  try {
    const { 
      question, 
      description, 
      options, 
      category, 
      tags,
      expiresAt,
      allowMultipleVotes = false,
      allowAddOptions = false,
      isAnonymous = false
    } = req.body;
    const userId = req.user._id;

    if (!options || options.length < 2) {
      return res.status(400).json({ message: 'Poll must have at least 2 options' });
    }

    const poll = new Poll({
      userId,
      question,
      description,
      options: options.map(text => ({ text, votes: 0, votedBy: [] })),
      category,
      tags: tags || [],
      expiresAt: new Date(expiresAt),
      allowMultipleVotes,
      allowAddOptions,
      isAnonymous
    });

    await poll.save();
    await poll.populate('userId', 'name profile.avatar reputation');

    // Update user reputation
    await User.findByIdAndUpdate(userId, { $inc: { reputation: 2 } });

    res.status(201).json(poll);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Vote on poll
router.post('/polls/:pollId/vote', authenticateToken, async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionIds } = req.body; // Array of option IDs or single option ID
    const userId = req.user._id;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    await poll.vote(userId, optionIds);

    // Update poll creator reputation
    await User.findByIdAndUpdate(poll.userId, { $inc: { reputation: 0.5 } });

    const results = poll.getResults();
    res.json(results);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add option to poll (if allowed)
router.post('/polls/:pollId/options', authenticateToken, async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionText } = req.body;
    const userId = req.user._id;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    await poll.addOption(userId, optionText);

    res.json({
      message: 'Option added successfully',
      options: poll.options
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Search polls
router.get('/polls/search', async (req, res) => {
  try {
    const { q, category, tags, limit = 20, skip = 0 } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query required' });
    }

    const polls = await Poll.searchPolls(q, {
      category,
      tags: tags ? tags.split(',') : undefined,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });

    res.json({
      polls,
      hasMore: polls.length === parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============ GENERAL COMMUNITY ROUTES ============

// Get community stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalPosts,
      totalPolls,
      activePosts,
      activePolls,
      topContributors
    ] = await Promise.all([
      Post.countDocuments({ isModerated: false }),
      Poll.countDocuments({ isActive: true }),
      Post.countDocuments({ 
        isModerated: false, 
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      Poll.countDocuments({ 
        isActive: true,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      User.find({ reputation: { $gt: 0 } })
        .select('name profile.avatar reputation')
        .sort({ reputation: -1 })
        .limit(10)
    ]);

    res.json({
      totalPosts,
      totalPolls,
      activePosts,
      activePolls,
      topContributors
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get categories
router.get('/categories', (req, res) => {
  const categories = [
    { id: 'general', name: 'General Discussion', description: 'General cryptocurrency discussions' },
    { id: 'trading', name: 'Trading', description: 'Trading strategies and emotional market insights' },
    { id: 'analysis', name: 'Technical Analysis', description: 'Chart analysis and technical indicators' },
    { id: 'news', name: 'News & Updates', description: 'Latest cryptocurrency news' },
    { id: 'education', name: 'Education', description: 'Learning resources and tutorials' },
    { id: 'support', name: 'Support', description: 'Platform support and help' },
    { id: 'announcements', name: 'Announcements', description: 'Official platform announcements' },
    { id: 'defi', name: 'DeFi', description: 'Decentralized Finance discussions' },
    { id: 'nft', name: 'NFTs', description: 'Non-Fungible Token discussions' },
    { id: 'altcoins', name: 'Altcoins', description: 'Alternative cryptocurrency discussions' },
    { id: 'bitcoin', name: 'Bitcoin', description: 'Bitcoin-specific discussions' },
    { id: 'ethereum', name: 'Ethereum', description: 'Ethereum-specific discussions' }
  ];

  res.json(categories);
});

// Get top contributors
router.get('/top-contributors', async (req, res) => {
  try {
    const contributors = await User.find({ 
      reputation: { $gt: 0 } 
    })
      .select('name profile.avatar reputation role')
      .sort({ reputation: -1 })
      .limit(10);

    res.json({ contributors });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get trending tags
router.get('/trending-tags', async (req, res) => {
  try {
    // Aggregate tags from recent posts and polls
    const [postTags, pollTags] = await Promise.all([
      Post.aggregate([
        {
          $match: {
            isModerated: false,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]),
      Poll.aggregate([
        {
          $match: {
            isActive: true,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ])
    ]);

    // Combine and sort tags
    const tagMap = new Map();
    
    [...postTags, ...pollTags].forEach(tag => {
      const existing = tagMap.get(tag._id);
      tagMap.set(tag._id, {
        name: tag._id,
        count: (existing?.count || 0) + tag.count
      });
    });

    const tags = Array.from(tagMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    res.json({ tags });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bookmark post
router.post('/posts/:postId/bookmark', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const bookmarkIndex = user.bookmarks?.indexOf(postId);
    
    if (bookmarkIndex > -1) {
      // Remove bookmark
      user.bookmarks.splice(bookmarkIndex, 1);
    } else {
      // Add bookmark
      if (!user.bookmarks) user.bookmarks = [];
      user.bookmarks.push(postId);
    }

    await user.save();

    res.json({ 
      bookmarked: bookmarkIndex === -1,
      bookmarks: user.bookmarks 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;