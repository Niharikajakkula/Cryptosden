const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Alert = require('../models/Alert');
const { authenticateToken } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

// Test email notification endpoint
router.post('/test-email', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    console.log('🧪 Testing email notification for user:', user.email);
    
    const testNotification = {
      type: 'test',
      subject: '🧪 Test Email from Cryptosden',
      message: 'This is a test email to verify your notification settings are working correctly.',
      data: {
        testTime: new Date().toISOString(),
        userEmail: user.email
      }
    };

    const result = await notificationService.sendEmail(user, testNotification);
    
    console.log('🧪 Test email result:', result);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Test email sent successfully!',
        recipient: user.email,
        result: result
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send test email',
        error: result.error || result.reason,
        result: result
      });
    }
    
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while sending test email',
      error: error.message 
    });
  }
});

// Get user notification preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notificationPreferences');
    
    // Default preferences if not set
    const defaultPreferences = {
      email: {
        enabled: true,
        alerts: true,
        marketUpdates: true,
        newsletter: false,
        security: true
      },
      push: {
        enabled: false,
        alerts: true,
        marketUpdates: false,
        newsletter: false,
        security: true
      },
      sms: {
        enabled: false,
        alerts: false,
        marketUpdates: false,
        newsletter: false,
        security: false
      },
      frequency: {
        immediate: true,
        daily: false,
        weekly: false
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      }
    };

    const preferences = user.notificationPreferences || defaultPreferences;
    
    res.json({
      preferences,
      hasDefaults: !user.notificationPreferences
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user notification preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    if (!preferences) {
      return res.status(400).json({ message: 'Preferences are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.notificationPreferences = preferences;
    await user.save();

    res.json({
      message: 'Notification preferences updated successfully',
      preferences: user.notificationPreferences
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notification history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;

    // Get triggered alerts as notification history
    const query = { 
      userId: req.user.id, 
      isTriggered: true 
    };
    
    if (type && type !== 'all') {
      query.type = type;
    }

    const notifications = await Alert.find(query)
      .sort({ triggeredAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('type cryptocurrency message triggeredAt notificationMethod');

    const total = await Alert.countDocuments(query);

    res.json({
      notifications: notifications.map(alert => ({
        id: alert._id,
        type: alert.type,
        cryptocurrency: alert.cryptocurrency,
        message: alert.message,
        timestamp: alert.triggeredAt,
        methods: alert.notificationMethod,
        read: true // For now, mark all as read
      })),
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + notifications.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notifications as read
router.patch('/read', authenticateToken, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ message: 'Notification IDs are required' });
    }

    // In a more complex system, you'd have a separate notifications table
    // For now, we'll just return success since alerts don't have read status
    
    res.json({ 
      message: 'Notifications marked as read',
      count: notificationIds.length 
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test notification
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { type = 'email', message = 'This is a test notification from Cryptosden' } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has enabled this notification type
    const preferences = user.notificationPreferences;
    if (preferences && preferences[type] && !preferences[type].enabled) {
      return res.status(400).json({ 
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} notifications are disabled` 
      });
    }

    switch (type) {
      case 'email':
        await notificationService.sendEmail(user, {
          subject: 'Test Notification - Cryptosden',
          message,
          type: 'test'
        });
        break;
      case 'push':
        // Implement push notification
        console.log(`Push notification would be sent to ${user.email}: ${message}`);
        break;
      case 'sms':
        // Implement SMS notification
        console.log(`SMS would be sent to ${user.phone}: ${message}`);
        break;
      default:
        return res.status(400).json({ message: 'Invalid notification type' });
    }

    res.json({ 
      message: `Test ${type} notification sent successfully`,
      type,
      recipient: type === 'email' ? user.email : user.phone || 'N/A'
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ message: 'Failed to send test notification' });
  }
});

// Get notification statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get alert statistics as notification stats
    const stats = await Alert.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalAlerts: { $sum: 1 },
          triggeredAlerts: { $sum: { $cond: ['$isTriggered', 1, 0] } },
          activeAlerts: { $sum: { $cond: ['$isActive', 1, 0] } },
          byType: {
            $push: {
              type: '$type',
              isTriggered: '$isTriggered',
              triggeredAt: '$triggeredAt'
            }
          }
        }
      }
    ]);

    const result = stats[0] || { 
      totalAlerts: 0, 
      triggeredAlerts: 0, 
      activeAlerts: 0, 
      byType: [] 
    };

    // Calculate notifications in last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentNotifications = result.byType.filter(alert => 
      alert.isTriggered && 
      alert.triggeredAt && 
      new Date(alert.triggeredAt) > last24Hours
    ).length;

    // Group by type
    const typeStats = {};
    result.byType.forEach(alert => {
      if (!typeStats[alert.type]) {
        typeStats[alert.type] = { total: 0, triggered: 0 };
      }
      typeStats[alert.type].total++;
      if (alert.isTriggered) {
        typeStats[alert.type].triggered++;
      }
    });

    res.json({
      total: result.totalAlerts,
      triggered: result.triggeredAlerts,
      active: result.activeAlerts,
      recent24h: recentNotifications,
      byType: typeStats,
      successRate: result.totalAlerts > 0 ? 
        Math.round((result.triggeredAlerts / result.totalAlerts) * 100) : 0
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unsubscribe from notifications (public route)
router.get('/unsubscribe/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // In a real implementation, you'd decode the token to get user info
    // For now, just return a success page
    
    res.send(`
      <html>
        <head>
          <title>Unsubscribed - Cryptosden</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 500px; margin: 0 auto; }
            .success { color: #10b981; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">Successfully Unsubscribed</h1>
            <p>You have been unsubscribed from Cryptosden notifications.</p>
            <p>You can update your notification preferences anytime in your account settings.</p>
            <a href="http://localhost:3000/login">Return to Cryptosden</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    res.status(500).send('Error processing unsubscribe request');
  }
});

module.exports = router;