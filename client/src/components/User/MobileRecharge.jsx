import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Smartphone, Building, Globe2, IndianRupee, ArrowLeft, Headphones, Loader2, Shield, Receipt, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getWalletBalance } from '../../services/rechargeService';
import useToast from '../../hooks/useToast';
import { useAuthStore } from '../../store/useAuthStore';
import api, { API_ENDPOINTS } from '../../config/api';

// Operators grouped by type
const prepaidOperators = [
	{ name: 'Airtel', value: 'Airtel' },
	{ name: 'Vodafone', value: 'Vodafone' },
	{ name: 'BSNL TOPUP', value: 'BSNL TOPUP' },
	{ name: 'RELIANCE JIO', value: 'RELIANCE JIO' },
	{ name: 'Idea', value: 'Idea' },
	{ name: 'BSNL STV', value: 'BSNL STV' },
];

const postpaidOperators = [
	{ name: 'Airtel Postpaid', value: 'Airtel Postpaid' },
	{ name: 'Idea Postpaid', value: 'Idea Postpaid' },
	{ name: 'Vodafone Postpaid', value: 'Vodafone Postpaid' },
	{ name: 'JIO PostPaid', value: 'JIO PostPaid' },
	{ name: 'BSNL Postpaid', value: 'BSNL Postpaid' },
];

const normalizeCircleToken = (input) => {
	if (input === undefined || input === null) return '';
	return input
		.toString()
		.trim()
		.toLowerCase()
		.replace(/&/g, 'and')
		.replace(/[^a-z0-9]/g, '');
};

// Circle options matching real-world A1Topup API circle names
// Values are normalized to match backend CIRCLE_CODE_MAP keys
const CIRCLE_OPTIONS = [
	{ label: 'Andhra Pradesh', value: 'Andhra Pradesh', textCode: 'AP', numericCode: '13', aliases: ['AP', '13'] },
	{ label: 'Assam', value: 'Assam', textCode: 'AS', numericCode: '24', aliases: ['AS', '24'] },
	{ label: 'Bihar & Jharkhand', value: 'Bihar & Jharkhand', textCode: 'BH', numericCode: '17', aliases: ['Bihar', 'Jharkhand', 'BH', '17'] },
	{ label: 'Chennai', value: 'Chennai', textCode: 'CH', numericCode: '7', aliases: ['CH', '7'] },
	{ label: 'Delhi NCR', value: 'Delhi NCR', textCode: 'DL', numericCode: '5', aliases: ['Delhi', 'NCR', 'DL', '5'] },
	{ label: 'Goa', value: 'Goa', textCode: 'GA', numericCode: '15', aliases: ['GA', '15'] },
	{ label: 'Gujarat', value: 'Gujarat', textCode: 'GJ', numericCode: '12', aliases: ['GJ', '12'] },
	{ label: 'Haryana', value: 'Haryana', textCode: 'HR', numericCode: '20', aliases: ['HR', '20'] },
	{ label: 'Himachal Pradesh', value: 'Himachal Pradesh', textCode: 'HP', numericCode: '21', aliases: ['HP', '21'] },
	{ label: 'Jammu & Kashmir', value: 'Jammu & Kashmir', textCode: 'JK', numericCode: '25', aliases: ['Jammu', 'Kashmir', 'JK', '25'] },
	{ label: 'Karnataka', value: 'Karnataka', textCode: 'KA', numericCode: '9', aliases: ['KA', '9'] },
	{ label: 'Kerala', value: 'Kerala', textCode: 'KL', numericCode: '14', aliases: ['KL', '14'] },
	{ label: 'Kolkata', value: 'Kolkata', textCode: 'KO', numericCode: '6', aliases: ['KO', '6'] },
	{ label: 'Madhya Pradesh & Chhattisgarh', value: 'Madhya Pradesh & Chhattisgarh', textCode: 'MP', numericCode: '16', aliases: ['Madhya Pradesh', 'Chhattisgarh', 'MP', '16'] },
	{ label: 'Maharashtra', value: 'Maharashtra', textCode: 'MH', numericCode: '4', aliases: ['MH', '4'] },
	{ label: 'Mumbai', value: 'Mumbai', textCode: 'MB', numericCode: '3', aliases: ['MB', '3'] },
	{ label: 'North East', value: 'North East', textCode: 'NE', numericCode: '26', aliases: ['NE', '26'] },
	{ label: 'Odisha', value: 'Odisha', textCode: 'OR', numericCode: '23', aliases: ['Orissa', 'OR', '23'] },
	{ label: 'Punjab', value: 'Punjab', textCode: 'PB', numericCode: '1', aliases: ['PB', '1'] },
	{ label: 'Rajasthan', value: 'Rajasthan', textCode: 'RJ', numericCode: '18', aliases: ['RJ', '18'] },
	{ label: 'Tamil Nadu', value: 'Tamil Nadu', textCode: 'TN', numericCode: '8', aliases: ['TN', '8'] },
	{ label: 'Telangana', value: 'Telangana', textCode: 'TS', numericCode: '28', aliases: ['TS', '28'] },
	{ label: 'Uttar Pradesh East', value: 'Uttar Pradesh East', textCode: 'UPE', numericCode: '10', aliases: ['UP East', 'UPE', '10'] },
	{ label: 'Uttar Pradesh West', value: 'Uttar Pradesh West', textCode: 'UPW', numericCode: '11', aliases: ['UP West', 'UPW', '11'] },
	{ label: 'Uttarakhand', value: 'Uttarakhand', textCode: 'UK', numericCode: '19', aliases: ['UK', '19'] },
	{ label: 'West Bengal', value: 'West Bengal', textCode: 'WB', numericCode: '2', aliases: ['WB', '2'] },
];

const CIRCLE_OPTION_LOOKUP = (() => {
	const map = new Map();
	CIRCLE_OPTIONS.forEach((option) => {
		const tokens = new Set([
			option.value,
			option.label,
			option.textCode,
			option.numericCode,
			...(option.aliases || []),
		]);

		tokens.forEach((token) => {
			const key = normalizeCircleToken(token);
			if (key && !map.has(key)) {
				map.set(key, option);
			}
		});
	});
	return map;
})();

const formatCircleLabel = (input) => {
	if (!input && input !== 0) return '';
	const option = CIRCLE_OPTION_LOOKUP.get(normalizeCircleToken(input));
	if (option) return option.label;
	return input
		.toString()
		.replace(/_/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase()
		.replace(/\b\w/g, (char) => char.toUpperCase());
};

const operatorDiscountRates = {
	Airtel: 0.5,
	Vodafone: 1.0,
	'BSNL TOPUP': 1.0,
	'BSNL STV': 1.0,
	Idea: 1.0,
	'RELIANCE JIO': 0,
	'Airtel Postpaid': 0.5,
	'Vodafone Postpaid': 1.0,
	'Idea Postpaid': 1.0,
	'JIO PostPaid': 0,
	'BSNL Postpaid': 1.0,
};

const MobileRecharge = () => {
	const navigate = useNavigate();
	const { showError } = useToast();
	const { user } = useAuthStore();
	const [mobile, setMobile] = useState('');
	const [rechargeMode, setRechargeMode] = useState('prepaid');
	const [operator, setOperator] = useState('');
	const [circle, setCircle] = useState('');
	const [amount, setAmount] = useState('');
	const [touched, setTouched] = useState(false);
	const [loading, setLoading] = useState(false);
	const [selectedOperatorData, setSelectedOperatorData] = useState(null);
	const [kycStatus, setKycStatus] = useState(null);
	const [checkingKyc, setCheckingKyc] = useState(true);
	const [walletBalance, setWalletBalance] = useState(null);
	const isFetchingBalanceRef = useRef(false); // Prevent multiple simultaneous balance fetches

	const findCircleOption = useCallback((input) => {
		if (input === undefined || input === null) return null;
		const key = normalizeCircleToken(input);
		if (!key) return null;
		return CIRCLE_OPTION_LOOKUP.get(key) || null;
	}, []);

	const getCircleLabel = useCallback(
		(input) => {
			if (input === undefined || input === null) return '';
			const option = findCircleOption(input);
			return option ? option.label : formatCircleLabel(input);
		},
		[findCircleOption]
	);

	const getCircleValue = useCallback(
		(input) => {
			if (input === undefined || input === null) return '';
			const option = findCircleOption(input);
			if (option) return option.value;
			return input.toString().trim();
		},
		[findCircleOption]
	);

	const resolveCirclePayload = useCallback(() => {
		if (circle === undefined || circle === null || circle === '') {
			return null;
		}
		const option = findCircleOption(circle);
		if (option) {
			return {
				label: option.label,
				value: option.value,
				textCode: option.textCode,
				numericCode: option.numericCode,
				aliases: option.aliases || [],
			};
		}
		const fallbackValue = getCircleValue(circle);
		return {
			label: getCircleLabel(circle),
			value: fallbackValue || undefined,
		};
	}, [circle, findCircleOption, getCircleLabel, getCircleValue]);

	const availableOperators = useMemo(
		() => (rechargeMode === 'postpaid' ? postpaidOperators : prepaidOperators),
		[rechargeMode]
	);

	const rechargeType = useMemo(() => {
		if (operator && operator.toLowerCase().includes('postpaid')) {
			return 'postpaid';
		}
		return rechargeMode;
	}, [operator, rechargeMode]);

	const handleModeChange = useCallback(
		(mode) => {
			if (mode === rechargeMode) return;
			setRechargeMode(mode);
			setOperator('');
			setSelectedOperatorData(null);
			setCircle('');
			setAmount('');
			setTouched(false);
		},
		[rechargeMode]
	);

	// India mobile validation: must be 10 digits and start with 6-9
	const isMobileValid = useMemo(() => /^[6-9]\d{9}$/.test(mobile), [mobile]);
	const canShowAmount = useMemo(() => {
		if (!isMobileValid || !operator) return false;
		if (rechargeType === 'postpaid') {
			return true;
		}
		// For prepaid, require circle to be selected
		return Boolean(circle);
	}, [isMobileValid, operator, circle, rechargeType]);

	const discountDetails = useMemo(() => {
		const numericAmount = parseFloat(amount);
		if (!operator || !numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
			return {
				amount: 0,
				percentage: 0,
				net: 0,
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
	}, [operator, amount]);

	useEffect(() => {
		if (!canShowAmount) {
			setAmount('');
		}
	}, [canShowAmount]);

	// Handle operator selection and update styling
	useEffect(() => {
		const allOperators = [...prepaidOperators, ...postpaidOperators];
		const operatorData = allOperators.find(op => op.value === operator);
		setSelectedOperatorData(operatorData || null);
	}, [operator]);

	useEffect(() => {
		if (rechargeType === 'postpaid') {
			setAmount('');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mobile, operator, rechargeType]);


	const operatorWrapperClass = useMemo(() => {
		if (selectedOperatorData) {
			const custom = `${selectedOperatorData.border ?? ''} ${selectedOperatorData.bg ?? ''}`.trim();
			if (custom) {
				return custom;
			}
		}
		return rechargeType === 'postpaid'
			? 'border-blue-200 bg-blue-50/40'
			: 'border-gray-200 bg-white';
	}, [selectedOperatorData, rechargeType]);

	const operatorTextClass = useMemo(() => {
		if (selectedOperatorData?.color) {
			return selectedOperatorData.color;
		}
		return rechargeType === 'postpaid' ? 'text-blue-700' : 'text-gray-700';
	}, [selectedOperatorData, rechargeType]);

	const operatorIconClass = useMemo(() => {
		if (selectedOperatorData?.color) {
			return selectedOperatorData.color;
		}
		return rechargeType === 'postpaid' ? 'text-blue-500' : 'text-gray-400';
	}, [selectedOperatorData, rechargeType]);

	const operatorFocusRingClass = useMemo(
		() => (rechargeType === 'postpaid' ? 'focus-within:ring-blue-500/40' : 'focus-within:ring-orange-500/40'),
		[rechargeType]
	);

	const circleFocusRingClass = useMemo(
		() => (rechargeType === 'postpaid' ? 'focus-within:ring-blue-500/40' : 'focus-within:ring-orange-500/40'),
		[rechargeType]
	);

	const handleOperatorSelect = useCallback(
		(value) => {
			setOperator(value);
			if (value) {
				const normalized = value.toLowerCase();
				setRechargeMode(normalized.includes('postpaid') ? 'postpaid' : 'prepaid');
			}
		},
		[]
	);


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

	// Fetch smart wallet balance (for recharge) - only once on mount
	const fetchWalletBalance = useCallback(async () => {
		if (!user || isFetchingBalanceRef.current) return;

		isFetchingBalanceRef.current = true;
		try {
			const response = await getWalletBalance();
			if (response.success) {
				// Use smartWalletBalance for recharge (added money only, not mixed with active/passive income)
				setWalletBalance(response.smartWalletBalance ?? response.balance ?? 0);
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
	}, []); // Only run once on mount

	const navigateToPlanConfirmation = (selectedPlan = null, manualAmount = null) => {
		const planAmount = selectedPlan
			? parseFloat(selectedPlan?.amount ?? selectedPlan?.price ?? selectedPlan?.rechargeAmount ?? '0') || 0
			: parseFloat(manualAmount ?? amount ?? '0') || 0;

		const circleInfo = resolveCirclePayload();
		const discountRate = operatorDiscountRates[operator] ?? 0;
		const discountAmount =
			selectedPlan?.discountDetails?.amount ?? Math.round(((planAmount * discountRate) / 100) * 100) / 100;
		const netAmount =
			selectedPlan?.discountDetails?.net ?? Math.max(Math.round((planAmount - discountAmount) * 100) / 100, 0);

		const planPayload = selectedPlan
			? selectedPlan
			: {
				amount: planAmount,
				price: planAmount,
				rechargeAmount: planAmount,
				description: `Custom recharge of ₹${planAmount.toFixed(2)}`,
				name: `${operator || 'Plan'} – Custom`,
				planId: 'manual-entry',
				validity: '',
				benefits: '',
			};

		const discountPayload = selectedPlan?.discountDetails ?? {
			amount: discountAmount,
			percentage: selectedPlan?.discountDetails?.percentage ?? discountRate,
			net: netAmount,
		};

		navigate('/recharge/plan-confirmation', {
			state: {
				plan: planPayload,
				formData: {
					mobileNumber: mobile,
					operator,
					rechargeMode,
					rechargeType,
					circle,
					circleInfo,
					amount: planAmount,
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
			showError('KYC verification required! Please complete your KYC verification to proceed with mobile recharge.');
			setTimeout(() => {
				navigate('/kyc');
			}, 1500);
			return;
		}

		// Frontend validation: Mobile number
		if (!isMobileValid) {
			showError('Please enter a valid 10-digit mobile number starting with 6-9.');
			return;
		}

		// Frontend validation: Operator
		if (!operator) {
			showError('Please select an operator before proceeding.');
			return;
		}

		// Frontend validation: Circle (for prepaid)
		if (rechargeType === 'prepaid') {
			if (!circle) {
				showError('Please select a circle before proceeding.');
				return;
			}

			const circleInfo = resolveCirclePayload();
			// Warn if numeric code is not available (backend will still try, but may fail)
			if (circleInfo && !circleInfo.numericCode) {
				console.warn('Circle numeric code not found, backend will attempt to map');
			}
		}

		const rechargeAmount = parseFloat(amount);

		// Frontend validation: Amount
		if (!amount || rechargeAmount <= 0 || isNaN(rechargeAmount)) {
			showError('Please enter a valid recharge amount.');
			return;
		}

		// Frontend validation: Minimum amount (₹10) as per A1Topup API
		const MINIMUM_RECHARGE_AMOUNT = 10;
		if (rechargeAmount < MINIMUM_RECHARGE_AMOUNT) {
			showError(`Minimum recharge amount is ₹${MINIMUM_RECHARGE_AMOUNT}. Please enter a valid amount.`);
			return;
		}

		setLoading(true);
		try {
			navigateToPlanConfirmation(null, rechargeAmount);
		} finally {
			setLoading(false);
		}
	};


	return (
		<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-24 pb-12">
			<div className="max-w-4xl mx-auto px-4 sm:px-6">
				<button onClick={() => navigate('/recharge')} className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600">
					<ArrowLeft className="w-4 h-4" /> Back to Recharge
				</button>
				<div className="overflow-hidden rounded-2xl shadow-xl border border-orange-100 bg-white/80 backdrop-blur-md">
					{/* Gradient Header */}
					<div className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 p-4 sm:p-5 md:p-6">
						<div className="flex items-center gap-2 sm:gap-3">
							<div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow flex-shrink-0">
								<Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
							</div>
							<div className="min-w-0 flex-1">
								<h1 className="text-white text-base sm:text-lg md:text-xl font-extrabold tracking-wide truncate">Mobile Recharge</h1>
								<p className="text-white/90 text-[11px] sm:text-xs md:text-sm truncate">Fast, secure and seamless recharges</p>
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
										<p className="text-xs text-gray-600 mt-0.5">Complete KYC to proceed with recharge</p>
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

						{/* Recharge Type Toggle */}
						<div>
							<span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Recharge Type</span>
							<div className="mt-2 grid grid-cols-2 gap-2 sm:gap-3">
								<button
									type="button"
									onClick={() => handleModeChange('prepaid')}
									className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${rechargeMode === 'prepaid'
										? 'border-orange-400 bg-orange-50 text-orange-700 shadow-sm'
										: 'border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50/50'
										}`}
								>
									<Smartphone className={`w-4 h-4 ${rechargeMode === 'prepaid' ? 'text-orange-600' : 'text-gray-400'}`} />
									<span>Prepaid Recharge</span>
								</button>
								<button
									type="button"
									onClick={() => handleModeChange('postpaid')}
									className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${rechargeMode === 'postpaid'
										? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm'
										: 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50/50'
										}`}
								>
									<Receipt className={`w-4 h-4 ${rechargeMode === 'postpaid' ? 'text-blue-600' : 'text-gray-400'}`} />
									<span>Postpaid Bill</span>
								</button>
							</div>
						</div>

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
						{/* Mobile */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
							<div className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition shadow-sm ${touched && !isMobileValid ? 'border-red-300 bg-red-50/40' : 'border-gray-200 bg-white focus-within:ring-2 focus-within:ring-orange-500/40'}`}>
								<Smartphone className="w-4 h-4 text-gray-400" />
								<span className="text-gray-700 text-sm font-semibold select-none">+91</span>
								<span className="text-gray-300">|</span>
								<input
									type="tel"
									inputMode="numeric"
									pattern="[0-9]*"
									maxLength={10}
									value={mobile}
									onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
									onBlur={() => setTouched(true)}
									placeholder="Enter 10-digit number (starts with 6-9)"
									className="w-full outline-none text-sm placeholder:text-gray-400"
									aria-invalid={touched && !isMobileValid}
								/>
							</div>
							{touched && !isMobileValid && (
								<p className="mt-1 text-xs text-red-600">Number must be 10 digits and start with 6-9.</p>
							)}
						</div>
						{/* Operator */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
							<div className={`flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm transition focus-within:ring-2 ${operatorFocusRingClass} ${operatorWrapperClass}`}>
								<Building className={`w-4 h-4 ${operatorIconClass}`} />
								<select
									value={operator}
									onChange={(e) => handleOperatorSelect(e.target.value)}
									className={`w-full outline-none text-sm bg-transparent font-medium ${operatorTextClass}`}
								>
									<option value="" className="text-gray-500">
										{rechargeMode === 'postpaid'
											? 'Select postpaid operator'
											: 'Select prepaid operator'}
									</option>
									{availableOperators.map(op => (
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

						{/* Circle */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Circle
								{rechargeType === 'prepaid' && (
									<span className="ml-1 text-xs text-red-500">*</span>
								)}
							</label>
							<div className={`flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 ${circleFocusRingClass}`}>
								<Globe2 className="w-4 h-4 text-gray-400" />
								<select
									value={circle}
									onChange={(e) => {
										setCircle(e.target.value);
									}}
									className="w-full outline-none text-sm bg-transparent"
									required={rechargeType === 'prepaid'}
								>
									<option value="">
										{rechargeType === 'postpaid' ? 'Optional - Select circle' : 'Select circle'}
									</option>
									{CIRCLE_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
							{rechargeType === 'postpaid' && (
								<p className="mt-1 text-xs text-gray-400">Circle is optional for postpaid recharges.</p>
							)}
							{rechargeType === 'prepaid' && (
								<p className="mt-1 text-xs text-gray-400">Please select your circle to proceed with prepaid recharge.</p>
							)}
						</div>

						{/* Amount + Browse Plans */}
						{canShowAmount && (
							<div className="space-y-3">
								<div className="w-full">
									<label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
									<div className={`flex items-center gap-2 rounded-xl border ${rechargeType === 'postpaid' ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'} px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-orange-500/40`}>
										<IndianRupee className="w-5 h-5 text-gray-400" />
										<input
											type="number"
											min="1"
											value={amount}
											onChange={(e) => {
												const newValue = e.target.value;
												setAmount(newValue);
											}}
											placeholder={rechargeType === 'postpaid' ? 'Fetch bill to autofill or enter amount manually' : 'Enter recharge amount'}
											className="w-full outline-none text-sm placeholder:text-gray-400 bg-transparent"
										/>
									</div>
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

						{/* Payment option */}
						{canShowAmount && amount && parseFloat(amount) > 0 && (
							<div className="mt-4">
								<p className="text-sm text-gray-600 mb-1">Review your recharge</p>
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

export default MobileRecharge;
