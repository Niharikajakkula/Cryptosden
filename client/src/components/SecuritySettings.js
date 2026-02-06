import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const SecuritySettings = () => {
  const { user } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handlePasswordUpdate = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordStrength < 3) {
      alert('Password is too weak. Please choose a stronger password.');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordStrength(0);
      alert('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      alert(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (strength) => {
    if (strength <= 1) return 'bg-red-500';
    if (strength <= 2) return 'bg-yellow-500';
    if (strength <= 3) return 'bg-blue-500';
    if (strength <= 4) return 'bg-green-500';
    return 'bg-green-600';
  };

  const getStrengthText = (strength) => {
    if (strength <= 1) return 'Very Weak';
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Fair';
    if (strength <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-white mb-6">Security Settings</h3>

        {/* Account Security Status */}
        <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-6 mb-8">
          <h4 className="text-white font-medium mb-4 flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Account Security Status
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Email Verification</span>
              <div className="flex items-center">
                {user?.isVerified ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-green-400">Verified</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                    <span className="text-yellow-400">Unverified</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">Two-Factor Authentication</span>
              <div className="flex items-center">
                {user?.twoFactorEnabled ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-green-400">Enabled</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                    <span className="text-yellow-400">Disabled</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">KYC Verification</span>
              <div className="flex items-center">
                {user?.kycStatus === 'approved' ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-green-400">Approved</span>
                  </>
                ) : user?.kycStatus === 'pending' ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                    <span className="text-yellow-400">Pending</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                    <span className="text-red-400">Not Submitted</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">Change Password</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 pr-10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 pr-10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {passwordForm.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Password Strength</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength <= 2 ? 'text-red-400' : 
                      passwordStrength <= 3 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {getStrengthText(passwordStrength)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Password should contain: uppercase, lowercase, numbers, and special characters
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 pr-10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {passwordForm.confirmPassword && (
                <div className="mt-1">
                  {passwordForm.newPassword === passwordForm.confirmPassword ? (
                    <span className="text-xs text-green-400 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Passwords match
                    </span>
                  ) : (
                    <span className="text-xs text-red-400 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Passwords do not match
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handlePasswordUpdate}
                disabled={loading || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>

        {/* Security Recommendations */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mt-6">
          <h4 className="text-blue-400 font-medium mb-3 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Security Recommendations
          </h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Enable Two-Factor Authentication for enhanced security</li>
            <li>• Use a strong, unique password that you don't use elsewhere</li>
            <li>• Complete KYC verification to unlock trading features</li>
            <li>• Regularly review your account activity and login history</li>
            <li>• Never share your login credentials with anyone</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;