import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Activity, 
  DollarSign, 
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Shield,
  Settings,
  BarChart3,
  Eye,
  Clock,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'active': return 'text-cyan-400';
      case 'idle': return 'text-yellow-400';
      case 'warning': return 'text-orange-400';
      case 'error': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getHealthIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />;
      case 'active': return <Activity className="h-5 w-5" />;
      case 'idle': return <Clock className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'error': return <AlertTriangle className="h-5 w-5" />;
      default: return <Eye className="h-5 w-5" />;
    }
  };

  if (!user) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
          <p className="text-slate-400 mb-6">Please sign in with admin credentials</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-6">You don't have permission to access the admin dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-300">
            Monitor platform performance and manage system operations
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'transactions', label: 'Transactions', icon: DollarSign },
            { id: 'community', label: 'Community', icon: MessageSquare },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        ) : dashboardData ? (
          <>
            {activeTab === 'overview' && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                      <Users className="h-8 w-8 text-blue-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {formatNumber(dashboardData.users?.total)}
                        </p>
                        <p className="text-slate-400">Total Users</p>
                        <p className="text-sm text-green-400">
                          +{dashboardData.users?.new24h || 0} today
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-8 w-8 text-green-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {formatCurrency(dashboardData.transactions?.volume30d)}
                        </p>
                        <p className="text-slate-400">30d Volume</p>
                        <p className="text-sm text-cyan-400">
                          {formatNumber(dashboardData.transactions?.new24h || 0)} today
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                      <Activity className="h-8 w-8 text-purple-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {formatNumber(dashboardData.trading?.totalOrders)}
                        </p>
                        <p className="text-slate-400">Total Orders</p>
                        <p className="text-sm text-yellow-400">
                          {dashboardData.trading?.openOrders || 0} open
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-8 w-8 text-cyan-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {formatNumber(dashboardData.community?.totalPosts)}
                        </p>
                        <p className="text-slate-400">Community Posts</p>
                        <p className="text-sm text-orange-400">
                          {dashboardData.community?.pendingModeration || 0} pending
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Health */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-6">System Health</h2>
                    
                    <div className="space-y-4">
                      {Object.entries(dashboardData.systemHealth || {}).map(([system, status]) => (
                        <div key={system} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={getHealthColor(status)}>
                              {getHealthIcon(status)}
                            </div>
                            <span className="text-white capitalize">{system}</span>
                          </div>
                          <span className={`capitalize font-medium ${getHealthColor(status)}`}>
                            {status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                        <Users className="h-5 w-5 text-blue-400" />
                        <div>
                          <p className="text-white text-sm">New user registrations</p>
                          <p className="text-slate-400 text-xs">
                            {dashboardData.users?.new24h || 0} in the last 24 hours
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                        <Activity className="h-5 w-5 text-green-400" />
                        <div>
                          <p className="text-white text-sm">Active transactions</p>
                          <p className="text-slate-400 text-xs">
                            {dashboardData.transactions?.pending || 0} pending confirmations
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-cyan-400" />
                        <div>
                          <p className="text-white text-sm">Community engagement</p>
                          <p className="text-slate-400 text-xs">
                            {dashboardData.community?.posts24h || 0} new posts today
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-purple-400" />
                        <div>
                          <p className="text-white text-sm">Trading activity</p>
                          <p className="text-slate-400 text-xs">
                            {dashboardData.trading?.orders24h || 0} orders placed today
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="flex items-center space-x-3 p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                      <Users className="h-6 w-6 text-blue-400" />
                      <div className="text-left">
                        <p className="text-white font-medium">Manage Users</p>
                        <p className="text-slate-400 text-sm">View and manage user accounts</p>
                      </div>
                    </button>

                    <button className="flex items-center space-x-3 p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                      <MessageSquare className="h-6 w-6 text-cyan-400" />
                      <div className="text-left">
                        <p className="text-white font-medium">Content Moderation</p>
                        <p className="text-slate-400 text-sm">Review flagged content</p>
                      </div>
                    </button>

                    <button className="flex items-center space-x-3 p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                      <Settings className="h-6 w-6 text-purple-400" />
                      <div className="text-left">
                        <p className="text-white font-medium">Platform Settings</p>
                        <p className="text-slate-400 text-sm">Configure system parameters</p>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab !== 'overview' && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="text-center py-12">
                  <Settings className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management
                  </h3>
                  <p className="text-slate-400">
                    This section is under development. Advanced {activeTab} management features will be available soon.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Dashboard</h2>
            <p className="text-slate-400 mb-6">There was an error loading the admin dashboard data</p>
            <button
              onClick={fetchDashboardData}
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;