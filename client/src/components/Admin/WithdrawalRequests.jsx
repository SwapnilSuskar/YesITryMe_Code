import React, { useState, useEffect, useCallback } from 'react';
import {
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    User,
    Calendar,
    Filter,
    Search,
    RefreshCw
} from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import useToast from '../../hooks/useToast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const WithdrawalRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [paymentDetails, setPaymentDetails] = useState({
        upiId: '',
        bankAccount: '',
        ifscCode: '',
        accountHolderName: ''
    });
    const [pagination, setPagination] = useState({
        current: 1,
        total: 1,
        count: 0,
        totalCount: 0
    });

    const { showSuccess, showError, toasts, removeToast } = useToast();

    const fetchRequests = useCallback(async (page = 1, status = filter) => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API_ENDPOINTS.admin.withdrawalRequests}?status=${status}&page=${page}&limit=20`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch withdrawal requests');
            }

            const data = await response.json();
            setRequests(data.data.requests);
            setPagination(data.data.pagination);
        } catch (error) {
            console.error('Error fetching withdrawal requests:', error);
            showError('Failed to fetch withdrawal requests');
        } finally {
            setLoading(false);
        }
    }, [filter, showError]);

    useEffect(() => {
        fetchRequests();
    }, [filter, fetchRequests]);

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setPagination({ current: 1, total: 1, count: 0, totalCount: 0 });
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredRequests = requests.filter(request => {
        const user = request.userId;
        const searchLower = searchTerm.toLowerCase();
        return (
            user?.firstName?.toLowerCase().includes(searchLower) ||
            user?.lastName?.toLowerCase().includes(searchLower) ||
            user?.email?.toLowerCase().includes(searchLower) ||
            user?.mobile?.includes(searchTerm) ||
            user?.userId?.toLowerCase().includes(searchLower)
        );
    });

    const handleApprove = async (requestId) => {
        try {
            setActionLoading(true);
            const response = await fetch(
                API_ENDPOINTS.admin.approveWithdrawal.replace(':requestId', requestId),
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ adminNotes })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to approve withdrawal request');
            }

            showSuccess('Withdrawal request approved successfully');
            setShowModal(false);
            setAdminNotes('');
            fetchRequests(pagination.current, filter);
        } catch (error) {
            console.error('Error approving withdrawal request:', error);
            showError('Failed to approve withdrawal request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (requestId) => {
        try {
            setActionLoading(true);
            const response = await fetch(
                API_ENDPOINTS.admin.rejectWithdrawal.replace(':requestId', requestId),
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ rejectionReason })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to reject withdrawal request');
            }

            showSuccess('Withdrawal request rejected successfully');
            setShowModal(false);
            setRejectionReason('');
            fetchRequests(pagination.current, filter);
        } catch (error) {
            console.error('Error rejecting withdrawal request:', error);
            showError('Failed to reject withdrawal request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleComplete = async (requestId) => {
        try {
            setActionLoading(true);
            const response = await fetch(
                API_ENDPOINTS.admin.completeWithdrawal.replace(':requestId', requestId),
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ paymentDetails })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to complete withdrawal request');
            }

            showSuccess('Withdrawal request marked as completed');
            setShowModal(false);
            setPaymentDetails({ upiId: '', bankAccount: '', ifscCode: '', accountHolderName: '' });
            fetchRequests(pagination.current, filter);
        } catch (error) {
            console.error('Error completing withdrawal request:', error);
            showError('Failed to complete withdrawal request');
        } finally {
            setActionLoading(false);
        }
    };

    const openModal = (request) => {
        setSelectedRequest(request);
        setShowModal(true);
        setAdminNotes(request.adminNotes || '');
        setRejectionReason(request.rejectionReason || '');
        setPaymentDetails(request.paymentDetails || { upiId: '', bankAccount: '', ifscCode: '', accountHolderName: '' });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            case 'approved': return 'text-blue-600 bg-blue-100';
            case 'rejected': return 'text-red-600 bg-red-100';
            case 'completed': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'approved': return <CheckCircle className="w-4 h-4" />;
            case 'rejected': return <XCircle className="w-4 h-4" />;
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
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

    const formatAmount = (amount) => {
        return `₹${parseFloat(amount).toFixed(2)}`;
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen mt-12">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <DollarSign className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
                                <p className="text-gray-600">Manage user withdrawal requests and approvals</p>
                            </div>
                        </div>
                        <button
                            onClick={() => fetchRequests(pagination.current, filter)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-500" />
                            <select
                                value={filter}
                                onChange={(e) => handleFilterChange(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Requests</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        {/* Search */}
                        <div className="flex items-center gap-2 flex-1">
                            <Search className="w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search by name, email, mobile, or user ID..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-gray-600">Loading withdrawal requests...</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="p-8 text-center">
                            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No withdrawal requests found</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User Details
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Request Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredRequests.map((request) => (
                                            <tr key={request._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="p-2 bg-gray-100 rounded-lg mr-3">
                                                            <User className="w-4 h-4 text-gray-600" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {request.userId?.firstName} {request.userId?.lastName}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {request.userId?.email}
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                ID: {request.userId?.userId}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {formatAmount(request.amount)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {request.coins} coins
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                                        {getStatusIcon(request.status)}
                                                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {formatDate(request.createdAt)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => openModal(request)}
                                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-900 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.total > 1 && (
                                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Showing {((pagination.current - 1) * 20) + 1} to {Math.min(pagination.current * 20, pagination.totalCount)} of {pagination.totalCount} results
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => fetchRequests(pagination.current - 1, filter)}
                                                disabled={pagination.current === 1}
                                                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            <span className="px-3 py-1 text-sm text-gray-700">
                                                Page {pagination.current} of {pagination.total}
                                            </span>
                                            <button
                                                onClick={() => fetchRequests(pagination.current + 1, filter)}
                                                disabled={pagination.current === pagination.total}
                                                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

                {/* Modal */}
                {showModal && selectedRequest && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900">Withdrawal Request Details</h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* User Details */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">User Information</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Name:</span>
                                            <span className="ml-2 font-medium">{selectedRequest.userId?.firstName} {selectedRequest.userId?.lastName}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Email:</span>
                                            <span className="ml-2 font-medium">{selectedRequest.userId?.email}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Mobile:</span>
                                            <span className="ml-2 font-medium">{selectedRequest.userId?.mobile}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">User ID:</span>
                                            <span className="ml-2 font-medium">{selectedRequest.userId?.userId}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Request Details */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">Request Information</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Amount:</span>
                                            <span className="ml-2 font-medium text-lg text-green-600">{formatAmount(selectedRequest.amount)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Coins:</span>
                                            <span className="ml-2 font-medium">{selectedRequest.coins}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Status:</span>
                                            <span className={`ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                                                {getStatusIcon(selectedRequest.status)}
                                                {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Request Date:</span>
                                            <span className="ml-2 font-medium">{formatDate(selectedRequest.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Admin Notes */}
                                {selectedRequest.status === 'pending' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Admin Notes (Optional)
                                        </label>
                                        <textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Add any notes for this approval..."
                                        />
                                    </div>
                                )}

                                {/* Rejection Reason */}
                                {selectedRequest.status === 'pending' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Rejection Reason (if rejecting)
                                        </label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Provide reason for rejection..."
                                        />
                                    </div>
                                )}

                                {/* Payment Details */}
                                {selectedRequest.status === 'approved' && (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                                                <input
                                                    type="text"
                                                    value={paymentDetails.upiId}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="user@upi"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                                                <input
                                                    type="text"
                                                    value={paymentDetails.accountHolderName}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, accountHolderName: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Account holder name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
                                                <input
                                                    type="text"
                                                    value={paymentDetails.bankAccount}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, bankAccount: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Bank account number"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                                                <input
                                                    type="text"
                                                    value={paymentDetails.ifscCode}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, ifscCode: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="IFSC code"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    {selectedRequest.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleApprove(selectedRequest._id)}
                                                disabled={actionLoading}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                {actionLoading ? 'Approving...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={() => handleReject(selectedRequest._id)}
                                                disabled={actionLoading}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                {actionLoading ? 'Rejecting...' : 'Reject'}
                                            </button>
                                        </>
                                    )}
                                    {selectedRequest.status === 'approved' && (
                                        <button
                                            onClick={() => handleComplete(selectedRequest._id)}
                                            disabled={actionLoading}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            {actionLoading ? 'Completing...' : 'Mark as Completed'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Toast Container */}
            <ToastContainer
                position="top-right"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </div>
    );
};

export default WithdrawalRequests;
