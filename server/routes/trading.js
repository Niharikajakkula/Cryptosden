const express = require('express');
const TradingService = require('../services/tradingService');
const Order = require('../models/Order');
const { 
  authenticateToken, 
  requireTrader, 
  requireVerification,
  requireKYC 
} = require('../middleware/auth');
const router = express.Router();

// Get supported trading pairs
router.get('/pairs', (req, res) => {
  try {
    const tradingPairs = TradingService.getTradingPairs();
    res.json(tradingPairs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get market data for all pairs
router.get('/market-data', async (req, res) => {
  try {
    const marketData = await TradingService.getMarketData();
    res.json(marketData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get market data', error: error.message });
  }
});

// Get order book for a specific pair
router.get('/orderbook/:pair', async (req, res) => {
  try {
    const { pair } = req.params;
    const { depth = 20 } = req.query;
    
    const orderBook = await TradingService.getOrderBook(pair, parseInt(depth));
    res.json(orderBook);
  } catch (error) {
    res.status(400).json({ message: 'Failed to get order book', error: error.message });
  }
});

// Place a new order (requires trader role and verification)
router.post('/orders', requireTrader, async (req, res) => {
  try {
    const { type, side, pair, amount, price, stopPrice, timeInForce } = req.body;
    
    // Validate required fields
    if (!type || !side || !pair || !amount) {
      return res.status(400).json({ message: 'Missing required fields: type, side, pair, amount' });
    }
    
    // Validate limit order has price
    if ((type === 'limit' || type === 'stop-limit') && !price) {
      return res.status(400).json({ message: 'Price is required for limit orders' });
    }
    
    // Validate stop orders have stop price
    if ((type === 'stop-loss' || type === 'stop-limit') && !stopPrice) {
      return res.status(400).json({ message: 'Stop price is required for stop orders' });
    }
    
    // Require KYC for large orders (over $10,000 equivalent)
    const orderValue = amount * (price || 50000); // Estimate with high price for market orders
    if (orderValue > 10000 && req.user.kycStatus !== 'approved') {
      return res.status(403).json({ 
        message: 'KYC verification required for large orders',
        kycStatus: req.user.kycStatus,
        action: 'complete_kyc'
      });
    }
    
    const order = await TradingService.placeOrder(req.user._id, {
      type,
      side,
      pair: pair.toUpperCase(),
      amount: parseFloat(amount),
      price: price ? parseFloat(price) : null,
      stopPrice: stopPrice ? parseFloat(stopPrice) : null,
      timeInForce
    });
    
    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        id: order._id,
        type: order.type,
        side: order.side,
        pair: order.pair,
        amount: order.amount,
        price: order.price,
        filled: order.filled,
        remaining: order.remaining,
        status: order.status,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    res.status(400).json({ message: 'Failed to place order', error: error.message });
  }
});

// Get user orders
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const { 
      status, 
      pair, 
      side, 
      type, 
      limit = 50, 
      skip = 0,
      startDate,
      endDate 
    } = req.query;
    
    const orders = await TradingService.getUserOrders(req.user._id, {
      status,
      pair: pair?.toUpperCase(),
      side,
      type,
      limit: parseInt(limit),
      skip: parseInt(skip),
      startDate,
      endDate
    });
    
    const formattedOrders = orders.map(order => ({
      id: order._id,
      type: order.type,
      side: order.side,
      pair: order.pair,
      amount: order.amount,
      price: order.price,
      stopPrice: order.stopPrice,
      filled: order.filled,
      remaining: order.remaining,
      averagePrice: order.averagePrice,
      status: order.status,
      totalFee: order.totalFee,
      fillPercentage: order.fillPercentage,
      createdAt: order.createdAt,
      executedAt: order.executedAt,
      cancelledAt: order.cancelledAt
    }));
    
    res.json({
      orders: formattedOrders,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        total: orders.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get orders', error: error.message });
  }
});

// Get specific order
router.get('/orders/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ _id: orderId, userId: req.user._id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({
      id: order._id,
      type: order.type,
      side: order.side,
      pair: order.pair,
      baseAsset: order.baseAsset,
      quoteAsset: order.quoteAsset,
      amount: order.amount,
      price: order.price,
      stopPrice: order.stopPrice,
      filled: order.filled,
      remaining: order.remaining,
      averagePrice: order.averagePrice,
      status: order.status,
      timeInForce: order.timeInForce,
      totalFee: order.totalFee,
      feeAsset: order.feeAsset,
      fillPercentage: order.fillPercentage,
      totalValue: order.totalValue,
      filledValue: order.filledValue,
      createdAt: order.createdAt,
      executedAt: order.executedAt,
      cancelledAt: order.cancelledAt,
      rejectedAt: order.rejectedAt,
      rejectionReason: order.rejectionReason
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get order', error: error.message });
  }
});

// Cancel order
router.delete('/orders/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await TradingService.cancelOrder(req.user._id, orderId);
    
    res.json({
      message: 'Order cancelled successfully',
      order: {
        id: order._id,
        status: order.status,
        cancelledAt: order.cancelledAt
      }
    });
  } catch (error) {
    res.status(400).json({ message: 'Failed to cancel order', error: error.message });
  }
});

// Get user trading statistics
router.get('/stats/volume', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const volumeStats = await Order.getUserTradingVolume(req.user._id, parseInt(days));
    
    res.json({
      period: `${days} days`,
      volumeByPair: volumeStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get trading statistics', error: error.message });
  }
});

// Get open orders summary
router.get('/orders/open/summary', authenticateToken, async (req, res) => {
  try {
    const openOrders = await Order.find({ 
      userId: req.user._id, 
      status: { $in: ['open', 'partially_filled'] }
    });
    
    const summary = {
      totalOrders: openOrders.length,
      buyOrders: openOrders.filter(o => o.side === 'buy').length,
      sellOrders: openOrders.filter(o => o.side === 'sell').length,
      totalValue: openOrders.reduce((sum, order) => sum + order.totalValue, 0),
      byPair: {}
    };
    
    // Group by trading pair
    openOrders.forEach(order => {
      if (!summary.byPair[order.pair]) {
        summary.byPair[order.pair] = {
          count: 0,
          buyCount: 0,
          sellCount: 0,
          totalValue: 0
        };
      }
      
      summary.byPair[order.pair].count++;
      if (order.side === 'buy') {
        summary.byPair[order.pair].buyCount++;
      } else {
        summary.byPair[order.pair].sellCount++;
      }
      summary.byPair[order.pair].totalValue += order.totalValue;
    });
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get open orders summary', error: error.message });
  }
});

// Get recent trades (filled orders)
router.get('/trades/recent', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, pair } = req.query;
    
    const query = { 
      userId: req.user._id, 
      status: { $in: ['filled', 'partially_filled'] },
      filled: { $gt: 0 }
    };
    
    if (pair) {
      query.pair = pair.toUpperCase();
    }
    
    const trades = await Order.find(query)
      .sort({ executedAt: -1, createdAt: -1 })
      .limit(parseInt(limit));
    
    const formattedTrades = trades.map(trade => ({
      id: trade._id,
      pair: trade.pair,
      side: trade.side,
      amount: trade.filled,
      price: trade.averagePrice,
      value: trade.filledValue,
      fee: trade.totalFee,
      feeAsset: trade.feeAsset,
      executedAt: trade.executedAt || trade.createdAt
    }));
    
    res.json(formattedTrades);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get recent trades', error: error.message });
  }
});

module.exports = router;