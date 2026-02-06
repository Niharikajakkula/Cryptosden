import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCw, Mail, Lock, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';

const RestoreAccount = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/auth/restore-account', formData);
      
      setSuccess(response.data.message);
      
      // Auto-login after successful restoration
      setTimeout(async () => {
        const loginResult = await login(formData.email, formData.password);
        if (loginResult.success) {
          navigate('/profile');
        }
      }, 2000);
      
    } catch (error) {
      if (error.response?.status === 404) {
        setError('No deleted account found with this email address');
      } else if (error.response?.status === 410) {
        setError('Account restoration period has expired. The account has been permanently deleted.');
      } else {
        setError(error.response?.data?.message || 'Failed to restore account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Restore Your Account</h1>
          <p className="text-slate-300">
            Restore your deleted Cryptosden account within the grace period
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-5 w-5 text-blue-400" />
            <span className="text-blue-300 font-medium">Grace Period Information</span>
          </div>
          <p className="text-blue-200 text-sm">
            Deleted accounts can be restored within 30 days of deletion. After this period, 
            accounts are permanently removed and cannot be recovered.
          </p>
        </div>

        {/* Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-green-400 text-sm">{success}</span>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="h-5 w-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-slate-700 text-white pl-12 pr-4 py-3 rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none transition-colors"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="h-5 w-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-slate-700 text-white pl-12 pr-4 py-3 rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none transition-colors"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Restore Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Restoring Account...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5" />
                  <span>Restore Account</span>
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <Link
              to="/login"
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Back to Login
            </Link>
            <div className="text-slate-500 text-sm">
              Need help? <Link to="/support" className="text-cyan-400 hover:text-cyan-300">Contact Support</Link>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <span className="text-yellow-300 font-medium text-sm">Important Notice</span>
          </div>
          <p className="text-yellow-200 text-sm">
            If your account restoration period has expired, your data has been permanently deleted 
            and cannot be recovered. You'll need to create a new account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RestoreAccount;