import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, IndianRupee, Sparkles, AlertCircle, X } from 'lucide-react';
import { initiateRecharge, getWalletBalance } from '../../services/rechargeService';
import useToast from '../../hooks/useToast';
import { useAuthStore } from '../../store/useAuthStore';
import api, { API_ENDPOINTS } from '../../config/api';

// Operator discount rates (same as MobileRecharge)
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

const PlanConfirmation = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { showSuccess, showError } = useToast();
	const { user } = useAuthStore();

	const [loading, setLoading] = useState(false);
	const [checkingWallet, setCheckingWallet] = useState(false);
	const [walletBalance, setWalletBalance] = useState(null);
	const [kycStatus, setKycStatus] = useState(null);
	const [checkingKyc, setCheckingKyc] = useState(true);
	const [isConfirming, setIsConfirming] = useState(false);
	const [errorMessage, setErrorMessage] = useState(null);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const isFetchingBalanceRef = useRef(false); // Prevent multiple simultaneous balance fetches

	// Get data from navigation state
	const formData = location.state?.formData;
	const plan = location.state?.plan;
	const isActiveMember = Boolean(formData?.isActiveMember ?? (user?.status === 'active'));

	// Redirect if no data
	useEffect(() => {
		if (!formData || !plan) {
			showError('Invalid plan selection. Please select a plan again.');
			navigate('/recharge/mobile', { replace: true });
		}
	}, [formData, plan, navigate, showError]);

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
	useEffect(() => {
		if (isFetchingBalanceRef.current) return;

		const fetchBalance = async () => {
			isFetchingBalanceRef.current = true;
			setCheckingWallet(true);
			try {
				const response = await getWalletBalance();
				if (response.success) {
					// Use smartWalletBalance for recharge (added money only, not mixed with active/passive income)
					setWalletBalance(response.smartWalletBalance ?? response.balance ?? 0);
				}
			} catch (error) {
				console.error('Error fetching wallet balance:', error);
			} finally {
				setCheckingWallet(false);
				isFetchingBalanceRef.current = false;
			}
		};

		fetchBalance();
	}, []);

	// Check for recharge success/failure from callback URL
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const status = urlParams.get('status');
		const rechargeId = urlParams.get('rechargeId');

		if (status === 'success' && rechargeId) {
			showSuccess(`🎉 Recharge successful! Your mobile number has been recharged successfully.`);
			// Clear URL params
			window.history.replaceState({}, document.title, window.location.pathname);
			// Navigate back to mobile recharge page after showing success
			setTimeout(() => {
				navigate('/recharge/mobile', { replace: true });
			}, 3000);
		} else if (status === 'failed' || status === 'refunded') {
			showError('Recharge failed. Your payment has been refunded.');
			window.history.replaceState({}, document.title, window.location.pathname);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const discountDetails = useMemo(() => {
		const planAmt = parseFloat(formData?.amount || plan?.amount || plan?.price || 0) || 0;

		if (!planAmt) {
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
				net: planAmt,
			};
		}

		if (formData?.discountDetails) {
			return {
				amount: formData.discountDetails.amount ?? 0,
				percentage: formData.discountDetails.percentage ?? 0,
				net: formData.discountDetails.net ?? planAmt,
			};
		}

		const discountRate = operatorDiscountRates[formData?.operator] ?? 0;
		const discountAmt = Math.round(((planAmt * discountRate) / 100) * 100) / 100;
		const netAmt = Math.max(Math.round((planAmt - discountAmt) * 100) / 100, 0);

		return {
			amount: discountAmt,
			percentage: discountRate,
			net: netAmt,
		};
	}, [formData, plan, isActiveMember]);

	const planAmount = useMemo(() => {
		const parsed = parseFloat(plan?.amount ?? plan?.price ?? plan?.rechargeAmount ?? formData?.amount ?? 0);
		return Number.isNaN(parsed) ? 0 : parsed;
	}, [plan, formData]);

	const netPayable = useMemo(() => {
		const net = discountDetails?.net ?? planAmount;
		return Number.isNaN(net) ? planAmount : net;
	}, [discountDetails, planAmount]);

	const isProcessing = loading || checkingWallet || checkingKyc;

	const isWalletSufficient = useMemo(() => {
		if (walletBalance === null || walletBalance === undefined) return true;
		return walletBalance >= netPayable;
	}, [walletBalance, netPayable]);

	const handlePayClick = () => {
		if (isProcessing || !isWalletSufficient || checkingKyc) {
			return;
		}

		// Check KYC first
		const isKycVerified = kycStatus?.status === 'approved' || user?.kycApprovedDate;
		if (!isKycVerified) {
			showError('KYC verification required! Please complete your KYC verification to proceed with mobile recharge.');
			setTimeout(() => {
				navigate('/kyc');
			}, 1500);
			return;
		}

		// Show confirmation modal
		setShowConfirmModal(true);
	};

	const handleConfirmPayment = () => {
		setShowConfirmModal(false);
		// Show confirmation state briefly, then process payment
		setIsConfirming(true);
		setTimeout(() => {
			handlePayment();
		}, 300);
	};

	// Handle payment initiation
	const handlePayment = async () => {
		setIsConfirming(false);

		const rechargeAmount = parseFloat(formData?.amount || plan?.amount || plan?.price || 0);

		if (!rechargeAmount || rechargeAmount <= 0) {
			showError('Please enter a valid amount');
			return;
		}

		const netPayableAmount =
			discountDetails.net && discountDetails.net > 0
				? discountDetails.net
				: rechargeAmount;

		// Check wallet balance - use already fetched balance
		if (walletBalance === null) {
			showError('Unable to verify wallet balance. Please refresh the page.');
			return;
		}

		if (walletBalance < netPayableAmount) {
			showError(
				`Insufficient wallet balance. Available: ₹${walletBalance.toFixed(2)}, Required: ₹${netPayableAmount.toFixed(2)}`
			);
			return;
		}

		// For postpaid, ensure bill is fetched and has reference
		if (formData?.rechargeType === 'postpaid') {
			if (!formData?.billDetails || Object.keys(formData.billDetails).length === 0) {
				showError('Please fetch the latest bill before making a payment.');
				return;
			}

			// Ensure bill has a reference ID
			const billDetails = formData.billDetails;
			if (!billDetails.bill_id && !billDetails.transaction_id && !billDetails.billId) {
				showError('Bill reference is missing. Please fetch the bill again.');
				return;
			}
		}

		setLoading(true);
		try {
			const rechargeData = {
				mobileNumber: formData.mobileNumber,
				operator: formData.operator,
				amount: rechargeAmount,
				rechargeType: formData.rechargeType,
				planId: plan?.planId || plan?.id || '',
				planDescription: plan?.description || plan?.name || '',
				paymentMethod: 'wallet',
				billDetails: formData.billDetails || {},
			};

			// Prioritize numeric code for backend (as per A1Topup API requirement)
			// Backend will use numeric code if available, otherwise fallback to text code or value
			if (formData.circleInfo) {
				// Always send the circle value (for backend mapping)
				rechargeData.circle = formData.circleInfo.value;

				// Send label for display purposes
				if (formData.circleInfo.label) {
					rechargeData.circleLabel = formData.circleInfo.label;
				}

				// Send numeric code (backend prioritizes this)
				if (formData.circleInfo.numericCode) {
					rechargeData.circleNumeric = formData.circleInfo.numericCode;
					rechargeData.circleCode = formData.circleInfo.numericCode; // Also send as circleCode for compatibility
				}

				// Send text code as fallback
				if (formData.circleInfo.textCode && !formData.circleInfo.numericCode) {
					rechargeData.circleCode = formData.circleInfo.textCode;
				}
			} else if (formData.circle) {
				// Fallback: if we have circle but no circleInfo, send as-is
				rechargeData.circle = formData.circle;
			}

			const response = await initiateRecharge(rechargeData);

			if (response.success && response.data) {
				showSuccess('Recharge initiated from wallet! We will update you shortly.');
				if (response.data.rechargeId) {
					// Navigate to success page with recharge data
					navigate(`/recharge/success?rechargeId=${response.data.rechargeId}`, {
						state: {
							formData: formData,
						},
					});
				} else {
					setTimeout(() => {
						navigate('/recharge/mobile', { replace: true });
					}, 2000);
				}
			} else {
				// Use the error message from backend response
				const errorMsg = response.message || response.error || 'Failed to initiate recharge';
				console.error('Recharge error response:', response);
				setErrorMessage(errorMsg);
				showError(errorMsg);
				// Auto-hide error after 8 seconds
				setTimeout(() => setErrorMessage(null), 8000);
			}
		} catch (error) {
			// Extract error message from error response
			// The service throws error.response?.data, so error itself is the response data
			console.error('Recharge error caught (full error):', error);

			// Try multiple paths to get the error message
			let errorMsg = 'An error occurred while processing your recharge';

			// Since service throws error.response?.data, error should be the response data object
			if (error && typeof error === 'object') {
				if (error.message) {
					errorMsg = error.message;
				} else if (error.error) {
					errorMsg = error.error;
				} else if (error.response?.data?.message) {
					errorMsg = error.response.data.message;
				} else if (error.response?.message) {
					errorMsg = error.response.message;
				}
			} else if (typeof error === 'string') {
				errorMsg = error;
			}

			console.error('Final error message to display:', errorMsg);
			// Show error in component and toast
			setErrorMessage(errorMsg);
			showError(errorMsg);
			// Auto-hide error after 8 seconds
			setTimeout(() => setErrorMessage(null), 8000);
		} finally {
			setLoading(false);
		}
	};

	if (!formData || !plan) {
		return null;
	}

	return (
		<div className="min-h-screen bg-gray-50 py-5 px-4 mt-14">
			<div className="max-w-md mx-auto space-y-4">
				<button
					onClick={() => navigate('/recharge/mobile')}
					className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
				>
					<ArrowLeft className="w-4 h-4" />
					Back
				</button>

				{/* Error Message Banner */}
				{errorMessage && (
					<div className="bg-red-500 text-white rounded-lg p-4 shadow-lg">
						<div className="flex items-center gap-3">
							<AlertCircle className="w-5 h-5 flex-shrink-0" />
							<p className="flex-1 text-sm font-medium">{errorMessage}</p>
							<button
								onClick={() => setErrorMessage(null)}
								className="flex-shrink-0 hover:opacity-70 transition"
							>
								<X className="w-4 h-4" />
							</button>
						</div>
					</div>
				)}

				<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
					<div className="p-5 space-y-4">
						<div className="space-y-1">
							<div className="flex items-center justify-between">
								<p className="text-xs uppercase tracking-wide text-gray-400">Plan amount</p>
								{isActiveMember && discountDetails.percentage > 0 && (
									<span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
										{discountDetails.percentage}% OFF
									</span>
								)}
							</div>
							<div className="flex items-center gap-1 text-4xl font-semibold text-gray-900">
								<IndianRupee className="w-5 h-5" />
								{planAmount.toFixed(2)}
							</div>
						</div>

						{(plan?.validity || plan?.benefits) && (
							<div className="space-y-1 text-sm text-gray-600">
								{plan?.validity && (
									<div className="flex items-center gap-2">
										<Sparkles className="w-4 h-4 text-orange-500" />
										<span>{plan.validity}</span>
									</div>
								)}
								{plan?.benefits && <p>{plan.benefits}</p>}
							</div>
						)}
					</div>

					<div className="px-5 pb-5 border-t border-gray-100">
						<div className="space-y-2 text-sm text-gray-600">
							<div className="flex justify-between">
								<span>Price</span>
								<span>₹{planAmount.toFixed(2)}</span>
							</div>
							<div className="flex justify-between">
								<span>Discount ({isActiveMember ? discountDetails.percentage || 0 : 0}%)</span>
								<span className={isActiveMember && discountDetails.amount > 0 ? 'text-green-600' : 'text-gray-500'}>
									{isActiveMember && discountDetails.amount > 0 ? `-₹${discountDetails.amount.toFixed(2)}` : '₹0.00'}
								</span>
							</div>
							<div className="flex justify-between">
								<span>Convenience fee</span>
								<span className="text-gray-500">₹0.00</span>
							</div>
							<div className="flex justify-between">
								<span>Payment method</span>
								<span className="text-gray-700 font-medium">Wallet</span>
							</div>
							<div className="flex justify-between">
								<span>Estimated cashback</span>
								<span className="text-gray-500">
									{isActiveMember && discountDetails.amount > 0
										? `≈ ${discountDetails.percentage || 0}% (${discountDetails.amount ? `₹${discountDetails.amount.toFixed(2)}` : '₹0.00'})`
										: 'Active members only'}
								</span>
							</div>
						</div>

						<div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3">
							<span className="text-sm font-semibold text-gray-700">You pay</span>
							<span className="text-2xl font-semibold text-gray-900">₹{netPayable.toFixed(2)}</span>
						</div>

						{!isActiveMember && (
							<div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-800">
								<AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
								<div className="space-y-1">
									<p className="text-sm font-semibold text-amber-900">Cashback locked for free users</p>
									<p>Buy any Package or Super Package to unlock % cashback on every recharge. Until then, platform fees stay waived and you simply pay the plan price.</p>
								</div>
							</div>
						)}

						<ul className="mt-3 text-xs text-gray-500 space-y-1">
							<li>• Instant status updates after payment</li>
							<li>• Wallet protection in case of provider failure</li>
							<li>• Eligible for commission distribution automatically</li>
						</ul>
					</div>

					<div className="p-5 space-y-4 border-t border-gray-100">
						{walletBalance !== null && (
							<div className="text-sm flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
								<span className="text-gray-500">Wallet balance</span>
								<span className={isWalletSufficient ? 'text-green-600 font-semibold' : 'text-red-600'}>
									₹{walletBalance.toFixed(2)}
								</span>
							</div>
						)}

						<button
							onClick={handlePayClick}
							disabled={isProcessing || !isWalletSufficient || checkingKyc}
							className={`w-full rounded-xl py-3 font-semibold transition-all ${isProcessing || isConfirming
								? 'bg-orange-400 text-white'
								: isWalletSufficient && !checkingKyc
									? 'bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg'
									: 'bg-gray-200 text-gray-500 cursor-not-allowed'
								}`}
						>
							{isProcessing
								? 'Processing...'
								: isConfirming
									? 'Confirming...'
									: isWalletSufficient
										? `Pay ₹${netPayable.toFixed(2)}`
										: 'Insufficient balance'}
						</button>
					</div>
				</div>

				<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-sm text-gray-600 space-y-2">
					<div className="flex justify-between">
						<span className="text-gray-500">Mobile</span>
						<span className="font-medium text-gray-800">{formData.mobileNumber}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-gray-500">Operator</span>
						<span className="font-medium text-gray-800">{formData.operator}</span>
					</div>
					{formData.circleInfo?.label && (
						<div className="flex justify-between">
							<span className="text-gray-500">Circle</span>
							<span className="font-medium text-gray-800">{formData.circleInfo.label}</span>
						</div>
					)}
					<div className="flex justify-between">
						<span className="text-gray-500">Type</span>
						<span className="font-medium text-gray-800">
							{formData.rechargeType === 'postpaid' ? 'Postpaid' : 'Prepaid'}
						</span>
					</div>
				</div>
			</div>

			{/* Confirmation Modal Popup */}
			{showConfirmModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200">
						<div className="p-6">
							<div className="flex items-center gap-3 mb-4">
								<div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
									<AlertCircle className="w-6 h-6 text-red-600" />
								</div>
								<h3 className="text-xl font-bold text-gray-800">Confirm Your Recharge</h3>
							</div>

							<div className="space-y-3 mb-6">
								<p className="text-sm text-gray-600">
									Please verify the details before proceeding with payment:
								</p>
								
								<div className="bg-gray-50 rounded-xl p-4 space-y-2">
									<div className="flex justify-between items-center">
										<span className="text-sm text-gray-600">Mobile Number:</span>
										<span className="text-sm font-semibold text-gray-800">{formData.mobileNumber}</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm text-gray-600">Operator:</span>
										<span className="text-sm font-semibold text-gray-800">{formData.operator}</span>
									</div>
									{formData.circleInfo?.label && (
										<div className="flex justify-between items-center">
											<span className="text-sm text-gray-600">Circle:</span>
											<span className="text-sm font-semibold text-gray-800">{formData.circleInfo.label}</span>
										</div>
									)}
									<div className="flex justify-between items-center pt-2 border-t border-gray-200">
										<span className="text-sm font-medium text-gray-700">Amount to Pay:</span>
										<span className="text-lg font-bold text-orange-600">₹{netPayable.toFixed(2)}</span>
									</div>
								</div>

								<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
									<p className="text-xs text-blue-800">
										<strong>Note:</strong> Once confirmed, the amount will be deducted from your wallet balance.
									</p>
								</div>
							</div>

							<div className="flex gap-3">
								<button
									onClick={() => setShowConfirmModal(false)}
									className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={handleConfirmPayment}
									className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white font-semibold hover:shadow-lg transition-all"
								>
									Confirm & Pay
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default PlanConfirmation;

