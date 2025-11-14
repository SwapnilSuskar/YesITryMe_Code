import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Smartphone, Building, Globe2, IndianRupee, Search, ArrowLeft, Headphones, Loader2, Shield, Receipt, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchRechargePlans, fetchPostpaidBill, detectCircle, initiateRecharge, getWalletBalance } from '../../services/rechargeService';
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

const CIRCLE_OPTIONS = [
	{ label: 'Andhra Pradesh', value: 'Andhra Pradesh', textCode: 'AP', numericCode: '13', aliases: ['Andhra Pradesh & Telangana', 'AP', '13'] },
	{ label: 'Telangana', value: 'Telangana', textCode: 'TS', numericCode: '28', aliases: ['TS', '28'] },
	{ label: 'Assam', value: 'Assam', textCode: 'AS', numericCode: '24', aliases: ['AS', '24'] },
	{ label: 'Bihar & Jharkhand', value: 'Bihar Jharkhand', textCode: 'BH', numericCode: '17', aliases: ['Bihar', 'Jharkhand', 'BH', '17'] },
	{ label: 'Chennai', value: 'Chennai', textCode: 'CH', numericCode: '7', aliases: ['CH', '7', 'Tamil Nadu Chennai'] },
	{ label: 'Delhi NCR', value: 'Delhi NCR', textCode: 'DL', numericCode: '5', aliases: ['Delhi', 'NCR', 'DL', '5'] },
	{ label: 'Gujarat', value: 'Gujarat', textCode: 'GJ', numericCode: '12', aliases: ['GJ', '12'] },
	{ label: 'Haryana', value: 'Haryana', textCode: 'HR', numericCode: '20', aliases: ['HR', '20'] },
	{ label: 'Himachal Pradesh', value: 'Himachal Pradesh', textCode: 'HP', numericCode: '21', aliases: ['HP', '21'] },
	{ label: 'Jammu & Kashmir', value: 'Jammu and Kashmir', textCode: 'JK', numericCode: '25', aliases: ['Jammu', 'Kashmir', 'JK', '25'] },
	{ label: 'Karnataka', value: 'Karnataka', textCode: 'KA', numericCode: '9', aliases: ['KA', '9'] },
	{ label: 'Kerala', value: 'Kerala', textCode: 'KL', numericCode: '14', aliases: ['KL', '14'] },
	{ label: 'Kolkata', value: 'Kolkata', textCode: 'KO', numericCode: '6', aliases: ['KO', '6'] },
	{ label: 'Madhya Pradesh & Chhattisgarh', value: 'Madhya Pradesh Chhattisgarh', textCode: 'MP', numericCode: '16', aliases: ['Madhya Pradesh', 'Chhattisgarh', 'MP', '16', 'CG', '27'] },
	{ label: 'Maharashtra (Rest of Maharashtra)', value: 'Maharashtra', textCode: 'MH', numericCode: '4', aliases: ['Maharashtra & Goa', 'MH', '4'] },
	{ label: 'Mumbai', value: 'Mumbai', textCode: 'MB', numericCode: '3', aliases: ['MB', '3'] },
	{ label: 'Goa', value: 'Goa', textCode: 'GA', numericCode: '15', aliases: ['GA', '15'] },
	{ label: 'North East', value: 'North East', textCode: 'NE', numericCode: '26', aliases: ['NE', '26'] },
	{ label: 'Odisha', value: 'Odisha', textCode: 'OR', numericCode: '23', aliases: ['Orissa', 'OR', '23'] },
	{ label: 'Punjab', value: 'Punjab', textCode: 'PB', numericCode: '1', aliases: ['PB', '1', 'Haryana & Punjab'] },
	{ label: 'Rajasthan', value: 'Rajasthan', textCode: 'RJ', numericCode: '18', aliases: ['RJ', '18'] },
	{ label: 'Tamil Nadu', value: 'Tamil Nadu', textCode: 'TN', numericCode: '8', aliases: ['TN', '8'] },
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
	const { showSuccess, showError } = useToast();
	const { user } = useAuthStore();
	const [mobile, setMobile] = useState('');
	const [rechargeMode, setRechargeMode] = useState('prepaid');
	const [operator, setOperator] = useState('');
	const [circle, setCircle] = useState('');
	const [detectedCircle, setDetectedCircle] = useState(null);
	const [detectingCircle, setDetectingCircle] = useState(false);
	const [amount, setAmount] = useState('');
	const [touched, setTouched] = useState(false);
	const [loading, setLoading] = useState(false);
	const [browsingPlans, setBrowsingPlans] = useState(false);
	const [plans, setPlans] = useState([]);
	const allPlansRef = useRef([]); // Ref to track allPlans without causing re-renders
	const [selectedOperatorData, setSelectedOperatorData] = useState(null);
	const [billDetails, setBillDetails] = useState(null);
	const [fetchingBill, setFetchingBill] = useState(false);
	const [billError, setBillError] = useState('');
	const [kycStatus, setKycStatus] = useState(null);
	const [checkingKyc, setCheckingKyc] = useState(true);
	const [walletBalance, setWalletBalance] = useState(null);
	const [checkingWallet, setCheckingWallet] = useState(false);
	const amountDebounceTimerRef = useRef(null);
	const lastFetchedAmountRef = useRef('');
	const amountRef = useRef(amount);

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
		const primary = circle || detectedCircle;
		if (primary === undefined || primary === null || primary === '') {
			return null;
		}
		const option = findCircleOption(primary);
		if (option) {
			return {
				label: option.label,
				value: option.value,
				textCode: option.textCode,
				numericCode: option.numericCode,
				aliases: option.aliases || [],
			};
		}
		const fallbackValue = getCircleValue(primary);
		return {
			label: getCircleLabel(primary),
			value: fallbackValue || undefined,
		};
	}, [circle, detectedCircle, findCircleOption, getCircleLabel, getCircleValue]);

	const mapApiCircleToOption = useCallback(
		(data) => {
			if (!data) return null;
			const candidates = [
				data.circleValue,
				data.circle,
				data.circle_code,
				data.circleCode,
				data.circle_numeric,
				data.circleNumeric,
				data.providerVariant,
			].filter(Boolean);

			for (const candidate of candidates) {
				const option = findCircleOption(candidate);
				if (option) {
					return option;
				}
			}
			return null;
		},
		[findCircleOption]
	);

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
			setDetectedCircle(null);
			setPlans([]);
			allPlansRef.current = [];
			setBillDetails(null);
			setBillError('');
			setAmount('');
			setTouched(false);
			lastFetchedAmountRef.current = '';
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
		// For prepaid, allow if we have circle (detected or manual) or if detection is in progress
		return Boolean(circle || detectedCircle || detectingCircle);
	}, [isMobileValid, operator, circle, detectedCircle, detectingCircle, rechargeType]);

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
			setPlans([]);
		}
	}, [canShowAmount]);

	// Handle operator selection and update styling
	useEffect(() => {
		const allOperators = [...prepaidOperators, ...postpaidOperators];
		const operatorData = allOperators.find(op => op.value === operator);
		setSelectedOperatorData(operatorData || null);
	}, [operator]);

	useEffect(() => {
		if (rechargeType !== 'postpaid') {
			setBillDetails(null);
			setBillError('');
		}
	}, [rechargeType]);

		useEffect(() => {
		if (rechargeType === 'postpaid') {
			setBillDetails(null);
			setBillError('');
			setAmount('');
			setPlans([]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mobile, operator, rechargeType]);

	const currentCircleLabel = useMemo(
		() => getCircleLabel(circle || detectedCircle),
		[circle, detectedCircle, getCircleLabel]
	);

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

	// Auto-detect circle when mobile and operator are entered
	useEffect(() => {
		// Only detect for prepaid (postpaid doesn't require circle)
		if (!isMobileValid || !operator || rechargeType !== 'prepaid' || circle) {
			return undefined;
		}

		const timer = setTimeout(async () => {
			try {
				setDetectingCircle(true);
				const response = await detectCircle(mobile, operator, rechargeType);
				if (response.success) {
					const option = mapApiCircleToOption(response);
					const resolvedLabel = option ? option.label : getCircleLabel(response.circle || response.circleValue);
					const resolvedValue = option ? option.value : getCircleValue(response.circleValue || response.circle);

					if (resolvedValue) {
						if (circle !== resolvedValue) {
							setCircle(resolvedValue);
						}
						if (resolvedLabel) {
							if (detectedCircle !== resolvedLabel) {
								setDetectedCircle(resolvedLabel);
								showSuccess(`Circle auto-detected: ${resolvedLabel}`);
							} else {
								setDetectedCircle(resolvedLabel);
							}
						}
					}
				} else {
					setDetectedCircle(null);
				}
			} catch (error) {
				setDetectedCircle(null);
				// Silently fail - system will try all circles automatically
			} finally {
				setDetectingCircle(false);
			}
		}, 1000);

		return () => clearTimeout(timer);
	}, [
		mobile,
		operator,
		rechargeType,
		isMobileValid,
		circle,
		detectedCircle,
		mapApiCircleToOption,
		getCircleLabel,
		getCircleValue,
		showSuccess,
	]);

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

	// Fetch wallet balance
	const fetchWalletBalance = useCallback(async () => {
		if (!user) return;

		setCheckingWallet(true);
		try {
			const response = await getWalletBalance();
			if (response.success) {
				setWalletBalance(response.balance || 0);
			}
		} catch (error) {
			console.error('Error fetching wallet balance:', error);
			setWalletBalance(null);
		} finally {
			setCheckingWallet(false);
		}
	}, [user]);

	useEffect(() => {
		fetchWalletBalance();
	}, [fetchWalletBalance]);

	// Check for recharge success from callback URL
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const status = urlParams.get('status');
		const rechargeId = urlParams.get('rechargeId');

		if (status === 'success' && rechargeId) {
			showSuccess(`🎉 Recharge successful! Your mobile number has been recharged successfully.`);
			// Clear URL params
			window.history.replaceState({}, document.title, window.location.pathname);
			// Reset form after a delay
			setTimeout(() => {
				setMobile('');
				setOperator('');
				setCircle('');
				setAmount('');
			}, 3000);
		} else if (status === 'failed' || status === 'refunded') {
			showError('Recharge failed. Your payment has been refunded.');
			window.history.replaceState({}, document.title, window.location.pathname);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Fetch plans from API (Prepaid only)
	useEffect(() => {
		amountRef.current = amount;
	}, [amount]);

	const handleBrowsePlans = useCallback(
		async ({ silent = false } = {}) => {
			// Strict validation: Only allow prepaid
			if (rechargeType === 'postpaid') {
				if (!silent) {
					showError('Plans are only available for prepaid recharges. For postpaid, please use "Fetch Bill" instead.');
				}
				return false;
			}

			if (!canShowAmount) {
				if (!silent) {
					showError('Please fill in mobile number, operator, and circle');
				}
				return false;
			}

			// Ensure we're using prepaid type
			if (rechargeType !== 'prepaid') {
				if (!silent) {
					showError('Plans can only be fetched for prepaid recharges');
				}
				return false;
			}

			setBrowsingPlans(true);
			try {
				// Force prepaid type in the call - use detected or manual circle
				const circleInfo = resolveCirclePayload();
				const response = await fetchRechargePlans(
					mobile,
					operator,
					circleInfo?.value || undefined,
					'prepaid',
					{
						circleLabel: circleInfo?.label,
						circleCode: circleInfo?.textCode,
						circleNumeric: circleInfo?.numericCode,
					}
				);
				if (response.success && Array.isArray(response.data)) {
					const currentAmount = amountRef.current;
					// Store all plans in ref (to avoid re-renders)
					allPlansRef.current = response.data;
					
					// Filter plans based on entered amount if available
					let filteredPlans = response.data;
					if (currentAmount && parseFloat(currentAmount) > 0) {
						const enteredAmount = parseFloat(currentAmount);
						// Filter plans that match or are close to the entered amount (±50 range)
						filteredPlans = response.data.filter(plan => {
							const planAmount = parseFloat(plan.amount || plan.price || plan.rechargeAmount || 0);
							// Show plans within ±50 range or exact match
							return planAmount > 0 && (planAmount === enteredAmount || Math.abs(planAmount - enteredAmount) <= 50);
						});
						
						// If no close matches, show all plans sorted by closest to entered amount
						if (filteredPlans.length === 0 && response.data.length > 0) {
							filteredPlans = [...response.data].sort((a, b) => {
								const amountA = parseFloat(a.amount || a.price || a.rechargeAmount || 0);
								const amountB = parseFloat(b.amount || b.price || b.rechargeAmount || 0);
								return Math.abs(amountA - enteredAmount) - Math.abs(amountB - enteredAmount);
							}).slice(0, 10); // Show top 10 closest plans
						}
					}
					
					setPlans(filteredPlans);
					lastFetchedAmountRef.current = currentAmount || '';
					if (!silent) {
						if (filteredPlans.length > 0) {
							showSuccess(`Found ${filteredPlans.length} plan${filteredPlans.length > 1 ? 's' : ''} matching your amount`);
						} else if (response.data.length > 0) {
							// Plans were fetched but none match the entered amount
							showError(`No plans found for ₹${currentAmount}. Showing closest available plans below.`);
						} else {
							showError('No plans available for this operator/circle. You can proceed with manual recharge.');
						}
					}
					return filteredPlans.length > 0;
				}
				if (!silent) {
					showError(response.message || 'No plans found');
				}
				return false;
			} catch (error) {
				console.error('Error fetching plans:', error);
				if (!silent) {
					showError(error.message || 'Failed to fetch plans');
				}
				return false;
			} finally {
				setBrowsingPlans(false);
			}
		},
		[
			rechargeType,
			canShowAmount,
			mobile,
			operator,
			circle,
			detectedCircle,
			showError,
			showSuccess,
			resolveCirclePayload,
		]
	);

	// Handle plan selection
	const handleSelectPlan = (plan) => {
		const planAmount = parseFloat(plan?.amount ?? plan?.price ?? plan?.rechargeAmount ?? '0') || 0;
		const circleInfo = resolveCirclePayload();
		const discountRate = operatorDiscountRates[operator] ?? 0;
		const discountAmount = Math.round(((planAmount * discountRate) / 100) * 100) / 100;
		const netAmount = Math.max(Math.round((planAmount - discountAmount) * 100) / 100, 0);
		
		navigate('/recharge/plan-confirmation', {
			state: {
				plan,
				formData: {
					mobileNumber: mobile,
					operator,
					rechargeMode,
					rechargeType,
					circle: circle || detectedCircle,
					circleInfo,
					amount: planAmount,
					discountDetails: {
						amount: discountAmount,
						percentage: discountRate,
						net: netAmount,
					},
					billDetails: billDetails || {},
				},
			},
		});
	};

	// Auto-fetch plans when amount is entered (for prepaid only)
	useEffect(() => {
		// Clear any existing timer
		if (amountDebounceTimerRef.current) {
			clearTimeout(amountDebounceTimerRef.current);
		}

		// Only auto-fetch for prepaid and when amount is valid
		if (rechargeType === 'prepaid' && amount && parseFloat(amount) > 0 && canShowAmount) {
			// Debounce: wait 600ms after user stops typing
			amountDebounceTimerRef.current = setTimeout(() => {
				const currentAmount = amountRef.current;
				if (currentAmount && lastFetchedAmountRef.current !== currentAmount) {
					handleBrowsePlans({ silent: true }).then((fetched) => {
						if (fetched) {
							lastFetchedAmountRef.current = amountRef.current || '';
						}
					});
				}
			}, 600);
		} else if (rechargeType === 'prepaid' && allPlansRef.current.length > 0) {
			// If we have fetched plans and amount changes, filter them (use ref to avoid re-renders)
			if (amount && parseFloat(amount) > 0) {
				const enteredAmount = parseFloat(amount);
				const cachedPlans = allPlansRef.current;
				const filteredPlans = cachedPlans.filter(plan => {
					const planAmount = parseFloat(plan.amount || plan.price || plan.rechargeAmount || 0);
					return planAmount > 0 && (planAmount === enteredAmount || Math.abs(planAmount - enteredAmount) <= 50);
				});
				
				// If no close matches, show closest plans
				if (filteredPlans.length === 0) {
					const sortedPlans = [...cachedPlans].sort((a, b) => {
						const amountA = parseFloat(a.amount || a.price || a.rechargeAmount || 0);
						const amountB = parseFloat(b.amount || b.price || b.rechargeAmount || 0);
						return Math.abs(amountA - enteredAmount) - Math.abs(amountB - enteredAmount);
					}).slice(0, 10);
					setPlans(sortedPlans);
				} else {
					setPlans(filteredPlans);
				}
			} else {
				// Show all plans if amount is cleared
				setPlans(allPlansRef.current);
			}
		} else {
			// Clear plans if amount is cleared or invalid
			if (!amount || parseFloat(amount) <= 0) {
				setPlans([]);
				allPlansRef.current = [];
				lastFetchedAmountRef.current = '';
			}
		}

		// Cleanup timer on unmount or when dependencies change
		return () => {
			if (amountDebounceTimerRef.current) {
				clearTimeout(amountDebounceTimerRef.current);
			}
		};
	}, [amount, rechargeType, canShowAmount, handleBrowsePlans]); // Removed allPlans from dependencies

	const handleFetchBill = useCallback(async () => {
		if (!isMobileValid) {
			showError('Please enter a valid mobile number before fetching the bill.');
			return;
		}

		if (!operator) {
			showError('Please select an operator to fetch the bill.');
			return;
		}

		// Strict validation: Only allow postpaid
		if (rechargeType !== 'postpaid') {
			// Prepaid numbers don't have bills; automatically show plans instead
			setBillDetails(null);
			setBillError('');
			setPlans([]); // Clear any existing plans

			// Automatically fetch and display plans for prepaid
			const plansLoaded = await handleBrowsePlans({ silent: false });
			if (plansLoaded) {
				// Plans are already set by handleBrowsePlans, just show success
				showSuccess('Prepaid plans loaded! Please select a plan below.');
			} else {
				// If no plans, still allow manual amount entry
				showError('No plans available for this operator/circle. You can enter the amount manually.');
			}
			return;
		}

		try {
			setFetchingBill(true);
			setBillError('');

			// Only fetch bill for postpaid - include circle (detected or manual) for different SIM cards
			const circleInfo = resolveCirclePayload();
			const response = await fetchPostpaidBill({ 
				mobileNumber: mobile, 
				operator,
				circle: circleInfo?.value || undefined,
				circleCode: circleInfo?.textCode,
				circleNumeric: circleInfo?.numericCode,
				circleLabel: circleInfo?.label,
			});

			if (response.success) {
				const data = response.data;
				const billAmount = data.bill_amount ?? data.outstanding_amount ?? '';

				// Ensure bill reference is included
				const billDetailsWithRef = {
					...data,
					bill_id: data.bill_id || data.transaction_id || data.billId || `BILL_${mobile}_${Date.now()}`,
					transaction_id: data.transaction_id || data.bill_id || data.billId || `BILL_${mobile}_${Date.now()}`,
				};

				setBillDetails(billDetailsWithRef);
				setAmount(billAmount !== '' ? String(billAmount) : '');
				showSuccess('Bill fetched successfully!');
			} else {
				const message = response.message || 'Failed to fetch bill';
				setBillDetails(null);
				setAmount('');
				setBillError(message);
				showError(message);
			}
		} catch (error) {
			const message = error.message || error?.message || 'Failed to fetch bill';
			setBillDetails(null);
			setAmount('');
			setBillError(message);
			showError(message);
		} finally {
			setFetchingBill(false);
		}
	}, [
		isMobileValid,
		operator,
		mobile,
		circle,
		detectedCircle,
		rechargeType,
		showError,
		showSuccess,
		handleBrowsePlans,
		resolveCirclePayload,
	]);

	// Handle payment initiation
	const handlePayment = async () => {
		// Check KYC verification before allowing payment
		const isKycVerified = kycStatus?.status === 'approved' || user?.kycApprovedDate;

		if (!isKycVerified) {
			showError('KYC verification required! Please complete your KYC verification to proceed with mobile recharge.');
			setTimeout(() => {
				navigate('/kyc');
			}, 1500);
			return;
		}

		const rechargeAmount = parseFloat(amount);

		if (!amount || rechargeAmount <= 0) {
			showError('Please enter a valid amount');
			return;
		}

		const netPayableAmount =
			discountDetails.net && discountDetails.net > 0
				? discountDetails.net
				: rechargeAmount;

		// Check wallet balance before proceeding
		if (walletBalance === null) {
			// Try to fetch balance first
			setCheckingWallet(true);
			try {
				const response = await getWalletBalance();
				if (response.success) {
					setWalletBalance(response.balance || 0);
				}
			} catch (error) {
				showError('Unable to verify wallet balance. Please try again.');
				setCheckingWallet(false);
				return;
			} finally {
				setCheckingWallet(false);
			}
		}

		if (walletBalance !== null && walletBalance < netPayableAmount) {
			showError(
				`Insufficient wallet balance. Available: ₹${walletBalance.toFixed(2)}, Required: ₹${netPayableAmount.toFixed(2)}`
			);
			return;
		}

		// For postpaid, ensure bill is fetched and has reference
		if (rechargeType === 'postpaid') {
			if (!billDetails) {
				showError('Please fetch the latest bill before making a payment.');
				return;
			}

			// Ensure bill has a reference ID
			if (!billDetails.bill_id && !billDetails.transaction_id && !billDetails.billId) {
				showError('Bill reference is missing. Please fetch the bill again.');
				return;
			}
		}

		setLoading(true);
		try {
			const circleInfo = resolveCirclePayload();
			const rechargeData = {
				mobileNumber: mobile,
				operator: operator,
				amount: rechargeAmount,
				rechargeType: rechargeType,
				planId: '',
				planDescription: '',
				paymentMethod: 'wallet',
				billDetails: billDetails || {},
			};

			if (circleInfo?.value) {
				rechargeData.circle = circleInfo.value;
				if (circleInfo.label) {
					rechargeData.circleLabel = circleInfo.label;
				}
				if (circleInfo.textCode) {
					rechargeData.circleCode = circleInfo.textCode;
				}
				if (circleInfo.numericCode) {
					rechargeData.circleNumeric = circleInfo.numericCode;
				}
			} else if (circle) {
				rechargeData.circle = circle;
			} else if (detectedCircle) {
				rechargeData.circle = detectedCircle;
			}

			const response = await initiateRecharge(rechargeData);

			if (response.success && response.data) {
				showSuccess('Recharge initiated from wallet! We will update you shortly.');
				// Refresh wallet balance after successful recharge
				await fetchWalletBalance();
				if (response.data.rechargeId) {
					navigate(`/recharge/status?rechargeId=${response.data.rechargeId}`);
				}
			} else {
				// Use the error message from backend response
				const errorMessage = response.message || 'Failed to initiate payment';
				showError(errorMessage);
			}
		} catch (error) {
			console.error('Error initiating payment:', error);
			// Extract error message from error response
			const errorResponse = error?.response?.data;
			const errorMessage = errorResponse?.message || error?.message || 'Failed to initiate payment';
			
			// Show user-friendly error message
			showError(errorMessage);
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

						{/* Circle - Auto-detected from server */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Circle
								{detectingCircle && (
									<span className="ml-2 text-xs text-orange-600 font-normal">
										<Loader2 className="w-3 h-3 inline animate-spin mr-1" />
										Detecting...
									</span>
								)}
								{detectedCircle && !detectingCircle && (
									<span className="ml-2 text-xs text-green-600 font-normal">✓ Auto-detected</span>
								)}
							</label>
							{detectedCircle && !detectingCircle && rechargeType === 'prepaid' ? (
								// Show detected circle as read-only info
								<div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 shadow-sm">
									<Globe2 className="w-4 h-4 text-green-600" />
									<span className="text-sm font-medium text-green-700">{currentCircleLabel}</span>
									<button
										type="button"
										onClick={() => {
											setCircle('');
											setDetectedCircle(null);
										}}
										className="ml-auto text-xs text-green-600 hover:text-green-700 underline"
									>
										Change
									</button>
								</div>
							) : (
								// Show dropdown for manual selection or when not detected
								<div className={`flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 ${circleFocusRingClass}`}>
									<Globe2 className="w-4 h-4 text-gray-400" />
									<select 
										value={circle} 
										onChange={(e) => {
											setCircle(e.target.value);
											if (e.target.value) {
												setDetectedCircle(null); // Clear detected if user manually selects
											}
										}} 
										className="w-full outline-none text-sm bg-transparent"
										disabled={detectingCircle}
									>
										<option value="">
											{detectingCircle ? 'Detecting circle...' : rechargeType === 'postpaid' ? 'Optional - Auto-detect' : 'Select or auto-detect'}
										</option>
										{CIRCLE_OPTIONS.map(option => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</div>
							)}
							{rechargeType === 'postpaid' && (
								<p className="mt-1 text-xs text-gray-400">Circle is optional - system will auto-detect if not provided.</p>
							)}
							{rechargeType === 'prepaid' && !detectedCircle && !detectingCircle && (
								<p className="mt-1 text-xs text-gray-400">Circle will be auto-detected from your mobile number, or you can select manually.</p>
							)}
						</div>

						{/* Amount + Browse Plans */}
						{canShowAmount && (
							<div className="space-y-3">
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
									<div className="sm:col-span-2">
										<label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
										<div className={`flex items-center gap-2 rounded-xl border ${rechargeType === 'postpaid' ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'} px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-orange-500/40`}>
											<IndianRupee className="w-4 h-4 text-gray-400" />
											<input
												type="number"
												min="1"
												value={amount}
												onChange={(e) => {
													const newValue = e.target.value;
													setAmount(newValue);
												}}
												placeholder={rechargeType === 'postpaid' ? 'Fetch bill to autofill or enter amount manually' : 'Enter amount (plans will show automatically)'}
												className="w-full outline-none text-sm placeholder:text-gray-400 bg-transparent"
												readOnly={rechargeType === 'postpaid' && billDetails && (billDetails.bill_amount || billDetails.outstanding_amount)}
											/>
										</div>
									</div>
									<div className="flex items-end">
										{rechargeType === 'postpaid' ? (
											<button
												type="button"
												onClick={handleFetchBill}
												disabled={fetchingBill || !isMobileValid || !operator}
												className="w-full px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-sm font-semibold flex items-center justify-center gap-2 text-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
											>
												{fetchingBill ? (
													<>
														<Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
														Fetching...
													</>
												) : (
													<>
														<Receipt className="w-4 h-4 text-blue-600" />
														Fetch Bill
													</>
												)}
											</button>
										) : (
											<button
												type="button"
												onClick={handleBrowsePlans}
												disabled={browsingPlans}
												className="w-full px-4 py-2 rounded-xl border border-orange-200 bg-orange-50/50 hover:bg-orange-100 text-sm font-semibold flex items-center justify-center gap-2 text-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
											>
												{browsingPlans ? (
													<>
														<Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
														Loading...
													</>
												) : (
													<>
														<Search className="w-4 h-4 text-orange-600" />
														Browse Plans
													</>
												)}
											</button>
										)}
									</div>
								</div>
								{billError && (
									<p className="text-xs text-red-600">{billError}</p>
								)}
								{discountDetails.amount > 0 && (
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs sm:text-sm text-emerald-700">
                                        <div className="flex items-center justify-between">
                                            <span>Discount ({discountDetails.percentage}%):</span>
                                            <span>-₹{discountDetails.amount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-1 font-semibold text-emerald-800">
                                            <span>Payable after discount:</span>
                                            <span>₹{discountDetails.net.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}
								{billDetails && (
									<div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
										<div className="flex items-start gap-3">
											<div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
												<Receipt className="w-5 h-5 text-blue-600" />
											</div>
											<div className="flex-1">
												<p className="text-sm font-semibold text-gray-800">
													{billDetails.customer_name || 'Customer'} &bull; {billDetails.operator || operator}
												</p>
												<div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
													<p>Bill Amount: <span className="font-semibold text-gray-800">₹{billDetails.bill_amount ?? billDetails.outstanding_amount ?? '--'}</span></p>
													<p>Outstanding: <span className="font-semibold text-gray-800">₹{billDetails.outstanding_amount ?? '--'}</span></p>
													<p>Bill Date: <span className="font-semibold text-gray-800">{billDetails.bill_date ? new Date(billDetails.bill_date).toLocaleDateString() : '--'}</span></p>
													<p>Due Date: <span className="font-semibold text-red-600">{billDetails.due_date ? new Date(billDetails.due_date).toLocaleDateString() : '--'}</span></p>
												</div>
												{billDetails.message && (
													<p className="text-xs text-gray-500 mt-1">{billDetails.message}</p>
												)}
											</div>
										</div>
									</div>
								)}
							</div>
						)}

						{/* Plans List */}
						{rechargeType !== 'postpaid' && (plans.length > 0 || browsingPlans || lastFetchedAmountRef.current) && (
							<div className="mt-4 p-4 rounded-xl border border-orange-200 bg-orange-50/30">
								<div className="flex items-center justify-between mb-3">
									<p className="text-sm font-semibold text-gray-700">
										{browsingPlans ? 'Loading plans...' : `Available Plans ${amount && parseFloat(amount) > 0 ? `(matching ₹${amount})` : ''}`}
									</p>
									{browsingPlans && (
										<Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
									)}
								</div>
								{browsingPlans && plans.length === 0 ? (
									<div className="text-center py-4">
										<Loader2 className="w-6 h-6 text-orange-600 animate-spin mx-auto mb-2" />
										<p className="text-xs text-gray-500">Searching plans...</p>
									</div>
								) : plans.length > 0 ? (
									<>
										<div className="space-y-2 max-h-60 overflow-y-auto">
											{plans.map((plan, index) => (
												<button
													key={plan.id || plan.planId || index}
													onClick={() => handleSelectPlan(plan)}
													className="w-full text-left p-3 rounded-lg border border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50 transition"
												>
													<div className="flex items-center justify-between">
														<div>
															<p className="font-semibold text-gray-800">
																₹{plan.amount || plan.price || plan.rechargeAmount}
															</p>
															<p className="text-xs text-gray-600 mt-1">
																{plan.description || plan.name || plan.validity || 'Plan details'}
															</p>
														</div>
														<span className="text-xs font-semibold text-orange-600">Select</span>
													</div>
												</button>
											))}
										</div>
										<button
											onClick={() => {
												setPlans([]);
												allPlansRef.current = [];
											}}
											className="mt-3 text-xs text-gray-500 hover:text-gray-700"
										>
											Close plans
										</button>
									</>
								) : lastFetchedAmountRef.current ? (
									<div className="text-center py-4">
										<p className="text-sm font-semibold text-gray-700 mb-1">No plan found, dawg!</p>
										<p className="text-xs text-gray-500">
											Enter a different amount or proceed with manual recharge for ₹{amount || lastFetchedAmountRef.current}.
										</p>
									</div>
								) : null}
							</div>
						)}

						{/* Wallet Balance Display */}
						{walletBalance !== null && (
							<div className="mt-4 p-3 rounded-xl border border-blue-200 bg-blue-50/50">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium text-gray-700">Wallet Balance:</span>
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
								<p className="text-sm text-gray-600 mb-1">Proceed to Recharge</p>
								<p className="text-[11px] text-gray-500 mb-3">Amount will be deducted from your Smart Wallet.</p>
								<button
									onClick={handlePayment}
									disabled={loading || checkingWallet || (walletBalance !== null && walletBalance < parseFloat(amount))}
									className="px-4 py-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-sm font-semibold flex items-center justify-center gap-2 transition w-full disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{loading || checkingWallet ? (
										<>
											<Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
											<span className="text-emerald-700">{checkingWallet ? 'Checking balance...' : 'Processing...'}</span>
										</>
									) : (
										<span className="text-emerald-800">Recharge from Smart Wallet</span>
									)}
								</button>
								<p className="mt-2 text-[11px] text-gray-500">Instant recharge or automatic refund if the operator fails.</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default MobileRecharge;
