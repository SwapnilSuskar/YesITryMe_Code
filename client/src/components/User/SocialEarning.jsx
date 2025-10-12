import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  ThumbsUp,
  MessageCircle,
  UserPlus,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Coins,
  Youtube,
  RefreshCw,
  Gift,
  Sparkles,
  Trophy,
  Share2,
  Star,
  Flame,
  TrendingUp,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/toast.css';
import LoginPrompt from '../UI/LoginPrompt';

const SocialEarning = () => {
  const { user, token } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [coinBalance, setCoinBalance] = useState(0);
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [youtubeChannelInfo, setYoutubeChannelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState({});
  const [activationBonusGranted, setActivationBonusGranted] = useState(false);
  const [claimedTaskIds, setClaimedTaskIds] = useState(new Set());
  const [withdrawing, setWithdrawing] = useState(false);
  const [pendingWithdrawal, setPendingWithdrawal] = useState(null);
  const [watchTimers, setWatchTimers] = useState({}); // Track watch time for each task
  const [isWatching, setIsWatching] = useState({}); // Track if user is currently watching
  const [videoOpened, setVideoOpened] = useState({}); // Track if user has opened the video
  const [isVideoPlaying, setIsVideoPlaying] = useState({}); // Track if video is actually playing
  const [hasActivePackages, setHasActivePackages] = useState(false);
  const progressToWithdraw = Math.min(100, Math.round((coinBalance / 20000) * 100));
  const userFirstName = user?.firstName || 'Friend';
  const userDisplayName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'You';

  // User can share tasks if they have purchased a package (regardless of KYC status)
  // This prevents the edge case where admin manually sets kyc_verified without package purchase
  const canShareTasks = hasActivePackages;

  const getReferralLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const code = user?.referrer_code || user?.referral_code || user?.userId || '';
    return `${origin}/?referrer_code=${encodeURIComponent(code)}`;
  };

  const getReferralCode = () => {
    return user?.referralCode || user?.referrer_code || user?.referral_code || user?.userId || '';
  };

  // Define fetch functions first
  const fetchSocialTasks = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.social.tasks, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching social tasks:', error);
    }
  }, [token]);

  const fetchCoinBalance = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.coins.balance, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCoinBalance(data.data?.balance || 0);
        setActivationBonusGranted(data.data?.activationBonusGranted || false);
      }
    } catch (error) {
      console.error('Error fetching coin balance:', error);
    }
  }, [token]);

  const fetchYouTubeChannelInfo = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.social.youtubeChannel, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setYoutubeChannelInfo(data.data);
      }
    } catch (error) {
      console.error('Error fetching YouTube channel info:', error);
    }
  }, [token]);

  const fetchYouTubeStatus = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.social.youtubeStatus, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const isConnected = data.connected && data.hasValidToken;
        setYoutubeConnected(isConnected);

        // If connected, fetch channel info
        if (isConnected) {
          await fetchYouTubeChannelInfo();
        }
      }
    } catch (error) {
      console.error('Error fetching YouTube status:', error);
    }
  }, [token, fetchYouTubeChannelInfo]);

  const checkActivationBonus = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.coins.balance, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setActivationBonusGranted(data.data?.activationBonusGranted || false);
      }
    } catch (error) {
      console.error('Error checking activation bonus:', error);
    }
  }, [token]);

  const checkPendingWithdrawal = useCallback(async () => {
    try {
      // Fetch latest withdrawal transactions (any status)
      const response = await fetch(`${API_ENDPOINTS.coins.transactions}?type=withdrawal&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const withdrawals = (data.data?.transactions || []).filter(t => t.type === 'withdrawal');
        if (withdrawals.length > 0) {
          withdrawals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setPendingWithdrawal(withdrawals[0]);
        } else {
          setPendingWithdrawal(null);
        }
      }
    } catch (error) {
      console.error('Error checking pending withdrawal:', error);
    }
  }, [token]);

  const checkActivePackages = useCallback(async () => {
    try {
      // Check both regular packages and super packages
      const [regularResponse, superResponse] = await Promise.all([
        fetch(API_ENDPOINTS.packages.purchases, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(API_ENDPOINTS.superPackages.purchases, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      let hasActivePackages = false;

      // Check regular packages
      if (regularResponse.ok) {
        const regularData = await regularResponse.json();
        const regularPurchases = regularData.data?.purchases || [];
        hasActivePackages = regularPurchases.some(purchase => purchase.status === 'active');
      }

      // Check super packages if regular packages are not active
      if (!hasActivePackages && superResponse.ok) {
        const superData = await superResponse.json();
        const superPurchases = superData.data?.purchases || [];
        hasActivePackages = superPurchases.some(purchase => purchase.status === 'active');
      }

      setHasActivePackages(hasActivePackages);
    } catch (error) {
      console.error('Error checking active packages:', error);
      setHasActivePackages(false);
    }
  }, [token]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSocialTasks(),
        fetchCoinBalance(),
        fetchYouTubeStatus(),
        checkActivationBonus(),
        checkPendingWithdrawal(),
        checkActivePackages()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchSocialTasks, fetchCoinBalance, fetchYouTubeStatus, checkActivationBonus, checkPendingWithdrawal, checkActivePackages]);

  const getTaskShareLink = (task) => {
    const code = getReferralCode();
    const base = API_ENDPOINTS.base;
    return `${base}/api/social/public/start?referral_code=${encodeURIComponent(code)}&task_id=${encodeURIComponent(task._id)}`;
  };

  const copyTaskShareLink = async (task) => {
    try {
      if (!canShareTasks) {
        toast.info('Purchase any Package or Super Package to activate your account and share tasks.');
        return;
      }
      const link = getTaskShareLink(task);
      await navigator.clipboard.writeText(link);
      toast.success('Task share link copied! Post it on WhatsApp, Facebook, etc.');
    } catch (_) {
      toast.error('Failed to copy link');
    }
  };

  const copyReferralLink = async () => {
    try {
      const link = getReferralLink();
      await navigator.clipboard.writeText(link);
      toast.success('Referral link copied! Share it with your friends.');
    } catch (_) {
      toast.error('Failed to copy link');
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchData();
    }
  }, [user, token, fetchData]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(watchTimers).forEach(timer => {
        if (typeof timer === 'number' && timer > 0) {
          clearInterval(timer);
        }
      });
    };
  }, [watchTimers]);

  // Load YouTube API for embedded videos
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  const disconnectYouTube = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.social.youtubeDisconnect, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setYoutubeConnected(false);
        setYoutubeChannelInfo(null);
      } else {
        console.error('Disconnect failed:', data.message);
      }
    } catch (e) {
      console.error('Disconnect error:', e);
    }
  };

  const connectYouTube = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.social.youtubeOAuthStart, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error starting YouTube OAuth:', error);
      toast.error('Failed to connect YouTube account');
    }
  };

  const grantActivationBonus = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.coins.activationBonus, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCoinBalance(data.newBalance);
        setActivationBonusGranted(true);
        toast.success(data.message);
      } else {
        const error = await response.json();
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Error granting activation bonus:', error);
      toast.error('Failed to grant activation bonus');
    }
  };

  const withdrawCoins = async () => {
    // 100 coins = ₹1; minimum withdrawal = ₹200 => 20000 coins
    const minimumCoins = 200 * 100;
    if (coinBalance < minimumCoins) {
      toast.error('Minimum withdrawal is ₹200 (20000 coins)');
      return;
    }
    try {
      setWithdrawing(true);
      const response = await fetch(API_ENDPOINTS.coins.withdraw, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: coinBalance })
      });
      const data = await response.json();
      if (response.ok) {
        setCoinBalance(data.newBalance);
        setPendingWithdrawal({
          amount: coinBalance,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
        toast.success(`Withdrawal request submitted for ₹${(coinBalance / 100).toFixed(2)}. It will be processed within 24-48 hours.`);
      } else {
        toast.error(data.message || 'Failed to request withdrawal');
      }
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      toast.error('Failed to request withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };

  const verifyAction = async (taskId, action) => {
    // Prevent multiple submissions for the same task
    if (claimedTaskIds.has(taskId)) {
      toast.info('This task has already been claimed');
      return;
    }

    if (verifying[taskId]) {
      toast.info('Please wait, verification in progress...');
      return;
    }
    try {
      setVerifying(prev => ({ ...prev, [taskId]: true }));

      // For view tasks, include watch time in the request
      const requestBody = { taskId, action };
      if (action === 'view') {
        const watchTime = watchTimers[taskId] || 0;
        requestBody.watchTime = watchTime;
      }

      const response = await fetch(API_ENDPOINTS.social.verify, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        setCoinBalance(data.newBalance);
        toast.success(data.message);
        // Mark as claimed locally so the UI shows "Claimed" without removing the task
        setClaimedTaskIds(prev => new Set([...prev, taskId]));
        // Stop and hide watch timer for view tasks after successful claim
        if (action === 'view') {
          stopWatchTimer(taskId);
        }
      } else {
        if (response.status === 403 && data?.requiresReconnect) {
          toast.error(data.message);
          try {
            await disconnectYouTube();
          } catch (_) { }
          toast.info('Reconnecting YouTube to update permissions...');
          setTimeout(() => {
            connectYouTube();
          }, 800);
          return;
        }
        toast.error(data.message);
        // If already claimed on server, mark as claimed locally
        if (typeof data.message === 'string' && data.message.toLowerCase().includes('already claimed')) {
          setClaimedTaskIds(prev => new Set([...prev, taskId]));
        }
      }
    } catch (error) {
      console.error('Error verifying action:', error);
      toast.error('Failed to verify action');
    } finally {
      setVerifying(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'view': return <Play className="w-5 h-5" />;
      case 'like': return <ThumbsUp className="w-5 h-5" />;
      case 'comment': return <MessageCircle className="w-5 h-5" />;
      case 'subscribe': return <UserPlus className="w-5 h-5" />;
      default: return <ExternalLink className="w-5 h-5" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'view': return 'text-blue-600 bg-blue-100';
      case 'like': return 'text-red-600 bg-red-100';
      case 'comment': return 'text-green-600 bg-green-100';
      case 'subscribe': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const extractYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getYouTubeEmbedUrl = (url) => {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&autoplay=0&controls=1&rel=0&modestbranding=1`;
  };

  const startWatchTimer = (taskId) => {
    // Start timer for view tasks
    setIsWatching(prev => ({ ...prev, [taskId]: true }));
    setWatchTimers(prev => ({ ...prev, [taskId]: 0 }));

    const timer = setInterval(() => {
      setWatchTimers(prev => {
        const newTime = (prev[taskId] || 0) + 1;
        return { ...prev, [taskId]: newTime };
      });
    }, 1000);
    // Store timer reference for cleanup
    setWatchTimers(prev => ({ ...prev, [`${taskId}_timer`]: timer }));
  };

  const handleVideoPlay = (taskId) => {
    setIsVideoPlaying(prev => ({ ...prev, [taskId]: true }));
    // Always start timer when video begins playing (if not already started)
    if (!isWatching[taskId]) {
      startWatchTimer(taskId);
    }
  };

  const handleVideoPause = (taskId) => {
    setIsVideoPlaying(prev => ({ ...prev, [taskId]: false }));
    if (watchTimers[`${taskId}_timer`]) {
      clearInterval(watchTimers[`${taskId}_timer`]);
      setWatchTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[`${taskId}_timer`];
        return newTimers;
      });
    }
  };

  const stopWatchTimer = (taskId) => {
    setIsWatching(prev => ({ ...prev, [taskId]: false }));
    const timer = watchTimers[`${taskId}_timer`];
    if (timer) {
      clearInterval(timer);
      setWatchTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[`${taskId}_timer`];
        return newTimers;
      });
    }
    // Reset video opened state so user can restart the process
    setVideoOpened(prev => ({ ...prev, [taskId]: false }));
  };

  const openYouTubeLink = (url, taskId, action) => {
    if (action === 'view') {
      // For view tasks, show the embedded video instead of opening in new tab
      setVideoOpened(prev => ({ ...prev, [taskId]: true }));
      return;
    }

    // For non-view tasks, open in new tab
    if (youtubeChannelInfo && youtubeChannelInfo.channelId) {
      // Add a parameter to help YouTube identify the connected account
      // This is a best-effort approach - YouTube will use the logged-in account
      const separator = url.includes('?') ? '&' : '?';
      const enhancedUrl = `${url}${separator}channel=${youtubeChannelInfo.channelId}`;
      window.open(enhancedUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback to regular link opening
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };


  if (!user) {
    return <LoginPrompt type="socialEarning" />
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fff1e6] via-[#fff] to-[#ffe4d6] pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading social earning dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer
        position="top-center"
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
        autoClose={2500}
        hideProgressBar={false}
        draggable
      />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-20 pb-10 mt-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700 text-sm font-semibold mb-3">
              <Sparkles className="w-4 h-4" />
              Welcome, {userFirstName}!
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 mb-2">Social Earning</h1>
            <p className="text-gray-600">Earn coins by engaging with YouTube content</p>
          </div>

          {/* Coin Balance Card */}
          <div className="rounded-2xl p-6 mb-8 bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_10px_30px_-12px_rgba(255,164,107,0.5)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center ring-4 ring-orange-100 flex-shrink-0">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Your Coins</h3>
                  <p className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-orange-600">{coinBalance}</p>
                  <p className="text-xs text-gray-600 mt-1">≈ ₹{(coinBalance / 100).toFixed(2)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <span className="hidden sm:inline">•</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-pink-500" />
                      <span>{progressToWithdraw}% to next withdrawal</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <button
                  onClick={fetchData}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button
                  onClick={withdrawCoins}
                  disabled={withdrawing || coinBalance < 20000 || (pendingWithdrawal && pendingWithdrawal.status === 'pending')}
                  title={
                    pendingWithdrawal && pendingWithdrawal.status === 'pending'
                      ? 'You have a pending withdrawal request'
                      : coinBalance < 20000
                        ? 'Minimum ₹200 (20000 coins) required'
                        : 'Request withdrawal'
                  }
                  className={`${withdrawing || coinBalance < 20000 || (pendingWithdrawal && pendingWithdrawal.status === 'pending') ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700'} text-white px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]`}
                >
                  {withdrawing ? 'Processing...' : (pendingWithdrawal && pendingWithdrawal.status === 'pending') ? 'Request Pending' : 'Withdraw'}
                </button>
              </div>
            </div>
            {/* Progress to Withdrawal */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Withdrawal unlock at ₹200 (20000 coins)</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">{coinBalance}/20000</span>
              </div>
              <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-emerald-400 via-green-500 to-lime-500 transition-all"
                  style={{ width: `${progressToWithdraw}%` }}
                />
              </div>
            </div>

            {/* Withdrawal Status Banner */}
            {pendingWithdrawal && (
              <div className={`mt-4 rounded-xl p-4 border ${pendingWithdrawal.status === 'pending'
                ? 'bg-yellow-50 border-yellow-200'
                : pendingWithdrawal.status === 'rejected'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200'
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pendingWithdrawal.status === 'pending' ? 'bg-yellow-100' : pendingWithdrawal.status === 'rejected' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                    <Clock className={`w-5 h-5 ${pendingWithdrawal.status === 'pending' ? 'text-yellow-600' : pendingWithdrawal.status === 'rejected' ? 'text-red-600' : 'text-green-600'
                      }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${pendingWithdrawal.status === 'pending' ? 'text-yellow-800' : pendingWithdrawal.status === 'rejected' ? 'text-red-800' : 'text-green-800'
                      }`}>
                      {pendingWithdrawal.status === 'pending' && 'Withdrawal Request Pending'}
                      {pendingWithdrawal.status === 'approved' && 'Withdrawal Approved'}
                      {pendingWithdrawal.status === 'completed' && 'Withdrawal Completed'}
                      {pendingWithdrawal.status === 'rejected' && 'Withdrawal Rejected'}
                    </h4>
                    <p className={`text-sm ${pendingWithdrawal.status === 'pending' ? 'text-yellow-700' : pendingWithdrawal.status === 'rejected' ? 'text-red-700' : 'text-green-700'
                      }`}>
                      {pendingWithdrawal.status === 'pending' && `Your request for ₹${Math.abs(pendingWithdrawal.amount / 100).toFixed(2)} is under review`}
                      {pendingWithdrawal.status === 'approved' && `Your request for ₹${Math.abs(pendingWithdrawal.amount / 100).toFixed(2)} has been approved`}
                      {pendingWithdrawal.status === 'completed' && `Your withdrawal of ₹${Math.abs(pendingWithdrawal.amount / 100).toFixed(2)} has been paid`}
                      {pendingWithdrawal.status === 'rejected' && `Your withdrawal of ₹${Math.abs(pendingWithdrawal.amount / 100).toFixed(2)} was rejected`}
                    </p>
                    <p className={`text-xs mt-1 ${pendingWithdrawal.status === 'pending' ? 'text-yellow-600' : pendingWithdrawal.status === 'rejected' ? 'text-red-600' : 'text-green-600'
                      }`}>
                      Status: {pendingWithdrawal.status.charAt(0).toUpperCase() + pendingWithdrawal.status.slice(1)} •
                      Requested: {new Date(pendingWithdrawal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Activation Bonus */}
          {!activationBonusGranted && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-emerald-200 rounded-2xl p-6 mb-8 shadow-[0_10px_30px_-12px_rgba(16,185,129,0.35)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center ring-4 ring-emerald-100">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">Welcome Bonus!</h3>
                    <p className="text-green-600">Get 1000 coins for activating your account</p>
                  </div>
                </div>
                <button
                  onClick={grantActivationBonus}
                  className="text-white px-6 py-2 rounded-xl font-semibold transition-all bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  Claim 1000 Coins
                </button>
              </div>
            </div>
          )}

          {/* Referral Share */}
          <div className="rounded-2xl p-6 mb-8 bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_10px_30px_-12px_rgba(216,180,254,0.45)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center ring-4 ring-purple-100 flex-shrink-0">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">Invite & Earn</h3>
                  <p className="text-gray-600 text-sm">Share your unique link. When friends complete tasks, you earn coins automatically.</p>
                  <div className="mt-2 text-xs text-gray-500 break-all">{getReferralLink()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:flex-shrink-0">
                <button
                  onClick={copyReferralLink}
                  className="text-white px-5 py-2 rounded-xl font-semibold transition-all bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-md hover:shadow-lg active:scale-[0.98] w-full sm:w-auto"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>

          {/* YouTube Connection */}
          <div className="rounded-2xl p-6 mb-8 bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_10px_30px_-12px_rgba(99,102,241,0.35)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ring-4 flex-shrink-0 ${youtubeConnected ? 'bg-green-100 ring-green-100' : 'bg-red-100 ring-red-100'
                  }`}>
                  <Youtube className={`w-6 h-6 ${youtubeConnected ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">YouTube Connection</h3>
                  <p className={`${youtubeConnected ? 'text-green-700' : 'text-red-600'} font-medium`}>
                    {youtubeConnected ? 'Connected' : 'Not Connected'}
                  </p>
                  {youtubeConnected && (
                    <p className="text-sm text-gray-600 mt-1">
                      {youtubeChannelInfo?.channelTitle ?
                        `Channel: ${youtubeChannelInfo.channelTitle}` :
                        `User: ${userDisplayName}`
                      }
                    </p>
                  )}
                </div>
              </div>
              <div className="sm:flex-shrink-0">
                {!youtubeConnected ? (
                  <button
                    onClick={connectYouTube}
                    className="text-white px-6 py-2 rounded-xl font-semibold transition-all bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-md hover:shadow-lg active:scale-[0.98] w-full sm:w-auto"
                  >
                    Connect YouTube
                  </button>
                ) : (
                  <button
                    onClick={disconnectYouTube}
                    className="text-white px-6 py-2 rounded-xl font-semibold transition-all bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 shadow-md hover:shadow-lg active:scale-[0.98] w-full sm:w-auto"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tips & Highlights */}
          <div className="rounded-2xl p-6 mb-8 bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_10px_30px_-12px_rgba(96,165,250,0.45)]">
            {!canShareTasks && (
              <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                Purchase any Package or Super Package to activate your account and enable Share Task Link feature.
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-800">Pro tips to earn faster</h3>
            </div>
            <ul className="grid md:grid-cols-3 gap-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                Do tasks right after opening the video for quick verification.
              </li>
              <li className="flex items-start gap-2">
                <Flame className="w-4 h-4 text-orange-500 mt-0.5" />
                Stay consistent daily to hit withdrawal faster.
              </li>
              <li className="flex items-start gap-2">
                <Share2 className="w-4 h-4 text-pink-500 mt-0.5" />
                Share your referral link—earn when your friends complete tasks.
              </li>
            </ul>
          </div>
          {/* Coin Rewards Info */}
          <div className="rounded-2xl p-6 mb-8 bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_10px_30px_-12px_rgba(59,130,246,0.35)]">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Coin Rewards</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-emerald-50/70 rounded-xl border border-white/60">
                <Gift className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-semibold text-emerald-800">Self Registration</p>
                <p className="text-emerald-600">+1000 Coins</p>
              </div>
              <div className="text-center p-4 bg-pink-50/70 rounded-xl border border-white/60">
                <UserPlus className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                <p className="font-semibold text-pink-800">Direct Registration</p>
                <p className="text-pink-600">+20 Coins</p>
              </div>
              <div className="text-center p-4 bg-blue-50/70 rounded-xl border border-white/60">
                <Play className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold text-blue-800">1 View</p>
                <p className="text-blue-600">+10 Coins</p>
              </div>
              <div className="text-center p-4 bg-red-50/70 rounded-xl border border-white/60">
                <ThumbsUp className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="font-semibold text-red-800">1 Like</p>
                <p className="text-red-600">+15 Coins</p>
              </div>
              <div className="text-center p-4 bg-green-50/70 rounded-xl border border-white/60">
                <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-800">1 Comment</p>
                <p className="text-green-600">+20 Coins</p>
              </div>
              <div className="text-center p-4 bg-purple-50/70 rounded-xl border border-white/60">
                <UserPlus className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="font-semibold text-purple-800">1 Subscribe</p>
                <p className="text-purple-600">+25 Coins</p>
              </div>
            </div>
          </div>

          {/* Social Tasks */}
          <div className="rounded-2xl p-6 bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_10px_30px_-12px_rgba(251,146,60,0.35)]">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Tasks</h3>

            <div className="mb-4 text-xs text-gray-600 bg-orange-50 border border-orange-200 rounded-xl p-3">
              Share any task using the Share Task Link below. When someone opens it, connects YouTube and completes the action, you earn coins automatically.
            </div>

            {!youtubeConnected ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Connect your YouTube account to start earning coins</p>
                <button
                  onClick={connectYouTube}
                  className="text-white px-6 py-2 rounded-xl font-semibold transition-all bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  Connect YouTube
                </button>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">No tasks available at the moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task._id} className="border border-white/60 bg-white/50 backdrop-blur-xl rounded-2xl p-4 hover:shadow-xl hover:-translate-y-0.5 transition-all lg:border-r lg:border-gray-200 lg:pr-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 lg:border-r lg:border-gray-200 lg:pr-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-xl ring-4 ring-white/60 ${getActionColor(task.action)}`}>
                            {getActionIcon(task.action)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{task.title}</h4>
                            <p className="text-sm text-gray-600 capitalize">
                              {task.action} • {task.coins} coins
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-[11px]">
                              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-100 to-orange-100 text-rose-700 border border-white/60">YouTube</span>
                              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-100 to-sky-100 text-indigo-700 border border-white/60">Verified</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Do the task
                          <span className="font-bold capitalize"> {task.action}</span>,
                          then click Claim Coins.
                        </p>

                        {/* YouTube Video Embed for view tasks */}
                        {task.action === 'view' && !claimedTaskIds.has(task._id) && (
                          <div className="space-y-4">
                            {!videoOpened[task._id] ? (
                              // Show initial instructions
                              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                                <p className="text-sm text-blue-700 mb-2">
                                  📺 Click "Open YouTube Video" above to watch the video
                                </p>
                                <p className="text-xs text-blue-600">
                                  ⏱️ Timer will start automatically when video begins playing
                                </p>
                              </div>
                            ) : (
                              // Show embedded video and timer
                              <>
                                {/* YouTube Video Embed */}
                                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                  <iframe
                                    id={`youtube-player-${task._id}`}
                                    className="absolute top-0 left-0 w-full h-full rounded-xl"
                                    src={getYouTubeEmbedUrl(task.url)}
                                    title={task.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    onLoad={() => {
                                      // Setup YouTube API events when iframe loads
                                      const videoId = extractYouTubeVideoId(task.url);
                                      if (videoId && window.YT && window.YT.Player) {
                                        new window.YT.Player(`youtube-player-${task._id}`, {
                                          events: {
                                            'onStateChange': (event) => {
                                              if (event.data === window.YT.PlayerState.PLAYING) {
                                                handleVideoPlay(task._id);
                                              } else if (event.data === window.YT.PlayerState.PAUSED) {
                                                handleVideoPause(task._id);
                                              }
                                            }
                                          }
                                        });
                                      }
                                    }}
                                  />
                                </div>

                                {/* Watch Timer */}
                                {isWatching[task._id] && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-blue-700 font-medium">Watch Time:</span>
                                      <span className="text-lg font-bold text-blue-800">
                                        {Math.floor((watchTimers[task._id] || 0) / 60)}:{((watchTimers[task._id] || 0) % 60).toString().padStart(2, '0')}
                                      </span>
                                    </div>
                                    <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                                      <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(((watchTimers[task._id] || 0) / 40) * 100, 100)}%` }}
                                      ></div>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                      <p className="text-xs text-blue-600">
                                        {(watchTimers[task._id] || 0) >= 40
                                          ? '✅ Ready to claim!'
                                          : `Watch for ${Math.max(0, 30 - (watchTimers[task._id] || 0))} more seconds`
                                        }
                                      </p>
                                      <div className="flex items-center gap-1">
                                        <div className={`w-2 h-2 rounded-full ${isVideoPlaying[task._id] ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        <span className="text-xs text-gray-600">
                                          {isVideoPlaying[task._id] ? 'Playing' : 'Paused'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Manual Start Timer Button (fallback) */}
                                {!isWatching[task._id] && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
                                    <p className="text-sm text-yellow-700 mb-2">
                                      {isVideoPlaying[task._id]
                                        ? "Timer not started automatically? Click below to start manually."
                                        : "Start the video first, then the timer will begin automatically."
                                      }
                                    </p>
                                    <button
                                      onClick={() => {
                                        if (isVideoPlaying[task._id]) {
                                          startWatchTimer(task._id);
                                        }
                                      }}
                                      disabled={!isVideoPlaying[task._id]}
                                      className={`${isVideoPlaying[task._id]
                                        ? 'bg-yellow-500 hover:bg-yellow-600'
                                        : 'bg-gray-400 cursor-not-allowed'
                                        } text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                                    >
                                      {isVideoPlaying[task._id] ? 'Start Timer Manually' : 'Video Must Be Playing'}
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 lg:flex-shrink-0 lg:pl-4 border-t border-gray-200 pt-4 lg:border-t-0 lg:pt-0">
                        <button
                          onClick={() => openYouTubeLink(task.url, task._id, task.action)}
                          title={task.action === 'view' ? "Click to show the embedded video" : "Step 1: Open the video on YouTube, do the action, then come back to claim."}
                          className="text-white px-4 py-2 rounded-xl font-semibold transition-all bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg active:scale-[0.98] flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {task.action === 'view' ? 'Show Video' : 'Open YouTube Video'}
                        </button>
                        <button
                          onClick={() => copyTaskShareLink(task)}
                          title={canShareTasks ? 'Copy a public share link for this task' : 'Purchase any Package or Super Package to activate your account and share tasks'}
                          disabled={!canShareTasks}
                          className={`${!canShareTasks ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700'} text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center gap-2`}
                        >
                          <Share2 className="w-4 h-4" />
                          Share Task Link
                        </button>
                        {(() => {
                          const isClaimed = claimedTaskIds.has(task._id);
                          const watchTime = watchTimers[task._id] || 0;
                          const isViewTask = task.action === 'view';
                          const hasEnoughWatchTime = watchTime >= 40;
                          const isDisabled = verifying[task._id] || isClaimed || (isViewTask && !hasEnoughWatchTime);
                          return (
                            <button
                              onClick={() => verifyAction(task._id, task.action)}
                              disabled={isDisabled}
                              className={`${isDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600'} text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center gap-2`}
                            >
                              {verifying[task._id] ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  Verifying...
                                </>
                              ) : isClaimed ? (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Claimed
                                </>
                              ) : isViewTask && !hasEnoughWatchTime ? (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Watch {Math.max(0, 30 - watchTime)}s more
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Claim {task.coins} Coins
                                </>
                              )}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SocialEarning;
