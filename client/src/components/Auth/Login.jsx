import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const Login = () => {
    const navigate = useNavigate();
    const { loading, error, success, login } = useAuthStore();
    const [formData, setFormData] = useState({ identifier: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const rawIdentifier = formData.identifier.trim();
        const digitsOnly = rawIdentifier.replace(/\D/g, '');

        // If user typed country code (+91 etc.), use the last 10 digits as mobile
        let mobileForLogin = '';
        if (digitsOnly.length === 10) {
            mobileForLogin = digitsOnly;
        } else if (digitsOnly.length > 10) {
            mobileForLogin = digitsOnly.slice(-10);
        }

        const isMobile = /^\d{10}$/.test(mobileForLogin);

        const payload = isMobile
            ? { mobile: mobileForLogin, password: formData.password }
            : { userId: rawIdentifier, password: formData.password };

        login(payload, navigate);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="flex justify-center">
                        <div className="w-16 h-14 bg-[#FF4E00] rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">YITM</span>
                        </div>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-bold text-black">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <Link to="/signup" className="font-medium text-[#FF4E00] hover:text-[#E64500] hover:underline">
                            create a new account
                        </Link>
                    </p>
                </div>
                {error && (
                    <div className="text-red-600 text-center font-medium">{error}</div>
                )}
                {success && (
                    <div className="text-green-600 text-center font-medium">{success}</div>
                )}
                {loading && (
                    <div className="text-orange-500 text-center font-medium">Signing in...</div>
                )}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="identifier" className="sr-only">
                                User ID / Mobile Number
                            </label>
                            <input
                                id="identifier"
                                name="identifier"
                                type="text"
                                autoComplete="username"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#FF4E00] focus:border-[#FF4E00] focus:z-10 sm:text-sm"
                                placeholder="User ID or Mobile Number (10 digits)"
                                value={formData.identifier}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="relative">
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 pr-12 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#FF4E00] focus:border-[#FF4E00] focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center z-20">
                                <button
                                    type="button"
                                    className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <FiEyeOff className="h-5 w-5" />
                                    ) : (
                                        <FiEye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-[#FF4E00] focus:ring-[#FF4E00] border-gray-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                Remember me
                            </label>
                        </div>

                        <div className="text-sm">
                            <Link to="/forgot-password" className="font-medium text-[#FF4E00] hover:text-[#E64500] hover:underline">
                                Forgot your password?
                            </Link>
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#FF4E00] hover:bg-[#E64500] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4E00] transition-colors duration-200"
                        >
                            Sign in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login; 