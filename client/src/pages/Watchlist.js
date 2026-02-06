import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Heart, TrendingUp, X } from 'lucide-react';
import axios from 'axios';

const Watchlist = () => {
  const { user, refreshUser } = useAuth();

  const handleRemoveFromWatchlist = async (coinId, coinName) => {
    try {
      await axios.post('/api/auth/watchlist', {
        coinId,
        action: 'remove'
      });
      
      // Refresh user data to update watchlist
      await refreshUser();
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      alert('Failed to remove from watchlist. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Sign in to view your watchlist</h2>
          <p className="text-slate-300 mb-6">
            Create an account or sign in to track your favorite cryptocurrencies
          </p>
          <div className="space-x-4">
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center px-4 py-2 border border-slate-600 text-slate-300 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              Create Account
            </Link>
          </div>
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

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="h-8 w-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">Your Watchlist</h1>
          </div>
          <p className="text-slate-300">
            Track your favorite cryptocurrencies and monitor their performance
          </p>
        </div>

        {user.watchlist && user.watchlist.length > 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl">
            <div className="px-6 py-4 border-b border-slate-700/50">
              <h2 className="text-xl font-semibold text-white">
                Tracked Cryptocurrencies ({user.watchlist.length})
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.watchlist.map((item) => (
                  <div
                    key={item.coinId}
                    className="p-4 bg-slate-700/30 border border-slate-600/50 rounded-lg hover:border-cyan-400/50 hover:bg-slate-700/50 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Link
                        to={`/crypto/${item.coinId}`}
                        className="flex-1"
                      >
                        <h3 className="font-semibold text-white hover:text-cyan-400 transition-colors">{item.name}</h3>
                        <p className="text-sm text-slate-400">{item.symbol}</p>
                      </Link>
                      <button
                        onClick={() => handleRemoveFromWatchlist(item.coinId, item.name)}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                        title="Remove from watchlist"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Added {new Date(item.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center">
            <Heart className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Your watchlist is empty
            </h3>
            <p className="text-slate-300 mb-6">
              Start tracking cryptocurrencies by adding them to your watchlist from the dashboard
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Browse Cryptocurrencies</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;