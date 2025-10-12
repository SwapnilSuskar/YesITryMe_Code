import { Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

const AffiliateLink = () => {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);
  if (!user) return <div className="p-8 text-center">No user data.</div>;

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white rounded-2xl shadow-xl border border-orange-100 p-8">
      <h4 className="font-semibold mb-2 text-lg text-[#FF4E00] tracking-wide flex items-center gap-3">
        <LinkIcon size={36} strokeWidth={2.5} className="text-blue-500 bg-white/80 rounded-full p-1 shadow border border-blue-100" />
        Referral Link
      </h4>
      <div className="flex w-full items-center gap-2 flex-wrap">
        <div className="bg-white/80 border border-gray-200 px-3 py-3 rounded-lg text-xs break-all flex-1 text-gray-700 shadow-inner select-all">
          {user.referralLink}
        </div>
        <button
          className="ml-2 px-3 py-3 rounded-lg bg-gradient-to-r from-[#FF4E00] to-[#FF9900] text-white text-xs font-semibold shadow hover:from-[#FF9900] hover:to-[#FF4E00] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF4E00]"
          onClick={() => {
            navigator.clipboard.writeText(user.referralLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          title="Copy referral link"
        >
          Copy
        </button>
        {copied && (
          <span className="w-full block mt-2 px-3 py-2 rounded-lg bg-green-100 text-green-700 text-xs font-semibold text-center sm:w-auto sm:inline-block sm:ml-2 sm:mt-0 animate-fade-in">
            Copied!
          </span>
        )}
      </div>
    </div>
  );
};

export default AffiliateLink; 