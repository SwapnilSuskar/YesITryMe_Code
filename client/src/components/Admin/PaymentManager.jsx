import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../../config/api";
import api from "../../config/api";
import {
    CreditCard,
    CheckCircle,
    XCircle,
    Clock,
    Search, Eye,
    AlertCircle,
    Download,
    RefreshCw,
    Loader2,
    BarChart3, TrendingUp
} from "lucide-react";

const PaymentManager = () => {
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({ pending: 0, verified: 0, rejected: 0, total: 0, recent: 0 });
    const [selectedVerification, setSelectedVerification] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchVerifications();
        fetchStats();
    }, [currentPage, statusFilter]);

    const fetchVerifications = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get(API_ENDPOINTS.payment.adminVerifications, {
                params: {
                    status: statusFilter,
                    page: currentPage,
                    limit: 10
                }
            });

            if (response.data.success) {
                setVerifications(response.data.data.verifications);
                setTotalPages(response.data.data.pagination.total);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch payment verifications");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get(API_ENDPOINTS.payment.adminStats);
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch payment stats:", err);
        }
    };

    const handleVerify = async (id, adminNotes = "") => {
        setActionLoading(true);
        try {
            const response = await api.patch(`${API_ENDPOINTS.payment.adminVerify}/${id}/verify`, {
                adminNotes
            });

            if (response.data.success) {
                fetchVerifications();
                fetchStats();
                setShowModal(false);
                setSelectedVerification(null);
            }
        } catch (err) {
            console.error("Verify payment error:", err);
            console.error("Error response:", err.response);
            setError(err.response?.data?.message || "Failed to verify payment");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (id, rejectionReason = "", adminNotes = "") => {
        setActionLoading(true);
        try {
            const response = await api.patch(`${API_ENDPOINTS.payment.adminReject}/${id}/reject`, {
                rejectionReason,
                adminNotes
            });
            if (response.data.success) {
                fetchVerifications();
                fetchStats();
                setShowModal(false);
                setSelectedVerification(null);
            }
        } catch (err) {
            console.error("Reject payment error:", err);
            console.error("Error response:", err.response);
            setError(err.response?.data?.message || "Failed to reject payment");
        } finally {
            setActionLoading(false);
        }
    };

    const openVerificationModal = async (id) => {
        try {
            const response = await api.get(`${API_ENDPOINTS.payment.adminVerification}/${id}`);
            if (response.data.success) {
                setSelectedVerification(response.data.data);
                setShowModal(true);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch verification details");
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
            verified: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
            rejected: { color: "bg-red-100 text-red-800 border-red-200", icon: XCircle }
        };

        // Default fallback for unknown statuses
        const config = statusConfig[status] || {
            color: "bg-gray-100 text-gray-800 border-gray-200",
            icon: AlertCircle
        };
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                <Icon className="w-3 h-3" />
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
            </span>
        );
    };

    const filteredVerifications = verifications.filter(verification => {
        const q = search.toLowerCase();
        return (
            verification.user?.firstName?.toLowerCase().includes(q) ||
            verification.user?.lastName?.toLowerCase().includes(q) ||
            verification.user?.email?.toLowerCase().includes(q) ||
            verification.transactionId?.toLowerCase().includes(q) ||
            verification.packageName?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col items-center py-12 px-4 pt-20 overflow-x-hidden">
            {/* Blurred Gradient Blobs */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-[#FF4E00] to-orange-500 rounded-full blur-3xl opacity-20 z-0" />
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20 z-0" />

            <div className="w-full max-w-7xl relative z-10">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 p-8 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-extrabold text-gray-800 drop-shadow-lg flex items-center gap-3">
                                <CreditCard className="w-10 h-10 text-orange-500" /> Payment Manager
                            </h1>
                            <p className="text-gray-600 mt-2 text-sm">Review and verify payment submissions from users</p>
                        </div>
                        <button
                            onClick={() => { fetchVerifications(); fetchStats(); }}
                            className="bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <BarChart3 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                                <p className="text-sm text-gray-600">Total</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-yellow-100 rounded-xl">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
                                <p className="text-sm text-gray-600">Pending</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800">{stats.verified}</p>
                                <p className="text-sm text-gray-600">Verified</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-100 rounded-xl">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800">{stats.rejected}</p>
                                <p className="text-sm text-gray-600">Rejected</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800">{stats.recent}</p>
                                <p className="text-sm text-gray-600">This Week</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/80 backdrop-blur text-gray-800 placeholder-gray-400 border border-orange-100 focus:outline-none focus:ring-2 focus:ring-[#FF4E00]"
                                placeholder="Search by name, email, transaction ID..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <Search className="absolute left-3 top-3.5 w-5 h-5 text-orange-500" />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="px-4 py-3 rounded-xl bg-white/80 backdrop-blur text-gray-800 border border-orange-100 focus:outline-none focus:ring-2 focus:ring-[#FF4E00]"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                {/* Verifications Table */}
                <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
                            <p className="text-gray-600">Loading payment verifications...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                            <p className="text-red-600">{error}</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="sticky top-0 z-10 bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white">
                                        <tr>
                                            <th className="py-4 px-6 text-left">User</th>
                                            <th className="py-4 px-6 text-left">Package</th>
                                            <th className="py-4 px-6 text-left">Amount</th>
                                            <th className="py-4 px-6 text-left">Transaction ID</th>
                                            <th className="py-4 px-6 text-left">Purchase ID</th>
                                            <th className="py-4 px-6 text-left">Status</th>
                                            <th className="py-4 px-6 text-left">Date</th>
                                            <th className="py-4 px-6 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredVerifications.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center text-gray-400 py-12">
                                                    No payment verifications found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredVerifications.map((verification, index) => (
                                                <tr key={verification._id} className={index % 2 === 0 ? "bg-white/90" : "bg-white/70"}>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF4E00] to-orange-500 flex items-center justify-center text-white font-bold shadow">
                                                                {verification.user?.firstName?.[0] || "U"}{verification.user?.lastName?.[0] || ""}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-800">
                                                                    {verification.user?.firstName} {verification.user?.lastName}
                                                                </p>
                                                                <p className="text-sm text-gray-600">{verification.user?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{verification.packageName}</p>
                                                            <p className="text-sm text-gray-600">{verification.paymentMethod}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <p className="font-bold text-gray-800">₹{verification.paymentAmount?.toLocaleString()}</p>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <p className="text-sm text-gray-700 font-mono">{verification.transactionId}</p>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {verification.purchaseId ? (
                                                            <p className="text-sm text-green-700 font-mono font-medium">{verification.purchaseId}</p>
                                                        ) : (
                                                            <p className="text-sm text-gray-400">-</p>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {getStatusBadge(verification.status)}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <p className="text-sm text-gray-600">
                                                            {new Date(verification.submittedAt).toLocaleDateString()}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(verification.submittedAt).toLocaleTimeString()}
                                                        </p>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => openVerificationModal(verification._id)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                    <p className="text-sm text-gray-600">
                                        Page {currentPage} of {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Verification Details Modal */}
            {showModal && selectedVerification && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-800">Payment Verification Details</h2>
                                <button
                                    onClick={() => { setShowModal(false); setSelectedVerification(null); }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* User & Payment Details */}
                                <div className="space-y-6">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-gray-800 mb-3">User Information</h3>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="font-medium">Name:</span> {selectedVerification.user?.firstName} {selectedVerification.user?.lastName}</p>
                                            <p><span className="font-medium">Email:</span> {selectedVerification.user?.email}</p>
                                            <p><span className="font-medium">Mobile:</span> {selectedVerification.user?.mobile}</p>
                                            <p><span className="font-medium">User ID:</span> {selectedVerification.user?.userId}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-gray-800 mb-3">Payment Details</h3>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="font-medium">Package:</span> {selectedVerification.packageName}</p>
                                            <p><span className="font-medium">Amount:</span> ₹{selectedVerification.paymentAmount?.toLocaleString()}</p>
                                            <p><span className="font-medium">Method:</span> {selectedVerification.paymentMethod}</p>
                                            <p><span className="font-medium">Transaction ID:</span> {selectedVerification.transactionId}</p>
                                            <p><span className="font-medium">Payer Name:</span> {selectedVerification.payerName}</p>
                                            <p><span className="font-medium">Payer Mobile:</span> {selectedVerification.payerMobile}</p>
                                            <p><span className="font-medium">Payer Email:</span> {selectedVerification.payerEmail}</p>
                                        </div>
                                    </div>

                                    {/* Purchase Information - Show only if verified */}
                                    {selectedVerification.status === 'verified' && selectedVerification.purchaseRecord && (
                                        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                            <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4" />
                                                Purchase Information
                                            </h3>
                                            <div className="space-y-2 text-sm">
                                                <p><span className="font-medium">Purchase ID:</span> {selectedVerification.purchaseId}</p>
                                                <p><span className="font-medium">Purchase Date:</span> {new Date(selectedVerification.purchaseRecord.purchaseDate).toLocaleString()}</p>
                                                <p><span className="font-medium">Payment Status:</span>
                                                    <span className="ml-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        {selectedVerification.purchaseRecord.paymentStatus}
                                                    </span>
                                                </p>
                                                <p><span className="font-medium">Package Status:</span>
                                                    <span className="ml-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {selectedVerification.purchaseRecord.status}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedVerification.additionalNotes && (
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <h3 className="font-semibold text-gray-800 mb-3">Additional Notes</h3>
                                            <p className="text-sm text-gray-600">{selectedVerification.additionalNotes}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Payment Proof */}
                                <div className="space-y-6">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-gray-800 mb-3">Payment Proof</h3>
                                        <div className="space-y-4">
                                            <img
                                                src={selectedVerification.paymentProofUrl}
                                                alt="Payment Proof"
                                                className="w-full rounded-lg border border-gray-200"
                                            />
                                            <a
                                                href={selectedVerification.paymentProofUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download Full Size
                                            </a>
                                        </div>
                                    </div>

                                    {/* Admin Actions */}
                                    {selectedVerification.status === 'pending' && (
                                        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                                            <h3 className="font-semibold text-yellow-800 mb-3">Admin Actions</h3>
                                            <div className="space-y-3">
                                                <button
                                                    onClick={() => handleVerify(selectedVerification._id)}
                                                    disabled={actionLoading}
                                                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                    Verify Payment & Activate User
                                                </button>
                                                <button
                                                    onClick={() => handleReject(selectedVerification._id)}
                                                    disabled={actionLoading}
                                                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                                    Reject Payment
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Status Information */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-gray-800 mb-3">Status Information</h3>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="font-medium">Status:</span> {getStatusBadge(selectedVerification.status)}</p>
                                            <p><span className="font-medium">Submitted:</span> {new Date(selectedVerification.submittedAt).toLocaleString()}</p>
                                            {selectedVerification.verifiedAt && (
                                                <p><span className="font-medium">Reviewed:</span> {new Date(selectedVerification.verifiedAt).toLocaleString()}</p>
                                            )}
                                            {selectedVerification.verifiedBy && (
                                                <p><span className="font-medium">Reviewed By:</span> {selectedVerification.verifiedBy}</p>
                                            )}
                                            {selectedVerification.adminNotes && (
                                                <p><span className="font-medium">Admin Notes:</span> {selectedVerification.adminNotes}</p>
                                            )}
                                            {selectedVerification.rejectionReason && (
                                                <p><span className="font-medium">Rejection Reason:</span> {selectedVerification.rejectionReason}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentManager; 