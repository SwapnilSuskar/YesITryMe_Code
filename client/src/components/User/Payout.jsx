import { AlertCircle, Bike, BookOpen, Car, CheckCircle, Clock, Crown, Gift, Home, Laptop, Package, Plane, Smartphone, Star, Target, Users, Wallet, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import api, { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import LoginPrompt from '../UI/LoginPrompt';
import RankRequirements from './RankRequirements';

const Payout = () => {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recentPayouts, setRecentPayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [activeIncome, setActiveIncome] = useState(0);
  const [passiveIncome, setPassiveIncome] = useState(0);
  const [withdrawableAmount, setWithdrawableAmount] = useState(0);
  const [withdrawalType, setWithdrawalType] = useState('none');
  const [showRankRequirements, setShowRankRequirements] = useState(false);
  const [userFunds, setUserFunds] = useState({
    mobileFund: 0,
    laptopFund: 0,
    bikeFund: 0,
    carFund: 0,
    houseFund: 0,
    travelFund: 0,
    totalFunds: 0
  });
  const [specialIncome, setSpecialIncome] = useState({
    leaderShipFund: 0,
    royaltyIncome: 0,
    rewardIncome: 0
  });
  // Super Package commissions state
  const [superPackageCommissions, setSuperPackageCommissions] = useState({
    balance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    activeIncome: 0,
    passiveIncome: 0,
    transactions: []
  });
  const [withdrawalSource, setWithdrawalSource] = useState('wallet'); // 'wallet', 'funds', 'special', or 'superPackages'
  const [selectedFundType, setSelectedFundType] = useState('mobileFund');
  const [kycStatus, setKycStatus] = useState(null);

  // Handle withdrawal source change
  const handleWithdrawalSourceChange = (source) => {
    setWithdrawalSource(source);
    setAmount(''); // Reset amount when changing source
    setError(''); // Clear any previous errors
    setSuccess(''); // Clear any previous success messages

    // Set default fund type based on source
    if (source === 'funds') {
      setSelectedFundType('mobileFund');
    } else if (source === 'special') {
      setSelectedFundType('leaderShipFund');
    }
  };

  // Get available amount for selected source and fund type
  const getAvailableAmount = () => {
    if (withdrawalSource === 'wallet') {
      return withdrawableAmount;
    } else if (withdrawalSource === 'funds') {
      return userFunds[selectedFundType] || 0;
    } else if (withdrawalSource === 'special') {
      return specialIncome[selectedFundType] || 0;
    } else if (withdrawalSource === 'superPackages') {
      return superPackageCommissions.balance || 0;
    }
    return 0;
  };

  // Get fund type display name
  const getFundTypeDisplayName = () => {
    if (withdrawalSource === 'funds') {
      return selectedFundType.replace('Fund', ' Fund');
    } else if (withdrawalSource === 'special') {
      return selectedFundType.replace('Fund', ' Fund').replace('Income', ' Income');
    } else if (withdrawalSource === 'superPackages') {
      return 'Super Package Commissions';
    }
    return 'Wallet Balance';
  };

  // Fetch eligibility and balance on component mount
  useEffect(() => {
    if (user) {
      fetchEligibility();
      fetchBalance();
      fetchPayoutHistory();
      fetchUserFunds();
      fetchSpecialIncome();
      fetchSuperPackageCommissions();
      fetchKycStatus();
    }
  }, [user]);

  const fetchEligibility = async () => {
    try {
      setEligibilityLoading(true);
      const response = await api.get(API_ENDPOINTS.payout.eligibility);
      setEligibility(response.data);
      setActiveIncome(response.data.activeIncome || 0);
      setPassiveIncome(response.data.passiveIncome || 0);
      setWithdrawableAmount(response.data.withdrawableAmount || 0);
      setWithdrawalType(response.data.withdrawalType || 'none');
    } catch (error) {
      console.error('Error fetching eligibility:', error);
      setError('Failed to check eligibility');
    } finally {
      setEligibilityLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.payout.balance);
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(0);
    }
  };

  const fetchPayoutHistory = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.payout.history);
      setRecentPayouts(response.data.payouts);
    } catch (error) {
      console.error('Error fetching payout history:', error);
      setRecentPayouts([]);
    }
  };

  const fetchUserFunds = async () => {
    try {
      const response = await api.get(`${API_ENDPOINTS.funds.userFunds}/${user.userId}`);
      setUserFunds(response.data.data || {
        mobileFund: 0,
        laptopFund: 0,
        bikeFund: 0,
        carFund: 0,
        houseFund: 0,
        travelFund: 0,
        totalFunds: 0
      });
    } catch (error) {
      console.error('Error fetching user funds:', error);
      setUserFunds({
        mobileFund: 0,
        laptopFund: 0,
        bikeFund: 0,
        carFund: 0,
        houseFund: 0,
        travelFund: 0,
        totalFunds: 0
      });
    }
  };

  const fetchSpecialIncome = async () => {
    try {
      const response = await api.get(`${API_ENDPOINTS.specialIncome.user.replace(':userId', user.userId)}`);
      setSpecialIncome(response.data.data || {
        leaderShipFund: 0,
        royaltyIncome: 0,
        rewardIncome: 0
      });
    } catch (error) {
      console.error('Error fetching special income:', error);
      setSpecialIncome({
        leaderShipFund: 0,
        royaltyIncome: 0,
        rewardIncome: 0
      });
    }
  };

  const fetchSuperPackageCommissions = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.superPackages.commissionSummary);
      setSuperPackageCommissions({
        balance: response.data.data?.balance || 0,
        totalEarned: response.data.data?.totalEarned || 0,
        totalWithdrawn: response.data.data?.totalWithdrawn || 0,
        activeIncome: response.data.data?.activeIncome || 0,
        passiveIncome: response.data.data?.passiveIncome || 0,
        transactions: response.data.data?.transactions || []
      });
    } catch (error) {
      console.error('Error fetching super package commissions:', error);
      setSuperPackageCommissions({
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        activeIncome: 0,
        passiveIncome: 0,
        transactions: []
      });
    }
  };

  const fetchKycStatus = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.kyc.status);
      // Fix: The status is nested in response.data.data.status
      setKycStatus(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      // Fallback: check if user has KYC approval date
      if (user?.kycApprovedDate) {
        setKycStatus({ status: 'approved' });
      } else {
        setKycStatus(null);
      }
    }
  };

  const handlePayout = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Check KYC status first
    if (!kycStatus || kycStatus.status !== 'approved') {
      setError('KYC verification is required before making withdrawals. Please complete your KYC verification first.');
      return;
    }

    const amt = parseFloat(amount);
    if (amt <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (amt < 200) {
      setError('Minimum withdrawal amount is ₹200');
      return;
    }

    // Check withdrawal limits based on source
    if (withdrawalSource === 'wallet') {
      if (amt > withdrawableAmount) {
        setError(`Amount exceeds withdrawable balance. You can only withdraw up to ₹${withdrawableAmount.toLocaleString()}`);
        return;
      }
    } else if (withdrawalSource === 'funds') {
      const selectedFundAmount = userFunds[selectedFundType] || 0;
      if (amt > selectedFundAmount) {
        setError(`Amount exceeds available ${selectedFundType.replace('Fund', ' Fund')}. You can only withdraw up to ₹${selectedFundAmount.toLocaleString()}`);
        return;
      }
    } else if (withdrawalSource === 'special') {
      const selectedSpecialAmount = specialIncome[selectedFundType] || 0;
      if (amt > selectedSpecialAmount) {
        setError(`Amount exceeds available ${selectedFundType.replace('Fund', ' Fund').replace('Income', ' Income')}. You can only withdraw up to ₹${selectedSpecialAmount.toLocaleString()}`);
        return;
      }
    } else if (withdrawalSource === 'superPackages') {
      if (amt > superPackageCommissions.balance) {
        setError(`Amount exceeds available Super Package commissions. You can only withdraw up to ₹${superPackageCommissions.balance.toLocaleString()}`);
        return;
      }
    }

    setLoading(true);
    try {
      let response;

      if (withdrawalSource === 'wallet') {
        // Regular wallet withdrawal
        response = await api.post(API_ENDPOINTS.payout.request, {
          amount: amt,
          paymentMethod: 'bank_transfer',
          paymentDetails: {
            accountNumber: '',
            ifscCode: '',
            accountHolderName: ''
          }
        });
      } else if (withdrawalSource === 'funds') {
        // Fund withdrawal
        response = await api.post(API_ENDPOINTS.funds.withdraw, {
          fundType: selectedFundType,
          amount: amt,
          adminNotes: `User withdrawal request - ${selectedFundType.replace('Fund', ' Fund')}`
        });
      } else if (withdrawalSource === 'special') {
        // Special income withdrawal
        response = await api.post(API_ENDPOINTS.specialIncome.withdraw, {
          incomeType: selectedFundType,
          amount: amt,
          adminNotes: `User withdrawal request - ${selectedFundType.replace('Fund', ' Fund').replace('Income', ' Income')}`
        });
      } else if (withdrawalSource === 'superPackages') {
        // Super Package commission withdrawal - use regular payout endpoint with special notes
        response = await api.post(API_ENDPOINTS.payout.request, {
          amount: amt,
          paymentMethod: 'bank_transfer',
          paymentDetails: {
            accountNumber: '',
            ifscCode: '',
            accountHolderName: ''
          },
          adminNotes: `Super Package commission withdrawal - User has ₹${superPackageCommissions.balance.toLocaleString()} available in Super Package commissions`
        });
      }

      if (response.data.success) {
        const withdrawalTypeText = withdrawalSource === 'wallet' ? 'payout' :
          withdrawalSource === 'funds' ? 'fund withdrawal' :
          withdrawalSource === 'superPackages' ? 'Super Package commission withdrawal' :
            'special income withdrawal';
        setSuccess(`${withdrawalTypeText.charAt(0).toUpperCase() + withdrawalTypeText.slice(1)} requested successfully! Please refresh your Dashboard after admin processes your request to see updated balance.`);
        setAmount('');

        // Refresh all data to show updated balances
        await Promise.all([
          fetchBalance(),
          fetchPayoutHistory(),
          fetchUserFunds(),
          fetchSpecialIncome(),
          fetchSuperPackageCommissions()
        ]);
      } else {
        setError(response.data.message || 'Failed to request withdrawal');
      }
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      setError(error.response?.data?.message || 'Failed to request withdrawal');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <LoginPrompt type="payout" />
  }

  return (
    <div className="max-w-6xl mx-auto mt-14 space-y-6">
      {/* Eligibility Status Card */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-3xl shadow-2xl border-2 border-blue-100/40 p-8 relative overflow-hidden">
        <div className="absolute inset-0 rounded-3xl pointer-events-none z-0 animate-pulse bg-gradient-to-tr from-blue-200/30 via-purple-200/20 to-pink-200/30 blur-xl opacity-60" />

        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-2 z-10 relative">
          <Wallet className="text-blue-500" size={28} /> Payout Eligibility
        </h2>

        {eligibilityLoading ? (
          <div className="text-center py-8 z-10 relative">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Checking eligibility...</p>
          </div>
        ) : eligibility ? (
          <div className="space-y-4 z-10 relative">
            {/* Overall Status */}
            {(() => {
              const hasFunds = userFunds.totalFunds > 0;
              const hasSpecialIncome = (specialIncome.leaderShipFund + specialIncome.royaltyIncome + specialIncome.rewardIncome) > 0;
              const hasSuperPackageCommissions = superPackageCommissions.balance > 0;
              const isEligibleForWithdrawal = eligibility.isEligible || hasFunds || hasSpecialIncome || hasSuperPackageCommissions;
              const isKycApproved = kycStatus && kycStatus.status === 'approved';
              const canWithdraw = isEligibleForWithdrawal && isKycApproved;

              return (
                <div className={`text-center p-4 rounded-xl ${canWithdraw ? 'bg-green-100 border-2 border-green-200' : 'bg-red-100 border-2 border-red-200'}`}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {canWithdraw ? (
                      <CheckCircle className="text-green-600" size={24} />
                    ) : (
                      <XCircle className="text-red-600" size={24} />
                    )}
                    <span className={`font-bold text-lg ${canWithdraw ? 'text-green-700' : 'text-red-700'}`}>
                      {canWithdraw ? 'Eligible for Withdrawal' : 'Not Eligible for Withdrawal'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {canWithdraw ? (
                      <>
                        {eligibility.isEligible && `You can withdraw ₹${withdrawableAmount.toLocaleString()} from wallet. `}
                        {hasFunds && `You have ₹${userFunds.totalFunds.toLocaleString()} in funds available. `}
                        {hasSpecialIncome && `You have ₹${(specialIncome.leaderShipFund + specialIncome.royaltyIncome + specialIncome.rewardIncome).toLocaleString()} in special income available. `}
                        {hasSuperPackageCommissions && `You have ₹${superPackageCommissions.balance.toLocaleString()} in Super Package commissions available.`}
                      </>
                    ) : !isKycApproved ? (
                      'KYC verification is required before making withdrawals. Please complete your KYC verification first.'
                    ) : (
                      'Please meet all requirements to request a withdrawal.'
                    )}
                  </p>
                </div>
              );
            })()}
            {/* KYC Status */}
            <div className="mb-4">
              <div className={`p-4 rounded-xl border-2 ${kycStatus?.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  {kycStatus?.status === 'approved' ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <XCircle className="text-red-600" size={20} />
                  )}
                  <span className="font-semibold text-sm">KYC Verification Status</span>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${kycStatus?.status === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
                    {kycStatus?.status === 'approved' ? '✓ KYC Approved' : 
                     kycStatus?.status === 'pending' ? '⏳ KYC Pending' :
                     kycStatus?.status === 'rejected' ? '✗ KYC Rejected' : '❓ KYC Not Submitted'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {kycStatus?.status === 'approved' ? 'You can make withdrawals' :
                     kycStatus?.status === 'pending' ? 'Your KYC is under review' :
                     kycStatus?.status === 'rejected' ? 'Please resubmit your KYC documents' : 'Please submit your KYC documents'}
                  </div>

                  {kycStatus?.status !== 'approved' && (
                    <button
                      onClick={() => window.location.href = '/kyc'}
                      className="mt-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
                    >
                      {kycStatus?.status === 'pending' ? 'Check KYC Status' :
                       kycStatus?.status === 'rejected' ? 'Resubmit KYC' : 'Submit KYC'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Income Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="text-blue-600" size={20} />
                  <span className="font-semibold text-sm">Active Income</span>
                </div>
                <div className="text-2xl font-bold text-blue-700 mb-1">₹{activeIncome.toLocaleString()}</div>
                <div className="text-xs text-blue-600">Direct Referral Earnings</div>
                <div className={`text-xs font-semibold mt-1 ${kycStatus?.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                  {kycStatus?.status === 'approved' ? '✓ Withdrawable' : '✗ KYC Required'}
                </div>
              </div>
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="text-green-600" size={20} />
                  <span className="font-semibold text-sm">Passive Income</span>
                </div>
                <div className="text-2xl font-bold text-green-700 mb-1">₹{passiveIncome.toLocaleString()}</div>
                <div className="text-xs text-green-600">Downline Commission Earnings</div>
                <div className={`text-xs font-semibold mt-1 ${eligibility.conditions.isEligibleForPassiveIncome && kycStatus?.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                  {eligibility.conditions.isEligibleForPassiveIncome && kycStatus?.status === 'approved' ? '✓ Eligible' : '✗ Requirements Not Met'}
                </div>
                <button
                  onClick={() => setShowRankRequirements(true)}
                  className="mt-3 w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Target size={14} />
                  View Rank Requirements
                </button>
              </div>
            </div>

            {/* Funds & Special Income Eligibility */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Smartphone className="text-purple-600" size={20} />
                  <span className="font-semibold text-sm">Regular Funds</span>
                </div>
                <div className="text-2xl font-bold text-purple-700 mb-1">₹{userFunds.totalFunds?.toLocaleString() || '0'}</div>
                <div className="text-xs text-purple-600">Total Funds Available</div>
                <div className={`text-xs font-semibold mt-1 ${userFunds.totalFunds > 0 && kycStatus?.status === 'approved' ? 'text-green-600' : userFunds.totalFunds > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                  {userFunds.totalFunds > 0 && kycStatus?.status === 'approved' ? '✓ Available for Withdrawal' : 
                   userFunds.totalFunds > 0 ? '⚠ KYC Required for Withdrawal' : 'No funds available'}
                </div>
              </div>
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="text-orange-600" size={20} />
                  <span className="font-semibold text-sm">Special Income</span>
                </div>
                <div className="text-2xl font-bold text-orange-700 mb-1">₹{((specialIncome.leaderShipFund || 0) + (specialIncome.royaltyIncome || 0) + (specialIncome.rewardIncome || 0)).toLocaleString()}</div>
                <div className="text-xs text-orange-600">Total Special Income</div>
                <div className={`text-xs font-semibold mt-1 ${(specialIncome.leaderShipFund + specialIncome.royaltyIncome + specialIncome.rewardIncome) > 0 && kycStatus?.status === 'approved' ? 'text-green-600' : (specialIncome.leaderShipFund + specialIncome.royaltyIncome + specialIncome.rewardIncome) > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                  {(specialIncome.leaderShipFund + specialIncome.royaltyIncome + specialIncome.rewardIncome) > 0 && kycStatus?.status === 'approved' ? '✓ Available for Withdrawal' : 
                   (specialIncome.leaderShipFund + specialIncome.royaltyIncome + specialIncome.rewardIncome) > 0 ? '⚠ KYC Required for Withdrawal' : 'No special income available'}
                </div>
              </div>
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Package className="text-indigo-600" size={20} />
                  <span className="font-semibold text-sm">Super Package Commissions</span>
                </div>
                <div className="text-2xl font-bold text-indigo-700 mb-1">₹{superPackageCommissions.balance?.toLocaleString() || '0'}</div>
                <div className="text-xs text-indigo-600">Total Super Package Commissions</div>
                <div className={`text-xs font-semibold mt-1 ${superPackageCommissions.balance > 0 && kycStatus?.status === 'approved' ? 'text-green-600' : superPackageCommissions.balance > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                  {superPackageCommissions.balance > 0 && kycStatus?.status === 'approved' ? '✓ Available for Withdrawal' : 
                   superPackageCommissions.balance > 0 ? '⚠ KYC Required for Withdrawal' : 'No Super Package commissions available'}
                </div>
              </div>
            </div>

            {/* Conditions Grid - Only show if user has passive income */}
            {passiveIncome > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">Passive Income Requirements</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Total Payout Requests */}
                  <div className={`p-4 rounded-xl border-2 ${eligibility.conditions.hasMinimumPayoutRequests ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className={eligibility.conditions.hasMinimumPayoutRequests ? 'text-green-600' : 'text-red-600'} size={20} />
                      <span className="font-semibold text-sm">System Payouts</span>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{eligibility.conditions.totalPayoutRequests}</div>
                      <div className="text-xs text-gray-600">Total Requests</div>
                      <div className={`text-xs font-semibold mt-1 ${eligibility.conditions.hasMinimumPayoutRequests ? 'text-green-600' : 'text-red-600'}`}>
                        {eligibility.conditions.hasMinimumPayoutRequests ? '✓ > 200' : '✗ Need > 200'}
                      </div>
                    </div>
                  </div>
                  {/* Course Purchases */}
                  <div className={`p-4 rounded-xl border-2 ${eligibility.conditions.hasMinimumCoursePurchases ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className={eligibility.conditions.hasMinimumCoursePurchases ? 'text-green-600' : 'text-red-600'} size={20} />
                      <span className="font-semibold text-sm">Your sucessfull downline</span>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{eligibility.conditions.referralsWithCoursePurchases}</div>
                      <div className="text-xs text-gray-600">Purchased Courses</div>
                      <div className={`text-xs font-semibold mt-1 ${eligibility.conditions.hasMinimumCoursePurchases ? 'text-green-600' : 'text-red-600'}`}>
                        {eligibility.conditions.hasMinimumCoursePurchases ? '✓ ≥ 7' : '✗ Need ≥ 10'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 z-10 relative">
            <AlertCircle className="text-red-500 mx-auto mb-2" size={24} />
            <p className="text-red-600">Failed to load eligibility status</p>
          </div>
        )}
      </div>

      {/* Funds Overview */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-3xl shadow-2xl border-2 border-purple-100/40 p-8 relative overflow-hidden">
        <div className="absolute inset-0 rounded-3xl pointer-events-none z-0 animate-pulse bg-gradient-to-tr from-purple-200/30 via-pink-200/20 to-orange-200/30 blur-xl opacity-60" />

        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center z-10 relative">Your Funds & Special Income</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 z-10 relative">
          {/* Regular Funds */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Smartphone className="text-blue-600" size={20} />
              <span className="font-semibold text-sm">Mobile Fund</span>
            </div>
            <div className="text-lg font-bold text-blue-700">₹{userFunds.mobileFund?.toLocaleString() || '0'}</div>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Laptop className="text-purple-600" size={20} />
              <span className="font-semibold text-sm">Laptop Fund</span>
            </div>
            <div className="text-lg font-bold text-purple-700">₹{userFunds.laptopFund?.toLocaleString() || '0'}</div>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Bike className="text-green-600" size={20} />
              <span className="font-semibold text-sm">Bike Fund</span>
            </div>
            <div className="text-lg font-bold text-green-700">₹{userFunds.bikeFund?.toLocaleString() || '0'}</div>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Car className="text-red-600" size={20} />
              <span className="font-semibold text-sm">Car Fund</span>
            </div>
            <div className="text-lg font-bold text-red-700">₹{userFunds.carFund?.toLocaleString() || '0'}</div>
          </div>

          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Home className="text-indigo-600" size={20} />
              <span className="font-semibold text-sm">House Fund</span>
            </div>
            <div className="text-lg font-bold text-indigo-700">₹{userFunds.houseFund?.toLocaleString() || '0'}</div>
          </div>

          <div className="bg-pink-50 border-2 border-pink-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Plane className="text-pink-600" size={20} />
              <span className="font-semibold text-sm">Travel Fund</span>
            </div>
            <div className="text-lg font-bold text-pink-700">₹{userFunds.travelFund?.toLocaleString() || '0'}</div>
          </div>

          {/* Special Income */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="text-yellow-600" size={20} />
              <span className="font-semibold text-sm">Leadership Fund</span>
            </div>
            <div className="text-lg font-bold text-yellow-700">₹{specialIncome.leaderShipFund?.toLocaleString() || '0'}</div>
          </div>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="text-orange-600" size={20} />
              <span className="font-semibold text-sm">Royalty Income</span>
            </div>
            <div className="text-lg font-bold text-orange-700">₹{specialIncome.royaltyIncome?.toLocaleString() || '0'}</div>
          </div>

          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="text-emerald-600" size={20} />
              <span className="font-semibold text-sm">Reward Income</span>
            </div>
            <div className="text-lg font-bold text-emerald-700">₹{specialIncome.rewardIncome?.toLocaleString() || '0'}</div>
          </div>

          {/* Super Package Commissions */}
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Package className="text-indigo-600" size={20} />
              <span className="font-semibold text-sm">Super Package Commissions</span>
            </div>
            <div className="text-lg font-bold text-indigo-700">₹{superPackageCommissions.balance?.toLocaleString() || '0'}</div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-600 z-10 relative">
          <p>💡 You can withdraw from any of these funds or your wallet balance (minimum ₹200)</p>
        </div>
      </div>

      {/* Payout Request Form */}
      {(eligibility?.isEligible || userFunds.totalFunds > 0 || (specialIncome.leaderShipFund + specialIncome.royaltyIncome + specialIncome.rewardIncome) > 0 || superPackageCommissions.balance > 0) && kycStatus?.status === 'approved' && (
        <div className="bg-gradient-to-br from-green-50 via-white to-blue-50 rounded-3xl shadow-2xl border-2 border-green-100/40 p-8 relative overflow-hidden">
          <div className="absolute inset-0 rounded-3xl pointer-events-none z-0 animate-pulse bg-gradient-to-tr from-green-200/30 via-blue-200/20 to-pink-200/30 blur-xl opacity-60" />

          <h3 className="text-xl font-bold text-gray-800 mb-6 text-center z-10 relative">Request Withdrawal</h3>

          {/* Withdrawal Source Selection */}
          <div className="mb-6 z-10 relative">
            <h4 className="font-bold text-gray-800 mb-4 text-center">Select Withdrawal Source</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <button
                type="button"
                onClick={() => handleWithdrawalSourceChange('wallet')}
                className={`p-4 rounded-xl border-2 transition-all ${withdrawalSource === 'wallet'
                  ? 'bg-green-50 border-green-300 shadow-lg'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="text-green-600" size={20} />
                  <span className="font-semibold">Wallet Balance</span>
                </div>
                <div className="text-lg font-bold text-green-700">₹{balance.toLocaleString()}</div>
                {withdrawableAmount !== balance && (
                  <div className="text-xs text-gray-600 mt-1">
                    Withdrawable: ₹{withdrawableAmount.toLocaleString()}
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleWithdrawalSourceChange('funds')}
                className={`p-4 rounded-xl border-2 transition-all ${withdrawalSource === 'funds'
                  ? 'bg-blue-50 border-blue-300 shadow-lg'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="text-blue-600" size={20} />
                  <span className="font-semibold">Regular Funds</span>
                </div>
                <div className="text-lg font-bold text-blue-700">₹{userFunds.totalFunds?.toLocaleString() || '0'}</div>
                <div className="text-xs text-gray-600 mt-1">Total Funds Available</div>
              </button>

              <button
                type="button"
                onClick={() => handleWithdrawalSourceChange('special')}
                className={`p-4 rounded-xl border-2 transition-all ${withdrawalSource === 'special'
                  ? 'bg-purple-50 border-purple-300 shadow-lg'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="text-purple-600" size={20} />
                  <span className="font-semibold">Special Income</span>
                </div>
                <div className="text-lg font-bold text-purple-700">₹{((specialIncome.leaderShipFund || 0) + (specialIncome.royaltyIncome || 0) + (specialIncome.rewardIncome || 0)).toLocaleString()}</div>
                <div className="text-xs text-gray-600 mt-1">Total Special Income</div>
              </button>

              <button
                type="button"
                onClick={() => handleWithdrawalSourceChange('superPackages')}
                className={`p-4 rounded-xl border-2 transition-all ${withdrawalSource === 'superPackages'
                  ? 'bg-indigo-50 border-indigo-300 shadow-lg'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Package className="text-indigo-600" size={20} />
                  <span className="font-semibold">Super Package Commissions</span>
                </div>
                <div className="text-lg font-bold text-indigo-700">₹{superPackageCommissions.balance?.toLocaleString() || '0'}</div>
                <div className="text-xs text-gray-600 mt-1">Total Super Package Commissions</div>
              </button>
            </div>

            {/* Fund Type Selection */}
            {withdrawalSource === 'funds' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Fund Type:</label>
                <select
                  value={selectedFundType}
                  onChange={(e) => setSelectedFundType(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                >
                  <option value="mobileFund">Mobile Fund - ₹{userFunds.mobileFund?.toLocaleString() || '0'}</option>
                  <option value="laptopFund">Laptop Fund - ₹{userFunds.laptopFund?.toLocaleString() || '0'}</option>
                  <option value="bikeFund">Bike Fund - ₹{userFunds.bikeFund?.toLocaleString() || '0'}</option>
                  <option value="carFund">Car Fund - ₹{userFunds.carFund?.toLocaleString() || '0'}</option>
                  <option value="houseFund">House Fund - ₹{userFunds.houseFund?.toLocaleString() || '0'}</option>
                  <option value="travelFund">Travel Fund - ₹{userFunds.travelFund?.toLocaleString() || '0'}</option>
                </select>
              </div>
            )}

            {withdrawalSource === 'special' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Special Income Type:</label>
                <select
                  value={selectedFundType}
                  onChange={(e) => setSelectedFundType(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                >
                  <option value="leaderShipFund">Leadership Fund - ₹{specialIncome.leaderShipFund?.toLocaleString() || '0'}</option>
                  <option value="royaltyIncome">Royalty Income - ₹{specialIncome.royaltyIncome?.toLocaleString() || '0'}</option>
                  <option value="rewardIncome">Reward Income - ₹{specialIncome.rewardIncome?.toLocaleString() || '0'}</option>
                </select>
              </div>
            )}

            {/* Available Amount Display */}
            <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-gray-600 font-semibold">Available Amount:</span>
              <div className="text-2xl font-bold text-green-600 mt-1">
                ₹{getAvailableAmount().toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {getFundTypeDisplayName()}
              </div>
            </div>
          </div>

          {/* Withdrawal Calculator */}
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 z-10 relative">
            <h4 className="font-bold text-blue-800 mb-4 text-center">
              Withdrawal Calculator - {getFundTypeDisplayName()}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <label className="block text-gray-700 font-semibold mb-2">Enter Amount (₹)</label>
                  <input
                    type="number"
                    min="200"
                    step="1"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-lg"
                    placeholder="Enter amount (min ₹200)"
                    disabled={loading}
                  />
                </div>

                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Withdrawal Amount</div>
                  <div className="text-xl font-bold text-gray-800">₹{amount ? parseFloat(amount).toLocaleString() : '0'}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-sm text-red-600 mb-1">Admin Charge (10%)</div>
                  <div className="text-lg font-bold text-red-700">₹{amount ? (parseFloat(amount) * 0.10).toFixed(2) : '0.00'}</div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="text-sm text-orange-600 mb-1">TDS (2%)</div>
                  <div className="text-lg font-bold text-orange-700">₹{amount ? (parseFloat(amount) * 0.02).toFixed(2) : '0.00'}</div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm text-green-600 mb-1">Net Amount Received (88%)</div>
                  <div className="text-xl font-bold text-green-700">₹{amount ? (parseFloat(amount) * 0.88).toFixed(2) : '0.00'}</div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Total Charges (12%)</div>
                  <div className="text-lg font-bold text-gray-700">₹{amount ? (parseFloat(amount) * 0.12).toFixed(2) : '0.00'}</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="text-sm text-yellow-700 space-y-1">
                <div className="font-semibold">Important Notes:</div>
                <div>• <strong>KYC Required:</strong> KYC verification must be approved before making any withdrawals</div>
                <div>• Minimum withdrawal: ₹200 (applies to all sources - Wallet, Funds, Special Income, Super Package Commissions)</div>
                <div>• Total charges: 12% (10% admin + 2% TDS)</div>
                <div>• You will receive 88% of the requested amount</div>
                <div>• Full amount will be deducted from your selected source only after admin approval</div>
                <div>• Net amount will be credited to your account after admin approval</div>
                <div>• <strong>Note:</strong> After admin processes your payout, refresh your Dashboard to see updated balance</div>
                <div>• <strong>Fund Withdrawals:</strong> Amount is deducted from your selected fund only after admin approval</div>
                <div>• <strong>Special Income Withdrawals:</strong> Amount is deducted from your selected special income only after admin approval</div>
                <div>• <strong>Super Package Commission Withdrawals:</strong> Amount is deducted from your Super Package commissions only after admin approval</div>
              </div>
            </div>
          </div>

          <form className="space-y-4 z-10 relative" onSubmit={handlePayout}>
            {error && <div className="flex items-center gap-2 text-red-600 text-sm font-semibold"><AlertCircle size={18} /> {error}</div>}
            {success && <div className="flex items-center gap-2 text-green-600 text-sm font-semibold"><CheckCircle size={18} /> {success}</div>}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-green-400 hover:from-green-700 hover:to-green-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-60"
              disabled={loading || !(eligibility?.isEligible || userFunds.totalFunds > 0 || (specialIncome.leaderShipFund + specialIncome.royaltyIncome + specialIncome.rewardIncome) > 0 || superPackageCommissions.balance > 0) || kycStatus?.status !== 'approved'}
            >
              {loading ? 'Processing...' : `Request ${withdrawalSource === 'wallet' ? 'Payout' : withdrawalSource === 'funds' ? 'Fund Withdrawal' : withdrawalSource === 'superPackages' ? 'Super Package Commission Withdrawal' : 'Special Income Withdrawal'}`}
            </button>
          </form>
        </div>
      )}


      {/* Rank Requirements Modal */}
      {showRankRequirements && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Rank Requirements for Passive Income</h2>
              <button
                onClick={() => setShowRankRequirements(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-3 rounded-full transition-all duration-300"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <RankRequirements />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payout; 