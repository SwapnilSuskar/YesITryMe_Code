import { AlertCircle, CheckCircle, Clock, Edit, Wallet, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import api, { API_ENDPOINTS } from '../../config/api';

const PayoutManager = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.payout.adminAll);
      setPayouts(response.data.payouts);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      setError('Failed to fetch payout requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (payoutId, newStatus) => {
    try {
      setUpdating(true);
      const response = await api.put(
        API_ENDPOINTS.payout.adminUpdateStatus.replace(':payoutId', payoutId),
        {
          status: newStatus,
          adminNotes: adminNotes
        }
      );

      setSuccess(`Payout ${newStatus} successfully`);
      setAdminNotes('');
      setShowModal(false);
      setSelectedPayout(null);
      fetchPayouts();
    } catch (error) {
      console.error('Error updating payout status:', error);
      setError('Failed to update payout status');
    } finally {
      setUpdating(false);
    }
  };

  const openModal = (payout) => {
    setSelectedPayout(payout);
    setAdminNotes(payout.adminNotes || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPayout(null);
    setAdminNotes('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'approved': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-600" size={16} />;
      case 'approved': return <CheckCircle className="text-blue-600" size={16} />;
      case 'pending': return <Clock className="text-yellow-600" size={16} />;
      case 'rejected': return <XCircle className="text-red-600" size={16} />;
      default: return <AlertCircle className="text-gray-600" size={16} />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN');
  };

  const filteredPayouts = payouts.filter(payout => {
    if (statusFilter === 'all') return true;
    return payout.status === statusFilter;
  });

  const stats = {
    total: payouts.length,
    pending: payouts.filter(p => p.status === 'pending').length,
    approved: payouts.filter(p => p.status === 'approved').length,
    completed: payouts.filter(p => p.status === 'completed').length,
    rejected: payouts.filter(p => p.status === 'rejected').length,
    totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0)
  };

  // Calculate admin charges
  const adminCharges = {
    totalAdminCharge: payouts.reduce((sum, p) => sum + (p.amount * 0.10), 0),
    totalTDS: payouts.reduce((sum, p) => sum + (p.amount * 0.02), 0),
    totalCharges: payouts.reduce((sum, p) => sum + (p.amount * 0.12), 0),
    netAmountPaid: payouts.reduce((sum, p) => sum + (p.amount * 0.88), 0)
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
            <Wallet className="text-blue-500" size={32} />
            <h1 className="text-3xl font-bold text-gray-800">Payout Manager</h1>
          </div>
          <button
            onClick={fetchPayouts}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-600">Total Requests</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
            <div className="text-sm text-blue-600">Approved</div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-green-600">Completed</div>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-red-600">Rejected</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">₹{stats.totalAmount.toLocaleString()}</div>
            <div className="text-sm text-purple-600">Total Amount</div>
          </div>
        </div>

        {/* Admin Charges Summary */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-bold text-red-800 mb-4 text-center">Admin Charges Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-red-200 text-center">
              <div className="text-lg font-bold text-red-600">₹{adminCharges.totalAdminCharge.toFixed(2)}</div>
              <div className="text-sm text-red-600">Admin Charge (10%)</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-orange-200 text-center">
              <div className="text-lg font-bold text-orange-600">₹{adminCharges.totalTDS.toFixed(2)}</div>
              <div className="text-sm text-orange-600">TDS (2%)</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-red-300 text-center">
              <div className="text-lg font-bold text-red-700">₹{adminCharges.totalCharges.toFixed(2)}</div>
              <div className="text-sm text-red-700">Total Charges (12%)</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-200 text-center">
              <div className="text-lg font-bold text-green-600">₹{adminCharges.netAmountPaid.toFixed(2)}</div>
              <div className="text-sm text-green-600">Net Amount Paid (88%)</div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
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

      {/* Payouts List */}
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Payout Requests</h2>

        {filteredPayouts.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="text-gray-400 mx-auto mb-4" size={48} />
            <p className="text-gray-500 text-lg">No payout requests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPayouts.map((payout) => (
              <div key={payout._id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(payout.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(payout.status)}`}>
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-lg text-gray-800">₹{payout.amount.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Requested by {payout.userName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openModal(payout)}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <strong>User ID:</strong> {payout.userId}
                  </div>
                  <div>
                    <strong>Request Date:</strong> {formatDateTime(payout.requestDate)}
                  </div>
                  <div>
                    <strong>Payment Method:</strong> {payout.paymentMethod?.replace('_', ' ').toUpperCase() || 'N/A'}
                  </div>
                </div>

                {/* Admin Charges Breakdown */}
                <div className="mt-4 bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Charges Breakdown:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <div className="text-gray-600">Requested Amount</div>
                      <div className="font-bold text-gray-800">₹{payout.amount.toLocaleString()}</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded border border-red-200">
                      <div className="text-red-600">Admin Charge (10%)</div>
                      <div className="font-bold text-red-700">₹{(payout.amount * 0.10).toFixed(2)}</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded border border-orange-200">
                      <div className="text-orange-600">TDS (2%)</div>
                      <div className="font-bold text-orange-700">₹{(payout.amount * 0.02).toFixed(2)}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <div className="text-green-600">Net Amount (88%)</div>
                      <div className="font-bold text-green-700">₹{(payout.amount * 0.88).toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                {payout.processedDate && (
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Processed Date:</strong> {formatDateTime(payout.processedDate)}
                  </div>
                )}

                {payout.adminNotes && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <strong className="text-blue-800">Admin Notes:</strong>
                    <p className="text-blue-700 mt-1">{payout.adminNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Update Payout Status</h3>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">User: {selectedPayout.userName}</div>
              <div className="text-sm text-gray-600 mb-2">Amount: ₹{selectedPayout.amount.toLocaleString()}</div>
              <div className="text-sm text-gray-600 mb-4">Current Status: {selectedPayout.status}</div>

              {/* Admin Charges in Modal */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Charges Breakdown:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border">
                    <div className="text-gray-600">Admin Charge (10%)</div>
                    <div className="font-bold text-red-600">₹{(selectedPayout.amount * 0.10).toFixed(2)}</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-gray-600">TDS (2%)</div>
                    <div className="font-bold text-orange-600">₹{(selectedPayout.amount * 0.02).toFixed(2)}</div>
                  </div>
                  <div className="bg-white p-2 rounded border col-span-2">
                    <div className="text-gray-600">Net Amount (88%)</div>
                    <div className="font-bold text-green-600">₹{(selectedPayout.amount * 0.88).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows="3"
                placeholder="Add notes (optional)"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleStatusUpdate(selectedPayout._id, 'approved')}
                disabled={updating || selectedPayout.status === 'approved'}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg transition-colors"
              >
                {updating ? 'Updating...' : 'Approve'}
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedPayout._id, 'completed')}
                disabled={updating || selectedPayout.status === 'completed'}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg transition-colors"
              >
                {updating ? 'Updating...' : 'Complete'}
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedPayout._id, 'rejected')}
                disabled={updating || selectedPayout.status === 'rejected'}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg transition-colors"
              >
                {updating ? 'Updating...' : 'Reject'}
              </button>
            </div>

            <button
              onClick={closeModal}
              className="w-full mt-4 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutManager;