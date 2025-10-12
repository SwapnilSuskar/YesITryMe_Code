import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../../assets/Logo.png';
import { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useReferral } from './ReferralHandler';

const Signup = () => {
  const [formData, setFormData] = useState({
    sponsorId: '',
    sponsorName: '',
    firstName: '',
    lastName: '',
    mobile: '',
    address: '',
    state: '',
    city: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });
  const [errors, setErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(''); // Store the generated OTP
  const [showCredentials, setShowCredentials] = useState(false); // Show credentials after signup
  const [userCredentials, setUserCredentials] = useState(null); // Store user credentials
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const signupSuccess = location.state?.signupSuccess;

  // Zustand state/actions
  const { loading, error, success, signup } = useAuthStore();

  // Referral context
  const { referralCode, sponsorInfo, isLoading: referralLoading, error: referralError } = useReferral();

  // Track if sponsor info is missing
  const sponsorMissing = !formData.sponsorId || !formData.sponsorName;

  // Auto-populate sponsor info when available from referral context
  useEffect(() => {
    if (sponsorInfo) {
      setFormData(prev => ({
        ...prev,
        sponsorId: sponsorInfo.sponsorId,
        sponsorName: sponsorInfo.sponsorName
      }));
    }
  }, [sponsorInfo]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
    if (e.target.name === 'otp') setOtpError('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.sponsorId.trim()) newErrors.sponsorId = 'Sponsor ID is required';
    if (!formData.sponsorName.trim()) newErrors.sponsorName = 'Sponsor name is required';
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required';
    else if (!/^\d{10}$/.test(formData.mobile)) newErrors.mobile = 'Mobile must be 10 digits';
    if (!otpSent) newErrors.otp = 'Please request and enter the OTP';
    if (!formData.otp.trim()) newErrors.otp = 'OTP is required';
    if (!otpVerified) newErrors.otp = 'Please verify your OTP before creating account';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.confirmPassword.trim()) newErrors.confirmPassword = 'Confirm password is required';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!document.getElementById('agree-terms').checked) newErrors.terms = 'You must agree to the terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGetOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');
    setOtpVerified(false);
    if (!formData.mobile.trim() || !/^\d{10}$/.test(formData.mobile)) {
      setErrors({ ...errors, mobile: 'Enter a valid 10-digit mobile number to get OTP' });
      return;
    }
    setOtpLoading(true);
    try {
      // First check if mobile number already exists
      const checkRes = await fetch(`${API_ENDPOINTS.auth.checkMobile}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: formData.mobile })
      });
      const checkData = await checkRes.json();

      if (checkRes.ok && checkData.exists) {
        setOtpError('');
        setOtpSuccess('');
        setOtpLoading(false);
        // Clear the mobile field to encourage user to enter a different number
        setFormData(prev => ({ ...prev, mobile: '' }));
        setErrors(prev => ({ ...prev, mobile: 'Mobile number already exists' }));
        return;
      }

      // If mobile doesn't exist, proceed to send OTP
      const res = await fetch(`${API_ENDPOINTS.auth.sendOtp}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: formData.mobile })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setGeneratedOtp(data.otp); // Store the generated OTP
        setOtpSuccess(`OTP generated successfully! Your OTP is: ${data.otp}. Please enter it below.`);
        setOtpError('');
      } else {
        setOtpError(data.message || 'Failed to send OTP');
        setOtpSuccess('');
      }
    } catch (err) {
      setOtpError('Network error. Please try again.');
      setOtpSuccess('');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');
    if (!formData.otp.trim() || formData.otp.length !== 6) {
      setErrors({ ...errors, otp: 'Please enter a valid 6-digit OTP' });
      return;
    }
    setOtpVerifying(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.auth.verifyOtp}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: formData.mobile,
          otp: formData.otp
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpVerified(true);
        setOtpSuccess('OTP verified successfully! You can now create your account.');
        setOtpError('');
      } else {
        setOtpError(data.message || 'Invalid OTP. Please try again.');
        setOtpSuccess('');
      }
    } catch (err) {
      setOtpError('Network error. Please try again.');
      setOtpSuccess('');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Remove confirmPassword from the data sent to backend
    const { confirmPassword, ...signupData } = formData;

    const result = await signup(
      {
        ...signupData,
        agreeToTerms: document.getElementById('agree-terms').checked,
      },
      navigate
    );

    if (result && result.success) {
      setUserCredentials(result.credentials);
      setShowCredentials(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 mt-10">
      <div className="max-w-md w-full space-y-8">
        <div className='flex flex-col items-center justify-center'>
          <span className="text-white font-bold text-lg">
            <img src={Logo} alt="Logo" className="w-32 h-32 object-contain" />
          </span>
          <h2 className="text-center text-3xl font-bold text-black">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-[#FF4E00] hover:text-[#E64500]">
              sign in to your existing account
            </Link>
          </p>
        </div>
        {error && (
          <div className="text-red-600 text-center font-medium">{error}</div>
        )}
        {signupSuccess && (
          <div className="text-green-600 text-center font-medium my-4">
            {signupSuccess}
          </div>
        )}
        {loading && (
          <div className="text-orange-500 text-center font-medium">Signing up...</div>
        )}

        {/* Sponsor Information Status */}
        {referralLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <p className="text-sm text-blue-800">Loading sponsor information...</p>
            </div>
          </div>
        )}

        {referralError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{referralError}</p>
          </div>
        )}

        {sponsorInfo && !referralLoading && !referralError && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs text-green-600 mt-1">
                  You're being referred by {sponsorInfo.sponsorName} ({sponsorInfo.sponsorId})
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Show error if sponsor info is missing */}
        {sponsorMissing && !referralLoading && !referralError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-sm text-red-600 font-semibold">
              You can't create an account because you do not have a Sponsor ID and Sponsor Name.<br />
              Please use a valid referral link or contact your sponsor.
            </p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="sponsorId" className="block text-sm font-medium text-gray-700">
                Sponsor ID
              </label>
              <input
                id="sponsorId"
                name="sponsorId"
                type="text"
                required
                readOnly={!!formData.sponsorId}
                disabled={sponsorMissing}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#FF4E00] focus:border-[#FF4E00] sm:text-sm ${sponsorMissing ? 'cursor-not-allowed' : ''} hover:cursor-not-allowed ${errors.sponsorId ? 'border-red-500' : formData.sponsorId ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                placeholder="Sponsor ID"
                value={formData.sponsorId}
                onChange={handleChange}
              />
              {errors.sponsorId && (
                <p className="mt-1 text-sm text-red-600">{errors.sponsorId}</p>
              )}
            </div>
            <div>
              <label htmlFor="sponsorName" className="block text-sm font-medium text-gray-700">
                Sponsor Name
              </label>
              <input
                id="sponsorName"
                name="sponsorName"
                type="text"
                required
                readOnly={!!formData.sponsorName}
                disabled={sponsorMissing}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#FF4E00] focus:border-[#FF4E00] sm:text-sm ${sponsorMissing ? 'cursor-not-allowed' : ''} hover:cursor-not-allowed ${errors.sponsorName ? 'border-red-500' : formData.sponsorName ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                placeholder="Sponsor Name"
                value={formData.sponsorName}
                onChange={handleChange}
              />
              {errors.sponsorName && (
                <p className="mt-1 text-sm text-red-600">{errors.sponsorName}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  disabled={sponsorMissing}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#FF4E00] focus:border-[#FF4E00] sm:text-sm ${sponsorMissing ? 'cursor-not-allowed' : ''} ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  disabled={sponsorMissing}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#FF4E00] focus:border-[#FF4E00] sm:text-sm ${sponsorMissing ? 'cursor-not-allowed' : ''} ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
                Mobile
              </label>
              <div className="flex gap-2">
                <input
                  id="mobile"
                  name="mobile"
                  type="text"
                  maxLength={10}
                  required
                  disabled={sponsorMissing}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#FF4E00] focus:border-[#FF4E00] sm:text-sm ${sponsorMissing ? 'cursor-not-allowed' : ''} ${errors.mobile ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="10-digit Mobile Number"
                  value={formData.mobile}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={handleGetOtp}
                  className="mt-1 px-3 py-2 bg-[#FF4E00] text-white rounded-md hover:bg-[#E64500] focus:outline-none focus:ring-2 focus:ring-[#FF4E00] text-sm font-medium disabled:opacity-60"
                  disabled={otpLoading || sponsorMissing}
                  style={sponsorMissing ? { cursor: 'not-allowed' } : {}}
                >
                  {otpLoading ? 'Generating...' : otpSent ? 'OTP Generated' : 'GENERATE OTP'}
                </button>
              </div>
              {errors.mobile && (
                <p className="mt-1 text-sm text-red-600">{errors.mobile}</p>
              )}
              {otpError && <p className="mt-1 text-sm text-red-600">{otpError}</p>}
              {otpSuccess && <p className="mt-1 text-sm text-green-600">{otpSuccess}</p>}
              {otpSent && (
                <div className="mt-2">
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                    Enter OTP
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      maxLength={6}
                      required
                      disabled={sponsorMissing || otpVerified}
                      className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#FF4E00] focus:border-[#FF4E00] sm:text-sm ${sponsorMissing || otpVerified ? 'cursor-not-allowed' : ''} ${errors.otp ? 'border-red-500' : otpVerified ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                      placeholder="Enter OTP"
                      value={formData.otp}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpVerifying || sponsorMissing || otpVerified || !formData.otp.trim()}
                      className="mt-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium disabled:opacity-60"
                      style={sponsorMissing ? { cursor: 'not-allowed' } : {}}
                    >
                      {otpVerifying ? 'Verifying...' : otpVerified ? 'Verified ✓' : 'Verify OTP'}
                    </button>
                  </div>
                  {errors.otp && (
                    <p className="mt-1 text-sm text-red-600">{errors.otp}</p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  disabled={sponsorMissing}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 pr-12 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#FF4E00] focus:border-[#FF4E00] sm:text-sm ${sponsorMissing ? 'cursor-not-allowed' : ''} ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  disabled={sponsorMissing}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 pr-12 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#FF4E00] focus:border-[#FF4E00] sm:text-sm ${sponsorMissing ? 'cursor-not-allowed' : ''} ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> OTP will be displayed on this page. After successful registration, your unique User ID and password will also be displayed here. Please save them for login.
              </p>
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                disabled={sponsorMissing}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#FF4E00] focus:border-[#FF4E00] sm:text-sm ${sponsorMissing ? 'cursor-not-allowed' : ''} ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  required
                  disabled={sponsorMissing}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#FF4E00] focus:border-[#FF4E00] sm:text-sm ${sponsorMissing ? 'cursor-not-allowed' : ''} ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="State"
                  value={formData.state}
                  onChange={handleChange}
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                )}
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  disabled={sponsorMissing}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#FF4E00] focus:border-[#FF4E00] sm:text-sm ${sponsorMissing ? 'cursor-not-allowed' : ''} ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={sponsorMissing}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#FF4E00] focus:border-[#FF4E00] sm:text-sm ${sponsorMissing ? 'cursor-not-allowed' : ''} ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="agree-terms"
              name="agree-terms"
              type="checkbox"
              required
              disabled={sponsorMissing}
              className="h-4 w-4 text-[#FF4E00] focus:ring-[#FF4E00] border-gray-300 rounded"
              style={sponsorMissing ? { cursor: 'not-allowed' } : {}}
            />
            <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
              I agree to the{' '}
              <Link to="/terms" className="text-[#FF4E00] hover:text-[#E64500] hover:underline">
                Terms and Conditions
              </Link>
            </label>
          </div>
          {errors.terms && (
            <p className="mt-1 text-sm text-red-600">{errors.terms}</p>
          )}
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 mb-6 border border-transparent text-sm font-medium rounded-md text-white bg-[#FF4E00] hover:bg-[#E64500] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4E00] transition-colors duration-200 disabled:opacity-60"
              disabled={sponsorMissing || loading || !otpVerified}
              style={sponsorMissing || !otpVerified ? { cursor: 'not-allowed' } : {}}
            >
              {!otpVerified ? 'Verify OTP First' : 'Create account'}
            </button>
          </div>
        </form>

        {/* Credentials Display Section */}
        {showCredentials && userCredentials && (
          <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6 shadow-lg">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-800 mb-2">Registration Successful!</h3>
              <p className="text-green-700">Your account has been created successfully.</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
              <h4 className="font-semibold text-gray-800 mb-3 text-center">Your Login Credentials</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">User ID:</span>
                  <span className="font-bold text-blue-600">{userCredentials.userId}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Password:</span>
                  <span className="font-bold text-red-600">{userCredentials.password}</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ <strong>Important:</strong> Please save these credentials immediately. You will need them to login to your account.
                </p>
              </div>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                </svg>
                Go to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup; 