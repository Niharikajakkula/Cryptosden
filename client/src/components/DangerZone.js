import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  Trash2, 
  Shield, 
  Download, 
  Clock,
  X
} from 'lucide-react';
import axios from 'axios';

const DangerZone = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteForm, setDeleteForm] = useState({
    password: '',
    confirmationText: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      setError('');

      if (deleteForm.confirmationText !== 'DELETE MY ACCOUNT') {
        setError('Please type "DELETE MY ACCOUNT" to confirm');
        return;
      }

      // Check if user has password-based account or OAuth account
      const hasPassword = !user.googleId && !user.facebookId;
      
      if (hasPassword && !deleteForm.password) {
        setError('Please enter your password');
        return;
      }

      // Get token from localStorage for verification
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }

      const response = await axios.delete('/api/auth/delete-account', {
        data: {
          password: hasPassword ? deleteForm.password : undefined,
          confirmationText: deleteForm.confirmationText,
          reason: deleteForm.reason
        }
      });

      alert(`Account deletion initiated. ${response.data.message}`);
      logout();
      navigate('/');
    } catch (error) {
      console.error('Delete account error:', error);
      setError(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const exportUserData = async () => {
    try {
      // In a real implementation, this would call an API to export user data
      const userData = {
        profile: {
          name: user.name,
          email: user.email,
          role: user.role,
          joinDate: user.createdAt,
          lastLogin: user.lastLogin
        },
        preferences: user.preferences,
        watchlist: user.watchlist,
        // Add other user data as needed
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `cryptosden-data-${user.name}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export data');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <AlertTriangle className="h-6 w-6 text-red-400" />
        <h3 className="text-xl font-semibold text-white">Danger Zone</h3>
      </div>

      {/* Data Export */}
      <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Download className="h-5 w-5 text-blue-400" />
              <h4 className="text-lg font-medium text-white">Export Your Data</h4>
            </div>
            <p className="text-slate-300 text-sm mb-4">
              Download a copy of your account data including profile information, preferences, and activity history.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-blue-300 text-sm">
                <strong>GDPR Compliance:</strong> You have the right to receive a copy of your personal data in a structured, commonly used format.
              </p>
            </div>
          </div>
          <button
            onClick={exportUserData}
            className="ml-6 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Account Deletion */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              <h4 className="text-lg font-medium text-white">Delete Account</h4>
            </div>
            <p className="text-slate-300 text-sm mb-4">
              Permanently delete your Cryptosden account and all associated data. This action cannot be undone.
            </p>
            
            <div className="space-y-3">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <h5 className="text-red-300 font-medium text-sm mb-2">⚠️ What will be deleted:</h5>
                <ul className="text-red-200 text-sm space-y-1">
                  <li>• Your profile and account information</li>
                  <li>• Trading history and portfolio data</li>
                  <li>• Community posts and comments</li>
                  <li>• Watchlist and preferences</li>
                  <li>• All associated wallet data</li>
                </ul>
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <h5 className="text-yellow-300 font-medium text-sm">Grace Period</h5>
                </div>
                <p className="text-yellow-200 text-sm">
                  Your account will be marked for deletion with a 30-day grace period. You can restore it within this time.
                </p>
              </div>
            </div>
          </div>
          
          <div className="ml-6">
            <button
              type="button"
              onClick={() => {
                console.log('Delete button clicked');
                setShowDeleteModal(true);
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <h3 className="text-xl font-semibold text-white">Confirm Account Deletion</h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Password field - only show for non-OAuth users */}
              {!user.googleId && !user.facebookId && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Current Password *
                  </label>
                  <input
                    type="password"
                    value={deleteForm.password}
                    onChange={(e) => setDeleteForm({ ...deleteForm, password: e.target.value })}
                    className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                    placeholder="Enter your password"
                  />
                </div>
              )}

              {/* OAuth user notice */}
              {(user.googleId || user.facebookId) && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-blue-300 text-sm">
                    <strong>OAuth Account:</strong> Password verification is not required for {user.googleId ? 'Google' : 'Facebook'} accounts.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Type "DELETE MY ACCOUNT" to confirm *
                </label>
                <input
                  type="text"
                  value={deleteForm.confirmationText}
                  onChange={(e) => setDeleteForm({ ...deleteForm, confirmationText: e.target.value })}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                  placeholder="DELETE MY ACCOUNT"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reason for leaving (optional)
                </label>
                <textarea
                  value={deleteForm.reason}
                  onChange={(e) => setDeleteForm({ ...deleteForm, reason: e.target.value })}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none resize-none"
                  rows={3}
                  placeholder="Help us improve by sharing why you're leaving..."
                />
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-red-400" />
                  <span className="text-red-300 font-medium text-sm">Final Warning</span>
                </div>
                <p className="text-red-200 text-sm">
                  This action will permanently delete your account after the 30-day grace period. 
                  Make sure to export your data first if needed.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading || deleteForm.confirmationText !== 'DELETE MY ACCOUNT' || (!user.googleId && !user.facebookId && !deleteForm.password)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DangerZone;