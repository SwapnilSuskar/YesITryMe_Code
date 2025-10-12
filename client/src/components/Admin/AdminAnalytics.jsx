import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Info,
  Loader2,
  ShoppingCart,
  UserCheck,
  Users,
  Wallet
} from "lucide-react";
import { useEffect, useState } from "react";
import CountUp from "react-countup";
import { API_ENDPOINTS } from "../../config/api";
import { useAuthStore } from "../../store/useAuthStore";

const StatCard = ({ title, value, subtitle, icon, color, trend, trendValue }) => {
  const getColorClasses = (color) => {
    switch (color) {
      case "green":
        return {
          bg: "bg-gradient-to-br from-green-50 to-green-100",
          border: "border-green-200",
          iconBg: "bg-green-500",
          text: "text-green-700",
          trend: "text-green-600"
        };
      case "blue":
        return {
          bg: "bg-gradient-to-br from-blue-50 to-blue-100",
          border: "border-blue-200",
          iconBg: "bg-blue-500",
          text: "text-blue-700",
          trend: "text-blue-600"
        };
      case "orange":
        return {
          bg: "bg-gradient-to-br from-orange-50 to-orange-100",
          border: "border-orange-200",
          iconBg: "bg-orange-500",
          text: "text-orange-700",
          trend: "text-orange-600"
        };
      case "purple":
        return {
          bg: "bg-gradient-to-br from-purple-50 to-purple-100",
          border: "border-purple-200",
          iconBg: "bg-purple-500",
          text: "text-purple-700",
          trend: "text-purple-600"
        };
      default:
        return {
          bg: "bg-gradient-to-br from-gray-50 to-gray-100",
          border: "border-gray-200",
          iconBg: "bg-gray-500",
          text: "text-gray-700",
          trend: "text-gray-600"
        };
    }
  };

  const colors = getColorClasses(color);

  // Safely handle the value for CountUp
  const getDisplayValue = () => {
    if (typeof value === 'string') {
      // If it's already a formatted string (like "₹1,000"), return as is
      return value;
    }

    if (typeof value === 'number') {
      // Check if this is a currency value (title contains "Revenue" or "Commission")
      if (title.includes('Revenue') || title.includes('Commission') || title.includes('Paid')) {
        return `₹${value.toLocaleString()}`;
      }
      // For other numeric values, just format with commas
      return value.toLocaleString();
    }

    // Fallback for undefined/null values
    return '0';
  };

  return (
    <div className={`${colors.bg} p-6 rounded-2xl border ${colors.border} shadow-lg hover:shadow-xl transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${colors.iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
          <span className="text-white">{icon}</span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${colors.trend}`}>
            {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {trendValue}%
          </div>
        )}
      </div>
      <h3 className="text-gray-700 font-semibold text-sm mb-1">{title}</h3>
      <p className={`${colors.text} font-bold text-2xl mb-1`}>
        {typeof value === 'number' ? (
          <CountUp end={value} duration={1.5} separator="," />
        ) : (
          getDisplayValue()
        )}
      </p>
      <p className="text-gray-500 text-xs">{subtitle}</p>
    </div>
  );
};

const AdminAnalytics = () => {
  const { user, token } = useAuthStore();
  const [analytics, setAnalytics] = useState({
    users: {
      total: 0,
      active: 0,
      kycApproved: 0,
      newThisMonth: 0
    },
    referrals: {
      totalReferrals: 0,
      activeReferrers: 0,
      avgReferralsPerUser: 0,
      topReferrer: null
    },
    purchases: {
      totalPurchases: 0,
      totalRevenue: 0,
      avgPurchaseValue: 0,
      packagesSold: {}
    },
    commissions: {
      totalDistributed: 0,
      totalEarned: 0,
      avgCommissionPerUser: 0,
      topEarner: null
    }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && token) {
      fetchAnalytics();
    }
  }, [user, token, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      // Use the correct analytics endpoint
      const response = await fetch(`${API_ENDPOINTS.admin.analytics}/users?timeRange=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setAnalytics(data.data);
        } else {
          // If the API doesn't return the expected structure, use default values
        }
      } else {
        // Use default data if API is not available
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
      // Use default data on error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 mb-2">Error loading analytics</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-8 px-4 sm:px-6 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
              <p className="text-orange-100">Comprehensive overview of your referral system</p>
            </div>
            <div className="flex gap-2">
              {['all', 'month', 'week', 'today'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${timeRange === range
                      ? 'bg-white text-orange-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Analytics Data Notice */}
        {!analytics.users?.total && !analytics.purchases?.totalPurchases && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              <p className="text-blue-800">
                Analytics data is loading or not available. Showing default values.
              </p>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={analytics.users?.total || 0}
            subtitle="Registered users"
            icon={<Users size={24} />}
            color="blue"
            trend="up"
            trendValue={12}
          />
          <StatCard
            title="Total Revenue"
            value={analytics.purchases?.totalRevenue || 0}
            subtitle="From package sales"
            icon={<DollarSign size={24} />}
            color="green"
            trend="up"
            trendValue={8}
          />
          <StatCard
            title="Total Referrals"
            value={analytics.referrals?.totalReferrals || 0}
            subtitle="Network growth"
            icon={<UserCheck size={24} />}
            color="orange"
            trend="up"
            trendValue={15}
          />
          <StatCard
            title="Commissions Paid"
            value={analytics.commissions?.totalDistributed || 0}
            subtitle="To referrers"
            icon={<Wallet size={24} />}
            color="purple"
            trend="up"
            trendValue={20}
          />
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Analytics */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={24} className="text-blue-500" />
              User Analytics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Active Users</span>
                <span className="font-bold text-blue-600">{analytics.users?.active || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">KYC Approved</span>
                <span className="font-bold text-green-600">{analytics.users?.kycApproved || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-gray-700">New This Month</span>
                <span className="font-bold text-orange-600">{analytics.users?.newThisMonth || 0}</span>
              </div>
            </div>
          </div>

          {/* Purchase Analytics */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ShoppingCart size={24} className="text-green-500" />
              Purchase Analytics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Total Purchases</span>
                <span className="font-bold text-green-600">{analytics.purchases?.totalPurchases || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Average Purchase</span>
                <span className="font-bold text-blue-600">₹{(analytics.purchases?.avgPurchaseValue || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-gray-700">Conversion Rate</span>
                <span className="font-bold text-purple-600">
                  {analytics.users?.total > 0 ? (((analytics.purchases?.totalPurchases || 0) / analytics.users.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Referral Analytics */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <UserCheck size={24} className="text-orange-500" />
              Referral Analytics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-gray-700">Active Referrers</span>
                <span className="font-bold text-orange-600">{analytics.referrals?.activeReferrers || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Avg Referrals/User</span>
                <span className="font-bold text-blue-600">{(analytics.referrals?.avgReferralsPerUser || 0).toFixed(1)}</span>
              </div>
              {analytics.referrals?.topReferrer && (
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700">Top Referrer</span>
                  <span className="font-bold text-green-600">{analytics.referrals.topReferrer.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Commission Analytics */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Wallet size={24} className="text-purple-500" />
              Commission Analytics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-gray-700">Total Earned</span>
                <span className="font-bold text-purple-600">₹{(analytics.commissions?.totalEarned || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Avg Commission/User</span>
                <span className="font-bold text-green-600">₹{(analytics.commissions?.avgCommissionPerUser || 0).toFixed(2)}</span>
              </div>
              {analytics.commissions?.topEarner && (
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-gray-700">Top Earner</span>
                  <span className="font-bold text-orange-600">{analytics.commissions.topEarner.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics; 