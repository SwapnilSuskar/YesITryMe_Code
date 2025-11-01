import axios from "axios";

// Use environment variable with fallback to Vercel URL
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Helper to check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error parsing token:', error);
    return true;
  }
};

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    
    // Check if token is expired before making the request
    if (token && isTokenExpired(token)) {
      console.log('Token expired, clearing auth data...');
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
      localStorage.removeItem('adminSessionTimeout');
      
      // Reject the request to prevent unnecessary API calls
      return Promise.reject(new Error('Token expired'));
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // If the data is FormData, remove the Content-Type header to let the browser set it
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('🔒 401 Unauthorized - Token may be expired');
      
      // Clear stored auth data and redirect to login
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
      localStorage.removeItem('adminSessionTimeout');
      
      // Only redirect if we're not already on login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/admin/login') {
        // Show a user-friendly message
        if (window.confirm('Your session has expired. Please log in again.')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const API_ENDPOINTS = {
  base: API_URL,
  admin: {
    users: `${API_URL}/api/admin/users`,
    userDashboard: `${API_URL}/api/admin/users`,
    motivationQuotes: `${API_URL}/api/admin/motivation-quotes`,
    galleryImages: `${API_URL}/api/admin/gallery-images`,
    analytics: `${API_URL}/api/admin/analytics`,
    referrals: `${API_URL}/api/admin/referrals`,
    purchases: `${API_URL}/api/admin/purchases`,
    userActivate: `${API_URL}/api/admin/users/:id/activate`,
    userDeactivate: `${API_URL}/api/admin/users/:id/deactivate`,
    userKycApprove: `${API_URL}/api/admin/users/:id/kyc-approve`,
    userKycReject: `${API_URL}/api/admin/users/:id/kyc-reject`,
    userStatusUpdate: `${API_URL}/api/admin/users/:id/status`,
    withdrawalRequests: `${API_URL}/api/admin/withdrawal-requests`,
    approveWithdrawal: `${API_URL}/api/admin/withdrawal-requests/:requestId/approve`,
    rejectWithdrawal: `${API_URL}/api/admin/withdrawal-requests/:requestId/reject`,
    completeWithdrawal: `${API_URL}/api/admin/withdrawal-requests/:requestId/complete`,
  },
  auth: {
    signup: `${API_URL}/api/auth/signup`,
    login: `${API_URL}/api/auth/login`,
    sendOtp: `${API_URL}/api/auth/send-otp`,
    verifyOtp: `${API_URL}/api/auth/verify-otp`,
    checkMobile: `${API_URL}/api/auth/check-mobile`,
    referral: `${API_URL}/api/auth/referral`,
    forgotPasswordSendOtp: `${API_URL}/api/auth/forgot-password/send-otp`,
    forgotPasswordReset: `${API_URL}/api/auth/forgot-password/reset`,
    activeMotivationQuote: `${API_URL}/api/auth/motivation-quotes/active`,
    activeGalleryImages: `${API_URL}/api/auth/gallery-images/active`,
    adminSendOtp: `${API_URL}/api/auth/admin/send-otp`,
    adminLogin: `${API_URL}/api/auth/admin/login`,
    lookupSponsorById: `${API_URL}/api/auth/lookup-sponsor-by-id`,
    lookupSponsorByMobile: `${API_URL}/api/auth/lookup-sponsor-by-mobile`,
  },
  contact: {
    send: `${API_URL}/api/contact/send`,
  },
  packages: {
    available: `${API_URL}/api/packages/available`,
    purchase: `${API_URL}/api/packages/purchase`,
    purchases: `${API_URL}/api/packages/purchases`,
    commissionSummary: `${API_URL}/api/packages/commission/summary`,
    genealogy: `${API_URL}/api/packages/genealogy`,
    referrals: `${API_URL}/api/packages/referrals`,
    referralStats7Days: `${API_URL}/api/auth/referral-stats-7days`,
    downlineStats7Days: `${API_URL}/api/auth/downline-stats-7days`,
    totalPackageBuyers: `${API_URL}/api/auth/total-package-buyers`,
    referralTree: `${API_URL}/api/packages/referral-tree`,
    transactions: `${API_URL}/api/packages/commission/transactions`,
    topDownlinePerformers: `${API_URL}/api/auth/top-downline-performers`,
  },
  superPackages: {
    available: `${API_URL}/api/super-packages`,
    purchase: `${API_URL}/api/super-packages/purchase`,
    purchases: `${API_URL}/api/super-packages/purchases`,
    commissionSummary: `${API_URL}/api/super-packages/commission/summary`,
    genealogy: `${API_URL}/api/super-packages/genealogy`,
    referrals: `${API_URL}/api/super-packages/referrals`,
    referralTree: `${API_URL}/api/super-packages/referral-tree`,
    transactions: `${API_URL}/api/super-packages/commission/transactions`,
    paymentVerifications: `${API_URL}/api/super-packages/payments/verifications`,
    // Admin payment verification endpoints
    adminPaymentVerifications: `${API_URL}/api/super-packages/admin/payment-verifications`,
    updatePaymentVerificationStatus: `${API_URL}/api/super-packages/admin/payment-verifications`,
    // Super Package referral endpoints
    referralStats7Days: `${API_URL}/api/super-packages/referral-stats-7days`,
    downlineStats7Days: `${API_URL}/api/super-packages/downline-stats-7days`,
    totalSuperPackageBuyers: `${API_URL}/api/super-packages/total-super-package-buyers`,
  },
  funds: {
    userFunds: `${API_URL}/api/funds/user`,
    withdraw: `${API_URL}/api/funds/withdraw`,
    addFunds: `${API_URL}/api/funds/admin/add`,
    deductFunds: `${API_URL}/api/funds/admin/deduct`,
    allUsersWithFunds: `${API_URL}/api/funds/admin/users`,
    fundsSummary: `${API_URL}/api/funds/admin/summary`,
    topPerformers: `${API_URL}/api/auth/top-performers`,
  },
  specialIncome: {
    user: `${API_URL}/api/special-income/:userId`,
    withdraw: `${API_URL}/api/special-income/withdraw`,
    adminAll: `${API_URL}/api/special-income/admin/all`,
    adminSet: `${API_URL}/api/special-income`,
  },
  payout: {
    eligibility: `${API_URL}/api/payout/eligibility`,
    request: `${API_URL}/api/payout/request`,
    history: `${API_URL}/api/payout/history`,
    balance: `${API_URL}/api/payout/balance`,
    adminAll: `${API_URL}/api/payout/admin/all`,
    adminUpdateStatus: `${API_URL}/api/payout/admin/:payoutId/status`,
  },
  wallet: {
    userWallet: `${API_URL}/api/admin/users/:userId/wallet`,
    userWalletByMobile: `${API_URL}/api/admin/users/mobile/:mobile/wallet`,
    addMoney: `${API_URL}/api/admin/users/:userId/wallet/add`,
    deductMoney: `${API_URL}/api/admin/users/:userId/wallet/deduct`,
    transactions: `${API_URL}/api/admin/users/:userId/transactions`,
  },
  mlm: {
    level: `${API_URL}/api/mlm/level`,
    updateLevel: `${API_URL}/api/mlm/update-level`,
    teamStructure: `${API_URL}/api/mlm/team-structure`,
    usersByLevel: `${API_URL}/api/mlm/users/:level`,
    stats: `${API_URL}/api/mlm/stats`,
  },
  profile: {
    profilePhoto: `${API_URL}/api/auth/profile-photo`,
  },
  kyc: {
    submit: `${API_URL}/api/kyc/submit`,
    status: `${API_URL}/api/kyc/status`,
    adminApplications: `${API_URL}/api/kyc/admin/applications`,
    adminApplication: `${API_URL}/api/kyc/admin/applications`,
    adminApprove: `${API_URL}/api/kyc/admin/applications`,
    adminReject: `${API_URL}/api/kyc/admin/applications`,
    adminStats: `${API_URL}/api/kyc/admin/stats`,
  },
  payment: {
    submit: `${API_URL}/api/payment/submit`,
    status: `${API_URL}/api/payment/status`,
    adminVerifications: `${API_URL}/api/payment/admin/verifications`,
    adminVerification: `${API_URL}/api/payment/admin/verifications`,
    adminVerify: `${API_URL}/api/payment/admin/verifications`,
    adminReject: `${API_URL}/api/payment/admin/verifications`,
    adminStats: `${API_URL}/api/payment/admin/stats`,
  },
  notifications: {
    all: `${API_URL}/api/notifications`,
    stream: `${API_URL}/api/notifications/stream`,
    unreadCount: `${API_URL}/api/notifications/unread-count`,
    markAsRead: `${API_URL}/api/notifications/:notificationId/read`,
    markAllAsRead: `${API_URL}/api/notifications/mark-all-read`,
    delete: `${API_URL}/api/notifications/:notificationId`,
  },
  courses: {
    all: `${API_URL}/api/courses`,
    byId: `${API_URL}/api/courses/:courseId`,
    create: `${API_URL}/api/courses`,
    update: `${API_URL}/api/courses/:courseId`,
    delete: `${API_URL}/api/courses/:courseId`,
    addSection: `${API_URL}/api/courses/:courseId/sections`,
    updateSection: `${API_URL}/api/courses/:courseId/sections/:sectionIndex`,
    deleteSection: `${API_URL}/api/courses/:courseId/sections/:sectionIndex`,
    addLecture: `${API_URL}/api/courses/:courseId/sections/:sectionIndex/lectures`,
    updateLecture: `${API_URL}/api/courses/:courseId/sections/:sectionIndex/lectures/:lectureIndex`,
    deleteLecture: `${API_URL}/api/courses/:courseId/sections/:sectionIndex/lectures/:lectureIndex`,
  },
  social: {
    youtubeOAuthStart: `${API_URL}/api/social/youtube/oauth/start`,
    youtubeOAuthCallback: `${API_URL}/api/social/youtube/oauth/callback`,
    youtubeStatus: `${API_URL}/api/social/youtube/status`,
    youtubeChannel: `${API_URL}/api/social/youtube/channel`,
    youtubeDisconnect: `${API_URL}/api/social/youtube/disconnect`,
    tasks: `${API_URL}/api/social/tasks`,
    verify: `${API_URL}/api/social/verify`,
    publicVerify: `${API_URL}/api/social/public/verify`,
    adminTasks: `${API_URL}/api/social/admin/tasks`,
    adminToggleTask: `${API_URL}/api/social/admin/tasks/:taskId/toggle`,
  },
  coins: {
    balance: `${API_URL}/api/coins/balance`,
    activationBonus: `${API_URL}/api/coins/activation-bonus`,
    withdraw: `${API_URL}/api/coins/withdraw`,
    transactions: `${API_URL}/api/coins/transactions`,
    adminUsers: `${API_URL}/api/coins/admin/users`,
    adminAdjust: `${API_URL}/api/coins/admin/adjust`,
    adminWithdrawals: `${API_URL}/api/coins/admin/withdrawals`,
    adminProcessWithdrawal: `${API_URL}/api/coins/admin/withdrawals/process`,
  },
  nominee: {
    get: `${API_URL}/api/nominee/:userId`,
    createOrUpdate: `${API_URL}/api/nominee/:userId`,
    delete: `${API_URL}/api/nominee/:userId`,
    adminAll: `${API_URL}/api/nominee/`,
  },
  recharge: {
    plans: `${API_URL}/api/recharge/plans`,
    initiate: `${API_URL}/api/recharge/initiate`,
    status: `${API_URL}/api/recharge/status`,
    history: `${API_URL}/api/recharge/history`,
    adminAll: `${API_URL}/api/recharge/admin/all`,
    adminStats: `${API_URL}/api/recharge/admin/stats`,
    adminUpdate: `${API_URL}/api/recharge/admin/:rechargeId`,
    adminDelete: `${API_URL}/api/recharge/admin/:rechargeId`,
  },
};
