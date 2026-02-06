import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileCheck, Upload, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const KYCVerification = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);
  const [documents, setDocuments] = useState({
    idDocument: null,
    proofOfAddress: null,
    selfie: null
  });

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const response = await axios.get('/api/auth/kyc/status');
      setKycStatus(response.data);
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    }
  };

  const handleFileUpload = (documentType, file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload only JPEG, PNG, or PDF files');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setDocuments(prev => ({
        ...prev,
        [documentType]: {
          file,
          preview: e.target.result,
          name: file.name
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitKYC = async () => {
    if (!documents.idDocument || !documents.proofOfAddress || !documents.selfie) {
      alert('Please upload all required documents');
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, you would upload files to a secure storage service
      // For now, we'll send the base64 data (not recommended for production)
      await axios.post('/api/auth/kyc/submit', {
        idDocument: documents.idDocument.preview,
        proofOfAddress: documents.proofOfAddress.preview,
        selfie: documents.selfie.preview
      });

      await refreshUser();
      await fetchKYCStatus();
      alert('KYC documents submitted successfully! Review typically takes 1-3 business days.');
    } catch (error) {
      console.error('Error submitting KYC:', error);
      alert(error.response?.data?.message || 'Failed to submit KYC documents');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-6 w-6 text-green-400" />;
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-400" />;
      case 'rejected':
        return <XCircle className="h-6 w-6 text-red-400" />;
      default:
        return <FileCheck className="h-6 w-6 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'rejected':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const canUpgradeToTrader = user?.kycStatus === 'approved' && user?.isVerified;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-white mb-6">KYC Verification</h3>

        {/* Current Status */}
        <div className={`border rounded-lg p-6 mb-8 ${getStatusColor(user?.kycStatus)}`}>
          <div className="flex items-center space-x-4">
            {getStatusIcon(user?.kycStatus)}
            <div>
              <h4 className="font-semibold text-lg">
                KYC Status: {user?.kycStatus?.replace('_', ' ').toUpperCase() || 'NOT SUBMITTED'}
              </h4>
              <p className="text-sm opacity-80">
                {user?.kycStatus === 'approved' && 'Your identity has been verified successfully'}
                {user?.kycStatus === 'pending' && 'Your documents are under review'}
                {user?.kycStatus === 'rejected' && 'Your documents were rejected. Please resubmit with correct information'}
                {user?.kycStatus === 'not_submitted' && 'Complete KYC verification to unlock trading features'}
              </p>
              {kycStatus?.submittedAt && (
                <p className="text-xs opacity-60 mt-1">
                  Submitted: {new Date(kycStatus.submittedAt).toLocaleDateString()}
                </p>
              )}
              {kycStatus?.reviewedAt && (
                <p className="text-xs opacity-60">
                  Reviewed: {new Date(kycStatus.reviewedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          
          {kycStatus?.reviewNotes && (
            <div className="mt-4 p-3 bg-black/20 rounded-lg">
              <p className="text-sm font-medium">Review Notes:</p>
              <p className="text-sm opacity-80">{kycStatus.reviewNotes}</p>
            </div>
          )}
        </div>

        {/* Role Upgrade */}
        {canUpgradeToTrader && user?.role === 'user' && (
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-cyan-400 font-semibold">Upgrade to Trader</h4>
                <p className="text-slate-300 text-sm">
                  Your KYC is approved! You can now upgrade to a trader account to access advanced features.
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    await axios.post('/api/auth/upgrade-role');
                    await refreshUser();
                    alert('Successfully upgraded to trader account!');
                  } catch (error) {
                    alert('Failed to upgrade account');
                  }
                }}
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-cyan-700 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Document Upload (only if not approved) */}
        {user?.kycStatus !== 'approved' && (
          <div className="space-y-6">
            <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-6">
              <h4 className="text-white font-medium mb-4">Required Documents</h4>
              <p className="text-slate-300 text-sm mb-6">
                Please upload clear, high-quality images or PDFs of the following documents. 
                All information must be clearly visible and match your account details.
              </p>

              {/* ID Document */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Government-issued ID (Passport, Driver's License, or National ID)
                </label>
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                  {documents.idDocument ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-8 w-8 text-green-400 mx-auto" />
                      <p className="text-green-400 font-medium">{documents.idDocument.name}</p>
                      <button
                        onClick={() => setDocuments(prev => ({ ...prev, idDocument: null }))}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-400 mb-2">Click to upload or drag and drop</p>
                      <p className="text-xs text-slate-500">JPEG, PNG, or PDF (max 5MB)</p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload('idDocument', e.target.files[0])}
                        className="hidden"
                        id="id-document"
                      />
                      <label
                        htmlFor="id-document"
                        className="mt-2 inline-block bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
                      >
                        Choose File
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Proof of Address */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Proof of Address (Utility Bill, Bank Statement, or Government Letter)
                </label>
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                  {documents.proofOfAddress ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-8 w-8 text-green-400 mx-auto" />
                      <p className="text-green-400 font-medium">{documents.proofOfAddress.name}</p>
                      <button
                        onClick={() => setDocuments(prev => ({ ...prev, proofOfAddress: null }))}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-400 mb-2">Click to upload or drag and drop</p>
                      <p className="text-xs text-slate-500">JPEG, PNG, or PDF (max 5MB)</p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload('proofOfAddress', e.target.files[0])}
                        className="hidden"
                        id="proof-address"
                      />
                      <label
                        htmlFor="proof-address"
                        className="mt-2 inline-block bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
                      >
                        Choose File
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Selfie */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Selfie with ID Document
                </label>
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                  {documents.selfie ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-8 w-8 text-green-400 mx-auto" />
                      <p className="text-green-400 font-medium">{documents.selfie.name}</p>
                      <button
                        onClick={() => setDocuments(prev => ({ ...prev, selfie: null }))}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-400 mb-2">Take a selfie holding your ID document</p>
                      <p className="text-xs text-slate-500">JPEG or PNG (max 5MB)</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload('selfie', e.target.files[0])}
                        className="hidden"
                        id="selfie"
                      />
                      <label
                        htmlFor="selfie"
                        className="mt-2 inline-block bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
                      >
                        Choose File
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSubmitKYC}
                  disabled={loading || !documents.idDocument || !documents.proofOfAddress || !documents.selfie}
                  className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit KYC Documents'}
                </button>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
              <h4 className="text-yellow-400 font-medium mb-3 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Important Notes
              </h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• All documents must be clear, legible, and in color</li>
                <li>• Personal information must match your account details exactly</li>
                <li>• Documents must be current and not expired</li>
                <li>• Processing typically takes 1-3 business days</li>
                <li>• You will be notified via email once review is complete</li>
                <li>• Rejected documents can be resubmitted with corrections</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KYCVerification;