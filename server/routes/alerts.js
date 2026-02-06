const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Alert = require('../models/Alert');
const { authenticateToken } = require('../middleware/auth');
const alertService = require('../services/alertService');

// Get all alerts for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/alerts - User ID:', req.user._id);
    console.log('GET /api/alerts - User Email:', req.user.email);
    
    const alerts = await Alert.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    console.log('GET /api/alerts - Found alerts:', alerts.length);
    
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new alert
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('POST /api/alerts - Request received'); // Debug log
    console.log('User:', req.user?.id, req.user?._id, req.user?.email); // Debug log
    console.log('Request body:', req.body); // Debug log
    
    const {
      type,
      cryptocurrency,
      condition,
      threshold,
      notificationMethod,
      metadata
    } = req.body;

    // Validate required fields
    if (!type || !cryptocurrency || !condition || threshold === undefined) {
      return res.status(400).json({ 
        message: 'Missing required fields: type, cryptocurrency, condition, threshold' 
      });
    }

    // Validate alert type
    const validTypes = ['price', 'sentiment', 'risk', 'volume', 'technical'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        message: 'Invalid alert type. Must be one of: ' + validTypes.join(', ') 
      });
    }

    // Validate condition
    const validConditions = ['above', 'below', 'crosses_up', 'crosses_down', 'change_percent'];
    if (!validConditions.includes(condition)) {
      return res.status(400).json({ 
        message: 'Invalid condition. Must be one of: ' + validConditions.join(', ') 
      });
    }

    // Create new alert
    const alert = new Alert({
      userId: req.user._id,
      type,
      cryptocurrency: cryptocurrency.toLowerCase(),
      condition,
      threshold: parseFloat(threshold),
      notificationMethod: notificationMethod || ['email'],
      metadata: metadata || {}
    });

    await alert.save();
    console.log('POST /api/alerts - Alert created:', alert._id, 'for user:', req.user._id);

    res.status(201).json({
      message: 'Alert created successfully',
      alert
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an alert
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const alert = await Alert.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    const {
      type,
      cryptocurrency,
      condition,
      threshold,
      isActive,
      notificationMethod,
      metadata
    } = req.body;

    // Update fields if provided
    if (type) alert.type = type;
    if (cryptocurrency) alert.cryptocurrency = cryptocurrency.toLowerCase();
    if (condition) alert.condition = condition;
    if (threshold !== undefined) alert.threshold = parseFloat(threshold);
    if (isActive !== undefined) alert.isActive = isActive;
    if (notificationMethod) alert.notificationMethod = notificationMethod;
    if (metadata) alert.metadata = { ...alert.metadata, ...metadata };

    // Reset triggered status if alert is being reactivated
    if (isActive && alert.isTriggered) {
      alert.isTriggered = false;
      alert.triggeredAt = null;
    }

    await alert.save();

    res.json({
      message: 'Alert updated successfully',
      alert
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an alert
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const alert = await Alert.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle alert active status
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const alert = await Alert.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.isActive = !alert.isActive;
    
    // Reset triggered status if alert is being reactivated
    if (alert.isActive && alert.isTriggered) {
      alert.isTriggered = false;
      alert.triggeredAt = null;
    }

    await alert.save();

    res.json({
      message: `Alert ${alert.isActive ? 'activated' : 'deactivated'} successfully`,
      alert
    });
  } catch (error) {
    console.error('Error toggling alert:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get alert statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('GET /api/alerts/stats - User ID:', userId);
    console.log('GET /api/alerts/stats - User Email:', req.user.email);
    
    // First, let's check how many alerts this user has with a simple find
    const simpleCount = await Alert.countDocuments({ userId: userId });
    console.log('GET /api/alerts/stats - Simple count:', simpleCount);
    
    const stats = await Alert.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          triggered: { $sum: { $cond: ['$isTriggered', 1, 0] } },
          byType: {
            $push: {
              type: '$type',
              isActive: '$isActive',
              isTriggered: '$isTriggered'
            }
          }
        }
      }
    ]);

    const result = stats[0] || { total: 0, active: 0, triggered: 0, byType: [] };
    console.log('GET /api/alerts/stats - Aggregation result:', result);
    
    // Count by type
    const typeStats = {};
    result.byType.forEach(alert => {
      if (!typeStats[alert.type]) {
        typeStats[alert.type] = { total: 0, active: 0, triggered: 0 };
      }
      typeStats[alert.type].total++;
      if (alert.isActive) typeStats[alert.type].active++;
      if (alert.isTriggered) typeStats[alert.type].triggered++;
    });

    const response = {
      total: result.total,
      active: result.active,
      triggered: result.triggered,
      byType: typeStats
    };
    
    console.log('GET /api/alerts/stats - Final response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test alert (for development)
router.post('/:id/test', authenticateToken, async (req, res) => {
  try {
    const alert = await Alert.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    }).populate('userId');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Simulate triggering the alert
    const message = `Test alert: ${alert.cryptocurrency.toUpperCase()} ${alert.type} alert`;
    
    // Send test notification
    await alertService.sendEmailNotification(alert.userId, alert, message);

    res.json({ message: 'Test alert sent successfully' });
  } catch (error) {
    console.error('Error sending test alert:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;