const express = require('express');
const axios = require('axios');
const CryptoData = require('../models/CryptoData');
const router = express.Router();

// Get top cryptocurrencies
router.get('/top', async (req, res) => {
  console.log('📊 Crypto API called - /top');
  try {
    const { limit = 50, currency = 'usd' } = req.query;
    console.log(`   Fetching ${limit} cryptocurrencies`);
    
    // Try to get from database first
    try {
      let cryptos = await CryptoData.find()
        .sort({ marketCap: -1 })
        .limit(parseInt(limit));
      
      // If no data or data is old, fetch from API
      if (cryptos.length === 0 || isDataStale(cryptos[0].lastUpdated)) {
        await updateCryptoData(limit, currency);
        cryptos = await CryptoData.find()
          .sort({ marketCap: -1 })
          .limit(parseInt(limit));
      }
      
      if (cryptos.length > 0) {
        console.log(`   ✅ Returning ${cryptos.length} cryptos from database`);
        return res.json(cryptos);
      }
    } catch (dbError) {
      console.log('   ⚠️  Database not available, fetching from API directly');
    }
    
    // Fallback: Fetch directly from API if database is not available
    console.log('   🌐 Fetching from CoinGecko API...');
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/markets`, {
      params: {
        vs_currency: currency,
        order: 'market_cap_desc',
        per_page: parseInt(limit),
        page: 1,
        sparkline: false,
        price_change_percentage: '24h'
      }
    });
    
    console.log(`   ✅ Fetched ${response.data.length} cryptos from API`);
    
    const cryptos = response.data.map(coin => {
      const cryptoData = {
        coinId: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        currentPrice: coin.current_price,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
        priceChange24h: coin.price_change_24h,
        priceChangePercentage24h: coin.price_change_percentage_24h,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        maxSupply: coin.max_supply,
        ath: coin.ath,
        athDate: new Date(coin.ath_date),
        atl: coin.atl,
        atlDate: new Date(coin.atl_date),
        lastUpdated: new Date()
      };
      
      // Calculate custom metrics
      cryptoData.trustScore = calculateTrustScore(cryptoData);
      cryptoData.emotionalVolatilityIndex = calculateEVI(cryptoData);
      
      return cryptoData;
    });
    
    console.log(`   📤 Sending response with ${cryptos.length} cryptos`);
    res.json(cryptos);
  } catch (error) {
    console.error('❌ Error fetching crypto data:', error.message);
    res.status(500).json({ message: 'Error fetching crypto data', error: error.message });
  }
});

// Get historical chart data
router.get('/:id/chart', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 7, interval = 'daily' } = req.query;
    
    console.log(`📈 Fetching chart data for ${id} - ${days} days`);
    
    // Fetch historical data from CoinGecko
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${id}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: parseInt(days),
        interval: interval === 'hourly' ? 'hourly' : 'daily'
      }
    });
    
    const { prices, market_caps, total_volumes } = response.data;
    
    // Format data for charts
    const chartData = prices.map((price, index) => ({
      timestamp: price[0],
      date: new Date(price[0]).toISOString(),
      price: price[1],
      marketCap: market_caps[index] ? market_caps[index][1] : null,
      volume: total_volumes[index] ? total_volumes[index][1] : null
    }));
    
    // Calculate additional metrics for each data point
    const enhancedData = chartData.map((point, index) => {
      let priceChange = 0;
      let priceChangePercentage = 0;
      
      if (index > 0) {
        const previousPrice = chartData[index - 1].price;
        priceChange = point.price - previousPrice;
        priceChangePercentage = (priceChange / previousPrice) * 100;
      }
      
      return {
        ...point,
        priceChange,
        priceChangePercentage,
        // Calculate mini EVI for this point
        evi: point.volume && point.marketCap ? 
          Math.min(100, Math.max(0, (Math.abs(priceChangePercentage) * 2) + ((point.volume / point.marketCap) * 100))) : 
          null
      };
    });
    
    // Calculate overall statistics
    const prices_only = enhancedData.map(d => d.price);
    const minPrice = Math.min(...prices_only);
    const maxPrice = Math.max(...prices_only);
    const firstPrice = prices_only[0];
    const lastPrice = prices_only[prices_only.length - 1];
    const totalChange = lastPrice - firstPrice;
    const totalChangePercentage = (totalChange / firstPrice) * 100;
    
    const statistics = {
      minPrice,
      maxPrice,
      firstPrice,
      lastPrice,
      totalChange,
      totalChangePercentage,
      dataPoints: enhancedData.length,
      period: `${days} days`,
      averageVolume: enhancedData.reduce((sum, d) => sum + (d.volume || 0), 0) / enhancedData.length
    };
    
    res.json({
      coinId: id,
      data: enhancedData,
      statistics,
      period: days,
      interval
    });
    
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ message: 'Error fetching chart data', error: error.message });
  }
});

// Get price alerts and analysis
router.get('/:id/analysis', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current crypto data
    let crypto = await CryptoData.findOne({ coinId: id });
    
    if (!crypto) {
      return res.status(404).json({ message: 'Cryptocurrency not found' });
    }
    
    // Get 30-day chart data for analysis
    const chartResponse = await axios.get(`https://api.coingecko.com/api/v3/coins/${id}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: 30
      }
    });
    
    const prices = chartResponse.data.prices.map(p => p[1]);
    const volumes = chartResponse.data.total_volumes.map(v => v[1]);
    
    // Calculate technical indicators
    const sma7 = calculateSMA(prices.slice(-7));
    const sma30 = calculateSMA(prices);
    const rsi = calculateRSI(prices.slice(-14));
    const volatility = calculateVolatility(prices);
    
    // Generate analysis
    const analysis = {
      coinId: id,
      currentPrice: crypto.currentPrice,
      trustScore: crypto.trustScore,
      emotionalVolatilityIndex: crypto.emotionalVolatilityIndex,
      technicalIndicators: {
        sma7,
        sma30,
        rsi,
        volatility,
        trend: sma7 > sma30 ? 'bullish' : 'bearish',
        momentum: rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'
      },
      priceTargets: {
        support: Math.min(...prices.slice(-7)),
        resistance: Math.max(...prices.slice(-7)),
        nextSupport: crypto.currentPrice * 0.95,
        nextResistance: crypto.currentPrice * 1.05
      },
      recommendation: generateRecommendation(crypto, { sma7, sma30, rsi, volatility }),
      riskLevel: crypto.emotionalVolatilityIndex > 70 ? 'high' : 
                 crypto.emotionalVolatilityIndex > 40 ? 'medium' : 'low',
      lastUpdated: new Date()
    };
    
    res.json(analysis);
    
  } catch (error) {
    console.error('Error generating analysis:', error);
    res.status(500).json({ message: 'Error generating analysis', error: error.message });
  }
});

// Helper functions for technical analysis
function calculateSMA(prices) {
  return prices.reduce((sum, price) => sum + price, 0) / prices.length;
}

function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50; // Default neutral RSI
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i < period + 1; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / avgLoss;
  
  return 100 - (100 / (1 + rs));
}

function calculateVolatility(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance) * 100; // Convert to percentage
}

function generateRecommendation(crypto, indicators) {
  const { sma7, sma30, rsi, volatility } = indicators;
  
  let score = 0;
  let reasons = [];
  
  // Trust score factor
  if (crypto.trustScore > 70) {
    score += 2;
    reasons.push('High trust score');
  } else if (crypto.trustScore < 40) {
    score -= 2;
    reasons.push('Low trust score');
  }
  
  // Trend factor
  if (sma7 > sma30) {
    score += 1;
    reasons.push('Bullish trend');
  } else {
    score -= 1;
    reasons.push('Bearish trend');
  }
  
  // RSI factor
  if (rsi < 30) {
    score += 1;
    reasons.push('Oversold condition');
  } else if (rsi > 70) {
    score -= 1;
    reasons.push('Overbought condition');
  }
  
  // Volatility factor
  if (volatility > 10) {
    score -= 1;
    reasons.push('High volatility');
  }
  
  // EVI factor
  if (crypto.emotionalVolatilityIndex > 80) {
    score -= 2;
    reasons.push('Extreme market emotion');
  }
  
  let recommendation;
  if (score >= 2) recommendation = 'BUY';
  else if (score <= -2) recommendation = 'SELL';
  else recommendation = 'HOLD';
  
  return {
    action: recommendation,
    confidence: Math.min(100, Math.max(0, 50 + (score * 10))),
    reasons,
    disclaimer: 'This is not financial advice. Always do your own research.'
  };
}
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try database first
    try {
      let crypto = await CryptoData.findOne({ coinId: id });
      
      if (!crypto || isDataStale(crypto.lastUpdated)) {
        // Fetch fresh data for this specific coin
        await updateSingleCrypto(id);
        crypto = await CryptoData.findOne({ coinId: id });
      }
      
      if (crypto) {
        return res.json(crypto);
      }
    } catch (dbError) {
      console.log('Database not available, fetching from API directly');
    }
    
    // Fallback: Fetch directly from API
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${id}`);
    const coin = response.data;
    
    const cryptoData = {
      coinId: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      currentPrice: coin.market_data.current_price.usd,
      marketCap: coin.market_data.market_cap.usd,
      volume24h: coin.market_data.total_volume.usd,
      priceChange24h: coin.market_data.price_change_24h,
      priceChangePercentage24h: coin.market_data.price_change_percentage_24h,
      circulatingSupply: coin.market_data.circulating_supply,
      totalSupply: coin.market_data.total_supply,
      maxSupply: coin.market_data.max_supply,
      ath: coin.market_data.ath.usd,
      athDate: new Date(coin.market_data.ath_date.usd),
      atl: coin.market_data.atl.usd,
      atlDate: new Date(coin.market_data.atl_date.usd),
      lastUpdated: new Date()
    };
    
    cryptoData.trustScore = calculateTrustScore(cryptoData);
    cryptoData.emotionalVolatilityIndex = calculateEVI(cryptoData);
    
    res.json(cryptoData);
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    res.status(500).json({ message: 'Cryptocurrency not found', error: error.message });
  }
});

// Calculate Trust Score (proprietary algorithm)
function calculateTrustScore(crypto) {
  let score = 50; // Base score
  
  // Market cap factor (higher market cap = more trust)
  if (crypto.marketCap > 10000000000) score += 20; // >10B
  else if (crypto.marketCap > 1000000000) score += 10; // >1B
  
  // Volume factor
  if (crypto.volume24h > crypto.marketCap * 0.1) score += 10;
  
  // Volatility factor (lower volatility = more trust)
  if (Math.abs(crypto.priceChangePercentage24h) < 5) score += 10;
  else if (Math.abs(crypto.priceChangePercentage24h) > 20) score -= 15;
  
  // Age factor (older coins generally more trusted)
  const daysSinceLaunch = (Date.now() - new Date(crypto.athDate)) / (1000 * 60 * 60 * 24);
  if (daysSinceLaunch > 365) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

// Calculate Emotional Volatility Index
function calculateEVI(crypto) {
  const volatility = Math.abs(crypto.priceChangePercentage24h);
  const volumeRatio = crypto.volume24h / crypto.marketCap;
  
  // Higher volatility and volume ratio = higher emotional index
  let evi = (volatility * 2) + (volumeRatio * 100);
  return Math.max(0, Math.min(100, evi));
}

async function updateCryptoData(limit = 50, currency = 'usd') {
  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/markets`, {
      params: {
        vs_currency: currency,
        order: 'market_cap_desc',
        per_page: limit,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h'
      }
    });
    
    for (const coin of response.data) {
      const cryptoData = {
        coinId: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        currentPrice: coin.current_price,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
        priceChange24h: coin.price_change_24h,
        priceChangePercentage24h: coin.price_change_percentage_24h,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        maxSupply: coin.max_supply,
        ath: coin.ath,
        athDate: new Date(coin.ath_date),
        atl: coin.atl,
        atlDate: new Date(coin.atl_date),
        lastUpdated: new Date()
      };
      
      // Calculate custom metrics
      cryptoData.trustScore = calculateTrustScore(cryptoData);
      cryptoData.emotionalVolatilityIndex = calculateEVI(cryptoData);
      
      await CryptoData.findOneAndUpdate(
        { coinId: coin.id },
        cryptoData,
        { upsert: true, new: true }
      );
    }
  } catch (error) {
    console.error('Error updating crypto data:', error);
  }
}

async function updateSingleCrypto(coinId) {
  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`);
    const coin = response.data;
    
    const cryptoData = {
      coinId: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      currentPrice: coin.market_data.current_price.usd,
      marketCap: coin.market_data.market_cap.usd,
      volume24h: coin.market_data.total_volume.usd,
      priceChange24h: coin.market_data.price_change_24h,
      priceChangePercentage24h: coin.market_data.price_change_percentage_24h,
      circulatingSupply: coin.market_data.circulating_supply,
      totalSupply: coin.market_data.total_supply,
      maxSupply: coin.market_data.max_supply,
      ath: coin.market_data.ath.usd,
      athDate: new Date(coin.market_data.ath_date.usd),
      atl: coin.market_data.atl.usd,
      atlDate: new Date(coin.market_data.atl_date.usd),
      lastUpdated: new Date()
    };
    
    cryptoData.trustScore = calculateTrustScore(cryptoData);
    cryptoData.emotionalVolatilityIndex = calculateEVI(cryptoData);
    
    await CryptoData.findOneAndUpdate(
      { coinId: coin.id },
      cryptoData,
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Error updating single crypto:', error);
  }
}

function isDataStale(lastUpdated) {
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() - new Date(lastUpdated).getTime() > fiveMinutes;
}

module.exports = router;