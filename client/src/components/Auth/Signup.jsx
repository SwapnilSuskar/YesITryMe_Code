import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../../assets/Logo.png';
import api, { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useReferral } from './ReferralHandler';
import { User, Phone, MapPin, UserCheck, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight, Shield, Lock } from 'lucide-react';

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
  const [userCredentials, setUserCredentials] = useState(null); // Store user credentials
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sponsorLookupLoading, setSponsorLookupLoading] = useState(false);
  const [sponsorLookupError, setSponsorLookupError] = useState('');
  const [sponsorLookupSuccess, setSponsorLookupSuccess] = useState('');
  const [sponsorValidated, setSponsorValidated] = useState(false);
  const [sponsorLookupType, setSponsorLookupType] = useState('id'); // 'id' or 'mobile'
  const [sponsorMobile, setSponsorMobile] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const [showNomineeForm, setShowNomineeForm] = useState(false);
  const [nomineeSkipped, setNomineeSkipped] = useState(false);
  const [nomineeData, setNomineeData] = useState({
    name: '',
    bloodRelation: '',
    mobile: '',
    address: ''
  });
  const [nomineeError, setNomineeError] = useState('');
  const [nomineeSuccess, setNomineeSuccess] = useState('');
  const [nomineeErrors, setNomineeErrors] = useState({});
  const [nomineeLoading, setNomineeLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const signupSuccess = location.state?.signupSuccess;

  // Zustand state/actions
  const { loading, error, signup, login } = useAuthStore();

  // Referral context
  const { sponsorInfo, isLoading: referralLoading, error: referralError } = useReferral();

  // Track if sponsor info is missing
  const sponsorMissing = !formData.sponsorId || !formData.sponsorName;

  // Auto-populate and validate sponsor info when available from referral context
  useEffect(() => {
    if (sponsorInfo) {
      setFormData(prev => ({
        ...prev,
        sponsorId: sponsorInfo.sponsorId,
        sponsorName: sponsorInfo.sponsorName
      }));
      // Auto-validate sponsor when coming from referral link
      setSponsorValidated(true);
      setSponsorLookupSuccess(`Sponsor validated: ${sponsorInfo.sponsorName} (${sponsorInfo.sponsorId})`);
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

    // Reset sponsor validation when sponsor fields change
    if (e.target.name === 'sponsorId' || e.target.name === 'sponsorName') {
      setSponsorValidated(false);
      setSponsorLookupError('');
      setSponsorLookupSuccess('');
    }
  };

  const handleNomineeChange = (e) => {
    setNomineeData({ ...nomineeData, [e.target.name]: e.target.value });
    // Clear errors when user starts typing
    if (nomineeError) setNomineeError('');
    if (nomineeErrors[e.target.name]) {
      setNomineeErrors({ ...nomineeErrors, [e.target.name]: '' });
    }
  };

  const bloodRelations = [
    'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister',
    'Husband', 'Wife', 'Grandfather', 'Grandmother', 'Uncle', 'Aunt', 'Cousin'
  ];

  const validateNomineeForm = () => {
    const newErrors = {};

    if (!nomineeData.name.trim()) {
      newErrors.name = 'Nominee name is required';
    } else if (nomineeData.name.trim().length < 2) {
      newErrors.name = 'Nominee name must be at least 2 characters';
    } else if (nomineeData.name.trim().length > 100) {
      newErrors.name = 'Nominee name cannot exceed 100 characters';
    }

    if (!nomineeData.bloodRelation.trim()) {
      newErrors.bloodRelation = 'Blood relation is required';
    }

    if (!nomineeData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(nomineeData.mobile)) {
      newErrors.mobile = 'Mobile number must be exactly 10 digits';
    }

    if (!nomineeData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (nomineeData.address.trim().length < 10) {
      newErrors.address = 'Address must be at least 10 characters';
    } else if (nomineeData.address.trim().length > 500) {
      newErrors.address = 'Address cannot exceed 500 characters';
    }

    return newErrors;
  };

  const handleNomineeSubmit = async () => {
    try {
      setNomineeError('');
      setNomineeSuccess('');
      setNomineeErrors({});
      setNomineeLoading(true);

      // Validate nominee form
      const validationErrors = validateNomineeForm();
      if (Object.keys(validationErrors).length > 0) {
        setNomineeErrors(validationErrors);
        setNomineeError('Please fill all required fields correctly');
        setNomineeLoading(false);
        return;
      }

      // Agreement must be accepted
      if (!agreementAccepted) {
        setNomineeError('Please review and accept the Nominee Agreement to proceed');
        setNomineeLoading(false);
        return;
      }

      // Check if user is logged in (should have credentials from signup)
      if (!userCredentials || !userCredentials.userId) {
        setNomineeError('User credentials not found. Please try again.');
        setNomineeLoading(false);
        return;
      }

      // Submit nominee data with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const axiosResponse = await api.post(
        API_ENDPOINTS.nominee.createOrUpdate.replace(':userId', userCredentials.userId),
        {
          name: nomineeData.name.trim(),
          bloodRelation: nomineeData.bloodRelation,
          mobile: nomineeData.mobile.trim(),
          address: nomineeData.address.trim()
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      const data = axiosResponse.data;

      if (axiosResponse.status === 200 && data.success) {
        setNomineeSuccess('Nominee information saved successfully!');
        setNomineeError('');
        // Reset form
        setNomineeData({
          name: '',
          bloodRelation: '',
          mobile: '',
          address: ''
        });
        setShowNomineeForm(false);
        setAgreementAccepted(false);

        // Navigate to login after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        const errorMessage = data.message || 'Failed to save nominee information. Please try again.';
        setNomineeError(errorMessage);
        setNomineeSuccess('');

        // If it's a server error and we haven't retried yet, offer retry
        if (axiosResponse.status >= 500 && retryCount < 2) {
          setRetryCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error saving nominee:', error);

      if (error.name === 'AbortError') {
        setNomineeError('Request timeout. Please check your connection and try again.');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setNomineeError('Network error. Please check your internet connection and try again.');
      } else if (error.name === 'SyntaxError') {
        setNomineeError('Server error. Please try again later.');
      } else {
        setNomineeError('An unexpected error occurred. Please try again.');
      }

      setNomineeSuccess('');
    } finally {
      setNomineeLoading(false);
    }
  };

  const handleNomineeSkip = () => {
    setNomineeError('');
    setNomineeSuccess('');
    setNomineeErrors({});
    setRetryCount(0);
    setShowNomineeForm(false);
    setNomineeSkipped(true);
    navigate('/login');
  };

  // Cleanup function to clear any pending timeouts
  useEffect(() => {
    return () => {
      // Clear any pending timeouts when component unmounts
      const timeouts = document.querySelectorAll('[data-timeout]');
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.sponsorId.trim()) newErrors.sponsorId = 'Sponsor ID is required';
    if (!formData.sponsorName.trim()) newErrors.sponsorName = 'Sponsor name is required';
    if (!sponsorValidated) newErrors.sponsor = 'Please validate your sponsor details first';
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

  const handleSponsorLookup = async (e) => {
    e.preventDefault();
    setSponsorLookupError('');
    setSponsorLookupSuccess('');
    setSponsorValidated(false);

    // Validate input based on lookup type (only one input required)
    if (sponsorLookupType === 'id') {
      if (!formData.sponsorId.trim()) {
        setSponsorLookupError('Please enter a Sponsor ID');
        return;
      }
    } else {
      if (!formData.sponsorName.trim()) {
        setSponsorLookupError('Please enter a mobile number');
        return;
      }
      if (!/^\d{10}$/.test(formData.sponsorName)) {
        setSponsorLookupError('Please enter a valid 10-digit mobile number');
        return;
      }
    }

    setSponsorLookupLoading(true);
    try {
      const endpoint = sponsorLookupType === 'id'
        ? `${API_ENDPOINTS.auth.lookupSponsorById}`
        : `${API_ENDPOINTS.auth.lookupSponsorByMobile}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [sponsorLookupType === 'id' ? 'sponsorId' : 'mobile']:
            sponsorLookupType === 'id' ? formData.sponsorId : formData.sponsorName
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const sponsorData = data.sponsor;
        // Single-source verification: fill both fields from the found sponsor
        setFormData(prev => ({
          ...prev,
          sponsorId: sponsorData.userId,
          sponsorName: `${sponsorData.firstName} ${sponsorData.lastName}`
        }));
        setSponsorMobile(sponsorData.mobile || '');
        setSponsorValidated(true);
        setSponsorLookupSuccess(`Sponsor validated: ${sponsorData.firstName} ${sponsorData.lastName} (${sponsorData.userId})`);
        setSponsorLookupError('');
      } else {
        setSponsorLookupError(data.message || 'Sponsor not found. Please check the details and try again.');
        setSponsorValidated(false);
      }
    } catch (err) {
      console.error('Sponsor lookup error:', err);
      setSponsorLookupError('Network error. Please check your connection and try again.');
      setSponsorValidated(false);
    } finally {
      setSponsorLookupLoading(false);
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

      // Silently login so protected routes (nominee) have a valid token
      // Prefer mobile if available; otherwise use userId and the generated password
      const identifier = formData.mobile?.trim() && /^\d{10}$/.test(formData.mobile)
        ? { mobile: formData.mobile.trim(), password: formData.password }
        : { userId: result.credentials.userId, password: result.credentials.password };
      // Perform login without navigation, so token is stored and axios interceptor adds it
      await login(identifier, null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 mt-10 overflow-x-hidden">
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
            {/* Sponsor Lookup Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Sponsor Information</h3>

              {/* Manual sponsor lookup - only show if not validated from referral */}
              {!sponsorValidated && !sponsorInfo && (
                <>
                  {/* Lookup Type Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lookup Method</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="lookupType"
                          value="id"
                          checked={sponsorLookupType === 'id'}
                          onChange={(e) => setSponsorLookupType(e.target.value)}
                          className="h-4 w-4 text-[#FF4E00] focus:ring-[#FF4E00] border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">By Sponsor ID</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="lookupType"
                          value="mobile"
                          checked={sponsorLookupType === 'mobile'}
                          onChange={(e) => setSponsorLookupType(e.target.value)}
                          className="h-4 w-4 text-[#FF4E00] focus:ring-[#FF4E00] border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">By Mobile Number</span>
                      </label>
                    </div>
                  </div>

                  {/* Inputs - show only one depending on lookup type */}
                  {sponsorLookupType === 'id' && (
                    <div className="mb-4">
                      <label htmlFor="sponsorId" className="block text-sm font-medium text-gray-700">Sponsor ID</label>
                      <input
                        id="sponsorId"
                        name="sponsorId"
                        type="text"
                        required
                        className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#FF4E00] focus:border-[#FF4E00] sm:text-sm border-gray-300 ${errors.sponsorId ? 'border-red-500' : ''}`}
                        placeholder={'Enter Sponsor ID'}
                        value={formData.sponsorId}
                        onChange={handleChange}
                      />
                      {errors.sponsorId && (
                        <p className="mt-1 text-sm text-red-600">{errors.sponsorId}</p>
                      )}
                    </div>
                  )}

                  {sponsorLookupType === 'mobile' && (
                    <div className="mb-4">
                      <label htmlFor="sponsorName" className="block text-sm font-medium text-gray-700">Mobile Number</label>
                      <input
                        id="sponsorName"
                        name="sponsorName"
                        type="text"
                        required
                        className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#FF4E00] focus:border-[#FF4E00] sm:text-sm border-gray-300 ${errors.sponsorName ? 'border-red-500' : ''}`}
                        placeholder={'Enter 10-digit mobile number'}
                        value={formData.sponsorName}
                        onChange={handleChange}
                      />
                      {errors.sponsorName && (
                        <p className="mt-1 text-sm text-red-600">{errors.sponsorName}</p>
                      )}
                    </div>
                  )}

                  {/* Lookup Button */}
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={handleSponsorLookup}
                      disabled={sponsorLookupLoading}
                      className="w-full px-4 py-2 bg-[#FF4E00] text-white rounded-md hover:bg-[#E64500] focus:outline-none focus:ring-2 focus:ring-[#FF4E00] text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {sponsorLookupLoading ? 'Validating...' : 'Validate Sponsor'}
                    </button>
                  </div>
                </>
              )}

              {/* Validated Sponsor Summary */}
              {sponsorValidated && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700 font-semibold">Validated Sponsor</p>
                  <p className="text-sm text-green-800">{formData.sponsorName} ({formData.sponsorId})</p>
                  {sponsorMobile && (
                    <p className="text-sm text-green-800">Mobile: {sponsorMobile}</p>
                  )}
                </div>
              )}

              {/* Status Messages */}
              {sponsorLookupError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{sponsorLookupError}</p>
                </div>
              )}

              {sponsorLookupSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-600">{sponsorLookupSuccess}</p>
                </div>
              )}

              {errors.sponsor && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errors.sponsor}</p>
                </div>
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
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
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
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
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
              disabled={sponsorMissing || loading || !otpVerified || !sponsorValidated}
              style={sponsorMissing || !otpVerified || !sponsorValidated ? { cursor: 'not-allowed' } : {}}
            >
              {!sponsorValidated ? 'Validate Sponsor First' : !otpVerified ? 'Verify OTP First' : 'Create account'}
            </button>
          </div>
        </form>

        {/* Credentials Display Section */}
        {showCredentials && userCredentials && (
          <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6 shadow-lg">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
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
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-sm text-yellow-800 font-medium">
                    <strong>Important:</strong> Please save these credentials immediately. You will need them to login to your account.
                  </p>
                </div>
              </div>
            </div>

            {/* Nominee Section - Show after credentials */}
            {!nomineeSkipped && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Add Nominee Information</h3>
                  <p className="text-xs text-gray-600">
                    Secure your account by adding nominee details (optional)
                  </p>
                </div>

                {!showNomineeForm ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowNomineeForm(true)}
                      className="flex-1 bg-[#FF4E00] hover:bg-[#E64500] text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                    >
                      Add Nominee
                    </button>
                    <button
                      onClick={handleNomineeSkip}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                    >
                      Skip for Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {nomineeError && (
                      <div className="text-red-600 text-xs text-center">
                        {nomineeError}
                        {retryCount > 0 && retryCount < 2 && (
                          <div className="mt-1">
                            <button
                              onClick={handleNomineeSubmit}
                              disabled={nomineeLoading}
                              className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded transition-colors disabled:opacity-50"
                            >
                              Retry ({retryCount}/2)
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {nomineeSuccess && (
                      <div className="text-green-600 text-xs text-center">{nomineeSuccess}</div>
                    )}

                    <div className="space-y-4">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          <User className="w-3 h-3 inline mr-1 text-[#FF4E00]" />
                          Nominee Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={nomineeData.name}
                          onChange={handleNomineeChange}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-[#FF4E00] focus:border-[#FF4E00] text-sm ${nomineeErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                          placeholder="Enter nominee's full name"
                          required
                        />
                        {nomineeErrors.name && (
                          <p className="mt-1 text-xs text-red-600">{nomineeErrors.name}</p>
                        )}
                      </div>

                      {/* Blood Relation */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          <UserCheck className="w-3 h-3 inline mr-1 text-[#FF4E00]" />
                          Blood Relation *
                        </label>
                        <select
                          name="bloodRelation"
                          value={nomineeData.bloodRelation}
                          onChange={handleNomineeChange}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-[#FF4E00] focus:border-[#FF4E00] text-sm ${nomineeErrors.bloodRelation ? 'border-red-500' : 'border-gray-300'}`}
                          required
                        >
                          <option value="">Select relationship</option>
                          {bloodRelations.map(relation => (
                            <option key={relation} value={relation}>{relation}</option>
                          ))}
                        </select>
                        {nomineeErrors.bloodRelation && (
                          <p className="mt-1 text-xs text-red-600">{nomineeErrors.bloodRelation}</p>
                        )}
                      </div>

                      {/* Mobile */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          <Phone className="w-3 h-3 inline mr-1 text-[#FF4E00]" />
                          Mobile Number *
                        </label>
                        <input
                          type="tel"
                          name="mobile"
                          value={nomineeData.mobile}
                          onChange={handleNomineeChange}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-[#FF4E00] focus:border-[#FF4E00] text-sm ${nomineeErrors.mobile ? 'border-red-500' : 'border-gray-300'}`}
                          placeholder="Enter 10-digit mobile number"
                          maxLength="10"
                          required
                        />
                        {nomineeErrors.mobile && (
                          <p className="mt-1 text-xs text-red-600">{nomineeErrors.mobile}</p>
                        )}
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          <MapPin className="w-3 h-3 inline mr-1 text-[#FF4E00]" />
                          Address *
                        </label>
                        <textarea
                          name="address"
                          value={nomineeData.address}
                          onChange={handleNomineeChange}
                          rows="3"
                          className={`w-full px-3 py-2 border rounded-md focus:ring-[#FF4E00] focus:border-[#FF4E00] text-sm resize-none ${nomineeErrors.address ? 'border-red-500' : 'border-gray-300'}`}
                          placeholder="Enter complete address"
                          required
                        />
                        {nomineeErrors.address && (
                          <p className="mt-1 text-xs text-red-600">{nomineeErrors.address}</p>
                        )}
                      </div>
                    </div>

                      {/* Agreement - Trust Section */}
                      <div className="rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 p-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xs font-semibold text-gray-800 mb-1">Nominee Agreement</h4>
                            <p className="text-[11px] text-gray-700 mb-2 leading-relaxed">
                              I, <span className="font-semibold">{formData.firstName} {formData.lastName}</span>, designate my business nominee from my blood relation and agree to all rules, regulations, and Terms & Conditions of YesITryMe. YesITryMe operates on a refer-and-earn model. Commissions are based on business generated by users and active partners, not a salary. Income is not fixed and depends on business performance, user account activity, and plan structure.
                            </p>
                            <label className="inline-flex items-center gap-2 select-none">
                              <input
                                type="checkbox"
                                checked={agreementAccepted}
                                onChange={(e) => setAgreementAccepted(e.target.checked)}
                                className="h-4 w-4 text-[#FF4E00] focus:ring-[#FF4E00] border-gray-300 rounded"
                              />
                              <span className="text-[11px] text-gray-800">I agree to the Nominee Agreement and authorize use of this information for account security.</span>
                            </label>
                            <div className="mt-1 flex items-center text-[10px] text-gray-600">
                              <Lock className="w-3.5 h-3.5 mr-1 text-orange-600" />
                              Data is encrypted at rest and in transit.
                            </div>
                          </div>
                        </div>
                      </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => setShowNomineeForm(false)}
                        disabled={nomineeLoading}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleNomineeSubmit}
                        disabled={nomineeLoading || !agreementAccepted}
                        className="flex-1 bg-[#FF4E00] hover:bg-[#E64500] text-white py-2 px-4 rounded-md text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {nomineeLoading ? 'Saving...' : 'Save Nominee'}
                      </button>
                      <button
                        onClick={handleNomineeSkip}
                        disabled={nomineeLoading}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Skip for Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="text-center mt-3">
              <Link
                to="/login"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
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