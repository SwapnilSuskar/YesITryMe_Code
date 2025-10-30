import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, Mail, Phone } from 'lucide-react';
import Logo from '../../assets/Logo.png';

const NotFound = () => {
    const navigate = useNavigate();

    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center px-4 mb-8">
            <div className="max-w-4xl mx-auto text-center">
                {/* Logo */}
                <div className="mb-8">
                    <img src={Logo} alt="YesITryMe Logo" className="w-32 h-32 object-contain mx-auto -mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800">YesITryMe</h1>
                </div>

                {/* 404 Error */}
                <div className="mb-8">
                    <h1 className="text-9xl md:text-[12rem] font-bold text-transparent bg-gradient-to-r from-[#FF4E00] to-orange-500 bg-clip-text mb-4">
                        404
                    </h1>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                        Oops! Page Not Found
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                        The page you're looking for doesn't exist or has been moved. 
                        Don't worry, let's get you back on track with your digital earning journey!
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                    <Link 
                        to="/" 
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                        <Home className="w-5 h-5 mr-2" />
                        Go to Homepage
                    </Link>
                    <button 
                        onClick={handleGoBack}
                        className="inline-flex items-center px-8 py-4 border-2 border-[#FF4E00] text-[#FF4E00] font-semibold rounded-xl hover:bg-[#FF4E00] hover:text-white transition-all duration-300"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Go Back
                    </button>
                </div>

                {/* Helpful Links */}
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-200 mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Popular Pages</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link 
                            to="/courses" 
                            className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-md transition-all group"
                        >
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <Search className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-2">Courses</h4>
                            <p className="text-sm text-gray-600">Explore our digital skills courses</p>
                        </Link>
                        <Link 
                            to="/packages" 
                            className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-md transition-all group"
                        >
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <Home className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-2">Packages</h4>
                            <p className="text-sm text-gray-600">View our earning packages</p>
                        </Link>
                        <Link 
                            to="/contact" 
                            className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200 hover:shadow-md transition-all group"
                        >
                            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <Mail className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-2">Contact</h4>
                            <p className="text-sm text-gray-600">Get help and support</p>
                        </Link>
                    </div>
                </div>

                {/* Contact Support */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Still Need Help?</h3>
                    <p className="text-gray-600 mb-4">
                        If you can't find what you're looking for, our support team is here to help!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a 
                            href="mailto:YesITryMeofficial@gmail.com" 
                            className="inline-flex items-center px-6 py-3 bg-white text-[#FF4E00] font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            Email Support
                        </a>
                        <a 
                            href="tel:+917066916324" 
                            className="inline-flex items-center px-6 py-3 bg-white text-[#FF4E00] font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                            <Phone className="w-4 h-4 mr-2" />
                            Call Support
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} YesITryMe. All rights reserved.
                    </p>
                    <div className="flex justify-center space-x-6 mt-4">
                        <Link to="/privacy" className="text-gray-500 hover:text-[#FF4E00] transition-colors text-sm">
                            Privacy Policy
                        </Link>
                        <Link to="/terms" className="text-gray-500 hover:text-[#FF4E00] transition-colors text-sm">
                            Terms of Service
                        </Link>
                        <Link to="/contact" className="text-gray-500 hover:text-[#FF4E00] transition-colors text-sm">
                            Contact Us
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
