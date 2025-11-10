import { AlertCircle, Banknote, CheckCircle, Clock, FilePlus2, FileText, Loader2, Shield, Upload, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import api, { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import LoginPrompt from '../UI/LoginPrompt';

const KycDetailForm = () => {
  const { user, token } = useAuthStore();
  const [form, setForm] = useState({
    name: '',
    accountNo: '',
    confirmAccountNo: '',
    ifsc: '',
    branch: '',
    aadhaar: null,
    pan: null,
    kycDoc: null,
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingKyc, setExistingKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isResubmitting, setIsResubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setForm((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name) errs.name = 'Name is required';
    if (!form.accountNo) errs.accountNo = 'Account number is required';
    if (!form.confirmAccountNo) errs.confirmAccountNo = 'Please confirm account number';
    if (form.accountNo && form.confirmAccountNo && form.accountNo !== form.confirmAccountNo) errs.confirmAccountNo = 'Account numbers do not match';
    if (!form.ifsc) errs.ifsc = 'IFSC code is required';
    if (!form.branch) errs.branch = 'Branch name is required';
    if (!form.aadhaar) errs.aadhaar = 'Aadhaar upload required';
    if (!form.pan) errs.pan = 'PAN upload required';
    if (!form.kycDoc) errs.kycDoc = 'KYC document upload required';
    return errs;
  };

  // Check existing KYC status on component mount
  useEffect(() => {
    if (user && token) {
      checkKycStatus();
    }
  }, [user, token]);

  const checkKycStatus = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.kyc.status);
      if (response.data.success) {
        setExistingKyc(response.data.data);
      }
    } catch (error) {
      // KYC not found, user can submit new application
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = () => {
    // Store the existing KYC data before clearing
    const existingData = existingKyc;

    // Clear the existing KYC state to show the form
    setExistingKyc(null);
    setSuccess(false);
    setIsResubmitting(true);

    // Pre-fill the form with existing data
    setForm({
      name: existingData?.name || '',
      accountNo: existingData?.accountNo || '',
      confirmAccountNo: existingData?.accountNo || '',
      ifsc: existingData?.ifsc || '',
      branch: existingData?.branch || '',
      aadhaar: null,
      pan: null,
      kycDoc: null,
    });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setSubmitted(true);
      try {
        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('accountNo', form.accountNo);
        formData.append('ifsc', form.ifsc);
        formData.append('branch', form.branch);
        formData.append('aadhaar', form.aadhaar);
        formData.append('pan', form.pan);
        formData.append('kycDoc', form.kycDoc);

        const response = await api.post(API_ENDPOINTS.kyc.submit, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
          setSuccess(true);
          setIsResubmitting(false);
          // Don't set existingKyc here, let the success message show first
        }
      } catch (error) {
        console.error('Error submitting KYC:', error);
        alert(error.response?.data?.message || 'Failed to submit KYC application');
      } finally {
        setSubmitted(false);
      }
    }
  };

  // File preview helper
  const filePreview = (file) => {
    if (!file) return null;
    if (file.type && file.type.startsWith('image/')) {
      return (
        <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
          <img src={URL.createObjectURL(file)} alt="preview" className="h-16 w-16 object-cover rounded-lg shadow-md border-2 border-white" />
          <p className="text-xs text-gray-600 mt-2 font-medium">{file.name}</p>
        </div>
      );
    }
    return (
      <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">{file.name}</span>
        </div>
      </div>
    );
  };

  if (!user) {
    return <LoginPrompt type="kyc" />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-24">
        <div className="max-w-md mx-auto bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-orange-100 p-8 flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Loading KYC status...</p>
        </div>
      </div>
    );
  }

  // Show existing KYC status
  if (existingKyc) {
    const getStatusIcon = (status) => {
      switch (status) {
        case 'approved':
          return <CheckCircle className="w-8 h-8 text-green-500" />;
        case 'rejected':
          return <AlertCircle className="w-8 h-8 text-red-500" />;
        case 'pending':
          return <Clock className="w-8 h-8 text-yellow-500" />;
        default:
          return null;
      }
    };

    const getStatusGradient = (status) => {
      switch (status) {
        case 'approved': return 'from-green-400 to-emerald-500';
        case 'rejected': return 'from-red-400 to-pink-500';
        case 'pending': return 'from-yellow-400 to-orange-500';
        default: return 'from-gray-400 to-gray-500';
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
            {/* Header */}
            <div className={`bg-gradient-to-r ${getStatusGradient(existingKyc.status)} p-6`}>
              <div className="flex items-center gap-3">
                {getStatusIcon(existingKyc.status)}
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    KYC {existingKyc.status.charAt(0).toUpperCase() + existingKyc.status.slice(1)}
                  </h2>
                  <p className="text-white/90 text-sm mt-1">Your verification status</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-600" />
                  Application Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-1">Name</p>
                    <p className="font-semibold text-gray-800">{existingKyc.name}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-1">Account Number</p>
                    <p className="font-semibold text-gray-800 font-mono">{existingKyc.accountNo}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-1">IFSC Code</p>
                    <p className="font-semibold text-gray-800 font-mono">{existingKyc.ifsc}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-1">Branch</p>
                    <p className="font-semibold text-gray-800">{existingKyc.branch}</p>
                  </div>
                </div>
                <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 font-medium mb-1">Submitted On</p>
                  <p className="font-semibold text-gray-800">{new Date(existingKyc.submittedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
              </div>

              {existingKyc.adminNotes && (
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    Admin Notes
                  </h3>
                  <p className="text-gray-700 bg-white rounded-lg p-3 text-sm">{existingKyc.adminNotes}</p>
                </div>
              )}

              {existingKyc.status === 'rejected' && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-800 mb-2">Application Rejected</h3>
                      <p className="text-red-700 text-sm mb-4">
                        Your KYC application was rejected. Please review the admin notes and submit a new application with corrected documents.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          className="px-4 py-2 bg-gradient-to-r from-[#FF4E00] to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                          onClick={handleResubmit}
                        >
                          <FilePlus2 className="w-4 h-4" />
                          Resubmit KYC
                        </button>
                        <button
                          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                          onClick={() => setExistingKyc(null)}
                        >
                          <FileText className="w-4 h-4" />
                          Start Fresh
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-24">
        <div className="max-w-md mx-auto bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-orange-100 p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg mb-4">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">KYC Submitted!</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Your KYC details have been submitted successfully. We will review and update your status soon.
          </p>
          <button
            className="px-6 py-2 bg-gradient-to-r from-[#FF4E00] to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white rounded-lg font-semibold transition-all"
            onClick={() => {
              setSuccess(false);
              checkKycStatus();
            }}
          >
            View Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#FF4E00] to-orange-500 rounded-full shadow-lg mb-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {isResubmitting ? 'KYC Resubmission' : 'KYC Verification'}
          </h1>
          <p className="text-gray-600 text-sm">
            {isResubmitting
              ? 'Please correct the issues and resubmit your KYC documents'
              : 'Complete your Know Your Customer verification to unlock all features'
            }
          </p>
          {isResubmitting && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-red-700">Resubmitting Rejected Application</span>
            </div>
          )}
        </div>

        {/* Main Form */}
        <form className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-orange-100 overflow-hidden" onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white text-lg sm:text-xl font-extrabold tracking-wide">KYC Application</h2>
                <p className="text-white/90 text-xs sm:text-sm">Fill in your details to complete verification</p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-orange-600" />
                Personal Information
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-300 transition-all bg-white"
                  placeholder="Enter your full name"
                />
                {errors.name && <div className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.name}</div>}
              </div>
            </div>

            {/* Bank Information Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-orange-600" />
                Bank Account Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    name="accountNo"
                    value={form.accountNo}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-300 transition-all bg-white font-mono"
                    placeholder="Enter account number"
                  />
                  {errors.accountNo && <div className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.accountNo}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Account Number</label>
                  <input
                    type="text"
                    name="confirmAccountNo"
                    value={form.confirmAccountNo}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-300 transition-all bg-white font-mono"
                    placeholder="Re-enter account number"
                  />
                  {errors.confirmAccountNo && <div className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.confirmAccountNo}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    name="ifsc"
                    value={form.ifsc}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-300 transition-all bg-white font-mono uppercase"
                    placeholder="Enter IFSC code"
                  />
                  {errors.ifsc && <div className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.ifsc}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    name="branch"
                    value={form.branch}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-300 transition-all bg-white"
                    placeholder="Enter branch name"
                  />
                  {errors.branch && <div className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.branch}</div>}
                </div>
              </div>
            </div>

            {/* Document Upload Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4 text-orange-600" />
                Required Documents
              </h3>
              <p className="text-xs text-gray-500 mb-4">Upload clear, readable copies of your documents</p>
              <div className="space-y-4">
                {/* Aadhaar Card */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Aadhaar Card</label>
                  <p className="text-xs text-gray-500 mb-3">Upload a clear photo or scanned copy</p>
                  <input
                    type="file"
                    name="aadhaar"
                    accept="image/*,.pdf"
                    onChange={handleChange}
                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-[#FF4E00] file:to-orange-500 file:text-white hover:file:from-orange-600 hover:file:to-orange-600 transition-all cursor-pointer"
                  />
                  {filePreview(form.aadhaar)}
                  {errors.aadhaar && <div className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12} />{errors.aadhaar}</div>}
                </div>

                {/* PAN Card */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">PAN Card</label>
                  <p className="text-xs text-gray-500 mb-3">Upload a clear photo or scanned copy</p>
                  <input
                    type="file"
                    name="pan"
                    accept="image/*,.pdf"
                    onChange={handleChange}
                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-[#FF4E00] file:to-orange-500 file:text-white hover:file:from-orange-600 hover:file:to-orange-600 transition-all cursor-pointer"
                  />
                  {filePreview(form.pan)}
                  {errors.pan && <div className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12} />{errors.pan}</div>}
                </div>

                {/* Bank Passbook */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Bank Passbook Photo</label>
                  <p className="text-xs text-gray-500 mb-3">Upload a clear photo showing account details</p>
                  <input
                    type="file"
                    name="kycDoc"
                    accept="image/*,.pdf"
                    onChange={handleChange}
                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-[#FF4E00] file:to-orange-500 file:text-white hover:file:from-orange-600 hover:file:to-orange-600 transition-all cursor-pointer"
                  />
                  {filePreview(form.kycDoc)}
                  {errors.kycDoc && <div className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12} />{errors.kycDoc}</div>}
                </div>
              </div>

              {/* Upload Guidelines */}
              <div className="mt-4 bg-orange-50 rounded-xl p-4 border border-orange-200">
                <h4 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  Upload Guidelines
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span>Documents should be clearly visible and not blurry</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span>Supported: JPG, PNG, PDF (max 5MB each)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span>All four corners should be visible</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span>Documents should not be older than 3 months</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#FF4E00] to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={submitted}
              >
                {submitted ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Submit KYC Application
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KycDetailForm; 