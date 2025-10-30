import { useState } from 'react';
import { Smartphone, Tv, Zap, Car, Phone, ShieldCheck, Droplets, Hospital, Building2, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const tilesBase = "flex items-center justify-between w-full p-4 rounded-xl border hover:shadow-md transition cursor-pointer";

const Recharge = () => {
	const [activeTab, setActiveTab] = useState('recharge');
	const [comingSoon, setComingSoon] = useState({ open: false, section: '', label: '' });

    const rechargeServices = [
        { key: 'mobile', label: 'Mobile', icon: Smartphone, color: 'text-blue-600', border: 'border-blue-100', bg: 'hover:bg-blue-50' },
        { key: 'dth', label: 'DTH', icon: Tv, color: 'text-purple-600', border: 'border-purple-100', bg: 'hover:bg-purple-50' },
        { key: 'electricity', label: 'Electricity', icon: Zap, color: 'text-yellow-600', border: 'border-yellow-100', bg: 'hover:bg-yellow-50' },
        { key: 'fastag', label: 'FASTag', icon: Car, color: 'text-emerald-600', border: 'border-emerald-100', bg: 'hover:bg-emerald-50' },
        { key: 'landline', label: 'Landline', icon: Phone, color: 'text-pink-600', border: 'border-pink-100', bg: 'hover:bg-pink-50' },
    ];

    const billPaymentServices = [
        { key: 'insurance', label: 'Insurance Premium', icon: ShieldCheck, color: 'text-indigo-600', border: 'border-indigo-100', bg: 'hover:bg-indigo-50' },
        { key: 'water', label: 'Water Bill', icon: Droplets, color: 'text-sky-600', border: 'border-sky-100', bg: 'hover:bg-sky-50' },
        { key: 'hospital', label: 'Hospital Bill', icon: Hospital, color: 'text-rose-600', border: 'border-rose-100', bg: 'hover:bg-rose-50' },
        { key: 'municipality', label: 'Municipality', icon: Building2, color: 'text-amber-600', border: 'border-amber-100', bg: 'hover:bg-amber-50' },
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

                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-orange-100">
                    {/* Tabs */}
                    <div className="p-2 border-b border-orange-100 flex gap-2">
                        <button
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'recharge' ? 'bg-orange-500 text-white' : 'text-gray-700 hover:bg-orange-50'}`}
                            onClick={() => setActiveTab('recharge')}
                        >
                            Recharge
                        </button>
                        <button
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'bills' ? 'bg-orange-500 text-white' : 'text-gray-700 hover:bg-orange-50'}`}
                            onClick={() => setActiveTab('bills')}
                        >
                            Bill Payments
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6">
                        {activeTab === 'recharge' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {rechargeServices.map(s => (
                                    <button key={s.key} onClick={() => onSelectService('Recharge', s)} className={`${tilesBase} ${s.border} ${s.bg}`}>
                                        <div className="flex items-center gap-3">
                                            <s.icon className={`w-5 h-5 ${s.color}`} />
                                            <span className="text-sm font-semibold text-gray-800">{s.label}</span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-400" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {activeTab === 'bills' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {billPaymentServices.map(s => (
                                    <button key={s.key} onClick={() => onSelectService('Bill Payment', s)} className={`${tilesBase} ${s.border} ${s.bg}`}>
                                        <div className="flex items-center gap-3">
                                            <s.icon className={`w-5 h-5 ${s.color}`} />
                                            <span className="text-sm font-semibold text-gray-800">{s.label}</span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-400" />
                                    </button>
                                ))}
                            </div>
                        )}
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