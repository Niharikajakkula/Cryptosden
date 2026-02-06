const Alert = require('../models/Alert');
const User = require('../models/User');
const notificationService = require('./notificationService');
const axios = require('axios');

class AlertService {
  constructor() {
    this.isRunning = false;
    this.checkInterval = 60000; // Check every minute
    this.marketData = new Map();
  }

  // Start the alert monitoring system
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Alert Service started');
    
    // Initial check
    this.checkAlerts();
    
    // Set up recurring checks
    this.intervalId = setInterval(() => {
      this.checkAlerts();
    }, this.checkInterval);
  }

  // Stop the alert monitoring system
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    console.log('Alert Service stopped');
  }

  // Main alert checking function
  async checkAlerts() {
    try {
      console.log('Checking alerts...');
      
      // Get all active alerts
      const alerts = await Alert.find({ 
        isActive: true, 
        isTriggered: false 
      }).populate('userId');

      if (alerts.length === 0) {
        console.log('No active alerts to check');
        return;
      }

      // Group alerts by cryptocurrency for efficient API calls
      const cryptoGroups = this.groupAlertsByCrypto(alerts);
      
      // Fetch market data for all required cryptocurrencies
      await this.fetchMarketData(Object.keys(cryptoGroups));
      
      // Check each alert
      for (const alert of alerts) {
        await this.checkIndividualAlert(alert);
      }
      
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  // Group alerts by cryptocurrency
  groupAlertsByCrypto(alerts) {
    const groups = {};
    alerts.forEach(alert => {
      if (!groups[alert.cryptocurrency]) {
        groups[alert.cryptocurrency] = [];
      }
      groups[alert.cryptocurrency].push(alert);
    });
    return groups;
  }

  // Fetch market data from CoinGecko API
  async fetchMarketData(cryptoIds) {
    try {
      const ids = cryptoIds.join(',');
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
        params: {
          ids: ids,
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_24hr_vol: true,
          include_market_cap: true
        }
      });

      // Store market data
      Object.entries(response.data).forEach(([crypto, data]) => {
        this.marketData.set(crypto, {
          price: data.usd,
          change24h: data.usd_24h_change,
          volume24h: data.usd_24h_vol,
          marketCap: data.usd_market_cap,
          timestamp: Date.now()
        });
      });

      console.log(`Fetched market data for ${cryptoIds.length} cryptocurrencies`);
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  }

  // Check individual alert
  async checkIndividualAlert(alert) {
    try {
      const marketData = this.marketData.get(alert.cryptocurrency);
      if (!marketData) {
        console.log(`No market data available for ${alert.cryptocurrency}`);
        return;
      }

      let shouldTrigger = false;
      let currentValue = 0;
      let message = '';

      switch (alert.type) {
        case 'price':
          shouldTrigger = this.checkPriceAlert(alert, marketData);
          currentValue = marketData.price;
          break;
        case 'sentiment':
          shouldTrigger = await this.checkSentimentAlert(alert, marketData);
          currentValue = alert.metadata?.sentimentScore || 0;
          break;
        case 'risk':
          shouldTrigger = await this.checkRiskAlert(alert, marketData);
          currentValue = this.calculateRiskScore(marketData);
          break;
        case 'volume':
          shouldTrigger = this.checkVolumeAlert(alert, marketData);
          currentValue = marketData.volume24h;
          break;
        case 'technical':
          shouldTrigger = await this.checkTechnicalAlert(alert, marketData);
          currentValue = marketData.price;
          break;
      }

      // Update alert with current value
      alert.currentValue = currentValue;
      alert.lastChecked = new Date();

      if (shouldTrigger) {
        await this.triggerAlert(alert, marketData);
      }

      await alert.save();

    } catch (error) {
      console.error(`Error checking alert ${alert._id}:`, error);
    }
  }

  // Check price-based alerts
  checkPriceAlert(alert, marketData) {
    const currentPrice = marketData.price;
    const threshold = alert.threshold;

    switch (alert.condition) {
      case 'above':
        return currentPrice > threshold;
      case 'below':
        return currentPrice < threshold;
      case 'crosses_up':
        return alert.currentValue <= threshold && currentPrice > threshold;
      case 'crosses_down':
        return alert.currentValue >= threshold && currentPrice < threshold;
      case 'change_percent':
        return Math.abs(marketData.change24h) >= threshold;
      default:
        return false;
    }
  }

  // Check sentiment-based alerts
  async checkSentimentAlert(alert, marketData) {
    try {
      // Simulate sentiment analysis (in real implementation, this would call sentiment API)
      const sentimentScore = this.calculateSentimentScore(marketData);
      alert.metadata = { ...alert.metadata, sentimentScore };

      switch (alert.condition) {
        case 'above':
          return sentimentScore > alert.threshold;
        case 'below':
          return sentimentScore < alert.threshold;
        case 'change_percent':
          const previousSentiment = alert.currentValue || 0;
          const change = Math.abs(sentimentScore - previousSentiment);
          return change >= alert.threshold;
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking sentiment alert:', error);
      return false;
    }
  }

  // Check risk-based alerts
  async checkRiskAlert(alert, marketData) {
    const riskScore = this.calculateRiskScore(marketData);
    alert.metadata = { ...alert.metadata, riskLevel: this.getRiskLevel(riskScore) };

    switch (alert.condition) {
      case 'above':
        return riskScore > alert.threshold;
      case 'below':
        return riskScore < alert.threshold;
      default:
        return false;
    }
  }

  // Check volume-based alerts
  checkVolumeAlert(alert, marketData) {
    const currentVolume = marketData.volume24h;
    const threshold = alert.threshold;

    switch (alert.condition) {
      case 'above':
        return currentVolume > threshold;
      case 'below':
        return currentVolume < threshold;
      case 'change_percent':
        // Calculate volume change (simplified)
        const volumeChange = Math.abs(marketData.change24h);
        return volumeChange >= threshold;
      default:
        return false;
    }
  }

  // Check technical indicator alerts
  async checkTechnicalAlert(alert, marketData) {
    // Simulate technical analysis (RSI, MACD, etc.)
    const technicalValue = this.calculateTechnicalIndicator(alert.metadata?.technicalIndicator, marketData);
    
    switch (alert.condition) {
      case 'above':
        return technicalValue > alert.threshold;
      case 'below':
        return technicalValue < alert.threshold;
      default:
        return false;
    }
  }

  // Trigger an alert
  async triggerAlert(alert, marketData) {
    try {
      console.log(`Triggering alert ${alert._id} for user ${alert.userId._id}`);

      // Mark alert as triggered
      alert.isTriggered = true;
      alert.triggeredAt = new Date();

      // Generate alert message
      const message = this.generateAlertMessage(alert, marketData);
      alert.message = message;

      // Send notifications based on user preferences
      await this.sendNotifications(alert, message);

      // Log the triggered alert
      console.log(`Alert triggered: ${message}`);

    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  }

  // Generate alert message
  generateAlertMessage(alert, marketData) {
    const crypto = alert.cryptocurrency.toUpperCase();
    const currentValue = alert.currentValue;
    const threshold = alert.threshold;

    switch (alert.type) {
      case 'price':
        return `${crypto} price alert: $${currentValue.toFixed(2)} ${alert.condition} $${threshold.toFixed(2)}`;
      case 'sentiment':
        return `${crypto} sentiment alert: Score ${currentValue.toFixed(2)} (threshold: ${threshold})`;
      case 'risk':
        return `${crypto} risk alert: Risk level ${alert.metadata?.riskLevel} (score: ${currentValue.toFixed(2)})`;
      case 'volume':
        return `${crypto} volume alert: $${(currentValue / 1e6).toFixed(2)}M volume`;
      case 'technical':
        return `${crypto} technical alert: ${alert.metadata?.technicalIndicator} signal triggered`;
      default:
        return `${crypto} alert triggered`;
    }
  }

  // Send notifications
  async sendNotifications(alert, message) {
    const user = alert.userId;
    
    try {
      const results = await notificationService.sendNotification(
        user, 
        alert, 
        message, 
        alert.notificationMethod
      );
      
      console.log('📬 Notification results:', results);
      return results;
    } catch (error) {
      console.error('❌ Error sending notifications:', error);
      return { error: error.message };
    }
  }

  // Helper functions for calculations
  calculateSentimentScore(marketData) {
    // Simplified sentiment calculation based on price change and volume
    const priceChange = marketData.change24h || 0;
    const volumeRatio = marketData.volume24h / marketData.marketCap || 0;
    
    let sentiment = 50; // Neutral
    sentiment += priceChange * 2; // Price impact
    sentiment += volumeRatio * 1000; // Volume impact
    
    return Math.max(0, Math.min(100, sentiment));
  }

  calculateRiskScore(marketData) {
    // Simplified risk calculation
    const volatility = Math.abs(marketData.change24h || 0);
    const volumeRatio = marketData.volume24h / marketData.marketCap || 0;
    
    let risk = volatility * 2 + volumeRatio * 100;
    return Math.max(0, Math.min(100, risk));
  }

  getRiskLevel(riskScore) {
    if (riskScore < 20) return 'Low';
    if (riskScore < 50) return 'Medium';
    if (riskScore < 80) return 'High';
    return 'Extreme';
  }

  calculateTechnicalIndicator(indicator, marketData) {
    // Simplified technical indicator calculation
    switch (indicator) {
      case 'RSI':
        return Math.random() * 100; // Placeholder
      case 'MACD':
        return (Math.random() - 0.5) * 10; // Placeholder
      default:
        return marketData.price;
    }
  }
}

module.exports = new AlertService();