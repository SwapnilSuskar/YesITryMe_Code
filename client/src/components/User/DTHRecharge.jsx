import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Tv, Building, IndianRupee, ArrowLeft, Headphones, Loader2, Shield, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getWalletBalance } from '../../services/rechargeService';
import useToast from '../../hooks/useToast';
import { useAuthStore } from '../../store/useAuthStore';
import api, { API_ENDPOINTS } from '../../config/api';

// DTH Operators in India
const dthOperators = [
    { name: 'Tata Play', value: 'Tata Play', code: 'TATASKY', apiCode: 'TATASKY' },
    { name: 'Dish TV', value: 'Dish TV', code: 'DISHTV', apiCode: 'DISHTV' },
    { name: 'Airtel Digital TV', value: 'Airtel Digital TV', code: 'AIRTEL', apiCode: 'AIRTEL' },
    { name: 'Videocon d2h', value: 'Videocon d2h', code: 'D2H', apiCode: 'D2H' },
    { name: 'Sun Direct', value: 'Sun Direct', code: 'SUN', apiCode: 'SUN' },
];

const operatorDiscountRates = {
    'Tata Play': 2.0,
    'Dish TV': 2.0,
    'Airtel Digital TV': 2.0,
    'Videocon d2h': 2.0,
    'Sun Direct': 2.0,
};

const DTHRecharge = () => {
    const navigate = useNavigate();
    const { showError } = useToast();
    const { user } = useAuthStore();
    const [subscriberId, setSubscriberId] = useState('');
    const [operator, setOperator] = useState('');
    const [amount, setAmount] = useState('');
    const [touched, setTouched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedOperatorData, setSelectedOperatorData] = useState(null);
    const [kycStatus, setKycStatus] = useState(null);
    const [checkingKyc, setCheckingKyc] = useState(true);
    const [walletBalance, setWalletBalance] = useState(null);
    const [isActiveMember, setIsActiveMember] = useState(user?.status === 'active');
    const isFetchingBalanceRef = useRef(false);

    // DTH Subscriber ID validation: varies by operator but generally 10-12 digits
    const isSubscriberIdValid = useMemo(() => {
        if (!subscriberId) return false;
        // Most DTH operators use 10-12 digit subscriber IDs
        return /^\d{10,12}$/.test(subscriberId);
    }, [subscriberId]);

    const canShowAmount = useMemo(() => {
        return isSubscriberIdValid && operator;
    }, [isSubscriberIdValid, operator]);

    const discountDetails = useMemo(() => {
        const numericAmount = parseFloat(amount);
        if (!operator || !numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
            return {
                amount: 0,
                percentage: 0,
                net: 0,
            };
        }

        if (!isActiveMember) {
            return {
                amount: 0,
                percentage: 0,
                net: Math.round(numericAmount * 100) / 100,
            };
        }

        const rate = operatorDiscountRates[operator] ?? 0;
        const rawDiscount = (numericAmount * rate) / 100;
        const discountAmount = Math.round(rawDiscount * 100) / 100;
        const netAmount = Math.max(Math.round((numericAmount - discountAmount) * 100) / 100, 0);

        return {
            amount: discountAmount,
            percentage: rate,
            net: netAmount,
        };
    }, [operator, amount, isActiveMember]);

    useEffect(() => {
        if (!canShowAmount) {
            setAmount('');
        }
    }, [canShowAmount]);

    // Handle operator selection
    useEffect(() => {
        const operatorData = dthOperators.find(op => op.value === operator);
        setSelectedOperatorData(operatorData || null);
    }, [operator]);

    const operatorWrapperClass = useMemo(() => {
        if (selectedOperatorData) {
            return 'border-purple-200 bg-purple-50/40';
        }
        return 'border-gray-200 bg-white';
    }, [selectedOperatorData]);

    const operatorTextClass = useMemo(() => {
        return selectedOperatorData ? 'text-purple-700' : 'text-gray-700';
    }, [selectedOperatorData]);

    const operatorIconClass = useMemo(() => {
        return selectedOperatorData ? 'text-purple-500' : 'text-gray-400';
    }, [selectedOperatorData]);

    // Check KYC status
    const checkKycStatus = useCallback(async () => {
        if (!user) {
            setCheckingKyc(false);
            return;
        }

        try {
            const response = await api.get(API_ENDPOINTS.kyc.status);
            if (response.data.success && response.data.data) {
                setKycStatus(response.data.data);
            } else {
                if (user?.kycApprovedDate) {
                    setKycStatus({ status: 'approved' });
                } else {
                    setKycStatus(null);
                }
            }
        } catch (error) {
            if (user?.kycApprovedDate) {
                setKycStatus({ status: 'approved' });
            } else {
                setKycStatus(null);
            }
        } finally {
            setCheckingKyc(false);
        }
    }, [user]);

    useEffect(() => {
        checkKycStatus();
    }, [checkKycStatus]);

    // Fetch smart wallet balance
    const fetchWalletBalance = useCallback(async () => {
        if (!user || isFetchingBalanceRef.current) return;

        isFetchingBalanceRef.current = true;
        try {
            const response = await getWalletBalance();
            if (response.success) {
                setWalletBalance(response.smartWalletBalance ?? response.balance ?? 0);
                if (typeof response.isActiveMember === 'boolean') {
                    setIsActiveMember(response.isActiveMember);
                }
            }
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
            setWalletBalance(null);
        } finally {
            isFetchingBalanceRef.current = false;
        }
    }, [user]);

    useEffect(() => {
        fetchWalletBalance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleFocus = () => {
            fetchWalletBalance();
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [fetchWalletBalance]);

    const navigateToPlanConfirmation = (manualAmount = null) => {
        const planAmount = parseFloat(manualAmount ?? amount ?? '0') || 0;

        const baseRate = operatorDiscountRates[operator] ?? 0;
        const effectiveRate = isActiveMember ? baseRate : 0;
        const computedDiscountAmount = Math.round(((planAmount * effectiveRate) / 100) * 100) / 100;
        const derivedNetAmount = Math.max(Math.round((planAmount - computedDiscountAmount) * 100) / 100, 0);

        const planPayload = {
            amount: planAmount,
            price: planAmount,
            rechargeAmount: planAmount,
            description: `DTH recharge of ₹${planAmount.toFixed(2)}`,
            name: `${operator || 'DTH'} – Custom`,
            planId: 'manual-entry',
            validity: '',
            benefits: '',
        };

        const discountPayload = isActiveMember
            ? {
                amount: computedDiscountAmount,
                percentage: effectiveRate,
                net: derivedNetAmount,
            }
            : {
                amount: 0,
                percentage: 0,
                net: planAmount,
            };

        navigate('/recharge/plan-confirmation', {
            state: {
                plan: planPayload,
                formData: {
                    subscriberId,
                    mobileNumber: subscriberId, // For backend compatibility
                    operator,
                    rechargeMode: 'dth',
                    rechargeType: 'dth',
                    amount: planAmount,
                    isActiveMember,
                    discountDetails: discountPayload,
                },
            },
        });
    };

    // Handle proceed to confirmation
    const handleContinueToConfirmation = async () => {
        // Check KYC verification before allowing payment
        const isKycVerified = kycStatus?.status === 'approved' || user?.kycApprovedDate;

        if (!isKycVerified) {
            showError('KYC verification required! Please complete your KYC verification to proceed with DTH recharge.');
            setTimeout(() => {
                navigate('/kyc');
            }, 1500);
            return;
        }

        // Frontend validation: Subscriber ID
        if (!isSubscriberIdValid) {
            showError('Please enter a valid DTH subscriber ID (10-12 digits).');
            return;
        }

        // Frontend validation: Operator
        if (!operator) {
            showError('Please select a DTH operator before proceeding.');
            return;
        }

        const rechargeAmount = parseFloat(amount);

        // Frontend validation: Amount
        if (!amount || rechargeAmount <= 0 || isNaN(rechargeAmount)) {
            showError('Please enter a valid recharge amount.');
            return;
        }

        // Frontend validation: Minimum amount (₹10)
        const MINIMUM_RECHARGE_AMOUNT = 10;
        if (rechargeAmount < MINIMUM_RECHARGE_AMOUNT) {
            showError(`Minimum recharge amount is ₹${MINIMUM_RECHARGE_AMOUNT}. Please enter a valid amount.`);
            return;
        }

        setLoading(true);
        try {
            navigateToPlanConfirmation(rechargeAmount);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 pt-24 pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <button onClick={() => navigate('/recharge')} className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600">
                    <ArrowLeft className="w-4 h-4" /> Back to Recharge
                </button>
                <div className="overflow-hidden rounded-2xl shadow-xl border border-purple-100 bg-white/80 backdrop-blur-md">
                    {/* Gradient Header */}
                    <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 p-4 sm:p-5 md:p-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow flex-shrink-0">
                                <Tv className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-white text-base sm:text-lg md:text-xl font-extrabold tracking-wide truncate">DTH Recharge</h1>
                                <p className="text-white/90 text-[11px] sm:text-xs md:text-sm truncate">Recharge your DTH connection instantly</p>
                            </div>
                            <div className="flex-shrink-0 ml-2">
                                <Link
                                    to="/contact"
                                    className="inline-flex items-center justify-center gap-1 text-[10px] sm:text-[11px] md:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition whitespace-nowrap"
                                >
                                    <Headphones className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                    <span className="hidden sm:inline">Contact Us</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="p-5 sm:p-6 space-y-4">
                        {/* KYC Verification Banner */}
                        {checkingKyc ? (
                            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                    <span className="text-sm text-blue-700">Verifying KYC status...</span>
                                </div>
                            </div>
                        ) : (!kycStatus || kycStatus.status !== 'approved') && !user?.kycApprovedDate ? (
                            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800">KYC Verification Required</p>
                                        <p className="text-xs text-gray-600 mt-0.5">Complete KYC to proceed with DTH recharge</p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/kyc')}
                                        className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                    >
                                        Verify Now
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        {/* Trust strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50/60 px-3 py-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-green-600 font-bold">✓</span>
                                <span className="text-[12px] font-semibold text-green-700">Secure Payments</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-blue-600 font-bold">⚡</span>
                                <span className="text-[12px] font-semibold text-blue-700">Instant Confirmation</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-amber-600 font-bold">↺</span>
                                <span className="text-[12px] font-semibold text-amber-700">Auto‑Refund on Failure</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-purple-100 bg-purple-50/60 px-3 py-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-purple-600">
                                    <Headphones className="w-3.5 h-3.5" />
                                </span>
                                <span className="text-[12px] font-semibold text-purple-700">24/7 Support</span>
                            </div>
                        </div>

                        {/* Subscriber ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">DTH Subscriber ID / VC Number</label>
                            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition shadow-sm ${touched && !isSubscriberIdValid ? 'border-red-300 bg-red-50/40' : 'border-gray-200 bg-white focus-within:ring-2 focus-within:ring-purple-500/40'}`}>
                                <Tv className="w-4 h-4 text-gray-400" />
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={12}
                                    value={subscriberId}
                                    onChange={(e) => setSubscriberId(e.target.value.replace(/\D/g, '').slice(0, 12))}
                                    onBlur={() => setTouched(true)}
                                    placeholder="Enter 10-12 digit subscriber ID"
                                    className="w-full outline-none text-sm placeholder:text-gray-400"
                                    aria-invalid={touched && !isSubscriberIdValid}
                                />
                            </div>
                            {touched && !isSubscriberIdValid && (
                                <p className="mt-1 text-xs text-red-600">Subscriber ID must be 10-12 digits.</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">Enter your DTH subscriber ID or VC number (usually found on your set-top box or bill)</p>
                        </div>

                        {/* Operator */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">DTH Operator</label>
                            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm transition focus-within:ring-2 focus-within:ring-purple-500/40 ${operatorWrapperClass}`}>
                                <Building className={`w-4 h-4 ${operatorIconClass}`} />
                                <select
                                    value={operator}
                                    onChange={(e) => setOperator(e.target.value)}
                                    className={`w-full outline-none text-sm bg-transparent font-medium ${operatorTextClass}`}
                                >
                                    <option value="" className="text-gray-500">
                                        Select DTH operator
                                    </option>
                                    {dthOperators.map(op => (
                                        <option key={op.value} value={op.value}>
                                            {op.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {selectedOperatorData && (
                                <p className="mt-1 text-xs text-gray-500">
                                    Selected:{' '}
                                    <span className={`font-semibold ${operatorTextClass}`}>
                                        {selectedOperatorData.name}
                                    </span>
                                </p>
                            )}
                        </div>

                        {/* Amount */}
                        {canShowAmount && (
                            <div className="space-y-3">
                                <div className="w-full">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Recharge Amount</label>
                                    <div className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-purple-500/40">
                                        <IndianRupee className="w-5 h-5 text-gray-400" />
                                        <input
                                            type="number"
                                            min="1"
                                            value={amount}
                                            onChange={(e) => {
                                                const newValue = e.target.value;
                                                setAmount(newValue);
                                            }}
                                            placeholder="Enter recharge amount"
                                            className="w-full outline-none text-sm placeholder:text-gray-400 bg-transparent"
                                        />
                                    </div>
                                    {discountDetails.amount > 0 && (
                                        <div className="mt-2 p-2 rounded-lg bg-green-50 border border-green-200">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-700">Discount ({discountDetails.percentage}%):</span>
                                                <span className="font-semibold text-green-600">-₹{discountDetails.amount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm mt-1">
                                                <span className="font-semibold text-gray-800">Amount to Pay:</span>
                                                <span className="font-bold text-purple-600">₹{discountDetails.net.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Wallet Balance Display */}
                        {walletBalance !== null && (
                            <div className="mt-4 p-3 rounded-xl border border-blue-200 bg-blue-50/50">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">YesITryMe Smart Wallet:</span>
                                    <span className={`text-sm font-bold ${walletBalance < (discountDetails.net || 0) ? 'text-red-600' : 'text-green-600'}`}>
                                        ₹{walletBalance.toFixed(2)}
                                    </span>
                                </div>
                                {walletBalance < (discountDetails.net || 0) && amount && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>Insufficient balance. Please add money to your wallet.</span>
                                    </div>
                                )}
                            </div>
                        )}
                        {!isActiveMember && (
                            <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-800">
                                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-amber-900">Cashback reserved for active members</p>
                                    <p>Purchase any Package or Super Package to unlock the % cashback on DTH recharges. Free users still skip the platform fee, so you only pay the plan amount.</p>
                                </div>
                            </div>
                        )}

                        {/* Payment option */}
                        {canShowAmount && amount && parseFloat(amount) > 0 && (
                            <div className="mt-4">
                                <p className="text-sm text-gray-600 mb-1">Review your DTH recharge</p>
                                <p className="text-[11px] text-gray-500 mb-3">You can confirm payment on the next screen.</p>
                                <button
                                    onClick={handleContinueToConfirmation}
                                    disabled={loading}
                                    className="px-4 py-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-sm font-semibold flex items-center justify-center gap-2 transition w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
                                            <span className="text-emerald-700">Preparing summary...</span>
                                        </>
                                    ) : (
                                        <span className="text-emerald-800">Review Details & Continue</span>
                                    )}
                                </button>
                                <p className="mt-2 text-[11px] text-gray-500">You can confirm or cancel the recharge on the next page.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DTHRecharge;

