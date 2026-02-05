import { AlertCircle, ArrowLeft, CheckCircle, Eye, EyeOff, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { API_ENDPOINTS } from '../../config/api';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password, 4: success
    const [formData, setFormData] = useState({
        email: '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [resetUserId, setResetUserId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(''); // Clear error when user types
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post(API_ENDPOINTS.auth.forgotPasswordSendOtp, {
                email: formData.email
            });

            if (response.data.success) {
                setSuccess('OTP sent successfully! Please check your email.');
                setStep(2);
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.data.message || 'Failed to send OTP');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!formData.otp) {
            setError('Please enter the OTP');
            return;
        }
        setStep(3);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await api.post(API_ENDPOINTS.auth.forgotPasswordReset, {
                email: formData.email,
                otp: formData.otp,
                newPassword: formData.newPassword
            });

            if (response.data.success) {
                setResetUserId(response.data.userId || '');
                setSuccess('Password reset successful! Please use the User ID below to log in with your new password.');
                setStep(4);
            } else {
                setError(response.data.message || 'Failed to reset password');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resendOtp = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await api.post(API_ENDPOINTS.auth.forgotPasswordSendOtp, {
                email: formData.email
            });

            if (response.data.success) {
                setSuccess('OTP resent successfully!');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.data.message || 'Failed to resend OTP');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <form onSubmit={handleSendOtp} className="mt-8 space-y-6">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                </label>
                <div className="relative">
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#FF4E00] focus:border-[#FF4E00] focus:z-10 sm:text-sm"
                        placeholder="Enter your email address"
                        value={formData.email}
                        onChange={handleChange}
                    />
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
            </div>
            
            <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#FF4E00] hover:bg-[#E64500] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4E00] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
        </form>
    );

    const renderStep2 = () => (
        <form onSubmit={handleVerifyOtp} className="mt-8 space-y-6">
            <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP
                </label>
                <input
                    id="otp"
                    name="otp"
                    type="text"
                    maxLength="6"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#FF4E00] focus:border-[#FF4E00] focus:z-10 sm:text-sm text-center text-lg tracking-widest"
                    placeholder="000000"
                    value={formData.otp}
                    onChange={handleChange}
                />
                <p className="text-sm text-gray-500 mt-2">
                    We've sent a 6-digit OTP to <strong>{formData.email}</strong>
                </p>
            </div>
            
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4E00]"
                >
                    Back
                </button>
                <button
                    type="submit"
                    disabled={!formData.otp || formData.otp.length !== 6}
                    className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#FF4E00] hover:bg-[#E64500] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4E00] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Verify OTP
                </button>
            </div>
            
            <div className="text-center">
                <button
                    type="button"
                    onClick={resendOtp}
                    disabled={loading}
                    className="text-sm text-[#FF4E00] hover:text-[#E64500] hover:underline disabled:opacity-50"
                >
                    {loading ? 'Sending...' : "Didn't receive OTP? Resend"}
                </button>
            </div>
        </form>
    );

    const renderStep3 = () => (
        <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
            <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                </label>
                <div className="relative">
                    <input
                        id="newPassword"
                        name="newPassword"
                        type={showPassword ? "text" : "password"}
                        required
                        className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#FF4E00] focus:border-[#FF4E00] focus:z-10 sm:text-sm"
                        placeholder="Enter new password"
                        value={formData.newPassword}
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
            </div>

            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                </label>
                <div className="relative">
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#FF4E00] focus:border-[#FF4E00] focus:z-10 sm:text-sm"
                        placeholder="Confirm new password"
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
            </div>
            
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4E00]"
                >
                    Back
                </button>
                <button
                    type="submit"
                    disabled={loading || !formData.newPassword || !formData.confirmPassword}
                    className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#FF4E00] hover:bg-[#E64500] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4E00] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>
            </div>
        </form>
    );

    const renderStep4 = () => (
        <div className="mt-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Password Reset Successful!</h3>
            <p className="text-sm text-gray-600 mb-2">
                Your password has been successfully reset.
            </p>
            {resetUserId && (
                <p className="text-sm text-gray-800 mb-4">
                    Your <span className="font-semibold">User ID</span> is{" "}
                    <span className="font-mono font-semibold bg-gray-100 px-2 py-1 rounded">
                        {resetUserId}
                    </span>. Use this User ID with your new password on the login page.
                </p>
            )}
            <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#FF4E00] hover:bg-[#E64500] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4E00]"
            >
                Go to Login
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="flex justify-center">
                        <div className="w-12 h-12 bg-[#FF4E00] rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">IT</span>
                        </div>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-bold text-black">
                        {step === 1 && 'Forgot Password'}
                        {step === 2 && 'Enter OTP'}
                        {step === 3 && 'Reset Password'}
                        {step === 4 && 'Success'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {step === 1 && 'Enter your registered email address to receive a password reset OTP'}
                        {step === 2 && 'Enter the 6-digit OTP sent to your email'}
                        {step === 3 && 'Create a new password for your account'}
                        {step === 4 && 'Use your User ID or registered mobile number with the new password to log in'}
                    </p>
                </div>

                {error && (
                    <div className="flex items-center justify-center p-3 bg-red-50 border border-red-200 rounded-md">
                        <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                        <span className="text-red-600 text-sm font-medium">{error}</span>
                    </div>
                )}

                {success && (
                    <div className="flex items-center justify-center p-3 bg-green-50 border border-green-200 rounded-md">
                        <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                        <span className="text-green-600 text-sm font-medium">{success}</span>
                    </div>
                )}

                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}

                <div className="text-center">
                    <Link
                        to="/login"
                        className="inline-flex items-center text-sm text-[#FF4E00] hover:text-[#E64500] hover:underline"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword; 