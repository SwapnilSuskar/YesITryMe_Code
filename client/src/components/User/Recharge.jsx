import { useState } from 'react';
import { Smartphone, Tv, Zap, Car, Phone, ShieldCheck, Droplets, Hospital, Building2, ArrowRight, X, Headphones } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const tilesBase = "flex items-center justify-between w-full p-4 rounded-xl border bg-white/80 hover:bg-white shadow-sm hover:shadow-lg transition cursor-pointer backdrop-blur-sm";

const Recharge = () => {
    const [comingSoon, setComingSoon] = useState({ open: false, section: '', label: '' });

    const rechargeServices = [
        { key: 'mobile', label: 'Mobile', icon: MobileRecharge, color: 'text-blue-600', border: 'border-blue-100', bg: 'hover:bg-blue-50' },
        { key: 'dth', label: 'DTH', icon: DTHRecharge, color: 'text-purple-600', border: 'border-purple-100', bg: 'hover:bg-purple-50' },
        { key: 'fastag', label: 'FASTag', icon: FASTagRecharge, color: 'text-emerald-600', border: 'border-emerald-100', bg: 'hover:bg-emerald-50' },
        { key: 'google-play', label: 'Google Play Recharge', icon: GooglePayRecharge, color: 'text-emerald-600', border: 'border-emerald-100', bg: 'hover:bg-emerald-50' },
    ];

    const billPaymentServices = [
        { key: 'electricity', label: 'Electricity', icon: ElectricityRecharge, color: 'text-yellow-600', border: 'border-yellow-100', bg: 'hover:bg-yellow-50' },
        { key: 'insurance', label: 'Insurance Premium', icon: InsurancePremium, color: 'text-indigo-600', border: 'border-indigo-100', bg: 'hover:bg-indigo-50' },
        { key: 'credit-card', label: 'Credit Card Bill', icon: CreditCardBillPayment, color: 'text-rose-600', border: 'border-rose-100', bg: 'hover:bg-rose-50' },
        { key: 'lpg', label: 'LPG', icon: LPG, color: 'text-orange-600', border: 'border-orange-100', bg: 'hover:bg-orange-50' },
        { key: 'broadband', label: 'Broadband', icon: Broadband, color: 'text-sky-600', border: 'border-sky-100', bg: 'hover:bg-sky-50' },
        { key: 'loan', label: 'Loan Repayment', icon: LoanRepayment, color: 'text-purple-600', border: 'border-purple-100', bg: 'hover:bg-purple-50' },
        { key: 'cable', label: 'Cable TV', icon: CableTV, color: 'text-indigo-600', border: 'border-indigo-100', bg: 'hover:bg-indigo-50' },
        { key: 'landline', label: 'Landline', icon: LandlineRecharge, color: 'text-pink-600', border: 'border-pink-100', bg: 'hover:bg-pink-50' },
        { key: 'education', label: 'Education Fees', icon: EducationFees, color: 'text-amber-600', border: 'border-amber-100', bg: 'hover:bg-amber-50' },
        { key: 'water', label: 'Water Bill', icon: WaterBill, color: 'text-sky-600', border: 'border-sky-100', bg: 'hover:bg-sky-50' },
        // { key: 'hospital', label: 'Hospital Bill', icon: Hospital, color: 'text-rose-600', border: 'border-rose-100', bg: 'hover:bg-rose-50' },
        { key: 'municipality', label: 'Municipality', icon: Municipality, color: 'text-amber-600', border: 'border-amber-100', bg: 'hover:bg-amber-50' },
    ];

    // Travel services
    const travelServices = [
        { key: 'flight', label: 'Flight', icon: FlightBooking, border: 'border-blue-100', bg: 'hover:bg-blue-50' },
        { key: 'bus', label: 'Bus Ticket', icon: BusTicketBooking, border: 'border-green-100', bg: 'hover:bg-green-50' },
        { key: 'train', label: 'Trains', icon: TrainBooking, border: 'border-purple-100', bg: 'hover:bg-purple-50' },
        { key: "Ola", label: "Ola", icon: Ola, border: 'border-red-100', bg: 'hover:bg-red-50' },
        { key: "Uber", label: "Uber", icon: Uber, border: 'border-red-100', bg: 'hover:bg-red-50' },
    ];

    const navigate = useNavigate();

    const onSelectService = (section, service) => {
        if (service.key === 'mobile') {
            navigate('/recharge/mobile');
            return;
        }
        setComingSoon({ open: true, section, label: service.label });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-24 pb-12">
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
                                <button key={s.key} onClick={() => setComingSoon({ open: true, section: 'Travel', label: s.label })} className={`relative ${tilesBase} ${s.border} ${s.bg}`}>
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
                    {/* Coming Soon Modal */}
                    {comingSoon.open && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-orange-100">
                                <div className="flex items-center justify-between p-4 border-b">
                                    <h3 className="text-lg font-bold text-gray-800">Coming Soon</h3>
                                    <button onClick={() => setComingSoon({ open: false, section: '', label: '' })} className="text-gray-400 hover:text-gray-600">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-5">
                                    <p className="text-gray-700 text-sm">
                                        {comingSoon.section} → <span className="font-semibold">{comingSoon.label}</span> is under development. We are working hard to bring this service to you soon.
                                    </p>
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={() => setComingSoon({ open: false, section: '', label: '' })}
                                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white text-sm font-semibold hover:shadow-md"
                                        >
                                            Okay
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Recharge;