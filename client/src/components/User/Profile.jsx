import { BadgeCheck, BookOpen, Bot, CalendarDays, CheckCircle2, Coins, Copy, CreditCard, Download, Edit3, Heart, Mail, MapPin, Phone, Share2, ShoppingBag, Smartphone, UserCheck, User as UserIcon, X } from 'lucide-react';
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
      const message = `We Love ❤ YesITryMe\n\n${user.firstName} ${user.lastName} (ID: ${user.userId}) is growing with YesITryMe!\n\n✓ Coin rewards & earning opportunities\n✓ Premium courses and ebooks\n✓ AI tools for faster growth\n✓ Subscription and physical products\n\nJoin the movement — YesITryMe Try Karega India 🇮🇳\n\nProfile: ${profileUrl}\nWebsite: ${homepageUrl}`;
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
    "Coin rewards",
    "Courses",
    "Ebook",
    "AI tools",
    "Subscription base product",
    "Physical product",
    "Utility product",
    "Shopping portal"
  ];

  // Promo bullets on the We Love card
  const weLovePerks = [
    { icon: Coins, label: 'Coin rewards' },
    { icon: BookOpen, label: 'Courses & Ebooks' },
    { icon: Bot, label: 'AI Tools' },
    { icon: ShoppingBag, label: 'Products & Subscriptions' },
  ];

  // removed unused categories

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-orange-50/60 to-white px-4 sm:px-6 pt-20 pb-12">
        <div className="max-w-xl mx-auto space-y-4">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Brand Love Badge */}
            <div className="bg-orange-50 px-5 py-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
              <span className="font-semibold text-gray-700">
                We love <span className="text-red-500">❤</span> <span className="font-bold text-brand-deep">YesITryMe</span>
              </span>
              <span className="text-gray-500">YesITryMe Try krega india</span>
            </div>

            <div className="p-6 sm:p-8 flex flex-col items-center text-center">
              <p className="text-sm text-gray-500 mb-4">Welcome, {user.firstName}!</p>

              {/* Avatar with status ring - click to update photo */}
              <div className="relative group cursor-pointer mb-3">
                <span className={`inline-block rounded-full p-0.5 ${user.status === 'free' ? 'ring-[3px] ring-red-500' :
                  user.status === 'active' ? 'ring-[3px] ring-yellow-400' :
                    user.status === 'kyc_verified' ? 'ring-[3px] ring-green-500' :
                      user.status === 'blocked' ? 'ring-[3px] ring-black' : ''
                  }`}>
                  <img
                    src={user.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=ff6b35&color=fff&size=200`}
                    alt="User"
                    className="w-24 h-24 rounded-full relative object-cover"
                    onClick={() => fileInputRef.current.click()}
                    style={{ cursor: 'pointer' }}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=ff6b35&color=fff&size=200`;
                    }}
                  />
                </span>
                {/* Overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 rounded-full">
                  <button
                    className="bg-white text-gray-800 rounded-full px-3 py-1.5 shadow flex items-center gap-1 text-xs font-semibold"
                    onClick={() => fileInputRef.current.click()}
                    title="Update Photo"
                    disabled={uploading}
                    type="button"
                  >
                    <Edit3 size={14} /> <span className="hidden sm:inline">Update</span>
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
                <div className="flex items-center gap-2 text-xs text-gray-600 font-medium mb-1">
                  <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                  Compressing & uploading...
                </div>
              )}
              {uploadError && <div className="text-xs text-red-600 font-medium mb-1">{uploadError}</div>}
              {showSuccess && (
                <div className="flex items-center gap-1 text-green-600 text-xs font-medium mb-1 animate-fade-in">
                  <CheckCircle2 size={14} /> Photo updated & optimized!
                </div>
              )}
              <div className="text-xs text-gray-500 mb-4">
                Images are automatically compressed for better performance
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-gray-900">{user.firstName} {user.lastName}</h2>

              {/* User ID and mobile with copy buttons */}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-brand-deep">{user.userId}</span>
                  <button
                    className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => { navigator.clipboard.writeText(user.userId); setCopiedId(true); setTimeout(() => setCopiedId(false), 1200); }}
                    title="Copy User ID"
                  >
                    <Copy size={14} />
                  </button>
                  {copiedId && <span className="text-xs text-green-600 font-semibold animate-fade-in">Copied!</span>}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Mobile: {user.mobile}</span>
                  <button
                    className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => { navigator.clipboard.writeText(user.mobile); setCopiedMobile(true); setTimeout(() => setCopiedMobile(false), 1200); }}
                    title="Copy Mobile"
                  >
                    <Copy size={14} />
                  </button>
                  {copiedMobile && <span className="text-xs text-green-600 font-semibold animate-fade-in">Copied!</span>}
                </div>
              </div>

              {/* KYC badge with tooltip */}
              <div className="relative group mt-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-default ${kycVerified ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}
                  tabIndex={0}
                >
                  <BadgeCheck size={14} />
                  {kycVerified ? 'KYC Verified' : 'KYC Pending'}
                </span>
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-max px-3 py-2 rounded-lg bg-gray-900 text-white text-xs opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition pointer-events-none z-20">
                  {kycVerified ? 'Your KYC is fully verified.' : 'Complete your KYC to unlock all features.'}
                </span>
              </div>

              {/* ID Card and We Love buttons */}
              <div className="mt-6 grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 w-full max-w-sm">
                <button
                  onClick={() => setShowIdCard(true)}
                  className="bg-brand-deep hover:bg-brand-deeper text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                  <CreditCard size={18} />
                  View ID Card
                </button>
                <button
                  onClick={() => setShowWeLove(true)}
                  className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                  type="button"
                >
                  <Heart size={18} className="text-red-500" />
                  We Love
                </button>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 sm:px-6 py-2">
            <div className="divide-y divide-gray-100">
              <InfoItem icon={<UserIcon size={18} />} label="Full Name" value={`${user.firstName} ${user.lastName}`} />
              <InfoItem icon={<Smartphone size={18} />} label="Mobile" value={user.mobile} />
              <InfoItem icon={<Mail size={18} />} label="Email" value={user.email} />
              <InfoItem icon={<MapPin size={18} />} label="Location" value={`${user.city}, ${user.state}`} />
              <InfoItem icon={<UserCheck size={18} />} label="Sponsor" value={user.sponsorName} />
              <InfoItem icon={<Phone size={18} />} label="Sponsor Mobile" value={sponsorMobile} />
              <InfoItem icon={<CalendarDays size={18} />} label="Joined" value={registrationDate} />
              <InfoItem icon={<BadgeCheck size={18} />} label="KYC Status" value={kycVerified ? 'Verified' : 'Pending'} />
              {user.kycApprovedDate && (
                <InfoItem icon={<CalendarDays size={18} />} label="KYC Approved Date" value={new Date(user.kycApprovedDate).toLocaleDateString()} />
              )}
              <InfoItem icon={<CalendarDays size={18} />} label="Activation Date" value={activationDate} />
            </div>
          </div>

          {/* Fun Fact / Motivational Quote */}
          <div className="text-center text-sm font-medium text-gray-600 bg-white rounded-2xl border border-gray-200 shadow-sm py-4 px-5">
            {randomFact}
          </div>
        </div>
      </div>

      {/* ID Card Modal */}
      {showIdCard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">ID Card</h3>
                <p className="text-xs text-gray-500 mt-0.5">Download or share your member card</p>
              </div>
              <button
                onClick={() => setShowIdCard(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                type="button"
                aria-label="Close ID card"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* ID Card Content */}
            <div className="p-5">
              {/* Capture area (html2canvas): solid colours, borders and plain backgrounds only */}
              <div
                ref={idCardRef}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden text-gray-900"
                style={{ minHeight: '400px', backgroundColor: '#ffffff' }}
              >
                {/* Brand Header */}
                <div className="bg-brand-deep px-5 py-4 text-white" style={{ borderTopLeftRadius: 15, borderTopRightRadius: 15 }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                        We love
                        <Heart size={12} color="#ffffff" fill="#ffffff" aria-hidden="true" />
                      </div>
                      <div className="text-2xl font-extrabold tracking-tight leading-tight text-white mt-0.5">YesITryMe</div>
                      <div className="text-xs text-white mt-0.5">YesITryMe Try krega india</div>
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-white border border-white rounded-md px-2 py-1 whitespace-nowrap">
                      Member ID
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {/* User Photo and Info */}
                  <div className="flex items-center gap-4">
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt="User"
                        className="w-20 h-20 rounded-xl border border-gray-200 object-cover flex-shrink-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-20 h-20 rounded-xl border border-orange-100 bg-orange-50 items-center justify-center text-brand-deep font-bold text-2xl flex-shrink-0 ${user.imageUrl ? 'hidden' : 'flex'}`}
                    >
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Member</div>
                      <div className="text-xl font-bold text-gray-900 leading-tight mt-0.5 break-words">{user.firstName} {user.lastName}</div>
                      <div className="mt-2 inline-block rounded-md bg-orange-50 border border-orange-100 px-2 py-0.5 text-xs text-gray-600">
                        ID: <span className="font-semibold text-brand-deep">{user.userId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-5">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Contact</div>
                    <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
                      <div className="flex items-center gap-3 px-3 py-2">
                        <span className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                          <Smartphone size={14} color="#CC3E00" aria-hidden="true" />
                        </span>
                        <span className="text-sm text-gray-700 min-w-0 break-all">{user.mobile}</span>
                      </div>
                      <div className="flex items-center gap-3 px-3 py-2">
                        <span className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                          <Mail size={14} color="#CC3E00" aria-hidden="true" />
                        </span>
                        <span className="text-sm text-gray-700 min-w-0 break-all">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-3 px-3 py-2">
                        <span className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                          <MapPin size={14} color="#CC3E00" aria-hidden="true" />
                        </span>
                        <span className="text-sm text-gray-700 min-w-0 break-words">{user.city}, {user.state}</span>
                      </div>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="mt-5">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Our Services</div>
                    <div className="flex flex-wrap gap-1.5">
                      {services.map((service, index) => (
                        <span key={index} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100 text-brand-deep inline-block">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Member since</div>
                      <div className="text-sm font-semibold text-gray-900 mt-0.5">{registrationDate}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Status</div>
                      <div className="text-sm font-semibold text-gray-900 mt-0.5">{user.status}</div>
                    </div>
                  </div>

                  {/* Watermark */}
                  <div className="mt-4 text-center text-[10px] text-gray-400">© YesITryMe</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-5">
                <button
                  onClick={downloadIdCard}
                  className="bg-brand-deep hover:bg-brand-deeper text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                  type="button"
                >
                  <Download size={18} />
                  Download
                </button>
                <button
                  onClick={shareIdCard}
                  className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                  type="button"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">We Love</h3>
                <p className="text-xs text-gray-500 mt-0.5">Download or share your We Love card</p>
              </div>
              <button
                onClick={() => setShowWeLove(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                type="button"
                aria-label="Close We Love card"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className={`p-5 ${isCapturingWeLove ? 'we-love-capture' : ''}`}>
              {/* Capture area: only this will be converted to image (solid colours, borders and plain backgrounds only) */}
              <div
                ref={weLoveRef}
                className="we-love-card bg-white rounded-2xl border border-gray-200 overflow-hidden text-center text-gray-900"
                style={{ backgroundColor: '#ffffff' }}
              >
                {/* Title above heart */}
                <div className="pt-6 px-5 flex items-center justify-center gap-2 text-2xl font-bold text-gray-900">
                  We Love
                  <Heart size={22} color="#ef4444" fill="#ef4444" aria-hidden="true" />
                </div>

                {/* Big heart + centered user photo */}
                <div className="relative flex items-center justify-center my-3" style={{ height: 170 }}>
                  <Heart size={170} color="#ef4444" fill="#ef4444" strokeWidth={1} aria-hidden="true" />
                  <span className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: 14 }}>
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt="User"
                        className="w-20 h-20 rounded-full border-4 border-white object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-20 h-20 rounded-full border-4 border-white bg-brand-deep text-white font-bold text-xl items-center justify-center ${user.imageUrl ? 'hidden' : 'flex'}`}>
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </div>
                  </span>
                </div>

                {/* Brand title and tagline */}
                <div className="text-4xl font-black tracking-tight text-brand-deep">YesITryMe</div>
                <div className="text-sm font-medium text-gray-600 mt-1">YesITryMe Try Karega India</div>

                {/* Promo bullets */}
                <div className="grid grid-cols-2 gap-2 text-left p-5">
                  {weLovePerks.map(({ icon: PerkIcon, label }) => (
                    <div key={label} className="flex items-center gap-2 bg-orange-50 border border-orange-100 text-brand-deep text-xs font-semibold leading-tight rounded-lg px-3 py-2">
                      <PerkIcon size={16} color="#CC3E00" className="flex-shrink-0" aria-hidden="true" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Separate actions (not captured) */}
              <div className="grid grid-cols-2 gap-3 mt-5">
                <button
                  onClick={downloadWeLove}
                  className="bg-brand-deep hover:bg-brand-deeper text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                  type="button"
                >
                  <Download size={18} />
                  Download
                </button>
                <button
                  onClick={shareWeLove}
                  className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                  type="button"
                >
                  <Share2 size={18} />
                  Share
                </button>
              </div>
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
        .we-love-card { width: 360px; max-width: 100%; margin: 0 auto; }
      `}</style>
    </>
  );
};

export default Profile;