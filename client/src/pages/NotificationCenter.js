import React, { useState, useEffect } from 'react';
import { Bell, History, Settings, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import NotificationSettings from '../components/NotificationSettings';

const NotificationCenter = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
    fetchStats();
  }, [activeTab]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setHistory(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notification history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/notifications/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'price': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'sentiment': return <Bell className="h-4 w-4 text-blue-400" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default: return <Bell className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const tabs = [
    { id: 'settings', name: 'Settings', icon: Settings },
    { id: 'history', name: 'History', icon: History }
  ];

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
            <Bell className="h-8 w-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">Notification Center</h1>
          </div>
          <p className="text-slate-300">Manage your notification preferences and view notification history</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'settings' && <NotificationSettings />}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* History Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="h-4 w-4 text-cyan-400" />
                  <span className="text-slate-300 text-sm">Total Sent</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.triggered || 0}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span className="text-slate-300 text-sm">Last 24h</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.recent24h || 0}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-slate-300 text-sm">Success Rate</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.successRate || 0}%</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <span className="text-slate-300 text-sm">Active Alerts</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.active || 0}</p>
              </div>
            </div>

            {/* Notification History */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Notifications</h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                  <p className="text-slate-300">Loading notification history...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-2">No Notifications Yet</h4>
                  <p className="text-slate-400">
                    You haven't received any notifications yet. Create some alerts to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-3 p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="p-2 bg-slate-600/50 rounded-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-white font-medium">
                            {notification.cryptocurrency?.toUpperCase()} {notification.type} Alert
                          </h4>
                          <span className="text-slate-400 text-sm">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm mb-2">
                          {notification.message || `${notification.type} alert was triggered`}
                        </p>
                        <div className="flex items-center gap-2">
                          {notification.methods?.map((method) => (
                            <span
                              key={method}
                              className="px-2 py-1 bg-slate-600/50 text-slate-300 text-xs rounded-md"
                            >
                              {method}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;