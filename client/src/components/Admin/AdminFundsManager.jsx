import {
  AlertCircle,
  Bike,
  Car,
  ChevronLeft,
  ChevronRight,
  Crown,
  Gift,
  Home,
  Laptop,
  Loader2,
  Minus,
  Plane,
  Plus,
  Search,
  Smartphone,
  Star,
  Wallet,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import api, { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from "../../store/useAuthStore";

const AdminFundsManager = () => {
  const { user, token } = useAuthStore();
  const [usersWithFunds, setUsersWithFunds] = useState([]);
  const [fundsSummary, setFundsSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFundsModal, setShowFundsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [usersWithSpecialIncome, setUsersWithSpecialIncome] = useState([]);
  const [specialIncomeLoading, setSpecialIncomeLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 25,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationLoading, setPaginationLoading] = useState(false);

  // Combined fund types including special income
  const allFundTypes = [
    { key: 'mobileFund', label: 'Mobile Fund', icon: Smartphone, color: 'text-blue-500', category: 'regular' },
    { key: 'laptopFund', label: 'Laptop Fund', icon: Laptop, color: 'text-purple-500', category: 'regular' },
    { key: 'bikeFund', label: 'Bike Fund', icon: Bike, color: 'text-green-500', category: 'regular' },
    { key: 'carFund', label: 'Car Fund', icon: Car, color: 'text-red-500', category: 'regular' },
    { key: 'houseFund', label: 'House Fund', icon: Home, color: 'text-indigo-500', category: 'regular' },
    { key: 'travelFund', label: 'Travel Fund', icon: Plane, color: 'text-pink-500', category: 'regular' },
    { key: 'leaderShipFund', label: 'Leadership Fund', icon: Crown, color: 'text-yellow-500', category: 'special' },
    { key: 'royaltyIncome', label: 'Royalty Income', icon: Star, color: 'text-orange-500', category: 'special' },
    { key: 'rewardIncome', label: 'Reward Income', icon: Gift, color: 'text-emerald-500', category: 'special' }
  ];

  useEffect(() => {
    fetchUsersWithFunds();
    fetchFundsSummary();
    fetchUsersWithSpecialIncome();
  }, [user, token]);

  useEffect(() => {
    fetchUsersWithFunds();
  }, [currentPage]);

  const fetchUsersWithFunds = async () => {
    try {
      setLoading(true);
      setPaginationLoading(true);
      setError("");
      const res = await api.get(`${API_ENDPOINTS.funds.allUsersWithFunds}?page=${currentPage}&limit=${pagination.limit}`);
      setUsersWithFunds(res.data.data || []);
      setPagination(res.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
        limit: 25,
        hasNextPage: false,
        hasPrevPage: false
      });
    } catch (err) {
      setUsersWithFunds([]);
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  };

  const fetchFundsSummary = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.funds.fundsSummary);
      setFundsSummary(res.data.data || null);
    } catch (err) {
      setFundsSummary(null);
      console.error("Failed to fetch funds summary:", err);
    }
  };

  const fetchUsersWithSpecialIncome = async () => {
    try {
      setSpecialIncomeLoading(true);
      const res = await api.get(API_ENDPOINTS.specialIncome.adminAll);
      setUsersWithSpecialIncome(res.data.data || []);
    } catch (err) {
      setUsersWithSpecialIncome([]);
      console.error("Failed to fetch users with special income:", err);
    } finally {
      setSpecialIncomeLoading(false);
    }
  };

  const handleFundsAction = async (formData) => {
    setActionLoading(true);
    try {
      let res;

      // Determine if it's a special income or regular fund
      const isSpecialIncome = ['leaderShipFund', 'royaltyIncome', 'rewardIncome'].includes(formData.fundType);

      if (isSpecialIncome) {
        // Handle special income
        const specialIncomeData = {
          userId: formData.userId,
          [formData.fundType]: formData.amount,
          adminNotes: formData.adminNotes,
          action: formData.action
        };
        res = await api.post(API_ENDPOINTS.specialIncome.adminSet, specialIncomeData);
      } else {
        // Handle regular funds
        if (formData.action === 'add') {
          res = await api.post(API_ENDPOINTS.funds.addFunds, formData);
        } else {
          res = await api.post(API_ENDPOINTS.funds.deductFunds, formData);
        }
      }

      alert(res.data.message);
      setShowFundsModal(false);
      fetchUsersWithFunds();
      fetchFundsSummary();
      fetchUsersWithSpecialIncome();
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorMessage = err.response.data.errors.join('\n');
        alert(`Validation Errors:\n${errorMessage}`);
      } else {
        alert(err.response?.data?.message || "Failed to process funds action");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Merge users with their special income data
  const mergedUsers = usersWithFunds.map(user => {
    const specialIncome = usersWithSpecialIncome.find(si => si.userId === user.userId);
    return {
      ...user,
      specialIncome: specialIncome || {
        leaderShipFund: 0,
        royaltyIncome: 0,
        rewardIncome: 0
      }
    };
  });

  // Reset pagination when search changes
  useEffect(() => {
    if (search) {
      setCurrentPage(1);
    }
  }, [search]);

  const filteredUsers = mergedUsers.filter(user => {
    const q = search.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(q) ||
      user.lastName?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.mobile?.toLowerCase().includes(q) ||
      user.userId?.toLowerCase().includes(q)
    );
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Calculate total funds for a user (regular + special)
  const calculateUserTotalFunds = (user) => {
    const regularFunds = user.funds?.totalFunds || 0;
    const specialFunds = (user.specialIncome?.leaderShipFund || 0) +
      (user.specialIncome?.royaltyIncome || 0) +
      (user.specialIncome?.rewardIncome || 0);
    return regularFunds + specialFunds;
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col items-center py-6 sm:py-12 px-3 sm:px-4 pt-16 sm:pt-20 overflow-x-hidden">
      {/* Blurred Gradient Blobs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-[#FF4E00] to-orange-500 rounded-full blur-3xl opacity-20 z-0" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20 z-0" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-pink-400 to-red-400 rounded-full blur-3xl opacity-20 z-0" />

      <div className="w-full max-w-7xl relative z-10">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-6 md:p-8 mb-4 sm:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800 drop-shadow-lg flex items-center gap-2 sm:gap-3">
                <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500 flex-shrink-0" /> Funds Management
              </h1>
              <p className="text-gray-600 mt-2 text-xs sm:text-sm">Manage user funds and special income across all categories</p>
            </div>
            {fundsSummary && (
              <div className="flex flex-wrap gap-2 sm:gap-4 justify-center md:justify-end">
                <div className="bg-white/90 backdrop-blur rounded-2xl px-6 py-3 flex flex-col items-center shadow border border-orange-100">
                  <span className="text-lg font-bold text-[#FF4E00]">{fundsSummary.totalUsers}</span>
                  <span className="text-xs text-gray-600">Total Users</span>
                </div>
                <div className="bg-white/90 backdrop-blur rounded-2xl px-6 py-3 flex flex-col items-center shadow border border-green-100">
                  <span className="text-lg font-bold text-green-500">{formatCurrency(fundsSummary.totalFunds.grandTotal)}</span>
                  <span className="text-xs text-gray-600">Total Funds</span>
                </div>
                <div className="bg-white/90 backdrop-blur rounded-2xl px-6 py-3 flex flex-col items-center shadow border border-blue-100">
                  <span className="text-lg font-bold text-blue-500">{formatCurrency(fundsSummary.averageFunds.grandTotal)}</span>
                  <span className="text-xs text-gray-600">Avg per User</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Combined Funds Summary Cards */}
        {fundsSummary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-8">
            {allFundTypes.map((fundType) => {
              const Icon = fundType.icon;
              const isSpecial = fundType.category === 'special';
              const value = isSpecial ?
                (fundsSummary.specialIncome?.[fundType.key] || 0) :
                (fundsSummary.totalFunds[fundType.key] || 0);

              return (
                <div key={fundType.key} className={`bg-white/80 backdrop-blur rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 p-3 sm:p-6 ${isSpecial ? 'ring-2 ring-purple-200' : ''}`}>
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${fundType.color} flex-shrink-0`} />
                    <h3 className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{fundType.label}</h3>
                    {isSpecial && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">Special</span>}
                  </div>
                  <div className="text-base sm:text-2xl font-bold text-gray-800 truncate" title={formatCurrency(value)}>
                    {formatCurrency(value)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
                    {isSpecial ? 'Special Income' : 'Regular Fund'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Search and Actions */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur"
              />
            </div>
            <div className="flex gap-3 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Show:</label>
                <select
                  value={pagination.limit}
                  onChange={(e) => {
                    setPagination(prev => ({ ...prev, limit: parseInt(e.target.value) }));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
                <span className="text-sm text-gray-600">per page</span>
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setShowFundsModal(true);
                }}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Manage Funds
              </button>
            </div>
          </div>
        </div>

        {/* Combined Users Table - Desktop */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {loading || specialIncomeLoading ? (
            <div className="p-6 sm:p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" />
              <p className="text-gray-600 mt-2 text-sm sm:text-base">Loading users...</p>
            </div>
          ) : error ? (
            <div className="p-6 sm:p-8 text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
              <p className="text-red-600 mt-2 text-sm sm:text-base">{error}</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-left font-semibold text-sm">User</th>
                      <th className="px-4 lg:px-6 py-3 text-left font-semibold text-sm">Mobile</th>
                      <th className="px-4 lg:px-6 py-3 text-left font-semibold text-sm">Laptop</th>
                      <th className="px-4 lg:px-6 py-3 text-left font-semibold text-sm">Bike</th>
                      <th className="px-4 lg:px-6 py-3 text-left font-semibold text-sm">Car</th>
                      <th className="px-4 lg:px-6 py-3 text-left font-semibold text-sm">House</th>
                      <th className="px-4 lg:px-6 py-3 text-left font-semibold text-sm">Travel</th>
                      <th className="px-4 lg:px-6 py-3 text-left font-semibold text-sm bg-purple-600">Leadership</th>
                      <th className="px-4 lg:px-6 py-3 text-left font-semibold text-sm bg-purple-600">Royalty</th>
                      <th className="px-4 lg:px-6 py-3 text-left font-semibold text-sm bg-purple-600">Reward</th>
                      <th className="px-4 lg:px-6 py-3 text-left font-semibold text-sm">Total</th>
                      <th className="px-4 lg:px-6 py-3 text-left font-semibold text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 lg:px-6 py-3">
                          <div>
                            <div className="font-semibold text-gray-800 text-sm">{user.firstName} {user.lastName}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[140px]">{user.email}</div>
                            <div className="text-xs text-gray-400">ID: {user.userId}</div>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-3 font-mono text-xs">{formatCurrency(user.funds?.mobileFund)}</td>
                        <td className="px-4 lg:px-6 py-3 font-mono text-xs">{formatCurrency(user.funds?.laptopFund)}</td>
                        <td className="px-4 lg:px-6 py-3 font-mono text-xs">{formatCurrency(user.funds?.bikeFund)}</td>
                        <td className="px-4 lg:px-6 py-3 font-mono text-xs">{formatCurrency(user.funds?.carFund)}</td>
                        <td className="px-4 lg:px-6 py-3 font-mono text-xs">{formatCurrency(user.funds?.houseFund)}</td>
                        <td className="px-4 lg:px-6 py-3 font-mono text-xs">{formatCurrency(user.funds?.travelFund)}</td>
                        <td className="px-4 lg:px-6 py-3 font-mono text-xs bg-purple-50">{formatCurrency(user.specialIncome?.leaderShipFund)}</td>
                        <td className="px-4 lg:px-6 py-3 font-mono text-xs bg-purple-50">{formatCurrency(user.specialIncome?.royaltyIncome)}</td>
                        <td className="px-4 lg:px-6 py-3 font-mono text-xs bg-purple-50">{formatCurrency(user.specialIncome?.rewardIncome)}</td>
                        <td className="px-4 lg:px-6 py-3 font-mono text-sm font-semibold text-green-600">{formatCurrency(calculateUserTotalFunds(user))}</td>
                        <td className="px-4 lg:px-6 py-3">
                          <button onClick={() => { setSelectedUser(user); setShowFundsModal(true); }} className="px-2 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold hover:bg-orange-200 transition-colors">Manage</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile card view */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <div key={user._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-800 text-sm">{user.firstName} {user.lastName}</div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                        <div className="text-xs text-gray-400">ID: {user.userId}</div>
                      </div>
                      <button onClick={() => { setSelectedUser(user); setShowFundsModal(true); }} className="flex-shrink-0 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold hover:bg-orange-200">Manage</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between"><span className="text-gray-500">Mobile:</span><span className="font-mono">{formatCurrency(user.funds?.mobileFund)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Laptop:</span><span className="font-mono">{formatCurrency(user.funds?.laptopFund)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Leadership:</span><span className="font-mono">{formatCurrency(user.specialIncome?.leaderShipFund)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Royalty:</span><span className="font-mono">{formatCurrency(user.specialIncome?.royaltyIncome)}</span></div>
                      <div className="col-span-2 flex justify-between border-t border-gray-100 pt-2 mt-1"><span className="font-semibold text-gray-700">Total</span><span className="font-semibold text-green-600">{formatCurrency(calculateUserTotalFunds(user))}</span></div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredUsers.length === 0 && (
                <div className="p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">
                  No users found matching your search.
                </div>
              )}
            </>
          )}

          {/* Pagination Controls */}
          {!loading && !error && pagination.totalPages > 1 && (
            <div className="bg-white/50 backdrop-blur border-t border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left order-2 sm:order-1">
                  Showing {((pagination.currentPage - 1) * pagination.limit) + 1}–{Math.min(pagination.currentPage * pagination.limit, pagination.totalUsers)} of {pagination.totalUsers}
                </div>
                <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={!pagination.hasPrevPage || paginationLoading}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${pagination.hasPrevPage && !paginationLoading
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {paginationLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ChevronLeft className="w-4 h-4" />
                    )}
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={paginationLoading}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${pageNum === pagination.currentPage
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            } ${paginationLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                    disabled={!pagination.hasNextPage || paginationLoading}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${pagination.hasNextPage && !paginationLoading
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    Next
                    {paginationLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Combined Funds Modal */}
        {showFundsModal && (
          <CombinedFundsModal
            user={selectedUser}
            currentIncome={selectedUser ? usersWithSpecialIncome.find(income => income.userId === selectedUser.userId) : null}
            onClose={() => {
              setShowFundsModal(false);
              setSelectedUser(null);
            }}
            onSubmit={handleFundsAction}
            loading={actionLoading}
            allFundTypes={allFundTypes}
          />
        )}
      </div>
    </div>
  );
};

// Combined Funds Modal Component
const CombinedFundsModal = ({ user, currentIncome, onClose, onSubmit, loading, allFundTypes }) => {
  const [action, setAction] = useState('add'); // 'add' or 'deduct'
  const [formData, setFormData] = useState({
    userId: user?.userId || '',
    fundType: 'mobileFund',
    amount: '',
    adminNotes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.userId || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    const submitData = {
      ...formData,
      amount: parseFloat(formData.amount), // Ensure amount is a number
      action: action
    };

    onSubmit(submitData);
  };

  const selectedFundType = allFundTypes.find(ft => ft.key === formData.fundType);
  const isSpecialIncome = selectedFundType?.category === 'special';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-300 pt-20 sm:pt-24 pb-6">
      <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden max-h-[85vh] sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 p-4 sm:p-6 text-white overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-orange-600/20"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg flex-shrink-0">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold mb-0.5 sm:mb-1 truncate">Funds Management</h2>
                <p className="text-orange-100 text-xs sm:text-sm opacity-90 hidden sm:block">Manage user funds and special income with precision</p>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-all backdrop-blur-sm shadow-lg hover:scale-110 flex-shrink-0" aria-label="Close">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Enhanced Content */}
        <div className="p-4 sm:p-6">
          {/* Current Values Display */}
          {user && (
            <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-200 shadow-xl">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Current Portfolio for {user.firstName} {user.lastName}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="text-2xl font-bold text-blue-600 mb-2">₹{(user.funds?.totalFunds || 0).toLocaleString()}</div>
                  <div className="text-sm font-semibold text-blue-500 uppercase tracking-wide">Regular Funds</div>
                  <div className="text-xs text-gray-500 mt-1">Standard investment funds</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="text-2xl font-bold text-purple-600 mb-2">₹{((currentIncome?.leaderShipFund || 0) + (currentIncome?.royaltyIncome || 0) + (currentIncome?.rewardIncome || 0)).toLocaleString()}</div>
                  <div className="text-sm font-semibold text-purple-500 uppercase tracking-wide">Special Income</div>
                  <div className="text-xs text-gray-500 mt-1">Premium rewards & bonuses</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="text-2xl font-bold text-green-600 mb-2">₹{((user.funds?.totalFunds || 0) + (currentIncome?.leaderShipFund || 0) + (currentIncome?.royaltyIncome || 0) + (currentIncome?.rewardIncome || 0)).toLocaleString()}</div>
                  <div className="text-sm font-semibold text-green-500 uppercase tracking-wide">Total Portfolio</div>
                  <div className="text-xs text-gray-500 mt-1">Complete financial overview</div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Action Toggle */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              Select Transaction Type
            </h3>
            <div className="flex bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 rounded-2xl p-2 shadow-inner">
              <button
                type="button"
                onClick={() => setAction('add')}
                className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 text-sm ${action === 'add'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-xl transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/70'
                  }`}
              >
                <Plus className="w-5 h-5" />
                Add Funds
              </button>
              <button
                type="button"
                onClick={() => setAction('deduct')}
                className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 text-sm ${action === 'deduct'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-xl transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/70'
                  }`}
              >
                <Minus className="w-5 h-5" />
                Deduct Funds
              </button>
            </div>
          </div>

          {/* Enhanced Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  User ID *
                </label>
                <input
                  type="text"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  placeholder="Enter User ID (e.g., YITM00000001)"
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white/90 backdrop-blur-sm text-sm shadow-sm hover:shadow-md"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  Fund Category *
                </label>
                <select
                  value={formData.fundType}
                  onChange={(e) => setFormData({ ...formData, fundType: e.target.value })}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white/90 backdrop-blur-sm text-sm shadow-sm hover:shadow-md"
                  required
                >
                  <optgroup label="🏦 Regular Investment Funds">
                    {allFundTypes.filter(ft => ft.category === 'regular').map(type => (
                      <option key={type.key} value={type.key}>{type.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="⭐ Special Income & Rewards">
                    {allFundTypes.filter(ft => ft.category === 'special').map(type => (
                      <option key={type.key} value={type.key}>{type.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                Transaction Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">₹</span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder={`Enter amount to ${action === 'add' ? 'add' : 'deduct'}`}
                  min="1"
                  className="w-full pl-8 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white/90 backdrop-blur-sm text-sm shadow-sm hover:shadow-md"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                Transaction Notes
              </label>
              <textarea
                value={formData.adminNotes}
                onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                placeholder={`Add notes about this ${action} transaction (optional)`}
                rows="3"
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white/90 backdrop-blur-sm resize-none text-sm shadow-sm hover:shadow-md"
              />
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 text-sm shadow-sm hover:shadow-md"
              >
                Cancel Transaction
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 px-6 py-4 rounded-xl font-bold text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm ${action === 'add'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  } ${loading ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    {action === 'add' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                    {action === 'add' ? 'Add' : 'Deduct'} {selectedFundType?.label || 'Funds'}
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminFundsManager; 