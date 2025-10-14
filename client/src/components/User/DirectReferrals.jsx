import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { API_ENDPOINTS } from '../../config/api';
import UserAvatar from '../UI/UserAvatar';
import { Users } from 'lucide-react';
import LoginPrompt from '../UI/LoginPrompt';

const DirectReferrals = () => {
  const { user, token } = useAuthStore();
  const [referralTree, setReferralTree] = useState({ totalReferrals: 0, directReferrals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState('registration'); // 'registration' | 'activation'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  const formatDate = (value) => {
    if (!value) return '-';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString();
    } catch (_) {
      return '-';
    }
  };

  useEffect(() => {
    const fetchReferralTree = async () => {
      if (!user || !token) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_ENDPOINTS.packages.referralTree}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setReferralTree(data.data || { totalReferrals: 0, directReferrals: [] });
        } else {
          setReferralTree({ totalReferrals: 0, directReferrals: [] });
          setError('Failed to load referrals');
        }
      } catch (e) {
        setReferralTree({ totalReferrals: 0, directReferrals: [] });
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchReferralTree();
  }, [user, token]);

  const rows = useMemo(() => {
    const list = referralTree?.directReferrals || [];
    return list.map((r) => {
      const createdAtTs = r?.createdAt ? new Date(r.createdAt).getTime() : 0;
      const activationTs = r?.activationDate ? new Date(r.activationDate).getTime() : 0;
      const fullName = `${r?.firstName || ''} ${r?.lastName || ''}`.trim();
      return {
        userId: r?.userId || '',
        name: fullName,
        imageUrl: r?.imageUrl || '',
        registrationDate: formatDate(r?.createdAt),
        activationDate: formatDate(r?.activationDate),
        // raw timestamps for sorting (fallback to 0 so undefined sorts last on desc)
        registrationTs: Number.isFinite(createdAtTs) ? createdAtTs : 0,
        activationTs: Number.isFinite(activationTs) ? activationTs : 0,
        status: r?.status || 'free',
        teamCount: (r?.subReferrals && r.subReferrals.length) || 0,
      };
    });
  }, [referralTree]);

  const sortedRows = useMemo(() => {
    const list = [...rows];
    const key = sortField === 'registration' ? 'registrationTs' : 'activationTs';
    list.sort((a, b) => {
      const av = a[key] || 0;
      const bv = b[key] || 0;
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [rows, sortField, sortOrder]);

  const totalDirect = rows.length;

  if (!user) {
    return (
      <LoginPrompt type="directReferrals" />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center items-start justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-orange-500" /> My Direct Referrals
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center items-start gap-3 w-full sm:w-auto">
            <div className="text-sm text-gray-600">Total Direct Referrals: <span className="font-bold text-gray-900">{totalDirect}</span></div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label className="text-sm text-gray-600">Sort by</label>
              <select
                className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
              >
                <option value="registration">Registration date</option>
                <option value="activation">Activation date</option>
              </select>
              <select
                className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6 text-center">Loading...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
        ) : totalDirect === 0 ? (
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6 text-center text-gray-500">No direct referrals yet.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Registration Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Activation Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">My Team Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedRows.map((r, i) => {
                    const nameParts = (r?.name || '').split(' ').filter(Boolean);
                    const first = nameParts[0] || '';
                    const last = nameParts.slice(1).join(' ');
                    return (
                      <tr key={r.userId || i} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <UserAvatar imageUrl={r.imageUrl} firstName={first} lastName={last} status={r.status} size={36} />
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{r.name || '-'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-700">{r.userId || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{r.registrationDate}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{r.activationDate}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            r.status === 'active' ? 'bg-green-100 text-green-700' : r.status === 'kyc_verified' ? 'bg-blue-100 text-blue-700' : r.status === 'blocked' ? 'bg-gray-800 text-white' : 'bg-red-100 text-red-700'
                          }`}>
                            {r.status === 'free' ? 'Free' : r.status === 'active' ? 'Active' : r.status === 'kyc_verified' ? 'KYC Verified' : r.status === 'blocked' ? 'Blocked' : (r.status || 'Free')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{Number.isFinite(r.teamCount) ? r.teamCount : 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectReferrals;


