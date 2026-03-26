import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, Eye, Heart, MessageCircle, Share2, RefreshCw, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import LoginPrompt from '../UI/LoginPrompt';
import api, { API_ENDPOINTS } from '../../config/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/toast.css';

const SocialEarning = () => {
  const { user } = useAuthStore();
  const isAuthed = !!user;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);

  const userDisplayName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'You';

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.videoTasks.list);
      if (res.data?.success) {
        setVideos(res.data.data || []);
      } else {
        toast.error(res.data?.message || 'Failed to load videos');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthed) return;
    fetchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  const rewardInfo = useMemo(() => ([
    { label: 'View (≥30s)', coins: 50, icon: Eye },
    { label: 'Like', coins: 20, icon: Heart },
    { label: 'Comment', coins: 30, icon: MessageCircle },
    { label: 'Share', coins: 10, icon: Share2 },
  ]), []);

  const totalCoinsPerVideo = useMemo(
    () => rewardInfo.reduce((sum, r) => sum + (Number(r.coins) || 0), 0),
    [rewardInfo],
  );

  if (!isAuthed) {
    return <LoginPrompt type="socialEarning" />;
  }

  return (
    <>
      <ToastContainer position="top-center" newestOnTop closeOnClick pauseOnHover theme="colored" autoClose={2500} />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-16">
        {/* Top header (YouTube-like, no search bar) */}
        <div className="sticky top-14 z-30 border-b border-orange-200/60 bg-white/70 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-gray-900 font-extrabold tracking-tight leading-tight truncate">
                  Video Tasks
                </div>
                <div className="text-xs text-gray-600 truncate">
                  Welcome, {userDisplayName} — earn coins by engaging with videos
                </div>
              </div>
            </div>
            <button
              onClick={fetchVideos}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-900 bg-white/80 hover:bg-white border border-white/60 shadow-sm transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex gap-4">
            {/* Left rail */}


            {/* Main content */}
            <main className="flex-1 min-w-0">
              {/* Rewards bar (mobile/tablet) */}
              <div className="lg:hidden grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {rewardInfo.map((r) => {
                  const Icon = r.icon;
                  return (
                    <div key={r.label} className="rounded-2xl p-4 bg-white/60 backdrop-blur-xl border border-white/60 shadow-sm">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Icon className="w-4 h-4 text-orange-600" />
                        {r.label}
                      </div>
                      <div className="text-lg font-extrabold text-orange-700 mt-1">+{r.coins}</div>
                    </div>
                  );
                })}
              </div>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="rounded-2xl border border-white/60 bg-white/60 overflow-hidden animate-pulse shadow-sm">
                      <div className="aspect-video bg-gray-200/60" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-gray-200/60 rounded w-3/4" />
                        <div className="h-3 bg-gray-200/60 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-16 text-gray-600">No videos available right now.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {videos.map((v) => {
                    const vid = v._id;
                    const createdAt = v.createdAt ? new Date(v.createdAt) : null;
                    return (
                      <button
                        key={vid}
                        type="button"
                        onClick={() => navigate(`/video-tasks/${vid}`)}
                        className="text-left rounded-2xl border border-white/60 bg-white/60 hover:bg-white/80 transition overflow-hidden group shadow-sm hover:shadow-md"
                        title="Open video"
                      >
                        <div className="relative aspect-video bg-black">
                          <video
                            src={v.videoUrl}
                            className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition"
                            muted
                            playsInline
                            preload="metadata"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
                          <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 border border-white/10 text-white text-xs font-semibold">
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                              <Coins className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-gray-900 font-semibold leading-snug line-clamp-2">
                                {v.title}
                              </div>
                              {v.description ? (
                                <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                                  {v.description}
                                </div>
                              ) : null}
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                {createdAt ? <span>{createdAt.toLocaleDateString()}</span> : null}
                                <span className="hidden sm:inline">•</span>
                                <span className="inline-flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5" />
                                  View +50
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Heart className="w-3.5 h-3.5" />
                                  Like +20
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Bottom rewards panel (after videos) */}
              <div className="mt-8">
                <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="font-extrabold text-gray-900">Rewards</div>
                    <div className="text-sm font-semibold text-gray-600">
                      Total: <span className="text-orange-700 font-extrabold">{totalCoinsPerVideo}</span> coins/video
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {rewardInfo.map((r) => {
                      const Icon = r.icon;
                      return (
                        <div
                          key={`bottom-${r.label}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/60 bg-white/80 px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 border border-orange-200/60 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-5 h-5 text-orange-700" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">{r.label}</div>
                              <div className="text-xs text-gray-600 truncate">One-time per video</div>
                            </div>
                          </div>
                          <div className="text-sm font-extrabold text-gray-900">+{r.coins}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 text-xs text-gray-600">
                    Tip: Watch at least <span className="font-bold text-orange-700">30 seconds</span> to unlock the View reward.
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default SocialEarning;

