import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Filter,
  Loader2,
  Package,
  User,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { api, API_ENDPOINTS } from '../../config/api';

const SuperPackagePaymentManager = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchVerifications();
  }, [filters]);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      params.append('page', filters.page);
      params.append('limit', filters.limit);

      const response = await api.get(`${API_ENDPOINTS.superPackages.adminPaymentVerifications}?${params}`);

      if (response.data.success) {
        setVerifications(response.data.data.verifications);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast.error('Failed to fetch payment verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (verificationId, status, adminNotes = '', rejectionReason = '') => {
    try {
      setProcessing(true);

      const response = await api.put(
        `${API_ENDPOINTS.superPackages.updatePaymentVerificationStatus}/${verificationId}/status`,
        {
          status,
          adminNotes,
          rejectionReason
        }
      );

      if (response.data.success) {
        toast.success(`Payment verification ${status} successfully`);
        setShowDetails(false);
        setSelectedVerification(null);
        fetchVerifications(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating verification status:', error);
      toast.error(error.response?.data?.message || 'Failed to update verification status');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
            <CreditCard className="w-10 h-10 text-orange-500" />
            Super Package Payment Manager
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Review and manage payment verifications for Super Package purchases. Approve or reject payments and automatically distribute commissions.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Total: {pagination.total} verifications
            </div>
          </div>
        </div>

        {/* Verifications List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {verifications.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Payment Verifications</h3>
              <p className="text-gray-500">No payment verifications found with the current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Package
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {verifications.map((verification) => (
                    <tr key={verification._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-orange-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {verification.userId?.firstName} {verification.userId?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {verification.userId?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{verification.superPackageName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-sm font-medium text-gray-900">
                            ₹{verification.paymentAmount?.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(verification.status)}`}>
                          {getStatusIcon(verification.status)}
                          <span className="ml-1 capitalize">{verification.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(verification.submittedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedVerification(verification);
                            setShowDetails(true);
                          }}
                          className="text-orange-600 hover:text-orange-900 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetails && selectedVerification && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-orange-500" />
                    Payment Verification Details
                  </h2>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedVerification(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* User Information */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      User Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {selectedVerification.payerName}</div>
                      <div><span className="font-medium">Email:</span> {selectedVerification.payerEmail}</div>
                      <div><span className="font-medium">Mobile:</span> {selectedVerification.payerMobile}</div>
                    </div>
                  </div>

                  {/* Package Information */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Package Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Package:</span> {selectedVerification.superPackageName}</div>
                      <div><span className="font-medium">Amount:</span> ₹{selectedVerification.paymentAmount?.toLocaleString()}</div>
                      <div><span className="font-medium">Payment Method:</span> {selectedVerification.paymentMethod}</div>
                      <div><span className="font-medium">Transaction ID:</span> {selectedVerification.transactionId}</div>
                    </div>
                  </div>
                </div>

                {/* Payment Proof */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Payment Proof</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <img
                      src={selectedVerification.paymentProofUrl}
                      alt="Payment Proof"
                      className="max-w-full h-auto rounded-lg shadow-md"
                    />
                    <div className="mt-3">
                      <a
                        href={selectedVerification.paymentProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download Full Size
                      </a>
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                {selectedVerification.additionalNotes && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-3">Additional Notes</h3>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-700">{selectedVerification.additionalNotes}</p>
                    </div>
                  </div>
                )}

                {/* Admin Actions */}
                {selectedVerification.status === 'pending' && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Admin Actions</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => handleStatusUpdate(selectedVerification._id, 'verified')}
                        disabled={processing}
                        className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {processing ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                        Approve Payment
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedVerification._id, 'rejected')}
                        disabled={processing}
                        className="flex-1 bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {processing ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                        Reject Payment
                      </button>
                    </div>
                  </div>
                )}

                {/* Status Information */}
                {selectedVerification.status !== 'pending' && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="font-semibold text-gray-800 mb-3">Status Information</h3>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Status:</span>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedVerification.status)}`}>
                            {getStatusIcon(selectedVerification.status)}
                            <span className="ml-1 capitalize">{selectedVerification.status}</span>
                          </span>
                        </div>
                        {selectedVerification.verifiedAt && (
                          <div><span className="font-medium">Processed At:</span> {formatDate(selectedVerification.verifiedAt)}</div>
                        )}
                        {selectedVerification.adminNotes && (
                          <div><span className="font-medium">Admin Notes:</span> {selectedVerification.adminNotes}</div>
                        )}
                        {selectedVerification.rejectionReason && (
                          <div><span className="font-medium">Rejection Reason:</span> {selectedVerification.rejectionReason}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default SuperPackagePaymentManager; 