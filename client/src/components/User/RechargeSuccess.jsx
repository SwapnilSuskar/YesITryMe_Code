import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { CheckCircle, Smartphone, IndianRupee, Clock, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { checkRechargeStatus } from '../../services/rechargeService';
import useToast from '../../hooks/useToast';

const RechargeSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { showError } = useToast();

    const [loading, setLoading] = useState(true);
    const [rechargeData, setRechargeData] = useState(null);
    const rechargeId = searchParams.get('rechargeId') || location.state?.rechargeId;
    const formData = location.state?.formData;

    // Fetch recharge details
    useEffect(() => {
        const fetchRechargeDetails = async () => {
            if (!rechargeId) {
                showError('Recharge ID not found');
                setTimeout(() => navigate('/recharge/mobile'), 2000);
                return;
            }

            try {
                setLoading(true);
                const response = await checkRechargeStatus(rechargeId);
                if (response.success && response.data) {
                    setRechargeData(response.data);
                } else {
                    showError('Failed to fetch recharge details');
                    setTimeout(() => navigate('/recharge/mobile'), 2000);
                }
            } catch (error) {
                console.error('Error fetching recharge details:', error);
                showError('Failed to fetch recharge details');
                setTimeout(() => navigate('/recharge/mobile'), 2000);
            } finally {
                setLoading(false);
            }
        };

        fetchRechargeDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rechargeId]);

    // Calculate cashback from discount or commission
    const amount = rechargeData?.amount || formData?.amount || 0;
    const basePlanAmount =
        rechargeData?.originalAmount ||
        rechargeData?.amountBeforeDiscount ||
        formData?.amountBeforeDiscount ||
        formData?.planAmount ||
        formData?.amount ||
        amount ||
        0;
    const cashbackPercentage = formData?.discountDetails?.percentage || rechargeData?.discountPercentage || 0;
    const cashbackAmount = formData?.discountDetails?.amount || rechargeData?.discountAmount || 0;
    const platformFee = rechargeData?.platformFee || rechargeData?.convenienceFee || 0;
    const totalSavings = cashbackAmount > 0 ? cashbackAmount : Math.max(basePlanAmount - amount, 0);
    const mobileNumber = rechargeData?.mobileNumber || formData?.mobileNumber || '';
    const operator = rechargeData?.operator || formData?.operator || '';
    const rechargeTime = rechargeData?.rechargeCompletedAt || rechargeData?.createdAt || new Date();

    // Format date and time
    const formatDateTime = (date) => {
        if (!date) return 'N/A';
        const d = new Date(date);
        return {
            date: d.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            time: d.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            })
        };
    };

    const dateTime = formatDateTime(rechargeTime);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-24 pb-12 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading recharge details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-24 pb-12">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
                <button
                    onClick={() => navigate('/recharge/mobile')}
                    className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Recharge
                </button>

                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
                    {/* Success Header */}
                    <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-8 text-center">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <CheckCircle className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-white mb-2">🎉 Congratulations!</h1>
                        <p className="text-white/90 text-lg">Your recharge was successful</p>
                    </div>

                    {/* Recharge Details */}
                    <div className="p-6 space-y-6">
                        {/* Recharge Info Card */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-blue-600" />
                                Recharge Information
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Mobile Number</span>
                                    <span className="text-base font-semibold text-gray-800">+91 {mobileNumber}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Operator</span>
                                    <span className="text-base font-semibold text-gray-800">{operator}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Recharge Amount</span>
                                    <span className="text-lg font-bold text-gray-900 flex items-center gap-1">
                                        <IndianRupee className="w-4 h-4" />
                                        {amount.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                                    <span className="text-sm text-gray-600 flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        Recharge Time
                                    </span>
                                    <div className="text-right">
                                        <span className="text-sm font-semibold text-gray-800 block">{dateTime.date}</span>
                                        <span className="text-xs text-gray-600">{dateTime.time}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Cashback Card */}
                        {cashbackPercentage > 0 && (
                            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-200">
                                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-emerald-600" />
                                    Cashback Details
                                </h2>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Cashback Percentage</span>
                                        <span className="text-lg font-bold text-emerald-700">{cashbackPercentage}%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Cashback Amount</span>
                                        <span className="text-xl font-bold text-emerald-700 flex items-center gap-1">
                                            <IndianRupee className="w-5 h-5" />
                                            {cashbackAmount.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="mt-4 p-3 bg-emerald-100/50 rounded-lg border border-emerald-200">
                                        <p className="text-xs text-emerald-800 text-center">
                                            💰 Your cashback will be credited to your wallet shortly
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Savings Summary */}
                        <div className="bg-white rounded-xl p-6 border border-orange-100 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-gray-400">You saved</p>
                                    <p className="text-2xl font-extrabold text-emerald-600 flex items-center gap-1">
                                        <IndianRupee className="w-5 h-5" />
                                        {totalSavings.toFixed(2)}
                                    </p>
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                    <p>Platform discount applied</p>
                                    {cashbackPercentage > 0 && <p className="font-semibold text-gray-800">{cashbackPercentage}% rate</p>}
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>Plan price</span>
                                    <span className="font-semibold text-gray-900">₹{basePlanAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Platform savings</span>
                                    <span className="font-semibold text-emerald-600">- ₹{totalSavings.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Platform fees</span>
                                    <span className="font-semibold text-gray-900">₹{platformFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-t border-dashed border-gray-200 pt-2">
                                    <span className="text-gray-800 font-semibold">Net paid</span>
                                    <span className="text-lg font-bold text-gray-900">₹{(amount + platformFee).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Transaction ID */}
                        {rechargeData?.aiTopUpOrderId && (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Transaction ID</span>
                                    <span className="text-xs font-mono text-gray-700">{rechargeData.aiTopUpOrderId}</span>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button
                                onClick={() => navigate('/recharge/mobile')}
                                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold hover:shadow-lg transition-all"
                            >
                                Recharge Again
                            </button>
                            <button
                                onClick={() => navigate('/recharge')}
                                className="flex-1 px-6 py-3 rounded-xl border-2 border-orange-300 bg-white text-orange-600 font-semibold hover:bg-orange-50 transition-all"
                            >
                                Back to Services
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RechargeSuccess;

