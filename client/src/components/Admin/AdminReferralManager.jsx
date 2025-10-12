import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Eye,
  Loader2,
  Network,
  Search,
  SortAsc,
  SortDesc,
  UserCheck,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import Pagination from '../UI/Pagination';
import UserAvatar from '../UI/UserAvatar';

const AdminTeamManager = () => {
  const { user, token } = useAuthStore();
  const [referralTree, setReferralTree] = useState({ totalReferrals: 0, directReferrals: [] });
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'referrals', 'status', 'level'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  const [viewMode, setViewMode] = useState('all'); // 'all', 'withReferrals', 'active', 'inactive'
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(15);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalReferrals: 0,
    avgReferralsPerUser: 0
  });

  useEffect(() => {
    if (user && token) {
      fetchReferralTree();
    }
  }, [user, token]);

  // Use the same API endpoint as MyTeam component
  const fetchReferralTree = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.packages.referralTree}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReferralTree(data.data);
        // Extract all users from the referral tree structure
        const allUsersFromTree = extractAllUsersFromTree(data.data);
        setAllUsers(allUsersFromTree);
        // Calculate stats
        calculateStats(allUsersFromTree);
      } else {
        setReferralTree({ totalReferrals: 0, directReferrals: [] });
        setAllUsers([]);
      }
    } catch (error) {
      console.error('Error fetching referral tree:', error);
      setReferralTree({ totalReferrals: 0, directReferrals: [] });
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract all users from the referral tree
  const extractAllUsersFromTree = (referralTree) => {
    const allUsers = [];
    
    // Add the root user (current user)
    if (referralTree.userId) {
      allUsers.push({
        userId: referralTree.userId,
        firstName: referralTree.firstName || 'Admin',
        lastName: referralTree.lastName || 'User',
        mobile: referralTree.mobile || '',
        email: referralTree.email || '',
        referralCode: referralTree.referralCode || '',
        isActive: true,
        referrals: referralTree.directReferrals || [],
        level: 0
      });
    }

    // Recursively extract all users from the tree
    const extractUsersRecursively = (users, level = 1) => {
      users.forEach(user => {
        allUsers.push({
          ...user,
          level,
          referrals: user.subReferrals || []
        });
        
        if (user.subReferrals && user.subReferrals.length > 0) {
          extractUsersRecursively(user.subReferrals, level + 1);
        }
      });
    };

    if (referralTree.directReferrals) {
      extractUsersRecursively(referralTree.directReferrals);
    }

    return allUsers;
  };

  // Calculate stats from the referral tree data
  const calculateStats = (users) => {
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.isActive).length;
    const totalReferrals = users.reduce((sum, user) => sum + (user.referrals?.length || 0), 0);
    const avgReferralsPerUser = totalUsers > 0 ? totalReferrals / totalUsers : 0;

    setStats({
      totalUsers,
      activeUsers,
      totalReferrals,
      avgReferralsPerUser
    });
  };

  const toggleExpanded = (userId) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const getPaginatedUsers = (users, currentPage) => {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return users.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalUsers) => {
    return Math.ceil(totalUsers / usersPerPage);
  };

  const getAllIndirect = (refs, level = 2) => {
    let allIndirect = [];
    refs.forEach(ref => {
      allIndirect.push({ ...ref, level });
      if (ref.referrals && ref.referrals.length > 0) {
        allIndirect = allIndirect.concat(getAllIndirect(ref.referrals, level + 1));
      }
    });
    return allIndirect;
  };

  const filterAndSortUsers = (users) => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobile?.includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.referralCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by view mode
    switch (viewMode) {
      case 'withReferrals':
        filtered = filtered.filter(user => user.referrals && user.referrals.length > 0);
        break;
      case 'active':
        filtered = filtered.filter(user => user.isActive);
        break;
      case 'inactive':
        filtered = filtered.filter(user => !user.isActive);
        break;
      default:
        break;
    }

    // Sort users
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'referrals':
          aValue = a.referrals?.length || 0;
          bValue = b.referrals?.length || 0;
          break;
        case 'status':
          aValue = a.isActive ? 1 : 0;
          bValue = b.isActive ? 1 : 0;
          break;
        case 'level':
          aValue = a.level || 0;
          bValue = b.level || 0;
          break;
        default:
          aValue = a.firstName?.toLowerCase() || '';
          bValue = b.firstName?.toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  const renderUserCard = (user, level = 0) => {
    const hasReferrals = user.referrals && user.referrals.length > 0;
    const isExpanded = expandedUsers.has(user.userId);
    const indirectReferrals = hasReferrals ? getAllIndirect(user.referrals) : [];

    return (
      <div key={user.userId} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserAvatar
                imageUrl={user.imageUrl}
                firstName={user.firstName}
                lastName={user.lastName}
                status={user.isActive ? 'active' : 'inactive'}
                size={48}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800">
                    {user.firstName} {user.lastName}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.isActive ? 'active' : 'inactive')}`}>
                    {getStatusText(user.isActive ? 'active' : 'inactive')}
                  </span>
                  {level > 0 && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Level {level}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">{user.mobile}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
                <p className="text-xs text-gray-400">Referral Code: {user.referralCode}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasReferrals && (
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">{user.referrals.length} direct</p>
                  <p className="text-xs text-gray-500">{indirectReferrals.length} indirect</p>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                {hasReferrals && (
                  <button
                    onClick={() => toggleExpanded(user.userId)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                )}
                
                <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                  <Eye size={16} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {hasReferrals && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {user.referrals.length} direct referrals
                </p>
                <div className="flex gap-2">
                  {user.referrals.length > 0 && (
                    <button
                      onClick={() => {/* TODO: Open sub-referrals modal */}}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                    >
                      View {user.referrals.length} sub-referrals
                    </button>
                  )}
                  {indirectReferrals.length > 0 && (
                    <button
                      onClick={() => {/* TODO: Open indirect referrals modal */}}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                    >
                      View {indirectReferrals.length} indirect referrals
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Expanded sub-referrals */}
        {hasReferrals && isExpanded && (
          <div className="border-t border-gray-100 bg-gray-50">
            <div className="p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Direct Referrals:</h4>
              <div className="space-y-3">
                {user.referrals.slice(0, 3).map(referral => renderUserCard(referral, level + 1))}
                {user.referrals.length > 3 && (
                  <div className="text-center py-2">
                    <p className="text-sm text-gray-500">
                      +{user.referrals.length - 3} more referrals
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const filteredUsers = filterAndSortUsers(allUsers);
  const paginatedUsers = getPaginatedUsers(filteredUsers, currentPage);
  const totalPages = getTotalPages(filteredUsers.length);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder, viewMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Loading all users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white py-8 px-4 sm:px-6 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Team Manager</h1>
          <p className="text-green-100">View and manage all users in the system</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Users size={24} className="text-white" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalUsers || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <UserCheck size={24} className="text-white" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Active Users</p>
                <p className="text-2xl font-bold text-gray-800">{stats.activeUsers || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Network size={24} className="text-white" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalReferrals || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <BarChart3 size={24} className="text-white" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Avg Referrals</p>
                <p className="text-2xl font-bold text-gray-800">{stats.avgReferralsPerUser?.toFixed(1) || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                  placeholder="Search users by name, mobile, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-full sm:w-80"
                    />
                  </div>

                  <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="all">All Users</option>
                <option value="withReferrals">With Referrals</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="name">Sort by Name</option>
                <option value="referrals">Sort by Referrals</option>
                <option value="status">Sort by Status</option>
                <option value="level">Sort by Level</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
              </button>
              </div>

            {/* Page Size */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={usersPerPage}
                onChange={(e) => {
                  setUsersPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
                    </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
          </p>
          <p className="text-gray-600">
            {viewMode === 'all' ? 'All Users' : 
             viewMode === 'withReferrals' ? 'Users with Referrals' :
             viewMode === 'active' ? 'Active Users' : 'Inactive Users'}
          </p>
                    </div>

        {/* Users Grid */}
        {paginatedUsers.length > 0 ? (
          <div className="space-y-4">
            {paginatedUsers.map(user => renderUserCard(user))}
                    </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <Users size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No users found</h3>
            <p className="text-gray-500">
              {searchTerm ? `No users match "${searchTerm}"` : 
               viewMode === 'withReferrals' ? 'No users with referrals found' :
               viewMode === 'active' ? 'No active users found' :
               viewMode === 'inactive' ? 'No inactive users found' : 'No users available'}
            </p>
                  </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              loading={paginationLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTeamManager; 