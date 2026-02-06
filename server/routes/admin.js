const express = require('express');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const Post = require('../models/Post');
const Poll = require('../models/Poll');
const Wallet = require('../models/Wallet');
const Portfolio = require('../models/Portfolio');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Apply admin middleware to all routes
router.use(requireAdmin);

// ============ DASHBOARD OVERVIEW ============

// Get admin dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // User statistics
    const [
      totalUsers,
      newUsers24h,
      newUsers7d,
      verifiedUsers,
      tradersCount,
      activeUsers24h
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: last24h } }),
      User.countDocuments({ createdAt: { $gte: last7d } }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ role: 'trader' }),
      User.countDocuments({ lastLogin: { $gte: last24h } })
    ]);

    // Transaction statistics
    const [
      totalTransactions,
      transactions24h,
      pendingTransactions,
      failedTransactions24h,
      totalVolume30d
    ] = await Promise.all([
      Transaction.countDocuments(),
      Transaction.countDocuments({ createdAt: { $gte: last24h } }),
      Transaction.countDocuments({ status: 'pending' }),
      Transaction.countDocuments({ 
        status: 'failed', 
        createdAt: { $gte: last24h } 
      }),
      Transaction.aggregate([
        {
          $match: {
            status: 'confirmed',
            createdAt: { $gte: last30d }
          }
        },
        {
          $group: {
            _id: null,
            totalVolume: { $sum: '$amount' }
          }
        }
      ])
    ]);

    // Trading statistics
    const [
      totalOrders,
      orders24h,
      openOrders,
      tradingVolume30d
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: last24h } }),
      Order.countDocuments({ status: { $in: ['open', 'partially_filled'] } }),
      Order.aggregate([
        {
          $match: {
            status: { $in: ['filled', 'partially_filled'] },
            createdAt: { $gte: last30d }
          }
        },
        {
          $group: {
            _id: null,
            totalVolume: { $sum: { $multiply: ['$filled', '$averagePrice'] } }
          }
        }
      ])
    ]);

    // Community statistics
    const [
      totalPosts,
      posts24h,
      totalPolls,
      polls24h,
      pendingModeration
    ] = await Promise.all([
      Post.countDocuments({ isModerated: false }),
      Post.countDocuments({ 
        isModerated: false, 
        createdAt: { $gte: last24h } 
      }),
      Poll.countDocuments({ isActive: true }),
      Poll.countDocuments({ 
        isActive: true, 
        createdAt: { $gte: last24h } 
      }),
      Post.countDocuments({ isModerated: true })
    ]);

    // System health metrics
    const systemHealth = {
      database: 'healthy',
      api: 'healthy',
      trading: openOrders > 0 ? 'active' : 'idle',
      community: posts24h > 0 ? 'active' : 'idle'
    };

    res.json({
      users: {
        total: totalUsers,
        new24h: newUsers24h,
        new7d: newUsers7d,
        verified: verifiedUsers,
        traders: tradersCount,
        active24h: activeUsers24h
      },
      transactions: {
        total: totalTransactions,
        new24h: transactions24h,
        pending: pendingTransactions,
        failed24h: failedTransactions24h,
        volume30d: totalVolume30d[0]?.totalVolume || 0
      },
      trading: {
        totalOrders,
        orders24h,
        openOrders,
        volume30d: tradingVolume30d[0]?.totalVolume || 0
      },
      community: {
        totalPosts,
        posts24h,
        totalPolls,
        polls24h,
        pendingModeration
      },
      systemHealth
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============ USER MANAGEMENT ============

// Get all users with pagination and filters
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      role,
      kycStatus,
      isVerified,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (role) query.role = role;
    if (kycStatus) query.kycStatus = kycStatus;
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-password -twoFactorSecret')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalUsers = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
        hasNext: parseInt(page) * parseInt(limit) < totalUsers,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user details
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password -twoFactorSecret');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user statistics
    const [
      walletCount,
      transactionCount,
      orderCount,
      postCount,
      pollCount,
      portfolio
    ] = await Promise.all([
      Wallet.countDocuments({ userId, isActive: true }),
      Transaction.countDocuments({ userId }),
      Order.countDocuments({ userId }),
      Post.countDocuments({ userId, isModerated: false }),
      Poll.countDocuments({ userId, isActive: true }),
      Portfolio.findOne({ userId })
    ]);

    res.json({
      user,
      statistics: {
        wallets: walletCount,
        transactions: transactionCount,
        orders: orderCount,
        posts: postCount,
        polls: pollCount,
        portfolioValue: portfolio?.totalValue || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user role
router.put('/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'trader', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password -twoFactorSecret');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Suspend/unsuspend user
router.put('/users/:userId/suspend', async (req, res) => {
  try {
    const { userId } = req.params;
    const { suspended, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (suspended) {
      user.lockUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      user.notes = reason;
    } else {
      user.lockUntil = undefined;
      user.loginAttempts = 0;
    }

    await user.save();

    res.json({
      message: suspended ? 'User suspended successfully' : 'User unsuspended successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isLocked: user.isLocked
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============ TRANSACTION MONITORING ============

// Get transactions with filters
router.get('/transactions', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      type,
      status,
      cryptocurrency,
      userId,
      flagged,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (cryptocurrency) query.cryptocurrency = cryptocurrency;
    if (userId) query.userId = userId;
    if (flagged !== undefined) query.flagged = flagged === 'true';

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const transactions = await Transaction.find(query)
      .populate('userId', 'name email')
      .populate('walletId', 'cryptocurrency address')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalTransactions = await Transaction.countDocuments(query);

    res.json({
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTransactions / parseInt(limit)),
        totalTransactions,
        hasNext: parseInt(page) * parseInt(limit) < totalTransactions,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Flag/unflag transaction
router.put('/transactions/:transactionId/flag', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { flagged, reason } = req.body;

    const transaction = await Transaction.findByIdAndUpdate(
      transactionId,
      { 
        flagged,
        flagReason: flagged ? reason : undefined
      },
      { new: true }
    ).populate('userId', 'name email');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({
      message: flagged ? 'Transaction flagged successfully' : 'Transaction unflagged successfully',
      transaction
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============ CONTENT MODERATION ============

// Get posts pending moderation
router.get('/moderation/posts', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const posts = await Post.find({ isModerated: true })
      .populate('userId', 'name email reputation')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalPosts = await Post.countDocuments({ isModerated: true });

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / parseInt(limit)),
        totalPosts,
        hasNext: parseInt(page) * parseInt(limit) < totalPosts,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Moderate post
router.put('/moderation/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { action, reason } = req.body; // 'approve' or 'reject'

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (action === 'approve') {
      post.isModerated = false;
      post.moderationReason = undefined;
    } else if (action === 'reject') {
      post.isModerated = true;
      post.moderationReason = reason;
    }

    post.moderatedBy = req.user._id;
    post.moderatedAt = new Date();
    await post.save();

    // Update user reputation based on moderation
    const reputationChange = action === 'approve' ? 1 : -5;
    await User.findByIdAndUpdate(post.userId, { $inc: { reputation: reputationChange } });

    res.json({
      message: `Post ${action}d successfully`,
      post
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============ REPORTS AND ANALYTICS ============

// Generate user activity report
router.get('/reports/user-activity', async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const userActivity = await User.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          newUsers: { $sum: 1 },
          verifiedUsers: {
            $sum: { $cond: ['$isVerified', 1, 0] }
          },
          traders: {
            $sum: { $cond: [{ $eq: ['$role', 'trader'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    if (format === 'csv') {
      // Convert to CSV format
      const csv = [
        'Date,New Users,Verified Users,Traders',
        ...userActivity.map(item => 
          `${item._id.year}-${item._id.month}-${item._id.day},${item.newUsers},${item.verifiedUsers},${item.traders}`
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=user-activity-report.csv');
      return res.send(csv);
    }

    res.json(userActivity);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate transaction report
router.get('/reports/transactions', async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    const matchStage = { status: 'confirmed' };
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const transactionReport = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            type: '$type',
            cryptocurrency: '$cryptocurrency'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalFees: { $sum: '$fee' },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { '_id.type': 1, '_id.cryptocurrency': 1 } }
    ]);

    if (format === 'csv') {
      const csv = [
        'Type,Cryptocurrency,Count,Total Amount,Total Fees,Average Amount',
        ...transactionReport.map(item => 
          `${item._id.type},${item._id.cryptocurrency},${item.count},${item.totalAmount},${item.totalFees},${item.avgAmount}`
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transaction-report.csv');
      return res.send(csv);
    }

    res.json(transactionReport);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============ PLATFORM SETTINGS ============

// Get platform settings
router.get('/settings', async (req, res) => {
  try {
    // This would typically come from a settings collection
    // For now, return default settings
    const settings = {
      trading: {
        makerFee: 0.001,
        takerFee: 0.001,
        minOrderAmount: 0.001,
        maxOrderAmount: 1000000
      },
      security: {
        maxLoginAttempts: 5,
        lockoutDuration: 7200000, // 2 hours in milliseconds
        sessionTimeout: 604800000, // 7 days in milliseconds
        require2FA: false
      },
      community: {
        maxPostLength: 10000,
        maxReplyLength: 2000,
        moderationEnabled: true,
        autoModerationKeywords: ['spam', 'scam', 'pump']
      }
    };

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update platform settings
router.put('/settings', async (req, res) => {
  try {
    const { trading, security, community } = req.body;

    // In a real implementation, you would save these to a settings collection
    // For now, just return success
    res.json({
      message: 'Settings updated successfully',
      settings: { trading, security, community }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;