import React, { useState } from 'react';
import { X, Bell, TrendingUp, Activity, AlertTriangle, Volume2, BarChart3 } from 'lucide-react';

const CreateAlertModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    type: 'price',
    cryptocurrency: 'bitcoin',
    condition: 'above',
    threshold: '',
    notificationMethod: ['email'],
    metadata: {}
  });

  const [errors, setErrors] = useState({});

  const alertTypes = [
    { id: 'price', name: 'Price Alert', icon: TrendingUp, description: 'Get notified when price crosses a threshold' },
    { id: 'sentiment', name: 'Sentiment Alert', icon: Activity, description: 'Monitor market sentiment changes' },
    { id: 'risk', name: 'Risk Alert', icon: AlertTriangle, description: 'Track risk level fluctuations' },
    { id: 'volume', name: 'Volume Alert', icon: Volume2, description: 'Watch for volume spikes or drops' },
    { id: 'technical', name: 'Technical Alert', icon: BarChart3, description: 'Technical indicator signals' }
  ];

  const cryptocurrencies = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
    { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
    { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
    { id: 'solana', name: 'Solana', symbol: 'SOL' },
    { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC' }
  ];

  const getConditions = (type) => {
    switch (type) {
      case 'price':
        return [
          { id: 'above', name: 'Above', description: 'Trigger when price goes above threshold' },
          { id: 'below', name: 'Below', description: 'Trigger when price goes below threshold' },
          { id: 'crosses_up', name: 'Crosses Up', description: 'Trigger when price crosses up through threshold' },
          { id: 'crosses_down', name: 'Crosses Down', description: 'Trigger when price crosses down through threshold' }
        ];
      case 'sentiment':
      case 'risk':
        return [
          { id: 'above', name: 'Above', description: 'Trigger when value goes above threshold' },
          { id: 'below', name: 'Below', description: 'Trigger when value goes below threshold' },
          { id: 'change_percent', name: 'Change %', description: 'Trigger on percentage change' }
        ];
      case 'volume':
        return [
          { id: 'above', name: 'Above', description: 'Trigger when volume goes above threshold' },
          { id: 'below', name: 'Below', description: 'Trigger when volume goes below threshold' },
          { id: 'change_percent', name: 'Change %', description: 'Trigger on volume change percentage' }
        ];
      case 'technical':
        return [
          { id: 'above', name: 'Above', description: 'Trigger when indicator goes above threshold' },
          { id: 'below', name: 'Below', description: 'Trigger when indicator goes below threshold' }
        ];
      default:
        return [];
    }
  };

  const getThresholdPlaceholder = (type) => {
    switch (type) {
      case 'price': return 'e.g., 50000 (USD)';
      case 'sentiment': return 'e.g., 70 (0-100 scale)';
      case 'risk': return 'e.g., 80 (0-100 scale)';
      case 'volume': return 'e.g., 1000000000 (USD)';
      case 'technical': return 'e.g., 70 (RSI value)';
      default: return 'Enter threshold value';
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleNotificationMethodChange = (method) => {
    setFormData(prev => ({
      ...prev,
      notificationMethod: prev.notificationMethod.includes(method)
        ? prev.notificationMethod.filter(m => m !== method)
        : [...prev.notificationMethod, method]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.threshold || isNaN(formData.threshold) || parseFloat(formData.threshold) <= 0) {
      newErrors.threshold = 'Please enter a valid positive number';
    }

    if (formData.notificationMethod.length === 0) {
      newErrors.notificationMethod = 'Please select at least one notification method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const alertData = {
      ...formData,
      threshold: parseFloat(formData.threshold)
    };

    // Add metadata based on alert type
    if (formData.type === 'technical') {
      alertData.metadata = {
        ...alertData.metadata,
        technicalIndicator: 'RSI' // Default to RSI
      };
    }

    onSubmit(alertData);
  };

  const selectedType = alertTypes.find(type => type.id === formData.type);
  const conditions = getConditions(formData.type);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Create Smart Alert</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Alert Type Selection */}
          <div>
            <label className="block text-white font-medium mb-3">Alert Type</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alertTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleInputChange('type', type.id)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      formData.type === type.id
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-slate-600 bg-slate-700/30 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{type.name}</span>
                    </div>
                    <p className="text-sm opacity-80">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cryptocurrency Selection */}
          <div>
            <label className="block text-white font-medium mb-3">Cryptocurrency</label>
            <select
              value={formData.cryptocurrency}
              onChange={(e) => handleInputChange('cryptocurrency', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {cryptocurrencies.map(crypto => (
                <option key={crypto.id} value={crypto.id}>
                  {crypto.name} ({crypto.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Condition Selection */}
          <div>
            <label className="block text-white font-medium mb-3">Condition</label>
            <div className="space-y-2">
              {conditions.map((condition) => (
                <button
                  key={condition.id}
                  type="button"
                  onClick={() => handleInputChange('condition', condition.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    formData.condition === condition.id
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-slate-600 bg-slate-700/30 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="font-medium">{condition.name}</div>
                  <div className="text-sm opacity-80">{condition.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Threshold Input */}
          <div>
            <label className="block text-white font-medium mb-3">
              Threshold Value
              {selectedType && (
                <span className="text-slate-400 text-sm font-normal ml-2">
                  ({selectedType.name})
                </span>
              )}
            </label>
            <input
              type="number"
              step="any"
              value={formData.threshold}
              onChange={(e) => handleInputChange('threshold', e.target.value)}
              placeholder={getThresholdPlaceholder(formData.type)}
              className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.threshold ? 'border-red-500' : 'border-slate-600'
              }`}
            />
            {errors.threshold && (
              <p className="text-red-400 text-sm mt-1">{errors.threshold}</p>
            )}
          </div>

          {/* Technical Indicator (for technical alerts) */}
          {formData.type === 'technical' && (
            <div>
              <label className="block text-white font-medium mb-3">Technical Indicator</label>
              <select
                value={formData.metadata.technicalIndicator || 'RSI'}
                onChange={(e) => handleInputChange('metadata', { 
                  ...formData.metadata, 
                  technicalIndicator: e.target.value 
                })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="RSI">RSI (Relative Strength Index)</option>
                <option value="MACD">MACD (Moving Average Convergence Divergence)</option>
                <option value="SMA">SMA (Simple Moving Average)</option>
                <option value="EMA">EMA (Exponential Moving Average)</option>
              </select>
            </div>
          )}

          {/* Notification Methods */}
          <div>
            <label className="block text-white font-medium mb-3">Notification Methods</label>
            <div className="space-y-2">
              {['email', 'push', 'sms'].map((method) => (
                <label key={method} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notificationMethod.includes(method)}
                    onChange={() => handleNotificationMethodChange(method)}
                    className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-white capitalize">{method}</span>
                  {method === 'push' && (
                    <span className="text-slate-400 text-sm">(Coming Soon)</span>
                  )}
                  {method === 'sms' && (
                    <span className="text-slate-400 text-sm">(Coming Soon)</span>
                  )}
                </label>
              ))}
            </div>
            {errors.notificationMethod && (
              <p className="text-red-400 text-sm mt-1">{errors.notificationMethod}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Create Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAlertModal;