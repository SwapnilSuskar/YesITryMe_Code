import {
  Activity,
  AlertCircle,
  Calendar,
  CalendarRange,
  CheckCircle,
  DollarSign,
  Loader2,
  PieChart,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import CountUp from "react-countup";
import api, { API_ENDPOINTS } from "../../config/api";
import { useAuthStore } from "../../store/useAuthStore";

const formatDateInput = (date) => date.toISOString().split("T")[0];

const getDateNDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const presetConfig = {
  today: {
    label: "Today",
    range: () => {
      const today = new Date();
      return {
        startDate: formatDateInput(today),
        endDate: formatDateInput(today),
      };
    },
    timeRange: "today",
  },
  last7: {
    label: "Last 7 Days",
    range: () => {
      const end = new Date();
      const start = getDateNDaysAgo(6);
      return {
        startDate: formatDateInput(start),
        endDate: formatDateInput(end),
      };
    },
    timeRange: "week",
  },
  last30: {
    label: "Last 30 Days",
    range: () => {
      const end = new Date();
      const start = getDateNDaysAgo(29);
      return {
        startDate: formatDateInput(start),
        endDate: formatDateInput(end),
      };
    },
    timeRange: "all",
  },
  thisMonth: {
    label: "This Month",
    range: () => {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth(), 1);
      return {
        startDate: formatDateInput(start),
        endDate: formatDateInput(end),
      };
    },
    timeRange: "month",
  },
  allTime: {
    label: "All Time",
    range: () => ({
      startDate: "",
      endDate: "",
    }),
    timeRange: "all",
  },
  custom: {
    label: "Custom",
    range: null,
    timeRange: "all",
  },
};

const formatNumber = (value, options = {}) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "0";
  return Number(value).toLocaleString("en-IN", options);
};

const formatCurrency = (value, options = { maximumFractionDigits: 0 }) =>
  `₹${formatNumber(Number(value) || 0, options)}`;

const StatCard = ({ title, value, subtitle, icon, color }) => {
  const palettes = {
    blue: {
      bg: "bg-gradient-to-br from-blue-50 to-blue-100",
      border: "border-blue-200",
      iconBg: "bg-blue-500",
      text: "text-blue-700",
    },
    green: {
      bg: "bg-gradient-to-br from-green-50 to-green-100",
      border: "border-green-200",
      iconBg: "bg-green-500",
      text: "text-green-700",
    },
    orange: {
      bg: "bg-gradient-to-br from-orange-50 to-orange-100",
      border: "border-orange-200",
      iconBg: "bg-orange-500",
      text: "text-orange-700",
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-50 to-purple-100",
      border: "border-purple-200",
      iconBg: "bg-purple-500",
      text: "text-purple-700",
    },
    gray: {
      bg: "bg-gradient-to-br from-gray-50 to-gray-100",
      border: "border-gray-200",
      iconBg: "bg-gray-500",
      text: "text-gray-700",
    },
  };

  const palette = palettes[color] || palettes.gray;
  const isNumeric = typeof value === "number";

  return (
    <div
      className={`${palette.bg} p-6 rounded-2xl border ${palette.border} shadow-lg hover:shadow-xl transition-all duration-300`}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`${palette.iconBg} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg`}
        >
          {icon}
        </div>
      </div>
      <h3 className="text-gray-700 font-semibold text-sm mb-1">{title}</h3>
      <p className={`${palette.text} font-bold text-2xl mb-1`}>
        {isNumeric ? <CountUp end={value} duration={1.2} separator="," /> : value}
      </p>
      <p className="text-gray-500 text-xs">{subtitle}</p>
    </div>
  );
};

const InsightCard = ({ label, value, helper, icon }) => (
  <div className="border border-gray-200 rounded-2xl p-4 bg-white shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-gray-500">{label}</p>
      <span className="text-orange-500">{icon}</span>
    </div>
    <p className="text-xl font-semibold text-gray-800">{value}</p>
    {helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
  </div>
);

const TrendRow = ({ date, revenue, orders }) => (
  <div className="flex items-center justify-between border-b border-gray-100 last:border-none py-3">
    <div>
      <p className="text-sm font-semibold text-gray-800">
        {new Date(date).toLocaleDateString()}
      </p>
      <p className="text-xs text-gray-500">{orders} orders</p>
    </div>
    <p className="text-sm font-semibold text-green-600">
      {formatCurrency(revenue)}
    </p>
  </div>
);

const AdminAnalytics = () => {
  const { user } = useAuthStore();
  const defaultRange = presetConfig.last7.range();
  const initialFilters = { preset: "last7", ...defaultRange };

  const [pendingFilters, setPendingFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [filterError, setFilterError] = useState("");
  const [analytics, setAnalytics] = useState({
    period: null,
    users: {
      total: 0,
      active: 0,
      kycApproved: 0,
      newInRange: 0,
      activatedInRange: 0,
    },
    referrals: {
      totalReferrals: 0,
      activeReferrers: 0,
      avgReferralsPerUser: 0,
      topReferrer: null,
    },
    purchases: {
      totalPurchases: 0,
      totalRevenue: 0,
      avgPurchaseValue: 0,
      packagesSold: {},
      trend: [],
    },
    commissions: {
      totalDistributed: 0,
      totalEarned: 0,
      avgCommissionPerUser: 0,
      topEarner: null,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async (filtersToUse) => {
    try {
      setLoading(true);
      setError("");

      const presetMeta =
        presetConfig[filtersToUse?.preset] || presetConfig.last7;
      const params = {
        timeRange: presetMeta.timeRange || "all",
      };

      if (filtersToUse?.startDate) params.startDate = filtersToUse.startDate;
      if (filtersToUse?.endDate) params.endDate = filtersToUse.endDate;

      const response = await api.get(
        `${API_ENDPOINTS.admin.analytics}/users`,
        { params }
      );

      if (response.data?.success && response.data?.data) {
        setAnalytics(response.data.data);
      } else {
        setError("Unable to parse analytics data");
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err.response?.data?.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchAnalytics(appliedFilters);
    }
  }, [user, appliedFilters, fetchAnalytics]);

  const handlePresetSelect = (presetKey) => {
    const preset = presetConfig[presetKey];
    if (!preset) return;

    if (presetKey === "custom") {
      setPendingFilters((prev) => ({
        ...prev,
        preset: "custom",
      }));
      return;
    }

    const range = preset.range ? preset.range() : { startDate: "", endDate: "" };
    const next = { preset: presetKey, ...range };
    setPendingFilters(next);
    setFilterError("");
    setAppliedFilters(next);
  };

  const handleDateChange = (field, value) => {
    setPendingFilters((prev) => ({
      ...prev,
      preset: "custom",
      [field]: value,
    }));
  };

  const handleApplyFilters = () => {
    if (pendingFilters.startDate && pendingFilters.endDate) {
      if (
        new Date(pendingFilters.startDate) > new Date(pendingFilters.endDate)
      ) {
        setFilterError("Start date cannot be after end date");
        return;
      }
    }
    setFilterError("");
    setAppliedFilters(pendingFilters);
  };

  const userStats = analytics.users || {};
  const purchaseStats = analytics.purchases || {};
  const referralStats = analytics.referrals || {};
  const commissionStats = analytics.commissions || {};

  const packageMix = useMemo(() => {
    const source = purchaseStats.packagesSold || {};
    return Object.entries(source)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [purchaseStats.packagesSold]);

  const purchaseTrend = purchaseStats.trend || [];
  const recentTrend = purchaseTrend.slice(-7).reverse();

  const activationRate = userStats.total
    ? ((userStats.active / userStats.total) * 100).toFixed(1)
    : "0.0";
  const kycRate = userStats.total
    ? ((userStats.kycApproved / userStats.total) * 100).toFixed(1)
    : "0.0";
  const conversionRate = userStats.total
    ? ((purchaseStats.totalPurchases / userStats.total) * 100).toFixed(1)
    : "0.0";
  const revenuePerUser = userStats.total
    ? purchaseStats.totalRevenue / userStats.total
    : 0;
  const avgOrdersPerDay = purchaseTrend.length
    ? (purchaseStats.totalPurchases / purchaseTrend.length).toFixed(1)
    : purchaseStats.totalPurchases || 0;

  const periodSummary = analytics.period
    ? `${new Date(analytics.period.start).toLocaleDateString()} – ${new Date(
        analytics.period.end
      ).toLocaleDateString()} (${
        analytics.period.days || purchaseTrend.length || 0
      } days)`
    : "Entire history";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-20 pb-12">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-8 px-4 sm:px-6 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
              <p className="text-orange-100 text-sm mt-1">
                Real-time view of user growth, sales, and payouts
              </p>
              <p className="text-sm text-white/80 mt-2 flex items-center gap-2">
                <CalendarRange size={16} />
                {periodSummary}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(presetConfig).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handlePresetSelect(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    pendingFilters.preset === key
                      ? "bg-white text-orange-600 shadow"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchAnalytics(appliedFilters)}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex flex-col text-sm text-gray-600">
              Start Date
              <div className="mt-2 relative">
                <Calendar
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="date"
                  value={pendingFilters.startDate || ""}
                  max={pendingFilters.endDate || undefined}
                  onChange={(e) => handleDateChange("startDate", e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </label>
            <label className="flex flex-col text-sm text-gray-600">
              End Date
              <div className="mt-2 relative">
                <Calendar
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="date"
                  value={pendingFilters.endDate || ""}
                  min={pendingFilters.startDate || undefined}
                  max={formatDateInput(new Date())}
                  onChange={(e) => handleDateChange("endDate", e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </label>
            <div className="flex items-end">
              <button
                onClick={handleApplyFilters}
                className="w-full px-4 py-3 bg-orange-500 text-white rounded-xl font-semibold shadow hover:bg-orange-600 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
          {filterError && (
            <p className="text-sm text-red-600 mt-3">{filterError}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={userStats.total || 0}
            subtitle="Registered members"
            icon={<Users size={22} />}
            color="blue"
          />
          <StatCard
            title="Total Revenue"
            value={purchaseStats.totalRevenue || 0}
            subtitle="Package sales value"
            icon={<DollarSign size={22} />}
            color="green"
          />
          <StatCard
            title="Total Purchases"
            value={purchaseStats.totalPurchases || 0}
            subtitle="Orders completed"
            icon={<ShoppingCart size={22} />}
            color="orange"
          />
          <StatCard
            title="Commissions Paid"
            value={commissionStats.totalDistributed || 0}
            subtitle="Network payouts"
            icon={<Wallet size={22} />}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <InsightCard
            label="Activation Rate"
            value={`${activationRate}%`}
            helper={`${formatNumber(userStats.active)} active of ${formatNumber(
              userStats.total
            )}`}
            icon={<Activity size={16} />}
          />
          <InsightCard
            label="KYC Approval Rate"
            value={`${kycRate}%`}
            helper={`${formatNumber(
              userStats.kycApproved
            )} verified profiles`}
            icon={<CheckCircle size={16} />}
          />
          <InsightCard
            label="Revenue / User"
            value={formatCurrency(revenuePerUser, {
              maximumFractionDigits: 0,
            })}
            helper="Lifetime average"
            icon={<TrendingUp size={16} />}
          />
          <InsightCard
            label="Orders Per Day"
            value={avgOrdersPerDay}
            helper="Based on selected period"
            icon={<PieChart size={16} />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Sales Performance
              </h3>
              <span className="text-sm text-gray-500">
                {formatNumber(packageMix.length)} packages sold
              </span>
            </div>
            {packageMix.length === 0 ? (
              <p className="text-sm text-gray-500">
                No package sales recorded for this period.
              </p>
            ) : (
              <div className="space-y-3">
                {packageMix.map((pkg) => {
                  const share =
                    purchaseStats.totalPurchases > 0
                      ? ((pkg.count / purchaseStats.totalPurchases) * 100).toFixed(
                          1
                        )
                      : 0;
                  return (
                    <div
                      key={pkg.name}
                      className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">{pkg.name}</p>
                        <p className="text-xs text-gray-500">{share}% of orders</p>
                      </div>
                      <span className="text-base font-semibold text-gray-800">
                        {pkg.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-4">
              Conversion rate:&nbsp;
              <span className="font-semibold text-gray-800">
                {conversionRate}%
              </span>{" "}
              of the active user base purchased during this window.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Revenue Trend
            </h3>
            {recentTrend.length === 0 ? (
              <p className="text-sm text-gray-500">
                No purchase activity in the selected window.
              </p>
            ) : (
              recentTrend.map((entry) => (
                <TrendRow
                  key={entry.date}
                  date={entry.date}
                  revenue={entry.revenue}
                  orders={entry.orders}
                />
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Referral Network
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                Total referrals:{" "}
                <span className="font-semibold">
                  {formatNumber(referralStats.totalReferrals)}
                </span>
              </p>
              <p>
                Active referrers:{" "}
                <span className="font-semibold">
                  {formatNumber(referralStats.activeReferrers)}
                </span>
              </p>
              <p>
                Avg referrals / user:{" "}
                <span className="font-semibold">
                  {(referralStats.avgReferralsPerUser || 0).toFixed(2)}
                </span>
              </p>
              <p>
                Top referrer:{" "}
                <span className="font-semibold">
                  {referralStats.topReferrer?.name || "—"}
                </span>
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Commission Payouts
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                Total distributed:{" "}
                <span className="font-semibold">
                  {formatCurrency(commissionStats.totalDistributed)}
                </span>
              </p>
              <p>
                Avg per user:{" "}
                <span className="font-semibold">
                  {formatCurrency(commissionStats.avgCommissionPerUser, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </p>
              <p>
                Top earner:{" "}
                <span className="font-semibold">
                  {commissionStats.topEarner?.name || "—"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            User Cohorts This Period
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InsightCard
              label="New Registrations"
              value={formatNumber(userStats.newInRange)}
              helper="Joined during selected range"
              icon={<Users size={16} />}
            />
            <InsightCard
              label="New Activations"
              value={formatNumber(userStats.activatedInRange)}
              helper="Became active in this period"
              icon={<Activity size={16} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
