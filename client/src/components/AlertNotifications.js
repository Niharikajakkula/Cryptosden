import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

const AlertNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Fetch recent triggered alerts
    fetchTriggeredAlerts();
    
    // Set up polling for new alerts (in production, use WebSocket)
    const interval = setInterval(fetchTriggeredAlerts, 60000); // Check every 60 seconds (1 minute)
    
    return () => clearInterval(interval);
  }, []);

  const fetchTriggeredAlerts = async () => {
    try {
      const response = await fetch('/api/alerts?triggered=true&limit=5', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const recentAlerts = data.filter(alert => 
          alert.isTriggered && 
          new Date(alert.triggeredAt) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        );
        setNotifications(recentAlerts);
      }
    } catch (error) {
      console.error('Error fetching triggered alerts:', error);
    }
  };

  const dismissNotification = (alertId) => {
    setNotifications(prev => prev.filter(alert => alert._id !== alertId));
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'price': return <TrendingUp className="h-4 w-4" />;
      case 'sentiment': return <CheckCircle className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'price': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'sentiment': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'risk': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-slate-800 border border-slate-700 rounded-full p-3 shadow-lg hover:bg-slate-700 transition-colors"
      >
        <Bell className="h-5 w-5 text-white" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      {isOpen && (
        <div className="absolute top-14 right-0 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Recent Alerts</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.map((alert) => (
              <div
                key={alert._id}
                className={`p-4 border-b border-slate-700 last:border-b-0 ${getAlertColor(alert.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-1 rounded ${getAlertColor(alert.type)}`}>
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-sm">
                        {alert.cryptocurrency.toUpperCase()} Alert
                      </h4>
                      <p className="text-slate-300 text-xs mt-1">
                        {alert.message || `${alert.type} alert triggered`}
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        {new Date(alert.triggeredAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissNotification(alert._id)}
                    className="text-slate-400 hover:text-white ml-2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-slate-700">
            <button
              onClick={() => {
                setIsOpen(false);
                window.location.href = '/smart-alerts';
              }}
              className="w-full text-center text-blue-400 hover:text-blue-300 text-sm"
            >
              View All Alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertNotifications;