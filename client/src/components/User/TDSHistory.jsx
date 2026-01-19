import { FileText, IndianRupee, Calendar, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import api, { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import LoginPrompt from '../UI/LoginPrompt';

const TDSHistory = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tdsHistory, setTdsHistory] = useState([]);
  const [summary, setSummary] = useState({
    totalTDS: 0,
    totalTransactions: 0,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50,
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user) {
      fetchTDSHistory(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchTDSHistory = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`${API_ENDPOINTS.payout.tdsHistory}?page=${page}&limit=50`);

      if (response.data.success) {
        setTdsHistory(response.data.data.tdsHistory || []);
        setSummary(response.data.data.summary || { totalTDS: 0, totalTransactions: 0 });
        setPagination(response.data.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 50,
        });
        setCurrentPage(page);
      } else {
        setError('Failed to fetch TDS history');
      }
    } catch (err) {
      console.error('Error fetching TDS history:', err);
      setError('Failed to fetch TDS history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
          }`}
      >
        {status?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTDSHistory(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!user) {
    return <LoginPrompt />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-8 px-4 mt-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-orange-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My TDS History</h1>
              <p className="text-gray-600 mt-1">Tax Deducted at Source (TDS) records from your payouts</p>
            </div>
          </div>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-5 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total TDS Deducted</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalTDS || 0)}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <IndianRupee className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalTransactions || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TDS History Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">TDS Transactions</h2>
            <p className="text-sm text-gray-600 mt-1">All TDS deductions from your payout requests</p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
              <p className="mt-4 text-gray-600">Loading TDS history...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={() => fetchTDSHistory(currentPage)}
                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                Retry
              </button>
            </div>
          ) : tdsHistory.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium text-lg">No TDS History Found</p>
              <p className="text-gray-500 text-sm mt-2">TDS will be shown here when you make payout requests</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-orange-50 to-red-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Payout Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        TDS Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Net Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tdsHistory.map((payout, index) => (
                      <tr
                        key={payout._id || index}
                        className="hover:bg-orange-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{formatDate(payout.requestDate || payout.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">{formatCurrency(payout.amount || 0)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-red-600">{formatCurrency(payout.tds || 0)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-green-600">{formatCurrency(payout.netAmount || 0)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(payout.status)}
                            {getStatusBadge(payout.status)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            {payout.withdrawalType || payout.type || 'Regular'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {tdsHistory.map((payout, index) => (
                  <div key={payout._id || index} className="p-4 hover:bg-orange-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{formatDate(payout.requestDate || payout.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payout.status)}
                        {getStatusBadge(payout.status)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Payout Amount:</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(payout.amount || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">TDS Deducted:</span>
                        <span className="text-sm font-bold text-red-600">{formatCurrency(payout.tds || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Net Amount:</span>
                        <span className="text-sm font-semibold text-green-600">{formatCurrency(payout.netAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Type:</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {payout.withdrawalType || payout.type || 'Regular'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total)
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg font-medium transition ${currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                          }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.totalPages}
                        className={`px-4 py-2 rounded-lg font-medium transition ${currentPage === pagination.totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                          }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">About TDS (Tax Deducted at Source)</h3>
              <p className="text-sm text-blue-800">
                TDS is deducted from your payout requests as per applicable tax regulations. The TDS amount is calculated based on your withdrawal amount and is automatically deducted before processing your payout. All TDS deductions are recorded here for your reference and tax filing purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TDSHistory;
