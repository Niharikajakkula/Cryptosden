import { Link } from 'react-router-dom';
import { useCrypto } from '../contexts/CryptoContext';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, TrendingDown, Shield, Activity, Heart, HeartOff } from 'lucide-react';
import axios from 'axios';

const CryptoTable = ({ cryptos, loading }) => {
  const { 
    formatPrice, 
    formatPercentage, 
    formatMarketCap, 
    getTrustScoreColor, 
    getEVIColor 
  } = useCrypto();
  
  const { user, refreshUser } = useAuth();

  const handleWatchlistToggle = async (crypto, isInWatchlist) => {
    if (!user) {
      alert('Please sign in to use the watchlist feature');
      return;
    }

    try {
      const action = isInWatchlist ? 'remove' : 'add';
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

  const isInWatchlist = (coinId) => {
    return user?.watchlist?.some(item => item.coinId === coinId) || false;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
        <p className="mt-4 text-slate-300">Loading cryptocurrency data...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-700/50">
        <thead className="bg-slate-800/30">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              24h Change
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              Market Cap
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              <div className="flex items-center space-x-1">
                <Shield className="h-4 w-4" />
                <span>Trust Score</span>
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              <div className="flex items-center space-x-1">
                <Activity className="h-4 w-4" />
                <span>EVI</span>
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4" />
                <span>Watchlist</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {cryptos.map((crypto, index) => (
            <tr key={crypto.coinId} className="hover:bg-slate-700/20 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                {index + 1}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Link 
                  to={`/crypto/${crypto.coinId}`}
                  className="flex items-center space-x-3 hover:text-cyan-400 transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium text-white">
                      {crypto.name}
                    </div>
                    <div className="text-sm text-slate-400">
                      {crypto.symbol}
                    </div>
                  </div>
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                {formatPrice(crypto.currentPrice)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className={`flex items-center space-x-1 ${
                  crypto.priceChangePercentage24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {crypto.priceChangePercentage24h >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{formatPercentage(crypto.priceChangePercentage24h)}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                {formatMarketCap(crypto.marketCap)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className={`font-medium ${getTrustScoreColor(crypto.trustScore)}`}>
                  {crypto.trustScore}/100
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className={`font-medium ${getEVIColor(crypto.emotionalVolatilityIndex)}`}>
                  {crypto.emotionalVolatilityIndex.toFixed(0)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleWatchlistToggle(crypto, isInWatchlist(crypto.coinId));
                  }}
                  className={`p-2 rounded-full transition-colors ${
                    isInWatchlist(crypto.coinId)
                      ? 'text-red-400 hover:text-red-300'
                      : 'text-slate-500 hover:text-red-400'
                  }`}
                  title={isInWatchlist(crypto.coinId) ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  {isInWatchlist(crypto.coinId) ? (
                    <Heart className="h-5 w-5 fill-current" />
                  ) : (
                    <HeartOff className="h-5 w-5" />
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CryptoTable;