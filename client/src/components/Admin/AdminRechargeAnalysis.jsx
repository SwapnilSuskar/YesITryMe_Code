import { BarChart3, DollarSign, Smartphone, TrendingUp, Users, Wallet, RefreshCw, Filter, Edit, Trash2, X, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import api, { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import { toast, ToastContainer } from 'react-toastify';

const AdminRechargeAnalysis = () => {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    successfulRecharges: 0,
    failedRecharges: 0,
    pendingRecharges: 0,
    totalRevenue: 0,
    totalCommission: 0,
    providerCommission: 0,
    operatorStats: [],
  });
  const [recharges, setRecharges] = useState([]);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: 'all',
    operator: 'all',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    totalRecords: 0,
  });
  const [editingRecharge, setEditingRecharge] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRecharge, setDeletingRecharge] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (token) {
      fetchStats();
      fetchRecharges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filters]);

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`${API_ENDPOINTS.recharge.adminStats}?${params.toString()}`);
      if (response.data.success) {
        setStats(prev => ({ ...prev, ...response.data.data }));
      }
    } catch (error) {
      console.error('Error fetching recharge stats:', error);
    }
  };

  const fetchRecharges = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', filters.page);
      params.append('limit', filters.limit);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.operator !== 'all') params.append('operator', filters.operator);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`${API_ENDPOINTS.recharge.adminAll}?${params.toString()}`);
      if (response.data.success) {
        setRecharges(response.data.data.recharges || []);
        setPagination(response.data.data.pagination || { current: 1, total: 1, totalRecords: 0 });
      }
    } catch (error) {
      console.error('Error fetching recharges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleEdit = (recharge) => {
    setEditingRecharge(recharge);
    setEditForm({
      mobileNumber: recharge.mobileNumber,
      operator: recharge.operator,
      circle: recharge.circle,
      amount: recharge.amount,
      status: recharge.status,
      adminCommission: recharge.adminCommission,
      adminCommissionPercentage: recharge.adminCommissionPercentage,
      userCommission: recharge.userCommission,
      userCommissionPercentage: recharge.userCommissionPercentage,
      failureReason: recharge.failureReason || '',
      adminNotes: recharge.adminNotes || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      const url = API_ENDPOINTS.recharge.adminUpdate.replace(':rechargeId', editingRecharge._id);
      const response = await api.put(url, editForm);

      if (response.data.success) {
        setShowEditModal(false);
        setEditingRecharge(null);
        fetchRecharges();
        fetchStats();
        alert('Recharge record updated successfully!');
      }
    } catch (error) {
      console.error('Error updating recharge:', error);
      alert(error.response?.data?.message || 'Failed to update recharge record');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (recharge) => {
    setDeletingRecharge(recharge);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      const url = API_ENDPOINTS.recharge.adminDelete.replace(':rechargeId', deletingRecharge._id);
      const response = await api.delete(url);

      if (response.data.success) {
        setShowDeleteConfirm(false);
        setDeletingRecharge(null);
        fetchRecharges();
        fetchStats();
        toast.success('Recharge record deleted successfully', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (error) {
      console.error('Error deleting recharge:', error);
      alert(error.response?.data?.message || 'Failed to delete recharge record');
    } finally {
      setDeleting(false);
    }
  };

  // Calculate total commission from all successful recharges
  const calculatedTotalCommission = useMemo(() => {
    return recharges
      .filter((r) => r.status === 'success')
      .reduce((sum, r) => sum + (Number(r.adminCommission) || 0), 0);
  }, [recharges]);

  // Use calculated commission if backend value is 0 or missing, otherwise use backend value
  const displayTotalCommission = useMemo(() => {
    // If backend has a value and it's greater than 0, use it
    // Otherwise, use calculated value from loaded recharges
    // Note: Calculated value only includes current page, so backend is preferred when available
    if (stats.totalCommission && stats.totalCommission > 0) {
      return stats.totalCommission;
    }
    // Fallback to calculated value if backend returns 0 or undefined
    return calculatedTotalCommission;
  }, [stats.totalCommission, calculatedTotalCommission]);

  const formatCurrency = (amount) => {
    const value = Number(amount || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      success: { bg: 'bg-green-100', text: 'text-green-800', label: 'Success' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      payment_success: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Payment Done' },
      processing: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Processing' },
      refunded: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Refunded' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 pt-20 pb-12">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        className="toast-container"
        toastClassName="toast"
        bodyClassName="toast-body"
        progressClassName="toast-progress"
        iconClassName="toast-icon"
        closeButtonClassName="toast-close-button"
        closeButton={<X className="w-4 h-4" />}
        icon={<CheckCircle className="w-5 h-5 text-green-600" />}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 p-6 rounded-2xl shadow-xl mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white">Recharge Analysis</h1>
                <p className="text-white/90 text-sm">Monitor transactions, commissions, and revenue</p>
              </div>
            </div>
            <button
              onClick={() => { fetchStats(); fetchRecharges(); }}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Total Transactions</h3>
              <Smartphone className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.totalTransactions}</p>
            <p className="text-xs text-gray-500 mt-1">All recharge attempts</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Total Revenue</h3>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1">From successful recharges</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Total Commission</h3>
              <Wallet className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(displayTotalCommission)}</p>
            <p className="text-xs text-gray-500 mt-1">Admin commission earned</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Success Rate</h3>
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {stats.totalTransactions > 0
                ? ((stats.successfulRecharges / stats.totalTransactions) * 100).toFixed(1)
                : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.successfulRecharges} successful
            </p>
          </div>
        </div>
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-orange-500" />
            Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
              <select
                value={filters.operator}
                onChange={(e) => handleFilterChange('operator', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Operators</option>
                <option value="RELIANCE JIO">Jio</option>
                <option value="Airtel">Airtel</option>
                <option value="Vodafone">Vodafone</option>
                <option value="Idea">Idea</option>
                <option value="BSNL TOPUP">BSNL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Recharges Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              All Recharge Transactions
            </h2>
          </div>
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading transactions...</div>
          ) : recharges.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No recharge transactions found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-orange-500 to-rose-500 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Mobile</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Operator</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Admin Commission</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">User Commission</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Provider (API)</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recharges.map((recharge) => (
                      <tr key={recharge._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {recharge.user ? (
                            <div>
                              <p className="font-semibold text-gray-800">
                                {recharge.user.firstName} {recharge.user.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{recharge.user.userId}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{recharge.mobileNumber}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="font-medium text-gray-800">{recharge.operator}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                          {formatCurrency(recharge.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="font-medium text-purple-600">
                            {formatCurrency(recharge.adminCommission) || 0}
                          </span>
                          {recharge.adminCommissionPercentage > 0 && (
                            <p className="text-xs text-gray-500">
                              ({recharge.adminCommissionPercentage}%)
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="font-medium text-green-600">
                            {formatCurrency(recharge.userCommission || 0)}
                          </span>
                          {recharge.userCommissionPercentage > 0 && (
                            <p className="text-xs text-gray-500">
                              ({recharge.userCommissionPercentage}%)
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="font-medium text-blue-600">
                            {formatCurrency(recharge.providerCommission || 0)}
                          </span>
                          {recharge.providerBalance ? (
                            <p className="text-xs text-gray-500">
                              Provider Wallet: {formatCurrency(recharge.providerBalance)}
                            </p>
                          ) : null}
                          {recharge.providerReceiptUrl && (
                            <a
                              href={recharge.providerReceiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
                            >
                              View Receipt
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">{getStatusBadge(recharge.status)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(recharge.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(recharge)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(recharge)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                              disabled={recharge.commissionDistributed && recharge.status === 'success'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {pagination.total > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing page {pagination.current} of {pagination.total} ({pagination.totalRecords} total)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                      disabled={filters.page === 1}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handleFilterChange('page', Math.min(pagination.total, filters.page + 1))}
                      disabled={filters.page === pagination.total}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingRecharge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-rose-500 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Edit Recharge Record</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingRecharge(null);
                }}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={editForm.mobileNumber}
                    onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                  <select
                    value={editForm.operator}
                    onChange={(e) => setEditForm({ ...editForm, operator: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="RELIANCE JIO">RELIANCE JIO</option>
                    <option value="Airtel">Airtel</option>
                    <option value="Vodafone">Vodafone</option>
                    <option value="Idea">Idea</option>
                    <option value="BSNL TOPUP">BSNL TOPUP</option>
                    <option value="BSNL STV">BSNL STV</option>
                    <option value="JIO PostPaid">JIO PostPaid</option>
                    <option value="Airtel Postpaid">Airtel Postpaid</option>
                    <option value="Vodafone Postpaid">Vodafone Postpaid</option>
                    <option value="Idea Postpaid">Idea Postpaid</option>
                    <option value="BSNL Postpaid">BSNL Postpaid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Circle</label>
                  <input
                    type="text"
                    value={editForm.circle}
                    onChange={(e) => setEditForm({ ...editForm, circle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="payment_success">Payment Success</option>
                    <option value="processing">Processing</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Commission (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.adminCommissionPercentage}
                    onChange={(e) => setEditForm({ ...editForm, adminCommissionPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Commission (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.adminCommission}
                    onChange={(e) => setEditForm({ ...editForm, adminCommission: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Commission (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.userCommissionPercentage}
                    onChange={(e) => setEditForm({ ...editForm, userCommissionPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Commission (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.userCommission}
                    onChange={(e) => setEditForm({ ...editForm, userCommission: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              {editingRecharge && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Provider Response Snapshot</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                    <p>
                      Provider Commission:{' '}
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(editingRecharge.providerCommission || 0)}
                      </span>
                    </p>
                    <p>
                      Provider Wallet:{' '}
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(editingRecharge.providerBalance || 0)}
                      </span>
                    </p>
                    {editingRecharge.providerReceiptUrl && (
                      <p className="md:col-span-2">
                        <a
                          href={editingRecharge.providerReceiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline flex items-center gap-1"
                        >
                          View Provider Receipt
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Failure Reason</label>
                <textarea
                  value={editForm.failureReason}
                  onChange={(e) => setEditForm({ ...editForm, failureReason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter failure reason if applicable"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                <textarea
                  value={editForm.adminNotes}
                  onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Add admin notes"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRecharge(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingRecharge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Delete Recharge Record</h2>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete this recharge record?
                </p>
                <div className="mt-2 text-xs text-gray-600">
                  <p><strong>Mobile:</strong> {deletingRecharge.mobileNumber}</p>
                  <p><strong>Operator:</strong> {deletingRecharge.operator}</p>
                  <p><strong>Amount:</strong> {formatCurrency(deletingRecharge.amount)}</p>
                  <p><strong>Status:</strong> {deletingRecharge.status}</p>
                </div>
                {deletingRecharge.commissionDistributed && deletingRecharge.status === 'success' && (
                  <p className="mt-2 text-xs text-red-600 font-semibold">
                    ⚠️ Cannot delete: Commissions have been distributed for this successful recharge.
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingRecharge(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting || (deletingRecharge.commissionDistributed && deletingRecharge.status === 'success')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  {deleting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRechargeAnalysis;

