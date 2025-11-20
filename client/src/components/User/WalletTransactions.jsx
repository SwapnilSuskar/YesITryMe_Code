import { AlertCircle, ArrowDownCircle, ArrowUpCircle, BookOpen, CheckCircle, Crown, Gift, IndianRupee, Star, Wallet, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import api, { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import LoginPrompt from '../UI/LoginPrompt';
import { getRechargeHistory } from '../../services/rechargeService';

const WalletTransactions = () => {
    const { user } = useAuthStore();
    const [tab, setTab] = useState('credited');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [walletData, setWalletData] = useState(null);
    const [payoutEligibility, setPayoutEligibility] = useState(null);
    const [payoutHistory, setPayoutHistory] = useState([]);
    const [walletTransactions, setWalletTransactions] = useState([]);
    const [coinTransactions, setCoinTransactions] = useState([]);
    const [coinBalance, setCoinBalance] = useState(null);
    const [coinPage, setCoinPage] = useState(1);
    const [coinTotalPages, setCoinTotalPages] = useState(1);
    const [userFunds, setUserFunds] = useState(null);
    const [specialIncome, setSpecialIncome] = useState(null);
    const [creditedPage, setCreditedPage] = useState(1);
    const [creditedTotalPages, setCreditedTotalPages] = useState(1);
    const [payoutPage, setPayoutPage] = useState(1);
    const [payoutTotalPages, setPayoutTotalPages] = useState(1);
    const [rechargeTransactions, setRechargeTransactions] = useState([]);
    const [rechargeWalletTransactions, setRechargeWalletTransactions] = useState([]);
    const [rechargePage, setRechargePage] = useState(1);
    const [rechargeTotalPages, setRechargeTotalPages] = useState(1);

    useEffect(() => {
        if (user) {
            fetchWalletData();
            fetchPayoutEligibility();
            fetchPayoutHistory(1);
            fetchWalletTransactions(1);
            fetchCoinTransactions(1);
            fetchUserFunds();
            fetchSpecialIncome();
            fetchRechargeHistory(1);
        }
    }, [user]);

    const fetchWalletData = async () => {
        try {
            setLoading(true);
            // Fetch commission summary for wallet balance
            const response = await api.get(API_ENDPOINTS.packages.commissionSummary);
            if (response.data.success) {
                setWalletData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching wallet data:', error);
            setError('Failed to fetch wallet data');
        } finally {
            setLoading(false);
        }
    };

    const fetchWalletTransactions = async (page = 1) => {
        try {
            // Fetch all commission transactions from the packages endpoint
            const response = await api.get(`${API_ENDPOINTS.packages.transactions}?limit=1000`);

            if (response.data.success) {
                const allTransactions = response.data.data.transactions || [];
                // Separate recharge transactions from other transactions
                const rechargeWalletTxns = allTransactions.filter(t =>
                    t.type === 'recharge_payment' || t.type === 'recharge_refund'
                );
                setRechargeWalletTransactions(rechargeWalletTxns);

                // Filter out recharge transactions from credited tab
                const creditedTransactions = allTransactions.filter(t =>
                    t.type === 'commission' || t.type === 'bonus' || t.type === 'leadership' || t.type === 'royalty' || t.type === 'reward' || t.type === 'refund' || t.type === 'payout_received' || t.type === 'fund_credit' || t.type === 'withdrawal'
                );

                // Client-side pagination
                const itemsPerPage = 10;
                const totalPages = Math.ceil(creditedTransactions.length / itemsPerPage);
                const startIndex = (page - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedTransactions = creditedTransactions.slice(startIndex, endIndex);

                setWalletTransactions(paginatedTransactions);
                setCreditedTotalPages(totalPages);
                setCreditedPage(page);
            }
        } catch (error) {
            console.error('Error fetching wallet transactions:', error);
        }
    };

    const fetchCoinTransactions = async (page = 1) => {
        try {
            // Fetch coin balance and transactions
            const balanceResponse = await api.get(API_ENDPOINTS.coins.balance);
            if (balanceResponse.data.success) {
                setCoinBalance(balanceResponse.data.data);
            }

            // Fetch all coin transactions
            const transactionsResponse = await api.get(`${API_ENDPOINTS.coins.transactions}?limit=1000`);
            if (transactionsResponse.data.success) {
                const allTransactions = transactionsResponse.data.data.transactions || [];
                // Include both earning and withdrawal transactions in pagination
                const allCoinTransactions = allTransactions.filter(t =>
                    t.type === 'view' || t.type === 'like' || t.type === 'comment' || t.type === 'subscribe' || t.type === 'activation_bonus' || t.type === 'referral_bonus' || t.type === 'withdrawal'
                );

                // Sort by date (newest first)
                allCoinTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                // Client-side pagination
                const itemsPerPage = 10;
                const totalPages = Math.ceil(allCoinTransactions.length / itemsPerPage);
                const startIndex = (page - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedTransactions = allCoinTransactions.slice(startIndex, endIndex);

                setCoinTransactions(paginatedTransactions);
                setCoinTotalPages(totalPages);
                setCoinPage(page);
            }
        } catch (error) {
            console.error('Error fetching coin transactions:', error);
        }
    };

    const fetchPayoutEligibility = async () => {
        try {
            const response = await api.get(API_ENDPOINTS.payout.eligibility);
            setPayoutEligibility(response.data);
        } catch (error) {
            console.error('Error fetching payout eligibility:', error);
        }
    };

    const fetchPayoutHistory = async (page = 1) => {
        try {
            const response = await api.get(API_ENDPOINTS.payout.history);
            if (response.data.success) {
                const allPayouts = response.data.payouts || [];

                // Client-side pagination
                const itemsPerPage = 10;
                const totalPages = Math.ceil(allPayouts.length / itemsPerPage);
                const startIndex = (page - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedPayouts = allPayouts.slice(startIndex, endIndex);

                setPayoutHistory(paginatedPayouts);
                setPayoutTotalPages(totalPages);
                setPayoutPage(page);
            }
        } catch (error) {
            console.error('Error fetching payout history:', error);
        }
    };

    const fetchUserFunds = async () => {
        try {
            const response = await api.get(`${API_ENDPOINTS.funds.userFunds}/${user.userId}`);

            const fundsData = response.data.data || {
                mobileFund: 0,
                laptopFund: 0,
                bikeFund: 0,
                carFund: 0,
                houseFund: 0,
                travelFund: 0,
                totalFunds: 0
            };

            setUserFunds(fundsData);
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

            const specialIncomeData = response.data.data || {
                leaderShipFund: 0,
                royaltyIncome: 0,
                rewardIncome: 0
            };

            setSpecialIncome(specialIncomeData);
        } catch (error) {
            console.error('Error fetching special income:', error);
            setSpecialIncome({
                leaderShipFund: 0,
                royaltyIncome: 0,
                rewardIncome: 0
            });
        }
    };

    const fetchRechargeHistory = async (page = 1) => {
        try {
            const response = await getRechargeHistory(page, 10, 'all');
            if (response.success) {
                const recharges = response.data.recharges || [];
                const normalized = recharges.map((recharge) => {
                    const autoResolved =
                        recharge.rechargeCompletedAt && recharge.status === 'success';

                    if (
                        (recharge.status === 'processing' || recharge.status === 'payment_success') &&
                        recharge.rechargeCompletedAt &&
                        !recharge.failureReason
                    ) {
                        return {
                            ...recharge,
                            status: 'success',
                            autoResolved: true,
                        };
                    }

                    if (autoResolved && recharge.failureReason === 'wallet_confirmation') {
                        return {
                            ...recharge,
                            status: 'success',
                            autoResolved: true,
                        };
                    }

                    return recharge;
                });

                setRechargeTransactions(normalized);
                setRechargeTotalPages(response.data.totalPages || 1);
                setRechargePage(page);
            }
        } catch (error) {
            console.error('Error fetching recharge history:', error);
            setRechargeTransactions([]);
        }
    };

    // Combine recharge history with wallet transactions
    const getAllRechargeTransactions = () => {
        // Map all recharge history transactions with all fields from server
        const historyTransactions = rechargeTransactions.map(recharge => ({
            ...recharge, // Include all fields from server (status, failureReason, aiTopUpMessage, etc.)
            source: 'history',
            transactionType: 'recharge',
            amount: parseFloat(recharge.amount || 0),
            netAmount: parseFloat(recharge.netAmount || recharge.amount || 0),
            date: recharge.rechargeCompletedAt || recharge.paymentCompletedAt || recharge.createdAt,
        }));

        // Create a map to match wallet transactions with recharge history
        const historyMap = new Map();
        historyTransactions.forEach(recharge => {
            const key = `${recharge.mobileNumber}_${recharge.amount}_${new Date(recharge.createdAt).toDateString()}`;
            if (!historyMap.has(key)) {
                historyMap.set(key, []);
            }
            historyMap.get(key).push(recharge);
        });

        const walletTxns = rechargeWalletTransactions.map(txn => {
            // Try to extract recharge details from description
            const description = txn.description || '';
            const mobileMatch = description.match(/\+91\s*(\d{10})|(\d{10})/);
            const operatorMatch = description.match(/(Airtel|Vodafone|JIO|Idea|BSNL|RELIANCE JIO)/i);
            const discountMatch = description.match(/(\d+(?:\.\d+)?)%\s*off/i);
            const discountAmountMatch = description.match(/-₹(\d+(?:\.\d+)?)\s+discount/);

            const mobileNumber = mobileMatch ? (mobileMatch[1] || mobileMatch[2]) : '';
            const amount = Math.abs(txn.amount || 0);
            const txnDate = new Date(txn.createdAt).toDateString();

            // Try to find matching recharge history entry
            let matchedRecharge = null;
            if (mobileNumber && amount) {
                const key = `${mobileNumber}_${amount}_${txnDate}`;
                const possibleMatches = historyMap.get(key) || [];
                // Find the closest match by time (within 5 minutes)
                matchedRecharge = possibleMatches.find(r => {
                    const timeDiff = Math.abs(new Date(r.createdAt) - new Date(txn.createdAt));
                    return timeDiff < 5 * 60 * 1000; // 5 minutes
                });

                // If no exact match, try to find by mobile and amount only (within 1 hour)
                if (!matchedRecharge && possibleMatches.length > 0) {
                    matchedRecharge = possibleMatches.find(r => {
                        const timeDiff = Math.abs(new Date(r.createdAt) - new Date(txn.createdAt));
                        return timeDiff < 60 * 60 * 1000; // 1 hour
                    });
                }
            }

            // If it's a refund, check if there's a corresponding failed recharge
            if (txn.type === 'recharge_refund' && matchedRecharge && matchedRecharge.status === 'failed') {
                return {
                    _id: txn._id || `wallet_${txn.createdAt}`,
                    source: 'wallet',
                    transactionType: txn.type,
                    mobileNumber: mobileNumber || 'N/A',
                    operator: operatorMatch ? operatorMatch[1] : (matchedRecharge.operator || 'N/A'),
                    amount: amount,
                    netAmount: amount,
                    discountPercentage: 0,
                    discountAmount: 0,
                    status: 'refunded',
                    rechargeType: matchedRecharge.rechargeType || 'prepaid',
                    circle: matchedRecharge.circle,
                    createdAt: txn.createdAt,
                    date: txn.createdAt,
                    description: description,
                    walletTransaction: true,
                    // Link to the failed recharge
                    linkedRecharge: matchedRecharge,
                };
            }

            // For recharge_payment, use matched recharge details if available
            const baseTxn = {
                _id: txn._id || `wallet_${txn.createdAt}`,
                source: 'wallet',
                transactionType: txn.type,
                mobileNumber: mobileNumber || (matchedRecharge?.mobileNumber || 'N/A'),
                operator: operatorMatch ? operatorMatch[1] : (matchedRecharge?.operator || 'N/A'),
                amount: amount,
                netAmount: amount,
                discountPercentage: discountMatch ? parseFloat(discountMatch[1]) : (matchedRecharge?.discountPercentage || 0),
                discountAmount: discountAmountMatch ? parseFloat(discountAmountMatch[1]) : (matchedRecharge?.discountAmount || 0),
                status: txn.type === 'recharge_refund' ? 'refunded' : (matchedRecharge?.status || txn.status || 'success'),
                rechargeType: matchedRecharge?.rechargeType || 'prepaid',
                circle: matchedRecharge?.circle,
                createdAt: txn.createdAt,
                date: txn.createdAt,
                description: description,
                walletTransaction: true,
            };

            // If we found a matching recharge with failure details, include them
            if (matchedRecharge) {
                baseTxn.failureReason = matchedRecharge.failureReason;
                baseTxn.aiTopUpMessage = matchedRecharge.aiTopUpMessage;
                baseTxn.aiTopUpErrorCode = matchedRecharge.aiTopUpErrorCode;
                baseTxn.aiTopUpOrderId = matchedRecharge.aiTopUpOrderId;
                baseTxn.aiTopUpTransactionId = matchedRecharge.aiTopUpTransactionId;
                baseTxn.status = matchedRecharge.status; // Use status from recharge history
            }

            return baseTxn;
        });

        // Remove duplicates - if a wallet transaction matches a history transaction, prefer history
        const seen = new Set();
        const uniqueTransactions = [];

        // First add all history transactions
        historyTransactions.forEach(txn => {
            const date = new Date(txn.createdAt);
            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
            const key = `${txn.mobileNumber}_${txn.amount}_${dateKey}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueTransactions.push(txn);
            }
        });

        // Then add wallet transactions that don't have matches in history
        walletTxns.forEach(txn => {
            if (txn.transactionType === 'recharge_refund') {
                // For refunds, check if we have a matching refund in history (within 2 minutes)
                const hasMatchingRefund = historyTransactions.some(ht => {
                    if (ht.status === 'refunded' && ht.mobileNumber === txn.mobileNumber) {
                        const timeDiff = Math.abs(new Date(ht.createdAt) - new Date(txn.createdAt));
                        return timeDiff < 2 * 60 * 1000; // 2 minutes
                    }
                    return false;
                });

                if (!hasMatchingRefund) {
                    uniqueTransactions.push(txn);
                }
            } else {
                // For payments, check if we already have this in history (within 2 minutes)
                // Check if there's a matching history entry by mobile, amount (original or net), and time
                const hasMatch = historyTransactions.some(ht => {
                    if (ht.mobileNumber === txn.mobileNumber) {
                        // Match by either original amount or net amount (within 0.01 difference)
                        const amountMatch = Math.abs(ht.amount - txn.amount) < 0.01 ||
                            Math.abs((ht.netAmount || ht.amount) - txn.amount) < 0.01;
                        if (amountMatch) {
                            const timeDiff = Math.abs(new Date(ht.createdAt) - new Date(txn.createdAt));
                            return timeDiff < 2 * 60 * 1000; // 2 minutes
                        }
                    }
                    return false;
                });

                if (!hasMatch) {
                    // Also check if we've already added a similar transaction
                    const date = new Date(txn.createdAt);
                    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
                    const key = `${txn.mobileNumber}_${txn.amount}_${dateKey}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueTransactions.push(txn);
                    }
                }
            }
        });

        // Sort by date (newest first)
        uniqueTransactions.sort((a, b) => {
            const dateA = new Date(a.date || a.createdAt);
            const dateB = new Date(b.date || b.createdAt);
            return dateB - dateA;
        });
        return uniqueTransactions;
    };


    if (!user) {
        return <LoginPrompt type="walletTransactions" />
    }

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto mt-10 bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-3xl shadow-2xl border-2 border-blue-100/40 p-8 relative overflow-hidden">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN');
    };

    const PaginationComponent = ({ currentPage, totalPages, onPageChange, colorClass = 'blue' }) => {
        if (totalPages <= 1) return null;

        const getColorClasses = (color) => {
            switch (color) {
                case 'blue':
                    return {
                        active: 'bg-blue-600 text-white',
                        inactive: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
                        disabled: 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    };
                case 'yellow':
                    return {
                        active: 'bg-yellow-600 text-white',
                        inactive: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
                        disabled: 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    };
                case 'purple':
                    return {
                        active: 'bg-purple-600 text-white',
                        inactive: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
                        disabled: 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    };
                case 'green':
                    return {
                        active: 'bg-green-600 text-white',
                        inactive: 'bg-green-100 text-green-700 hover:bg-green-200',
                        disabled: 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    };
                default:
                    return {
                        active: 'bg-blue-600 text-white',
                        inactive: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
                        disabled: 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    };
            }
        };

        const colors = getColorClasses(colorClass);

        return (
            <div className="mt-6 flex justify-center items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 1 ? colors.disabled : colors.inactive
                        }`}
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
                                onClick={() => onPageChange(pageNum)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum ? colors.active : colors.inactive
                                    }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === totalPages ? colors.disabled : colors.inactive
                        }`}
                >
                    Next
                </button>
            </div>
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'approved': return 'bg-blue-100 text-blue-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            case 'failed': return 'bg-red-100 text-red-700';
            case 'cancelled': return 'bg-gray-100 text-gray-700';
            case 'success': return 'bg-green-100 text-green-700';
            case 'refunded': return 'bg-orange-100 text-orange-700';
            case 'processing': return 'bg-yellow-100 text-yellow-700';
            case 'payment_success': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };


    const getTransactionTypeIcon = (type) => {
        switch (type) {
            case 'commission': return <ArrowUpCircle className="text-green-600" size={16} />;
            case 'withdrawal': return <ArrowDownCircle className="text-red-600" size={16} />;
            case 'refund': return <ArrowUpCircle className="text-blue-600" size={16} />;
            case 'bonus': return <CheckCircle className="text-purple-600" size={16} />;
            case 'leadership': return <Crown className="text-purple-600" size={16} />;
            case 'royalty': return <Star className="text-orange-600" size={16} />;
            case 'reward': return <Gift className="text-pink-600" size={16} />;
            case 'payout_received': return <CheckCircle className="text-green-600" size={16} />;
            case 'fund_credit': return <Wallet className="text-blue-600" size={16} />;
            case 'special_income_credit': return <Star className="text-purple-600" size={16} />;
            case 'admin_adjust': return <Wallet className="text-green-600" size={16} />;
            case 'recharge_payment': return <ArrowDownCircle className="text-orange-600" size={16} />;
            case 'recharge_refund': return <ArrowUpCircle className="text-orange-600" size={16} />;
            // Coin transaction types
            case 'view': return <ArrowUpCircle className="text-blue-600" size={16} />;
            case 'like': return <ArrowUpCircle className="text-pink-600" size={16} />;
            case 'comment': return <ArrowUpCircle className="text-orange-600" size={16} />;
            case 'subscribe': return <ArrowUpCircle className="text-red-600" size={16} />;
            case 'activation_bonus': return <Gift className="text-green-600" size={16} />;
            case 'referral_bonus': return <Gift className="text-indigo-600" size={16} />;
            default: return <Wallet className="text-gray-600" size={16} />;
        }
    };

    const getTransactionTypeColor = (type) => {
        switch (type) {
            case 'commission': return 'text-green-700';
            case 'withdrawal': return 'text-red-700';
            case 'refund': return 'text-blue-700';
            case 'bonus': return 'text-purple-700';
            case 'payout_received': return 'text-green-700';
            case 'fund_credit': return 'text-blue-700';
            case 'special_income_credit': return 'text-purple-700';
            case 'admin_adjust': return 'text-green-700';
            case 'recharge_payment': return 'text-orange-700';
            case 'recharge_refund': return 'text-orange-700';
            // Coin transaction types
            case 'view': return 'text-blue-700';
            case 'like': return 'text-pink-700';
            case 'comment': return 'text-orange-700';
            case 'subscribe': return 'text-red-700';
            case 'activation_bonus': return 'text-green-700';
            case 'referral_bonus': return 'text-indigo-700';
            default: return 'text-gray-700';
        }
    };

    const getTransactionTypeBg = (type) => {
        switch (type) {
            case 'commission': return 'bg-green-50 border-green-200';
            case 'withdrawal': return 'bg-red-50 border-red-200';
            case 'recharge_payment': return 'bg-orange-50 border-orange-200';
            case 'recharge_refund': return 'bg-orange-50 border-orange-200';
            case 'refund': return 'bg-blue-50 border-blue-200';
            case 'bonus': return 'bg-purple-50 border-purple-200';
            case 'payout_received': return 'bg-green-50 border-green-200';
            case 'fund_credit': return 'bg-blue-50 border-blue-200';
            case 'special_income_credit': return 'bg-purple-50 border-purple-200';
            case 'admin_adjust': return 'bg-green-50 border-green-200';
            // Coin transaction types
            case 'view': return 'bg-blue-50 border-blue-200';
            case 'like': return 'bg-pink-50 border-pink-200';
            case 'comment': return 'bg-orange-50 border-orange-200';
            case 'subscribe': return 'bg-red-50 border-red-200';
            case 'activation_bonus': return 'bg-green-50 border-green-200';
            case 'referral_bonus': return 'bg-indigo-50 border-indigo-200';
            default: return 'bg-gray-50 border-gray-200';
        }
    };

    // Use the regular transactions (now includes admin transactions)
    const creditedTransactions = walletTransactions;
    const allCoinTransactions = coinTransactions; // This now includes both earnings and withdrawals

    // Create virtual transaction entries for funds and special income
    const virtualFundTransactions = [];
    const virtualSpecialIncomeTransactions = [];

    // Add fund transactions if user has funds
    if (userFunds) {
        if (userFunds.mobileFund > 0) {
            virtualFundTransactions.push({
                _id: `fund_mobile_${user.userId}`,
                type: 'fund_credit',
                amount: userFunds.mobileFund,
                description: `Mobile Fund credit added by admin`,
                status: 'completed',
                fundType: 'mobileFund',
                createdAt: new Date(),
                packageName: 'Mobile Fund',
                purchaserName: 'Admin',
                level: 'Fund'
            });
        }
        if (userFunds.laptopFund > 0) {
            virtualFundTransactions.push({
                _id: `fund_laptop_${user.userId}`,
                type: 'fund_credit',
                amount: userFunds.laptopFund,
                description: `Laptop Fund credit added by admin`,
                status: 'completed',
                fundType: 'laptopFund',
                createdAt: new Date(),
                packageName: 'Laptop Fund',
                purchaserName: 'Admin',
                level: 'Fund'
            });
        }
        if (userFunds.bikeFund > 0) {
            virtualFundTransactions.push({
                _id: `fund_bike_${user.userId}`,
                type: 'fund_credit',
                amount: userFunds.bikeFund,
                description: `Bike Fund credit added by admin`,
                status: 'completed',
                fundType: 'bikeFund',
                createdAt: new Date(),
                packageName: 'Bike Fund',
                purchaserName: 'Admin',
                level: 'Fund'
            });
        }
        if (userFunds.carFund > 0) {
            virtualFundTransactions.push({
                _id: `fund_car_${user.userId}`,
                type: 'fund_credit',
                amount: userFunds.carFund,
                description: `Car Fund credit added by admin`,
                status: 'completed',
                fundType: 'carFund',
                createdAt: new Date(),
                packageName: 'Car Fund',
                purchaserName: 'Admin',
                level: 'Fund'
            });
        }
        if (userFunds.houseFund > 0) {
            virtualFundTransactions.push({
                _id: `fund_house_${user.userId}`,
                type: 'fund_credit',
                amount: userFunds.houseFund,
                description: `House Fund credit added by admin`,
                status: 'completed',
                fundType: 'houseFund',
                createdAt: new Date(),
                packageName: 'House Fund',
                purchaserName: 'Admin',
                level: 'Fund'
            });
        }
        if (userFunds.travelFund > 0) {
            virtualFundTransactions.push({
                _id: `fund_travel_${user.userId}`,
                type: 'fund_credit',
                amount: userFunds.travelFund,
                description: `Travel Fund credit added by admin`,
                status: 'completed',
                fundType: 'travelFund',
                createdAt: new Date(),
                packageName: 'Travel Fund',
                purchaserName: 'Admin',
                level: 'Fund'
            });
        }
    }

    // Add special income transactions if user has special income
    if (specialIncome) {
        if (specialIncome.leaderShipFund > 0) {
            virtualSpecialIncomeTransactions.push({
                _id: `special_leadership_${user.userId}`,
                type: 'special_income_credit',
                amount: specialIncome.leaderShipFund,
                description: `Leadership Fund credit added by admin`,
                status: 'completed',
                incomeType: 'leaderShipFund',
                createdAt: new Date(),
                packageName: 'Leadership Fund',
                purchaserName: 'Admin',
                level: 'Special Income'
            });
        }
        if (specialIncome.royaltyIncome > 0) {
            virtualSpecialIncomeTransactions.push({
                _id: `special_royalty_${user.userId}`,
                type: 'special_income_credit',
                amount: specialIncome.royaltyIncome,
                description: `Royalty Income credit added by admin`,
                status: 'completed',
                incomeType: 'royaltyIncome',
                createdAt: new Date(),
                packageName: 'Royalty Income',
                purchaserName: 'Admin',
                level: 'Special Income'
            });
        }
        if (specialIncome.rewardIncome > 0) {
            virtualSpecialIncomeTransactions.push({
                _id: `special_reward_${user.userId}`,
                type: 'special_income_credit',
                amount: specialIncome.rewardIncome,
                description: `Reward Income credit added by admin`,
                status: 'completed',
                incomeType: 'rewardIncome',
                createdAt: new Date(),
                packageName: 'Reward Income',
                purchaserName: 'Admin',
                level: 'Special Income'
            });
        }
    }

    // Calculate total earned from commission transactions (this should NOT be affected by withdrawals)
    const totalEarned = creditedTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // Calculate total withdrawn from payout history (only approved and completed payouts)
    const totalWithdrawn = payoutHistory
        .filter(p => p.status === 'approved' || p.status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);



    return (
        <div className="max-w-6xl mx-auto mt-20 mb-10 space-y-6 ">
            {/* Wallet Transactions */}
            <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-3xl shadow-2xl border-2 border-blue-100/40 p-8 relative overflow-hidden animate-fade-in">
                {/* Animated Glow Border */}
                <div className="absolute inset-0 rounded-3xl pointer-events-none z-0 animate-pulse bg-gradient-to-tr from-blue-200/30 via-green-200/20 to-pink-200/30 blur-xl opacity-60" />

                <div className="flex flex-wrap items-center gap-2 mb-6 z-10 relative">
                    <button
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all border ${tab === 'credited' ? 'bg-blue-600 text-white shadow border-blue-500' : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-transparent'}`}
                        onClick={() => setTab('credited')}
                    >
                        <ArrowUpCircle size={14} />
                        <span className="hidden sm:inline">Credited Amount</span>
                        <span className="sm:hidden">Credited</span>
                    </button>
                    <button
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all border ${tab === 'recharge' ? 'bg-orange-600 text-white shadow border-orange-500' : 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-transparent'}`}
                        onClick={() => setTab('recharge')}
                    >
                        <Smartphone size={14} />
                        <span className="hidden sm:inline">Mobile Recharge</span>
                        <span className="sm:hidden">Recharge</span>
                    </button>
                    <button
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all border ${tab === 'funds' ? 'bg-purple-600 text-white shadow border-purple-500' : 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-transparent'}`}
                        onClick={() => setTab('funds')}
                    >
                        <Wallet size={14} />
                        <span className="hidden sm:inline">Credited Funds</span>
                        <span className="sm:hidden">Funds</span>
                    </button>

                    <button
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all border ${tab === 'payout' ? 'bg-green-600 text-white shadow border-green-500' : 'bg-green-100 text-green-700 hover:bg-green-200 border-transparent'}`}
                        onClick={() => setTab('payout')}
                    >
                        <ArrowDownCircle size={14} />
                        <span className="hidden sm:inline">Payout History</span>
                        <span className="sm:hidden">Payout</span>
                    </button>
                    <button
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all border ${tab === 'coins' ? 'bg-yellow-600 text-white shadow border-yellow-500' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-transparent'}`}
                        onClick={() => setTab('coins')}
                    >
                        <Star size={14} />
                        <span className="hidden sm:inline">Coin Transactions</span>
                        <span className="sm:hidden">Coins</span>
                    </button>
                </div>
                <div className="z-10 relative">
                    {tab === 'credited' ? (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-50/80 border-l-4 border-blue-500 rounded-xl p-4 shadow">
                                    <div className="flex items-center gap-3">
                                        <ArrowUpCircle className="text-blue-500" size={32} />
                                        <div>
                                            <div className="text-xs text-blue-700 font-semibold flex items-center gap-1"><IndianRupee size={16} /> Available Balance</div>
                                            <div className="text-2xl font-extrabold text-blue-700">₹{walletData?.balance?.toLocaleString() || '0'}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-red-50/80 border-l-4 border-red-500 rounded-xl p-4 shadow">
                                    <div className="flex items-center gap-3">
                                        <ArrowDownCircle className="text-red-500" size={32} />
                                        <div>
                                            <div className="text-xs text-red-700 font-semibold flex items-center gap-1"><IndianRupee size={16} /> Total Withdrawn</div>
                                            <div className="text-2xl font-extrabold text-red-700">₹{totalWithdrawn.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-green-50/80 border-l-4 border-green-500 rounded-xl p-4 shadow">
                                    <div className="flex items-center gap-3">
                                        <ArrowUpCircle className="text-green-500" size={32} />
                                        <div>
                                            <div className="text-xs text-green-700 font-semibold flex items-center gap-1"><IndianRupee size={16} /> Total Earned</div>
                                            <div className="text-2xl font-extrabold text-green-700">₹{totalEarned.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
                                    <AlertCircle size={20} />
                                    {error}
                                </div>
                            )}

                            <div className="bg-white/80 rounded-xl shadow border border-blue-100 p-4">
                                {creditedTransactions.length === 0 ? (
                                    <div className="text-center py-8">
                                        <ArrowUpCircle className="text-gray-400 mx-auto mb-4" size={48} />
                                        <p className="text-gray-500 text-lg">No credited amounts yet</p>
                                        <p className="text-gray-400 text-sm mt-2">Your commission earnings and bonuses will appear here</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {creditedTransactions.map((transaction) => (
                                            <div key={transaction._id || transaction.id} className={`rounded-lg p-4 border ${getTransactionTypeBg(transaction.type)}`}>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        {getTransactionTypeIcon(transaction.type)}
                                                        <div>
                                                            <div className={`font-semibold text-lg ${getTransactionTypeColor(transaction.type)}`}>
                                                                ₹{transaction.amount.toLocaleString()}
                                                            </div>
                                                            <div className="text-sm text-gray-600">{transaction.description}</div>
                                                            {transaction.packageName && (
                                                                <div className="text-xs text-gray-500">Package: {transaction.packageName}</div>
                                                            )}
                                                            {transaction.purchaserName && (
                                                                <div className="text-xs text-gray-500">From: {transaction.purchaserName}</div>
                                                            )}
                                                            {transaction.level && (
                                                                <div className="text-xs text-gray-500">Level: {transaction.level}</div>
                                                            )}
                                                            {transaction.type === 'commission' && (
                                                                <div className="text-xs text-blue-600 font-semibold">
                                                                    💰 Commission from Level {transaction.level}
                                                                </div>
                                                            )}
                                                            {transaction.type === 'bonus' && (
                                                                <div className="text-xs text-purple-600 font-semibold">
                                                                    🎁 Bonus Payment
                                                                </div>
                                                            )}
                                                            {transaction.type === 'leadership' && (
                                                                <div className="text-xs text-purple-600 font-semibold">
                                                                    👑 Leadership Fund
                                                                </div>
                                                            )}
                                                            {transaction.type === 'royalty' && (
                                                                <div className="text-xs text-orange-600 font-semibold">
                                                                    ⭐ Royalty Income
                                                                </div>
                                                            )}
                                                            {transaction.type === 'reward' && (
                                                                <div className="text-xs text-pink-600 font-semibold">
                                                                    🎯 Reward Income
                                                                </div>
                                                            )}
                                                            {transaction.type === 'payout_received' && (
                                                                <div className="text-xs text-green-600 font-semibold">
                                                                    ✅ Payout Received from YesITryMe
                                                                </div>
                                                            )}
                                                            {transaction.type === 'fund_credit' && transaction.description?.includes('Admin added') && (
                                                                <div className="text-xs text-green-600 font-semibold">
                                                                    💰 Admin Added Money
                                                                </div>
                                                            )}
                                                            {transaction.incomeType && (
                                                                <div className={`inline-block text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${transaction.incomeType === 'active'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-blue-100 text-blue-800'
                                                                    }`}>
                                                                    {transaction.incomeType === 'active' ? 'Active Income' : 'Passive Income'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm text-gray-600">{formatDateTime(transaction.createdAt)}</div>
                                                        <div className={`inline-block text-xs font-semibold mt-1 px-2 py-1 rounded-full whitespace-nowrap ${getStatusColor(transaction.status)}`}>
                                                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Pagination for Credited Amount */}
                            <PaginationComponent
                                currentPage={creditedPage}
                                totalPages={creditedTotalPages}
                                onPageChange={fetchWalletTransactions}
                                colorClass="blue"
                            />
                        </>
                    ) : tab === 'coins' ? (
                        <>
                            {/* Summary Cards for Coins */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-yellow-50/80 border-l-4 border-yellow-500 rounded-xl p-4 shadow">
                                    <div className="flex items-center gap-3">
                                        <Star className="text-yellow-500" size={32} />
                                        <div>
                                            <div className="text-xs text-yellow-700 font-semibold flex items-center gap-1">💰 Available Coins</div>
                                            <div className="text-2xl font-extrabold text-yellow-700">{coinBalance?.balance?.toLocaleString() || '0'}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-green-50/80 border-l-4 border-green-500 rounded-xl p-4 shadow">
                                    <div className="flex items-center gap-3">
                                        <ArrowUpCircle className="text-green-500" size={32} />
                                        <div>
                                            <div className="text-xs text-green-700 font-semibold flex items-center gap-1">📈 Total Earned</div>
                                            <div className="text-2xl font-extrabold text-green-700">{coinBalance?.totalEarned?.toLocaleString() || '0'}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-blue-50/80 border-l-4 border-blue-500 rounded-xl p-4 shadow">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="text-blue-500" size={32} />
                                        <div>
                                            <div className="text-xs text-blue-700 font-semibold flex items-center gap-1">💎 Active Income</div>
                                            <div className="text-2xl font-extrabold text-blue-700">{coinBalance?.activeIncome?.toLocaleString() || '0'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/80 rounded-xl shadow border border-yellow-100 p-6">
                                {allCoinTransactions.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Star className="text-gray-400 mx-auto mb-4" size={48} />
                                        <p className="text-gray-500 text-lg">No coin transactions yet</p>
                                        <p className="text-gray-400 text-sm mt-2">Your coin earnings and withdrawals will appear here</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {allCoinTransactions.map((transaction) => (
                                            <div key={transaction._id || transaction.id} className={`rounded-lg p-5 border ${getTransactionTypeBg(transaction.type)}`}>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-4">
                                                        {getTransactionTypeIcon(transaction.type)}
                                                        <div>
                                                            <div className={`font-semibold text-lg ${getTransactionTypeColor(transaction.type)}`}>
                                                                {transaction.type === 'withdrawal'
                                                                    ? `${Math.abs(transaction.amount).toLocaleString()} coins`
                                                                    : `${transaction.amount.toLocaleString()} coins`
                                                                }
                                                            </div>
                                                            <div className="text-sm text-gray-600 mt-1">
                                                                {transaction.type === 'view' && '📺 YouTube View Task'}
                                                                {transaction.type === 'like' && '👍 YouTube Like Task'}
                                                                {transaction.type === 'comment' && '💬 YouTube Comment Task'}
                                                                {transaction.type === 'subscribe' && '🔔 YouTube Subscribe Task'}
                                                                {transaction.type === 'activation_bonus' && '🎁 Activation Bonus'}
                                                                {transaction.type === 'withdrawal' && '💸 Withdrawal Request'}
                                                            </div>
                                                            {transaction.metadata?.taskTitle && (
                                                                <div className="text-xs text-gray-500 mt-1">Task: {transaction.metadata.taskTitle}</div>
                                                            )}
                                                            {transaction.metadata?.videoUrl && (
                                                                <div className="text-xs text-gray-500 mt-1">Video: {transaction.metadata.videoUrl}</div>
                                                            )}
                                                            {transaction.metadata?.amountInRupees && (
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    Amount: ₹{transaction.metadata.amountInRupees}
                                                                </div>
                                                            )}
                                                            {transaction.type === 'view' && (
                                                                <div className="text-xs text-blue-600 font-semibold mt-1">
                                                                    📺 View Task Completed
                                                                </div>
                                                            )}
                                                            {transaction.type === 'like' && (
                                                                <div className="text-xs text-pink-600 font-semibold mt-1">
                                                                    👍 Like Task Completed
                                                                </div>
                                                            )}
                                                            {transaction.type === 'comment' && (
                                                                <div className="text-xs text-orange-600 font-semibold mt-1">
                                                                    💬 Comment Task Completed
                                                                </div>
                                                            )}
                                                            {transaction.type === 'subscribe' && (
                                                                <div className="text-xs text-red-600 font-semibold mt-1">
                                                                    🔔 Subscribe Task Completed
                                                                </div>
                                                            )}
                                                            {transaction.type === 'activation_bonus' && (
                                                                <div className="text-xs text-green-600 font-semibold mt-1">
                                                                    🎁 Welcome Bonus
                                                                </div>
                                                            )}
                                                            {transaction.type === 'referral_bonus' && (
                                                                <div className="text-xs text-indigo-600 font-semibold mt-1">
                                                                    🎁 Referral Signup Bonus
                                                                </div>
                                                            )}
                                                            {transaction.type === 'referral_bonus' && transaction.metadata?.referredUserName && (
                                                                <div className="text-xs text-gray-500 mt-1">Referred: {transaction.metadata.referredUserName}</div>
                                                            )}
                                                            {transaction.type === 'withdrawal' && (
                                                                <div className="text-xs text-red-600 font-semibold mt-1">
                                                                    💸 Withdrawal Request
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm text-gray-600">{formatDateTime(transaction.createdAt)}</div>
                                                        <div className={`inline-block text-xs font-semibold mt-2 px-2 py-1 rounded-full whitespace-nowrap ${getStatusColor(transaction.status)}`}>
                                                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Pagination for Coin Transactions */}
                            <PaginationComponent
                                currentPage={coinPage}
                                totalPages={coinTotalPages}
                                onPageChange={fetchCoinTransactions}
                                colorClass="yellow"
                            />
                        </>
                    ) : tab === 'funds' ? (
                        <>
                            {/* Summary Cards for Funds */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-purple-50/80 border-l-4 border-purple-500 rounded-xl p-4 shadow">
                                    <div className="flex items-center gap-3">
                                        <Wallet className="text-purple-500" size={32} />
                                        <div>
                                            <div className="text-xs text-purple-700 font-semibold flex items-center gap-1"><IndianRupee size={16} /> Total Funds</div>
                                            <div className="text-2xl font-extrabold text-purple-700">₹{userFunds?.totalFunds?.toLocaleString() || '0'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50/80 border-l-4 border-blue-500 rounded-xl p-4 shadow">
                                    <div className="flex items-center gap-3">
                                        <Star className="text-blue-500" size={32} />
                                        <div>
                                            <div className="text-xs text-blue-700 font-semibold flex items-center gap-1"><IndianRupee size={16} /> Special Income</div>
                                            <div className="text-2xl font-extrabold text-blue-700">₹{((specialIncome?.leaderShipFund || 0) + (specialIncome?.royaltyIncome || 0) + (specialIncome?.rewardIncome || 0)).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-green-50/80 border-l-4 border-green-500 rounded-xl p-4 shadow">
                                    <div className="flex items-center gap-3">
                                        <ArrowUpCircle className="text-green-500" size={32} />
                                        <div>
                                            <div className="text-xs text-green-700 font-semibold flex items-center gap-1"><IndianRupee size={16} /> Total Available</div>
                                            <div className="text-2xl font-extrabold text-green-700">₹{((userFunds?.totalFunds || 0) + (specialIncome?.leaderShipFund || 0) + (specialIncome?.royaltyIncome || 0) + (specialIncome?.rewardIncome || 0)).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/80 rounded-xl shadow border border-purple-100 p-4">
                                {/* Funds Section */}
                                {userFunds?.totalFunds > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                                            <Wallet className="text-purple-600" size={20} />
                                            💰 Your Funds
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {userFunds.mobileFund > 0 && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="text-2xl">📱</div>
                                                        <div className="text-sm text-blue-600 font-medium">Mobile Fund</div>
                                                    </div>
                                                    <div className="text-xl font-bold text-blue-700">₹{userFunds.mobileFund.toLocaleString()}</div>
                                                </div>
                                            )}
                                            {userFunds.laptopFund > 0 && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="text-2xl">💻</div>
                                                        <div className="text-sm text-blue-600 font-medium">Laptop Fund</div>
                                                    </div>
                                                    <div className="text-xl font-bold text-blue-700">₹{userFunds.laptopFund.toLocaleString()}</div>
                                                </div>
                                            )}
                                            {userFunds.bikeFund > 0 && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="text-2xl">🏍️</div>
                                                        <div className="text-sm text-blue-600 font-medium">Bike Fund</div>
                                                    </div>
                                                    <div className="text-xl font-bold text-blue-700">₹{userFunds.bikeFund.toLocaleString()}</div>
                                                </div>
                                            )}
                                            {userFunds.carFund > 0 && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="text-2xl">🚗</div>
                                                        <div className="text-sm text-blue-600 font-medium">Car Fund</div>
                                                    </div>
                                                    <div className="text-xl font-bold text-blue-700">₹{userFunds.carFund.toLocaleString()}</div>
                                                </div>
                                            )}
                                            {userFunds.houseFund > 0 && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="text-2xl">🏠</div>
                                                        <div className="text-sm text-blue-600 font-medium">House Fund</div>
                                                    </div>
                                                    <div className="text-xl font-bold text-blue-700">₹{userFunds.houseFund.toLocaleString()}</div>
                                                </div>
                                            )}
                                            {userFunds.travelFund > 0 && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="text-2xl">✈️</div>
                                                        <div className="text-sm text-blue-600 font-medium">Travel Fund</div>
                                                    </div>
                                                    <div className="text-xl font-bold text-blue-700">₹{userFunds.travelFund.toLocaleString()}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Special Income Section */}
                                {specialIncome && (specialIncome.leaderShipFund > 0 || specialIncome.royaltyIncome > 0 || specialIncome.rewardIncome > 0) && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                                            <Star className="text-purple-600" size={20} />
                                            ⭐ Your Special Income
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {specialIncome.leaderShipFund > 0 && (
                                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="text-2xl">👑</div>
                                                        <div className="text-sm text-purple-600 font-medium">Leadership Fund</div>
                                                    </div>
                                                    <div className="text-xl font-bold text-purple-700">₹{specialIncome.leaderShipFund.toLocaleString()}</div>
                                                </div>
                                            )}
                                            {specialIncome.royaltyIncome > 0 && (
                                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="text-2xl">⭐</div>
                                                        <div className="text-sm text-purple-600 font-medium">Royalty Income</div>
                                                    </div>
                                                    <div className="text-xl font-bold text-purple-700">₹{specialIncome.royaltyIncome.toLocaleString()}</div>
                                                </div>
                                            )}
                                            {specialIncome.rewardIncome > 0 && (
                                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="text-2xl">🎯</div>
                                                        <div className="text-sm text-purple-600 font-medium">Reward Income</div>
                                                    </div>
                                                    <div className="text-xl font-bold text-purple-700">₹{specialIncome.rewardIncome.toLocaleString()}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* No Funds Message */}
                                {(!userFunds || userFunds.totalFunds === 0) && (!specialIncome || (specialIncome.leaderShipFund === 0 && specialIncome.royaltyIncome === 0 && specialIncome.rewardIncome === 0)) && (
                                    <div className="text-center py-12">
                                        <Wallet className="text-gray-400 mx-auto mb-4" size={48} />
                                        <p className="text-gray-500 text-lg">No funds or special income yet</p>
                                        <p className="text-gray-400 text-sm mt-2">Your funds and special income will appear here when added by admin</p>
                                    </div>
                                )}

                                {/* Fund and Special Income Transactions */}
                                {(virtualFundTransactions.length > 0 || virtualSpecialIncomeTransactions.length > 0) && (
                                    <div className="mt-8">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <BookOpen className="text-purple-600" size={20} />
                                            Fund & Special Income Transactions
                                        </h3>

                                        <div className="space-y-3">
                                            {[...virtualFundTransactions, ...virtualSpecialIncomeTransactions].map((transaction) => (
                                                <div key={transaction._id} className={`rounded-lg p-4 border ${getTransactionTypeBg(transaction.type)}`}>
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            {getTransactionTypeIcon(transaction.type)}
                                                            <div>
                                                                <div className={`font-semibold text-lg ${getTransactionTypeColor(transaction.type)}`}>
                                                                    ₹{transaction.amount.toLocaleString()}
                                                                </div>
                                                                <div className="text-sm text-gray-600">{transaction.description}</div>
                                                                {transaction.packageName && (
                                                                    <div className="text-xs text-gray-500">Package: {transaction.packageName}</div>
                                                                )}
                                                                {transaction.purchaserName && (
                                                                    <div className="text-xs text-gray-500">From: {transaction.purchaserName}</div>
                                                                )}
                                                                {transaction.level && (
                                                                    <div className="text-xs text-gray-500">Level: {transaction.level}</div>
                                                                )}
                                                                {transaction.type === 'fund_credit' && (
                                                                    <div className="text-xs text-blue-600 font-semibold">
                                                                        💰 Fund Credit Added From YesITryMe
                                                                    </div>
                                                                )}
                                                                {transaction.type === 'special_income_credit' && (
                                                                    <div className="text-xs text-purple-600 font-semibold">
                                                                        ⭐ Special Income Credit Added From YesITryMe
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm text-gray-600">{formatDateTime(transaction.createdAt)}</div>
                                                            <div className={`inline-block text-xs font-semibold mt-1 px-2 py-1 rounded-full whitespace-nowrap ${getStatusColor(transaction.status)}`}>
                                                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}


                            </div>
                        </>
                    ) : tab === 'recharge' ? (
                        <>
                            {/* Summary Cards for Recharge */}
                            {(() => {
                                const allRecharges = getAllRechargeTransactions();
                                const successful = allRecharges.filter(r => r.status === 'success');
                                const failed = allRecharges.filter(r => r.status === 'failed');
                                const totalSpent = successful.reduce(
                                    (sum, r) => sum + (parseFloat(r.netAmount || r.amount) || 0),
                                    0
                                );
                                const totalRefunded = failed.reduce(
                                    (sum, r) => sum + (parseFloat(r.netAmount || r.amount) || 0),
                                    0
                                );

                                return (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
                                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-3 sm:p-4 shadow-sm">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                                <Smartphone className="text-orange-600 flex-shrink-0" size={24} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[10px] sm:text-xs text-orange-700 font-medium truncate">Total</div>
                                                    <div className="text-lg sm:text-xl font-bold text-orange-800">{allRecharges.filter(r => r.transactionType === 'recharge_payment' || r.source === 'history').length}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-3 sm:p-4 shadow-sm">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                                <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[10px] sm:text-xs text-green-700 font-medium truncate">Success</div>
                                                    <div className="text-lg sm:text-xl font-bold text-green-800">{successful.length}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-3 sm:p-4 shadow-sm">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                                <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[10px] sm:text-xs text-red-700 font-medium truncate">Failed</div>
                                                    <div className="text-lg sm:text-xl font-bold text-red-800">{failed.length}</div>
                                                    {totalRefunded > 0 && (
                                                        <div className="text-[9px] sm:text-xs text-red-600 mt-0.5">₹{totalRefunded.toFixed(0)}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3 sm:p-4 shadow-sm">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                                <IndianRupee className="text-blue-600 flex-shrink-0" size={24} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[10px] sm:text-xs text-blue-700 font-medium truncate">Spent</div>
                                                    <div className="text-lg sm:text-xl font-bold text-blue-800">₹{totalSpent >= 1000 ? (totalSpent / 1000).toFixed(1) + 'k' : totalSpent.toFixed(0)}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-3 sm:p-4 shadow-sm col-span-2 sm:col-span-1">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                                <ArrowUpCircle className="text-purple-600 flex-shrink-0" size={24} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[10px] sm:text-xs text-purple-700 font-medium truncate">Refunded</div>
                                                    <div className="text-lg sm:text-xl font-bold text-purple-800">₹{totalRefunded >= 1000 ? (totalRefunded / 1000).toFixed(1) + 'k' : totalRefunded.toFixed(0)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
                                {(() => {
                                    const allRecharges = getAllRechargeTransactions();

                                    if (allRecharges.length === 0) {
                                        return (
                                            <div className="text-center py-8">
                                                <Smartphone className="text-gray-400 mx-auto mb-4" size={48} />
                                                <p className="text-gray-500 text-lg">No recharge transactions yet</p>
                                                <p className="text-gray-400 text-sm mt-2">Your mobile recharge history will appear here</p>
                                            </div>
                                        );
                                    }

                                    // Apply pagination
                                    const itemsPerPage = 10;
                                    const startIndex = (rechargePage - 1) * itemsPerPage;
                                    const endIndex = startIndex + itemsPerPage;
                                    const paginatedRecharges = allRecharges.slice(startIndex, endIndex);

                                    return (
                                        <div className="space-y-2 sm:space-y-3">
                                            {paginatedRecharges.map((recharge) => {
                                                const isRefund = recharge.transactionType === 'recharge_refund' || recharge.status === 'refunded';
                                                const isSuccess = recharge.status === 'success' && !isRefund;
                                                const isFailed = recharge.status === 'failed';
                                                const isProcessing = recharge.status === 'processing' || recharge.status === 'payment_success';

                                                return (
                                                    <div key={recharge._id} className={`rounded-lg p-3 sm:p-4 border transition-shadow hover:shadow-md ${isSuccess ? 'bg-gradient-to-r from-green-50 to-green-100/50 border-green-300' : isFailed ? 'bg-gradient-to-r from-red-50 to-red-100/50 border-red-300' : isRefund ? 'bg-gradient-to-r from-purple-50 to-purple-100/50 border-purple-300' : isProcessing ? 'bg-gradient-to-r from-yellow-50 to-yellow-100/50 border-yellow-300' : 'bg-gradient-to-r from-orange-50 to-orange-100/50 border-orange-300'}`}>
                                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                                            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                                                                <div className={`flex-shrink-0 mt-0.5 ${isSuccess ? 'text-green-600' : isFailed ? 'text-red-600' : isRefund ? 'text-purple-600' : 'text-orange-600'}`}>
                                                                    {isRefund ? <ArrowUpCircle size={18} className="sm:w-5 sm:h-5" /> : <Smartphone size={18} className="sm:w-5 sm:h-5" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                                                        <span className={`font-bold text-base sm:text-lg ${isSuccess ? 'text-green-700' : isFailed ? 'text-red-700' : isRefund ? 'text-purple-700' : 'text-orange-700'}`}>
                                                                            {isRefund ? '+' : ''}₹{parseFloat(recharge.netAmount || recharge.amount || 0).toFixed(2)}
                                                                        </span>
                                                                        {!isRefund && recharge.discountPercentage > 0 && (
                                                                            <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-bold">
                                                                                {recharge.discountPercentage}% OFF
                                                                            </span>
                                                                        )}
                                                                        <div className={`inline-block text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full ${getStatusColor(recharge.status)}`}>
                                                                            {isRefund && '🔄 Refunded'}
                                                                            {!isRefund && recharge.status === 'success' && '✅ Success'}
                                                                            {recharge.status === 'failed' && '❌ Failed'}
                                                                            {recharge.status === 'processing' && '⏳ Processing'}
                                                                            {recharge.status === 'payment_success' && '💳 Paid'}
                                                                            {recharge.status === 'pending' && '⏳ Pending'}
                                                                            {recharge.status === 'cancelled' && '🚫 Cancelled'}
                                                                        </div>
                                                                    </div>
                                                                    {isRefund ? (
                                                                        <div className="text-xs sm:text-sm text-purple-700 font-medium mb-1.5">
                                                                            🔄 Refund Received
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-xs sm:text-sm text-gray-700 font-medium mb-1.5">
                                                                            📱 +91 {recharge.mobileNumber}
                                                                        </div>
                                                                    )}
                                                                    {!isRefund && (
                                                                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] sm:text-xs text-gray-600">
                                                                            <span><span className="font-medium">Op:</span> {recharge.operator || 'N/A'}</span>
                                                                            {recharge.circle && recharge.circle !== 'NA' && (
                                                                                <span><span className="font-medium">Circle:</span> {recharge.circle}</span>
                                                                            )}
                                                                            <span><span className="font-medium">Type:</span> <span className="capitalize">{recharge.rechargeType || 'Prepaid'}</span></span>
                                                                            {recharge.discountAmount > 0 && (
                                                                                <span className="text-emerald-600"><span className="font-medium">Cashback:</span> ₹{recharge.discountAmount.toFixed(2)}</span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    {isFailed && (recharge.failureReason || recharge.aiTopUpMessage) && (
                                                                        <div className="mt-2 text-[10px] sm:text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                                                                            ⚠️ {recharge.failureReason || recharge.aiTopUpMessage}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex-shrink-0 text-left sm:text-right">
                                                                <div className="text-[10px] sm:text-xs text-gray-500 mb-1">
                                                                    {new Date(recharge.date || recharge.rechargeCompletedAt || recharge.paymentCompletedAt || recharge.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                                </div>
                                                                <div className="text-[10px] sm:text-xs text-gray-400">
                                                                    {new Date(recharge.date || recharge.rechargeCompletedAt || recharge.paymentCompletedAt || recharge.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                                {recharge.aiTopUpOrderId && (
                                                                    <div className="mt-1.5 text-[9px] sm:text-xs text-gray-400 font-mono truncate max-w-[80px] sm:max-w-none" title={recharge.aiTopUpOrderId}>
                                                                        {recharge.aiTopUpOrderId.slice(0, 8)}...
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Pagination for Recharge History */}
                            {(() => {
                                const allRecharges = getAllRechargeTransactions();
                                const totalPages = Math.ceil(allRecharges.length / 10);
                                return (
                                    <PaginationComponent
                                        currentPage={rechargePage}
                                        totalPages={totalPages || 1}
                                        onPageChange={(page) => {
                                            setRechargePage(page);
                                            // Also fetch new history page if needed
                                            if (page <= rechargeTotalPages) {
                                                fetchRechargeHistory(page);
                                            }
                                        }}
                                        colorClass="orange"
                                    />
                                );
                            })()}
                        </>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-green-50/80 border-l-4 border-green-500 rounded-xl p-4 shadow">
                                    <div className="flex items-center gap-3">
                                        <ArrowDownCircle className="text-green-500" size={32} />
                                        <div>
                                            <div className="text-xs text-green-700 font-semibold flex items-center gap-1"><IndianRupee size={16} /> Total Requests</div>
                                            <div className="text-2xl font-extrabold text-green-700">{payoutHistory.filter(p => p.status !== 'rejected').length}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50/80 border-l-4 border-blue-500 rounded-xl p-4 shadow">
                                    <div className="flex items-center gap-3">
                                        <ArrowUpCircle className="text-blue-500" size={32} />
                                        <div>
                                            <div className="text-xs text-blue-700 font-semibold flex items-center gap-1"><IndianRupee size={16} /> Total Requested</div>
                                            <div className="text-2xl font-extrabold text-blue-700">₹{payoutHistory.filter(p => p.status !== 'rejected').reduce((sum, payout) => sum + payout.amount, 0).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-purple-50/80 border-l-4 border-purple-500 rounded-xl p-4 shadow">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="text-purple-500" size={32} />
                                        <div>
                                            <div className="text-xs text-purple-700 font-semibold flex items-center gap-1"><IndianRupee size={16} /> Net Received</div>
                                            <div className="text-2xl font-extrabold text-purple-700 ">₹{payoutHistory.filter(p => p.status === 'approved' || p.status === 'completed').reduce((sum, payout) => sum + (payout.netAmount || payout.amount * 0.88), 0).toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/80 rounded-xl shadow border border-green-100 p-4">
                                {payoutHistory.length === 0 ? (
                                    <div className="text-center py-8">
                                        <ArrowDownCircle className="text-gray-400 mx-auto mb-4" size={48} />
                                        <p className="text-gray-500 text-lg">No payout requests yet</p>
                                        <p className="text-gray-400 text-sm mt-2">Your withdrawal requests will appear here</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {payoutHistory.map((payout) => (
                                            <div key={payout._id} className={`rounded-lg p-4 border ${getTransactionTypeBg('withdrawal')}`}>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        {getTransactionTypeIcon('withdrawal')}
                                                        <div>
                                                            <div className={`font-semibold text-lg ${getTransactionTypeColor('withdrawal')}`}>
                                                                ₹{payout.amount.toLocaleString()}
                                                            </div>
                                                            <div className="text-sm text-gray-600">Withdrawal Request</div>
                                                            {/* Status-specific helper line */}
                                                            <div className={`text-xs font-semibold mt-1 ${payout.status === 'rejected'
                                                                ? 'text-red-600'
                                                                : payout.status === 'pending'
                                                                    ? 'text-yellow-600'
                                                                    : payout.status === 'approved'
                                                                        ? 'text-blue-600'
                                                                        : 'text-green-600'
                                                                }`}>
                                                                {payout.status === 'rejected' && '❌ Rejected by Admin'}
                                                                {payout.status === 'pending' && '⏳ Pending Review'}
                                                                {payout.status === 'approved' && '✅ Approved - Processing'}
                                                                {payout.status === 'completed' && '✅ Completed - Paid'}
                                                            </div>
                                                            <div className="text-xs text-gray-500">Requested on {formatDate(payout.requestDate)}</div>
                                                            {payout.paymentMethod && (
                                                                <div className="text-xs text-gray-500">Method: {payout.paymentMethod}</div>
                                                            )}
                                                            {payout.accountNumber && (
                                                                <div className="text-xs text-gray-500">Account: {payout.accountNumber}</div>
                                                            )}
                                                            {payout.ifscCode && (
                                                                <div className="text-xs text-gray-500">IFSC: {payout.ifscCode}</div>
                                                            )}
                                                            {payout.upiId && (
                                                                <div className="text-xs text-gray-500">UPI: {payout.upiId}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm text-gray-600">{formatDateTime(payout.requestDate)}</div>
                                                        <div className={`inline-block text-xs font-semibold mt-1 px-2 py-1 rounded-full whitespace-nowrap ${getStatusColor(payout.status)}`}>
                                                            {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Pagination for Payout History */}
                            <PaginationComponent
                                currentPage={payoutPage}
                                totalPages={payoutTotalPages}
                                onPageChange={fetchPayoutHistory}
                                colorClass="green"
                            />
                        </>
                    )}
                </div>
                {/* Glassmorphism effect */}
                <div className="absolute inset-0 pointer-events-none rounded-3xl bg-gradient-to-br from-blue-100/30 via-white/10 to-green-100/30 blur-xl opacity-60 z-0" />
            </div>
        </div>
    );
};

export default WalletTransactions;