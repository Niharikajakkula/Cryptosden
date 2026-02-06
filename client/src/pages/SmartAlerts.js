import React, { useState, useEffect } from 'react';
import { Bell, Plus, TrendingUp, AlertTriangle, Activity, Volume2, BarChart3, Power } from 'lucide-react';
import CreateAlertModal from '../components/CreateAlertModal';
import AlertCard from '../components/AlertCard';

const SmartAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAlerts();
    fetchStats();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/alerts/stats', {
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

  const handleCreateAlert = async (alertData) => {
    try {
      console.log('Sending alert data:', alertData); // Debug log
      console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Missing'); // Debug log
      
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(alertData)
      });

      console.log('Response status:', response.status); // Debug log
      console.log('Response headers:', response.headers); // Debug log
      
      const responseData = await response.json();
      console.log('Response data:', responseData); // Debug log

      if (response.ok) {
        fetchAlerts();
        fetchStats();
        setShowCreateModal(false);
      } else {
        console.error('Failed to create alert:', responseData);
        alert(`Failed to create alert: ${responseData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('Failed to create alert. Please check your connection and try again.');
    }
  };

  const handleToggleAlert = async (alertId) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchAlerts();
        fetchStats();
      }
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) return;

    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchAlerts();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const handleTestAlert = async (alertId) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        alert('Test alert sent successfully!');
      }
    } catch (error) {
      console.error('Error testing alert:', error);
    }
  };

  const getFilteredAlerts = () => {
    if (filter === 'all') return alerts;
    if (filter === 'active') return alerts.filter(alert => alert.isActive);
    if (filter === 'triggered') return alerts.filter(alert => alert.isTriggered);
    return alerts.filter(alert => alert.type === filter);
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'price': return <TrendingUp className="h-5 w-5" />;
      case 'sentiment': return <Activity className="h-5 w-5" />;
      case 'risk': return <AlertTriangle className="h-5 w-5" />;
      case 'volume': return <Volume2 className="h-5 w-5" />;
      case 'technical': return <BarChart3 className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getAlertTypeColor = (type) => {
    switch (type) {
      case 'price': return 'text-green-400';
      case 'sentiment': return 'text-blue-400';
      case 'risk': return 'text-red-400';
      case 'volume': return 'text-purple-400';
      case 'technical': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-cyan-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Smart Alerts</h1>
                <p className="text-slate-300">Monitor price movements, sentiment changes, and risk levels</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              Create Alert
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-300 text-sm font-medium">Total Alerts</h3>
              <Bell className="h-5 w-5 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.total || 0}</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-300 text-sm font-medium">Active Alerts</h3>
              <Power className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.active || 0}</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-300 text-sm font-medium">Triggered</h3>
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.triggered || 0}</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-300 text-sm font-medium">Success Rate</h3>
              <BarChart3 className="h-5 w-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.total ? Math.round((stats.triggered / stats.total) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'active', 'triggered', 'price', 'sentiment', 'risk', 'volume', 'technical'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterType
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading alerts...</p>
          </div>
        ) : getFilteredAlerts().length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Alerts Found</h3>
            <p className="text-slate-400 mb-6">
              {filter === 'all' 
                ? "You haven't created any alerts yet. Create your first alert to get started!"
                : `No ${filter} alerts found. Try adjusting your filter.`
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                Create Your First Alert
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {getFilteredAlerts().map((alert) => (
              <AlertCard
                key={alert._id}
                alert={alert}
                onToggle={() => handleToggleAlert(alert._id)}
                onDelete={() => handleDeleteAlert(alert._id)}
                onTest={() => handleTestAlert(alert._id)}
                getAlertIcon={getAlertIcon}
                getAlertTypeColor={getAlertTypeColor}
              />
            ))}
          </div>
        )}

        {/* Create Alert Modal */}
        {showCreateModal && (
          <CreateAlertModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateAlert}
          />
        )}
      </div>
    </div>
  );
};

export default SmartAlerts;