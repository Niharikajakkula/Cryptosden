const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Get emotional volatility data for a specific cryptocurrency
router.get('/:cryptoId', authenticateToken, async (req, res) => {
  try {
    const { cryptoId } = req.params;
    
    console.log('EVIM - Fetching emotional data for:', cryptoId);
    
    // Generate dynamic emotional volatility data based on crypto
    const emotionalData = generateEmotionalData(cryptoId);
    
    res.json(emotionalData);
  } catch (error) {
    console.error('Error fetching emotional volatility data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get emotional trends for multiple cryptocurrencies
router.get('/trends/overview', authenticateToken, async (req, res) => {
  try {
    const cryptos = ['bitcoin', 'ethereum', 'cardano', 'solana', 'polygon'];
    const trends = cryptos.map(crypto => {
      const data = generateEmotionalData(crypto);
      return {
        cryptocurrency: crypto,
        emotionScore: data.emotionScore,
        trustLevel: data.trustLevel,
        buzzIndex: data.buzzIndex,
        dominantEmotion: getDominantEmotion(data.emotionalDistribution)
      };
    });
    
    res.json({ trends, lastUpdated: new Date().toISOString() });
  } catch (error) {
    console.error('Error fetching emotional trends:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate emotional volatility data (enhanced with more realistic patterns)
function generateEmotionalData(cryptoId) {
  // Enhanced emotional patterns for different cryptocurrencies
  const cryptoPatterns = {
    bitcoin: { 
      positive: 45, negative: 20, neutral: 25, hype: 10, 
      volatility: 0.15, sentiment: 'bullish', marketCap: 'large',
      keywords: ['store of value', 'digital gold', 'institutional adoption']
    },
    ethereum: { 
      positive: 50, negative: 15, neutral: 20, hype: 15, 
      volatility: 0.18, sentiment: 'very bullish', marketCap: 'large',
      keywords: ['smart contracts', 'DeFi', 'NFTs', 'ETH 2.0']
    },
    cardano: { 
      positive: 35, negative: 25, neutral: 30, hype: 10, 
      volatility: 0.25, sentiment: 'neutral', marketCap: 'medium',
      keywords: ['proof of stake', 'academic approach', 'sustainability']
    },
    polkadot: { 
      positive: 40, negative: 20, neutral: 25, hype: 15, 
      volatility: 0.22, sentiment: 'bullish', marketCap: 'medium',
      keywords: ['interoperability', 'parachains', 'Web3']
    },
    chainlink: { 
      positive: 42, negative: 18, neutral: 28, hype: 12, 
      volatility: 0.20, sentiment: 'bullish', marketCap: 'medium',
      keywords: ['oracles', 'real-world data', 'partnerships']
    },
    solana: { 
      positive: 38, negative: 22, neutral: 20, hype: 20, 
      volatility: 0.28, sentiment: 'mixed', marketCap: 'large',
      keywords: ['fast transactions', 'low fees', 'ecosystem growth']
    },
    'avalanche-2': { 
      positive: 41, negative: 19, neutral: 25, hype: 15, 
      volatility: 0.24, sentiment: 'bullish', marketCap: 'medium',
      keywords: ['subnets', 'DeFi', 'enterprise adoption']
    },
    polygon: { 
      positive: 39, negative: 21, neutral: 27, hype: 13, 
      volatility: 0.26, sentiment: 'bullish', marketCap: 'medium',
      keywords: ['layer 2', 'scaling', 'Ethereum compatibility']
    }
  };

  const pattern = cryptoPatterns[cryptoId] || cryptoPatterns.bitcoin;
  
  // Add time-based variations (simulate market cycles)
  const hour = new Date().getHours();
  const timeMultiplier = 1 + Math.sin(hour / 24 * Math.PI * 2) * 0.1;
  
  // Add some randomness while maintaining realistic patterns
  const randomFactor = 0.15; // 15% variation
  const positive = Math.max(5, Math.min(70, pattern.positive * timeMultiplier + (Math.random() - 0.5) * 2 * randomFactor * 100));
  const negative = Math.max(5, Math.min(50, pattern.negative + (Math.random() - 0.5) * 2 * randomFactor * 100));
  const neutral = Math.max(10, Math.min(60, pattern.neutral + (Math.random() - 0.5) * 2 * randomFactor * 100));
  const hype = Math.max(5, Math.min(40, pattern.hype * timeMultiplier + (Math.random() - 0.5) * 2 * randomFactor * 100));
  
  // Normalize to ensure they add up to 100%
  const total = positive + negative + neutral + hype;
  const normalizedPositive = Math.round((positive / total) * 100);
  const normalizedNegative = Math.round((negative / total) * 100);
  const normalizedNeutral = Math.round((neutral / total) * 100);
  const normalizedHype = 100 - normalizedPositive - normalizedNegative - normalizedNeutral;

  // Calculate derived metrics with more sophisticated logic
  const emotionScore = Math.round(
    (normalizedPositive * 0.4) + 
    (normalizedHype * 0.25) + 
    (normalizedNeutral * 0.15) - 
    (normalizedNegative * 0.35) + 50
  );
  
  const trustLevel = emotionScore > 75 ? 'High' : 
                    emotionScore > 60 ? 'Medium-High' :
                    emotionScore > 40 ? 'Medium' : 
                    emotionScore > 25 ? 'Medium-Low' : 'Low';
  
  const buzzIndex = normalizedHype > 25 ? 'Trending' : 
                   normalizedHype > 15 ? 'Active' :
                   normalizedHype > 8 ? 'Stable' : 'Quiet';

  // Generate insights based on the data
  const insights = generateInsights(normalizedPositive, normalizedNegative, normalizedNeutral, normalizedHype, pattern);

  return {
    cryptocurrency: cryptoId,
    emotionalDistribution: {
      positive: normalizedPositive,
      negative: normalizedNegative,
      neutral: normalizedNeutral,
      hype: normalizedHype
    },
    emotionScore: Math.max(0, Math.min(100, emotionScore)),
    trustLevel,
    buzzIndex,
    marketSentiment: pattern.sentiment,
    volatilityRisk: pattern.volatility > 0.25 ? 'High' : pattern.volatility > 0.20 ? 'Medium' : 'Low',
    insights,
    trendingKeywords: pattern.keywords,
    lastUpdated: new Date().toISOString(),
    sampleSize: Math.floor(Math.random() * 8000) + 2000, // Simulated sample size
    timeframe: '24h',
    confidence: Math.round(85 + Math.random() * 10) // 85-95% confidence
  };
}

// Generate insights based on emotional data
function generateInsights(positive, negative, neutral, hype, pattern) {
  const insights = [];
  
  if (positive > 50) {
    insights.push({
      type: 'positive',
      message: `Strong positive sentiment (${positive}%) indicates bullish community outlook`,
      impact: 'bullish'
    });
  }
  
  if (negative > 30) {
    insights.push({
      type: 'warning',
      message: `High negative sentiment (${negative}%) suggests caution and potential selling pressure`,
      impact: 'bearish'
    });
  }
  
  if (hype > 20) {
    insights.push({
      type: 'hype',
      message: `Elevated hype levels (${hype}%) - monitor for potential volatility spikes`,
      impact: 'volatile'
    });
  }
  
  if (neutral > 40) {
    insights.push({
      type: 'neutral',
      message: `High neutral sentiment (${neutral}%) indicates market indecision`,
      impact: 'sideways'
    });
  }
  
  // Add pattern-specific insights
  if (pattern.marketCap === 'large' && positive > 40) {
    insights.push({
      type: 'institutional',
      message: 'Large-cap asset with positive sentiment often attracts institutional interest',
      impact: 'bullish'
    });
  }
  
  return insights;
}

// Get dominant emotion from distribution
function getDominantEmotion(distribution) {
  const emotions = Object.entries(distribution);
  const dominant = emotions.reduce((max, current) => 
    current[1] > max[1] ? current : max
  );
  return dominant[0];
}

module.exports = router;