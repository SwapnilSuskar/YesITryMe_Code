import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    Crown,
    Eye,
    Gift,
    IndianRupee,
    Loader2,
    Mail,
    Package,
    Phone,
    Receipt,
    Search,
    Shield,
    TrendingDown,
    TrendingUp,
    User,
    UserCheck,
    Users,
    Wallet,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { API_ENDPOINTS } from '../../config/api';

const UserDashboardViewer = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDashboardData, setUserDashboardData] = useState(null);
    const [superPackageCommissions, setSuperPackageCommissions] = useState({
        totalEarned: 0,
    });
    const [loading, setLoading] = useState(true);
    const [userDataLoading, setUserDataLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    // Helper function to get display status
    const getDisplayStatus = (status) => {
        if (status === 'free') return 'Free';
        if (status === 'active') return 'Active';
        if (status === 'kyc_verified') return 'KYC Verified';
        if (status === 'blocked') return 'Blocked';
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    // Helper function to get status badge color
    const getStatusBadgeColor = (status) => {
        if (status === 'active') return 'bg-green-100 text-green-800';
        if (status === 'free') return 'bg-yellow-100 text-yellow-800';
        if (status === 'kyc_verified') return 'bg-blue-100 text-blue-800';
        if (status === 'blocked') return 'bg-red-100 text-red-800';
        return 'bg-gray-100 text-gray-800';
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get(API_ENDPOINTS.admin.users);
            setUsers(response.data.users || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDashboardData = async (userId) => {
        try {
            setUserDataLoading(true);
            const dashboardResponse = await api.get(`${API_ENDPOINTS.admin.userDashboard}/${userId}/dashboard`);
            setUserDashboardData(dashboardResponse.data.data);

            // Try to fetch super package commissions, but default to 0 if not available
            try {
                const superPackageResponse = await api.get(API_ENDPOINTS.superPackages.commissionSummary);
                setSuperPackageCommissions(superPackageResponse.data?.data || { totalEarned: 0 });
            } catch {
                // If super package commissions can't be fetched (e.g., admin viewing different user), default to 0
                setSuperPackageCommissions({ totalEarned: 0 });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch user dashboard data');
        } finally {
            setUserDataLoading(false);
        }
    };

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        fetchUserDashboardData(user._id);
    };

    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
            user.firstName?.toLowerCase().includes(searchLower) ||
            user.lastName?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.mobile?.toLowerCase().includes(searchLower) ||
            user.userId?.toLowerCase().includes(searchLower)
        );
    });

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status, type = 'user') => {
        const statusConfig = {
            user: {
                active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
                inactive: { color: 'bg-red-100 text-red-800', icon: XCircle },
                pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock }
            },
            kyc: {
                approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
                rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
                pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock }
            },
            payout: {
                approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
                completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
                rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
                pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock }
            }
        };

        const config = statusConfig[type][status] || statusConfig[type].pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <Icon size={12} />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getPayoutStatusIcon = (status) => {
        switch (status) {
            case 'completed':
            case 'approved':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'rejected':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'pending':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    <span className="text-gray-600">Loading users...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8 px-4 mt-16">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                to="/admin"
                                className="p-2 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                                    <Eye className="w-8 h-8 text-orange-500" />
                                    User Dashboard Viewer
                                </h1>
                                <p className="text-gray-600 mt-1">View complete dashboard data for any user</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Total Users</div>
                            <div className="text-2xl font-bold text-orange-500">{users.length}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User Selection Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-orange-500" />
                                Select User
                            </h2>

                            {/* Search */}
                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* User List */}
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {filteredUsers.map((user) => (
                                    <div
                                        key={user._id}
                                        onClick={() => handleUserSelect(user)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedUser?._id === user._id
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-gray-200 bg-white hover:border-orange-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-orange-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {user.firstName} {user.lastName}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate">{user.email}</div>
                                                <div className="text-xs text-gray-400">ID: {user.userId}</div>

                                            </div>
                                            <div className="text-right">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
                                                    {getDisplayStatus(user.status)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* User Dashboard Data */}
                    <div className="lg:col-span-2">
                        {!selectedUser ? (
                            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 p-12 text-center">
                                <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a User</h3>
                                <p className="text-gray-500">Choose a user from the list to view their dashboard data</p>
                            </div>
                        ) : userDataLoading ? (
                            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 p-12 text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
                                <p className="text-gray-600">Loading dashboard data...</p>
                            </div>
                        ) : userDashboardData ? (
                            <div className="space-y-6">
                                {/* User Info Header */}
                                <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                                            <User className="w-8 h-8 text-orange-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-gray-800">
                                                {userDashboardData.user.firstName} {userDashboardData.user.lastName}
                                            </h2>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-4 h-4" />
                                                    {userDashboardData.user.email}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-4 h-4" />
                                                    {userDashboardData.user.mobile}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Shield className="w-4 h-4" />
                                                    ID: {userDashboardData.user.userId}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-blue-500" />
                                                <span className="text-sm text-gray-600">
                                                    Activated: {userDashboardData.user.activationDate ? formatDate(userDashboardData.user.activationDate) : 'Not Activated'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-green-500" />
                                                <span className="text-sm text-gray-600">Joined: {formatDate(userDashboardData.user.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <UserCheck className="w-4 h-4 text-blue-500" />
                                                <span className="text-sm text-gray-600">
                                                    Status: {getDisplayStatus(userDashboardData.user.status)}
                                                </span>
                                            </div>
                                            {userDashboardData.user.sponsorName && (
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-purple-500" />
                                                    <span className="text-sm text-gray-600">
                                                        Referrer: {userDashboardData.user.sponsorName}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* User's Dashboard View - Exactly as they see it */}
                                <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 p-6 mb-6">
                                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Eye className="w-5 h-5 text-orange-500" />
                                        User's Dashboard View (What they see)
                                    </h3>
                                    {/* Stats Cards - Exactly as user sees */}
                                    {(() => {
                                        // Calculate values exactly as Dashboard does
                                        const activeIncome = parseFloat(userDashboardData.activeIncome || 0) || 0;
                                        const passiveIncome = parseFloat(userDashboardData.passiveIncome || 0) || 0;
                                        const royaltyIncome = parseFloat(userDashboardData.royaltyIncome || 0) || 0;
                                        const rewardIncome = parseFloat(userDashboardData.rewardIncome || 0) || 0;
                                        const leadershipFund = parseFloat(userDashboardData.leadershipFund || 0) || 0;
                                        const withdrawn = parseFloat(userDashboardData.withdrawn || 0) || 0;
                                        const totalFunds = parseFloat(userDashboardData.userFunds?.totalFunds || 0) || 0;
                                        const superPackageTotalEarned = parseFloat(superPackageCommissions.totalEarned || 0) || 0;

                                        // Wallet calculation: Active + Passive + Super Package + Special Income (matches Dashboard)
                                        const walletIncome = activeIncome + passiveIncome + superPackageTotalEarned + royaltyIncome + rewardIncome + leadershipFund;
                                        const displayWalletIncome = Math.floor(walletIncome);

                                        // Total Active Income: Active + Total Funds + Special Income (matches Dashboard)
                                        const totalActiveIncome = activeIncome + totalFunds + royaltyIncome + rewardIncome + leadershipFund;

                                        // Total Income: Active + Passive + Super Package + Special Income + Withdrawn (matches Dashboard)
                                        const totalIncome = activeIncome + passiveIncome + superPackageTotalEarned + royaltyIncome + rewardIncome + leadershipFund + withdrawn;
                                        const displayTotalIncome = Math.floor(totalIncome);

                                        return (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Wallet className="w-4 h-4 text-green-500" />
                                                        <span className="text-xs font-medium text-gray-600">Wallet</span>
                                                    </div>
                                                    <div className="text-lg font-bold text-green-700">
                                                        ₹{displayWalletIncome.toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <IndianRupee className="w-4 h-4 text-blue-500" />
                                                        <span className="text-xs font-medium text-gray-600">Withdrawn</span>
                                                    </div>
                                                    <div className="text-lg font-bold text-blue-700">
                                                        ₹{Math.floor(withdrawn).toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Users className="w-4 h-4 text-purple-500" />
                                                        <span className="text-xs font-medium text-gray-600">My Referrals</span>
                                                    </div>
                                                    <div className="text-lg font-bold text-purple-700">
                                                        {userDashboardData.referralLeads || '0'}
                                                    </div>
                                                </div>
                                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Package className="w-4 h-4 text-red-500" />
                                                        <span className="text-xs font-medium text-gray-600">My Successfully Downline</span>
                                                    </div>
                                                    <div className="text-lg font-bold text-red-700">
                                                        {(() => {
                                                            // Use directBuyers and directSuperPackageBuyers from backend to match Dashboard exactly
                                                            const directBuyers = parseInt(userDashboardData.directBuyers || 0, 10) || 0;
                                                            const directSuperPackageBuyers = parseInt(userDashboardData.directSuperPackageBuyers || 0, 10) || 0;
                                                            return (directBuyers + directSuperPackageBuyers).toLocaleString();
                                                        })()}
                                                    </div>
                                                </div>
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <TrendingUp className="w-4 h-4 text-blue-500" />
                                                        <span className="text-xs font-medium text-gray-600">Active Income</span>
                                                    </div>
                                                    <div className="text-lg font-bold text-blue-700">
                                                        ₹{Math.floor(totalActiveIncome).toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Users className="w-4 h-4 text-green-500" />
                                                        <span className="text-xs font-medium text-gray-600">Passive Income</span>
                                                    </div>
                                                    <div className="text-lg font-bold text-green-700">
                                                        ₹{Math.floor(passiveIncome).toLocaleString('en-IN')}
                                                    </div>
                                                </div>

                                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <IndianRupee className="w-4 h-4 text-orange-500" />
                                                        <span className="text-xs font-medium text-gray-600">Leadership Fund</span>
                                                    </div>
                                                    <div className="text-lg font-bold text-orange-700">
                                                        ₹{Math.floor(leadershipFund).toLocaleString('en-IN')}
                                                    </div>
                                                </div>

                                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Crown className="w-4 h-4 text-purple-500" />
                                                        <span className="text-xs font-medium text-gray-600">Royalty Income</span>
                                                    </div>
                                                    <div className="text-lg font-bold text-purple-700">
                                                        ₹{Math.floor(royaltyIncome).toLocaleString('en-IN')}
                                                    </div>
                                                </div>

                                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Gift className="w-4 h-4 text-yellow-500" />
                                                        <span className="text-xs font-medium text-gray-600">Reward Income</span>
                                                    </div>
                                                    <div className="text-lg font-bold text-yellow-700">
                                                        ₹{Math.floor(rewardIncome).toLocaleString('en-IN')}
                                                    </div>
                                                </div>

                                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Package className="w-4 h-4 text-indigo-500" />
                                                        <span className="text-xs font-medium text-gray-600">Super Package Commissions</span>
                                                    </div>
                                                    <div className="text-lg font-bold text-indigo-700">
                                                        ₹{Math.floor(superPackageTotalEarned).toLocaleString('en-IN')}
                                                    </div>
                                                </div>

                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Wallet className="w-4 h-4 text-blue-500" />
                                                        <span className="text-xs font-medium text-gray-600">Total Income</span>
                                                    </div>
                                                    <div className="text-lg font-bold text-blue-700">
                                                        ₹{displayTotalIncome.toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Funds Section - Exactly as user sees */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="text-lg font-bold text-gray-800 mb-3">Your Funds</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                                <div className="text-2xl mb-1">📱</div>
                                                <div className="text-sm font-medium text-gray-600">Mobile Fund</div>
                                                <div className="text-lg font-bold text-blue-700">
                                                    ₹{userDashboardData.userFunds?.mobileFund?.toLocaleString() || '0'}
                                                </div>
                                            </div>

                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                                                <div className="text-2xl mb-1">💻</div>
                                                <div className="text-sm font-medium text-gray-600">Laptop Fund</div>
                                                <div className="text-lg font-bold text-green-700">
                                                    ₹{userDashboardData.userFunds?.laptopFund?.toLocaleString() || '0'}
                                                </div>
                                            </div>

                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                                                <div className="text-2xl mb-1">🏍️</div>
                                                <div className="text-sm font-medium text-gray-600">Bike Fund</div>
                                                <div className="text-lg font-bold text-yellow-700">
                                                    ₹{userDashboardData.userFunds?.bikeFund?.toLocaleString() || '0'}
                                                </div>
                                            </div>

                                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                                                <div className="text-2xl mb-1">🚗</div>
                                                <div className="text-sm font-medium text-gray-600">Car Fund</div>
                                                <div className="text-lg font-bold text-orange-700">
                                                    ₹{userDashboardData.userFunds?.carFund?.toLocaleString() || '0'}
                                                </div>
                                            </div>

                                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                                                <div className="text-2xl mb-1">🏠</div>
                                                <div className="text-sm font-medium text-gray-600">House Fund</div>
                                                <div className="text-lg font-bold text-purple-700">
                                                    ₹{userDashboardData.userFunds?.houseFund?.toLocaleString() || '0'}
                                                </div>
                                            </div>

                                            <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 text-center">
                                                <div className="text-2xl mb-1">✈️</div>
                                                <div className="text-sm font-medium text-gray-600">Travel Fund</div>
                                                <div className="text-lg font-bold text-pink-700">
                                                    ₹{userDashboardData.userFunds?.travelFund?.toLocaleString() || '0'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 bg-gray-100 rounded-lg p-3 text-center">
                                            <div className="text-sm font-medium text-gray-600">Total Funds</div>
                                            <div className="text-xl font-bold text-gray-800">
                                                ₹{userDashboardData.userFunds?.totalFunds?.toLocaleString() || '0'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Referrer Information Section */}
                                {userDashboardData.user.sponsorName && (
                                    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
                                        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                                                <Users size={24} />
                                            </div>
                                            Referrer Information
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                                        <Users className="w-6 h-6 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-bold text-gray-800">Sponsor Details</h4>
                                                        <p className="text-sm text-gray-600">Who referred this user</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium text-gray-600">Sponsor Name:</span>
                                                        <span className="text-sm font-semibold text-gray-800">{userDashboardData.user.sponsorName}</span>
                                                    </div>
                                                    {userDashboardData.user.sponsorMobile && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-medium text-gray-600">Sponsor Mobile:</span>
                                                            <span className="text-sm font-semibold text-gray-800">{userDashboardData.user.sponsorMobile}</span>
                                                        </div>
                                                    )}
                                                    {userDashboardData.user.sponsorId && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-medium text-gray-600">Sponsor ID:</span>
                                                            <span className="text-sm font-semibold text-gray-800">{userDashboardData.user.sponsorId}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium text-gray-600">Referral Code:</span>
                                                        <span className="text-sm font-semibold text-purple-600">{userDashboardData.user.referralCode || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <TrendingUp className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-bold text-gray-800">Referral Statistics</h4>
                                                        <p className="text-sm text-gray-600">User's referral performance</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium text-gray-600">Total Referrals:</span>
                                                        <span className="text-sm font-semibold text-blue-600">{userDashboardData.referralLeads || 0}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium text-gray-600">Active Downline:</span>
                                                        <span className="text-sm font-semibold text-green-600">{userDashboardData.successfullyDownline || 0}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium text-gray-600">Referral Link:</span>
                                                        <span className="text-sm font-semibold text-blue-600 truncate">
                                                            {userDashboardData.user.referralLink ? (
                                                                <a
                                                                    href={userDashboardData.user.referralLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="hover:underline"
                                                                >
                                                                    View Link
                                                                </a>
                                                            ) : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Payout History Section */}
                                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                                            <Receipt size={24} />
                                        </div>
                                        Payout History & Wallet Transactions
                                    </h3>

                                    {userDashboardData.payoutHistory && userDashboardData.payoutHistory.length > 0 ? (
                                        <div className="space-y-4">
                                            {userDashboardData.payoutHistory.slice(0, 10).map((payout, index) => (
                                                <div key={payout._id || index} className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-100 to-indigo-100">
                                                                {getPayoutStatusIcon(payout.status)}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <span className="text-lg font-bold text-gray-800">
                                                                        ₹{parseFloat(payout.amount || 0).toLocaleString()}
                                                                    </span>
                                                                    {getStatusBadge(payout.status, 'payout')}
                                                                </div>
                                                                <div className="text-sm text-gray-600 space-y-1">
                                                                    <div>Request Date: {formatDateTime(payout.requestDate)}</div>
                                                                    {payout.completionDate && (
                                                                        <div>Completion Date: {formatDateTime(payout.completionDate)}</div>
                                                                    )}
                                                                    {payout.paymentMethod && (
                                                                        <div>Payment Method: {payout.paymentMethod}</div>
                                                                    )}
                                                                    {payout.adminNotes && (
                                                                        <div className="text-orange-600 font-medium">Admin Notes: {payout.adminNotes}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm text-gray-500">Net Amount</div>
                                                            <div className="text-lg font-bold text-green-600">
                                                                ₹{parseFloat(payout.netAmount || 0).toLocaleString()}
                                                            </div>
                                                            {payout.adminCharge > 0 && (
                                                                <div className="text-xs text-gray-500">
                                                                    Charges: ₹{payout.adminCharge}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <Receipt className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <h4 className="text-lg font-semibold text-gray-600 mb-2">No Payout History</h4>
                                            <p className="text-gray-500">This user hasn't made any payout requests yet.</p>
                                        </div>
                                    )}
                                    {/* Wallet Transactions Section */}
                                    {userDashboardData.walletTransactions && userDashboardData.walletTransactions.length > 0 && (
                                        <div className="mt-8">
                                            <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                <Wallet className="w-5 h-5 text-blue-500" />
                                                Recent Wallet Transactions
                                            </h4>
                                            <div className="space-y-3">
                                                {userDashboardData.walletTransactions.slice(0, 5).map((transaction, index) => (
                                                    <div key={transaction._id || index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-lg bg-blue-100">
                                                                    {transaction.type === 'withdrawal' ? (
                                                                        <TrendingDown className="w-4 h-4 text-red-500" />
                                                                    ) : (
                                                                        <TrendingUp className="w-4 h-4 text-green-500" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-gray-800">
                                                                        {transaction.description || transaction.type}
                                                                    </div>
                                                                    <div className="text-sm text-gray-600">
                                                                        {formatDateTime(transaction.timestamp || transaction.createdAt)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`text-lg font-bold ${transaction.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'
                                                                    }`}>
                                                                    {transaction.type === 'withdrawal' ? '-' : '+'}₹{parseFloat(transaction.amount || 0).toLocaleString()}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {transaction.type}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        ) : (
                            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 p-12 text-center">
                                <XCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">Error Loading Data</h3>
                                <p className="text-gray-500">{error || 'Failed to load user dashboard data'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboardViewer; 