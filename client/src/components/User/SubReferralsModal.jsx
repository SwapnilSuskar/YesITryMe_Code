import { ChevronDown, ChevronRight, Search, SortAsc, SortDesc, Users, Users2, X } from 'lucide-react';
import { useState } from 'react';
import UserAvatar from '../UI/UserAvatar';

const SubReferralsModal = ({ isOpen, onClose, parentUser, subReferrals, title = "Sub-Referrals" }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name'); // 'name', 'referrals', 'status'
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
    const [expandedUsers, setExpandedUsers] = useState(new Set());

    if (!isOpen) return null;

    const toggleExpanded = (userId) => {
        const newExpanded = new Set(expandedUsers);
        if (newExpanded.has(userId)) {
            newExpanded.delete(userId);
        } else {
            newExpanded.add(userId);
        }
        setExpandedUsers(newExpanded);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'free': return 'bg-red-50 text-red-700 border-red-200';
            case 'active': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'kyc_verified': return 'bg-green-50 text-green-700 border-green-200';
            case 'blocked': return 'bg-gray-50 text-gray-700 border-gray-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
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

    // Filter and sort sub-referrals
    const filterAndSortReferrals = (referrals) => {
        let filtered = referrals;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.mobile.includes(searchTerm)
            );
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

    const filteredSubReferrals = filterAndSortReferrals(subReferrals);

    const renderSubReferralCard = (user, level = 0) => {
        const hasSubReferrals = user.subReferrals && user.subReferrals.length > 0;
        const isExpanded = expandedUsers.has(user.userId);

        return (
            <div key={user.userId} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                {/* Main Card Content */}
                <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                            {hasSubReferrals && (
                                <button
                                    onClick={() => toggleExpanded(user.userId)}
                                    className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors group"
                                >
                                    {isExpanded ?
                                        <ChevronDown size={16} className="text-blue-600 group-hover:text-blue-700" /> :
                                        <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
                                    }
                                </button>
                            )}
                            <UserAvatar
                                imageUrl={user.imageUrl}
                                firstName={user.firstName}
                                lastName={user.lastName}
                                status={user?.status}
                                size={48}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{user.firstName} {user.lastName}</h3>
                            <span className="text-xs text-gray-500 font-mono">#{user.userId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {hasSubReferrals && (
                                <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
                                    <Users2 size={14} />
                                    {user.subReferrals.length}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Essential Info */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Level:</span>
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                                Level {level + 2}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Referrals:</span>
                            <span className="font-bold text-green-600">{user.subReferrals?.length || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Status:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                                {getStatusText(user.status)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Mobile:</span>
                            <span className="text-sm text-gray-600">{user.mobile}</span>
                        </div>
                    </div>
                </div>
                {/* Expanded Sub-Referrals Section */}
                {hasSubReferrals && isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50">
                        <div className="p-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                <Users2 size={16} className="text-blue-600" />
                                Sub-Referrals ({user.subReferrals.length})
                            </h4>

                            {/* Sub-referrals grid - only show first 2 to prevent overlapping */}
                            <div className="space-y-3">
                                {user.subReferrals.slice(0, 2).map(subRef => (
                                    <div key={subRef.userId} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar
                                                imageUrl={subRef.imageUrl}
                                                firstName={subRef.firstName}
                                                lastName={subRef.lastName}
                                                status={subRef?.status}
                                                size={36}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-gray-900 truncate">
                                                    {subRef.firstName} {subRef.lastName}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-500 font-mono">#{subRef.userId}</span>
                                                    <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                                        Level {level + 3}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {subRef.subReferrals && subRef.subReferrals.length > 0 && (
                                                    <div className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                                                        <Users2 size={12} />
                                                        {subRef.subReferrals.length}
                                                    </div>
                                                )}
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(subRef.status)}`}>
                                                    {getStatusText(subRef.status)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Essential info for sub-referrals */}
                                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-xs">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Level:</span>
                                                <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full font-medium">
                                                    Level {level + 3}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Referrals:</span>
                                                <span className="font-bold text-purple-600">{subRef.subReferrals?.length || 0}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Status:</span>
                                                <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subRef.status)}`}>
                                                    {getStatusText(subRef.status)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Mobile:</span>
                                                <span className="text-gray-600 truncate">{subRef.mobile}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Show more indicator if there are more sub-referrals */}
                                {user.subReferrals.length > 2 && (
                                    <div className="text-center py-3">
                                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                            <p className="text-sm text-blue-700 font-medium">
                                                +{user.subReferrals.length - 2} more sub-referrals
                                            </p>
                                            <p className="text-xs text-blue-600 mt-1">
                                                Expand to see all {user.subReferrals.length} sub-referrals
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden border border-gray-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Users className="text-blue-600" size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                            <p className="text-gray-600 mt-1">
                                {parentUser ? `${parentUser.firstName} ${parentUser.lastName}'s` : ''} Sub-Referrals • {subReferrals.length} members
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Controls */}
                <div className="p-6 border-b border-gray-100 bg-white">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name, ID, or mobile..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                            />
                        </div>

                        {/* Sort Controls */}
                        <div className="flex gap-3">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                            >
                                <option value="name">Sort by Name</option>
                                <option value="referrals">Sort by Referrals</option>
                                <option value="status">Sort by Status</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                                {sortOrder === 'asc' ? <SortAsc size={20} /> : <SortDesc size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)] bg-gray-50/30">
                    {filteredSubReferrals.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredSubReferrals.map((user, index) => renderSubReferralCard(user, 0))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="p-6 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                                <Users className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No sub-referrals found</h3>
                            {searchTerm ? (
                                <p className="text-gray-500">Try adjusting your search terms</p>
                            ) : (
                                <p className="text-gray-500">This user doesn't have any sub-referrals yet</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-white">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Showing <span className="font-semibold">{filteredSubReferrals.length}</span> of <span className="font-semibold">{subReferrals.length}</span> sub-referrals
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubReferralsModal; 