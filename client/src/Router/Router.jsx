import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Package from '../components/Pages/Package';
import About from '../components/Pages/About';
import Login from '../components/Auth/Login';
import Signup from '../components/Auth/Signup';
import AdminLogin from '../components/Auth/AdminLogin';
import TermsAndConditions from '../components/Pages/TermsAndConditions';
import PrivacyPolicy from '../components/Pages/PrivacyPolicy';
import Footer from '../components/UI/Footer';
import { Outlet } from 'react-router-dom';
import WelcomeBanner from '../components/UI/WelcomeBanner';
import MoreAboutDirector from '../components/UI/MoreAboutDirector';
import Navbar from '../components/Navbar';
import ForgotPassword from '../components/Auth/ForgotPassword';
import Dashboard from '../components/User/Dashboard';
import ContactUs from '../components/Pages/ContactUs';
import FAQ from '../components/Pages/FAQ';
import AdminDashboard from '../components/Admin/AdminDashboard';
import AdminActivationTracker from '../components/Admin/AdminActivationTracker';
import AdminAnalytics from '../components/Admin/AdminAnalytics';
import AdminPurchaseManager from '../components/Admin/AdminPurchaseManager';
import AdminRechargeAnalysis from '../components/Admin/AdminRechargeAnalysis';
import AdminWalletTopUpManager from '../components/Admin/AdminWalletTopUpManager';
import AdminFundsManager from '../components/Admin/AdminFundsManager';
import KycManager from '../components/Admin/KycManager';
import MotivationQuotes from '../components/Admin/MotivationQuotes';
import GalleryManager from '../components/Admin/GalleryManager';
import PaymentManager from '../components/Admin/PaymentManager';
import PayoutManager from '../components/Admin/PayoutManager';
import UserStatusManager from '../components/Admin/UserStatusManager';
import UserDashboardViewer from '../components/Admin/UserDashboardViewer';
import WalletManager from '../components/Admin/WalletManager';
import ProtectedAdminRoute from '../components/Admin/ProtectedAdminRoute';
import Profile from '../components/User/Profile';
import AffiliateLink from '../components/User/AffiliateLink';
import Leaderboard from '../components/User/Leaderboard';
import Team from '../components/User/Team';
import Courses from '../components/Pages/Course';
import KycDetailForm from '../components/User/KycDetailForm';
import Payout from '../components/User/Payout';
import WalletTransactions from '../components/User/WalletTransactions';
import MyTeam from '../components/User/MyTeam';
import DirectReferrals from '../components/User/DirectReferrals';
import Gallery from '../components/Pages/Gallery';
import CourseDetail from '../components/Pages/CourseDetail';
import Products from '../components/Pages/Products';
import ProductDetail from '../components/Pages/ProductDetail';
import ProductManager from '../components/Admin/ProductManager';
import SuperPackagePaymentManager from '../components/Admin/SuperPackagePaymentManager';
import SuperPackageManager from '../components/Admin/SuperPackageManager';
import SuperPackages from '../components/User/SuperPackages';
import Ebooks from '../components/Pages/Ebooks';
import AiTools from '../components/Pages/AiTools';
import AiToolsDetailer from '../components/Pages/AiToolsDetailer';
import WithdrawalRequests from '../components/Admin/WithdrawalRequests';
import AiToolManager from '../components/Admin/AiToolManager';
import SocialEarning from '../components/User/SocialEarning';
import SocialTasks from '../components/Admin/SocialTasks';
import PublicTask from '../components/Pages/PublicTask';
import Nominee from '../components/User/Nominee';
import Recharge from '../components/User/Recharge';
import MobileRecharge from '../components/User/MobileRecharge';
import PlanConfirmation from '../components/User/PlanConfirmation';
import RechargeSuccess from '../components/User/RechargeSuccess';
import NotFound from '../components/Pages/NotFound';

const LayoutWithNavbar = () => {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
};

// Admin layout with Navbar and Footer
const AdminLayout = () => {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
};

// Home page component that combines WelcomeBanner and MoreAboutDirector
const HomePage = () => (
  <>
    <WelcomeBanner />
    <MoreAboutDirector />
    <FAQ />
  </>
)

// Referral-aware home route
const HomeOrReferral = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const referrerCode = urlParams.get('referrer_code');
  if (referrerCode) {
    return <Navigate to={`/signup?referrer_code=${referrerCode}`} replace />;
  }
  return <HomePage />;
};

const AppRouter = () => {
  const location = useLocation();

  // Scroll to top on route change for routes without navbar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <Routes>
      {/* Special App Homepage Route (without navbar) */}

      {/* Grouped routes with Navbar */}
      <Route element={<LayoutWithNavbar />}>
        <Route path="/" element={<HomeOrReferral />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/public-task" element={<PublicTask />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/terms-of-service" element={<TermsAndConditions />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:courseId" element={<CourseDetail />} />
        <Route path="/packages" element={<Package />} />
        <Route path="/ebooks" element={<Ebooks />} />
        <Route path="/super-packages" element={<SuperPackages />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/ai-tools/:toolName" element={<AiToolsDetailer />} />
        <Route path="/ai-tools" element={<AiTools />} />
        <Route path="/about" element={<About />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/direct-referrals" element={<DirectReferrals />} />
        <Route path="/socialearning" element={<SocialEarning />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-team" element={<MyTeam />} />
        <Route path="/kyc" element={<KycDetailForm />} />
        <Route path="/payout" element={<Payout />} />
        <Route path="wallet-transactions" element={<WalletTransactions />} />
        <Route path="/affiliate-link" element={<AffiliateLink />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/team" element={<Team />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/nominee" element={<Nominee />} />
        <Route path="/recharge" element={<Recharge />} />
        <Route path="/recharge/mobile" element={<MobileRecharge />} />
        <Route path="/recharge/plan-confirmation" element={<PlanConfirmation />} />
        <Route path="/recharge/success" element={<RechargeSuccess />} />
      </Route>

      {/* Admin routes with their own layout */}
      <Route path="/admin" element={
        <ProtectedAdminRoute>
          <AdminLayout />
        </ProtectedAdminRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="activations" element={<AdminActivationTracker />} />
        <Route path="purchases" element={<AdminPurchaseManager />} />
        <Route path="quotes" element={<MotivationQuotes />} />
        <Route path="gallery" element={<GalleryManager />} />
        <Route path="funds" element={<AdminFundsManager />} />
        <Route path="kyc" element={<KycManager />} />
        <Route path="payments" element={<PaymentManager />} />
        <Route path="payouts" element={<PayoutManager />} />
        <Route path="user-status" element={<UserStatusManager />} />
        <Route path="user-dashboard-viewer" element={<UserDashboardViewer />} />
        <Route path="product-manager" element={<ProductManager />} />
        <Route path="ai-tools" element={<AiToolManager />} />
        <Route path="super-packages" element={<SuperPackageManager />} />
        <Route path="super-package-payments" element={<SuperPackagePaymentManager />} />
        <Route path="admin-social-tasks" element={<SocialTasks />} />
        <Route path="coin-withdrawal-requests" element={<WithdrawalRequests />} />
        <Route path="wallet-manager" element={<WalletManager />} />
        <Route path="recharge-analysis" element={<AdminRechargeAnalysis />} />
        <Route path="wallet-topup-manager" element={<AdminWalletTopUpManager />} />
      </Route>

      {/* Catch-all route for 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;