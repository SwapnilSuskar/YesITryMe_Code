import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../../config/api";
import api from "../../config/api";
import {
    Wallet,
    CheckCircle,
    XCircle,
    Clock,
    Search,
    Eye,
    AlertCircle,
    RefreshCw,
    Loader2,
    BarChart3,
    TrendingUp,
    IndianRupee,
    Trash2,
} from "lucide-react";

const AdminWalletTopUpManager = () => {
    const [topUps, setTopUps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0, recent: 0 });
    const [selectedTopUp, setSelectedTopUp] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [adminNotes, setAdminNotes] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");

    useEffect(() => {
        fetchTopUps();
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, statusFilter]);

    const fetchTopUps = async () => {
        setLoading(true);
        setError("");
        try {
            const status = statusFilter === "all" ? undefined : statusFilter;
            const response = await api.get(API_ENDPOINTS.walletTopUp.adminAll, {
                params: {
                    status,
                    page: currentPage,
                    limit: 20,
                },
            });

            if (response.data.success) {
                setTopUps(response.data.data.topUps);
                setTotalPages(response.data.data.pagination.totalPages);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch wallet top-up requests");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get(API_ENDPOINTS.walletTopUp.adminStats);
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch wallet top-up stats:", err);
        }
    };

    const handleApprove = async (id) => {
        setActionLoading(true);
        try {
            const response = await api.patch(
                API_ENDPOINTS.walletTopUp.adminApprove.replace(":id", id),
                {
                    adminNotes: adminNotes || "",
                }
            );

            if (response.data.success) {
                fetchTopUps();
                fetchStats();
                setShowModal(false);
                setSelectedTopUp(null);
                setAdminNotes("");
                alert(`Wallet top-up approved! Amount: ₹${response.data.data.amount}`);
            }
        } catch (err) {
            console.error("Approve wallet top-up error:", err);
            setError(err.response?.data?.message || "Failed to approve wallet top-up");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (id) => {
        if (!rejectionReason.trim()) {
            alert("Please provide a rejection reason");
            return;
        }

        setActionLoading(true);
        try {
            const response = await api.patch(
                API_ENDPOINTS.walletTopUp.adminReject.replace(":id", id),
                {
                    rejectionReason,
                    adminNotes: adminNotes || "",
                }
            );
            if (response.data.success) {
                fetchTopUps();
                fetchStats();
                setShowModal(false);
                setSelectedTopUp(null);
                setRejectionReason("");
                setAdminNotes("");
                alert("Wallet top-up rejected successfully");
            }
        } catch (err) {
            console.error("Reject wallet top-up error:", err);
            setError(err.response?.data?.message || "Failed to reject wallet top-up");
        } finally {
            setActionLoading(false);
        }
    };

    const openTopUpModal = async (id) => {
        try {
            const response = await api.get(API_ENDPOINTS.walletTopUp.adminGet.replace(":id", id));
            if (response.data.success) {
                setSelectedTopUp(response.data.data);
                setShowModal(true);
                setAdminNotes(response.data.data.adminNotes || "");
                setRejectionReason(response.data.data.rejectionReason || "");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch top-up details");
        }
    };

    const handleDeleteClick = (topUp) => {
        // setSelectedTopUp(topUp);
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        // if (!selectedTopUp) return;

        setActionLoading(true);
        try {
            const response = await api.delete(
                API_ENDPOINTS.walletTopUp.adminDelete.replace(":id", selectedTopUp.id)
            );
            if (response.data.success) {
                setShowDeleteConfirm(false);
                // setSelectedTopUp(null);
                fetchTopUps();
                fetchStats();
                alert("Wallet top-up deleted successfully!");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete wallet top-up");
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
            approved: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
            rejected: { color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
        };

        const config = statusConfig[status] || {
            color: "bg-gray-100 text-gray-800 border-gray-200",
            icon: AlertCircle,
        };
        const Icon = config.icon;

        return (
            <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}
            >
                <Icon className="w-3 h-3" />
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
            </span>
        );
    };

    const filteredTopUps = topUps.filter((topUp) => {
        const q = search.toLowerCase();
        return (
            topUp.user?.name?.toLowerCase().includes(q) ||
            topUp.user?.email?.toLowerCase().includes(q) ||
            topUp.user?.mobile?.toLowerCase().includes(q) ||
            topUp.user?.userId?.toLowerCase().includes(q) ||
            topUp.transactionId?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-12 px-4 pt-20">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                                <Wallet className="w-8 h-8 text-orange-500" />
                                Wallet Top-Up Manager
                            </h1>
                            <p className="text-gray-600 mt-2">Manage wallet top-up requests and approvals</p>
                        </div>
                        <button
                            onClick={() => {
                                fetchTopUps();
                                fetchStats();
                            }}
                            className="p-2 rounded-lg bg-orange-100 hover:bg-orange-200 transition-colors"
                        >
                            <RefreshCw className="w-5 h-5 text-orange-600" />
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                            <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-5 h-5 text-yellow-600" />
                                <span className="text-sm font-medium text-yellow-800">Pending</span>
                            </div>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium text-green-800">Approved</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                            <div className="flex items-center gap-2 mb-1">
                                <XCircle className="w-5 h-5 text-red-600" />
                                <span className="text-sm font-medium text-red-800">Rejected</span>
                            </div>
                            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <div className="flex items-center gap-2 mb-1">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">Total</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-5 h-5 text-purple-600" />
                                <span className="text-sm font-medium text-purple-800">Recent (7d)</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-600">{stats.recent}</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, mobile, or transaction ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                        <p className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </p>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" />
                            <p className="text-gray-600 mt-2">Loading wallet top-up requests...</p>
                        </div>
                    ) : filteredTopUps.length === 0 ? (
                        <div className="p-8 text-center">
                            <Wallet className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-600">No wallet top-up requests found.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gradient-to-r from-orange-500 to-rose-500 text-white">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">Payment Method</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">Transaction ID</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">Submitted</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredTopUps.map((topUp) => (
                                            <tr key={topUp.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-gray-800">{topUp.user?.name || "N/A"}</p>
                                                        <p className="text-xs text-gray-500">{topUp.user?.email || ""}</p>
                                                        <p className="text-xs text-gray-500">{topUp.user?.mobile || ""}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1">
                                                        <IndianRupee className="w-4 h-4 text-gray-600" />
                                                        <span className="font-semibold text-gray-800">
                                                            {topUp.paymentAmount.toLocaleString("en-IN", {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{topUp.paymentMethod}</td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-700 font-mono">{topUp.transactionId}</p>
                                                </td>
                                                <td className="px-4 py-3">{getStatusBadge(topUp.status)}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {new Date(topUp.submittedAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => openTopUpModal(topUp.id)}
                                                            className="px-3 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium transition-colors flex items-center gap-1"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            View
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(topUp)}
                                                            disabled={topUp.status === "approved"}
                                                            className="px-3 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title={topUp.status === "approved" ? "Cannot delete approved top-ups" : "Delete"}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-4 py-4 border-t border-gray-200 flex items-center justify-between">
                                    <p className="text-sm text-gray-600">
                                        Page {currentPage} of {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Modal */}
                {showModal && selectedTopUp && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-gray-800">Wallet Top-Up Details</h2>
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            setSelectedTopUp(null);
                                            setAdminNotes("");
                                            setRejectionReason("");
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* User Info */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="font-semibold text-gray-800 mb-3">User Information</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-600">Name:</p>
                                            <p className="font-medium text-gray-800">{selectedTopUp.user?.name || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">User ID:</p>
                                            <p className="font-medium text-gray-800">{selectedTopUp.user?.userId || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Email:</p>
                                            <p className="font-medium text-gray-800">{selectedTopUp.user?.email || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Mobile:</p>
                                            <p className="font-medium text-gray-800">{selectedTopUp.user?.mobile || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Info */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="font-semibold text-gray-800 mb-3">Payment Information</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-600">Amount:</p>
                                            <p className="font-semibold text-gray-800 flex items-center gap-1">
                                                <IndianRupee className="w-4 h-4" />
                                                {selectedTopUp.paymentAmount.toLocaleString("en-IN", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Payment Method:</p>
                                            <p className="font-medium text-gray-800">{selectedTopUp.paymentMethod}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-gray-600">Transaction ID:</p>
                                            <p className="font-mono text-gray-800">{selectedTopUp.transactionId}</p>
                                        </div>
                                        {selectedTopUp.additionalNotes && (
                                            <div className="col-span-2">
                                                <p className="text-gray-600">Additional Notes:</p>
                                                <p className="text-gray-800">{selectedTopUp.additionalNotes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Payment Proof */}
                                {selectedTopUp.paymentProofUrl && (
                                    <div>
                                        <h3 className="font-semibold text-gray-800 mb-3">Payment Proof</h3>
                                        <img
                                            src={selectedTopUp.paymentProofUrl}
                                            alt="Payment Proof"
                                            className="w-full rounded-xl border border-gray-200 max-h-96 object-contain"
                                        />
                                    </div>
                                )}

                                {/* Status Info */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="font-semibold text-gray-800 mb-3">Status Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">Status:</span>
                                            {getStatusBadge(selectedTopUp.status)}
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Submitted:</p>
                                            <p className="text-gray-800">
                                                {new Date(selectedTopUp.submittedAt).toLocaleString()}
                                            </p>
                                        </div>
                                        {selectedTopUp.approvedAt && (
                                            <div>
                                                <p className="text-gray-600">Approved:</p>
                                                <p className="text-gray-800">
                                                    {new Date(selectedTopUp.approvedAt).toLocaleString()} by{" "}
                                                    {selectedTopUp.approvedBy?.name || "N/A"}
                                                </p>
                                            </div>
                                        )}
                                        {selectedTopUp.rejectedAt && (
                                            <div>
                                                <p className="text-gray-600">Rejected:</p>
                                                <p className="text-gray-800">
                                                    {new Date(selectedTopUp.rejectedAt).toLocaleString()} by{" "}
                                                    {selectedTopUp.rejectedBy?.name || "N/A"}
                                                </p>
                                                {selectedTopUp.rejectionReason && (
                                                    <p className="text-red-600 mt-1">
                                                        Reason: {selectedTopUp.rejectionReason}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Admin Notes */}
                                {selectedTopUp.status === "pending" && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Admin Notes (Optional)
                                            </label>
                                            <textarea
                                                value={adminNotes}
                                                onChange={(e) => setAdminNotes(e.target.value)}
                                                rows="3"
                                                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                placeholder="Add any notes about this transaction..."
                                            />
                                        </div>

                                        {selectedTopUp.status === "pending" && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Rejection Reason (Required for rejection)
                                                </label>
                                                <textarea
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                    rows="2"
                                                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                    placeholder="Enter reason for rejection..."
                                                />
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleApprove(selectedTopUp.id)}
                                                disabled={actionLoading}
                                                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                            >
                                                {actionLoading ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-5 h-5" />
                                                        Approve
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleReject(selectedTopUp.id)}
                                                disabled={actionLoading || !rejectionReason.trim()}
                                                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                            >
                                                {actionLoading ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <>
                                                        <XCircle className="w-5 h-5" />
                                                        Reject
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && selectedTopUp && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">Delete Wallet Top-Up</h2>
                                        <p className="text-sm text-gray-600">This action cannot be undone</p>
                                    </div>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-gray-700 mb-2">
                                        Are you sure you want to delete this wallet top-up request?
                                    </p>
                                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                                        <p><strong>User:</strong> {selectedTopUp.user?.name || "N/A"}</p>
                                        <p><strong>Amount:</strong> ₹{selectedTopUp.paymentAmount?.toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }) || "0.00"}</p>
                                        <p><strong>Status:</strong> {selectedTopUp.status || "N/A"}</p>
                                        <p><strong>Transaction ID:</strong> {selectedTopUp.transactionId || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteConfirm(false);
                                            setSelectedTopUp(null);
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                        disabled={actionLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                                    >
                                        {actionLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
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
        </div>
    );
};

export default AdminWalletTopUpManager;
