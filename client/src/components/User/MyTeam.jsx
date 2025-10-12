import { ChevronRight, Eye, Minus, Plus, Search, SortAsc, SortDesc, UserCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import LoginPrompt from '../UI/LoginPrompt';
import Pagination from '../UI/Pagination';
import UserAvatar from '../UI/UserAvatar';
import IndirectReferralsModal from './IndirectReferralsModal';
import SubReferralsModal from './SubReferralsModal';

const MyTeam = () => {
  const { user, token } = useAuthStore();
  const [referralTree, setReferralTree] = useState({ totalReferrals: 0, directReferrals: [] });
  const [loading, setLoading] = useState(true);
  const [expandedDirect, setExpandedDirect] = useState(new Set());
  const [expandedIndirect, setExpandedIndirect] = useState(new Set());
  const [expandedSubReferrals, setExpandedSubReferrals] = useState(new Set()); // New state for sub-referrals expansion
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'referrals', 'status'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  const [viewMode, setViewMode] = useState('summary'); // 'summary', 'detailed'
  const [currentDirectPage, setCurrentDirectPage] = useState(1);
  const [currentIndirectPage, setCurrentIndirectPage] = useState(1);
  const [usersPerPage] = useState(15);
  const [subReferralsModal, setSubReferralsModal] = useState({
    isOpen: false,
    parentUser: null,
    subReferrals: [],
    title: ''
  });
  const [indirectReferralsModal, setIndirectReferralsModal] = useState({
    isOpen: false,
    indirectReferrals: [],
    title: ''
  });
  const [referralChainModal, setReferralChainModal] = useState({
    isOpen: false,
    chain: [],
    user: null
  });

  useEffect(() => {
    const fetchReferralTree = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_ENDPOINTS.packages.referralTree}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setReferralTree(data.data);
        } else {
          setReferralTree({ totalReferrals: 0, directReferrals: [] });
        }
      } catch (e) {
        setReferralTree({ totalReferrals: 0, directReferrals: [] });
      } finally {
        setLoading(false);
      }
    };
    if (user && token) fetchReferralTree();
  }, [user, token]);

  const toggleExpandedDirect = (userId) => {
    const newExpanded = new Set(expandedDirect);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedDirect(newExpanded);
  };

  const toggleExpandedIndirect = (userId) => {
    const newExpanded = new Set(expandedIndirect);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedIndirect(newExpanded);
  };

  // New function to toggle sub-referrals expansion
  const toggleExpandedSubReferrals = (userId) => {
    const newExpanded = new Set(expandedSubReferrals);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedSubReferrals(newExpanded);
  };

  const openSubReferralsModal = (parentUser, subReferrals, title) => {
    setSubReferralsModal({
      isOpen: true,
      parentUser,
      subReferrals,
      title
    });
  };

  const closeSubReferralsModal = () => {
    setSubReferralsModal({
      isOpen: false,
      parentUser: null,
      subReferrals: [],
      title: ''
    });
  };

  const openIndirectReferralsModal = (indirectReferrals, title) => {
    setIndirectReferralsModal({
      isOpen: true,
      indirectReferrals,
      title
    });
  };

  const closeIndirectReferralsModal = () => {
    setIndirectReferralsModal({
      isOpen: false,
      indirectReferrals: [],
      title: ''
    });
  };

  const openReferralChainModal = (user) => {
    const chain = getReferralChain(user.userId);
    setReferralChainModal({
      isOpen: true,
      chain: chain || [],
      user: user
    });
  };

  const closeReferralChainModal = () => {
    setReferralChainModal({
      isOpen: false,
      chain: [],
      user: null
    });
  };

  // Reset pagination when search or sort changes
  useEffect(() => {
    setCurrentDirectPage(1);
    setCurrentIndirectPage(1);
  }, [searchTerm, sortBy, sortOrder, viewMode]);

  // Pagination logic
  const getPaginatedUsers = (users, currentPage) => {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return users.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalUsers) => {
    return Math.ceil(totalUsers / usersPerPage);
  };

  // Helper to get all indirect referrals recursively with levels and parent info
  const getAllIndirect = (refs, level = 2, parentInfo = null) => {
    let result = [];
    for (const ref of refs) {
      if (ref.subReferrals && ref.subReferrals.length > 0) {
        // Add level information and parent info to each sub-referral
        const subRefsWithLevel = ref.subReferrals.map(subRef => ({
          ...subRef,
          level: level,
          parentReferrer: {
            userId: ref.userId,
            firstName: ref.firstName,
            lastName: ref.lastName,
            level: level - 1
          }
        }));
        result = result.concat(subRefsWithLevel);
        result = result.concat(getAllIndirect(ref.subReferrals, level + 1, ref));
      }
    }
    return result;
  };

  const indirectRefs = getAllIndirect(referralTree.directReferrals);

  // Helper function to get complete referral chain for a user
  const getReferralChain = (userId) => {
    const findUserInTree = (users, targetUserId, chain = []) => {
      for (const user of users) {
        const currentChain = [...chain, user];
        if (user.userId === targetUserId) {
          return currentChain;
        }
        if (user.subReferrals && user.subReferrals.length > 0) {
          const found = findUserInTree(user.subReferrals, targetUserId, currentChain);
          if (found) return found;
        }
      }
      return null;
    };

    return findUserInTree(referralTree.directReferrals || [], userId);
  };

  // Filter and sort functions
  const filterAndSortUsers = (users) => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobile?.includes(searchTerm)
      );
    }

    // In detailed mode, show only users with sub-referrals
    if (viewMode === 'detailed') {
      filtered = filtered.filter(user => user.subReferrals && user.subReferrals.length > 0);
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
          aValue = a.subReferrals?.length || 0;
          bValue = b.subReferrals?.length || 0;
          break;
        case 'status':
          aValue = a.status || 'unknown';
          bValue = b.status || 'unknown';
          break;
        default:
          aValue = a.firstName.toLowerCase();
          bValue = b.firstName.toLowerCase();
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
      case 'free': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-yellow-100 text-yellow-800';
      case 'kyc_verified': return 'bg-green-100 text-green-800';
      case 'blocked': return 'bg-black text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'free': return 'Free';
      case 'active': return 'Active';
      case 'kyc_verified': return 'KYC Verified';
      case 'blocked': return 'Blocked';
      default: return 'Unknown';
    }
  };

  // Helper function to render sub-referrals with expansion
  const renderSubReferrals = (member) => {
    if (!member.subReferrals || member.subReferrals.length === 0) {
      return null;
    }

    const isExpanded = expandedSubReferrals.has(member.userId);
    const maxVisible = 2; // Show only 2 sub-referrals initially
    const visibleSubReferrals = isExpanded ? member.subReferrals : member.subReferrals.slice(0, maxVisible);
    const hiddenCount = member.subReferrals.length - maxVisible;

    return (
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="mb-2">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Users size={16} className="text-blue-500" />
            Sub-Referrals ({member.subReferrals.length})
          </h4>
        </div>

        <div className="space-y-2">
          {visibleSubReferrals.map((subRef, index) => (
            <div key={subRef.userId} className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2">
                <UserAvatar
                  imageUrl={subRef.imageUrl}
                  firstName={subRef.firstName}
                  lastName={subRef.lastName}
                  status={subRef?.status}
                  size={32}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {subRef.firstName} {subRef.lastName}
                  </p>
                  <p className="text-xs text-gray-500">ID: {subRef.userId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subRef.status)}`}>
                    {getStatusText(subRef.status)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {subRef.subReferrals?.length || 0} refs
                  </span>
                </div>
              </div>
            </div>
          ))}

          {!isExpanded && hiddenCount > 0 && (
            <button
              onClick={() => toggleExpandedSubReferrals(member.userId)}
              className="w-full text-left text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2 hover:bg-blue-50 p-2 rounded-lg transition-colors"
            >
              <Plus size={16} />
              +{hiddenCount} more sub-referrals
            </button>
          )}

          {!isExpanded && hiddenCount > 0 && (
            <button
              onClick={() => toggleExpandedSubReferrals(member.userId)}
              className="w-full text-left text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 hover:bg-gray-50 p-1 rounded transition-colors"
            >
              <ChevronRight size={12} />
              Expand to see all {member.subReferrals.length} sub-referrals
            </button>
          )}

          {isExpanded && (
            <button
              onClick={() => toggleExpandedSubReferrals(member.userId)}
              className="w-full text-left text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2 hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <Minus size={16} />
              Collapse sub-referrals
            </button>
          )}
        </div>
      </div>
    );
  };

  if (!user) {
    return <LoginPrompt type="team" />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team data...</p>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalDirect = referralTree.directReferrals?.length || 0;
  const totalIndirect = indirectRefs.length;
  const totalTeam = totalDirect + totalIndirect;

  // Filter and sort direct referrals
  const filteredDirectReferrals = filterAndSortUsers(referralTree.directReferrals || []);
  const filteredIndirectReferrals = filterAndSortUsers(indirectRefs);

  // Paginate the results
  const paginatedDirectReferrals = getPaginatedUsers(filteredDirectReferrals, currentDirectPage);
  const paginatedIndirectReferrals = getPaginatedUsers(filteredIndirectReferrals, currentIndirectPage);

  // Calculate total pages
  const totalDirectPages = getTotalPages(filteredDirectReferrals.length);
  const totalIndirectPages = getTotalPages(filteredIndirectReferrals.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8 px-4 mt-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Users className="text-orange-500" size={32} />
            My Team Overview
          </h1>
          <p className="text-gray-600">Manage and view your referral network</p>
        </div>

        {/* Main User Card */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-orange-200 p-6 text-center max-w-sm">
            <div className="flex justify-center mb-4">
              <UserAvatar
                imageUrl={user.imageUrl}
                firstName={user.firstName}
                lastName={user.lastName}
                status={user?.status}
                size={80}
              />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-gray-600 text-sm mb-2">ID: {user.userId}</p>
            <div className="mb-4">
              <span className="px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-800 border border-orange-200">
                You Referred: {totalDirect} People
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-green-800 font-semibold">Direct: {totalDirect}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-blue-800 font-semibold">Total: {totalTeam}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, ID, or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Sort Controls */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="name">Sort by Name</option>
                <option value="referrals">Sort by Referrals</option>
                <option value="status">Sort by Status</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {sortOrder === 'asc' ? <SortAsc size={20} /> : <SortDesc size={20} />}
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('summary')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'summary'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                All Users
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'detailed'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                With Sub-Referrals
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{totalDirect}</div>
            <div className="text-gray-600">Direct Referrals</div>
            <div className="text-xs text-gray-400 mt-1">Level 1</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{totalIndirect}</div>
            <div className="text-gray-600">Indirect Referrals</div>
            <div className="text-xs text-gray-400 mt-1">Level 2+</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">{totalTeam}</div>
            <div className="text-gray-600">Total Team Size</div>
            <div className="text-xs text-gray-400 mt-1">Complete Network</div>
          </div>
        </div>

        {/* Direct Referrals Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <UserCheck className="text-green-500" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Direct Referrals</h2>
              <span className="bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                {filteredDirectReferrals.length}
              </span>
              <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                Level 1
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Showing {paginatedDirectReferrals.length} of {filteredDirectReferrals.length} direct referrals
              {totalDirectPages > 1 && ` (Page ${currentDirectPage} of ${totalDirectPages})`}
            </div>
          </div>

          {paginatedDirectReferrals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedDirectReferrals.map((member, index) => (
                <div key={member.userId} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <UserAvatar
                      imageUrl={member.imageUrl}
                      firstName={member.firstName}
                      lastName={member.lastName}
                      status={member?.status}
                      size={50}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{member.firstName} {member.lastName}</p>
                      <p className="text-xs text-gray-500">ID: {member.userId}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Level:</span>
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">Level 1</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Referrals:</span>
                      <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full text-sm">
                        {member.subReferrals?.length || 0}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                        {getStatusText(member.status)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Mobile:</span>
                      <span className="text-sm text-gray-600">{member.mobile}</span>
                    </div>

                    {/* Render expandable sub-referrals */}
                    {member.subReferrals && member.subReferrals.length > 0 && (
                      renderSubReferrals(member)
                    )}

                    {viewMode === 'detailed' && member.subReferrals && member.subReferrals.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => openSubReferralsModal(
                            member,
                            member.subReferrals,
                            `${member.firstName} ${member.lastName}'s Sub-Referrals`
                          )}
                          className="w-full text-left text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:bg-blue-50 p-2 rounded transition-colors"
                        >
                          <Eye size={14} />
                          View all in modal
                        </button>
                      </div>
                    )}

                    {/* Show complete referral chain for direct referrals too */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => openReferralChainModal(member)}
                        className="w-full text-left text-xs text-green-600 hover:text-green-800 flex items-center gap-1 hover:bg-green-50 p-2 rounded transition-colors"
                      >
                        <Eye size={14} />
                        View Complete Referral Chain
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">
                {viewMode === 'detailed'
                  ? 'No direct referrals with sub-referrals found'
                  : 'No direct referrals found'
                }
              </p>
              {searchTerm && <p className="text-gray-400 text-sm">Try adjusting your search terms</p>}
              {viewMode === 'detailed' && !searchTerm && (
                <p className="text-gray-400 text-sm">Switch to "All Users" to see all direct referrals</p>
              )}
            </div>
          )}

          {/* Pagination for Direct Referrals */}
          {totalDirectPages > 1 && (
            <Pagination
              currentPage={currentDirectPage}
              totalPages={totalDirectPages}
              onPageChange={setCurrentDirectPage}
            />
          )}
        </div>

        {/* Indirect Referrals Section */}
        {totalIndirect > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="text-purple-500" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Indirect Referrals</h2>
                <span className="bg-purple-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  {filteredIndirectReferrals.length}
                </span>
                <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded-full">
                  Level 2+
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Showing {paginatedIndirectReferrals.length} of {filteredIndirectReferrals.length} indirect referrals
                {totalIndirectPages > 1 && ` (Page ${currentIndirectPage} of ${totalIndirectPages})`}
              </div>
            </div>

            {paginatedIndirectReferrals.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedIndirectReferrals.map((member, index) => (
                    <div key={member.userId} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <UserAvatar
                          imageUrl={member.imageUrl}
                          firstName={member.firstName}
                          lastName={member.lastName}
                          status={member?.status}
                          size={50}
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{member.firstName} {member.lastName}</p>
                          <p className="text-xs text-gray-500">ID: {member.userId}</p>
                          {member.parentReferrer && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-xs text-gray-400">via</span>
                              <span className="text-xs text-blue-600 font-medium">
                                {member.parentReferrer.firstName} {member.parentReferrer.lastName}
                              </span>
                              <span className="text-xs text-gray-400">(L{member.parentReferrer.level})</span>
                              <span className="text-xs text-purple-600 bg-purple-100 px-1 rounded">
                                → L{member.level}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Level:</span>
                          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-medium">
                            Level {member.level || 2}
                          </span>
                        </div>

                        {/* Show who referred this user */}
                        {member.parentReferrer && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Referred by:</span>
                            <div className="text-right">
                              <span className="text-xs text-blue-600 font-medium">
                                {member.parentReferrer.firstName} {member.parentReferrer.lastName}
                              </span>
                              <div className="text-xs text-gray-500">
                                Level {member.parentReferrer.level} • ID: {member.parentReferrer.userId}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Referrals:</span>
                          <span className="font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full text-sm">
                            {member.subReferrals?.length || 0}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                            {getStatusText(member.status)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Mobile:</span>
                          <span className="text-sm text-gray-600">{member.mobile}</span>
                        </div>

                        {/* Render expandable sub-referrals for indirect referrals too */}
                        {member.subReferrals && member.subReferrals.length > 0 && (
                          renderSubReferrals(member)
                        )}

                        {/* Show complete referral chain */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => openReferralChainModal(member)}
                            className="w-full text-left text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 hover:bg-purple-50 p-2 rounded transition-colors"
                          >
                            <Eye size={14} />
                            View Complete Referral Chain
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  {viewMode === 'detailed'
                    ? 'No indirect referrals with sub-referrals found'
                    : 'No indirect referrals found'
                  }
                </p>
                {searchTerm && <p className="text-gray-400 text-sm">Try adjusting your search terms</p>}
                {viewMode === 'detailed' && !searchTerm && (
                  <p className="text-gray-400 text-sm">Switch to "All Users" to see all indirect referrals</p>
                )}
              </div>
            )}

            {/* Pagination for Indirect Referrals */}
            {totalIndirectPages > 1 && (
              <Pagination
                currentPage={currentIndirectPage}
                totalPages={totalIndirectPages}
                onPageChange={setCurrentIndirectPage}
              />
            )}
          </div>
        )}
      </div>

      {/* Sub-Referrals Modal */}
      <SubReferralsModal
        isOpen={subReferralsModal.isOpen}
        onClose={closeSubReferralsModal}
        parentUser={subReferralsModal.parentUser}
        subReferrals={subReferralsModal.subReferrals}
        title={subReferralsModal.title}
      />

      {/* Indirect Referrals Modal */}
      <IndirectReferralsModal
        isOpen={indirectReferralsModal.isOpen}
        onClose={closeIndirectReferralsModal}
        indirectReferrals={indirectReferralsModal.indirectReferrals}
        title={indirectReferralsModal.title}
      />

      {/* Referral Chain Modal */}
      {referralChainModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  Referral Chain for {referralChainModal.user?.firstName} {referralChainModal.user?.lastName}
                </h3>
                <button
                  onClick={closeReferralChainModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {referralChainModal.chain.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Complete referral path from you to {referralChainModal.user?.firstName} {referralChainModal.user?.lastName}:
                  </div>

                  <div className="space-y-3">
                    {referralChainModal.chain.map((user, index) => (
                      <div key={user.userId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              imageUrl={user.imageUrl}
                              firstName={user.firstName}
                              lastName={user.lastName}
                              status={user?.status}
                              size={40}
                            />
                            <div>
                              <p className="font-semibold text-gray-800">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-gray-500">ID: {user.userId}</p>
                              <p className="text-xs text-orange-600 font-medium">
                                Level {index + 1} • {user.subReferrals?.length || 0} referrals
                              </p>
                            </div>
                          </div>
                        </div>
                        {index < referralChainModal.chain.length - 1 && (
                          <div className="text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Summary:</strong> {referralChainModal.user?.firstName} {referralChainModal.user?.lastName} is at Level {referralChainModal.chain.length} in your referral network.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No referral chain found for this user.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTeam; 