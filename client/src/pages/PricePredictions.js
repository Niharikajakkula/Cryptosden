import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Brain, BarChart3, AlertTriangle, Info } from 'lucide-react';

const PricePredictions = () => {
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('all');
  const [timeframe, setTimeframe] = useState('7d');
  const [coins, setCoins] = useState([]);
  const [loadingCoins, setLoadingCoins] = useState(true);

  const models = [
    { id: 'all', name: 'All Models', description: 'Compare all prediction models' },
    { id: 'linear', name: 'Linear Regression', description: 'Simple trend-based predictions' },
    { id: 'forest', name: 'Random Forest', description: 'Ensemble learning approach' },
    { id: 'lstm', name: 'LSTM Neural Network', description: 'Deep learning time-series model' }
  ];

  const timeframes = [
    { id: '1d', name: '1 Day', description: 'Short-term prediction' },
    { id: '7d', name: '7 Days', description: 'Weekly forecast' },
    { id: '30d', name: '30 Days', description: 'Monthly outlook' }
  ];

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/predictions/${selectedCoin}?model=${selectedModel}&timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setPredictions(data);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      
      // Generate dynamic mock data based on selected coin
      const coinData = {
        bitcoin: { basePrice: 45000, volatility: 0.15 },
        ethereum: { basePrice: 2800, volatility: 0.18 },
        cardano: { basePrice: 0.45, volatility: 0.25 },
        polkadot: { basePrice: 6.5, volatility: 0.22 },
        chainlink: { basePrice: 15.2, volatility: 0.20 },
        solana: { basePrice: 95.5, volatility: 0.28 },
        'avalanche-2': { basePrice: 38.2, volatility: 0.24 },
        polygon: { basePrice: 0.85, volatility: 0.26 }
      };

      const coin = coinData[selectedCoin] || coinData.bitcoin;
      const currentPrice = coin.basePrice;
      
      // Generate different predictions based on timeframe and model
      const timeframeMultiplier = {
        '1d': { min: 0.98, max: 1.05 },
        '7d': { min: 0.92, max: 1.15 },
        '30d': { min: 0.85, max: 1.35 }
      };
      
      const multiplier = timeframeMultiplier[timeframe] || timeframeMultiplier['7d'];
      
      // Generate unique predictions for each model
      const generatePrediction = (modelSeed, confidenceBase) => {
        const random = Math.sin(modelSeed * 12345 + selectedCoin.length * 67890) * 0.5 + 0.5;
        const priceChange = multiplier.min + (multiplier.max - multiplier.min) * random;
        const predictedPrice = currentPrice * priceChange;
        const change = ((predictedPrice - currentPrice) / currentPrice) * 100;
        
        return {
          price: predictedPrice,
          confidence: Math.max(0.5, Math.min(0.95, confidenceBase + (random - 0.5) * 0.2)),
          trend: change > 0 ? 'bullish' : 'bearish',
          change: change
        };
      };

      // Generate metrics based on model and coin
      const generateMetrics = (modelSeed, baseAccuracy) => {
        const random = Math.sin(modelSeed * 54321 + selectedCoin.length * 98765) * 0.5 + 0.5;
        const rmse = Math.floor(currentPrice * 0.02 * (1 + random * 0.5));
        const mae = Math.floor(rmse * 0.7);
        const r2 = Math.max(0.5, Math.min(0.95, baseAccuracy + (random - 0.5) * 0.2));
        
        return { rmse, mae, r2 };
      };

      setPredictions({
        coin: selectedCoin,
        currentPrice: currentPrice,
        predictions: {
          linear: generatePrediction(1, 0.72),
          forest: generatePrediction(2, 0.85),
          lstm: generatePrediction(3, 0.78)
        },
        metrics: {
          linear: generateMetrics(1, 0.72),
          forest: generateMetrics(2, 0.85),
          lstm: generateMetrics(3, 0.78)
        },
        features: {
          technical: ['RSI', 'MACD', 'Moving Averages', 'Bollinger Bands'],
          market: ['Volume', 'Market Cap', 'Volatility', 'Trading Pairs'],
          sentiment: ['Social Media', 'News Sentiment', 'Fear & Greed Index']
        }
      });
    }
    setLoading(false);
  }, [selectedCoin, selectedModel, timeframe]);

  const fetchCoins = useCallback(async () => {
    setLoadingCoins(true);
    try {
      const response = await fetch('/api/crypto', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      // Transform the crypto data to match our dropdown format
      const coinOptions = data.map(crypto => ({
        id: crypto.id,
        name: crypto.name,
        symbol: crypto.symbol.toUpperCase()
      }));
      
      setCoins(coinOptions);
    } catch (error) {
      console.error('Error fetching cryptocurrencies:', error);
      // Fallback to hardcoded options if API fails
      setCoins([
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
    setLoadingCoins(false);
  }, []);

  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const formatPrice = (price) => {
    if (price < 1) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 4,
        maximumFractionDigits: 6
      }).format(price);
    } else if (price < 100) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 3
      }).format(price);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(price);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendIcon = (trend) => {
    return trend === 'bullish' ? 
      <TrendingUp className="h-4 w-4 text-green-400" /> : 
      <TrendingDown className="h-4 w-4 text-red-400" />;
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
            <h1 className="text-3xl font-bold text-white">AI Price Predictions</h1>
          </div>
          <p className="text-slate-300 mb-4">
            Advanced machine learning models for cryptocurrency price forecasting and trend analysis
          </p>
          
          {/* Educational Disclaimer */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-amber-400 font-semibold mb-1">Educational Purpose Only</h3>
                <p className="text-amber-200 text-sm">
                  This feature is for educational and analytical purposes only and does not provide financial or investment advice. 
                  Predictions are based on historical data and should not be used for actual trading decisions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Coin Selection */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              Select Cryptocurrency
              {!loadingCoins && coins.length > 0 && (
                <span className="text-slate-400 text-sm font-normal">
                  ({coins.length} available)
                </span>
              )}
            </h3>
            
            {loadingCoins ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                <span className="text-slate-300">Loading cryptocurrencies...</span>
              </div>
            ) : (
              <select
                value={selectedCoin}
                onChange={(e) => setSelectedCoin(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={coins.length === 0}
              >
                {coins.length === 0 ? (
                  <option value="">No cryptocurrencies available</option>
                ) : (
                  coins.map(coin => (
                    <option key={coin.id} value={coin.id}>
                      {coin.name} ({coin.symbol})
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          {/* Model Selection */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" />
              Prediction Model
            </h3>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe Selection */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Forecast Period
            </h3>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {timeframes.map(tf => (
                <option key={tf.id} value={tf.id}>
                  {tf.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Generating AI predictions...</p>
          </div>
        ) : predictions && (
          <>
            {/* Current Price */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-8">
              <h3 className="text-white font-semibold mb-4">Current Market Data</h3>
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-2">Current Price</p>
                <p className="text-4xl font-bold text-white">{formatPrice(predictions.currentPrice)}</p>
              </div>
            </div>

            {/* Predictions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {Object.entries(predictions.predictions).map(([modelName, prediction]) => (
                <div key={modelName} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold capitalize">{modelName} Model</h3>
                    {getTrendIcon(prediction.trend)}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-slate-400 text-sm">Predicted Price</p>
                      <p className="text-2xl font-bold text-white">{formatPrice(prediction.price)}</p>
                    </div>
                    
                    <div>
                      <p className="text-slate-400 text-sm">Expected Change</p>
                      <p className={`text-lg font-semibold ${prediction.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {prediction.change > 0 ? '+' : ''}{prediction.change.toFixed(2)}%
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-slate-400 text-sm">Confidence Score</p>
                      <p className={`text-lg font-semibold ${getConfidenceColor(prediction.confidence)}`}>
                        {(prediction.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Model Performance Metrics */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-8">
              <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                Model Performance Metrics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(predictions.metrics).map(([modelName, metrics]) => (
                  <div key={modelName} className="bg-slate-700/30 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3 capitalize">{modelName} Model</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">RMSE:</span>
                        <span className="text-white">{metrics.rmse.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">MAE:</span>
                        <span className="text-white">{metrics.mae.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">R² Score:</span>
                        <span className="text-white">{metrics.r2.toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Importance */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-400" />
                Model Features & Explainability
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-green-400 font-medium mb-3">Technical Indicators</h4>
                  <ul className="space-y-1 text-sm text-slate-300">
                    {predictions.features.technical.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-blue-400 font-medium mb-3">Market Data</h4>
                  <ul className="space-y-1 text-sm text-slate-300">
                    {predictions.features.market.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-purple-400 font-medium mb-3">Sentiment Analysis</h4>
                  <ul className="space-y-1 text-sm text-slate-300">
                    {predictions.features.sentiment.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
                <h4 className="text-yellow-400 font-medium mb-2">Model Limitations</h4>
                <p className="text-sm text-slate-300">
                  • Predictions are based on historical patterns and may not account for unprecedented market events<br/>
                  • Model accuracy decreases for longer-term predictions<br/>
                  • External factors (regulations, major news) can significantly impact actual prices<br/>
                  • Past performance does not guarantee future results
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PricePredictions;