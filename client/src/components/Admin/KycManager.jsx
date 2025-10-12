import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Search,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import api, { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import LoginPrompt from '../UI/LoginPrompt';

const KycManager = () => {
  const { user, token } = useAuthStore();
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
    recentSubmissions: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (user && token) {
      fetchKycStats();
      fetchApplications();
    }
  }, [user, token, filter, currentPage]);

  const fetchKycStats = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.kyc.adminStats);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching KYC stats:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {
        status: filter !== 'all' ? filter : undefined,
        page: currentPage,
        limit: 10
      };
      
      const response = await api.get(API_ENDPOINTS.kyc.adminApplications, { params });
      if (response.data.success) {
        setApplications(response.data.data.applications);
        setTotalPages(response.data.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching KYC applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplication = async (id) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.kyc.adminApplication}/${id}`);
      if (response.data.success) {
        setSelectedApplication(response.data.data);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error fetching application details:', error);
    }
  };

  const handleApprove = async (id) => {
    if (!adminNotes.trim()) {
      alert('Please add admin notes before approving');
      return;
    }

    setProcessing(true);
    try {
      const response = await api.patch(`${API_ENDPOINTS.kyc.adminApprove}/${id}/approve`, {
        adminNotes: adminNotes.trim()
      });
      
      if (response.data.success) {
        alert('KYC approved successfully!');
        setShowModal(false);
        setSelectedApplication(null);
        setAdminNotes('');
        fetchApplications();
        fetchKycStats();
      }
    } catch (error) {
      console.error('Error approving KYC:', error);
      alert(error.response?.data?.message || 'Failed to approve KYC');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id) => {
    if (!adminNotes.trim()) {
      alert('Please add admin notes before rejecting');
      return;
    }

    setProcessing(true);
    try {
      const response = await api.patch(`${API_ENDPOINTS.kyc.adminReject}/${id}/reject`, {
        adminNotes: adminNotes.trim()
      });
      
      if (response.data.success) {
        alert('KYC rejected successfully!');
        setShowModal(false);
        setSelectedApplication(null);
        setAdminNotes('');
        fetchApplications();
        fetchKycStats();
      }
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      alert(error.response?.data?.message || 'Failed to reject KYC');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={16} /> },
      approved: { color: 'bg-green-100 text-green-800', icon: <CheckCircle size={16} /> },
      rejected: { color: 'bg-red-100 text-red-800', icon: <XCircle size={16} /> }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredApplications = applications.filter(app => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      app.user?.firstName?.toLowerCase().includes(searchLower) ||
      app.user?.lastName?.toLowerCase().includes(searchLower) ||
      app.user?.mobile?.includes(searchTerm) ||
      app.name?.toLowerCase().includes(searchLower)
    );
  });

  if (!user || user.role !== 'admin') {
    return <LoginPrompt type="admin" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-100 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">KYC Management</h1>
          <p className="text-gray-600">Review and manage user KYC applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recent (7d)</p>
                <p className="text-2xl font-bold text-purple-600">{stats.recentSubmissions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, mobile, or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              
              <button
                onClick={fetchApplications}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading applications...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bank Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredApplications.map((app) => (
                      <tr key={app._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {app.user?.firstName} {app.user?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{app.user?.mobile}</div>
                            <div className="text-xs text-gray-400">{app.user?.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">{app.name}</div>
                            <div className="text-sm text-gray-500">{app.accountNo}</div>
                            <div className="text-xs text-gray-400">{app.ifsc} - {app.branch}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(app.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(app.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewApplication(app._id)}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            >
                              <Eye size={16} />
                              View
                            </button>
                            {app.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setShowModal(true);
                                    setAdminNotes('Approved - Documents verified successfully');
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                  title="Quick Approve"
                                >
                                  <CheckCircle size={14} />
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setShowModal(true);
                                    setAdminNotes('Rejected - Please check documents and resubmit');
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                  title="Quick Reject"
                                >
                                  <XCircle size={14} />
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Page <span className="font-medium">{currentPage}</span> of{' '}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal for viewing application details */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">KYC Application Details</h3>
                  <div className="mt-1">
                    {getStatusBadge(selectedApplication.status)}
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* User Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">User Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedApplication.userId?.firstName} {selectedApplication.userId?.lastName}</div>
                    <div><span className="font-medium">Mobile:</span> {selectedApplication.userId?.mobile}</div>
                    <div><span className="font-medium">Email:</span> {selectedApplication.userId?.email}</div>
                    <div><span className="font-medium">User ID:</span> {selectedApplication.userId?.userId}</div>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Bank Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Account Holder:</span> {selectedApplication.name}</div>
                    <div><span className="font-medium">Account Number:</span> {selectedApplication.accountNo}</div>
                    <div><span className="font-medium">IFSC Code:</span> {selectedApplication.ifsc}</div>
                    <div><span className="font-medium">Branch:</span> {selectedApplication.branch}</div>
                  </div>
                </div>

                {/* Documents */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Documents</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div>
                        <span className="font-medium text-sm">Aadhaar Card</span>
                        <p className="text-xs text-gray-500 mt-1">Identity proof document</p>
                      </div>
                      <div className="flex gap-2">
                        <a 
                          href={selectedApplication.aadhaarUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1"
                        >
                          <Eye size={14} />
                          View
                        </a>
                        <a 
                          href={selectedApplication.aadhaarUrl} 
                          download 
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-1"
                        >
                          <Download size={14} />
                          Download
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div>
                        <span className="font-medium text-sm">PAN Card</span>
                        <p className="text-xs text-gray-500 mt-1">Tax identification document</p>
                      </div>
                      <div className="flex gap-2">
                        <a 
                          href={selectedApplication.panUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1"
                        >
                          <Eye size={14} />
                          View
                        </a>
                        <a 
                          href={selectedApplication.panUrl} 
                          download 
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-1"
                        >
                          <Download size={14} />
                          Download
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div>
                        <span className="font-medium text-sm">Passbook Photo</span>
                        <p className="text-xs text-gray-500 mt-1">Check the passbook photo</p>
                      </div>
                      <div className="flex gap-2">
                        <a 
                          href={selectedApplication.kycDocUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1"
                        >
                          <Eye size={14} />
                          View
                        </a>
                        <a 
                          href={selectedApplication.kycDocUrl} 
                          download 
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-1"
                        >
                          <Download size={14} />
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes *
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add notes for approval/rejection..."
                  />
                </div>

                {/* Action Buttons */}
                {selectedApplication.status === 'pending' && (
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleApprove(selectedApplication._id)}
                      disabled={processing || !adminNotes.trim()}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} />
                      {processing ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(selectedApplication._id)}
                      disabled={processing || !adminNotes.trim()}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <XCircle size={16} />
                      {processing ? 'Processing...' : 'Reject'}
                    </button>
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

export default KycManager; 