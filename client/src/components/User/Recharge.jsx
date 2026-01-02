import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowRight, X, Headphones, Wallet, Plus, Send, Eye, RefreshCw, Loader2, AlertCircle, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WalletTopUpVerificationForm from './WalletTopUpVerificationForm';
import api, { API_ENDPOINTS } from '../../config/api';
import useToast from '../../hooks/useToast';
import { useAuthStore } from '../../store/useAuthStore';
import LoginPrompt from '../UI/LoginPrompt';
import { transferSuperWallet } from '../../services/rechargeService';

// Recharge Imports
import MobileRecharge from '../../assets/RechargeAndBillPayment/MobileRecharge.png';
import DTHRecharge from '../../assets/RechargeAndBillPayment/DTHRecharge.jpeg';
import ElectricityRecharge from '../../assets/RechargeAndBillPayment/Electricity.jpeg';
import GooglePayRecharge from '../../assets/RechargeAndBillPayment/GoglePlayRecharge.png';
import FASTagRecharge from '../../assets/RechargeAndBillPayment/Fastag.jpeg';
import LandlineRecharge from '../../assets/RechargeAndBillPayment/LandLine.jpeg';

// Bill Payment Imports
import InsurancePremium from '../../assets/RechargeAndBillPayment/InsurancePremium.jpeg';
import CreditCardBillPayment from '../../assets/RechargeAndBillPayment/CreditCardBillPayment.png';
import LPG from "../../assets/RechargeAndBillPayment/LPG.png";
import Broadband from "../../assets/RechargeAndBillPayment/Broadband.png";
import LoanRepayment from "../../assets/RechargeAndBillPayment/LoanRepayment.png";
import CableTV from "../../assets/RechargeAndBillPayment/CableTV.png";
import EducationFees from "../../assets/RechargeAndBillPayment/EducationFees.png";
import WaterBill from '../../assets/RechargeAndBillPayment/WaterBill.jpeg';
// import HospitalBill from '../../assets/RechargeAndBillPayment/HospitalBill.jpeg';
import Municipality from '../../assets/RechargeAndBillPayment/MunicipalTax.png';

// Travel Imports
import FlightBooking from '../../assets/RechargeAndBillPayment/FlightBooking.png';
import BusTicketBooking from '../../assets/RechargeAndBillPayment/BusTickets.png';
import TrainBooking from '../../assets/RechargeAndBillPayment/TrainBooking.png';
import Ola from '../../assets/RechargeAndBillPayment/olaBooking.png';
import Uber from "../../assets/RechargeAndBillPayment/UberBooking.png"

const tilesBase = "flex items-center justify-between w-full p-4 rounded-xl border shadow-sm hover:shadow-md transition cursor-pointer";

const Recharge = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { user } = useAuthStore();
    const userId = user?.userId;
    const [comingSoon, setComingSoon] = useState({ open: false, section: '', label: '' });
    const [showAddMoneyForm, setShowAddMoneyForm] = useState(false);
    const [smartWalletBalance, setSmartWalletBalance] = useState(0);
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [sendMoneyModal, setSendMoneyModal] = useState({ open: false, mobile: '', amount: '', note: '' });
    const [sendingMoney, setSendingMoney] = useState(false);
    const [sendMoneyError, setSendMoneyError] = useState('');
    const [sendMoneySuccess, setSendMoneySuccess] = useState('');
    const rechargeServices = [
        { key: 'mobile', label: 'Mobile', icon: MobileRecharge, color: 'text-blue-600', border: 'border-blue-200', bg: 'bg-blue-50 hover:bg-blue-100' },
        { key: 'dth', label: 'DTH', icon: DTHRecharge, color: 'text-purple-600', border: 'border-purple-200', bg: 'bg-purple-50 hover:bg-purple-100' },
        { key: 'fastag', label: 'FASTag', icon: FASTagRecharge, color: 'text-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50 hover:bg-emerald-100' },
        { key: 'google-play', label: 'Google Play Recharge', icon: GooglePayRecharge, color: 'text-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50 hover:bg-emerald-100' },
    ];

    const billPaymentServices = [
        { key: 'electricity', label: 'Electricity', icon: ElectricityRecharge, color: 'text-yellow-600', border: 'border-yellow-200', bg: 'bg-yellow-50 hover:bg-yellow-100' },
        { key: 'insurance', label: 'Insurance Premium', icon: InsurancePremium, color: 'text-indigo-600', border: 'border-indigo-200', bg: 'bg-indigo-50 hover:bg-indigo-100' },
        { key: 'credit-card', label: 'Credit Card Bill', icon: CreditCardBillPayment, color: 'text-rose-600', border: 'border-rose-200', bg: 'bg-rose-50 hover:bg-rose-100' },
        { key: 'lpg', label: 'LPG', icon: LPG, color: 'text-orange-600', border: 'border-orange-200', bg: 'bg-orange-50 hover:bg-orange-100' },
        { key: 'broadband', label: 'Broadband', icon: Broadband, color: 'text-sky-600', border: 'border-sky-200', bg: 'bg-sky-50 hover:bg-sky-100' },
        { key: 'loan', label: 'Loan Repayment', icon: LoanRepayment, color: 'text-purple-600', border: 'border-purple-200', bg: 'bg-purple-50 hover:bg-purple-100' },
        { key: 'cable', label: 'Cable TV', icon: CableTV, color: 'text-indigo-600', border: 'border-indigo-200', bg: 'bg-indigo-50 hover:bg-indigo-100' },
        { key: 'landline', label: 'Landline', icon: LandlineRecharge, color: 'text-pink-600', border: 'border-pink-200', bg: 'bg-pink-50 hover:bg-pink-100' },
        { key: 'education', label: 'Education Fees', icon: EducationFees, color: 'text-amber-600', border: 'border-amber-200', bg: 'bg-amber-50 hover:bg-amber-100' },
        { key: 'water', label: 'Water Bill', icon: WaterBill, color: 'text-sky-600', border: 'border-sky-200', bg: 'bg-sky-50 hover:bg-sky-100' },
        // { key: 'hospital', label: 'Hospital Bill', icon: Hospital, color: 'text-rose-600', border: 'border-rose-100', bg: 'hover:bg-rose-50' },
        { key: 'municipality', label: 'Municipality', icon: Municipality, color: 'text-amber-600', border: 'border-amber-200', bg: 'bg-amber-50 hover:bg-amber-100' },
    ];

    // Travel services
    const travelServices = [
        { key: 'flight', label: 'Flight', icon: FlightBooking, border: 'border-blue-200', bg: 'bg-blue-50 hover:bg-blue-100' },
        { key: 'bus', label: 'Bus Ticket', icon: BusTicketBooking, border: 'border-green-200', bg: 'bg-green-50 hover:bg-green-100' },
        { key: 'train', label: 'Trains', icon: TrainBooking, border: 'border-purple-200', bg: 'bg-purple-50 hover:bg-purple-100' },
        { key: "Ola", label: "Ola", icon: Ola, border: 'border-red-200', bg: 'bg-red-50 hover:bg-red-100' },
        { key: "Uber", label: "Uber", icon: Uber, border: 'border-red-200', bg: 'bg-red-50 hover:bg-red-100' },
    ];

    // Fetch wallet balance
    const isFetchingWalletRef = useRef(false);

    const fetchWalletBalance = useCallback(async () => {
        if (!userId || isFetchingWalletRef.current) return;

        isFetchingWalletRef.current = true;
        setLoadingBalance(true);
        try {
            const response = await api.get(API_ENDPOINTS.payout.balance);
            if (response.data.success) {
                const apiSmartBalance = Number(response.data.smartWalletBalance ?? response.data.balance ?? 0);
                setSmartWalletBalance(apiSmartBalance);
            }
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
        } finally {
            setLoadingBalance(false);
            isFetchingWalletRef.current = false;
        }
    }, [userId]);

    useEffect(() => {
        fetchWalletBalance();

        const handleWindowFocus = () => {
            fetchWalletBalance();
        };

        window.addEventListener('focus', handleWindowFocus);

        return () => {
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [fetchWalletBalance]);

    const handleAddMoneySuccess = () => {
        setShowAddMoneyForm(false);
        showSuccess('Wallet top-up request submitted successfully! Admin will review and approve your request.');
        // Refresh balance after a short delay to allow admin to approve
        setTimeout(() => {
            fetchWalletBalance();
        }, 2000);
    };

    const handleAddMoneyClick = () => {
        setShowAddMoneyForm(true);
    };

    const handleOpenSendMoney = () => {
        setSendMoneyError('');
        setSendMoneySuccess('');
        setSendMoneyModal({ open: true, mobile: '', amount: '', note: '' });
    };

    const handleSendMoney = async () => {
        if (sendingMoney) return;

        const trimmedMobile = sendMoneyModal.mobile.replace(/\D/g, '');
        const amountValue = Number(sendMoneyModal.amount);
        const note = (sendMoneyModal.note || '').trim();

        if (!trimmedMobile || trimmedMobile.length !== 10) {
            setSendMoneyError('Enter a valid 10-digit mobile number for the recipient.');
            return;
        }

        if (!Number.isFinite(amountValue) || amountValue <= 0) {
            setSendMoneyError('Enter a valid transfer amount greater than ₹0.');
            return;
        }

        if (amountValue > smartWalletBalance) {
            setSendMoneyError('Insufficient Super Wallet balance for this transfer.');
            return;
        }

        setSendingMoney(true);
        setSendMoneyError('');
        setSendMoneySuccess('');
        try {
            const response = await transferSuperWallet({
                recipientMobile: trimmedMobile,
                amount: amountValue,
                note,
            });

            if (response?.success) {
                setSendMoneySuccess(response.message || 'Transfer successful.');
                setSmartWalletBalance(response.balance ?? smartWalletBalance - amountValue);
                fetchWalletBalance();
                setTimeout(() => {
                    setSendMoneyModal({ open: false, mobile: '', amount: '', note: '' });
                    setSendMoneySuccess('');
                }, 900);
            }
        } catch (error) {
            setSendMoneyError(error?.message || 'Failed to transfer. Please try again.');
        } finally {
            setSendingMoney(false);
        }
    };

    const handleViewBalance = () => {
        const formattedSmart = smartWalletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        showSuccess(`Smart wallet (added money): ₹${loadingBalance ? '...' : formattedSmart}`);
    };

    const onSelectService = (section, service) => {
        if (service.key === 'mobile') {
            navigate('/recharge/mobile');
            return;
        }
        if (service.key === 'dth') {
            navigate('/recharge/dth');
            return;
        }
        setComingSoon({ open: true, section, label: service.label });
        // Scroll to top when modal opens to ensure it's visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Show login prompt if user is not authenticated
    if (!user) {
        return <LoginPrompt type="recharge" />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-orange-100 pt-24 pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Recharge & Bill Payments</h1>
                <p className="text-gray-600 mb-6">Select a service to get started.</p>
                <div className="overflow-hidden bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-orange-100">
                    {/* Gradient header */}
                    <div className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 p-5 sm:p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow">
                                <span className="text-white text-lg font-extrabold">₹</span>
                            </div>
                            <div>
                                <h2 className="text-white text-lg sm:text-xl font-extrabold tracking-wide">Recharge & Bill Payments</h2>
                                <p className="text-white/90 text-xs sm:text-sm">Choose a service to begin your quick payment</p>
                            </div>
                        </div>
                    </div>

                    {/* Content: separate sections */}
                    <div className="p-4 sm:p-6">
                        {/* Trust strip */}
                        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-amber-600 font-bold">
                                    <Headphones className="w-3.5 h-3.5 text-purple-600" />
                                </span>
                                <span className="text-[12px] font-semibold text-purple-700">24/7 Support</span>
                            </div>
                        </div>

                        {/* Wallet Options */}
                        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button
                                onClick={handleAddMoneyClick}
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Add Money</span>
                            </button>
                            <button
                                onClick={handleOpenSendMoney}
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg transition-all"
                            >
                                <Send className="w-5 h-5" />
                                <span>Send Money</span>
                            </button>
                            <button
                                onClick={() => {
                                    fetchWalletBalance();
                                    handleViewBalance();
                                }}
                                disabled={loadingBalance}
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {loadingBalance ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Eye className="w-5 h-5" />
                                        <span>Wallet Balance</span>
                                    </>
                                )}
                            </button>
                        </div>
                        {/* Smart Wallet Display */}
                        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-purple-600" />
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">YesITryMe Smart Wallet</span>
                                        <p className="text-xs text-gray-500">(Added Money)</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xl font-bold text-purple-600">
                                        ₹{loadingBalance ? '...' : smartWalletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <button
                                        onClick={fetchWalletBalance}
                                        disabled={loadingBalance}
                                        className="p-2 rounded-lg bg-purple-100 hover:bg-purple-200 transition-colors disabled:opacity-50"
                                        title="Refresh balance"
                                    >
                                        <RefreshCw className={`w-4 h-4 text-purple-600 ${loadingBalance ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <h2 className="text-sm font-semibold text-gray-700 mb-3">Recharge</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-8">
                            {rechargeServices.map(s => {
                                const badgeText = s.key === 'mobile' ? '0-1% off' : s.key === 'dth' ? '1% off' : '0% off';
                                const badgeColor = s.key === 'mobile'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : s.key === 'dth'
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-gray-50 text-gray-700 border-gray-200';
                                return (
                                    <button key={s.key} onClick={() => onSelectService('Recharge', s)} className={`relative ${tilesBase} ${s.border} ${s.bg}`}>
                                        {/* Left content */}
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-10 h-10 rounded-lg bg-white/70 border border-gray-100 flex items-center justify-center overflow-hidden">
                                                <img src={s.icon} alt={s.label} className="w-6 h-6 object-contain" />
                                            </div>
                                            <div className="text-left">
                                                <span className="block text-sm font-semibold text-gray-800">{s.label}</span>
                                                <span className="block text-[11px] text-gray-500">Instant & secure</span>
                                            </div>
                                        </div>
                                        {/* Center badge between label and arrow (visible on sm+) */}
                                        <div className="hidden sm:flex flex-1 justify-center">
                                            <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>{badgeText}</span>
                                        </div>
                                        {/* Right arrow */}
                                        <ArrowRight className="w-4 h-4 text-gray-400" />
                                    </button>
                                );
                            })}
                        </div>

                        <h2 className="text-sm font-semibold text-gray-700 mb-3">Bill Payments</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                            {billPaymentServices.map(s => (
                                <button key={s.key} onClick={() => onSelectService('Bill Payment', s)} className={`relative ${tilesBase} ${s.border} ${s.bg}`}>
                                    {/* Left content */}
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-10 h-10 rounded-lg bg-white/70 border border-gray-100 flex items-center justify-center overflow-hidden">
                                            <img src={s.icon} alt={s.label} className="w-6 h-6 object-contain" />
                                        </div>
                                        <div className="text-left">
                                            <span className="block text-sm font-semibold text-gray-800">{s.label}</span>
                                            <span className="block text-[11px] text-gray-500">Hassle-free payments</span>
                                        </div>
                                    </div>
                                    {/* Center badge between label and arrow (visible on sm+) */}
                                    <div className="hidden sm:flex flex-1 justify-center">
                                        <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200">0% off</span>
                                    </div>
                                    {/* Right arrow */}
                                    <ArrowRight className="w-4 h-4 text-gray-400" />
                                </button>
                            ))}
                        </div>

                        {/* Travel */}
                        <h2 className="text-sm font-semibold text-gray-700 mt-10 mb-3">Travel</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                            {travelServices.map(s => (
                                <button key={s.key} onClick={() => {
                                    setComingSoon({ open: true, section: 'Travel', label: s.label });
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }} className={`relative ${tilesBase} ${s.border} ${s.bg}`}>
                                    {/* Left content */}
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-10 h-10 rounded-lg bg-white/70 border border-gray-100 flex items-center justify-center overflow-hidden">
                                            <img src={s.icon} alt={s.label} className="w-6 h-6 object-contain" />
                                        </div>
                                        <div className="text-left">
                                            <span className="block text-sm font-semibold text-gray-800">{s.label}</span>
                                            <span className="block text-[11px] text-gray-500">Book in minutes</span>
                                        </div>
                                    </div>
                                    {/* Center badge between label and arrow (visible on sm+) */}
                                    <div className="hidden sm:flex flex-1 justify-center">
                                        <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200">0% off</span>
                                    </div>
                                    {/* Right arrow */}
                                    <ArrowRight className="w-4 h-4 text-gray-400" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Coming Soon Modal - Moved outside container for proper positioning */}
            {comingSoon.open && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-orange-100 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800">Coming Soon</h3>
                            <button
                                onClick={() => setComingSoon({ open: false, section: '', label: '' })}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5">
                            <p className="text-gray-700 text-sm leading-relaxed">
                                <span className="font-semibold text-orange-600">{comingSoon.section}</span> → <span className="font-semibold text-gray-900">{comingSoon.label}</span> is under development. We are working hard to bring this service to you soon.
                            </p>
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={() => setComingSoon({ open: false, section: '', label: '' })}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white text-sm font-semibold hover:shadow-md transition-all"
                                >
                                    Okay
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Money Form Modal */}
            {showAddMoneyForm && (
                <WalletTopUpVerificationForm
                    onClose={() => setShowAddMoneyForm(false)}
                    onSuccess={handleAddMoneySuccess}
                />
            )}

            {/* Send Money Modal */}
            {sendMoneyModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-blue-100">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-bold text-gray-800">Send Money (Super Wallet)</h3>
                            <button
                                onClick={() => {
                                    setSendMoneyModal({ open: false, mobile: '', amount: '', note: '' });
                                    setSendMoneyError('');
                                    setSendMoneySuccess('');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-blue-800">
                                Available Super Wallet: <span className="font-bold">₹{smartWalletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Recipient Mobile (10 digits)</label>
                                <input
                                    type="tel"
                                    value={sendMoneyModal.mobile}
                                    onChange={(e) => setSendMoneyModal({ ...sendMoneyModal, mobile: e.target.value })}
                                    placeholder="Enter recipient mobile number"
                                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Amount (₹)</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={sendMoneyModal.amount}
                                    onChange={(e) => setSendMoneyModal({ ...sendMoneyModal, amount: e.target.value })}
                                    placeholder="Enter amount"
                                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Note (optional)</label>
                                <textarea
                                    value={sendMoneyModal.note}
                                    onChange={(e) => setSendMoneyModal({ ...sendMoneyModal, note: e.target.value })}
                                    placeholder="Add a note for the recipient"
                                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    rows={2}
                                />
                            </div>
                            {sendMoneyError && (
                                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5" />
                                    <span>{sendMoneyError}</span>
                                </div>
                            )}
                            {sendMoneySuccess && (
                                <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg p-3 flex items-start gap-2">
                                    <Check className="w-4 h-4 mt-0.5" />
                                    <span>{sendMoneySuccess}</span>
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setSendMoneyModal({ open: false, mobile: '', amount: '', note: '' });
                                        setSendMoneyError('');
                                        setSendMoneySuccess('');
                                    }}
                                    className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 transition-colors"
                                    disabled={sendingMoney}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendMoney}
                                    disabled={sendingMoney}
                                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow disabled:opacity-70 flex items-center gap-2"
                                >
                                    {sendingMoney && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <span>{sendingMoney ? 'Transferring...' : 'Send Money'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recharge;