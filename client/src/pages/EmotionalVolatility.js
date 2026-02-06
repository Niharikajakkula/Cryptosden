import { useState, useEffect } from 'react';
import { Brain, Activity, TrendingUp, BarChart3, Heart, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const EmotionalVolatility = () => {
  const [selectedCrypto, setSelectedCrypto] = useState('bitcoin');
  const [emotionalData, setEmotionalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cryptocurrencies, setCryptocurrencies] = useState([]);
  const [loadingCryptos, setLoadingCryptos] = useState(true);

  const emotionColors = {
    positive: '#10B981', // Green
    negative: '#EF4444', // Red
    neutral: '#6B7280', // Gray
    hype: '#8B5CF6'     // Purple
  };

  useEffect(() => {
    fetchCryptocurrencies();
    fetchEmotionalData();
  }, [selectedCrypto]);

  useEffect(() => {
    fetchCryptocurrencies();
  }, []);

  const fetchCryptocurrencies = async () => {
    setLoadingCryptos(true);
    try {
      const response = await fetch('/api/crypto', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      // Transform the crypto data to match our dropdown format
      const cryptoOptions = data.map(crypto => ({
        id: crypto.id,
        name: crypto.name,
        symbol: crypto.symbol.toUpperCase()
      }));
      
      setCryptocurrencies(cryptoOptions);
    } catch (error) {
      console.error('Error fetching cryptocurrencies:', error);
      // Fallback to hardcoded options if API fails
      setCryptocurrencies([
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
        { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
        { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
        { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
        { id: 'solana', name: 'Solana', symbol: 'SOL' },
        { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX' },
        { id: 'polygon', name: 'Polygon', symbol: 'MATIC' }
      ]);
    }
    setLoadingCryptos(false);
  };

  const fetchEmotionalData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/evim/${selectedCrypto}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setEmotionalData(data);
    } catch (error) {
      console.error('Error fetching emotional data:', error);
      // Fallback data for development
      setEmotionalData({
        cryptocurrency: selectedCrypto,
        emotionalDistribution: {
          positive: 45,
          negative: 20,
          neutral: 25,
          hype: 10
        },
        emotionScore: 65,
        trustLevel: 'Medium',
        buzzIndex: 'Stable',
        lastUpdated: new Date().toISOString(),
        sampleSize: 2500,
        timeframe: '24h'
      });
    }
    setLoading(false);
  };

  const getPieChartData = () => {
    if (!emotionalData) return [];
    
    const { emotionalDistribution } = emotionalData;
    return [
      { name: 'Positive', value: emotionalDistribution.positive, color: emotionColors.positive },
      { name: 'Negative', value: emotionalDistribution.negative, color: emotionColors.negative },
      { name: 'Neutral', value: emotionalDistribution.neutral, color: emotionColors.neutral },
      { name: 'Hype/Buzz', value: emotionalDistribution.hype, color: emotionColors.hype }
    ];
  };

  const getEmotionScoreColor = (score) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrustLevelColor = (level) => {
    switch (level) {
      case 'High': return 'text-green-400 bg-green-400/10';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'Low': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getBuzzIndexColor = (index) => {
    switch (index) {
      case 'Trending': return 'text-purple-400 bg-purple-400/10';
      case 'Stable': return 'text-blue-400 bg-blue-400/10';
      case 'Quiet': return 'text-gray-400 bg-gray-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-slate-300">{data.value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-screen overflow-y-auto" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">Emotional Volatility Intelligence</h1>
          </div>
          <p className="text-slate-300">Advanced sentiment analysis and emotional market intelligence for cryptocurrencies</p>
        </div>

        {/* Cryptocurrency Selection */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-8">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            Select Cryptocurrency
            {!loadingCryptos && cryptocurrencies.length > 0 && (
              <span className="text-slate-400 text-sm font-normal">
                ({cryptocurrencies.length} available)
              </span>
            )}
          </h3>
          
          {loadingCryptos ? (
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
              <span className="text-slate-300">Loading cryptocurrencies...</span>
            </div>
          ) : (
            <select
              value={selectedCrypto}
              onChange={(e) => setSelectedCrypto(e.target.value)}
              className="w-full md:w-auto bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={cryptocurrencies.length === 0}
            >
              {cryptocurrencies.length === 0 ? (
                <option value="">No cryptocurrencies available</option>
              ) : (
                cryptocurrencies.map(crypto => (
                  <option key={crypto.id} value={crypto.id}>
                    {crypto.name} ({crypto.symbol})
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Analyzing emotional volatility...</p>
          </div>
        ) : emotionalData && (
          <>
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Emotional Volatility Pie Chart */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-400" />
                  Emotional Distribution
                </h3>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPieChartData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {getPieChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ color: '#e2e8f0' }}
                        formatter={(value) => <span style={{ color: '#e2e8f0' }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-slate-400 text-sm">
                    Sample Size: {emotionalData.sampleSize?.toLocaleString()} • Timeframe: {emotionalData.timeframe}
                  </p>
                </div>
              </div>

              {/* Metrics Panel */}
              <div className="space-y-6">
                {/* Emotion Score */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-400" />
                    Emotion Score
                  </h3>
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${getEmotionScoreColor(emotionalData.emotionScore)}`}>
                      {emotionalData.emotionScore}/100
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 mb-4">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          emotionalData.emotionScore >= 70 ? 'bg-green-400' :
                          emotionalData.emotionScore >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{width: `${emotionalData.emotionScore}%`}}
                      ></div>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Overall emotional sentiment strength
                    </p>
                  </div>
                </div>

                {/* Trust Level & Buzz Index */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-400" />
                      Trust Level
                    </h4>
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getTrustLevelColor(emotionalData.trustLevel)}`}>
                      {emotionalData.trustLevel}
                    </div>
                  </div>

                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-orange-400" />
                      Buzz Index
                    </h4>
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getBuzzIndexColor(emotionalData.buzzIndex)}`}>
                      {emotionalData.buzzIndex}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-6">Emotional Breakdown</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(emotionalData.emotionalDistribution).map(([emotion, percentage]) => (
                  <div key={emotion} className="bg-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium capitalize">{emotion === 'hype' ? 'Hype/Buzz' : emotion}</h4>
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: emotionColors[emotion] }}
                      ></div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{percentage}%</div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: emotionColors[emotion]
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <p className="text-slate-400 text-sm">
                  Last updated: {new Date(emotionalData.lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmotionalVolatility;