import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart,
  Activity,
  Target,
  AlertTriangle,
  Eye,
  Calendar
} from 'lucide-react';
import axios from 'axios';

const Portfolio = () => {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('24h');

  useEffect(() => {
    if (user) {
      fetchPortfolio();
    }
  }, [user, timeframe]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/portfolio', {
        params: { timeframe }
      });
      setPortfolio(response.data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatPercentage = (percentage) => {
    const formatted = Math.abs(percentage || 0).toFixed(2);
    return `${percentage >= 0 ? '+' : '-'}${formatted}%`;
  };

  const getRiskColor = (riskScore) => {
    switch (riskScore) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  if (!user) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <PieChart className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Portfolio Access Required</h2>
          <p className="text-slate-400 mb-6">Please sign in to view your portfolio</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Portfolio</h1>
            <p className="text-slate-300">
              Track your cryptocurrency investments and performance
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
            >
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="1y">1 Year</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        ) : portfolio ? (
          <>
            {/* Portfolio Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-8 w-8 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(portfolio.totalValue)}
                    </p>
                    <p className="text-slate-400">Total Value</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-8 w-8 text-cyan-400" />
                  <div>
                    <p className={`text-2xl font-bold ${portfolio.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(portfolio.totalPnL)}
                    </p>
                    <p className="text-slate-400">Total P&L</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <Activity className="h-8 w-8 text-purple-400" />
                  <div>
                    <p className={`text-2xl font-bold ${portfolio.totalPnLPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercentage(portfolio.totalPnLPercentage)}
                    </p>
                    <p className="text-slate-400">Return</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <Target className={`h-8 w-8 ${getRiskColor(portfolio.riskScore)}`} />
                  <div>
                    <p className={`text-2xl font-bold capitalize ${getRiskColor(portfolio.riskScore)}`}>
                      {portfolio.riskScore || 'Medium'}
                    </p>
                    <p className="text-slate-400">Risk Level</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Holdings */}
              <div className="lg:col-span-2">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Holdings</h2>
                  
                  {portfolio.holdings && portfolio.holdings.length > 0 ? (
                    <div className="space-y-4">
                      {portfolio.holdings.map((holding, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {holding.cryptocurrency?.substring(0, 3) || 'N/A'}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{holding.cryptocurrency}</h3>
                              <p className="text-slate-400 text-sm">
                                {holding.amount?.toFixed(6) || '0'} {holding.cryptocurrency}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-semibold text-white">
                              {formatCurrency(holding.currentValue)}
                            </p>
                            <p className={`text-sm ${holding.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatPercentage(holding.unrealizedPnLPercentage)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <PieChart className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No holdings yet</p>
                      <p className="text-slate-500 text-sm">Start trading to build your portfolio</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Portfolio Stats */}
              <div className="space-y-6">
                {/* Performance Metrics */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Performance</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">24h Change</span>
                      <span className={`font-semibold ${portfolio.dayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercentage(portfolio.dayChangePercentage)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">7d Change</span>
                      <span className={`font-semibold ${portfolio.weekChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercentage(portfolio.weekChangePercentage)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">30d Change</span>
                      <span className={`font-semibold ${portfolio.monthChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercentage(portfolio.monthChangePercentage)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Diversification */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Diversification</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Diversification Score</span>
                      <span className="font-semibold text-cyan-400">
                        {portfolio.diversificationScore?.toFixed(0) || '0'}/100
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Top Holding</span>
                      <span className="font-semibold text-white">
                        {portfolio.topHoldingPercentage?.toFixed(1) || '0'}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Total Assets</span>
                      <span className="font-semibold text-white">
                        {portfolio.holdings?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* All-Time Records */}
                {(portfolio.allTimeHigh?.value || portfolio.allTimeLow?.value) && (
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Records</h3>
                    
                    <div className="space-y-4">
                      {portfolio.allTimeHigh?.value && (
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-400">All-Time High</span>
                            <span className="font-semibold text-green-400">
                              {formatCurrency(portfolio.allTimeHigh.value)}
                            </span>
                          </div>
                          {portfolio.allTimeHigh.date && (
                            <p className="text-xs text-slate-500 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(portfolio.allTimeHigh.date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {portfolio.allTimeLow?.value && (
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-400">All-Time Low</span>
                            <span className="font-semibold text-red-400">
                              {formatCurrency(portfolio.allTimeLow.value)}
                            </span>
                          </div>
                          {portfolio.allTimeLow.date && (
                            <p className="text-xs text-slate-500 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(portfolio.allTimeLow.date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <PieChart className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Portfolio Data</h2>
            <p className="text-slate-400 mb-6">Start trading to build your portfolio</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;