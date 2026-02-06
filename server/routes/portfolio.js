const express = require('express');
const Portfolio = require('../models/Portfolio');
const { authenticateToken, requireTrader } = require('../middleware/auth');
const router = express.Router();

// Get user portfolio
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeframe = '24h' } = req.query;

    let portfolio = await Portfolio.getOrCreatePortfolio(userId);

    // If portfolio exists, update with latest prices
    if (portfolio.holdings.length > 0) {
      // In a real implementation, you would fetch current prices from an API
      // For now, we'll use mock price data
      const mockPriceData = {
        'BTC': 45000,
        'ETH': 3000,
        'BNB': 400,
        'ADA': 0.5,
        'SOL': 100
      };

      portfolio.updatePrices(mockPriceData);
      await portfolio.save();
    }

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get portfolio allocation
router.get('/allocation', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const portfolio = await Portfolio.findOne({ userId });

    if (!portfolio) {
      return res.json({ allocation: [] });
    }

    const allocation = portfolio.allocation;
    res.json({ allocation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get portfolio performance history
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeframe = '30d' } = req.query;

    // In a real implementation, you would store historical portfolio values
    // For now, return mock performance data
    const mockPerformanceData = [
      { date: '2024-01-01', value: 10000 },
      { date: '2024-01-02', value: 10200 },
      { date: '2024-01-03', value: 9800 },
      { date: '2024-01-04', value: 10500 },
      { date: '2024-01-05', value: 11000 }
    ];

    res.json({ performance: mockPerformanceData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update portfolio holding (called when trades are executed)
router.post('/update-holding', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { cryptocurrency, amount, price, type } = req.body;

    let portfolio = await Portfolio.getOrCreatePortfolio(userId);
    portfolio.updateHolding(cryptocurrency, amount, price, type);
    await portfolio.save();

    res.json({
      message: 'Portfolio updated successfully',
      portfolio
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;