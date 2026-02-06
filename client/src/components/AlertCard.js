import React from 'react';
import { Power, PowerOff, Trash2, TestTube, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const AlertCard = ({ alert, onToggle, onDelete, onTest, getAlertIcon, getAlertTypeColor }) => {
  const formatThreshold = (threshold, type) => {
    switch (type) {
      case 'price':
        return `$${threshold.toLocaleString()}`;
      case 'sentiment':
      case 'risk':
        return `${threshold}%`;
      case 'volume':
        return `$${(threshold / 1e6).toFixed(2)}M`;
      case 'technical':
        return threshold.toString();
      default:
        return threshold.toString();
    }
  };

  const formatCurrentValue = (value, type) => {
    if (!value) return 'N/A';
    
    switch (type) {
      case 'price':
        return `$${value.toLocaleString()}`;
      case 'sentiment':
      case 'risk':
        return `${value.toFixed(1)}%`;
      case 'volume':
        return `$${(value / 1e6).toFixed(2)}M`;
      case 'technical':
        return value.toFixed(2);
      default:
        return value.toString();
    }
  };

  const getConditionText = (condition) => {
    switch (condition) {
      case 'above': return 'Above';
      case 'below': return 'Below';
      case 'crosses_up': return 'Crosses Up';
      case 'crosses_down': return 'Crosses Down';
      case 'change_percent': return 'Change %';
      default: return condition;
    }
  };

  const getStatusColor = () => {
    if (alert.isTriggered) return 'border-yellow-500/50 bg-yellow-500/10';
    if (alert.isActive) return 'border-green-500/50 bg-green-500/10';
    return 'border-slate-600/50 bg-slate-700/30';
  };

  const getStatusIcon = () => {
    if (alert.isTriggered) return <AlertCircle className="h-5 w-5 text-yellow-400" />;
    if (alert.isActive) return <CheckCircle className="h-5 w-5 text-green-400" />;
    return <Clock className="h-5 w-5 text-slate-400" />;
  };

  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm border rounded-xl p-6 ${getStatusColor()}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-slate-700/50 ${getAlertTypeColor(alert.type)}`}>
            {getAlertIcon(alert.type)}
          </div>
          <div>
            <h3 className="text-white font-semibold">
              {alert.cryptocurrency.toUpperCase()} {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} Alert
            </h3>
            <p className="text-slate-400 text-sm">
              {getConditionText(alert.condition)} {formatThreshold(alert.threshold, alert.type)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
        </div>
      </div>

      {/* Alert Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-slate-400 text-sm">Current Value</p>
          <p className="text-white font-semibold">
            {formatCurrentValue(alert.currentValue, alert.type)}
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Status</p>
          <p className={`font-semibold ${
            alert.isTriggered ? 'text-yellow-400' : 
            alert.isActive ? 'text-green-400' : 'text-slate-400'
          }`}>
            {alert.isTriggered ? 'Triggered' : alert.isActive ? 'Active' : 'Inactive'}
          </p>
        </div>
      </div>

      {/* Notification Methods */}
      <div className="mb-4">
        <p className="text-slate-400 text-sm mb-2">Notifications</p>
        <div className="flex gap-2">
          {alert.notificationMethod.map((method) => (
            <span
              key={method}
              className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-md"
            >
              {method.charAt(0).toUpperCase() + method.slice(1)}
            </span>
          ))}
        </div>
      </div>

      {/* Triggered Info */}
      {alert.isTriggered && alert.triggeredAt && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-400 text-sm font-medium">Alert Triggered</p>
          <p className="text-yellow-300 text-xs">
            {new Date(alert.triggeredAt).toLocaleString()}
          </p>
          {alert.message && (
            <p className="text-yellow-200 text-sm mt-1">{alert.message}</p>
          )}
        </div>
      )}

      {/* Last Checked */}
      <div className="mb-4">
        <p className="text-slate-400 text-xs">
          Last checked: {alert.lastChecked ? new Date(alert.lastChecked).toLocaleString() : 'Never'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              alert.isActive
                ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
            }`}
          >
            {alert.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
            {alert.isActive ? 'Deactivate' : 'Activate'}
          </button>
          
          <button
            onClick={onTest}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-sm font-medium transition-colors"
          >
            <TestTube className="h-4 w-4" />
            Test
          </button>
        </div>

        <button
          onClick={onDelete}
          className="flex items-center gap-2 px-3 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg text-sm font-medium transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </div>
  );
};

export default AlertCard;