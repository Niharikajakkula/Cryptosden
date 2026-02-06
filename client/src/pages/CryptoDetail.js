import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCrypto } from '../contexts/CryptoContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, TrendingUp, TrendingDown, Shield, Activity, Heart, HeartOff } from 'lucide-react';
import axios from 'axios';

const CryptoDetail = () => {
  const { id } = useParams();
  const { getCrypto, formatPrice, formatPercentage, formatMarketCap, getTrustScoreColor, getEVIColor } = useCrypto();
  const { user, refreshUser } = useAuth();
  const [crypto, setCrypto] = useState(null);
  const [loading, setLoading] = useState(true);

  const isInWatchlist = () => {
    return user?.watchlist?.some(item => item.coinId === id) || false;
  };

  const handleWatchlistToggle = async () => {
    if (!user) {
      alert('Please sign in to use the watchlist feature');
      return;
    }

    try {
      const action = isInWatchlist() ? 'remove' : 'add';
      await axios.post('/api/auth/watchlist', {
        coinId: crypto.coinId,
        symbol: crypto.symbol,
        name: crypto.name,
        action
      });
      
      // Refresh user data to update watchlist
      await refreshUser();
    } catch (error) {
      console.error('Error updating watchlist:', error);
      alert('Failed to update watchlist. Please try again.');
    }
  };

  useEffect(() => {
    const fetchCrypto = async () => {
      setLoading(true);
      const data = await getCrypto(id);
      setCrypto(data);
      setLoading(false);
    };

    fetchCrypto();
  }, [id, getCrypto]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading cryptocurrency details...</p>
        </div>
      </div>
    );
  }

  if (!crypto) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Cryptocurrency Not Found</h2>
          <p className="text-slate-300 mb-4">The requested cryptocurrency could not be found.</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

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
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{crypto.name}</h1>
              <p className="text-slate-300">{crypto.symbol}</p>
            </div>
            <button 
              onClick={handleWatchlistToggle}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isInWatchlist()
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isInWatchlist() ? (
                <>
                  <Heart className="h-4 w-4 fill-current" />
                  <span>Remove from Watchlist</span>
                </>
              ) : (
                <>
                  <HeartOff className="h-4 w-4" />
                  <span>Add to Watchlist</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Price Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Current Price</h3>
              <p className="text-3xl font-bold text-white">
                {formatPrice(crypto.currentPrice)}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">24h Change</h3>
              <div className={`flex items-center space-x-2 ${
                crypto.priceChangePercentage24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {crypto.priceChangePercentage24h >= 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                <span className="text-xl font-semibold">
                  {formatPercentage(crypto.priceChangePercentage24h)}
                </span>
              </div>
              <p className={`text-sm ${
                crypto.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {crypto.priceChange24h >= 0 ? '+' : ''}{formatPrice(crypto.priceChange24h)}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Market Cap</h3>
              <p className="text-xl font-semibold text-white">
                {formatMarketCap(crypto.marketCap)}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">24h Volume</h3>
              <p className="text-xl font-semibold text-white">
                {formatMarketCap(crypto.volume24h)}
              </p>
            </div>
          </div>
        </div>

        {/* Cryptosden Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-6 w-6 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Coin Trust Score</h3>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`text-4xl font-bold ${getTrustScoreColor(crypto.trustScore)}`}>
                {crypto.trustScore}
              </div>
              <div className="flex-1">
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      crypto.trustScore >= 80 ? 'bg-green-500' :
                      crypto.trustScore >= 60 ? 'bg-yellow-500' :
                      crypto.trustScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${crypto.trustScore}%` }}
                  ></div>
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  Based on market cap, volume, volatility, and historical performance
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Activity className="h-6 w-6 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Emotional Volatility Index</h3>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`text-4xl font-bold ${getEVIColor(crypto.emotionalVolatilityIndex)}`}>
                {crypto.emotionalVolatilityIndex.toFixed(0)}
              </div>
              <div className="flex-1">
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      crypto.emotionalVolatilityIndex >= 80 ? 'bg-red-500' :
                      crypto.emotionalVolatilityIndex >= 60 ? 'bg-orange-500' :
                      crypto.emotionalVolatilityIndex >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${crypto.emotionalVolatilityIndex}%` }}
                  ></div>
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  Measures market sentiment and emotional trading patterns
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Additional Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Circulating Supply</h4>
              <p className="text-lg font-semibold text-white">
                {crypto.circulatingSupply ? crypto.circulatingSupply.toLocaleString() : 'N/A'}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Total Supply</h4>
              <p className="text-lg font-semibold text-white">
                {crypto.totalSupply ? crypto.totalSupply.toLocaleString() : 'N/A'}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Max Supply</h4>
              <p className="text-lg font-semibold text-white">
                {crypto.maxSupply ? crypto.maxSupply.toLocaleString() : 'No Limit'}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">All-Time High</h4>
              <p className="text-lg font-semibold text-white">
                {formatPrice(crypto.ath)}
              </p>
              <p className="text-sm text-slate-400">
                {new Date(crypto.athDate).toLocaleDateString()}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">All-Time Low</h4>
              <p className="text-lg font-semibold text-white">
                {formatPrice(crypto.atl)}
              </p>
              <p className="text-sm text-slate-400">
                {new Date(crypto.atlDate).toLocaleDateString()}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Last Updated</h4>
              <p className="text-lg font-semibold text-white">
                {new Date(crypto.lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoDetail;