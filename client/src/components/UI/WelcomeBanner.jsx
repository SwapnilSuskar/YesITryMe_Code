import WelComeBanner from "../../assets/Images/Banner.webp";
import { TypeAnimation } from 'react-type-animation';
import CountUp from 'react-countup';
import { Link } from "react-router-dom";
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
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                    </svg>
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
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                    </svg>
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
                                    <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
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
                            }}>Earn Recognized Certificates To Boost Your Career Prospects.</p>
                        </div>

                        {/* Feature 4 - YouTube Tasks */}
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-center">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-red-500 to-red-600 rounded-xl">
                                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                    </svg>
                                </span>
                                <h3 className="text-3xl font-bold text-gray-800 m-0 flex-1 text-left">YouTube Tasks</h3>
                            </div>
                            <p className="text-gray-600" style={{
                                fontFamily: "Lato",
                                fontSize: '19px',
                                color: '#111827',
                                lineHeight: '1.3',
                                textAlign: 'left',
                            }}>Complete YouTube Tasks And Earn Rewards For Your Engagement.</p>
                        </div>

                        {/* Feature 5 - Earn Coins */}
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-center">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </span>
                                <h3 className="text-3xl font-bold text-gray-800 m-0 flex-1 text-left">Earn Coins</h3>
                            </div>
                            <p className="text-gray-600" style={{
                                fontFamily: "Lato",
                                fontSize: '19px',
                                color: '#111827',
                                lineHeight: '1.3',
                                textAlign: 'left',
                            }}>Earn Digital Coins Through Various Activities And Tasks.</p>
                        </div>
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
                                <CountUp end={1000} duration={2} />+
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