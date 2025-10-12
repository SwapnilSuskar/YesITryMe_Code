import { AlertCircle, Banknote, CheckCircle, Clock, CreditCard, FileCheck2, FilePlus2, FileText, Hash, Landmark, Shield, Upload, User } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="max-w-md mx-auto bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-blue-100 p-12 flex flex-col items-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-6"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-gray-600 font-medium text-lg">Loading KYC status...</p>
          <div className="mt-4 flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Show existing KYC status
  if (existingKyc) {
    const getStatusColor = (status) => {
      switch (status) {
        case 'approved': return 'text-green-600 bg-green-50 border-green-200';
        case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
        case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        default: return 'text-gray-600 bg-gray-50 border-gray-200';
      }
    };

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 p-4 mt-12">
        <div className="max-w-2xl w-full bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-blue-100 p-8">
          {/* Header with animated gradient */}
          <div className={`relative mb-8 p-6 rounded-2xl bg-gradient-to-r ${getStatusGradient(existingKyc.status)} text-white overflow-hidden`}>
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-center">
          {getStatusIcon(existingKyc.status)}
              <h2 className="text-3xl font-bold ml-4">
            KYC {existingKyc.status.charAt(0).toUpperCase() + existingKyc.status.slice(1)}
          </h2>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-blue-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-blue-600" />
                Application Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Name</p>
                  <p className="font-semibold text-gray-800">{existingKyc.name}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Account Number</p>
                  <p className="font-semibold text-gray-800 font-mono">{existingKyc.accountNo}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">IFSC Code</p>
                  <p className="font-semibold text-gray-800 font-mono">{existingKyc.ifsc}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Branch</p>
                  <p className="font-semibold text-gray-800">{existingKyc.branch}</p>
                </div>
              </div>
              <div className="mt-4 bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 uppercase font-semibold">Submitted On</p>
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
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 shadow-lg border border-amber-100">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  Admin Notes
                </h3>
                <p className="text-gray-700 bg-white rounded-xl p-4 shadow-sm">{existingKyc.adminNotes}</p>
            </div>
          )}

          {existingKyc.status === 'rejected' && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 shadow-lg border border-red-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-red-800 mb-2">Application Rejected</h3>
                    <p className="text-red-700 mb-4">
                Your KYC application was rejected. Please review the admin notes and submit a new application with corrected documents.
              </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                        onClick={handleResubmit}
                      >
                        <FilePlus2 className="w-4 h-4" />
                        Resubmit KYC
                      </button>
              <button
                        className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-bold shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
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
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-green-100 p-12 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-ping"></div>
          </div>
          <h2 className="text-3xl font-bold text-green-700 mb-3">KYC Submitted!</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Your KYC details have been submitted successfully.<br />
            We will review and update your status soon.
          </p>
          <button
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold shadow-lg transition-all duration-200 transform hover:scale-105"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 py-8 px-4 mt-12">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full shadow-lg mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {isResubmitting ? 'KYC Resubmission' : 'KYC Verification'}
          </h1>
          <p className="text-gray-600 text-lg">
            {isResubmitting
              ? 'Please correct the issues and resubmit your KYC documents'
              : 'Complete your Know Your Customer verification to unlock all features'
            }
          </p>
          {isResubmitting && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">Resubmitting Rejected Application</span>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-blue-100 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg">1</div>
              <div>
                <p className="font-semibold text-blue-700">KYC Details</p>
                <p className="text-sm text-gray-500">Personal & Bank Information</p>
              </div>
      </div>
            <div className="flex-1 h-1 bg-gradient-to-r from-blue-200 to-blue-100 mx-4 rounded-full"></div>
            <div className="flex items-center gap-3 opacity-50">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">2</div>
        <div>
                <p className="font-semibold text-gray-500">Review</p>
                <p className="text-sm text-gray-400">Admin Verification</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <form className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-blue-100 p-8 relative overflow-hidden" onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-100 to-transparent rounded-full translate-y-12 -translate-x-12"></div>

          <div className="relative z-10 space-y-6">
            {/* Personal Information Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-6 h-6 text-blue-600" />
                Personal Information
              </h3>
              <div className="space-y-4">
        <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <User size={18} className="text-blue-600" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="Enter your full name"
                  />
                  {errors.name && <div className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} />{errors.name}</div>}
                </div>
              </div>
        </div>

            {/* Bank Information Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Banknote className="w-6 h-6 text-green-600" />
                Bank Account Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <CreditCard size={18} className="text-green-600" />
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNo"
                    value={form.accountNo}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm font-mono"
                    placeholder="Enter account number"
                  />
                  {errors.accountNo && <div className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} />{errors.accountNo}</div>}
        </div>
        <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <CreditCard size={18} className="text-green-600" />
                    Confirm Account Number
                  </label>
                  <input
                    type="text"
                    name="confirmAccountNo"
                    value={form.confirmAccountNo}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm font-mono"
                    placeholder="Re-enter account number"
                  />
                  {errors.confirmAccountNo && <div className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} />{errors.confirmAccountNo}</div>}
        </div>
        <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Hash size={18} className="text-green-600" />
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    name="ifsc"
                    value={form.ifsc}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm font-mono uppercase"
                    placeholder="Enter IFSC code"
                  />
                  {errors.ifsc && <div className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} />{errors.ifsc}</div>}
        </div>
        <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Landmark size={18} className="text-green-600" />
                    Branch Name
                  </label>
                  <input
                    type="text"
                    name="branch"
                    value={form.branch}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="Enter branch name"
                  />
                  {errors.branch && <div className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} />{errors.branch}</div>}
                </div>
              </div>
            </div>

            {/* Document Upload Section */}
            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 rounded-3xl p-8 relative overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-200/30 to-transparent rounded-full translate-y-12 -translate-x-12"></div>

              <div className="relative z-10">
                {/* Header with enhanced styling */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-lg mb-4">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Required Documents</h3>
                  <p className="text-gray-600">Upload clear, readable copies of your documents</p>
                </div>

                <div className="space-y-8">
                  {/* Aadhaar Card */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-gray-800 font-bold text-lg mb-2">
                          Aadhaar Card
                        </label>
                        <p className="text-gray-600 text-sm mb-4">Upload a clear photo or scanned copy of your Aadhaar card</p>
                        <div className="relative">
                          <input
                            type="file"
                            name="aadhaar"
                            accept="image/*,.pdf"
                            onChange={handleChange}
                            className="w-full file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-blue-600 file:text-white hover:file:from-blue-600 hover:file:to-blue-700 transition-all duration-200 cursor-pointer shadow-sm"
                          />
          {filePreview(form.aadhaar)}
                          {errors.aadhaar && <div className="text-red-500 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14} />{errors.aadhaar}</div>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PAN Card */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                          <FileCheck2 className="w-6 h-6 text-white" />
                        </div>
        </div>
                      <div className="flex-1">
                        <label className="block text-gray-800 font-bold text-lg mb-2">
                          PAN Card
                        </label>
                        <p className="text-gray-600 text-sm mb-4">Upload a clear photo or scanned copy of your PAN card</p>
                        <div className="relative">
                          <input
                            type="file"
                            name="pan"
                            accept="image/*,.pdf"
                            onChange={handleChange}
                            className="w-full file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-green-500 file:to-green-600 file:text-white hover:file:from-green-600 hover:file:to-green-700 transition-all duration-200 cursor-pointer shadow-sm"
                          />
          {filePreview(form.pan)}
                          {errors.pan && <div className="text-red-500 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14} />{errors.pan}</div>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank Passbook */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                          <FilePlus2 className="w-6 h-6 text-white" />
                        </div>
        </div>
                      <div className="flex-1">
                        <label className="block text-gray-800 font-bold text-lg mb-2">
                          Bank Passbook Photo
                        </label>
                        <p className="text-gray-600 text-sm mb-4">Upload a clear photo of your bank passbook showing account details</p>
                        <div className="relative">
                          <input
                            type="file"
                            name="kycDoc"
                            accept="image/*,.pdf"
                            onChange={handleChange}
                            className="w-full file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-500 file:to-purple-600 file:text-white hover:file:from-purple-600 hover:file:to-purple-700 transition-all duration-200 cursor-pointer shadow-sm"
                          />
            {filePreview(form.kycDoc)}
                          {errors.kycDoc && <div className="text-red-500 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14} />{errors.kycDoc}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Upload Tips */}
                <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    Upload Guidelines
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Ensure documents are clearly visible and not blurry</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Supported formats: JPG, PNG, PDF (max 5MB each)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>All four corners of documents should be visible</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Documents should not be older than 3 months</span>
                    </div>
                  </div>
                </div>
          </div>
        </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-2xl shadow-xl text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-60 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={submitted}
              >
                {submitted ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
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