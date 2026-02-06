const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const OpenAIService = require('../services/openaiService');
const CryptoData = require('../models/CryptoData');
const router = express.Router();

// Enhanced rule-based responses for crypto-related queries
const cryptoResponses = {
  // Basic crypto concepts
  'bitcoin': "Bitcoin (BTC) is the first and largest cryptocurrency by market cap. It's a decentralized digital currency that operates on a peer-to-peer network without central authority. Bitcoin is often called 'digital gold' due to its store of value properties.",
  
  'ethereum': "Ethereum (ETH) is a blockchain platform that enables smart contracts and decentralized applications (dApps). It's the second-largest cryptocurrency and the foundation for most DeFi protocols and NFTs.",
  
  'blockchain': "Blockchain is a distributed ledger technology that records transactions across multiple computers. Each block contains transaction data and is cryptographically linked to the previous block, creating an immutable chain.",
  
  // Trading concepts
  'trading': "Crypto trading involves buying and selling cryptocurrencies to profit from price movements. Key strategies include day trading, swing trading, and HODLing. Always use risk management and never invest more than you can afford to lose.",
  
  'volatility': "Crypto volatility refers to rapid price changes. Our Emotional Volatility Index (EVI) measures market sentiment and price instability. High volatility means higher risk but also potential for greater returns.",
  
  'trust score': "Our Trust Score (0-100) evaluates cryptocurrency reliability based on market cap, trading volume, price stability, and community adoption. Higher scores indicate more established and trustworthy projects.",
  
  // Platform features
  'watchlist': "Your watchlist lets you track favorite cryptocurrencies. Add coins you're interested in to monitor their performance, set price alerts, and make informed trading decisions.",
  
  'portfolio': "The portfolio feature tracks your crypto holdings, shows profit/loss, and provides performance analytics. It helps you understand your investment distribution and returns.",
  
  // Security
  'security': "Crypto security is crucial! Enable 2FA, use strong passwords, never share private keys, and be cautious of phishing attempts. Store large amounts in hardware wallets for maximum security.",
  
  'wallet': "A crypto wallet stores your private keys and allows you to send/receive cryptocurrencies. Hot wallets are online (convenient but less secure), while cold wallets are offline (more secure for long-term storage)."
};

// Rule-based AI response system
class RuleBasedAI {
  constructor() {
    this.responses = cryptoResponses;
  }

  async generateResponse(message, context = {}) {
    const lowerMessage = message.toLowerCase();
    
    // Check for direct keyword matches
    for (const [keyword, response] of Object.entries(this.responses)) {
      if (lowerMessage.includes(keyword)) {
        return {
          response: response,
          confidence: 0.8,
          source: 'rule-based'
        };
      }
    }
    
    // Handle price queries
    if (lowerMessage.includes('price') && (lowerMessage.includes('bitcoin') || lowerMessage.includes('btc'))) {
      try {
        const btc = await CryptoData.findOne({ symbol: 'BTC' });
        if (btc) {
          return {
            response: `Bitcoin is currently trading at $${btc.currentPrice.toLocaleString()} with a ${btc.priceChangePercentage24h >= 0 ? 'gain' : 'loss'} of ${Math.abs(btc.priceChangePercentage24h).toFixed(2)}% in the last 24 hours. Trust Score: ${btc.trustScore}/100.`,
            confidence: 0.9,
            source: 'live-data'
          };
        }
      } catch (error) {
        console.error('Error fetching BTC price:', error);
      }
    }
    
    // Handle general price queries
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return {
        response: "I can help you check cryptocurrency prices! Try asking about specific coins like 'What's the Bitcoin price?' or 'How much is Ethereum?' You can also check our dashboard for real-time prices and charts.",
        confidence: 0.7,
        source: 'rule-based'
      };
    }
    
    // Handle trading questions
    if (lowerMessage.includes('how to trade') || lowerMessage.includes('start trading')) {
      return {
        response: "To start trading on Cryptosden: 1) Complete your profile verification, 2) Fund your account, 3) Research cryptocurrencies using our Trust Scores and EVI, 4) Start with small amounts, 5) Use our trading tools for market/limit orders. Remember: only invest what you can afford to lose!",
        confidence: 0.8,
        source: 'rule-based'
      };
    }
    
    // Handle platform-specific questions
    if (lowerMessage.includes('cryptosden') || lowerMessage.includes('platform')) {
      return {
        response: "Cryptosden is your comprehensive crypto platform featuring: real-time trading, portfolio tracking, AI-powered insights, Trust Scores, Emotional Volatility Index (EVI), community discussions, and advanced security. What specific feature would you like to know more about?",
        confidence: 0.9,
        source: 'rule-based'
      };
    }
    
    // Default responses for unmatched queries
    const defaultResponses = [
      "I'm here to help with cryptocurrency and trading questions! Try asking about Bitcoin, Ethereum, trading strategies, or Cryptosden features.",
      "I specialize in crypto topics. Feel free to ask about emotional volatility insights, trading tips, or how to use our platform features.",
      "Let me help you with crypto-related questions! I can explain concepts, provide market insights, or guide you through our platform features."
    ];
    
    return {
      response: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
      confidence: 0.5,
      source: 'default'
    };
  }
}

const ruleBasedAI = new RuleBasedAI();

// Chat endpoint - Allow both authenticated and non-authenticated users
router.post('/chat', async (req, res) => {
  try {
    const { message, context = {} } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Get user info if authenticated (optional)
    let user = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        const User = require('../models/User');
        user = await User.findById(decoded.userId).select('-password');
      } catch (error) {
        // Ignore auth errors for non-authenticated users
        console.log('Non-authenticated user using chatbot');
      }
    }
    
    let aiResponse;
    
    // Try OpenAI first if available
    if (OpenAIService.isEnabled()) {
      try {
        aiResponse = await OpenAIService.generateResponse(message, {
          ...context,
          userId: user?._id,
          userName: user?.name
        });
      } catch (error) {
        console.error('OpenAI error, falling back to rule-based:', error.message);
        // Fall back to rule-based AI
        aiResponse = await ruleBasedAI.generateResponse(message, context);
      }
    } else {
      // Use rule-based AI
      aiResponse = await ruleBasedAI.generateResponse(message, context);
    }
    
    // Log conversation for learning (if enabled)
    if (process.env.AI_CONVERSATION_LOGGING === 'true') {
      const userName = user?.name || 'Anonymous';
      console.log(`AI Chat - User: ${userName}, Message: ${message}, Response: ${aiResponse.response.substring(0, 100)}...`);
    }
    
    res.json(aiResponse);
    
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ 
      error: 'AI service temporarily unavailable',
      response: "I'm experiencing some technical difficulties. Please try again in a moment or contact support if the issue persists."
    });
  }
});

// Get AI chat history (optional feature)
router.get('/chat/history', authenticateToken, async (req, res) => {
  try {
    // This would require a ChatHistory model to store conversations
    // For now, return empty array
    res.json({ conversations: [] });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// AI insights endpoint for dashboard
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    // Get top cryptocurrencies with analysis
    const topCryptos = await CryptoData.find({})
      .sort({ marketCap: -1 })
      .limit(5)
      .select('name symbol currentPrice priceChangePercentage24h trustScore emotionalVolatilityIndex');
    
    const insights = topCryptos.map(crypto => {
      let sentiment = 'neutral';
      let recommendation = 'hold';
      
      if (crypto.priceChangePercentage24h > 5) {
        sentiment = 'bullish';
        recommendation = crypto.trustScore > 70 ? 'consider buying' : 'be cautious';
      } else if (crypto.priceChangePercentage24h < -5) {
        sentiment = 'bearish';
        recommendation = crypto.trustScore > 70 ? 'potential opportunity' : 'avoid';
      }
      
      return {
        coin: crypto.name,
        symbol: crypto.symbol,
        price: crypto.currentPrice,
        change24h: crypto.priceChangePercentage24h,
        trustScore: crypto.trustScore,
        evi: crypto.emotionalVolatilityIndex,
        sentiment,
        recommendation
      };
    });
    
    res.json({ insights });
    
  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Market Intelligence endpoint - redirect to dedicated route
router.get('/market-intelligence', async (req, res) => {
  try {
    // Redirect to the dedicated market intelligence route
    const response = await fetch(`${req.protocol}://${req.get('host')}/api/intelligence/market-intelligence`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Market intelligence redirect error:', error);
    res.status(500).json({ error: 'Failed to fetch market intelligence' });
  }
});

module.exports = router;