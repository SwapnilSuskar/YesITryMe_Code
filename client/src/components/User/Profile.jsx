import { BadgeCheck, CalendarDays, CheckCircle2, Copy, CreditCard, Download, Edit3, Heart, Mail, MapPin, Phone, Share2, Smartphone, UserCheck, User as UserIcon, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
// removed unused useNavigate
import api, { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import LoginPrompt from '../UI/LoginPrompt';
import InfoItem from './InfoItem';

const funFacts = [
  "Success is not for the lazy! 🚀",
  "Every referral is a new opportunity! 🌱",
  "Your network is your net worth! 💎",
  "Keep pushing, your dreams are valid! ✨",
  "Small steps every day lead to big results! 🏆",
];

const Profile = () => {
  // removed unused navigate
  const { user, setUser, refreshUserStatus } = useAuthStore();
  const [copiedId, setCopiedId] = useState(false);
  const [copiedMobile, setCopiedMobile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);
  const [showWeLove, setShowWeLove] = useState(false);
  const fileInputRef = useRef();
  const idCardRef = useRef();
  const weLoveRef = useRef();
  const [isCapturingWeLove, setIsCapturingWeLove] = useState(false);
  const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];

  const shareWeLove = async () => {
    try {
      const homepageUrl = `${window.location.origin}`;
      const profileUrl = `${window.location.origin}/profile/${user.userId}`;
      const message = `We Love ❤ YesITryMe\n\n${user.firstName} ${user.lastName} (ID: ${user.userId}) is growing with YesITryMe!\n\n✓ YouTube earning opportunities\n✓ Premium courses and ebooks\n✓ AI tools for faster growth\n✓ Subscription and physical products\n\nJoin the movement — YesITryMe Try Karega India 🇮🇳\n\nProfile: ${profileUrl}\nWebsite: ${homepageUrl}`;
      if (navigator.share) {
        await navigator.share({ title: 'We Love YesITryMe', text: message, url: homepageUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        alert('Promotion message copied to clipboard!');
      } else {
        alert(message);
      }
    } catch (e) {
      console.error('Error sharing promotion:', e);
      alert('Failed to share. Please try again.');
    }
  };

  // removed copyWeLove feature per request

  // Sync user status when component loads
  useEffect(() => {
    if (user) {
      refreshUserStatus();
    }
  }, [user, refreshUserStatus]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!user) {
    return <LoginPrompt type='profile' />
  }

  const registrationDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-';
  const kycVerified = user?.kycApprovedDate ? true : false;

  const sponsorMobile = user.sponsorMobile || '-';
  const activationDate = user.activationDate ? new Date(user.activationDate).toLocaleDateString() : '-';


  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPEG, PNG, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB. Your image will be automatically compressed.');
      return;
    }

    // removed unused fileSizeMB

    setUploading(true);
    setUploadError('');
    setShowSuccess(false);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await api.post(API_ENDPOINTS.profile.profilePhoto, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setUser({ ...user, imageUrl: res.data.imageUrl });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setUploadError(res.data.message || 'Failed to update photo');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      setUploadError(err.response?.data?.message || 'Failed to upload photo');
    }
    setUploading(false);
  };

  const downloadIdCard = async () => {
    try {
      if (!idCardRef.current) {
        alert('ID Card is not ready yet. Please open the card and try again.');
        return;
      }
      // Dynamically import html2canvas to keep bundle lean
      const mod = await import('html2canvas').catch(() => null);
      if (!mod || !mod.default) {
        alert('To download as image, please install html2canvas: npm i html2canvas');
        return;
      }
      const html2canvas = mod.default;
      const canvas = await html2canvas(idCardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: 1,
        windowWidth: document.documentElement.clientWidth,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `ID_Card_${user.userId}.png`;
      link.click();
    } catch (error) {
      console.error('Error downloading ID card:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  const shareIdCard = async () => {
    try {
      const shareUrl = `${window.location.origin}/profile/${user.userId}`;
      const shareText = `Check out my ID card from ITryMe!\n\nName: ${user.firstName} ${user.lastName}\nID: ${user.userId}\nMobile: ${user.mobile}`;

      if (navigator.share) {
        await navigator.share({
          title: `${user.firstName} ${user.lastName} - ITryMe ID Card`,
          text: shareText,
          url: shareUrl
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText}\n\nProfile: ${shareUrl}`);
        alert('ID card information copied to clipboard!');
      } else {
        alert(`Share this information:\n\n${shareText}\n\nProfile: ${shareUrl}`);
      }
    } catch (error) {
      console.error('Error sharing ID card:', error);
      alert('Failed to share ID card. Please try again.');
    }
  };

  const downloadWeLove = async () => {
    try {
      if (!weLoveRef.current) {
        alert('We Love card is not ready yet. Please open the card and try again.');
        return;
      }
      setIsCapturingWeLove(true);
      const el = weLoveRef.current;
      // Prefer html-to-image for layout fidelity
      const hti = await import('html-to-image').catch(() => null);
      if (hti && (hti.toPng || (hti.default && hti.default.toPng))) {
        const toPng = hti.toPng || hti.default.toPng;
        const dataUrl = await toPng(el, {
          backgroundColor: '#ffffff',
          pixelRatio: 2,
          width: el.offsetWidth,
          height: el.offsetHeight,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
            boxSizing: 'border-box',
          },
          cacheBust: true,
        });
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `WeLove_YesITryMe_${user.userId}.png`;
        link.click();
        setIsCapturingWeLove(false);
        return;
      }
      // Fallback to html2canvas with minimal overrides to avoid stretching
      const mod = await import('html2canvas').catch(() => null);
      if (!mod || !mod.default) {
        setIsCapturingWeLove(false);
        alert('To download as image, please install html-to-image or html2canvas');
        return;
      }
      const html2canvas = mod.default;
      const canvas = await html2canvas(el, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: 1,
        scrollY: 0,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `WeLove_YesITryMe_${user.userId}.png`;
      link.click();
      setIsCapturingWeLove(false);
    } catch (error) {
      console.error('Error downloading We Love card:', error);
      alert('Failed to download image. Please try again.');
      setIsCapturingWeLove(false);
    }
  };

  const services = [
    "YouTube earning",
    "Courses",
    "Ebook",
    "AI tools",
    "Subscription base product",
    "Physical product",
    "Utility product",
    "Shopping portal"
  ];

  // removed unused categories

  return (
    <>
      <div className="max-w-xl mx-auto mt-16 rounded-3xl shadow-2xl border-2 border-blue-100/40 p-0 relative overflow-hidden group transition-all duration-300 hover:shadow-3xl bg-white">
        {/* Top Ribbon Banner */}
        <div className="absolute top-0 left-0 w-full flex items-center justify-center z-20">
          <div className="bg-gradient-to-r from-blue-500 via-orange-400 to-pink-500 text-white font-bold py-2 px-8 rounded-b-2xl shadow-lg text-lg flex items-center gap-2 animate-bounce-in">
            👋 Welcome, {user.firstName}!
          </div>
        </div>
        {/* Confetti Animation */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="confetti confetti1" />
          <div className="confetti confetti2" />
          <div className="confetti confetti3" />
          <div className="confetti confetti4" />
          <div className="confetti confetti5" />
        </div>
        {/* Abstract SVG background */}
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-tr from-blue-200/60 via-orange-100/60 to-pink-200/60 blur-2xl opacity-70 z-0" style={{ clipPath: 'ellipse(80% 100% at 50% 0%)' }} />
        <div className="relative z-10 p-10 pt-20">
          {/* Brand Love Badge */}
          <div className="mb-6">
            <div className="mx-auto max-w-md text-center backdrop-blur rounded-2xl border border-pink-100 shadow-sm p-4">
              <div className="text-sm font-semibold text-gray-700">We love <span className="align-middle">❤</span></div>
              <div className="text-2xl font-extrabold text-orange-500">YesITryMe</div>
              <div className="text-xs text-gray-600 mt-1">YesITryMe Try krega india</div>
            </div>
          </div>
          <div className="flex flex-col items-center mb-8">
            <div className="relative group cursor-pointer transition-all duration-300 mb-3">
              <span className={`inline-block rounded-full p-0.5 ${user.status === 'free' ? 'border-4 border-red-500' :
                user.status === 'active' ? 'border-4 border-yellow-400' :
                  user.status === 'kyc_verified' ? 'border-4 border-green-500' :
                    user.status === 'blocked' ? 'border-4 border-black' : ''
                }`}>
                <img
                  src={user.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=ff6b35&color=fff&size=200`}
                  alt="User"
                  className="w-24 h-24 rounded-full text-orange-500 transition-transform duration-200 group-hover:scale-110 relative object-cover"
                  onClick={() => fileInputRef.current.click()}
                  style={{ cursor: 'pointer' }}
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=ff6b35&color=fff&size=200`;
                  }}
                />
              </span>
              {/* Overlay on hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 rounded-full">
                <button
                  className="bg-blue-500 text-white rounded-full p-2 shadow hover:bg-blue-600 transition flex items-center gap-1 text-xs font-semibold"
                  onClick={() => fileInputRef.current.click()}
                  title="Update Photo"
                  disabled={uploading}
                  type="button"
                >
                  <Edit3 size={18} /> <span className="hidden sm:inline">Update</span>
                </button>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                ref={fileInputRef}
                className="hidden"
                onChange={handlePhotoChange}
                disabled={uploading}
                title="Click to upload profile photo (will be automatically compressed for better performance)"
              />
            </div>
            {uploading && (
              <div className="flex items-center gap-2 text-xs text-blue-500 font-semibold mt-1 animate-pulse">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                Compressing & uploading...
              </div>
            )}
            {uploadError && <div className="text-xs text-red-500 font-semibold mt-1">{uploadError}</div>}
            {showSuccess && (
              <div className="flex items-center gap-1 text-green-600 text-xs font-semibold mt-1 animate-fade-in">
                <CheckCircle2 size={16} /> Photo updated & optimized!
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1 text-center">
              💡 Images are automatically compressed for better performance
            </div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-3xl font-extrabold text-gray-800 drop-shadow">{user.firstName} {user.lastName}</h2>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-orange-500 text-base font-bold tracking-wide">{user.userId}</p>
              <button
                className="p-1 rounded hover:bg-orange-100 transition"
                onClick={() => { navigator.clipboard.writeText(user.userId); setCopiedId(true); setTimeout(() => setCopiedId(false), 1200); }}
                title="Copy User ID"
              >
                <Copy size={16} className="text-orange-400" />
              </button>
              {copiedId && <span className="text-xs text-green-600 font-semibold ml-1 animate-fade-in">Copied!</span>}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-600 text-sm">Mobile: {user.mobile}</span>
              <button
                className="p-1 rounded hover:bg-blue-100 transition"
                onClick={() => { navigator.clipboard.writeText(user.mobile); setCopiedMobile(true); setTimeout(() => setCopiedMobile(false), 1200); }}
                title="Copy Mobile"
              >
                <Copy size={16} className="text-blue-400" />
              </button>
              {copiedMobile && <span className="text-xs text-green-600 font-semibold ml-1 animate-fade-in">Copied!</span>}
            </div>
            {/* KYC badge with tooltip */}
            <div className="flex flex-col items-center mt-2">
              <div className="relative group">
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold shadow cursor-pointer ${kycVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                  tabIndex={0}
                >
                  <BadgeCheck size={18} className={kycVerified ? 'text-green-500' : 'text-yellow-500'} />
                  {kycVerified ? 'KYC Verified' : 'KYC Pending'}
                </span>
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-max px-3 py-2 rounded bg-black/80 text-white text-xs opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition pointer-events-none z-20">
                  {kycVerified ? 'Your KYC is fully verified.' : 'Complete your KYC to unlock all features.'}
                </span>
              </div>
            </div>

            {/* ID Card Button */}
            <button
              onClick={() => setShowIdCard(true)}
              className="mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all font-semibold"
            >
              <CreditCard size={20} />
              View ID Card
            </button>
            {/* We Love Button */}
            <button
              onClick={() => setShowWeLove(true)}
              className="mt-3 bg-white text-red-600 border border-red-300 px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-md transition-all font-semibold"
              type="button"
            >
              <Heart size={20} className="text-red-500" />
              We Love
            </button>
          </div>
          <div className="space-y-5 z-10 relative">
            <InfoItem icon={<UserIcon size={20} />} label="Full Name" value={`${user.firstName} ${user.lastName}`} />
            <InfoItem icon={<Smartphone size={20} />} label="Mobile" value={user.mobile} />
            <InfoItem icon={<Mail size={20} />} label="Email" value={user.email} />
            <InfoItem icon={<MapPin size={20} />} label="Location" value={`${user.city}, ${user.state}`} />
            <InfoItem icon={<UserCheck size={20} />} label="Sponsor" value={user.sponsorName} />
            <InfoItem icon={<Phone size={20} />} label="Sponsor Mobile" value={sponsorMobile} />
            <InfoItem icon={<CalendarDays size={20} />} label="Joined" value={registrationDate} />
            <InfoItem icon={<BadgeCheck size={20} />} label="KYC Status" value={kycVerified ? 'Verified' : 'Pending'} />
            {user.kycApprovedDate && (
              <InfoItem icon={<CalendarDays size={20} />} label="KYC Approved Date" value={new Date(user.kycApprovedDate).toLocaleDateString()} />
            )}
            <InfoItem icon={<CalendarDays size={20} />} label="Activation Date" value={activationDate} />
          </div>
          {/* Fun Fact / Motivational Quote */}
          <div className="mt-8 text-center text-base font-semibold text-blue-600 bg-blue-50/60 rounded-xl py-3 px-4 shadow-inner animate-fade-in">
            {randomFact}
          </div>
        </div>
        {/* Confetti CSS */}
        <style>{`
          .confetti { position: absolute; width: 10px; height: 10px; border-radius: 2px; opacity: 0.7; z-index: 1; }
          .confetti1 { background: #fbbf24; left: 10%; top: 10%; animation: confetti-fall 3s linear infinite; }
          .confetti2 { background: #60a5fa; left: 80%; top: 15%; animation: confetti-fall 2.5s linear infinite 0.5s; }
          .confetti3 { background: #f472b6; left: 30%; top: 5%; animation: confetti-fall 2.8s linear infinite 1s; }
          .confetti4 { background: #34d399; left: 60%; top: 8%; animation: confetti-fall 3.2s linear infinite 1.2s; }
          .confetti5 { background: #f87171; left: 50%; top: 12%; animation: confetti-fall 2.7s linear infinite 0.7s; }
          @keyframes confetti-fall {
            0% { transform: translateY(0) rotate(0deg); }
            100% { transform: translateY(120px) rotate(360deg); opacity: 0.2; }
          }
          .animate-bounce-in { animation: bounce-in 1s cubic-bezier(0.68,-0.55,0.27,1.55) both; }
          @keyframes bounce-in {
            0% { transform: scale(0.7); opacity: 0; }
            60% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>

      {/* ID Card Modal */}
      {showIdCard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">ID Card</h3>
              <button
                onClick={() => setShowIdCard(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* ID Card Content */}
            <div className="p-6">
              <div
                ref={idCardRef}
                className="rounded-2xl p-6 shadow-2xl bg-white border-2 border-orange-200 text-gray-800"
                style={{ minHeight: '400px' }}
              >
                {/* Brand Header */}
                <div className="text-center mb-5">
                  <div className="text-sm font-bold text-gray-800 mb-1">We love ❤️</div>
                  <div className="text-3xl font-black text-orange-600 mb-1">YesITryMe</div>
                  <div className="text-sm text-gray-700">YesITryMe Try krega india</div>
                </div>
                {/* User Photo and Info */}
                <div className="flex items-center gap-4 mb-5">
                  {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt="User"
                      className="w-20 h-20 rounded-full border-4 border-orange-100 object-cover shadow-sm"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-20 h-20 rounded-full border-4 border-orange-100 bg-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-sm ${user.imageUrl ? 'hidden' : 'flex'}`}
                  >
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-extrabold text-gray-900 mb-2">{user.firstName} {user.lastName}</div>
                    <div className="text-sm text-gray-600">ID: <span className="font-semibold text-gray-900">{user.userId}</span></div>
                  </div>
                </div>
                {/* Contact Info */}
                <div className="rounded-xl p-4 mb-5 bg-orange-50 border border-orange-100">
                  <div className="text-sm text-gray-700 mb-1">📱 {user.mobile}</div>
                  <div className="text-sm text-gray-700 mb-1">📧 {user.email}</div>
                  <div className="text-sm text-gray-700">📍 {user.city}, {user.state}</div>
                </div>
                {/* Services */}
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-800 mb-3 text-center">🎯 Our Services</div>
                  <div className="flex flex-wrap gap-2 justify-center items-center">
                    {services.map((service, index) => (
                      <span key={index} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white border border-orange-200 text-orange-700 shadow-sm inline-block">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Footer */}
                <div className="flex items-center justify-between mt-5 text-[11px] text-gray-600">
                  <div>Member since: <span className="font-semibold text-gray-800">{registrationDate}</span></div>
                  <div>Status: <span className="font-semibold text-gray-800">{user.status}</span></div>
                </div>

                {/* Watermark */}
                <div className="mt-4 text-center text-[10px] text-gray-400">© YesITryMe</div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={downloadIdCard}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all font-semibold"
                >
                  <Download size={18} />
                  Download
                </button>
                <button
                  onClick={shareIdCard}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all font-semibold"
                >
                  <Share2 size={18} />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* We Love Modal */}
      {showWeLove && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            {/* Header */}

            {/* Content */}
            <div className={`px-6 pb-6 pt-10 text-center ${isCapturingWeLove ? 'we-love-capture' : ''}`} style={{ width: 360, margin: '0 auto', display: 'block' }}>
              {/* Capture area: only this will be converted to image */}
              <div ref={weLoveRef} className="bg-white rounded-xl we-love-card" style={{ paddingBottom: 12 }}>
                {/* Title above heart */}
                <div className="text-3xl font-bold text-gray-800 mb-2">We Love ❤️</div>
                {/* Bigger Heart + centered User photo */}
                <div className="relative flex items-center justify-center mb-6">
                  <div className="text-[150px] leading-none select-none">❤️</div>
                  <span className="absolute inset-0 flex items-center justify-center">
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt="User"
                        className="w-20 h-20 rounded-full border-4 border-white object-cover shadow"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-20 h-20 rounded-full border-4 border-white bg-orange-500 text-white font-bold text-xl items-center justify-center shadow ${user.imageUrl ? 'hidden' : 'flex'}`}>
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </div>
                  </span>
                </div>

                {/* Brand title and tagline (no background) */}
                <div className="text-4xl font-black text-orange-600 tracking-tight mb-1">YesITryMe</div>
                <div className="text-sm font-semibold text-gray-700 mb-4">YesITryMe Try Karega India</div>

                {/* Promo bullets */}
                <div className="grid grid-cols-2 gap-2 text-left max-w-sm mx-auto">
                  <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-800 text-xs font-semibold rounded-lg px-3 py-2">🎬 YouTube earning</div>
                  <div className="flex items-center gap-2 bg-pink-50 border border-pink-100 text-pink-800 text-xs font-semibold rounded-lg px-3 py-2">📚 Courses & Ebooks</div>
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-800 text-xs font-semibold rounded-lg px-3 py-2">🤖 AI Tools</div>
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold rounded-lg px-3 py-2">🛍️ Products & Subscriptions</div>
                </div>
              </div>

              {/* Separate actions (not captured) */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={shareWeLove}
                  className="bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                  type="button"
                >
                  Share
                </button>
                <button
                  onClick={downloadWeLove}
                  className="bg-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  type="button"
                >
                  <Download size={18} />
                  Download
                </button>
              </div>

              <button
                onClick={() => setShowWeLove(false)}
                className="mt-4 w-full text-gray-600 hover:text-gray-800 text-sm font-semibold"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Capture styles to keep dimensions stable and disable animations during snapshot */}
      <style>{`
        .we-love-capture, .we-love-capture * { 
          animation: none !important; 
          transition: none !important; 
        }
        .we-love-card { width: 360px; margin: 0 auto; }
      `}</style>
    </>
  );
};

export default Profile;