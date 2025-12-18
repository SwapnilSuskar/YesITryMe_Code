import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { API_ENDPOINTS } from '../../config/api';
import UserAvatar from '../UI/UserAvatar';
import { MessageCircle, Users } from 'lucide-react';
import LoginPrompt from '../UI/LoginPrompt';

const DirectReferrals = () => {
  const { user, token } = useAuthStore();
  const [referralTree, setReferralTree] = useState({ totalReferrals: 0, directReferrals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState('registration'); // 'registration' | 'activation'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [selectedDate, setSelectedDate] = useState(''); // YYYY-MM-DD
  const [isFiltering, setIsFiltering] = useState(false);

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

  // Lightweight feedback when user changes date/mode
  useEffect(() => {
    if (!selectedDate) return; // only show during active filtering
    setIsFiltering(true);
    const t = setTimeout(() => setIsFiltering(false), 200);
    return () => clearTimeout(t);
  }, [selectedDate]);

  const openWhatsApp = (mobile) => {
    if (!mobile) return;
    const cleaned = String(mobile).replace(/[^0-9]/g, '');
    if (!cleaned) return;
    const url = `https://wa.me/${cleaned}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
        mobile: r?.mobile || " ",
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

  const { filteredRows, sortedRows } = useMemo(() => {
    let list = [...rows];

    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          const start = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
          const end = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
          list = list.filter((r) => {
            const inReg = r.registrationTs >= start && r.registrationTs <= end;
            const inAct = r.activationTs >= start && r.activationTs <= end;
            return inReg || inAct; // Either by default
          });
        } else {
          // invalid date parts: no rows match
          list = [];
        }
      } else {
        // malformed date string: no rows match
        list = [];
      }
    }

    const key = sortField === 'registration' ? 'registrationTs' : 'activationTs';
    const sorted = [...list].sort((a, b) => {
      const av = a[key] || 0;
      const bv = b[key] || 0;
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return { filteredRows: list, sortedRows: sorted };
  }, [rows, sortField, sortOrder, selectedDate]);

  const totalDirect = rows.length;

  if (!user) {
    return (
      <LoginPrompt type="directReferrals" />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 shadow text-white">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">My Direct Referrals</h1>
            <span className="ml-auto inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              Total: <span className="text-gray-900">{totalDirect}</span>
            </span>
          </div>
        </div>

        {/* Controls Card */}
        <div className="relative overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-white via-orange-50/40 to-white shadow-sm mb-6">
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient( circle at 20% 20%, #fb923c 0, transparent 25% ), radial-gradient( circle at 80% 0%, #fb7185 0, transparent 25% )' }}></div>
          <div className="relative p-4 sm:p-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Date */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700 min-w-[56px]">Date</label>
                <div className="relative w-full">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
                  <input
                    type="date"
                    className="text-sm border border-gray-200 rounded-lg pl-9 pr-10 py-2 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none w-full shadow-sm"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                  {selectedDate && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] px-2 py-[2px] rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                      title="Clear date"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Sort Field */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <label className="text-sm font-semibold text-gray-700 min-w-[56px] sm:mr-1">Sort</label>
                <div className="flex items-center gap-2 sm:gap-3 w-full">
                  <select
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none shadow-sm min-w-[160px]"
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                  >
                    <option value="registration">Registration date</option>
                    <option value="activation">Activation date</option>
                  </select>
                  <span className="hidden sm:inline-block h-6 w-px bg-gray-200 mx-1"></span>
                  <select
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none shadow-sm min-w-[160px]"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <option value="desc">Newest first</option>
                    <option value="asc">Oldest first</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 justify-start lg:justify-end">
                <button
                  type="button"
                  onClick={() => { setSelectedDate(''); setSortField('registration'); setSortOrder('desc'); }}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
                  title="Reset filters"
                >
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading direct referrals...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700">{error}</div>
        ) : totalDirect === 0 ? (
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-8 text-center text-gray-500">No direct referrals yet.</div>
        ) : isFiltering ? (
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3"></div>
            <p className="text-gray-600 text-sm">Applying date filter...</p>
          </div>
        ) : selectedDate && filteredRows.length === 0 ? (
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-8 text-center">
            <p className="text-gray-700 font-semibold">No referrals found for the selected date.</p>
            <p className="text-gray-500 text-sm mt-1">Try changing the date or filter type.</p>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50/80 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-600">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-600">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-600">Mobile/WhatsApp</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-600">Registration Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-600">Activation Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-600">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-600">My Team Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedRows.map((r, i) => {
                    const nameParts = (r?.name || '').split(' ').filter(Boolean);
                    const first = nameParts[0] || '';
                    const last = nameParts.slice(1).join(' ');
                    return (
                      <tr key={r.userId || i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <UserAvatar imageUrl={r.imageUrl} firstName={first} lastName={last} status={r.status} size={36} />
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{r.name || '-'}</div>
                              <div className="text-[11px] text-gray-500">Mobile No: {r.mobile || '-'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-700">{r.userId || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <span>{r.mobile || '-'}</span>
                            {r.mobile && (
                              <button
                                type="button"
                                onClick={() => openWhatsApp(r.mobile)}
                                className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 transition-colors p-1.5"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{r.registrationDate}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{r.activationDate}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${r.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : r.status === 'kyc_verified' ? 'bg-blue-50 text-blue-700 border-blue-200' : r.status === 'blocked' ? 'bg-gray-800 text-white border-gray-800' : 'bg-red-50 text-red-700 border-red-200'
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