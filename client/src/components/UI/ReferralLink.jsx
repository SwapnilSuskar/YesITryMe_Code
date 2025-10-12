import { Copy, Link as LinkIcon, Share2 } from 'lucide-react';
import { useState } from 'react';

const ReferralLink = ({
  referralLink,
  title = "My Referral Link",
  className = '',
  cardClassName = '',
  showTitle = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const shareReferralLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join YesITryMe - Earn Money Online!',
          text: `Hey! I'm earning money online with YesITryMe. Join me using my referral link and start your journey to financial freedom!`,
          url: referralLink,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } else {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(referralLink);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to copy
      navigator.clipboard.writeText(referralLink);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      <div className={`bg-gradient-to-br from-blue-100/60 via-white/80 to-blue-200/60 backdrop-blur-lg rounded-2xl shadow-xl border border-blue-200 p-4 flex flex-col gap-2 transition-transform hover:scale-[1.02] hover:shadow-blue-200/60 ${cardClassName}`}>
        {showTitle && (
          <h4 className="text-sm font-medium flex items-center gap-1 mb-1 bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent tracking-wide">
            <LinkIcon size={18} className="text-blue-400 drop-shadow" /> {title}
          </h4>
        )}
        <div className="flex items-center gap-1 flex-wrap">
          <div className="bg-white/80 border border-gray-200 px-2 py-2 rounded-lg text-xs break-all flex-1 text-gray-700 shadow-inner select-all font-mono tracking-tight">
            {referralLink}
          </div>
          <button
            className="ml-1 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-400 text-white text-xs font-semibold shadow hover:from-blue-400 hover:to-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={copyToClipboard}
            title="Copy referral link"
          >
            <Copy size={14} className="inline mr-1" />
            Copy
          </button>
          <button
            className="ml-1 px-3 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-400 text-white text-xs font-semibold shadow hover:from-green-400 hover:to-green-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
            onClick={shareReferralLink}
            title="Share referral link"
          >
            <Share2 size={14} className="inline mr-1" />
            Share
          </button>
        </div>
        {(copied || shared) && (
          <span className="w-full block mt-1 px-2 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold text-center animate-fade-in shadow">
            {copied ? 'Copied!' : 'Shared!'}
          </span>
        )}
      </div>
    </div>
  );
};

export default ReferralLink; 