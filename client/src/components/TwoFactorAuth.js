import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Smartphone, Shield, Key, Copy, Eye, EyeOff, CheckCircle, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import axios from 'axios';

const TwoFactorAuth = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('overview'); // overview, setup, verify, manage
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  useEffect(() => {
    if (user?.twoFactorEnabled) {
      setStep('manage');
    } else {
      setStep('overview');
    }
  }, [user]);

  const handleSetup2FA = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post('/api/auth/2fa/setup');
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setStep('setup');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!verificationCode || verificationCode.length !== 6) {
        setError('Please enter a valid 6-digit code');
        return;
      }

      const response = await axios.post('/api/auth/2fa/verify', {
        code: verificationCode
      });

      setBackupCodes(response.data.backupCodes);
      setSuccess('2FA enabled successfully! Please save your backup codes.');
      setStep('backup-codes');
      await refreshUser();
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!disablePassword || !disableCode) {
        setError('Please enter both password and 2FA code');
        return;
      }

      await axios.post('/api/auth/2fa/disable', {
        password: disablePassword,
        code: disableCode
      });

      setSuccess('2FA disabled successfully');
      setStep('overview');
      setDisablePassword('');
      setDisableCode('');
      await refreshUser();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNewBackupCodes = async () => {
    try {
      setLoading(true);
      setError('');
      
      const password = prompt('Please enter your password to generate new backup codes:');
      if (!password) return;

      const response = await axios.post('/api/auth/2fa/backup-codes', {
        password
      });

      setBackupCodes(response.data.backupCodes);
      setShowBackupCodes(true);
      setSuccess('New backup codes generated successfully');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to generate backup codes');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const downloadBackupCodes = () => {
    const content = `Cryptosden 2FA Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nKeep these codes safe! Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cryptosden-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderOverview = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <Shield className="h-8 w-8 text-white" />
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-4">Two-Factor Authentication</h2>
      <p className="text-slate-300 mb-8 max-w-md mx-auto">
        Add an extra layer of security to your account by enabling two-factor authentication. 
        You'll need to enter a code from your authenticator app each time you sign in.
      </p>

      <div className="bg-slate-700/30 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <Smartphone className="h-6 w-6 text-cyan-400" />
          <span className="text-white font-medium">Authenticator App Required</span>
        </div>
        <p className="text-slate-400 text-sm">
          You'll need an authenticator app like Google Authenticator, Authy, or 1Password
        </p>
      </div>

      <button
        onClick={handleSetup2FA}
        disabled={loading}
        className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-8 py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Setting up...' : 'Enable 2FA'}
      </button>
    </div>
  );

  const renderSetup = () => (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Setup Two-Factor Authentication</h2>
        <p className="text-slate-300">Scan the QR code with your authenticator app</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Code */}
        <div className="text-center">
          <div className="bg-white p-4 rounded-lg inline-block mb-4">
            {qrCode && <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />}
          </div>
          <p className="text-slate-400 text-sm">Scan with your authenticator app</p>
        </div>

        {/* Manual Setup */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Manual Setup</h3>
          <p className="text-slate-300 text-sm mb-4">
            If you can't scan the QR code, enter this secret key manually:
          </p>
          
          <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <code className="text-cyan-400 font-mono text-sm break-all">
                {showSecret ? secret : '••••••••••••••••••••••••••••••••'}
              </code>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => copyToClipboard(secret)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Enter verification code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none text-center text-lg font-mono"
              maxLength={6}
            />
            <p className="text-slate-400 text-xs mt-2">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={() => setStep('overview')}
          className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleVerify2FA}
          disabled={loading || verificationCode.length !== 6}
          className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-8 py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify & Enable'}
        </button>
      </div>
    </div>
  );

  const renderBackupCodes = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-8 w-8 text-white" />
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-4">2FA Enabled Successfully!</h2>
      <p className="text-slate-300 mb-8">
        Save these backup codes in a secure location. Each code can only be used once.
      </p>

      <div className="bg-slate-700/30 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          {backupCodes.map((code, index) => (
            <div key={index} className="bg-slate-800/50 rounded-lg p-3">
              <code className="text-cyan-400 font-mono text-sm">{code}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={() => copyToClipboard(backupCodes.join('\n'))}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
        >
          <Copy className="h-4 w-4" />
          <span>Copy Codes</span>
        </button>
        <button
          onClick={downloadBackupCodes}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Download</span>
        </button>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          <span className="text-yellow-400 font-medium">Important</span>
        </div>
        <p className="text-yellow-200 text-sm">
          Store these codes safely! If you lose access to your authenticator app, 
          these codes are the only way to regain access to your account.
        </p>
      </div>

      <button
        onClick={() => setStep('manage')}
        className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-8 py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all"
      >
        Continue
      </button>
    </div>
  );

  const renderManage = () => (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">2FA is Enabled</h2>
        <p className="text-slate-300">Your account is protected with two-factor authentication</p>
      </div>

      <div className="space-y-6">
        {/* Status */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-green-400 font-medium">Two-Factor Authentication Active</span>
          </div>
        </div>

        {/* Backup Codes */}
        <div className="bg-slate-700/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Backup Codes</h3>
              <p className="text-slate-400 text-sm">Generate new backup codes if needed</p>
            </div>
            <button
              onClick={handleGenerateNewBackupCodes}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Generate New</span>
            </button>
          </div>
          
          {showBackupCodes && backupCodes.length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 mb-4">
                {backupCodes.map((code, index) => (
                  <code key={index} className="text-cyan-400 font-mono text-sm bg-slate-900/50 p-2 rounded">
                    {code}
                  </code>
                ))}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                  className="flex items-center space-x-1 px-3 py-1 bg-slate-600 text-white rounded text-sm hover:bg-slate-500"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={downloadBackupCodes}
                  className="flex items-center space-x-1 px-3 py-1 bg-slate-600 text-white rounded text-sm hover:bg-slate-500"
                >
                  <Download className="h-3 w-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Disable 2FA */}
        <div className="bg-slate-700/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Disable Two-Factor Authentication</h3>
          <p className="text-slate-400 text-sm mb-4">
            This will remove the extra security layer from your account. You'll need to enter your password and a 2FA code.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                placeholder="Enter your password"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                2FA Code
              </label>
              <input
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                placeholder="000000"
                maxLength={6}
              />
            </div>
            
            <button
              onClick={handleDisable2FA}
              disabled={loading || !disablePassword || disableCode.length !== 6}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-green-400">{success}</span>
          </div>
        </div>
      )}

      {/* Content based on step */}
      {step === 'overview' && renderOverview()}
      {step === 'setup' && renderSetup()}
      {step === 'backup-codes' && renderBackupCodes()}
      {step === 'manage' && renderManage()}
    </div>
  );
};

export default TwoFactorAuth;