import { AlertCircle, ArrowLeft, CheckCircle, Clock, Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { loading, error, success, adminLogin } = useAuthStore();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [formData, setFormData] = useState({ 
    email: '', 
    otp: '' 
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear errors when user starts typing
    if (otpError) setOtpError('');
    if (otpSuccess) setOtpSuccess('');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      setOtpError('Email is required');
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    setOtpSuccess('');

         try {
       const response = await api.post(API_ENDPOINTS.auth.adminSendOtp, { 
         email: formData.email 
       });

       const data = response.data;

             setOtpSuccess(data.message);
       setOtpSent(true);
       setStep(2);
       // Start countdown timer
       setCountdown(600); // 10 minutes
       const timer = setInterval(() => {
         setCountdown((prev) => {
           if (prev <= 1) {
             clearInterval(timer);
             return 0;
           }
           return prev - 1;
         });
       }, 1000);
         } catch (error) {
       setOtpError(error.response?.data?.message || 'Network error. Please try again.');
     } finally {
       setOtpLoading(false);
     }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!formData.otp) {
      setOtpError('OTP is required');
      return;
    }

    if (formData.otp.length !== 6) {
      setOtpError('OTP must be 6 digits');
      return;
    }

    adminLogin({ email: formData.email, otp: formData.otp }, navigate);
  };

  const handleResendOtp = () => {
    if (countdown > 0) return;
    handleSendOtp(new Event('submit'));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-red-600 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Secure access for authorized personnel only
          </p>
        </div>

        {/* Back to regular login */}
        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to User Login
          </Link>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {otpError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{otpError}</p>
          </div>
        )}

        {otpSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700">{otpSuccess}</p>
          </div>
        )}

        {/* Step 1: Email Input */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="mt-8 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Enter admin email"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={otpLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {otpLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending OTP...
                  </div>
                ) : (
                  'Send OTP'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: OTP Input */}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="otp"
                  name="otp"
                  type={showOtp ? "text" : "password"}
                  autoComplete="one-time-code"
                  required
                  value={formData.otp}
                  onChange={handleChange}
                  maxLength={6}
                  className="appearance-none relative block w-full px-3 py-3 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Enter 6-digit OTP"
                />
                <button
                  type="button"
                  onClick={() => setShowOtp(!showOtp)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showOtp ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Check your email for the 6-digit OTP
              </p>
            </div>

            {/* Countdown Timer */}
            {countdown > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>OTP expires in: {formatTime(countdown)}</span>
              </div>
            )}

            <div className="space-y-4">
              <button
                type="submit"
                disabled={loading || countdown === 0}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Verifying...
                  </div>
                ) : (
                  'Login as Admin'
                )}
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {countdown > 0 ? `Resend in ${formatTime(countdown)}` : 'Resend OTP'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setFormData({ email: formData.email, otp: '' });
                  setOtpSent(false);
                  setCountdown(0);
                  setOtpError('');
                  setOtpSuccess('');
                }}
                className="w-full flex justify-center py-2 px-4 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Change Email
              </button>
            </div>
          </form>
        )}

        {/* Security Notice */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
              <p className="mt-1 text-xs text-yellow-700">
                This is a secure admin login. Your session will automatically expire after 8 hours for security purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 