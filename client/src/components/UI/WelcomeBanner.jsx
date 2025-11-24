import WelComeBanner from "../../assets/Images/Banner.webp";
import { TypeAnimation } from 'react-type-animation';
import CountUp from 'react-countup';
import { Link } from "react-router-dom";
import { Zap, BookOpen, CheckCircle, Youtube, Coins, Smartphone, Wallet } from 'lucide-react';
const WelcomeBanner = () => {
    return (
        <div className="min-h-screen bg-orange-50  pt-8">
            {/* Background decorative elements */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-[#FF4E00] to-orange-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-pink-400 to-red-400 rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center space-y-8 lg:space-y-12">
                    {/* Main Title */}
                    <div className="space-y-6">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-800 leading-tight"
                            style={{

                                fontFamily: 'Roboto',
                                fontSize: "39px",
                                color: "#252528ff", // Very dark gray/off-black
                                leftmargin: "0",
                                textShadow: "0 4px 24px rgba(255, 120, 8, 0.10)", // Subtle orange shadow
                            }}

                        >
                            Welcome To{' '}
                            <span className="bg-gradient-to-r from-[#FF4E00] to-orange-500 bg-clip-text text-transparent">
                                YesITryMe
                            </span>
                        </h1>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800" style={{
                            fontFamily: 'Poppins',
                            color: "#252528ff", // Very dark gray/off-black
                            margin: 0,
                        }}
                        >
                            Digital Earning Unique Opportunity.
                        </h2>
                    </div>
                    <TypeAnimation
                        sequence={[
                            'Affiliate Marketing Platform',
                            1500, // Waits 1s after typing
                            'YouTube Task Platform',
                            1500, // Waits 1s after typing
                            'Earn Coins & Rewards',
                            1500, // Waits 1s after typing
                            'Digital Skills Training',
                            1500, // Waits 1s after typing
                        ]}
                        wrapper="div"
                        speed={50}
                        repeat={Infinity}
                        className="w-full sm:w-auto px-4 sm:px-8 py-3 sm:py-4 bg-white/70 backdrop-blur-md border border-orange-600 font-bold text-center mx-0 bg-gradient-to-r from-[#FF4E00] to-orange-500 bg-clip-text text-transparent"
                        style={{
                            fontFamily: '"Barlow", sans-serif',
                            fontWeight: 700,
                            fontSize: '22px',
                            lineHeight: 1.3,
                            minWidth: '340px',
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                        }}
                    />
                    {/* Three Dots */}
                    <div className="flex justify-center space-x-2 mt-4">
                        <span className="w-3 h-3 rounded-full bg-[#026237]"></span>
                        <span className="w-3 h-3 rounded-full bg-[#FF8725]"></span>
                        <span className="w-3 h-3 rounded-full bg-[#ED4848]"></span>
                    </div>

                    {/* Description */}
                    <div className="max-w-4xl mx-auto">
                        <p className="text-center text-lg sm:text-xl md:text-2xl text-gray-800 leading-relaxed font-medium"
                            style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '18px',
                                color: '#1f2937',
                                lineHeight: '1.7',
                                textAlign: 'center',
                                background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}>
                            Transform Your Future With Cutting-Edge Digital Skills, Complete YouTube Tasks, Earn Coins & Rewards, And Unlock Unlimited Earning Opportunities In the Digital Economy.
                        </p>
                    </div>
                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 w-full max-w-10pxl mt-8">
                        {/* Feature 1 */}
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-center">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-[#FF4E00] to-orange-500 rounded-xl">
                                    <Zap className="w-10 h-10 text-white" />
                                </span>
                                <h3 className="text-3xl font-bold text-gray-800 m-0 flex-1 text-left">Expert Courses</h3>
                            </div>
                            <p className="text-gray-600" style={{
                                fontFamily: "Lato",
                                fontSize: '19px',
                                color: '#111827',
                                lineHeight: '1.3',
                                textAlign: 'left',

                            }}>Learn From Industry Experts With Practical, Hands-On Training.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-center">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                                    <BookOpen className="w-10 h-10 text-white" />
                                </span>
                                <h3 className="text-3xl font-bold text-gray-800 m-0 flex-1 text-left">Fast Learning</h3>
                            </div>
                            <p className="text-gray-600" style={{
                                fontFamily: "Lato",
                                fontSize: '19px',
                                color: '#111827',
                                lineHeight: '1.3',
                                textAlign: 'left',
                            }}>Accelerated Learning Paths Designed For Quick Skill Acquisition.</p>
                        </div>
                        {/* Feature 3 */}
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-center">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl">
                                    <CheckCircle className="w-14 h-14 text-white" />
                                </span>
                                <h3 className="text-3xl font-bold text-gray-800 m-0 flex-1 text-left">Certification</h3>
                            </div>
                            <p className="text-gray-600" style={{
                                fontFamily: "Lato",
                                fontSize: '19px',
                                fontWeight: 500,
                                color: '#111827',
                                lineHeight: '1.3',
                                textAlign: 'left',
                            }}>
                                Earn Recognized Certificates To Boost Your Career Prospects.</p>
                        </div>

                        {/* Feature 4 - YouTube Tasks */}
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-center">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-red-500 to-red-600 rounded-xl">
                                    <Youtube className="w-10 h-10 text-white" />
                                </span>
                                <h3 className="text-3xl font-bold text-gray-800 m-0 flex-1 text-left">YouTube Tasks</h3>
                            </div>
                            <p className="text-gray-600" style={{
                                fontFamily: "Lato",
                                fontSize: '19px',
                                color: '#111827',
                                lineHeight: '1.3',
                                textAlign: 'left',
                            }}>
                                Complete YouTube Tasks And Earn Rewards For Your Engagement.</p>
                        </div>

                        {/* Feature 5 - Earn Coins */}
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-center">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl">
                                    <Coins className="w-10 h-10 text-white" />
                                </span>
                                <h3 className="text-3xl font-bold text-gray-800 m-0 flex-1 text-left">Earn Coins</h3>
                            </div>
                            <p className="text-gray-600" style={{
                                fontFamily: "Lato",
                                fontSize: '19px',
                                color: '#111827',
                                lineHeight: '1.3',
                                textAlign: 'left',
                            }}>
                                Earn Digital Coins Through Various Activities And Tasks.</p>
                        </div>
                        {/* Feature 6 - Mobile Recharge */}
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-center">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                                    <Smartphone className="w-10 h-10 text-white" />
                                </span>
                                <h3 className="text-3xl font-bold text-gray-800 m-0 flex-1 text-left">Mobile Recharge</h3>
                            </div>
                            <p className="text-gray-600" style={{
                                fontFamily: "Lato",
                                fontSize: '19px',
                                color: '#111827',
                                lineHeight: '1.3',
                                textAlign: 'left',
                            }}>
                                Recharge Your Mobile And Earn Commission On Every Transaction.</p>
                        </div>
                        {/* Feature 7 - Smart Wallet */}
                        {/* <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-center">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                                    <Wallet className="w-10 h-10 text-white" />
                                </span>
                                <h3 className="text-3xl font-bold text-gray-800 m-0 flex-1 text-left">Smart Wallet</h3>
                            </div>
                            <p className="text-gray-600" style={{
                                fontFamily: "Lato",
                                fontSize: '19px',
                                color: '#111827',
                                lineHeight: '1.3',
                                textAlign: 'left',
                            }}>
                                Manage Your Earnings With Secure Digital Wallet System.</p>
                        </div> */}
                    </div>

                    {/* CTA Buttons */}
                    <div className="grid grid-cols-2 gap-4 mt-4 w-full max-w-md mx-auto mb-0">
                        <Link to="/super-packages" className="px-10 py-2 bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg w-full">
                            Get Started Now
                        </Link>
                        <Link to="/packages" className="px-10 py-2 border-2 border-[#FF4E00] text-[#FF4E00] font-semibold rounded-xl hover:bg-[#FF4E00] hover:text-white transition-all duration-300 text-lg w-full">
                            Explore Courses
                        </Link>
                    </div>
                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-0 pt-12 max-w-4xl">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-[#FF4E00] mb-2">
                                <CountUp end={1500} duration={2} />+
                            </div>
                            <div className="text-sm text-gray-600 font-medium">Active Users</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-[#FF4E00] mb-2">
                                <CountUp end={50} duration={2} />+
                            </div>
                            <div className="text-sm text-gray-600 font-medium">Expert Courses</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-[#FF4E00] mb-2">
                                <CountUp end={500} duration={2} />+
                            </div>
                            <div className="text-sm text-gray-600 font-medium">YouTube Tasks</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-[#FF4E00] mb-2">
                                <CountUp end={95} duration={2} />%
                            </div>
                            <div className="text-sm text-gray-600 font-medium">Success Rate</div>
                        </div>
                    </div>

                    {/* Beautiful Image Section */}
                    <div className="w-screen overflow-hidden m-1 p-1">
                        <img
                            src={WelComeBanner}
                            alt="YesITryMe Digital Earning Opportunity"
                            className="w-full max-h-[70vh] object-cover"
                            style={{
                                borderRadius: 6,
                                boxShadow: 'none',
                                border: 'none',
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeBanner;