import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCrypto } from '../contexts/CryptoContext';
import { useAuth } from '../contexts/AuthContext';
import CryptoTable from '../components/CryptoTable';
import { 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Brain, 
  Activity, 
  Star,
  BarChart3,
  Heart,
  Bell,
  MessageSquare,
  Mail,
  PieChart,
  User,
  LogOut
} from 'lucide-react';

const Dashboard = () => {
  const { cryptos, loading } = useCrypto();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [aiInsights, setAiInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  console.log('Dashboard - User:', user);
  console.log('Dashboard - Cryptos:', cryptos.length, 'items');
  console.log('Dashboard - Loading:', loading);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (user) {
      fetchAIInsights();
    }
  }, [user]);

  const fetchAIInsights = async () => {
    setLoadingInsights(true);
    try {
      const response = await fetch('/api/ai/insights', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setAiInsights(data.insights || []);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    }
    setLoadingInsights(false);
  };

  const topGainers = cryptos
    .filter(crypto => crypto.priceChangePercentage24h > 0)
    .sort((a, b) => b.priceChangePercentage24h - a.priceChangePercentage24h)
    .slice(0, 3);

  const topLosers = cryptos
    .filter(crypto => crypto.priceChangePercentage24h < 0)
    .sort((a, b) => a.priceChangePercentage24h - b.priceChangePercentage24h)
    .slice(0, 3);

  const highTrustCoins = cryptos
    .filter(crypto => crypto.trustScore > 70)
    .sort((a, b) => b.trustScore - a.trustScore)
    .slice(0, 3);

  const volatileCoins = cryptos
    .filter(crypto => crypto.emotionalVolatilityIndex > 60)
    .sort((a, b) => b.emotionalVolatilityIndex - a.emotionalVolatilityIndex)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Navigation Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-white" />
                <span className="text-white text-xl font-bold">Cryptosden</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="flex items-center space-x-1 overflow-x-auto">
              {/* Core Features */}
              <Link to="/emotional-volatility" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium whitespace-nowrap">
                <Brain className="h-4 w-4" />
                <span>Emotion Insights</span>
              </Link>

              <Link to="/watchlist" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium whitespace-nowrap">
                <Heart className="h-4 w-4" />
                <span>Watchlist</span>
              </Link>

              {/* AI & Alerts */}
              <Link to="/predictions" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium whitespace-nowrap">
                <Brain className="h-4 w-4" />
                <span>AI Predictions</span>
              </Link>
              
              <Link to="/smart-alerts" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium whitespace-nowrap">
                <Bell className="h-4 w-4" />
                <span>Smart Alerts</span>
              </Link>

              {/* Trading & Portfolio */}
              {(user?.role === 'trader' || user?.role === 'admin') && (
                <>
                  <Link to="/trading" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium whitespace-nowrap">
                    <TrendingUp className="h-4 w-4" />
                    <span>Trading</span>
                  </Link>
                  
                  <Link to="/portfolio" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium whitespace-nowrap">
                    <PieChart className="h-4 w-4" />
                    <span>Portfolio</span>
                  </Link>
                </>
              )}

              {/* Community */}
              <Link to="/community" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium whitespace-nowrap">
                <MessageSquare className="h-4 w-4" />
                <span>Community</span>
              </Link>
              
              {/* User Menu */}
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-white/20">
                <Link to="/profile" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium whitespace-nowrap">
                  <User className="h-4 w-4" />
                  <span>{user?.name || 'Profile'}</span>
                </Link>
                
                {user?.role === 'admin' && (
                  <Link to="/admin" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium whitespace-nowrap">
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-white hover:text-blue-200 transition-colors px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium whitespace-nowrap"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-screen overflow-y-auto" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {user ? `Welcome back, ${user.name}!` : 'Welcome to Cryptosden'}
          </h1>
          <p className="text-slate-300">
            Your comprehensive cryptocurrency platform with AI insights, Trust Scores, and EVI analysis
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="h-8 w-8 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
            </div>
            <p className="text-slate-300 text-sm">Get intelligent crypto insights and trading guidance</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-8 w-8 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Trust Score</h3>
            </div>
            <p className="text-slate-300 text-sm">Proprietary algorithm to assess crypto reliability</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="h-8 w-8 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">EVI Index</h3>
            </div>
            <p className="text-slate-300 text-sm">Emotional Volatility Index for market sentiment</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Star className="h-8 w-8 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Watchlist</h3>
            </div>
            <p className="text-slate-300 text-sm">Track your favorite cryptocurrencies</p>
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Top Gainer
            </h3>
            {topGainers[0] && (
              <>
                <p className="text-xl font-bold text-green-400">
                  {topGainers[0].symbol}
                </p>
                <p className="text-green-400">
                  +{topGainers[0].priceChangePercentage24h.toFixed(2)}%
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Trust: {topGainers[0].trustScore || 'N/A'}/100
                </p>
              </>
            )}
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-400" />
              Top Loser
            </h3>
            {topLosers[0] && (
              <>
                <p className="text-xl font-bold text-red-400">
                  {topLosers[0].symbol}
                </p>
                <p className="text-red-400">
                  {topLosers[0].priceChangePercentage24h.toFixed(2)}%
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Trust: {topLosers[0].trustScore || 'N/A'}/100
                </p>
              </>
            )}
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-400" />
              Most Trusted
            </h3>
            {highTrustCoins[0] && (
              <>
                <p className="text-xl font-bold text-green-400">
                  {highTrustCoins[0].symbol}
                </p>
                <p className="text-green-400">
                  {highTrustCoins[0].trustScore}/100
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  ${highTrustCoins[0].currentPrice?.toLocaleString()}
                </p>
              </>
            )}
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-400" />
              High EVI
            </h3>
            {volatileCoins[0] && (
              <>
                <p className="text-xl font-bold text-orange-400">
                  {volatileCoins[0].symbol}
                </p>
                <p className="text-orange-400">
                  EVI: {volatileCoins[0].emotionalVolatilityIndex}/100
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  High emotion detected
                </p>
              </>
            )}
          </div>
        </div>

        {/* AI Insights Section */}
        {user && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Brain className="h-6 w-6 text-cyan-400" />
                AI Market Insights
              </h2>
              <button
                onClick={fetchAIInsights}
                disabled={loadingInsights}
                className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 text-sm"
              >
                {loadingInsights ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            
            {loadingInsights ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
                <p className="text-slate-400 mt-2">Generating AI insights...</p>
              </div>
            ) : aiInsights.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiInsights.slice(0, 6).map((insight, index) => (
                  <div key={index} className="bg-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">{insight.coin}</h3>
                      <span className="text-xs text-slate-400">{insight.symbol}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Price:</span>
                        <span className="text-white">${insight.price?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Trust Score:</span>
                        <span className={`${insight.trustScore > 70 ? 'text-green-400' : insight.trustScore > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {insight.trustScore}/100
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">EVI:</span>
                        <span className={`${insight.evi > 70 ? 'text-red-400' : insight.evi > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {insight.evi}/100
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-600">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Sentiment:</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            insight.sentiment === 'bullish' ? 'bg-green-500/20 text-green-400' :
                            insight.sentiment === 'bearish' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {insight.sentiment}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{insight.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400">No AI insights available. Click refresh to generate.</p>
              </div>
            )}
          </div>
        )}

        {/* Main Crypto Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h2 className="text-xl font-semibold text-white">
              Cryptocurrency Market
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Real-time prices with Trust Scores and Emotional Volatility Index
            </p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                <p className="text-slate-300">Loading cryptocurrency data...</p>
              </div>
            ) : cryptos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">No cryptocurrency data available</p>
                <p className="text-slate-500 text-sm">Please check your server connection</p>
              </div>
            ) : (
              <CryptoTable cryptos={cryptos} loading={loading} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;