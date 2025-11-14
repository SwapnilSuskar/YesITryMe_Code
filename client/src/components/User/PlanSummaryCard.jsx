import { useEffect, useMemo, useState } from 'react';
import { IndianRupee, Sparkles, Wallet, XCircle } from 'lucide-react';

const PlanSummaryCard = ({
	plan,
	amount,
	discountDetails,
	walletBalance,
	loading,
	checkingWallet,
	onConfirm,
	onReset,
}) => {
	const [sliderValue, setSliderValue] = useState(0);

	useEffect(() => {
		setSliderValue(0);
	}, [plan?.id, plan?.planId, plan?.amount, amount]);

	const planAmount = useMemo(() => {
		const parsed = parseFloat(plan?.amount ?? plan?.price ?? plan?.rechargeAmount ?? amount ?? 0);
		return Number.isNaN(parsed) ? 0 : parsed;
	}, [plan, amount]);
	const netPayable = useMemo(() => {
		const net = discountDetails?.net ?? planAmount;
		return Number.isNaN(net) ? planAmount : net;
	}, [discountDetails, planAmount]);

	const sliderComplete = sliderValue >= 100;
	const isProcessing = loading || checkingWallet;

	const isWalletSufficient = useMemo(() => {
		if (walletBalance === null || walletBalance === undefined) return true;
		return walletBalance >= netPayable;
	}, [walletBalance, netPayable]);

	const handleConfirmClick = () => {
		if (isProcessing || !sliderComplete || !isWalletSufficient) {
			return;
		}
		onConfirm?.();
		setSliderValue(0);
	};

	return (
		<div className="mt-4 space-y-4 rounded-2xl border border-orange-200 bg-orange-50/50 p-5">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-xs uppercase tracking-wide text-orange-500 font-semibold">Selected Plan</p>
					<h3 className="mt-1 text-lg font-bold text-gray-800 flex items-center gap-2">
						<IndianRupee className="w-5 h-5 text-orange-600" />
						{planAmount.toFixed(2)}
					</h3>
				</div>
				<button
					type="button"
					onClick={onReset}
					className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700"
				>
					<XCircle className="w-4 h-4" />
					Change Plan
				</button>
			</div>

			{plan?.validity && (
				<div className="flex items-center gap-2 text-sm text-gray-600">
					<Sparkles className="w-4 h-4 text-orange-500" />
					<span>Validity: {plan.validity}</span>
				</div>
			)}
			{plan?.benefits && (
				<p className="text-xs text-gray-600 leading-relaxed border border-dashed border-orange-200 rounded-lg p-3 bg-white/70">
					{plan.benefits}
				</p>
			)}

			{discountDetails?.percentage > 0 && (
				<div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs sm:text-sm text-emerald-700">
					<div className="flex items-center justify-between">
						<span>Discount ({discountDetails.percentage}%):</span>
						<span>-₹{discountDetails.amount.toFixed(2)}</span>
					</div>
					<div className="flex items-center justify-between mt-1 font-semibold text-emerald-800">
						<span>Payable after discount:</span>
						<span>₹{netPayable.toFixed(2)}</span>
					</div>
				</div>
			)}

			<div className="space-y-2">
				<label className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Slide to confirm payment</label>
				<input
					type="range"
					min="0"
					max="100"
					step="1"
					value={sliderValue}
					onChange={(event) => setSliderValue(Number(event.target.value))}
					className="w-full accent-orange-500"
				/>
				<div className="flex items-center justify-between text-[11px] text-gray-500">
					<span>{sliderValue}% complete</span>
					<span>Slide to 100% to enable payment</span>
				</div>
			</div>

			{walletBalance !== null && walletBalance !== undefined && (
				<div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${isWalletSufficient ? 'border-emerald-200 bg-emerald-50/40 text-emerald-700' : 'border-red-200 bg-red-50/60 text-red-600'}`}>
					<Wallet className="w-4 h-4" />
					<span>
						Wallet Balance: ₹{walletBalance.toFixed(2)}
						{!isWalletSufficient && ` (short by ₹${(netPayable - walletBalance).toFixed(2)})`}
					</span>
				</div>
			)}

			<button
				onClick={handleConfirmClick}
				disabled={!sliderComplete || isProcessing || !isWalletSufficient}
				className="w-full rounded-2xl border border-orange-300 bg-orange-500/90 px-4 py-3 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-orange-500"
			>
				{isProcessing ? 'Processing…' : `Recharge ₹${netPayable.toFixed(2)}`}
			</button>
		</div>
	);
};

export default PlanSummaryCard;
