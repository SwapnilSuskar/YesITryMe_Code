import { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Package } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import UserAvatar from '../UI/UserAvatar';
import LoginPrompt from '../UI/LoginPrompt';

const SuccessfulDownline = () => {
  const { user, token } = useAuthStore();
  const [regularDirects, setRegularDirects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [selectedDate, setSelectedDate] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [uniqueSuccessfulDownlineCount, setUniqueSuccessfulDownlineCount] = useState(0);

  const formatDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
  };

  const isSuccessfulBuyer = (ref) => {
    // Treat an activation date, active status or explicit purchase flags as a successful buyer
    return Boolean(
      ref?.activationDate ||
      ref?.status === 'active' ||
      ref?.packageStatus === 'active' ||
      ref?.hasPurchasedPackage ||
      ref?.superPackageStatus === 'active'
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !token) return;
      setLoading(true);
      setError('');
      try {
        // Fetch referral tree for the list
        const regularRes = await fetch(API_ENDPOINTS.packages.referralTree, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Fetch unique successful downline count (combining regular + super packages)
        const downlineStatsRes = await fetch(`${API_ENDPOINTS.packages.downlineStats7Days}?period=alltime`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (regularRes.ok) {
          const data = await regularRes.json();
          const directReferrals = data?.data?.directReferrals || [];
          setRegularDirects(directReferrals.filter(isSuccessfulBuyer));
        } else {
          setRegularDirects([]);
        }

        // Update unique count from downline stats
        if (downlineStatsRes.ok) {
          const statsData = await downlineStatsRes.json();
          if (statsData.uniqueSuccessfulDownline !== undefined) {
            setUniqueSuccessfulDownlineCount(statsData.uniqueSuccessfulDownline);
          }
        }
      } catch (e) {
        console.error('Failed to fetch successful downline', e);
        setError('Failed to load downline buyers. Please try again.');
        setRegularDirects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token]);

  useEffect(() => {
    if (!selectedDate) return;
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
    const mapReferral = (ref, source) => {
      const createdAtTs = ref?.createdAt ? new Date(ref.createdAt).getTime() : 0;
      const activationTs = ref?.activationDate ? new Date(ref.activationDate).getTime() : 0;
      const fullName = `${ref?.firstName || ''} ${ref?.lastName || ''}`.trim();

      // Robust team count handling:
      // - Prefer subReferrals length when it's an array
      // - Fall back to any numeric teamCount already present on the node
      const rawTeamCount = Array.isArray(ref?.subReferrals)
        ? ref.subReferrals.length
        : (Number.isFinite(ref?.teamCount) ? ref.teamCount : 0);

      return {
        userId: ref?.userId || ref?._id || '',
        name: fullName || '-',
        imageUrl: ref?.imageUrl || '',
        mobile: ref?.mobile || '',
        registrationDate: formatDate(ref?.createdAt),
        activationDate: formatDate(ref?.activationDate),
        activationTs: Number.isFinite(activationTs) ? activationTs : 0,
        registrationTs: Number.isFinite(createdAtTs) ? createdAtTs : 0,
        status: ref?.status || ref?.packageStatus || 'active',
        source,
        teamCount: Number.isFinite(rawTeamCount) && rawTeamCount > 0 ? rawTeamCount : 0,
      };
    };

    const regularRows = (regularDirects || []).map((ref) =>
      mapReferral(ref, 'Package')
    );

    return regularRows;
  }, [regularDirects]);

  const filteredSortedRows = useMemo(() => {
    let list = [...rows];

    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);

        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          const start = new Date(y, m, d, 0, 0, 0, 0).getTime();
          const end = new Date(y, m, d, 23, 59, 59, 999).getTime();
          list = list.filter((r) => {
            const reg = r.registrationTs || 0;
            const act = r.activationTs || 0;
            return (reg >= start && reg <= end) || (act >= start && act <= end);
          });
        } else {
          list = [];
        }
      } else {
        list = [];
      }
    }

    const sorted = [...list].sort((a, b) => {
      const av = a.activationTs || a.registrationTs || 0;
      const bv = b.activationTs || b.registrationTs || 0;
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [rows, sortOrder, selectedDate]);

  // Use unique count from API if available, otherwise fall back to filtered list length
  const totalCount = uniqueSuccessfulDownlineCount > 0 ? uniqueSuccessfulDownlineCount : rows.length;
  const regularCount = regularDirects.length;

  if (!user) {
    return <LoginPrompt type="successfulDownline" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 shadow text-white">
              <Package className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">My Successfully Downline</h1>
            <span className="ml-auto inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Total: <span className="text-gray-900">{totalCount}</span>
            </span>
          </div>
          <div className="flex gap-2 mt-2 text-xs text-gray-600">
            <span className="px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
              Successful Direct Buyers: {regularCount}
            </span>
          </div>
        </div>

        {/* Controls Card */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-white via-rose-50/40 to-white shadow-sm mb-6">
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient( circle at 20% 20%, #fb7185 0, transparent 25% ), radial-gradient( circle at 80% 0%, #f97316 0, transparent 25% )' }}></div>
          <div className="relative p-4 sm:p-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Date */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700 min-w-[56px]">Date</label>
                <div className="relative w-full">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
                  <input
                    type="date"
                    className="text-sm border border-gray-200 rounded-lg pl-9 pr-10 py-2 bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none w-full shadow-sm"
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

              {/* Sort Order */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700 min-w-[56px]">Sort</label>
                <select
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none shadow-sm min-w-[160px]"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="desc">Newest first</option>
                  <option value="asc">Oldest first</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 justify-start lg:justify-end">
                <button
                  type="button"
                  onClick={() => { setSelectedDate(''); setSortOrder('desc'); }}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
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
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading successful downline...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700">{error}</div>
        ) : totalCount === 0 ? (
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-8 text-center text-gray-500">No successful downline yet.</div>
        ) : isFiltering ? (
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-3"></div>
            <p className="text-gray-600 text-sm">Applying date filter...</p>
          </div>
        ) : selectedDate && filteredSortedRows.length === 0 ? (
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-8 text-center">
            <p className="text-gray-700 font-semibold">No downline found for the selected date.</p>
            <p className="text-gray-500 text-sm mt-1">Try changing the date or filter.</p>
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
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-600">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-600">Registration Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-600">Activation Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-600">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-600">My Team Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSortedRows.map((r, i) => {
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
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${r.source === 'Super Package' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            {r.source}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{r.registrationDate}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{r.activationDate}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${r.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : r.status === 'kyc_verified' ? 'bg-blue-50 text-blue-700 border-blue-200' : r.status === 'blocked' ? 'bg-gray-800 text-white border-gray-800' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            {r.status ? (r.status === 'free' ? 'Free' : r.status.replace(/_/g, ' ')) : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                          {Number.isFinite(r.teamCount) ? r.teamCount : 0}
                        </td>
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

export default SuccessfulDownline;
