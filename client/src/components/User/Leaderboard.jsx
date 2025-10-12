import { Award } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import UserAvatar from '../UI/UserAvatar';
import { useAuthStore } from '../../store/useAuthStore';

const Leaderboard = () => {
  const { user, token } = useAuthStore();
  const [topEarners, setTopEarners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIncome, setActiveIncome] = useState(0);
  const [teamIncome, setTeamIncome] = useState(0);
  const [superTotal, setSuperTotal] = useState(0);
  const [specialIncome, setSpecialIncome] = useState({ leaderShipFund: 0, royaltyIncome: 0, rewardIncome: 0 });
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);

  useEffect(() => {
    const fetchTop = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_ENDPOINTS.funds.topPerformers}`);
        const data = await res.json();
        if (res.ok && data.success) setTopEarners(data.data.topEarners || []);
      } catch { }
      setLoading(false);
    };
    fetchTop();
  }, []);

  // Fetch current user's components of total income to override their leaderboard amount
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
      } catch {}
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
    <div className="max-w-6xl mx-auto mt-10 bg-white rounded-2xl shadow-xl border border-yellow-100 p-8">
      <h4 className="font-semibold mb-4 text-lg text-yellow-600 tracking-wide flex items-center gap-3">
        <Award size={28} className="text-yellow-500" />
        Leaderboard - Top Earners
      </h4>
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : topEarners.length === 0 ? (
        <div className="text-center text-gray-400">No top earners yet.</div>
      ) : (
        <ol className="space-y-4">
          {topEarners.map((row, idx) => (
            <li key={row.userId} className="flex items-center gap-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <span className="font-bold text-xl text-yellow-700 w-6 text-center">{idx + 1}</span>
              <UserAvatar
                imageUrl={row.imageUrl}
                firstName={row.firstName}
                lastName={row.lastName}
                status={row.status}
                size={40}
              />
              <span className="font-semibold text-gray-800 flex-1">
                {row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim()}
              </span>
              <span className="font-bold text-yellow-700">
                ₹{
                  (
                    row.userId === user?.userId
                      ? myTotalIncome
                      : Number((row.computedTotal ?? row.totalEarned) || 0)
                  ).toLocaleString('en-IN')
                }
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default Leaderboard; 