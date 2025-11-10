import {
  ArrowRight,
  Book,
  CreditCard,
  LayoutDashboard,
  Lock,
  Package,
  Shield,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Dynamic config based on section
const promptConfig = {
  dashboard: {
    title: 'Access Your Dashboard',
    message: 'Please log in to view your personalized dashboard.',
    buttonText: 'Login to Dashboard',
    icon: <LayoutDashboard className="w-8 h-8" />,
  },
  team: {
    title: 'Join Your Team',
    message: 'Please log in to collaborate with your team.',
    buttonText: 'Login to Team Area',
    icon: <Users className="w-8 h-8" />,
  },
  profile: {
    title: 'View Your Profile',
    message: 'Please log in to access your profile and settings.',
    buttonText: 'Login to Profile',
    icon: <User className="w-8 h-8" />,
  },
  package: {
    title: 'Choose Your Package',
    message: 'Please log in to choose your package.',
    buttonText: 'Login to Package',
    icon: <Package className="w-8 h-8" />,
  },
  kyc: {
    title: 'Verify Your Identity',
    message: 'Please log in to verify your identity.',
    buttonText: 'Login to KYC',
    icon: <Shield className="w-8 h-8" />,
  },
  payout: {
    title: 'Withdraw Your Earnings',
    message: 'Please log in to withdraw your earnings.',
    buttonText: 'Login to Payout',
    icon: <CreditCard className="w-8 h-8" />,
  },
  walletTransactions: {
    title: 'View Your Wallet',
    message: 'Please log in to view your wallet.',
    buttonText: 'Login to Wallet',
    icon: <Wallet className="w-8 h-8" />,
  },
  products: {
    title: 'View Our Products',
    message: 'Please log in to view our products.',
    buttonText: 'Login to Products',
    icon: <Package className="w-8 h-8" />,
  },
  superPackages: {
    title: 'Choose Your Super Package',
    message: 'Please log in to choose your super package.',
    buttonText: 'Login to Super Packages',
    icon: <Package className="w-8 h-8" />,
  },
  eBooks: {
    title: 'Download Your Ebooks',
    message: 'Please log in to download your ebooks.',
    buttonText: 'Login to Ebooks',
    icon: <Book className="w-8 h-8" />,
  },
  default: {
    title: 'Login Required',
    message: 'You need to log in to access this page.',
    buttonText: 'Login',
    icon: <Shield className="w-8 h-8" />,
  },
  socialEarning:{ 
    title: "Login Required",
    message: 'Please log in to see your social earning.',
    buttonText: "Login to Social Earning",
    icon: <Shield className="w-8 h-8" />,
  },
  directReferrals: {
    title: 'View Your Direct Referrals',
    message: 'Please log in to view your direct referrals.',
    buttonText: 'Login to Direct Referrals',
    icon: <Users className="w-8 h-8" />,
  },
  nominee: {
    title: 'Add Your Nominee',
    message: 'Please log in to add your nominee.',
    buttonText: 'Login to Add Nominee',
    icon: <User className="w-8 h-8" />,
  },
  recharge: {
    title: 'Login Required',
    message: 'Please log in to access recharge and bill payment services.',
    buttonText: 'Login to Recharge',
    icon: <Wallet className="w-8 h-8" />,
  },
};

const LoginPrompt = ({ type = 'default' }) => {
  const { title, message, buttonText, icon } = promptConfig[type] || promptConfig.default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 p-4 relative">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-orange-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              {icon}
            </div>
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            <p className="text-orange-100 text-sm">{message}</p>
          </div>

          {/* Content */}
          <div className="px-8 py-8 space-y-4">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-sm font-medium">View your profile information</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Lock className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-sm font-medium">Secure access to your account</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-sm font-medium">Manage your preferences</span>
            </div>

            <Link
              to="/login"
              className="block w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <User className="w-5 h-5" />
              {buttonText}
            </Link>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 text-center">
            <p className="text-gray-500 text-xs">
              Your data is protected with industry-standard security.
            </p>
          </div>
        </div>
      </div>

      {/* Decorative blobs */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-orange-200 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-orange-300 rounded-full opacity-20 blur-xl"></div>
    </div>
  );
};

export default LoginPrompt;
