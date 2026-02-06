const cron = require('node-cron');
const axios = require('axios');
const CryptoData = require('../models/CryptoData');

// Calculate Trust Score (proprietary algorithm)
function calculateTrustScore(crypto) {
  let score = 50; // Base score
  
  // Market cap factor (higher market cap = more trust)
  if (crypto.market_cap > 10000000000) score += 20; // >10B
  else if (crypto.market_cap > 1000000000) score += 10; // >1B
  
  // Volume factor
  if (crypto.total_volume > crypto.market_cap * 0.1) score += 10;
  
  // Volatility factor (lower volatility = more trust)
  if (Math.abs(crypto.price_change_percentage_24h) < 5) score += 10;
  else if (Math.abs(crypto.price_change_percentage_24h) > 20) score -= 15;
  
  return Math.max(0, Math.min(100, score));
}

// Calculate Emotional Volatility Index
function calculateEVI(crypto) {
  const volatility = Math.abs(crypto.price_change_percentage_24h || 0);
  const volumeRatio = crypto.total_volume / (crypto.market_cap || 1);
  
  // Higher volatility and volume ratio = higher emotional index
  let evi = (volatility * 2) + (volumeRatio * 100);
  return Math.max(0, Math.min(100, evi));
}

async function updateCryptoData() {
  try {
    console.log('Updating crypto data...');
    
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 100,
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
        currentPrice: coin.current_price || 0,
        marketCap: coin.market_cap || 0,
        volume24h: coin.total_volume || 0,
        priceChange24h: coin.price_change_24h || 0,
        priceChangePercentage24h: coin.price_change_percentage_24h || 0,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        maxSupply: coin.max_supply,
        ath: coin.ath || 0,
        athDate: coin.ath_date ? new Date(coin.ath_date) : new Date(),
        atl: coin.atl || 0,
        atlDate: coin.atl_date ? new Date(coin.atl_date) : new Date(),
        lastUpdated: new Date()
      };
      
      // Calculate custom metrics
      cryptoData.trustScore = calculateTrustScore(coin);
      cryptoData.emotionalVolatilityIndex = calculateEVI(coin);
      
      await CryptoData.findOneAndUpdate(
        { coinId: coin.id },
        cryptoData,
        { upsert: true, new: true }
      );
    }
    
    console.log(`Updated ${response.data.length} cryptocurrencies`);
  } catch (error) {
    console.error('Error updating crypto data:', error.message);
  }
}

// Initialize crypto data updater
function initCryptoUpdater() {
  // Update immediately on startup
  updateCryptoData();
  
  // Schedule updates every 1 minute
  cron.schedule('* * * * *', updateCryptoData);
  
  console.log('Crypto data updater initialized');
}

module.exports = { initCryptoUpdater, updateCryptoData };