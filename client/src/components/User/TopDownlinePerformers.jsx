import { Award } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import UserAvatar from '../UI/UserAvatar';

const TopDownlinePerformers = () => {
    const { user, token } = useAuthStore();
    const [topPerformers, setTopPerformers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIncome, setActiveIncome] = useState(0);
    const [teamIncome, setTeamIncome] = useState(0);
    const [superTotal, setSuperTotal] = useState(0);
    const [specialIncome, setSpecialIncome] = useState({ leaderShipFund: 0, royaltyIncome: 0, rewardIncome: 0 });
    const [totalWithdrawn, setTotalWithdrawn] = useState(0);

    useEffect(() => {
        const fetchTopPerformers = async () => {
            setLoading(true);
            try {
                const res = await fetch(API_ENDPOINTS.packages.topDownlinePerformers, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch top downline performers');
                const data = await res.json();
                setTopPerformers(data.data || []);
            } catch {
                setTopPerformers([]);
            }
            setLoading(false);
        };
        if (token) fetchTopPerformers();
    }, [token]);

    // Fetch current user's components of total income to override their row if present
    useEffect(() => {
        const fetchMine = async () => {
            if (!user || !token) return;
            try {
                const [commissionRes, superRes, specialRes, payoutRes] = await Promise.all([
                    fetch(`${API_ENDPOINTS.packages.commissionSummary}`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_ENDPOINTS.superPackages.commissionSummary}`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_ENDPOINTS.specialIncome.user.replace(':userId', user.userId)}`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_ENDPOINTS.payout.history}`, { headers: { Authorization: `Bearer ${token}` } }),
                ]);

                if (commissionRes.ok) {
                    const d = await commissionRes.json();
                    setActiveIncome(d.data?.activeIncome || 0);
                    setTeamIncome(d.data?.passiveIncome || 0);
                }
                if (superRes.ok) {
                    const d = await superRes.json();
                    setSuperTotal(d.data?.totalEarned || 0);
                }
                if (specialRes.ok) {
                    const d = await specialRes.json();
                    setSpecialIncome(d.data || { leaderShipFund: 0, royaltyIncome: 0, rewardIncome: 0 });
                }
                if (payoutRes.ok) {
                    const d = await payoutRes.json();
                    const withdrawn = (d.payouts || [])
                        .filter((p) => p.status === 'approved' || p.status === 'completed')
                        .reduce((sum, p) => sum + (parseFloat(p.amount || 0)), 0);
                    setTotalWithdrawn(withdrawn);
                }
            } catch { }
        };
        fetchMine();
    }, [user, token]);

    const myTotalIncome = useMemo(() => {
        return (
            (parseFloat(activeIncome) || 0) +
            (parseFloat(teamIncome) || 0) +
            (parseFloat(superTotal) || 0) +
            (parseFloat(specialIncome.royaltyIncome) || 0) +
            (parseFloat(specialIncome.rewardIncome) || 0) +
            (parseFloat(specialIncome.leaderShipFund) || 0) +
            (parseFloat(totalWithdrawn) || 0)
        );
    }, [activeIncome, teamIncome, superTotal, specialIncome, totalWithdrawn]);

    return (
        <div className="bg-white/90 rounded-2xl shadow-xl border border-yellow-200 p-6 mt-8 mx-auto">
            <h3 className="text-lg font-bold text-yellow-600 mb-4 flex items-center gap-2">
                <Award className="text-yellow-500" size={24} /> Top Performance in My Downline
            </h3>
            {loading ? (
                <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                </div>
            ) : topPerformers.length === 0 ? (
                <div className="text-gray-400 text-center py-6">No performers in your downline yet.</div>
            ) : (
                <ul className="divide-y divide-yellow-100">
                    {topPerformers.map((p, idx) => (
                        <li key={p.userId} className="flex items-center gap-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                            <span className="font-bold text-xl text-yellow-700 w-6 text-center">{idx + 1}</span>
                            <UserAvatar
                                imageUrl={p.imageUrl}
                                firstName={p.firstName}
                                lastName={p.lastName}
                                status={p.status}
                                size={40}
                            />
                            <span className="font-semibold text-gray-800 flex-1">
                                {p.firstName} {p.lastName}
                            </span>
                            <span className="font-bold text-yellow-700">₹{(p.userId === user?.userId ? myTotalIncome : Number(p.totalEarned || 0)).toLocaleString('en-IN')}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default TopDownlinePerformers; 
