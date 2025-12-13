import { useEffect, useState } from 'react';
import { IndianRupee, CalendarClock, CalendarDays, Infinity } from 'lucide-react';
import CountUp from 'react-countup';
import api, { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import LoginPrompt from '../UI/LoginPrompt';

const Earnings = () => {
    const { user } = useAuthStore();
    const [allTransactions, setAllTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            fetchTransactions();
        }
    }, [user]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await api.get(`${API_ENDPOINTS.packages.transactions}?limit=1000`);
            if (response.data.success) {
                const earningTypes = new Set([
                    'commission',
                    'bonus',
                    'leadership',
                    'royalty',
                    'reward',                // legacy reward tag
                    'rewards',               // some APIs send plural
                    'reward_income',         // occasional reward naming
                    'special_income_credit', // reward/leadership credits
                    'fund_credit',           // admin-added money from Wallet Manager
                ]);

                const list = (response.data.data.transactions || []).filter(t => {
                    const type = (t.type || '').toLowerCase();
                    // Include fund_credit so admin-added money shows in earnings
                    return earningTypes.has(type);
                });
                setAllTransactions(list);
            }
        } catch (err) {
            console.error('Error fetching earnings:', err);
            setError('Failed to load earnings. Please retry.');
        } finally {
            setLoading(false);
        }
    };

    const isSameDay = (a, b) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    const calculateEarnings = () => {
        const now = new Date();
        const completed = allTransactions.filter(t => {
            const status = (t.status || '').toLowerCase();
            // include approved/success to count reward payouts consistently with dashboard
            return status === 'completed' || status === 'approved' || status === 'success' || status === 'paid';
        });
        const sum = arr => arr.reduce((s, t) => s + parseFloat(t.amount || 0), 0);

        const today = completed.filter(t => isSameDay(new Date(t.createdAt), now));
        const last7 = completed.filter(t => {
            const d = new Date(t.createdAt);
            const diff = (now - d) / (1000 * 60 * 60 * 24);
            return diff <= 6 && diff >= 0;
        });
        const last30 = completed.filter(t => {
            const d = new Date(t.createdAt);
            const diff = (now - d) / (1000 * 60 * 60 * 24);
            return diff <= 29 && diff >= 0;
        });

        return {
            today: sum(today),
            week: sum(last7),
            month: sum(last30),
            all: sum(completed)
        };
    };

    if (!user) return <LoginPrompt type="walletTransactions" />;
    if (loading) {
        return (
            <div className="max-w-3xl mx-auto mt-20 bg-white/80 border border-gray-100 shadow-lg rounded-2xl p-8">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
            </div>
        );
    }

    const earnings = calculateEarnings();
    const displayName = user?.firstName + ' ' + user?.lastName

    return (
        <div className="max-w-4xl mx-auto mt-20 mb-12 px-4">
            <div className="bg-gradient-to-br from-orange-200 via-white to-orange-200 border border-orange-200 shadow-xl rounded-3xl p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/50 via-transparent to-orange-100/60 blur-3xl" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-orange-800">Congratulations, {displayName}</h1>
                        <p className="text-sm text-orange-700">Quick, clutter-free view of your performance</p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white/90 backdrop-blur border border-orange-200 text-orange-700 shadow-sm">
                        <IndianRupee size={16} />
                        <span>Earnings Overview</span>
                    </div>
                </div>

                {error && (
                    <div className="relative z-10 mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                        {error}
                    </div>
                )}

                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-3 sm:gap-4 mt-6">
                    <EarningCard
                        label="Today"
                        value={earnings.today}
                        icon={<CalendarClock className="text-blue-600" size={18} />}
                        accent="from-blue-50 to-white border-blue-100 text-blue-800"
                    />
                    <EarningCard
                        label="Last 7 Days"
                        value={earnings.week}
                        icon={<CalendarDays className="text-green-600" size={18} />}
                        accent="from-green-50 to-white border-green-100 text-green-800"
                    />
                    <EarningCard
                        label="Last 30 Days"
                        value={earnings.month}
                        icon={<CalendarDays className="text-purple-600" size={18} />}
                        accent="from-purple-50 to-white border-purple-100 text-purple-800"
                    />
                    <EarningCard
                        label="All Time"
                        value={earnings.all}
                        icon={<Infinity className="text-orange-600" size={18} />}
                        accent="from-orange-50 to-white border-orange-100 text-orange-800"
                    />
                </div>
            </div>
        </div>
    );
};

const EarningCard = ({ label, value, icon, accent }) => {
    const displayValue = Math.floor(Number(value) || 0);
    return (
        <div className={`rounded-2xl border bg-gradient-to-br ${accent} shadow-md hover:shadow-lg transition-shadow p-4 sm:p-5`}>
            <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-white shadow-inner border border-gray-100 flex-shrink-0">
                    {icon}
                </div>
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">{label}</div>
                    <div className="text-2xl font-bold leading-tight">
                        ₹
                        <CountUp
                            end={displayValue}
                            duration={1.2}
                            separator=","
                            decimals={0}
                        />
                    </div>
                    <div className="text-[11px] text-gray-500">Completed earnings only</div>
                </div>
            </div>
        </div>
    );
};

export default Earnings;

