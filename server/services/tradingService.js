const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const WalletService = require('./walletService');
const axios = require('axios');

class TradingService {
  // Supported trading pairs
  static TRADING_PAIRS = {
    'BTC/USDT': { baseAsset: 'BTC', quoteAsset: 'USDT', minAmount: 0.0001, maxAmount: 1000 },
    'ETH/USDT': { baseAsset: 'ETH', quoteAsset: 'USDT', minAmount: 0.001, maxAmount: 10000 },
    'BNB/USDT': { baseAsset: 'BNB', quoteAsset: 'USDT', minAmount: 0.01, maxAmount: 50000 },
    'ETH/BTC': { baseAsset: 'ETH', quoteAsset: 'BTC', minAmount: 0.001, maxAmount: 1000 },
    'BNB/BTC': { baseAsset: 'BNB', quoteAsset: 'BTC', minAmount: 0.01, maxAmount: 1000 }
  };

  // Get current market price from external API
  static async getMarketPrice(pair) {
    try {
      // Convert pair format (BTC/USDT -> BTCUSDT)
      const symbol = pair.replace('/', '').toLowerCase();
      
      // In production, use real exchange APIs like Binance, Coinbase, etc.
      // For now, we'll simulate with CoinGecko data
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
        params: {
          ids: this.getCoinGeckoId(pair.split('/')[0]),
          vs_currencies: pair.split('/')[1].toLowerCase()
        }
      });
      
      const coinId = this.getCoinGeckoId(pair.split('/')[0]);
      const currency = pair.split('/')[1].toLowerCase();
      
      return response.data[coinId]?.[currency] || 0;
    } catch (error) {
      console.error('Failed to get market price:', error);
      // Return fallback prices for demo
      const fallbackPrices = {
        'BTC/USDT': 45000,
        'ETH/USDT': 3000,
        'BNB/USDT': 300,
        'ETH/BTC': 0.067,
        'BNB/BTC': 0.0067
      };
      return fallbackPrices[pair] || 0;
    }
  }

  // Map trading symbols to CoinGecko IDs
  static getCoinGeckoId(symbol) {
    const mapping = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'BNB': 'binancecoin',
      'USDT': 'tether'
    };
    return mapping[symbol] || symbol.toLowerCase();
  }

  // Place a new order
  static async placeOrder(userId, orderData) {
    try {
      const { type, side, pair, amount, price, stopPrice, timeInForce = 'GTC' } = orderData;
      
      // Validate trading pair
      if (!this.TRADING_PAIRS[pair]) {
        throw new Error(`Unsupported trading pair: ${pair}`);
      }
      
      const pairConfig = this.TRADING_PAIRS[pair];
      
      // Validate amount
      if (amount < pairConfig.minAmount || amount > pairConfig.maxAmount) {
        throw new Error(`Amount must be between ${pairConfig.minAmount} and ${pairConfig.maxAmount}`);
      }
      
      // Get user wallets
      const userWallets = await WalletService.getUserWallets(userId);
      const baseWallet = userWallets.find(w => w.cryptocurrency === pairConfig.baseAsset);
      const quoteWallet = userWallets.find(w => w.cryptocurrency === pairConfig.quoteAsset);
      
      if (!baseWallet || !quoteWallet) {
        throw new Error('Required wallets not found. Please create wallets for both assets.');
      }
      
      // Validate balance based on order side
      let requiredBalance = 0;
      let walletToCheck = null;
      
      if (side === 'buy') {
        // For buy orders, need quote asset (e.g., USDT to buy BTC)
        const orderPrice = type === 'market' ? await this.getMarketPrice(pair) : price;
        requiredBalance = amount * orderPrice;
        walletToCheck = quoteWallet;
      } else {
        // For sell orders, need base asset (e.g., BTC to sell)
        requiredBalance = amount;
        walletToCheck = baseWallet;
      }
      
      if (walletToCheck.availableBalance < requiredBalance) {
        throw new Error(`Insufficient ${walletToCheck.cryptocurrency} balance. Required: ${requiredBalance}, Available: ${walletToCheck.availableBalance}`);
      }
      
      // Create order
      const order = new Order({
        userId,
        type,
        side,
        pair,
        baseAsset: pairConfig.baseAsset,
        quoteAsset: pairConfig.quoteAsset,
        amount,
        price: type === 'market' ? null : price,
        stopPrice,
        timeInForce,
        clientOrderId: `${userId}_${Date.now()}`,
        source: 'web'
      });
      
      await order.save();
      
      // Lock the required balance
      const wallet = await Wallet.findById(walletToCheck.id);
      await wallet.lockBalance(requiredBalance);
      
      // Process order based on type
      if (type === 'market') {
        await this.executeMarketOrder(order);
      } else if (type === 'limit') {
        await this.processLimitOrder(order);
      }
      
      return order;
    } catch (error) {
      throw new Error(`Failed to place order: ${error.message}`);
    }
  }

  // Execute market order immediately
  static async executeMarketOrder(order) {
    try {
      const marketPrice = await this.getMarketPrice(order.pair);
      
      if (marketPrice <= 0) {
        await order.reject('Market price not available');
        return;
      }
      
      // Execute the order at market price
      await order.fill(order.amount, marketPrice);
      
      // Create trade transaction
      await this.createTradeTransaction(order, order.amount, marketPrice);
      
      console.log(`Market order executed: ${order.side} ${order.amount} ${order.baseAsset} at ${marketPrice}`);
    } catch (error) {
      await order.reject(`Market execution failed: ${error.message}`);
      throw error;
    }
  }

  // Process limit order (add to order book)
  static async processLimitOrder(order) {
    try {
      // Check if order can be matched immediately
      const matchingOrders = await Order.getOpenOrders(
        order.pair, 
        order.side === 'buy' ? 'sell' : 'buy'
      );
      
      let remainingAmount = order.amount;
      
      for (const matchingOrder of matchingOrders) {
        if (remainingAmount <= 0) break;
        
        // Check if prices match
        const canMatch = order.side === 'buy' 
          ? order.price >= matchingOrder.price
          : order.price <= matchingOrder.price;
        
        if (canMatch) {
          const fillAmount = Math.min(remainingAmount, matchingOrder.remaining);
          const fillPrice = matchingOrder.price;
          
          // Fill both orders
          await order.fill(fillAmount, fillPrice);
          await matchingOrder.fill(fillAmount, fillPrice);
          
          // Create trade transactions
          await this.createTradeTransaction(order, fillAmount, fillPrice);
          await this.createTradeTransaction(matchingOrder, fillAmount, fillPrice);
          
          remainingAmount -= fillAmount;
          
          console.log(`Orders matched: ${fillAmount} ${order.baseAsset} at ${fillPrice}`);
        }
      }
      
      // If order is not fully filled, it remains in the order book
      if (remainingAmount > 0) {
        console.log(`Limit order added to book: ${order.side} ${remainingAmount} ${order.baseAsset} at ${order.price}`);
      }
    } catch (error) {
      await order.reject(`Limit order processing failed: ${error.message}`);
      throw error;
    }
  }

  // Create trade transaction
  static async createTradeTransaction(order, fillAmount, fillPrice) {
    try {
      const userWallets = await WalletService.getUserWallets(order.userId);
      const baseWallet = userWallets.find(w => w.cryptocurrency === order.baseAsset);
      const quoteWallet = userWallets.find(w => w.cryptocurrency === order.quoteAsset);
      
      if (order.side === 'buy') {
        // Buying base asset with quote asset
        const quoteAmount = fillAmount * fillPrice;
        const fee = quoteAmount * order.takerFee;
        
        // Deduct quote asset
        const quoteWalletModel = await Wallet.findById(quoteWallet.id);
        await quoteWalletModel.updateBalance(quoteAmount + fee, 'subtract');
        await quoteWalletModel.unlockBalance(quoteAmount + fee);
        
        // Add base asset
        const baseWalletModel = await Wallet.findById(baseWallet.id);
        await baseWalletModel.updateBalance(fillAmount, 'add');
        
        // Create transaction record
        const transaction = new Transaction({
          userId: order.userId,
          walletId: baseWallet.id,
          type: 'trade',
          cryptocurrency: order.baseAsset,
          amount: fillAmount,
          fee: fee,
          netAmount: fillAmount,
          status: 'confirmed',
          tradeOrderId: order._id,
          tradePair: order.pair,
          tradePrice: fillPrice,
          description: `Buy ${fillAmount} ${order.baseAsset} at ${fillPrice}`,
          confirmedAt: new Date()
        });
        
        await transaction.save();
      } else {
        // Selling base asset for quote asset
        const quoteAmount = fillAmount * fillPrice;
        const fee = quoteAmount * order.makerFee;
        
        // Deduct base asset
        const baseWalletModel = await Wallet.findById(baseWallet.id);
        await baseWalletModel.updateBalance(fillAmount, 'subtract');
        await baseWalletModel.unlockBalance(fillAmount);
        
        // Add quote asset (minus fee)
        const quoteWalletModel = await Wallet.findById(quoteWallet.id);
        await quoteWalletModel.updateBalance(quoteAmount - fee, 'add');
        
        // Create transaction record
        const transaction = new Transaction({
          userId: order.userId,
          walletId: quoteWallet.id,
          type: 'trade',
          cryptocurrency: order.quoteAsset,
          amount: quoteAmount - fee,
          fee: fee,
          netAmount: quoteAmount - fee,
          status: 'confirmed',
          tradeOrderId: order._id,
          tradePair: order.pair,
          tradePrice: fillPrice,
          description: `Sell ${fillAmount} ${order.baseAsset} at ${fillPrice}`,
          confirmedAt: new Date()
        });
        
        await transaction.save();
      }
    } catch (error) {
      console.error('Failed to create trade transaction:', error);
      throw error;
    }
  }

  // Cancel order
  static async cancelOrder(userId, orderId) {
    try {
      const order = await Order.findOne({ _id: orderId, userId });
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      if (order.status === 'filled') {
        throw new Error('Cannot cancel a filled order');
      }
      
      if (order.status === 'cancelled') {
        throw new Error('Order is already cancelled');
      }
      
      // Unlock locked balance
      const userWallets = await WalletService.getUserWallets(userId);
      let walletToUnlock = null;
      let amountToUnlock = 0;
      
      if (order.side === 'buy') {
        walletToUnlock = userWallets.find(w => w.cryptocurrency === order.quoteAsset);
        amountToUnlock = order.remaining * (order.price || 0);
      } else {
        walletToUnlock = userWallets.find(w => w.cryptocurrency === order.baseAsset);
        amountToUnlock = order.remaining;
      }
      
      if (walletToUnlock && amountToUnlock > 0) {
        const wallet = await Wallet.findById(walletToUnlock.id);
        await wallet.unlockBalance(amountToUnlock);
      }
      
      await order.cancel('User cancelled');
      
      return order;
    } catch (error) {
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  }

  // Get order book for a trading pair
  static async getOrderBook(pair, depth = 20) {
    try {
      if (!this.TRADING_PAIRS[pair]) {
        throw new Error(`Unsupported trading pair: ${pair}`);
      }
      
      return await Order.getOrderBook(pair, depth);
    } catch (error) {
      throw new Error(`Failed to get order book: ${error.message}`);
    }
  }

  // Get user orders
  static async getUserOrders(userId, options = {}) {
    try {
      return await Order.getUserOrders(userId, options);
    } catch (error) {
      throw new Error(`Failed to get user orders: ${error.message}`);
    }
  }

  // Get trading pairs
  static getTradingPairs() {
    return Object.keys(this.TRADING_PAIRS).map(pair => ({
      pair,
      baseAsset: this.TRADING_PAIRS[pair].baseAsset,
      quoteAsset: this.TRADING_PAIRS[pair].quoteAsset,
      minAmount: this.TRADING_PAIRS[pair].minAmount,
      maxAmount: this.TRADING_PAIRS[pair].maxAmount
    }));
  }

  // Get market data for all pairs
  static async getMarketData() {
    try {
      const pairs = Object.keys(this.TRADING_PAIRS);
      const marketData = {};
      
      for (const pair of pairs) {
        const price = await this.getMarketPrice(pair);
        const orderBook = await this.getOrderBook(pair, 1);
        
        marketData[pair] = {
          price,
          bid: orderBook.bids[0]?.price || 0,
          ask: orderBook.asks[0]?.price || 0,
          spread: orderBook.asks[0]?.price && orderBook.bids[0]?.price 
            ? orderBook.asks[0].price - orderBook.bids[0].price 
            : 0
        };
      }
      
      return marketData;
    } catch (error) {
      throw new Error(`Failed to get market data: ${error.message}`);
    }
  }
}

module.exports = TradingService;