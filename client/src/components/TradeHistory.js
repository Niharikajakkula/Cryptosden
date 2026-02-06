import { useState, useEffect } from 'react';
import { Clock, TrendingUp, TrendingDown, Filter, Download } from 'lucide-react';
import axios from 'axios';

const TradeHistory = ({ user }) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, buy, sell
  const [timeFilter, setTimeFilter] = useState('7d'); // 1d, 7d, 30d, all

  useEffect(() => {
    if (user) {
      fetchTradeHistory();
    }
  }, [user, filter, timeFilter]);

  const fetchTradeHistory = async () => {
    try {
      setLoading(true);
      // Mock trade history data for demonstration
      const mockTrades = [
        {
          id: '1',
          pair: 'BTC/USDT',
          side: 'buy',
          amount: 0.5,
          price: 44500,
          total: 22250,
          fee: 22.25,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'completed'
        },
        {
          id: '2',
          pair: 'ETH/USDT',
          side: 'sell',
          amount: 2.0,
          price: 2800,
          total: 5600,
          fee: 5.6,
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          status: 'completed'
        },
        {
          id: '3',
          pair: 'BTC/USDT',
          side: 'buy',
          amount: 0.25,
          price: 43800,
          total: 10950,
          fee: 10.95,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          status: 'completed'
        }
      ];

      // Apply filters
      let filteredTrades = mockTrades;
      
      if (filter !== 'all') {
        filteredTrades = filteredTrades.filter(trade => trade.side === filter);
      }

      if (timeFilter !== 'all') {
        const timeLimit = {
          '1d': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000,
          '30d': 30 * 24 * 60 * 60 * 1000
        };
        
        const cutoff = new Date(Date.now() - timeLimit[timeFilter]);
        filteredTrades = filteredTrades.filter(trade => trade.timestamp > cutoff);
      }

      setTrades(filteredTrades);
    } catch (error) {
      console.error('Error fetching trade history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (value) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const exportTrades = () => {
    const csvContent = [
      ['Date', 'Pair', 'Side', 'Amount', 'Price', 'Total', 'Fee', 'Status'],
      ...trades.map(trade => [
        formatTime(trade.timestamp),
        trade.pair,
        trade.side.toUpperCase(),
        trade.amount,
        trade.price,
        trade.total,
        trade.fee,
        trade.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Trade History</h2>
        
        <div className="flex items-center space-x-4">
          {/* Filters */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-slate-700 text-white px-3 py-1 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none text-sm"
            >
              <option value="all">All Trades</option>
              <option value="buy">Buy Orders</option>
              <option value="sell">Sell Orders</option>
            </select>
          </div>

          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="bg-slate-700 text-white px-3 py-1 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none text-sm"
          >
            <option value="1d">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>

          <button
            onClick={exportTrades}
            className="flex items-center space-x-1 px-3 py-1 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        </div>
      ) : trades.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                <th className="pb-3">Time</th>
                <th className="pb-3">Pair</th>
                <th className="pb-3">Side</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Total</th>
                <th className="pb-3">Fee</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                  <td className="py-3 text-slate-300 text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(trade.timestamp)}</span>
                    </div>
                  </td>
                  <td className="py-3 text-white font-medium">{trade.pair}</td>
                  <td className="py-3">
                    <div className={`flex items-center space-x-1 ${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.side === 'buy' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span className="capitalize font-medium">{trade.side}</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-300">{trade.amount}</td>
                  <td className="py-3 text-slate-300">{formatPrice(trade.price)}</td>
                  <td className="py-3 text-white font-medium">{formatPrice(trade.total)}</td>
                  <td className="py-3 text-slate-400">{formatPrice(trade.fee)}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full capitalize">
                      {trade.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No trades found for the selected filters</p>
        </div>
      )}

      {trades.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-slate-400 text-sm">Total Trades</p>
              <p className="text-white font-semibold text-lg">{trades.length}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Volume</p>
              <p className="text-white font-semibold text-lg">
                {formatPrice(trades.reduce((sum, trade) => sum + trade.total, 0))}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Fees</p>
              <p className="text-white font-semibold text-lg">
                {formatPrice(trades.reduce((sum, trade) => sum + trade.fee, 0))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeHistory;