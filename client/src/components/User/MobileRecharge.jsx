import { useEffect, useMemo, useState, useCallback } from 'react';
import { Smartphone, Building, Globe2, IndianRupee, Search, ArrowLeft, Headphones, Loader2, Shield, Receipt } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchRechargePlans, fetchPostpaidBill, initiateRecharge } from '../../services/rechargeService';
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

const circles = ['Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Karnataka', 'Maharashtra', 'Gujarat', 'UP East', 'UP West'];

const MobileRecharge = () => {
	const navigate = useNavigate();
	const { showSuccess, showError } = useToast();
	const { user } = useAuthStore();
	const [mobile, setMobile] = useState('');
	const [operator, setOperator] = useState('');
	const [circle, setCircle] = useState('');
	const [amount, setAmount] = useState('');
	const [touched, setTouched] = useState(false);
	const [loading, setLoading] = useState(false);
	const [browsingPlans, setBrowsingPlans] = useState(false);
	const [plans, setPlans] = useState([]);
	const [selectedPlan, setSelectedPlan] = useState(null);
	const [selectedOperatorData, setSelectedOperatorData] = useState(null);
	const [billDetails, setBillDetails] = useState(null);
	const [fetchingBill, setFetchingBill] = useState(false);
	const [billError, setBillError] = useState('');
	const [kycStatus, setKycStatus] = useState(null);
	const [checkingKyc, setCheckingKyc] = useState(true);

	const rechargeType = useMemo(() => {
		if (operator && operator.toLowerCase().includes('postpaid')) {
			return 'postpaid';
		}
		return 'prepaid';
	}, [operator]);

	// India mobile validation: must be 10 digits and start with 6-9
	const isMobileValid = useMemo(() => /^[6-9]\d{9}$/.test(mobile), [mobile]);
	const canShowAmount = useMemo(() => {
		if (!isMobileValid || !operator) return false;
		if (rechargeType === 'postpaid') {
			return true;
		}
		return Boolean(circle);
	}, [isMobileValid, operator, circle, rechargeType]);

	useEffect(() => {
		if (!canShowAmount) {
			setAmount('');
			setPlans([]);
			setSelectedPlan(null);
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
			setSelectedPlan(null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mobile, operator, rechargeType]);

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
				setSelectedPlan(null);
			}, 3000);
		} else if (status === 'failed' || status === 'refunded') {
			showError('Recharge failed. Your payment has been refunded.');
			window.history.replaceState({}, document.title, window.location.pathname);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Fetch plans from API
	const handleBrowsePlans = useCallback(
		async ({ silent = false } = {}) => {
			if (rechargeType === 'postpaid') {
				if (!silent) {
					showError('Bill fetch is available for postpaid numbers. Please fetch the latest bill instead.');
				}
				return false;
			}

			if (!canShowAmount) {
				if (!silent) {
					showError('Please fill in mobile number, operator, and circle');
				}
				return false;
			}

			setBrowsingPlans(true);
			try {
				const response = await fetchRechargePlans(mobile, operator, circle, rechargeType);
				if (response.success && Array.isArray(response.data)) {
					setPlans(response.data);
					if (!silent) {
						showSuccess(
							response.data.length > 0
								? 'Plans loaded successfully'
								: 'No plans returned. You can enter the amount manually.'
						);
					}
					return response.data.length > 0;
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
			showError,
			showSuccess,
			fetchRechargePlans,
		]
	);

	// Handle plan selection
	const handleSelectPlan = (plan) => {
		setSelectedPlan(plan);
		setAmount(plan.amount || plan.price || '');
		setPlans([]); // Close plans list
	};

	const handleFetchBill = useCallback(async () => {
		if (!isMobileValid) {
			showError('Please enter a valid mobile number before fetching the bill.');
			return;
		}

		if (!operator) {
			showError('Please select an operator to fetch the bill.');
			return;
		}

		try {
			setFetchingBill(true);
			setBillError('');
			if (rechargeType !== 'postpaid') {
				// Prepaid numbers don't have bills; surface plans instead
				setBillDetails(null);
				setBillError('');
				const plansLoaded = await handleBrowsePlans({ silent: true });
				if (plansLoaded) {
					showSuccess('Prepaid plans are now available. Please pick a plan to continue.');
				} else {
					showError('No plans available right now. You can still enter an amount manually.');
				}
				return;
			}

			const response = await fetchPostpaidBill({ mobileNumber: mobile, operator });

			if (response.success) {
				const data = response.data;
				const billAmount = data.bill_amount ?? data.outstanding_amount ?? '';
				setBillDetails(data);
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
		rechargeType,
		showError,
		showSuccess,
		fetchPostpaidBill,
		handleBrowsePlans,
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

		if (!amount || parseFloat(amount) <= 0) {
			showError('Please enter a valid amount');
			return;
		}

		if (rechargeType === 'postpaid' && !billDetails) {
			showError('Please fetch the latest bill before making a payment.');
			return;
		}

		setLoading(true);
		try {
			const rechargeData = {
				mobileNumber: mobile,
				operator: operator,
				circle: circle,
				amount: parseFloat(amount),
				rechargeType: rechargeType,
				planId: selectedPlan?.planId || selectedPlan?.id || '',
				planDescription: selectedPlan?.description || selectedPlan?.name || '',
				paymentMethod: 'wallet',
				billDetails: billDetails || {},
			};

			const response = await initiateRecharge(rechargeData);

			if (response.success && response.data) {
				showSuccess('Recharge initiated from wallet! We will update you shortly.');
				if (response.data.rechargeId) {
					navigate(`/recharge/status?rechargeId=${response.data.rechargeId}`);
				}
			} else {
				showError(response.message || 'Failed to initiate payment');
			}
		} catch (error) {
			console.error('Error initiating payment:', error);
			showError(error.message || 'Failed to initiate payment');
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
							<div className={`flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm transition focus-within:ring-2 focus-within:ring-orange-500/40 ${selectedOperatorData
									? `${selectedOperatorData.border} ${selectedOperatorData.bg}`
									: 'border-gray-200 bg-white'
								}`}>
								<Building className={`w-4 h-4 ${selectedOperatorData ? selectedOperatorData.color : 'text-gray-400'}`} />
								<select
									value={operator}
									onChange={(e) => setOperator(e.target.value)}
									className={`w-full outline-none text-sm bg-transparent font-medium ${selectedOperatorData ? selectedOperatorData.color : 'text-gray-700'}`}
								>
									<option value="" className="text-gray-500">Select operator</option>
									<optgroup label="Prepaid / Topup" className="font-semibold">
										{prepaidOperators.map(op => (
											<option key={op.value} value={op.value} className={`${op.color} py-2`}>
												{op.name}
											</option>
										))}
									</optgroup>
									<optgroup label="Postpaid" className="font-semibold">
										{postpaidOperators.map(op => (
											<option key={op.value} value={op.value} className={`${op.color} py-2`}>
												{op.name}
											</option>
										))}
									</optgroup>
								</select>
							</div>
							{selectedOperatorData && (
								<p className="mt-1 text-xs text-gray-500">Selected: <span className={`font-semibold ${selectedOperatorData.color}`}>{selectedOperatorData.name}</span></p>
							)}
						</div>

						{/* Circle */}
						{rechargeType !== 'postpaid' && (
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Circle</label>
								<div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-orange-500/40">
									<Globe2 className="w-4 h-4 text-gray-400" />
									<select value={circle} onChange={(e) => setCircle(e.target.value)} className="w-full outline-none text-sm bg-transparent">
										<option value="">Select circle</option>
										{circles.map(c => <option key={c} value={c}>{c}</option>)}
									</select>
								</div>
							</div>
						)}

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
												onChange={(e) => setAmount(e.target.value)}
												placeholder={rechargeType === 'postpaid' ? 'Fetch bill to autofill amount' : 'Enter amount'}
												className="w-full outline-none text-sm placeholder:text-gray-400 bg-transparent"
												readOnly={rechargeType === 'postpaid'}
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
						{rechargeType !== 'postpaid' && plans.length > 0 && (
							<div className="mt-4 p-4 rounded-xl border border-orange-200 bg-orange-50/30">
								<p className="text-sm font-semibold text-gray-700 mb-3">Available Plans</p>
								<div className="space-y-2 max-h-60 overflow-y-auto">
									{plans.map((plan, index) => (
										<button
											key={plan.id || plan.planId || index}
											onClick={() => handleSelectPlan(plan)}
											className={`w-full text-left p-3 rounded-lg border transition ${selectedPlan?.id === plan.id || selectedPlan?.planId === plan.planId
												? 'border-orange-500 bg-orange-100'
												: 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50'
												}`}
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
									onClick={() => setPlans([])}
									className="mt-3 text-xs text-gray-500 hover:text-gray-700"
								>
									Close plans
								</button>
							</div>
						)}

						{/* Payment option */}
						{canShowAmount && amount && parseFloat(amount) > 0 && (
							<div className="mt-4">
								<p className="text-sm text-gray-600 mb-1">Proceed to Recharge</p>
								<p className="text-[11px] text-gray-500 mb-3">Amount will be deducted from your Smart Wallet.</p>
								<button
									onClick={handlePayment}
									disabled={loading}
									className="px-4 py-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-sm font-semibold flex items-center justify-center gap-2 transition w-full disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{loading ? (
										<>
											<Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
											<span className="text-emerald-700">Processing...</span>
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
