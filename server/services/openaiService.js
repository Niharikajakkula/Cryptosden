// Optional OpenAI integration for advanced AI responses
// To use this, install: npm install openai
// And set OPENAI_API_KEY in your .env file

let OpenAI;
try {
  OpenAI = require('openai');
} catch (error) {
  console.log('OpenAI package not installed - using rule-based AI only');
}

class OpenAIService {
  constructor() {
    this.enabled = OpenAI && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
    
    if (this.enabled) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      console.log('OpenAI service not available - using rule-based responses');
    }
  }

  async generateResponse(message, context = {}) {
    if (!this.enabled) {
      throw new Error('OpenAI service not configured');
    }

    const systemPrompt = `You are a knowledgeable cryptocurrency assistant for Cryptosden, a comprehensive crypto trading platform. 

Your expertise includes:
- Cryptocurrency fundamentals (Bitcoin, Ethereum, DeFi, etc.)
- Trading strategies and emotional volatility insights
- Platform features (trading, portfolio, community)
- Security best practices
- Investment education (not advice)

Guidelines:
- Provide educational information, not financial advice
- Always remind users to do their own research (DYOR)
- Be helpful, accurate, and concise
- Focus on cryptocurrency and platform-related topics
- If asked about non-crypto topics, politely redirect to crypto subjects

Platform features you can help with:
- Trading: Market, limit, stop-loss orders
- Portfolio: Analytics, tracking, performance
- Community: Forums, polls, discussions
- Security: 2FA, wallet safety, best practices
- Watchlist: Tracking favorite cryptocurrencies`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 150,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
      });

      return {
        response: completion.choices[0].message.content,
        confidence: 0.9,
        source: 'openai'
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  isEnabled() {
    return this.enabled;
  }
}

module.exports = new OpenAIService();