import { Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';

const Team = () => {
  const { user, token } = useAuthStore();
  const [referralTree, setReferralTree] = useState({ directReferrals: [], totalReferrals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTree = async () => {
      setLoading(true);
      try {
        const res = await fetch(API_ENDPOINTS.packages.referralTree, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.data) setReferralTree(data.data);
      } catch {}
      setLoading(false);
    };
    if (user && token) fetchTree();
  }, [user, token]);

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white rounded-2xl shadow-xl border border-green-100 p-8">
      <h4 className="font-semibold mb-4 text-lg text-green-600 tracking-wide flex items-center gap-3">
        <Users size={28} className="text-green-500" />
        My Team
      </h4>
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : referralTree.directReferrals.length === 0 ? (
        <div className="text-center text-gray-400">No referrals yet.</div>
      ) : (
        <div className="space-y-4">
          {referralTree.directReferrals.map((ref, idx) => (
            <div key={idx} className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="font-bold text-gray-800">{ref.firstName} {ref.lastName}</div>
              <div className="text-xs text-gray-500">Mobile: {ref.mobile}</div>
              <div className="text-xs text-blue-600 font-medium">Code: {ref.referralCode}</div>
              {ref.subReferrals && ref.subReferrals.length > 0 && (
                <div className="mt-2 ml-4">
                  <div className="text-xs text-green-700 font-semibold mb-1">Sub-Referrals:</div>
                  <ul className="list-disc ml-4">
                    {ref.subReferrals.map((sub, subIdx) => (
                      <li key={subIdx} className="text-xs text-gray-700">
                        {sub.firstName} {sub.lastName} (Mobile: {sub.mobile}, Code: {sub.referralCode})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Team; 