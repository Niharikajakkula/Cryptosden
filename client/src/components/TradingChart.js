import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

const TradingChart = ({ pair, currentPrice }) => {
  const [chartData, setChartData] = useState([]);
  const [timeframe, setTimeframe] = useState('1h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateMockChartData();
  }, [pair, timeframe]);

  const generateMockChartData = () => {
    setLoading(true);
    
    // Generate mock price data for demonstration
    const dataPoints = timeframe === '1m' ? 60 : timeframe === '5m' ? 288 : timeframe === '1h' ? 24 : 7;
    const basePrice = currentPrice || 45000;
    const data = [];
    
    for (let i = dataPoints; i >= 0; i--) {
      const timestamp = new Date(Date.now() - i * (timeframe === '1m' ? 60000 : timeframe === '5m' ? 300000 : timeframe === '1h' ? 3600000 : 86400000));
      const volatility = (Math.random() - 0.5) * 0.05; // ±2.5% volatility
      const price = basePrice * (1 + volatility * (i / dataPoints));
      
      data.push({
        time: timestamp.toISOString(),
        price: price,
        volume: Math.random() * 1000000,
        timestamp: timestamp.getTime()
      });
    }
    
    setChartData(data);
    setLoading(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    if (timeframe === '1m' || timeframe === '5m') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '1h') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatPrice = (value) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const priceChange = chartData.length > 1 ? chartData[chartData.length - 1].price - chartData[0].price : 0;
  const priceChangePercent = chartData.length > 1 ? (priceChange / chartData[0].price) * 100 : 0;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">{pair} Price Chart</h2>
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold text-white">
              {formatPrice(currentPrice || 45000)}
            </span>
            <div className={`flex items-center space-x-1 ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="font-medium">
                {priceChange >= 0 ? '+' : ''}{formatPrice(Math.abs(priceChange))} ({priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {['1m', '5m', '1h', '1d'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="timestamp"
                tickFormatter={formatTime}
                stroke="#9CA3AF"
                fontSize={12}
              />
              <YAxis 
                domain={['dataMin - 100', 'dataMax + 100']}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                stroke="#9CA3AF"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value) => [formatPrice(value), 'Price']}
                labelFormatter={(timestamp) => formatTime(timestamp)}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#06B6D4"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#06B6D4' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700/50">
        <div className="text-center">
          <p className="text-slate-400 text-sm">24h Volume</p>
          <p className="text-white font-semibold">$2.4B</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-sm">24h High</p>
          <p className="text-green-400 font-semibold">{formatPrice((currentPrice || 45000) * 1.05)}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-sm">24h Low</p>
          <p className="text-red-400 font-semibold">{formatPrice((currentPrice || 45000) * 0.95)}</p>
        </div>
      </div>
    </div>
  );
};

export default TradingChart;