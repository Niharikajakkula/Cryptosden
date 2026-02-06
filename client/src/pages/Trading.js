import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCrypto } from '../contexts/CryptoContext';
import TradingChart from '../components/TradingChart';
import TradeHistory from '../components/TradeHistory';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Activity,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Percent,
  Calculator
} from 'lucide-react';
import axios from 'axios';

const Trading = () => {
  const { user } = useAuth();
  const { cryptos, formatPrice, formatPercentage } = useCrypto();
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [orderType, setOrderType] = useState('market');
  const [orderSide, setOrderSide] = useState('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [portfolio, setPortfolio] = useState(null);
  const [orders, setOrders] = useState([]);
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chart'); // chart, history
  const [currentPrice, setCurrentPrice] = useState(null);

  // Get current price for selected pair
  useEffect(() => {
    const baseCurrency = selectedPair.split('/')[0].toLowerCase();
    const crypto = cryptos.find(c => c.symbol.toLowerCase() === baseCurrency);
    setCurrentPrice(crypto?.currentPrice || null);
  }, [selectedPair, cryptos]);

  useEffect(() => {
    if (user) {
      fetchTradingData();
    }
  }, [user]);

  const fetchTradingData = async () => {
    try {
      setLoading(true);
      const [portfolioRes, ordersRes, walletsRes, orderBookRes] = await Promise.all([
        axios.get('/api/portfolio'),
        axios.get('/api/trading/orders'),
        axios.get('/api/wallet'),
        axios.get(`/api/trading/orderbook/${selectedPair}`)
      ]);

      setPortfolio(portfolioRes.data);
      setOrders(ordersRes.data.orders);
      setWallets(walletsRes.data.wallets);
      setOrderBook(orderBookRes.data);
    } catch (error) {
      console.error('Error fetching trading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      alert('Please sign in to place orders');
      return;
    }

    if (!amount || (orderType !== 'market' && !price)) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setOrderLoading(true);
      const orderData = {
        type: orderType,
        side: orderSide,
        pair: selectedPair,
        amount: parseFloat(amount),
        ...(orderType !== 'market' && { price: parseFloat(price) }),
        ...(orderType === 'stop-loss' && { stopPrice: parseFloat(stopPrice) })
      };

      await axios.post('/api/trading/orders', orderData);
      
      // Reset form
      setAmount('');
      setPrice('');
      setStopPrice('');
      
      // Refresh data
      fetchTradingData();
      
      alert('Order placed successfully!');
    } catch (error) {
      console.error('Error placing order:', error);
      alert(error.response?.data?.message || 'Failed to place order');
    } finally {
      setOrderLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await axios.delete(`/api/trading/orders/${orderId}`);
      fetchTradingData();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'filled': return 'text-green-400';
      case 'cancelled': return 'text-red-400';
      case 'partially_filled': return 'text-yellow-400';
      case 'open': return 'text-blue-400';
      default: return 'text-slate-400';
    }
  };

  const getOrderStatusIcon = (status) => {
    switch (status) {
      case 'filled': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />;
      case 'open': return <Clock className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Wallet className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Trading Access Required</h2>
          <p className="text-slate-400 mb-6">Please sign in to access trading features</p>
          <button className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Check if trading is allowed for all users or just traders
  const isDemoMode = process.env.NODE_ENV === 'development' || process.env.TRADING_DEMO_MODE === 'true';
  const allowAllUsers = process.env.TRADING_ALLOW_ALL_USERS === 'true';
  
  if (user.role === 'user' && !isDemoMode && !allowAllUsers) {
    const handleUpgradeAccount = async () => {
      try {
        const response = await axios.post('/api/auth/upgrade-role');
        alert('Account upgraded to trader successfully!');
        // Refresh user data by reloading the page
        window.location.reload();
      } catch (error) {
        if (error.response?.data?.action === 'complete_kyc') {
          alert('KYC verification required for trader role. Please complete KYC verification first.');
        } else if (error.response?.data?.action === 'verify_email') {
          alert('Email verification required for trader role. Please verify your email first.');
        } else {
          alert(error.response?.data?.message || 'Failed to upgrade account');
        }
      }
    };

    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Target className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Trader Access Required</h2>
          <p className="text-slate-400 mb-6">
            Upgrade to trader role to access advanced trading features including order placement, portfolio management, and emotional volatility tools.
          </p>
          <div className="space-y-4">
            <button 
              onClick={handleUpgradeAccount}
              className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all"
            >
              Upgrade to Trader
            </button>
            <p className="text-slate-500 text-sm">
              {isDemoMode ? 'Demo mode: Instant upgrade available' : 'Note: KYC verification may be required for trader role upgrade'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Trading Dashboard</h1>
          <p className="text-slate-300">
            Trade cryptocurrencies with advanced tools and real-time market data
          </p>
        </div>

        {/* Portfolio Overview */}
        {portfolio && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    ${portfolio.totalValue?.toFixed(2) || '0.00'}
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
                    {portfolio.totalPnL >= 0 ? '+' : ''}${portfolio.totalPnL?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-slate-400">P&L</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-purple-400" />
                <div>
                  <p className={`text-2xl font-bold ${portfolio.totalPnLPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {portfolio.totalPnLPercentage >= 0 ? '+' : ''}{portfolio.totalPnLPercentage?.toFixed(2) || '0.00'}%
                  </p>
                  <p className="text-slate-400">Return</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <Activity className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {portfolio.holdings?.length || 0}
                  </p>
                  <p className="text-slate-400">Assets</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trading Panel */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Place Order</h2>
              
              {/* Trading Pair Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Trading Pair
                </label>
                <select
                  value={selectedPair}
                  onChange={(e) => setSelectedPair(e.target.value)}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="BTC/USDT">BTC/USDT</option>
                  <option value="ETH/USDT">ETH/USDT</option>
                  <option value="BNB/USDT">BNB/USDT</option>
                  <option value="ADA/USDT">ADA/USDT</option>
                  <option value="SOL/USDT">SOL/USDT</option>
                </select>
              </div>

              {/* Order Type */}
              <div className="mb-4">
                <div className="flex space-x-2">
                  {['market', 'limit', 'stop-loss'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setOrderType(type)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                        orderType === type
                          ? 'bg-cyan-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buy/Sell Toggle */}
              <div className="mb-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setOrderSide('buy')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      orderSide === 'buy'
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4 inline mr-2" />
                    Buy
                  </button>
                  <button
                    onClick={() => setOrderSide('sell')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      orderSide === 'sell'
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <ArrowDownRight className="h-4 w-4 inline mr-2" />
                    Sell
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none pr-16"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 text-sm">
                    {selectedPair.split('/')[0]}
                  </span>
                </div>
                
                {/* Quick Amount Buttons */}
                <div className="flex space-x-2 mt-2">
                  {['25%', '50%', '75%', '100%'].map((percent) => (
                    <button
                      key={percent}
                      onClick={() => {
                        // Mock calculation - in real app, calculate based on available balance
                        const mockBalance = 1.0;
                        const percentage = parseInt(percent) / 100;
                        setAmount((mockBalance * percentage).toFixed(6));
                      }}
                      className="flex-1 px-2 py-1 bg-slate-600 text-slate-300 text-xs rounded hover:bg-slate-500 transition-colors"
                    >
                      {percent}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Input (for limit orders) */}
              {orderType !== 'market' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Price
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none pr-16"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 text-sm">
                      {selectedPair.split('/')[1]}
                    </span>
                  </div>
                  {currentPrice && (
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => setPrice((currentPrice * 0.99).toFixed(2))}
                        className="flex-1 px-2 py-1 bg-slate-600 text-slate-300 text-xs rounded hover:bg-slate-500 transition-colors"
                      >
                        -1%
                      </button>
                      <button
                        onClick={() => setPrice(currentPrice.toFixed(2))}
                        className="flex-1 px-2 py-1 bg-slate-600 text-slate-300 text-xs rounded hover:bg-slate-500 transition-colors"
                      >
                        Market
                      </button>
                      <button
                        onClick={() => setPrice((currentPrice * 1.01).toFixed(2))}
                        className="flex-1 px-2 py-1 bg-slate-600 text-slate-300 text-xs rounded hover:bg-slate-500 transition-colors"
                      >
                        +1%
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Stop Price Input (for stop-loss orders) */}
              {orderType === 'stop-loss' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Stop Price
                  </label>
                  <input
                    type="number"
                    value={stopPrice}
                    onChange={(e) => setStopPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Order Summary */}
              {amount && (orderType === 'market' || price) && (
                <div className="mb-4 p-4 bg-slate-700/50 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center">
                    <Calculator className="h-4 w-4 mr-1" />
                    Order Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount:</span>
                      <span className="text-white">{amount} {selectedPair.split('/')[0]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Price:</span>
                      <span className="text-white">
                        {orderType === 'market' ? 'Market Price' : `$${price}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total:</span>
                      <span className="text-white">
                        ${orderType === 'market' 
                          ? (parseFloat(amount || 0) * (currentPrice || 0)).toFixed(2)
                          : (parseFloat(amount || 0) * parseFloat(price || 0)).toFixed(2)
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fee (0.1%):</span>
                      <span className="text-slate-400">
                        ${orderType === 'market' 
                          ? ((parseFloat(amount || 0) * (currentPrice || 0)) * 0.001).toFixed(2)
                          : ((parseFloat(amount || 0) * parseFloat(price || 0)) * 0.001).toFixed(2)
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={orderLoading}
                className={`w-full py-3 rounded-lg font-medium transition-all ${
                  orderSide === 'buy'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                } text-white ${orderLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {orderLoading ? 'Placing Order...' : `${orderSide === 'buy' ? 'Buy' : 'Sell'} ${selectedPair.split('/')[0]}`}
              </button>
            </div>
          </div>

          {/* Chart & History Tabs */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tab Navigation */}
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('chart')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'chart'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Price Chart
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Trade History
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'chart' ? (
              <>
                {/* Trading Chart */}
                <TradingChart pair={selectedPair} currentPrice={currentPrice} />

                {/* Order Book */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Order Book - {selectedPair}</h2>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {/* Asks (Sell Orders) */}
                    <div>
                      <h3 className="text-sm font-medium text-red-400 mb-3">Asks (Sell)</h3>
                      <div className="space-y-1">
                        {orderBook.asks?.slice(0, 10).map((ask, index) => (
                          <div key={index} className="flex justify-between text-sm hover:bg-slate-700/30 px-2 py-1 rounded cursor-pointer"
                               onClick={() => orderType !== 'market' && setPrice(ask.price)}>
                            <span className="text-red-400">{ask.price}</span>
                            <span className="text-slate-300">{ask.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bids (Buy Orders) */}
                    <div>
                      <h3 className="text-sm font-medium text-green-400 mb-3">Bids (Buy)</h3>
                      <div className="space-y-1">
                        {orderBook.bids?.slice(0, 10).map((bid, index) => (
                          <div key={index} className="flex justify-between text-sm hover:bg-slate-700/30 px-2 py-1 rounded cursor-pointer"
                               onClick={() => orderType !== 'market' && setPrice(bid.price)}>
                            <span className="text-green-400">{bid.price}</span>
                            <span className="text-slate-300">{bid.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <TradeHistory user={user} />
            )}

            {/* Your Orders */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Your Orders</h2>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                </div>
              ) : orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                        <th className="pb-3">Pair</th>
                        <th className="pb-3">Type</th>
                        <th className="pb-3">Side</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Price</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order._id} className="border-b border-slate-700/50">
                          <td className="py-3 text-white">{order.pair}</td>
                          <td className="py-3 text-slate-300 capitalize">{order.type}</td>
                          <td className="py-3">
                            <span className={`capitalize ${order.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                              {order.side}
                            </span>
                          </td>
                          <td className="py-3 text-slate-300">{order.amount}</td>
                          <td className="py-3 text-slate-300">{order.price || 'Market'}</td>
                          <td className="py-3">
                            <div className={`flex items-center space-x-1 ${getOrderStatusColor(order.status)}`}>
                              {getOrderStatusIcon(order.status)}
                              <span className="capitalize">{order.status}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            {order.status === 'open' && (
                              <button
                                onClick={() => handleCancelOrder(order._id)}
                                className="text-red-400 hover:text-red-300 text-sm"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No orders yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trading;