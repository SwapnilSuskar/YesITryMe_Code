import { BarChart3, BookOpen, CreditCard, Edit, Eye, FileText, Image as ImageIcon, MoreVertical, Package, Quote, Search, ShieldCheck, ShoppingCart, Trash2, User, Wallet, YoutubeIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api, { API_ENDPOINTS } from "../../config/api";
import UserForm from "./UserForm";

const AdminDashboard = () => {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [kycStats, setKycStats] = useState({ pending: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formMode, setFormMode] = useState('create');
  const [showActions, setShowActions] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(API_ENDPOINTS.admin.users);
      setUsers(response.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchKycStats = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.kyc.adminStats);
      if (response.data.success) {
        setKycStats(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch KYC stats:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchKycStats();
  }, []);

  // Remove handleCreateUser and all references to showUserForm in create mode
  // Remove the Create User button in the search bar section
  // Only allow opening UserForm for editing
  const handleEditUser = (user) => {
    setFormMode('edit');
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`${API_ENDPOINTS.admin.users}/${userId}`);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      if (formMode === 'create') {
        await api.post(API_ENDPOINTS.admin.users, userData);
      } else {
        await api.put(`${API_ENDPOINTS.admin.users}/${editingUser._id}`, userData);
      }

      setShowUserForm(false);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  };

  // Summary stats
  const total = users.length;
  const activated = users.filter(u => u.activationDate).length;
  const kyc = users.filter(u => u.kycApprovedDate).length;

  // Filtered users
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.mobile?.toLowerCase().includes(q)
    );
  });

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filtered.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filtered.length / usersPerPage);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Close actions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showActions && !event.target.closest('.actions-dropdown')) {
        setShowActions(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActions]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col items-center py-12 px-4 pt-20  overflow-x-hidden">
      {/* Blurred Gradient Blobs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-[#FF4E00] to-orange-500 rounded-full blur-3xl opacity-20 z-0" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20 z-0" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-pink-400 to-red-400 rounded-full blur-3xl opacity-20 z-0" />
      <div className="w-full max-w-6xl relative z-10">
        {/* Header with stats */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 p-8 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-800 drop-shadow-lg flex items-center gap-3">
              <ShieldCheck className="w-10 h-10 text-orange-500" /> Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2 text-sm">Manage users, activation, and KYC approvals easily.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/90 backdrop-blur rounded-2xl px-6 py-3 flex flex-col items-center shadow border border-orange-100">
              <span className="text-lg font-bold text-[#FF4E00]">{total}</span>
              <span className="text-xs text-gray-600">Total Users</span>
            </div>
            <div className="bg-white/90 backdrop-blur rounded-2xl px-6 py-3 flex flex-col items-center shadow border border-orange-100">
              <span className="text-lg font-bold text-green-500">{activated}</span>
              <span className="text-xs text-gray-600">Activated</span>
            </div>
            <div className="bg-white/90 backdrop-blur rounded-2xl px-6 py-3 flex flex-col items-center shadow border border-orange-100">
              <span className="text-lg font-bold text-blue-500">{kyc}</span>
              <span className="text-xs text-gray-600">KYC Approved</span>
            </div>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-orange-500" />
            Admin Tools
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link
              to="/admin"
              className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${location.pathname === "/admin"
                ? "bg-gradient-to-br from-[#FF4E00] to-orange-500 text-white shadow-lg"
                : "bg-gradient-to-br from-white to-gray-50 text-gray-700 hover:from-orange-50 hover:to-orange-100 border border-gray-200 hover:border-orange-300"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${location.pathname === "/admin" ? "bg-white/20" : "bg-orange-100 group-hover:bg-orange-200"}`}>
                  <User className={`w-8 h-8 ${location.pathname === "/admin" ? "text-white" : "text-orange-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">User Management</h3>
                  <p className="text-xs opacity-75 mt-1">Manage all users</p>
                </div>
              </div>
            </Link>
            <Link
              to="/admin/analytics"
              className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${location.pathname === "/admin/analytics"
                ? "bg-gradient-to-br from-[#FF4E00] to-orange-500 text-white shadow-lg"
                : "bg-gradient-to-br from-white to-gray-50 text-gray-700 hover:from-orange-50 hover:to-orange-100 border border-gray-200 hover:border-orange-300"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${location.pathname === "/admin/analytics" ? "bg-white/20" : "bg-blue-100 group-hover:bg-blue-200"}`}>
                  <BarChart3 className={`w-8 h-8 ${location.pathname === "/admin/analytics" ? "text-white" : "text-blue-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Analytics</h3>
                  <p className="text-xs opacity-75 mt-1">View insights</p>
                </div>
              </div>
            </Link>

            {/* <Link
              to="/admin/referrals"
              className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${location.pathname === "/admin/referrals"
                ? "bg-gradient-to-br from-[#FF4E00] to-orange-500 text-white shadow-lg"
                : "bg-gradient-to-br from-white to-gray-50 text-gray-700 hover:from-orange-50 hover:to-orange-100 border border-gray-200 hover:border-orange-300"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${location.pathname === "/admin/referrals" ? "bg-white/20" : "bg-green-100 group-hover:bg-green-200"}`}>
                  <Network className={`w-8 h-8 ${location.pathname === "/admin/referrals" ? "text-white" : "text-green-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Referral Manager</h3>
                  <p className="text-xs opacity-75 mt-1">Manage referrals</p>
                </div>
              </div>
            </Link> */}

            <Link
              to="/admin/purchases"
              className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${location.pathname === "/admin/purchases"
                ? "bg-gradient-to-br from-[#FF4E00] to-orange-500 text-white shadow-lg"
                : "bg-gradient-to-br from-white to-gray-50 text-gray-700 hover:from-orange-50 hover:to-orange-100 border border-gray-200 hover:border-orange-300"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${location.pathname === "/admin/purchases" ? "bg-white/20" : "bg-purple-100 group-hover:bg-purple-200"}`}>
                  <ShoppingCart className={`w-8 h-8 ${location.pathname === "/admin/purchases" ? "text-white" : "text-purple-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Purchase Manager</h3>
                  <p className="text-xs opacity-75 mt-1">Track purchases</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/quotes"
              className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${location.pathname === "/admin/quotes"
                ? "bg-gradient-to-br from-[#FF4E00] to-orange-500 text-white shadow-lg"
                : "bg-gradient-to-br from-white to-gray-50 text-gray-700 hover:from-orange-50 hover:to-orange-100 border border-gray-200 hover:border-orange-300"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${location.pathname === "/admin/quotes" ? "bg-white/20" : "bg-yellow-100 group-hover:bg-yellow-200"}`}>
                  <Quote className={`w-8 h-8 ${location.pathname === "/admin/quotes" ? "text-white" : "text-yellow-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Motivation Quotes</h3>
                  <p className="text-xs opacity-75 mt-1">Manage quotes</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/gallery"
              className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${location.pathname === "/admin/gallery"
                ? "bg-gradient-to-br from-[#FF4E00] to-orange-500 text-white shadow-lg"
                : "bg-gradient-to-br from-white to-gray-50 text-gray-700 hover:from-orange-50 hover:to-orange-100 border border-gray-200 hover:border-orange-300"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${location.pathname === "/admin/gallery" ? "bg-white/20" : "bg-pink-100 group-hover:bg-pink-200"}`}>
                  <ImageIcon className={`w-8 h-8 ${location.pathname === "/admin/gallery" ? "text-white" : "text-pink-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Gallery Manager</h3>
                  <p className="text-xs opacity-75 mt-1">Upload images</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/funds"
              className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${location.pathname === "/admin/funds"
                ? "bg-gradient-to-br from-[#FF4E00] to-orange-500 text-white shadow-lg"
                : "bg-gradient-to-br from-white to-gray-50 text-gray-700 hover:from-orange-50 hover:to-orange-100 border border-gray-200 hover:border-orange-300"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${location.pathname === "/admin/funds" ? "bg-white/20" : "bg-emerald-100 group-hover:bg-emerald-200"}`}>
                  <Wallet className={`w-8 h-8 ${location.pathname === "/admin/funds" ? "text-white" : "text-emerald-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Funds Management</h3>
                  <p className="text-xs opacity-75 mt-1">Manage finances</p>
                </div>
              </div>
            </Link>
            <Link
              to="/admin/payments"
              className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${location.pathname === "/admin/payments"
                ? "bg-gradient-to-br from-[#FF4E00] to-orange-500 text-white shadow-lg"
                : "bg-gradient-to-br from-white to-gray-50 text-gray-700 hover:from-orange-50 hover:to-orange-100 border border-gray-200 hover:border-orange-300"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${location.pathname === "/admin/payments" ? "bg-white/20" : "bg-indigo-100 group-hover:bg-indigo-200"}`}>
                  <CreditCard className={`w-8 h-8 ${location.pathname === "/admin/payments" ? "text-white" : "text-indigo-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Payment Manager</h3>
                  <p className="text-xs opacity-75 mt-1">Verify payments</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/payouts"
              className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${location.pathname === "/admin/payouts"
                ? "bg-gradient-to-br from-[#FF4E00] to-orange-500 text-white shadow-lg"
                : "bg-gradient-to-br from-white to-gray-50 text-gray-700 hover:from-orange-50 hover:to-orange-100 border border-gray-200 hover:border-orange-300"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${location.pathname === "/admin/payouts" ? "bg-white/20" : "bg-cyan-100 group-hover:bg-cyan-200"}`}>
                  <Wallet className={`w-8 h-8 ${location.pathname === "/admin/payouts" ? "text-white" : "text-cyan-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Payout Manager</h3>
                  <p className="text-xs opacity-75 mt-1">Manage payouts</p>
                </div>
              </div>
            </Link>
            {/* <Link
              to="/admin/courses"
              className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${location.pathname === "/admin/courses"
                ? "bg-gradient-to-br from-[#FF4E00] to-orange-500 text-white shadow-lg"
                : "bg-gradient-to-br from-white to-gray-50 text-gray-700 hover:from-orange-50 hover:to-orange-100 border border-gray-200 hover:border-orange-300"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${location.pathname === "/admin/courses" ? "bg-white/20" : "bg-teal-100 group-hover:bg-teal-200"}`}>
                  <BookOpen className={`w-8 h-8 ${location.pathname === "/admin/courses" ? "text-white" : "text-teal-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Course Manager</h3>
                  <p className="text-xs opacity-75 mt-1">Manage content</p>
                </div>
              </div>
            </Link> */}

            <Link
              to="/admin/product-manager"
              className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${location.pathname === "/admin/product-manager"
                ? "bg-gradient-to-br from-[#FF4E00] to-orange-500 text-white shadow-lg"
                : "bg-gradient-to-br from-white to-gray-50 text-gray-700 hover:from-orange-50 hover:to-orange-100 border border-gray-200 hover:border-orange-300"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${location.pathname === "/admin/product-manager" ? "bg-white/20" : "bg-teal-100 group-hover:bg-teal-200"}`}>
                  <BookOpen className={`w-8 h-8 ${location.pathname === "/admin/product-manager" ? "text-white" : "text-teal-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Product Manager</h3>
                  <p className="text-xs opacity-75 mt-1">Manage products</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/super-packages"
              className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${location.pathname === "/admin/super-packages"
                ? "bg-gradient-to-br from-[#FF4E00] to-orange-500 text-white shadow-lg"
                : "bg-gradient-to-br from-white to-gray-50 text-gray-700 hover:from-orange-50 hover:to-orange-100 border border-gray-200 hover:border-orange-300"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${location.pathname === "/admin/super-packages" ? "bg-white/20" : "bg-violet-100 group-hover:bg-violet-200"}`}>
                  <Package className={`w-8 h-8 ${location.pathname === "/admin/super-packages" ? "text-white" : "text-violet-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Super Package Manager</h3>
                  <p className="text-xs opacity-75 mt-1">Manage super packages</p>
                </div>
              </div>
            </Link>
            <Link
              to="/admin/super-package-payments"
              className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${location.pathname === "/admin/super-package-payments"
                ? "bg-gradient-to-br from-[#FF4E00] to-orange-500 text-white shadow-lg"
                : "bg-gradient-to-br from-white to-gray-50 text-gray-700 hover:from-orange-50 hover:to-orange-100 border border-gray-200 hover:border-orange-300"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${location.pathname === "/admin/super-package-payments" ? "bg-white/20" : "bg-blue-100 group-hover:bg-blue-200"}`}>
                  <CreditCard className={`w-8 h-8 ${location.pathname === "/admin/super-package-payments" ? "text-white" : "text-blue-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Super Package Payments</h3>
                  <p className="text-xs opacity-75 mt-1">Approve payment verifications</p>
                </div>
              </div>
            </Link>
            <Link
              to="/admin/kyc"
              className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${location.pathname === "/admin/kyc"
                ? "bg-gradient-to-br from-[#FF4E00] to-orange-500 text-white shadow-lg"
                : "bg-gradient-to-br from-white to-gray-50 text-gray-700 hover:from-orange-50 hover:to-orange-100 border border-gray-200 hover:border-orange-300"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${location.pathname === "/admin/kyc" ? "bg-white/20" : "bg-red-100 group-hover:bg-red-200"}`}>
                  <FileText className={`w-8 h-8 ${location.pathname === "/admin/kyc" ? "text-white" : "text-red-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">KYC Management</h3>
                  <p className="text-xs opacity-75 mt-1">Review applications</p>
                </div>
                {kycStats.pending > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center font-bold shadow-lg">
                    {kycStats.pending > 99 ? '99+' : kycStats.pending}
                  </span>
                )}
              </div>
            </Link>

            <Link
              to="/admin/user-dashboard-viewer"
              className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${location.pathname === "/admin/user-dashboard-viewer"
                ? "bg-gradient-to-br from-[#FF4E00] to-orange-500 text-white shadow-lg"
                : "bg-gradient-to-br from-white to-gray-50 text-gray-700 hover:from-orange-50 hover:to-orange-100 border border-gray-200 hover:border-orange-300"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${location.pathname === "/admin/user-dashboard-viewer" ? "bg-white/20" : "bg-violet-100 group-hover:bg-violet-200"}`}>
                  <Eye className={`w-8 h-8 ${location.pathname === "/admin/user-dashboard-viewer" ? "text-white" : "text-violet-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">User Dashboard Viewer</h3>
                  <p className="text-xs opacity-75 mt-1">View user data</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/user-status"
              className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${location.pathname === "/admin/user-status"
                ? "bg-gradient-to-br from-[#FF4E00] to-orange-500 text-white shadow-lg"
                : "bg-gradient-to-br from-white to-gray-50 text-gray-700 hover:from-orange-50 hover:to-orange-100 border border-gray-200 hover:border-orange-300"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${location.pathname === "/admin/user-status" ? "bg-white/20" : "bg-violet-100 group-hover:bg-violet-200"}`}>
                  <User className={`w-8 h-8 ${location.pathname === "/admin/user-status" ? "text-white" : "text-violet-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">User Status</h3>
                  <p className="text-xs opacity-75 mt-1">Manage status</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/ai-tools"
              className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${location.pathname === "/admin/ai-tools"
                ? "bg-gradient-to-br from-[#FF4E00] to-orange-500 text-white shadow-lg"
                : "bg-gradient-to-br from-white to-gray-50 text-gray-700 hover:from-orange-50 hover:to-orange-100 border border-gray-200 hover:border-orange-300"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${location.pathname === "/admin/ai-tools" ? "bg-white/20" : "bg-indigo-100 group-hover:bg-indigo-200"}`}>
                  <svg className={`w-8 h-8 ${location.pathname === "/admin/ai-tools" ? "text-white" : "text-indigo-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm">AI Tools Manager</h3>
                  <p className="text-xs opacity-75 mt-1">Manage AI tools</p>
                </div>
              </div>
            </Link>
            <Link
              to="/admin/admin-social-tasks"
              className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${location.pathname === "/admin/admin-social-tasks"
                ? "bg-gradient-to-br from-[#FF4E00] to-orange-500 text-white shadow-lg"
                : "bg-gradient-to-br from-white to-gray-50 text-gray-700 hover:from-orange-50 hover:to-orange-100 border border-gray-200 hover:border-orange-300"
                }`}
            > 
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${location.pathname === "/admin/admin-social-tasks" ? "bg-white/20" : "bg-violet-100 group-hover:bg-violet-200"}`}>
                  <YoutubeIcon className={`w-8 h-8 ${location.pathname === "/admin/admin-social-tasks" ? "text-white" : "text-violet-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Social Tasks</h3>
                  <p className="text-xs opacity-75 mt-1">Manage social tasks</p>
                </div>
              </div>
            </Link>
            <Link
              to="/admin/coin-withdrawal-requests"
              className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${location.pathname === "/admin/withdrawal-requests"
                ? "bg-gradient-to-br from-[#FF4E00] to-orange-500 text-white shadow-lg"
                : "bg-gradient-to-br from-white to-gray-50 text-gray-700 hover:from-orange-50 hover:to-orange-100 border border-gray-200 hover:border-orange-300"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${location.pathname === "/admin/withdrawal-requests" ? "bg-white/20" : "bg-green-100 group-hover:bg-green-200"}`}>
                  <CreditCard className={`w-8 h-8 ${location.pathname === "/admin/withdrawal-requests" ? "text-white" : "text-green-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Coin Withdrawal Requests</h3>
                  <p className="text-xs opacity-75 mt-1">Approve withdrawals</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Search and Create User */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-xs">
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/80 backdrop-blur text-gray-800 placeholder-gray-400 border border-orange-100 focus:outline-none focus:ring-2 focus:ring-[#FF4E00]"
              placeholder="Search by name, email, or mobile..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-orange-500" />
          </div>

          {/* Remove the Create User button from the search bar section */}
        </div>

        {/* User Table */}
        <div className="overflow-x-auto rounded-2xl shadow-2xl bg-white/80 backdrop-blur border border-gray-200">
          {loading ? (
            <div className="text-center text-gray-700 text-lg py-10">Loading users...</div>
          ) : error ? (
            <div className="text-center text-red-400 text-lg py-10">{error}</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white">
                <tr>
                  <th className="py-3 px-4 text-left">User</th>
                  <th className="py-3 px-4 text-left">UserId</th>
                  <th className="py-3 px-4 text-left">Mobile</th>
                  <th className="py-3 px-4 text-left">Email</th>
                  <th className="py-3 px-4 text-left">Level</th>
                  <th className="py-3 px-4 text-left">Sponsor Mobile</th>
                  <th className="py-3 px-4 text-left">Registration</th>
                  <th className="py-3 px-4 text-left">Activation</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-gray-400 py-8">No users found.</td></tr>
                ) : currentUsers.map((u, i) => (
                  <tr key={u._id} className={i % 2 === 0 ? "bg-white/90" : "bg-white/70"}>
                    <td className="py-3 px-4 flex items-center gap-3 text-gray-800 font-semibold">
                      <span className="inline-block w-10 h-10 rounded-full bg-gradient-to-br from-[#FF4E00] to-orange-500 flex items-center justify-center text-lg font-bold text-white shadow">
                        {u.firstName?.[0] || "U"}{u.lastName?.[0] || ""}
                      </span>
                      <span>{u.firstName} {u.lastName}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{u.userId}</td>
                    <td className="py-3 px-4 text-gray-700">{u.mobile}</td>
                    <td className="py-3 px-4 text-gray-700">{u.email}</td>
                    <td className="py-3 px-4 text-gray-700">{u.mlmLevel}</td>
                    <td className="py-3 px-4 text-gray-700">{u.sponsorMobile || '-'}</td>
                    <td className="py-3 px-4 text-gray-700">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="py-3 px-4 text-gray-700">{u.activationDate ? new Date(u.activationDate).toLocaleDateString() : '-'}</td>
                    <td className="py-3 px-4 text-gray-700">
                      <div className="relative">
                        <button
                          onClick={() => setShowActions(showActions === u._id ? null : u._id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {showActions === u._id && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[120px] actions-dropdown">
                            <button
                              onClick={() => {
                                handleEditUser(u);
                                setShowActions(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteUser(u._id);
                                setShowActions(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white/80 backdrop-blur border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filtered.length)} of {filtered.length} users
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        className={`px-3 py-1 rounded-lg border transition-colors ${currentPage === pageNum
                          ? 'bg-orange-500 text-white border-orange-500'
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
                  className="px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Form Modal */}
      {editingUser && showUserForm && (
        <UserForm
          user={editingUser}
          mode="edit"
          onSave={handleSaveUser}
          onCancel={() => setShowUserForm(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard; 