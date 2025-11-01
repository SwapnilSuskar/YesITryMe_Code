import { useEffect, useMemo, useState } from 'react';
import { Smartphone, Building, Globe2, IndianRupee, Search, ArrowLeft, Headphones, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PhonePay from "../../assets/RechargesLogo/PhonePay.webp"
import GooglePay from "../../assets/RechargesLogo/Gpay.png"
import { fetchRechargePlans, initiateRecharge } from '../../services/rechargeService';
import useToast from '../../hooks/useToast';

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

	// India mobile validation: must be 10 digits and start with 6-9
	const isMobileValid = useMemo(() => /^[6-9]\d{9}$/.test(mobile), [mobile]);
	const canShowAmount = isMobileValid && operator && circle;

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

	// Determine recharge type from operator
	const rechargeType = useMemo(() => {
		if (operator && operator.toLowerCase().includes('postpaid')) {
			return 'postpaid';
		}
		return 'prepaid';
	}, [operator]);

	// Fetch plans from API
	const handleBrowsePlans = async () => {
		if (!canShowAmount) {
			showError('Please fill in mobile number, operator, and circle');
			return;
		}

		setBrowsingPlans(true);
		try {
			const response = await fetchRechargePlans(mobile, operator, circle, rechargeType);
			if (response.success && response.data) {
				setPlans(response.data);
				showSuccess('Plans loaded successfully');
			} else {
				showError(response.message || 'No plans found');
			}
		} catch (error) {
			console.error('Error fetching plans:', error);
			showError(error.message || 'Failed to fetch plans');
		} finally {
			setBrowsingPlans(false);
		}
	};

	// Handle plan selection
	const handleSelectPlan = (plan) => {
		setSelectedPlan(plan);
		setAmount(plan.amount || plan.price || '');
		setPlans([]); // Close plans list
	};

	// Handle payment initiation
	const handlePayment = async (paymentMethod) => {
		if (!amount || parseFloat(amount) <= 0) {
			showError('Please enter a valid amount');
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
				paymentMethod: paymentMethod === 'phonepe' ? 'phonepe' : 'google_pay',
			};

			const response = await initiateRecharge(rechargeData);

			if (response.success && response.data) {
				showSuccess(`💳 Payment initiated! Redirecting to ${paymentMethod === 'phonepe' ? 'PhonePe' : 'Google Pay'}...`);
				if (response.data.paymentUrl) {
					// Small delay to show success message
					setTimeout(() => {
						window.location.href = response.data.paymentUrl;
					}, 500);
				} else {
					// Navigate to status page or history
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

						{/* Amount + Browse Plans */}
						{canShowAmount && (
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<div className="sm:col-span-2">
									<label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
									<div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-orange-500/40">
										<IndianRupee className="w-4 h-4 text-gray-400" />
										<input
											type="number"
											min="1"
											value={amount}
											onChange={(e) => setAmount(e.target.value)}
											placeholder="Enter amount"
											className="w-full outline-none text-sm placeholder:text-gray-400"
										/>
									</div>
								</div>
								<div className="flex items-end">
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
								</div>
							</div>
						)}

						{/* Plans List */}
						{plans.length > 0 && (
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

						{/* Payment options */}
						{canShowAmount && amount && parseFloat(amount) > 0 && (
							<div className="mt-4">
								<p className="text-sm text-gray-600 mb-1">Proceed to Recharge</p>
								<p className="text-[11px] text-gray-500 mb-3">We never store your UPI PIN. 256‑bit TLS encryption.</p>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<button
										onClick={() => handlePayment('phonepe')}
										disabled={loading}
										className="group px-3 py-2 sm:px-4 sm:py-3 rounded-2xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-[12px] sm:text-sm font-semibold flex items-center justify-between gap-2 sm:gap-3 transition w-full disabled:opacity-50 disabled:cursor-not-allowed"
									>
										<div className="flex items-center gap-2 min-w-0">
											<div className="relative w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center shadow-sm overflow-hidden">
												<img src={PhonePay} alt="PhonePe" className="w-4 h-4" />
											</div>
											<span className="text-indigo-800 truncate">PhonePe UPI</span>
										</div>
										{loading ? (
											<Loader2 className="w-4 h-4 text-indigo-700 animate-spin" />
										) : (
											<span className="text-xs text-indigo-700 opacity-80 group-hover:opacity-100">UPI</span>
										)}
									</button>
									<button
										onClick={() => handlePayment('google_pay')}
										disabled={loading}
										className="px-3 py-2 sm:px-4 sm:py-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-[12px] sm:text-sm font-semibold flex items-center justify-between gap-2 sm:gap-3 transition w-full disabled:opacity-50 disabled:cursor-not-allowed"
									>
										<div className="flex items-center gap-2 min-w-0">
											<div className="relative w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center shadow-sm overflow-hidden">
												<img src={GooglePay} alt="GooglePay" className="w-4 h-4" />
											</div>
											<span className="text-emerald-800 truncate">Google Pay</span>
										</div>
										{loading ? (
											<Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
										) : (
											<span className="text-xs text-emerald-700 opacity-80">UPI</span>
										)}
									</button>
								</div>
								<p className="mt-2 text-[11px] text-gray-500">Recharge or 100% refund if operator fails.</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default MobileRecharge;
