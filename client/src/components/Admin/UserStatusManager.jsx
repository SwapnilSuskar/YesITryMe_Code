import { AlertCircle, CheckCircle, Clock, Edit, FileText, Filter, Search, Shield, UserCheck, Users, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';
import api, { API_ENDPOINTS } from '../../config/api';

const UserStatusManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.admin.users);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      setUpdating(true);
      let endpoint;
      let data = {};

      switch (newStatus) {
        case 'active':
          endpoint = API_ENDPOINTS.admin.userActivate.replace(':id', userId);
          break;
        case 'blocked':
          endpoint = API_ENDPOINTS.admin.userDeactivate.replace(':id', userId);
          break;
        case 'kyc_verified':
          endpoint = API_ENDPOINTS.admin.userKycApprove.replace(':id', userId);
          break;
        case 'free':
          endpoint = API_ENDPOINTS.admin.userKycReject.replace(':id', userId);
          break;
        default:
          endpoint = API_ENDPOINTS.admin.userStatusUpdate.replace(':id', userId);
          data = { status: newStatus, adminNotes };
      }

      const response = await api.patch(endpoint, data);
      setSuccess(`User status updated to ${newStatus} successfully`);
      clearSuccessMessage();
      setAdminNotes('');
      setShowModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      setError(error.response?.data?.message || 'Failed to update user status');
    } finally {
      setUpdating(false);
    }
  };

  const openModal = (user) => {
    setSelectedUser(user);
    setAdminNotes(user.adminNotes || '');
    setShowModal(true);
  };

  const clearSuccessMessage = () => {
    setTimeout(() => {
      setSuccess('');
    }, 5000);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setAdminNotes('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'free': return 'bg-gray-100 text-gray-700';
      case 'active': return 'bg-yellow-100 text-yellow-700';
      case 'kyc_verified': return 'bg-green-100 text-green-700';
      case 'blocked': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'free': return <Clock className="text-gray-600" size={16} />;
      case 'active': return <UserCheck className="text-yellow-600" size={16} />;
      case 'kyc_verified': return <Shield className="text-green-600" size={16} />;
      case 'blocked': return <UserX className="text-red-600" size={16} />;
      default: return <Users className="text-gray-600" size={16} />;
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'free': return 'Free User - Basic access';
      case 'active': return 'Active User - Can earn commissions';
      case 'kyc_verified': return 'KYC Verified - Full access';
      case 'blocked': return 'Blocked - No access';
      default: return 'Unknown status';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile?.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const stats = {
    total: users.length,
    free: users.filter(u => u.status === 'free').length,
    active: users.filter(u => u.status === 'active').length,
    kyc_verified: users.filter(u => u.status === 'kyc_verified').length,
    blocked: users.filter(u => u.status === 'blocked').length,
    kycApproved: users.filter(u => u.kycApprovedDate).length,
    isActive: users.filter(u => u.isActive).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 mt-12">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-blue-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="text-blue-500" size={32} />
            <h1 className="text-3xl font-bold text-gray-800">User Status Manager</h1>
          </div>
          <button
            onClick={fetchUsers}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-600">Total Users</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">{stats.free}</div>
            <div className="text-sm text-gray-600">Free</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">{stats.active}</div>
            <div className="text-sm text-yellow-600">Active</div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <div className="text-2xl font-bold text-green-600">{stats.kyc_verified}</div>
            <div className="text-sm text-green-600">KYC Verified</div>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
            <div className="text-2xl font-bold text-red-600">{stats.blocked}</div>
            <div className="text-sm text-red-600">Blocked</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{stats.kycApproved}</div>
            <div className="text-sm text-purple-600">KYC Approved</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
            <div className="text-2xl font-bold text-indigo-600">{stats.isActive}</div>
            <div className="text-sm text-indigo-600">System Active</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, ID, email, or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All Status</option>
              <option value="free">Free</option>
              <option value="active">Active</option>
              <option value="kyc_verified">KYC Verified</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
            <CheckCircle size={20} />
            {success}
          </div>
        )}
      </div>

      {/* Users List */}
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">User Management</h2>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="text-gray-400 mx-auto mb-4" size={48} />
            <p className="text-gray-500 text-lg">No users found</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {currentUsers.map((user) => (
                <div key={user._id} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {user.firstName?.[0] || "U"}{user.lastName?.[0] || ""}
                        </div>
                        <div className="absolute -bottom-1 -right-1">
                          {getStatusIcon(user.status)}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-xl text-gray-800">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500 font-medium">ID: {user.userId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${getStatusColor(user.status)}`}>
                        {user.status === 'kyc_verified' ? 'KYC Verified' :
                          user.status === 'active' ? 'Active' :
                            user.status === 'inactive' ? 'Inactive' :
                              user.status === 'pending' ? 'Pending' :
                                user.status === 'suspended' ? 'Suspended' :
                                  user.status.charAt(0).toUpperCase() + user.status.slice(1).replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => openModal(user)}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                      <div className="text-xs text-gray-500 font-medium mb-1">Email</div>
                      <div className="text-sm text-gray-800 font-semibold truncate">{user.email}</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                      <div className="text-xs text-gray-500 font-medium mb-1">Mobile</div>
                      <div className="text-sm text-gray-800 font-semibold">{user.mobile}</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                      <div className="text-xs text-gray-500 font-medium mb-1">Joined</div>
                      <div className="text-sm text-gray-800 font-semibold">{formatDate(user.createdAt)}</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                      <div className="text-xs text-gray-500 font-medium mb-1">MLM Level</div>
                      <div className="text-sm text-gray-800 font-semibold">{user.mlmLevel || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Status Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      Status Information
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                        <div className="text-xs text-gray-500 font-medium mb-1">System Active</div>
                        <div className="font-bold text-lg text-gray-800">{user.status}</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                        <div className="text-xs text-gray-500 font-medium mb-1">KYC Status</div>
                        <div className="font-bold text-lg text-gray-800">{user.kycApprovedDate ? 'Approved' : 'Pending'}</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                        <div className="text-xs text-gray-500 font-medium mb-1">Activation Date</div>
                        <div className="font-bold text-lg text-gray-800">{formatDate(user.activationDate)}</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                        <div className="text-xs text-gray-500 font-medium mb-1">KYC Rejected</div>
                        <div className="font-bold text-lg text-gray-800">{user.kycRejected ? 'Rejected' : 'Pending'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="text-sm text-gray-600 font-medium mb-1">Status Description</div>
                    <div className="text-sm text-gray-800 font-semibold">{getStatusDescription(user.status)}</div>
                  </div>
                  {user.adminNotes && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-yellow-600" />
                        <strong className="text-yellow-800 text-sm font-semibold">Admin Notes</strong>
                      </div>
                      <p className="text-yellow-700 text-sm">{user.adminNotes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg border transition-colors font-medium ${currentPage === pageNum
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Status Update Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Update User Status</h3>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">User: {selectedUser.firstName} {selectedUser.lastName}</div>
              <div className="text-sm text-gray-600 mb-2">ID: {selectedUser.userId}</div>
              <div className="text-sm text-gray-600 mb-2">Email: {selectedUser.email}</div>
              <div className="text-sm text-gray-600 mb-4">Current Status: {selectedUser.status}</div>

              {/* Current Status Info */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Current Status Info:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border">
                    <div className="text-gray-600">System Active</div>
                    <div className={`font-bold ${selectedUser.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedUser.isActive ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-gray-600">KYC Approved</div>
                    <div className={`font-bold ${selectedUser.kycApprovedDate ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedUser.kycApprovedDate ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Notes (Optional)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows="3"
                placeholder="Add notes about this status change..."
              />
              {selectedUser.adminNotes && (
                <div className="mt-2 p-2 bg-gray-50 rounded border">
                  <div className="text-xs text-gray-600 mb-1">Current Notes:</div>
                  <div className="text-sm text-gray-800">{selectedUser.adminNotes}</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => handleStatusUpdate(selectedUser._id, 'free')}
                disabled={updating || selectedUser.status === 'free'}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg transition-colors text-sm"
              >
                {updating ? 'Updating...' : 'Set Free'}
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedUser._id, 'active')}
                disabled={updating || selectedUser.status === 'active'}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg transition-colors text-sm"
              >
                {updating ? 'Updating...' : 'Set Active'}
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedUser._id, 'kyc_verified')}
                disabled={updating || selectedUser.status === 'kyc_verified'}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg transition-colors text-sm"
              >
                {updating ? 'Updating...' : 'KYC Verify'}
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedUser._id, 'blocked')}
                disabled={updating || selectedUser.status === 'blocked'}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg transition-colors text-sm"
              >
                {updating ? 'Updating...' : 'Block User'}
              </button>
            </div>

            <button
              onClick={closeModal}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStatusManager; 