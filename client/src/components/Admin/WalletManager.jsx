import { 
  DollarSign, 
  Minus, 
  Plus, 
  Search, 
  User, 
  Wallet, 
  History,
  Loader2
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api, { API_ENDPOINTS } from '../../config/api';

const WalletManager = () => {
  const [searchUserId, setSearchUserId] = useState('');
  const [userData, setUserData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeductForm, setShowDeductForm] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [transactions, setTransactions] = useState([]);

  // Form states
  const [addForm, setAddForm] = useState({
    amount: '',
    walletType: 'wallet',
    incomeType: 'active',
    description: '',
    adminNotes: ''
  });

  const [deductForm, setDeductForm] = useState({
    amount: '',
    walletType: 'wallet',
    incomeType: 'active',
    description: '',
    adminNotes: ''
  });

  const [transactionFilters] = useState({
    walletType: 'wallet',
    page: 1,
    limit: 20
  });

  const handleSearch = async () => {
    if (!searchUserId.trim()) {
      toast.error('Please enter a User ID or Mobile Number');
      return;
    }

    setSearchLoading(true);
    try {
            // Try to search by userId first, then by mobile if that fails
            let response;
            try {
              response = await api.get(API_ENDPOINTS.wallet.userWallet.replace(':userId', searchUserId));
            } catch (error) {
              // If userId search fails, try mobile search
              if (error.response?.status === 404) {
                response = await api.get(API_ENDPOINTS.wallet.userWalletByMobile.replace(':mobile', searchUserId));
              } else {
                throw error;
              }
            }
      
      if (response.data.success) {
        setUserData(response.data.data.user);
        setWalletData(response.data.data);
        toast.success('User wallet data loaded successfully');
      }
    } catch (error) {
      console.error('Error fetching user wallet:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch user wallet');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddMoney = async (e) => {
    e.preventDefault();
    if (!addForm.amount || addForm.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Use the userId from the found user data, not the search term
      const targetUserId = userData?.userId || searchUserId;
      const requestData = {
        ...addForm,
        userId: targetUserId
      };
      const response = await api.post(API_ENDPOINTS.wallet.addMoney.replace(':userId', targetUserId), requestData);
      if (response.data.success) {
        toast.success(response.data.message);
        setAddForm({ amount: '', walletType: 'wallet', incomeType: 'active', description: '', adminNotes: '' });
        setShowAddForm(false);
        // Refresh wallet data
        handleSearch();
      }
    } catch (error) {
      console.error('Error adding money:', error);
      toast.error(error.response?.data?.message || 'Failed to add money');
    } finally {
      setLoading(false);
    }
  };

  const handleDeductMoney = async (e) => {
    e.preventDefault();
    if (!deductForm.amount || deductForm.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Use the userId from the found user data, not the search term
      const targetUserId = userData?.userId || searchUserId;
      const requestData = {
        ...deductForm,
        userId: targetUserId
      };
      const response = await api.post(API_ENDPOINTS.wallet.deductMoney.replace(':userId', targetUserId), requestData);
      if (response.data.success) {
        toast.success(response.data.message);
        setDeductForm({ amount: '', walletType: 'wallet', incomeType: 'active', description: '', adminNotes: '' });
        setShowDeductForm(false);
        // Refresh wallet data
        handleSearch();
      }
    } catch (error) {
      console.error('Error deducting money:', error);
      toast.error(error.response?.data?.message || 'Failed to deduct money');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = useCallback(async () => {
    if (!userData?.userId) return;

    try {
      const response = await api.get(API_ENDPOINTS.wallet.transactions.replace(':userId', userData.userId), {
        params: transactionFilters
      });
      if (response.data.success) {
        setTransactions(response.data.data.transactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    }
  }, [userData?.userId, transactionFilters]);

  useEffect(() => {
    if (showTransactions && userData?.userId) {
      loadTransactions();
    }
  }, [showTransactions, userData?.userId, loadTransactions]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 mt-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Wallet className="w-6 h-6 text-blue-600" />
                Wallet Manager
              </h1>
              <p className="text-gray-600 mt-1">Manage user wallets and transactions</p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search User
          </h2>
          <div className="flex gap-4">
            <div className="flex-1">
               <input
                 type="text"
                 placeholder="Enter User ID (YITM00000001) or Mobile Number"
                 value={searchUserId}
                 onChange={(e) => setSearchUserId(e.target.value)}
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               />
            </div>
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {searchLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </button>
          </div>
        </div>

        {/* User Info and Wallet Data */}
        {userData && walletData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* User Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                User Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">User ID:</span>
                  <span className="font-medium">{userData.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{userData.firstName} {userData.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{userData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mobile:</span>
                  <span className="font-medium">{userData.mobile}</span>
                </div>
              </div>
            </div>

            {/* Wallet Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Wallet Summary
              </h3>
              <div className="space-y-4">
                {/* Regular Wallet */}
                {walletData.wallet && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      Regular Wallet
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Active/Passive Income
                      </span>
                    </h4>
                     <div className="grid grid-cols-2 gap-2 text-sm">
                       <div className="flex justify-between">
                         <span className="text-gray-600">Balance:</span>
                         <span className="font-medium">₹{walletData.wallet.balance?.toLocaleString() || 0}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Total Earned:</span>
                         <span className="font-medium">₹{walletData.wallet.totalEarned?.toLocaleString() || 0}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Total Withdrawn:</span>
                         <span className="font-medium">₹{walletData.wallet.totalWithdrawn?.toLocaleString() || 0}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Active Income:</span>
                         <span className="font-medium text-green-600">₹{walletData.wallet.activeIncome?.toLocaleString() || 0}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Passive Income:</span>
                         <span className="font-medium text-blue-600">₹{walletData.wallet.passiveIncome?.toLocaleString() || 0}</span>
                       </div>
                     </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {userData && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Money
              </button>
              <button
                onClick={() => setShowDeductForm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Minus className="w-4 h-4" />
                Deduct Money
              </button>
              <button
                onClick={() => setShowTransactions(!showTransactions)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <History className="w-4 h-4" />
                View Transactions
              </button>
            </div>
          </div>
        )}

        {/* Add Money Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-600" />
                Add Money
              </h3>
              <form onSubmit={handleAddMoney} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={addForm.amount}
                    onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter amount"
                    required
                  />
                </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Type</label>
                   <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                     Regular Wallet (₹) - For Active/Passive Income
                   </div>
                   <p className="text-xs text-gray-500 mt-1">
                     Regular Wallet: For commission, bonuses, and direct payments (₹)
                   </p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Income Type</label>
                   <select
                     value={addForm.incomeType}
                     onChange={(e) => setAddForm({ ...addForm, incomeType: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                   >
                     <option value="active">Active Income (Direct earnings, commissions)</option>
                     <option value="passive">Passive Income (Referral bonuses, team earnings)</option>
                   </select>
                   <p className="text-xs text-gray-500 mt-1">
                     Active: Direct earnings from sales/commissions | Passive: Team/referral bonuses
                   </p>
                 </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={addForm.description}
                    onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Reason for adding money"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                  <textarea
                    value={addForm.adminNotes}
                    onChange={(e) => setAddForm({ ...addForm, adminNotes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows="3"
                    placeholder="Internal notes"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Money
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Deduct Money Form */}
        {showDeductForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Minus className="w-5 h-5 text-red-600" />
                Deduct Money
              </h3>
              <form onSubmit={handleDeductMoney} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={deductForm.amount}
                    onChange={(e) => setDeductForm({ ...deductForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter amount"
                    required
                  />
                </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Type</label>
                   <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                     Regular Wallet (₹) - For Active/Passive Income
                   </div>
                   <p className="text-xs text-gray-500 mt-1">
                     Regular Wallet: For commission, bonuses, and direct payments (₹)
                   </p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Income Type</label>
                   <select
                     value={deductForm.incomeType}
                     onChange={(e) => setDeductForm({ ...deductForm, incomeType: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                   >
                     <option value="active">Active Income (Direct earnings, commissions)</option>
                     <option value="passive">Passive Income (Referral bonuses, team earnings)</option>
                   </select>
                   <p className="text-xs text-gray-500 mt-1">
                     Active: Direct earnings from sales/commissions | Passive: Team/referral bonuses
                   </p>
                 </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={deductForm.description}
                    onChange={(e) => setDeductForm({ ...deductForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Reason for deducting money"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                  <textarea
                    value={deductForm.adminNotes}
                    onChange={(e) => setDeductForm({ ...deductForm, adminNotes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows="3"
                    placeholder="Internal notes"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeductForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minus className="w-4 h-4" />}
                    Deduct Money
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Transactions */}
        {showTransactions && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5" />
                Transaction History
              </h3>
              <div className="flex gap-2">
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                  Regular Wallet
                </div>
                <button
                  onClick={() => setShowTransactions(false)}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
            
            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Description</th>
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.type === 'admin_adjust' ? 'bg-purple-100 text-purple-800' :
                            transaction.type === 'commission' ? 'bg-green-100 text-green-800' :
                            transaction.type === 'withdrawal' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${
                            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount} ₹
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div>{transaction.description || transaction.metadata?.description || '-'}</div>
                          {transaction.adminNotes && (
                            <div className="text-xs text-gray-500 mt-1">
                              Admin: {transaction.adminNotes}
                            </div>
                          )}
                          <div className="flex gap-2 mt-1">
                            <div className="text-xs text-blue-600 font-medium">
                              Regular Wallet (₹)
                            </div>
                            {transaction.incomeType && (
                              <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                                transaction.incomeType === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {transaction.incomeType === 'active' ? 'Active Income' : 'Passive Income'}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No transactions found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletManager;
