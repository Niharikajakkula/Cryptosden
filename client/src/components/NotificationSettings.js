import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, MessageSquare, Shield, TrendingUp, Users, Clock, TestTube, Save, RefreshCw } from 'lucide-react';

const NotificationSettings = () => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState({});
  const [stats, setStats] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPreferences();
    fetchStats();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setPreferences(data.preferences);
    } catch (error) {
      console.error('Error fetching preferences:', error);
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
      console.error('Error fetching stats:', error);
    }
  };

  const updatePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ preferences })
      });

      if (response.ok) {
        setMessage('Notification preferences updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      setMessage('Failed to update preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const testNotification = async (type) => {
    setTesting(prev => ({ ...prev, [type]: true }));
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          type,
          message: `This is a test ${type} notification from Cryptosden. If you received this, your ${type} notifications are working correctly!`
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`Test ${type} notification sent successfully!`);
      } else {
        setMessage(data.message || `Failed to send test ${type} notification`);
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error(`Error testing ${type} notification:`, error);
      setMessage(`Failed to send test ${type} notification`);
    } finally {
      setTesting(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleMethodToggle = (method, enabled) => {
    setPreferences(prev => ({
      ...prev,
      [method]: {
        ...prev[method],
        enabled
      }
    }));
  };

  const handleCategoryToggle = (method, category, enabled) => {
    setPreferences(prev => ({
      ...prev,
      [method]: {
        ...prev[method],
        [category]: enabled
      }
    }));
  };

  const handleFrequencyChange = (frequency, enabled) => {
    setPreferences(prev => ({
      ...prev,
      frequency: {
        immediate: frequency === 'immediate' ? enabled : frequency !== 'immediate' ? prev.frequency.immediate : false,
        daily: frequency === 'daily' ? enabled : frequency !== 'daily' ? prev.frequency.daily : false,
        weekly: frequency === 'weekly' ? enabled : frequency !== 'weekly' ? prev.frequency.weekly : false
      }
    }));
  };

  const handleQuietHoursToggle = (enabled) => {
    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        enabled
      }
    }));
  };

  const handleQuietHoursChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const notificationMethods = [
    {
      key: 'email',
      name: 'Email',
      icon: Mail,
      description: 'Receive notifications via email',
      available: true
    },
    {
      key: 'push',
      name: 'Push Notifications',
      icon: Smartphone,
      description: 'Browser and mobile push notifications',
      available: false,
      comingSoon: true
    },
    {
      key: 'sms',
      name: 'SMS',
      icon: MessageSquare,
      description: 'Text message notifications',
      available: false,
      comingSoon: true
    }
  ];

  const notificationCategories = [
    {
      key: 'alerts',
      name: 'Smart Alerts',
      icon: Bell,
      description: 'Price, sentiment, and risk alerts'
    },
    {
      key: 'marketUpdates',
      name: 'Market Updates',
      icon: TrendingUp,
      description: 'Daily market summaries and insights'
    },
    {
      key: 'security',
      name: 'Security',
      icon: Shield,
      description: 'Account security and login alerts'
    },
    {
      key: 'newsletter',
      name: 'Newsletter',
      icon: Users,
      description: 'Weekly crypto news and updates'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Notification Settings</h2>
          </div>
          <button
            onClick={fetchStats}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
        <p className="text-slate-300">Manage how and when you receive notifications from Cryptosden</p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('success') 
            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {message}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-4 w-4 text-cyan-400" />
            <span className="text-slate-300 text-sm">Total Alerts</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.total || 0}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-slate-300 text-sm">Triggered</span>
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
            <Shield className="h-4 w-4 text-purple-400" />
            <span className="text-slate-300 text-sm">Success Rate</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.successRate || 0}%</p>
        </div>
      </div>

      {/* Notification Methods */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Notification Methods</h3>
        <div className="space-y-4">
          {notificationMethods.map((method) => {
            const Icon = method.icon;
            const isEnabled = preferences?.[method.key]?.enabled;
            
            return (
              <div key={method.key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-cyan-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{method.name}</span>
                      {method.comingSoon && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-md">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">{method.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {method.available && (
                    <button
                      onClick={() => testNotification(method.key)}
                      disabled={!isEnabled || testing[method.key]}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <TestTube className="h-4 w-4" />
                      {testing[method.key] ? 'Testing...' : 'Test'}
                    </button>
                  )}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled || false}
                      onChange={(e) => handleMethodToggle(method.key, e.target.checked)}
                      disabled={!method.available}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notification Categories */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Notification Categories</h3>
        <div className="space-y-4">
          {notificationCategories.map((category) => {
            const Icon = category.icon;
            
            return (
              <div key={category.key} className="p-4 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Icon className="h-5 w-5 text-cyan-400" />
                  <div>
                    <span className="text-white font-medium">{category.name}</span>
                    <p className="text-slate-400 text-sm">{category.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-8">
                  {notificationMethods.filter(m => m.available).map((method) => (
                    <label key={method.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.[method.key]?.[category.key] || false}
                        onChange={(e) => handleCategoryToggle(method.key, category.key, e.target.checked)}
                        disabled={!preferences?.[method.key]?.enabled}
                        className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                      />
                      <span className={`text-sm ${
                        preferences?.[method.key]?.enabled ? 'text-white' : 'text-slate-500'
                      }`}>
                        {method.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Frequency Settings */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Notification Frequency</h3>
        <div className="space-y-3">
          {[
            { key: 'immediate', name: 'Immediate', description: 'Send notifications as soon as alerts trigger' },
            { key: 'daily', name: 'Daily Digest', description: 'Send a daily summary of all triggered alerts' },
            { key: 'weekly', name: 'Weekly Summary', description: 'Send a weekly summary of market activity' }
          ].map((freq) => (
            <label key={freq.key} className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-700/30 rounded-lg">
              <input
                type="radio"
                name="frequency"
                checked={preferences?.frequency?.[freq.key] || false}
                onChange={(e) => handleFrequencyChange(freq.key, e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-white font-medium">{freq.name}</span>
                <p className="text-slate-400 text-sm">{freq.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-cyan-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Quiet Hours</h3>
              <p className="text-slate-400 text-sm">Pause non-urgent notifications during specific hours</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences?.quietHours?.enabled || false}
              onChange={(e) => handleQuietHoursToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        {preferences?.quietHours?.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-slate-300 text-sm mb-2">Start Time</label>
              <input
                type="time"
                value={preferences?.quietHours?.start || '22:00'}
                onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2">End Time</label>
              <input
                type="time"
                value={preferences?.quietHours?.end || '08:00'}
                onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={updatePreferences}
          disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-5 w-5" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;