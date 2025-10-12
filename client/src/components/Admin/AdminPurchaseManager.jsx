import {
  DollarSign,
  Download,
  Eye,
  Loader2,
  Package,
  Search,
  ShoppingCart,
  TrendingUp,
  Wallet
} from "lucide-react";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../../config/api";
import { useAuthStore } from "../../store/useAuthStore";

const PurchaseCard = ({ purchase, onViewDetails }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPackageColor = (packageName) => {
    switch (packageName) {
      case 'Elite Package':
        return 'bg-purple-100 text-purple-800';
      case 'Super Prime Package':
        return 'bg-blue-100 text-blue-800';
      case 'Prime Package':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
            <Package size={24} className="text-orange-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">{purchase.packageName}</h4>
            <p className="text-sm text-gray-500">ID: {purchase.purchaseId}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">₹{purchase.packagePrice}</p>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
            {purchase.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Purchaser</p>
          <p className="font-medium text-sm">{purchase.purchaserName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Date</p>
          <p className="font-medium text-sm">{new Date(purchase.purchaseDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Commission Distributed</p>
          <p className="font-medium text-sm text-green-600">₹{purchase.totalCommissionDistributed}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Levels Paid</p>
          <p className="font-medium text-sm">{purchase.commissionDistributions?.length || 0} levels</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPackageColor(purchase.packageName)}`}>
          {purchase.packageName}
        </span>
        <button
          onClick={() => onViewDetails(purchase)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
        >
          <Eye size={16} />
          View Details
        </button>
      </div>
    </div>
  );
};

const AdminPurchaseManager = () => {
  const { user, token } = useAuthStore();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("all");
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPurchases: 0,
    totalCommissions: 0,
    avgPurchaseValue: 0
  });

  useEffect(() => {
    if (user && token) {
      fetchPurchaseData();
    }
  }, [user, token, timeRange]);

  const fetchPurchaseData = async () => {
    try {
      setLoading(true);
      
      const [purchasesRes, statsRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.admin.purchases}?timeRange=${timeRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_ENDPOINTS.admin.purchases}/stats?timeRange=${timeRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [purchasesData, statsData] = await Promise.all([
        purchasesRes.json(),
        statsRes.json()
      ]);

      if (purchasesRes.ok && statsRes.ok) {
        setPurchases(purchasesData.data);
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Error fetching purchase data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = 
      purchase.purchaserName?.toLowerCase().includes(search.toLowerCase()) ||
      purchase.packageName?.toLowerCase().includes(search.toLowerCase()) ||
      purchase.purchaseId?.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filter === "all" || purchase.status === filter;

    return matchesSearch && matchesFilter;
  });

  const handleViewDetails = (purchase) => {
    setSelectedPurchase(purchase);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Loading purchase data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-8 px-4 sm:px-6 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Purchase Manager</h1>
          <p className="text-purple-100">Manage and track all package purchases and commissions</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <DollarSign size={24} className="text-white" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-800">₹{stats.totalRevenue?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <ShoppingCart size={24} className="text-white" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Purchases</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalPurchases || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Wallet size={24} className="text-white" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Commissions Paid</p>
                <p className="text-2xl font-bold text-gray-800">₹{stats.totalCommissions?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <TrendingUp size={24} className="text-white" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Avg Purchase</p>
                <p className="text-2xl font-bold text-gray-800">₹{stats.avgPurchaseValue?.toFixed(0) || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search purchases..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
              <Download size={16} />
              Export Data
            </button>
          </div>
        </div>

        {/* Purchases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPurchases.map((purchase) => (
            <PurchaseCard
              key={purchase.purchaseId}
              purchase={purchase}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>

        {filteredPurchases.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No purchases found</p>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Purchase Details Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Purchase Details</h3>
                <button
                  onClick={() => setSelectedPurchase(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Purchase Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Purchase ID</p>
                      <p className="font-medium">{selectedPurchase.purchaseId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Package</p>
                      <p className="font-medium">{selectedPurchase.packageName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-medium text-green-600">₹{selectedPurchase.packagePrice}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{new Date(selectedPurchase.purchaseDate).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Purchaser Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{selectedPurchase.purchaserName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">User ID</p>
                      <p className="font-medium">{selectedPurchase.purchaserId}</p>
                    </div>
                  </div>
                </div>

                {selectedPurchase.commissionDistributions && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Commission Distribution</h4>
                    <div className="space-y-2">
                      {selectedPurchase.commissionDistributions.map((dist, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{dist.sponsorName}</p>
                            <p className="text-sm text-gray-500">Level {dist.level} • {dist.percentage}%</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">₹{dist.amount}</p>
                            <p className="text-xs text-gray-500">{dist.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPurchaseManager; 