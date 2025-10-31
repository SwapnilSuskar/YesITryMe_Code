import { useEffect, useMemo, useState } from 'react';
import { Smartphone, Building, Globe2, IndianRupee, Search, QrCode, ArrowLeft, CreditCard, Headphones } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PhonePay from "../../assets/RechargesLogo/PhonePay.webp"
import GooglePay from "../../assets/RechargesLogo/Gpay.png"

const operators = ['Jio', 'Airtel', 'Vi', 'BSNL'];
const circles = ['Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Karnataka', 'Maharashtra', 'Gujarat', 'UP East', 'UP West'];

const MobileRecharge = () => {
	const navigate = useNavigate();
	const [mobile, setMobile] = useState('');
	const [operator, setOperator] = useState('');
	const [circle, setCircle] = useState('');
	const [amount, setAmount] = useState('');
    const [touched, setTouched] = useState(false);

    // India mobile validation: must be 10 digits and start with 6-9
    const isMobileValid = useMemo(() => /^[6-9]\d{9}$/.test(mobile), [mobile]);
	const canShowAmount = isMobileValid && operator && circle;

	useEffect(() => {
		if (!canShowAmount) {
			setAmount('');
		}
	}, [canShowAmount]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-24 pb-12">
			<div className="max-w-4xl mx-auto px-4 sm:px-6">
				<button onClick={() => navigate('/recharge')} className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600">
					<ArrowLeft className="w-4 h-4" /> Back to Recharge
				</button>
				<div className="overflow-hidden rounded-2xl shadow-xl border border-orange-100 bg-white/80 backdrop-blur-md">
					{/* Gradient Header */}
					<div className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 p-5 sm:p-6">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow">
								<Smartphone className="w-5 h-5 text-white" />
							</div>
							<div>
								<h1 className="text-white text-lg sm:text-xl font-extrabold tracking-wide">Mobile Recharge</h1>
								<p className="text-white/90 text-xs sm:text-sm">Fast, secure and seamless recharges</p>
							</div>
							<div className="ml-auto">
								<Link
									to="/contact"
									className="items-center gap-2 text-[11px] sm:text-xs font-semibold px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition"
								>
									Contact Us
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
                                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0,10))}
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
							<div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-orange-500/40">
								<Building className="w-4 h-4 text-gray-400" />
								<select value={operator} onChange={(e) => setOperator(e.target.value)} className="w-full outline-none text-sm bg-transparent">
									<option value="">Select operator</option>
									{operators.map(op => <option key={op} value={op}>{op}</option>)}
								</select>
							</div>
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
									<button type="button" className="w-full px-4 py-2 rounded-xl border border-orange-200 bg-orange-50/50 hover:bg-orange-100 text-sm font-semibold flex items-center justify-center gap-2 text-orange-700 transition">
										<Search className="w-4 h-4 text-orange-600" /> Browse Plans
									</button>
								</div>
							</div>
						)}

						{/* Payment options */
						}
						{canShowAmount && amount && parseInt(amount, 10) > 0 && (
							<div className="mt-4">
								<p className="text-sm text-gray-600 mb-1">Proceed to Recharge</p>
								<p className="text-[11px] text-gray-500 mb-3">We never store your UPI PIN. 256‑bit TLS encryption.</p>
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                <button className="group px-3 py-2 sm:px-4 sm:py-3 rounded-2xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-[12px] sm:text-sm font-semibold flex items-center justify-between gap-2 sm:gap-3 transition w-full">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="relative w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center shadow-sm overflow-hidden">
                                            <span className="absolute -top-1 -left-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">0% off</span>
												<img src={PhonePay} alt="PhonePe" className="w-4 h-4" />
											</div>
                                        <span className="text-indigo-800 truncate">PhonePe UPI</span>
										</div>
										<span className="text-xs text-indigo-700 opacity-80 group-hover:opacity-100">UPI</span>
									</button>
                                <button className="px-3 py-2 sm:px-4 sm:py-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-[12px] sm:text-sm font-semibold flex items-center justify-between gap-2 sm:gap-3 transition w-full">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="relative w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center shadow-sm overflow-hidden">
                                            <span className="absolute -top-1 -left-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">0% off</span>
												<img src={GooglePay} alt="GooglePay" className="w-4 h-4" />
											</div>
                                        <span className="text-emerald-800 truncate">Google Pay</span>
										</div>
										<span className="text-xs text-emerald-700 opacity-80">UPI</span>
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
