import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Coins, Eye, Heart, MessageCircle, Share2, ArrowLeft, PlayCircle, ExternalLink } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/toast.css';
import api, { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import LoginPrompt from '../UI/LoginPrompt';

const VideoTaskDetail = () => {
  const { user } = useAuthStore();
  const isAuthed = !!user;
  const isActiveUser = user?.status === 'active';
  const isAdmin = user?.role === 'admin';
  const { videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const shareTokenFromUrl = useMemo(() => {
    const sp = new URLSearchParams(location.search || '');
    return sp.get('shareToken') || '';
  }, [location.search]);
  /** Guest preview only. Logged-in users get the full task page even if the URL still has ?shareToken= */
  const isViewOnlyShared = !!shareTokenFromUrl && !isAuthed;

  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState(null);
  const [claiming, setClaiming] = useState({});
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [claimedActions, setClaimedActions] = useState(() => new Set());
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState({ view: 0, like: 0, comment: 0, share: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [sharedByUserId, setSharedByUserId] = useState('');

  const tickRef = useRef(null);
  const isMountedRef = useRef(false);

  const rewardInfo = useMemo(() => ([
    { key: 'view', label: 'View (≥30s)', coins: 50, icon: Eye },
    { key: 'like', label: 'Like', coins: 20, icon: Heart },
    { key: 'comment', label: 'Comment', coins: 30, icon: MessageCircle },
    { key: 'share', label: 'Share', coins: 10, icon: Share2 },
  ]), []);

  const canClaimView = watchSeconds >= 30;
  const formatTime = (s = 0) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const fetchVideo = async () => {
    const url = API_ENDPOINTS.videoTasks.get.replace(':videoId', videoId);
    const res = await api.get(url);
    if (!res.data?.success) throw new Error(res.data?.message || 'Failed to load video');
    return res.data.data;
  };

  const fetchSharedVideo = async () => {
    const url = API_ENDPOINTS.videoTasks.sharedGet.replace(':token', shareTokenFromUrl);
    const res = await api.get(url);
    if (!res.data?.success) throw new Error(res.data?.message || 'Failed to load shared video');
    return res.data.data;
  };

  const fetchMyEngagements = async () => {
    const url = API_ENDPOINTS.videoTasks.myEngagements.replace(':videoId', videoId);
    const res = await api.get(url);
    if (!res.data?.success) throw new Error(res.data?.message || 'Failed to load engagements');
    return new Set(res.data.data?.actions || []);
  };

  const fetchComments = async () => {
    const url = API_ENDPOINTS.videoTasks.comments.replace(':videoId', videoId);
    const res = await api.get(url);
    if (!res.data?.success) throw new Error(res.data?.message || 'Failed to load comments');
    return res.data.data || [];
  };

  const fetchAdminAnalytics = async () => {
    const url = API_ENDPOINTS.videoTasks.adminAnalytics.replace(':videoId', videoId);
    const res = await api.get(url);
    if (!res.data?.success) throw new Error(res.data?.message || 'Failed to load analytics');
    return res.data.data;
  };

  const fetchStats = async () => {
    const url = API_ENDPOINTS.videoTasks.stats.replace(':videoId', videoId);
    const res = await api.get(url);
    if (!res.data?.success) throw new Error(res.data?.message || 'Failed to load stats');
    return res.data.data?.byAction || { view: 0, like: 0, comment: 0, share: 0 };
  };

  const createShareToken = async () => {
    const url = API_ENDPOINTS.videoTasks.shareToken.replace(':videoId', videoId);
    const res = await api.post(url);
    if (!res.data?.success) throw new Error(res.data?.message || 'Failed to create share link');
    return res.data.data?.token;
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!videoId) return;
      try {
        setLoading(true);
        if (isViewOnlyShared) {
          const v = await fetchSharedVideo();
          if (!isMountedRef.current) return;
          setVideo(v);
          setClaimedActions(new Set());
          setSharedByUserId(String(v?.sharedByUserId || ''));
          return;
        }
        if (!isAuthed) return;
        const [v, actionsSet] = await Promise.all([fetchVideo(), fetchMyEngagements()]);
        if (!isMountedRef.current) return;
        setVideo(v);
        setClaimedActions(actionsSet);
      } catch (e) {
        toast.error(e.response?.data?.message || e.message || 'Failed to load video');
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, videoId, isViewOnlyShared, shareTokenFromUrl]);

  useEffect(() => {
    const run = async () => {
      if (!videoId) return;
      if (isViewOnlyShared) {
        setStatsLoading(false);
        return;
      }
      if (!isAuthed) return;
      try {
        setStatsLoading(true);
        const s = await fetchStats();
        if (!isMountedRef.current) return;
        setStats({
          view: Number(s.view) || 0,
          like: Number(s.like) || 0,
          comment: Number(s.comment) || 0,
          share: Number(s.share) || 0,
        });
      } catch (_) {
        // ignore
      } finally {
        if (isMountedRef.current) setStatsLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, videoId, isViewOnlyShared]);

  useEffect(() => {
    const run = async () => {
      if (!videoId) return;
      if (isViewOnlyShared) {
        setCommentsLoading(false);
        return;
      }
      if (!isAuthed) return;
      try {
        setCommentsLoading(true);
        const list = await fetchComments();
        if (!isMountedRef.current) return;
        setComments(list);
      } catch (_) {
        // ignore
      } finally {
        if (isMountedRef.current) setCommentsLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, videoId, isViewOnlyShared]);

  useEffect(() => {
    const run = async () => {
      if (!isAuthed) return;
      if (!isAdmin) return;
      if (isViewOnlyShared) return;
      if (!videoId) return;
      try {
        setAnalyticsLoading(true);
        const a = await fetchAdminAnalytics();
        if (!isMountedRef.current) return;
        setAnalytics(a);
      } catch (_) {
        // ignore
      } finally {
        if (isMountedRef.current) setAnalyticsLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, isAdmin, videoId, isViewOnlyShared]);

  // Watch timer tick only when playing and tab visible.
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      if (!isPlaying) return;
      if (document.hidden) return;
      setWatchSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [isPlaying]);

  const claim = async (action) => {
    if (!videoId) return;
    if (isViewOnlyShared) {
      const referrer = sharedByUserId || '';
      navigate(referrer ? `/signup?referrer_code=${encodeURIComponent(referrer)}` : '/signup');
      return;
    }
    if (action === 'share') {
      toast.info('Use the Share button to earn share reward');
      return;
    }
    if (claimedActions.has(action)) {
      toast.info('Already claimed');
      return;
    }
    if (claiming[action]) return;
    if (action === 'view' && !canClaimView) {
      toast.error(`Watch ${Math.max(0, 30 - watchSeconds)}s more to claim view`);
      return;
    }
    if (action === 'comment') {
      const text = commentText.trim();
      if (!text) {
        toast.error('Please write a comment first');
        return;
      }
      if (text.length > 500) {
        toast.error('Comment is too long (max 500 chars)');
        return;
      }
    }
    try {
      setClaiming((p) => ({ ...p, [action]: true }));
      const url = API_ENDPOINTS.videoTasks.claim.replace(':videoId', videoId);
      const body = action === 'view'
        ? { action, watchTimeSeconds: watchSeconds }
        : action === 'comment'
          ? { action, commentText: commentText.trim() }
          : { action };
      const res = await api.post(url, body);
      if (res.data?.success) {
        toast.success(`+${res.data.coinsEarned} coins`);
        setClaimedActions((prev) => new Set([...prev, action]));
        setStats((p) => ({ ...p, [action]: (Number(p[action]) || 0) + 1 }));
        if (action === 'comment') {
          setComments((prev) => ([
            {
              _id: `local-${Date.now()}`,
              userId: user?.userId,
              userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'You',
              userImageUrl: user?.imageUrl || '',
              text: commentText.trim(),
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]));
          setCommentText('');
        }
      } else {
        toast.error(res.data?.message || 'Failed to claim');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to claim');
    } finally {
      setClaiming((p) => ({ ...p, [action]: false }));
    }
  };

  if (!isAuthed && !isViewOnlyShared) {
    return <LoginPrompt type="socialEarning" />;
  }

  const handleShare = async () => {
    if (isViewOnlyShared) return;
    if (!videoId) return;
    if (!isAuthed) return;
    if (!isActiveUser) {
      toast.error('Account must be active to share');
      return;
    }
    if (sharing) return;
    try {
      setSharing(true);
      const token = await createShareToken();
      const shareUrl = `${window.location.origin}/video-tasks/${videoId}?shareToken=${encodeURIComponent(token)}`;

      const shareData = {
        title: video?.title || 'Video',
        text: 'Watch this video (view-only)',
        url: shareUrl,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied');
      } else {
        window.prompt('Copy this link:', shareUrl);
      }

      // Mark share as claimed (reward is granted when token is created on backend)
      setClaimedActions((prev) => new Set([...prev, 'share']));
      setStats((p) => ({ ...p, share: (Number(p.share) || 0) + 1 }));
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Failed to share');
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-center" newestOnTop closeOnClick pauseOnHover theme="colored" autoClose={2500} />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-16">
        {/* Watch-page header (YouTube-like, project theme) */}
        <div className="sticky top-14 z-30 border-b border-orange-200/50 bg-white/70 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate('/socialearning')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 border border-white/60 shadow hover:bg-white transition"
                title="Back to videos"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline font-semibold">Back</span>
              </button>
              <div className="min-w-0">
                <div className="font-extrabold text-gray-900 leading-tight truncate">
                  {video?.title || 'Video'}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  Complete tasks to earn coins
                </div>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-orange-100 to-pink-100 text-orange-800 border border-orange-200/60">
              <Coins className="w-4 h-4" />
              <span className="text-sm font-extrabold">Earn Coins</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {loading ? (
            <div className="text-center py-16 text-gray-600">Loading video…</div>
          ) : !video ? (
            <div className="text-center py-16 text-gray-600">Video not found.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Main video column */}
              <div className="lg:col-span-8">
                <div className="rounded-2xl p-3 sm:p-4 bg-white/70 backdrop-blur-xl border border-white/60 shadow">
                  <div className="rounded-xl overflow-hidden border border-gray-200 bg-black">
                    <video
                      src={video.videoUrl}
                      controls
                      className="w-full aspect-video bg-black"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                    />
                  </div>

                  <div className="mt-4">
                    <div className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug">
                      {video.title}
                    </div>
                    {video.description ? (
                      <div className="mt-2 text-gray-700 whitespace-pre-line">
                        {video.description}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => claim('like')}
                        disabled={isViewOnlyShared || claiming.like || claimedActions.has('like')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-extrabold border transition ${claiming.like || claimedActions.has('like')
                          ? 'bg-gray-200 text-gray-700 border-gray-200 cursor-not-allowed'
                          : 'bg-white/80 text-gray-900 border-white/60 hover:bg-white'
                          }`}
                        title="Like (one-time reward)"
                      >
                        <Heart className={`w-4 h-4 ${claimedActions.has('like') ? 'text-rose-600' : 'text-gray-700'}`} />
                        Like
                        <span className="ml-1 text-sm font-extrabold text-gray-900">
                          {statsLoading ? '…' : stats.like}
                        </span>
                      </button>

                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-extrabold bg-white/80 border border-white/60 text-gray-900">
                        <MessageCircle className="w-4 h-4 text-orange-700" />
                        Comments
                        <span className="ml-1 text-sm font-extrabold text-gray-900">
                          {isViewOnlyShared ? '—' : statsLoading ? '…' : stats.comment}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleShare}
                        disabled={isViewOnlyShared || sharing}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-extrabold border transition ${isViewOnlyShared || sharing
                            ? 'bg-gray-200 text-gray-700 border-gray-200 cursor-not-allowed'
                            : 'bg-white/80 text-gray-900 border-white/60 hover:bg-white'
                          }`}
                        title="Share (view-only link)"
                      >
                        <Share2 className="w-4 h-4 text-violet-700" />
                        {sharing ? 'Sharing…' : 'Share'}
                      </button>

                      {rewardInfo.map((r) => (
                        <div
                          key={r.key}
                          className="px-3 py-1.5 rounded-full text-sm font-bold bg-white/80 border border-white/60 text-gray-800 shadow-sm"
                          title={r.label}
                        >
                          +{r.coins} {r.key}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Comments (YouTube-like) */}
                <div className="mt-4 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-extrabold text-gray-900">Comments</div>
                    <div className="text-xs font-semibold text-gray-600">Comment reward: +30 (one-time)</div>
                  </div>

                  {isViewOnlyShared ? (
                    <div className="mt-3 rounded-xl border border-white/60 bg-white/80 p-3 text-sm text-gray-700">
                      This is a <span className="font-extrabold text-orange-700">shared view-only</span> link. Comments and tasks are disabled.
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const referrer = sharedByUserId || '';
                            navigate(referrer ? `/signup?referrer_code=${encodeURIComponent(referrer)}` : '/signup');
                          }}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-xl font-extrabold text-white bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-md"
                        >
                          Sign up to earn coins
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-white/60 bg-white/80 p-3">
                      <div className="text-sm font-semibold text-gray-900">Add a comment</div>
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={3}
                        placeholder="Write something meaningful…"
                        className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                        maxLength={500}
                      />
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="text-xs text-gray-600">{commentText.trim().length}/500</div>
                        <button
                          type="button"
                          onClick={() => claim('comment')}
                          disabled={claiming.comment || claimedActions.has('comment')}
                          className={`px-4 py-2 rounded-xl font-extrabold text-white ${claiming.comment || claimedActions.has('comment')
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-md'
                            }`}
                        >
                          {claimedActions.has('comment') ? 'Claimed' : claiming.comment ? 'Claiming…' : 'Post & Claim +30'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 space-y-3">
                    {commentsLoading ? (
                      <div className="text-sm text-gray-600">Loading comments…</div>
                    ) : comments.length === 0 ? (
                      <div className="text-sm text-gray-600">No comments yet. Be the first!</div>
                    ) : (
                      comments.map((c) => (
                        <div key={c._id} className="flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white font-extrabold flex-shrink-0">
                            {(c.userName || 'U').slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-extrabold text-gray-900 truncate">{c.userName || 'User'}</div>
                              <div className="text-xs text-gray-500">
                                {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                              </div>
                            </div>
                            <div className="mt-1 text-sm text-gray-800 whitespace-pre-line break-words">
                              {c.text}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Side panel */}
              <aside className="lg:col-span-4">
                <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-extrabold text-gray-900">Task panel</div>
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700">
                      <ExternalLink className="w-4 h-4 text-orange-600" />
                      One-time per task
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                        <PlayCircle className="w-4 h-4" />
                        Watch time
                      </div>
                      <div className="text-sm font-bold text-orange-900">{formatTime(watchSeconds)}</div>
                    </div>
                    <div className="w-full bg-orange-200 rounded-full h-2 mt-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-pink-500 h-2"
                        style={{ width: `${Math.min(100, (watchSeconds / 30) * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs mt-2 text-orange-700 flex items-center justify-between">
                      <span>{watchSeconds >= 30 ? '✅ Ready to claim view' : `Watch ${Math.max(0, 30 - watchSeconds)}s more`}</span>
                      <span className="text-gray-600">{isPlaying ? 'Playing' : 'Paused'}</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {rewardInfo.map((r) => {
                      const Icon = r.icon;
                      const isShare = r.key === 'share';
                      const disabled = isShare
                        ? isViewOnlyShared || sharing || !isActiveUser || claimedActions.has('share')
                        : claiming[r.key] || claimedActions.has(r.key) || (r.key === 'view' && !canClaimView);
                      const label = isShare
                        ? claimedActions.has('share')
                          ? 'Shared'
                          : sharing
                            ? 'Sharing…'
                            : `Share +${r.coins}`
                        : claimedActions.has(r.key)
                          ? 'Claimed'
                          : claiming[r.key]
                            ? 'Claiming…'
                            : `Claim +${r.coins}`;
                      return (
                        <button
                          key={r.key}
                          onClick={() => (isShare ? handleShare() : claim(r.key))}
                          disabled={disabled}
                          className={`w-full px-4 py-3 rounded-xl font-extrabold text-white flex items-center justify-between gap-3 transition ${disabled
                            ? 'bg-gray-400 cursor-not-allowed'
                            : r.key === 'view'
                              ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-md'
                              : r.key === 'like'
                                ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-md'
                                : r.key === 'comment'
                                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-md'
                                  : 'bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 shadow-md'
                            }`}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Icon className="w-5 h-5" />
                            <span className="capitalize">{r.key}</span>
                          </span>
                          <span className="text-sm">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Admin analytics */}
                {isAdmin ? (
                  <div className="mt-4 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow p-4">
                    <div className="font-extrabold text-gray-900">Admin analytics</div>
                    {analyticsLoading ? (
                      <div className="mt-2 text-sm text-gray-600">Loading analytics…</div>
                    ) : analytics ? (
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-semibold">Unique users</span>
                          <span className="font-extrabold text-gray-900">{analytics.uniqueUserCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-semibold">Total coins given</span>
                          <span className="font-extrabold text-orange-700">{analytics.totalCoins}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {Object.entries(analytics.byAction || {}).map(([k, v]) => (
                            <div key={k} className="rounded-xl border border-white/60 bg-white/80 p-3">
                              <div className="text-xs text-gray-600 capitalize">{k}</div>
                              <div className="text-lg font-extrabold text-gray-900">{v}</div>
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-gray-600">
                          Last engagement: {analytics.lastEngagementAt ? new Date(analytics.lastEngagementAt).toLocaleString() : '—'}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-600">No analytics available.</div>
                    )}
                  </div>
                ) : null}
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default VideoTaskDetail;

