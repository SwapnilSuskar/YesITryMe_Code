import { BookOpen, Brain, LayoutDashboard, LinkIcon, LogOut, Menu, Package, ReceiptIndianRupee, User, Users, Wallet, X, YoutubeIcon, Zap, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from "../assets/Logo.png";
import { useAuthStore } from '../store/useAuthStore';
import NotificationBell from './UI/NotificationBell';
import UserAvatar from './UI/UserAvatar';


const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, logout, user } = useAuthStore();

  // Navigation items for public pages
  const publicNavItems = [
    { name: 'HOME', path: '/' },
    { name: 'COURSES', path: '/courses' },
    { name: 'GALLERY', path: '/gallery' },
    { name: 'ABOUT US', path: '/about' },
    { name: 'CONTACT US', path: '/contact' },
  ];

  // Navigation items for authenticated users
  const authenticatedNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Social Earning', path: '/socialearning', icon: YoutubeIcon },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Nominees', path: '/nominee', icon: UserCheck },
    { name: 'My Team', path: '/my-team', icon: Users },
    { name: 'AI Tools', path: '/ai-tools', icon: Brain },
    { name: 'Packages', path: '/packages', icon: BookOpen },
    { name: 'Super Packages', path: '/super-packages', icon: Zap },
    { name: 'My Products', path: '/products', icon: Package },
    { name: 'My Ebooks', path: '/ebooks', icon: BookOpen },
    { name: 'KYC', path: '/kyc', icon: LinkIcon },
    { name: 'Payout', path: '/payout', icon: Wallet },
    { name: 'Wallet Transactions', path: '/wallet-transactions', icon: ReceiptIndianRupee },
  ];


  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
    setTimeout(() => logout(), 0);
  };

  // Helper function to render navigation items
  const renderNavItem = (item, isMobile = false) => {
    const IconComponent = item.icon;
    const baseClasses = "flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-700 hover:bg-orange-50 hover:text-[#FF4E00] font-semibold transition";

    if (isMobile) {
      return (
        <button
          key={item.path}
          onClick={() => { setIsMobileDropdownOpen(false); navigate(item.path); }}
          className={baseClasses}
        >
          {IconComponent && <IconComponent className="w-4 h-4 text-[#FF4E00]" />}
          {item.name}
        </button>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={baseClasses}
      >
        {IconComponent && <IconComponent className="w-4 h-4 text-[#FF4E00]" />}
        {item.name}
      </Link>
    );
  };

  return (
    <nav className="relative">
      {/* Gradient/Glow Overlay */}
      <div className="absolute inset-0 z-40 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-r from-orange-100/60 via-white/80 to-orange-200/60 blur-md opacity-80"></div>
      </div>
      <div className="backdrop-blur-xl bg-white/80 border-b border-orange-100 shadow-lg fixed w-full top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center h-14 relative z-50">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <img src={Logo} alt="Logo" className="w-24 h-24 object-contain drop-shadow-lg" />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-6 flex items-baseline space-x-2">
                {publicNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.path)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#FF4E00] 
                        ${isActive ? 'text-[#FF4E00] font-bold' : 'text-black/90 hover:text-[#FF4E00]'}
                      `}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop Auth/User Info */}
            <div className="hidden md:flex items-center space-x-2">
              {isAuthenticated && user && (
                <NotificationBell />
              )}
              {isAuthenticated && user ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-black/90 bg-orange-50/60 border border-orange-100 hover:bg-orange-100/80 focus:outline-none focus:ring-2 focus:ring-[#FF4E00] transition shadow-sm backdrop-blur-md">
                    <UserAvatar
                      imageUrl={user.imageUrl}
                      firstName={user.firstName}
                      lastName={user.lastName}
                      status={user.status}
                      size={20}
                      className="transition-transform duration-200 group-hover:scale-110"
                    />
                    <span className="hidden lg:inline font-semibold text-sm">{user.firstName}</span>
                    <Menu className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:-rotate-90" />
                  </button>
                  {/* Hover Dropdown */}
                  <div className="absolute right-0 mt-2 w-48 bg-white/95 border border-orange-100 rounded-2xl shadow-2xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right backdrop-blur-xl scale-95 group-hover:scale-100">
                    {/* Arrow */}
                    <div className="absolute -top-2 right-8 w-4 h-4 bg-white border-t border-l border-orange-100 rotate-45 z-0"></div>
                    <div className="relative z-10 py-2 px-2 flex flex-col gap-1">
                      {user.role === "admin" && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-700 hover:bg-orange-50 hover:text-[#FF4E00] font-semibold transition"
                        >
                          <LayoutDashboard className="w-4 h-4 text-[#FF4E00]" />
                          Admin Dashboard
                        </Link>
                      )}

                      {/* Mapped Navigation Items */}
                      {authenticatedNavItems.map((item) => renderNavItem(item))}

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-700 hover:bg-orange-50 hover:text-[#FF4E00] font-semibold transition"
                      >
                        <LogOut className="w-4 h-4 text-[#FF4E00]" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-black/90 hover:text-[#FF4E00] px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors duration-200 bg-transparent hover:bg-orange-50/70"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-gradient-to-r from-[#FF4E00] to-[#E64500] hover:from-[#E64500] hover:to-[#FF4E00] text-white px-4 py-1.5 rounded-xl text-sm font-semibold shadow-md transition-colors duration-200"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button and username */}
            <div className="md:hidden flex items-center gap-2">
              {isAuthenticated && user ? (
                <div className="relative group">
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-black/90 bg-orange-50/60 border border-orange-100 hover:bg-orange-100/80 focus:outline-none focus:ring-2 focus:ring-[#FF4E00] transition shadow-sm backdrop-blur-md"
                    onClick={() => setIsMobileDropdownOpen((open) => !open)}
                  >
                    <span className={`inline-block w-3 h-3 rounded-full border-2 border-white absolute -top-1 -right-1 ${user.status === 'free' ? 'bg-red-500' :
                      user.status === 'active' ? 'bg-yellow-400' :
                        user.status === 'kyc_verified' ? 'bg-green-500' :
                          user.status === 'blocked' ? 'bg-black' : 'bg-gray-300'
                      }`} title={user.status}></span>
                    <UserAvatar
                      imageUrl={user.imageUrl}
                      firstName={user.firstName}
                      lastName={user.lastName}
                      status={user.status}
                      size={20}
                      className="transition-transform duration-200 group-hover:scale-110"
                    />
                    <span className="hidden lg:inline font-semibold text-sm">{user.firstName}</span>
                    {isMobileDropdownOpen ? (
                      <X className="w-4 h-4 ml-1" />
                    ) : (
                      <Menu className="w-4 h-4 ml-1" />
                    )}
                  </button>
                  {/* Dropdown: visible only when isMobileDropdownOpen is true */}
                  <div className={`absolute right-0 mt-2 w-48 bg-white/95 border border-orange-100 rounded-2xl shadow-2xl z-50 origin-top-right backdrop-blur-xl scale-95 transition-all duration-200
                    ${isMobileDropdownOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible'}
                  `}>
                    {/* Arrow */}
                    <div className="absolute -top-2 right-8 w-4 h-4 bg-white border-t border-l border-orange-100 rotate-45 z-0"></div>
                    <div className="relative z-10 py-2 px-2 flex flex-col gap-1">
                      {user.role === "admin" && (
                        <button
                          onClick={() => { setIsMobileDropdownOpen(false); navigate("/admin"); }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-700 hover:bg-orange-50 hover:text-[#FF4E00] font-semibold transition"
                        >
                          <LayoutDashboard className="w-4 h-4 text-[#FF4E00]" />
                          Admin Dashboard
                        </button>
                      )}

                      {/* Mapped Navigation Items */}
                      {authenticatedNavItems.map((item) => renderNavItem(item, true))}

                      <button
                        onClick={() => { setIsMobileDropdownOpen(false); handleLogout(); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-700 hover:bg-orange-50 hover:text-[#FF4E00] font-semibold transition"
                      >
                        <LogOut className="w-4 h-4 text-[#FF4E00]" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-black/90 hover:text-[#FF4E00] px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors duration-200 bg-transparent hover:bg-orange-50/70"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-gradient-to-r from-[#FF4E00] to-[#E64500] hover:from-[#E64500] hover:to-[#FF4E00] text-white px-4 py-1.5 rounded-xl text-sm font-semibold shadow-md transition-colors duration-200"
                  >
                    Sign Up
                  </Link>
                </>
              )}
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-xl text-black hover:text-[#FF4E00] hover:bg-orange-50/70 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#FF4E00] transition-colors duration-200 shadow"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {/* Hamburger icon */}
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        {/* Backdrop */}
        <div className="fixed inset-0 top-14 bg-black/20 backdrop-blur-[2px] z-40" onClick={toggleMenu} />
        {/* Panel */}
        <div className="fixed inset-x-0 top-14 z-50">
          <div className="mx-3 rounded-2xl border border-orange-100 bg-white/95 shadow-2xl overflow-hidden">
            <div className="px-3 py-2">
              {publicNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold transition-colors duration-200 
                      ${isActive ? 'text-[#FF4E00] bg-orange-50/80' : 'text-black/90 hover:text-[#FF4E00] hover:bg-orange-50/60'}`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
            <div className="px-3 py-2">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <NotificationBell />
                    <span className="text-xs text-gray-600">Notifications</span>
                  </div>
                  <button
                    onClick={() => { setIsMenuOpen(false); navigate('/dashboard'); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold text-black/90 hover:bg-orange-50/70 hover:text-[#FF4E00] w-full text-left"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#FF4E00]" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                    className="mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold text-black/90 hover:bg-orange-50/70 hover:text-[#FF4E00] w-full text-left"
                  >
                    <LogOut className="w-4 h-4 text-[#FF4E00]" />
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 text-center text-black/90 hover:text-[#FF4E00] hover:bg-orange-50/70 px-3 py-2 rounded-xl text-[13px] font-semibold transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 text-center bg-gradient-to-r from-[#FF4E00] to-[#E64500] hover:from-[#E64500] hover:to-[#FF4E00] text-white px-3 py-2 rounded-xl text-[13px] font-semibold shadow-md transition-colors duration-200"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav >
  );
};

export default Navbar; 