import React, { useEffect, useRef, useState, useCallback } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { Play, ThumbsUp, MessageCircle, UserPlus, ExternalLink } from 'lucide-react';

const PublicTask = () => {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [coins, setCoins] = useState(0);
  const [sessionId, setSessionId] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchTime, setWatchTime] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const intervalRef = useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);
  const [claimedSilently, setClaimedSilently] = useState(false);
  // Track progress implicitly via timer; no explicit percentage needed

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

  // localStorage helper functions for preventing multiple submissions
  const getVerificationKey = useCallback((sessionId) => `public_task_verified_${sessionId}`, []);

  const isTaskAlreadyVerified = useCallback((sessionId) => {
    if (!sessionId) return false;
    const key = getVerificationKey(sessionId);
    const verified = localStorage.getItem(key);
    return verified === 'true';
  }, [getVerificationKey]);

  const markTaskAsVerified = useCallback((sessionId) => {
    if (!sessionId) return;
    const key = getVerificationKey(sessionId);
    localStorage.setItem(key, 'true');
    // Also store timestamp for potential future use
    localStorage.setItem(`${key}_timestamp`, Date.now().toString());
  }, [getVerificationKey]);

  const extractYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getYouTubeEmbedUrl = (url) => {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) return null;
    const params = new URLSearchParams({
      enablejsapi: '1',
      origin: window.location.origin,
      autoplay: '0',
      controls: '1',
      rel: '0',
      modestbranding: '1',
      playsinline: '1'
    }).toString();
    return `https://www.youtube.com/embed/${videoId}?${params}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('session');
    const verified = params.get('status') === 'verified';
    const failed = params.get('status') === 'failed';

    if (s) {
      setSessionId(s);

      // Check if this task was already verified locally
      if (isTaskAlreadyVerified(s)) {
        setStatus('verified');
        setMessage('This task has already been completed by you.');
        setIsAlreadyVerified(true);
        setLoading(false);
        return;
      }

      fetchSessionData(s);
    }

    if (verified) {
      setStatus('verified');
      setMessage('Your action was verified!');
      const c = parseInt(params.get('coins') || '0', 10);
      setCoins(isNaN(c) ? 0 : c);
      // Mark as verified in localStorage
      if (s) {
        markTaskAsVerified(s);
        setIsAlreadyVerified(true);
      }
    } else if (failed) {
      setStatus('failed');
      setMessage('Verification failed. Please try again.');
    }
  }, [isTaskAlreadyVerified, markTaskAsVerified]);

  // Load YouTube API for embedded videos
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  const fetchSessionData = async (sessionId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_ENDPOINTS.base}/api/social/public/session/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSessionData(data.data);
        setStatus(data.data.status || 'idle');
      } else {
        setMessage('Session not found or expired');
        setStatus('error');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      setMessage('Failed to load session data');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const verifyNow = useCallback(async (silent = false) => {
    if (!sessionId) {
      setMessage('Missing session id');
      return;
    }

    // Prevent multiple submissions
    if (isAlreadyVerified) {
      setMessage('This task has already been completed by you.');
      return;
    }

    if (!silent) {
      setStatus('verifying');
      setMessage('Verifying your action...');
    }
    try {
      // For view tasks, include watch time in the request
      const url = sessionData?.action === 'view'
        ? `${API_ENDPOINTS.social.publicVerify}?session_id=${encodeURIComponent(sessionId)}&watchTime=${watchTime}`
        : `${API_ENDPOINTS.social.publicVerify}?session_id=${encodeURIComponent(sessionId)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        // Mark as verified in localStorage to prevent future submissions
        markTaskAsVerified(sessionId);
        setIsAlreadyVerified(true);
        if (sessionData?.action === 'view' && silent) {
          // Silent background claim for view: do not disrupt UI or playback
          setCoins(data.coins || 0);
          setClaimedSilently(true);
        } else {
          setStatus('verified');
          setMessage('Your action was verified!');
          setCoins(data.coins || 0);
        }
      } else {
        setStatus('not_verified');
        setMessage(data.message || 'Not verified yet. Complete the action and try again.');
      }
    } catch (e) {
      setStatus('error');
      setMessage('Verification failed. Please try again later.');
    }
  }, [sessionId, sessionData?.action, watchTime, markTaskAsVerified, isAlreadyVerified]);

  const openYouTubeLink = () => {
    if (sessionData?.url) {
      // For view tasks, we'll use iframe, so just start tracking
      if (sessionData?.action === 'view') {
        // Mark watching but do not start timer until actual PLAYING state
        setIsWatching(true);
        setWatchTime(0);
      } else {
        // For other actions, open in new tab
        window.open(sessionData.url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleVideoPlay = React.useCallback(() => {
    console.log('Video started playing in PublicTask');
    setIsVideoPlaying(true);
    if (sessionData?.action !== 'view') return;
    // Ensure we are marked as watching
    if (!isWatching) setIsWatching(true);
  }, [sessionData?.action, isWatching]);

  const handleVideoPause = React.useCallback(() => {
    setIsVideoPlaying(false);
  }, []);

  // Progress handling is managed by onStateChange; no separate handler needed

  // No YouTube Player API; we rely on user action and tab visibility

  // Pause when tab is hidden or window loses focus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        handleVideoPause();
      }
    };
    const handleBlur = () => {
      handleVideoPause();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [handleVideoPause]);

  // Centralized ticking: run interval only when conditions are met
  const shouldTick = isWatching && isVideoPlaying && !document.hidden;
  useEffect(() => {
    if (shouldTick && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setWatchTime(prev => prev + 1);
      }, 1000);
    }
    if (!shouldTick && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current && !shouldTick) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [shouldTick]);

  // Auto-claim for view tasks when required time reached
  useEffect(() => {
    if (
      sessionData?.action === 'view' &&
      status !== 'verified' &&
      !loading &&
      isWatching &&
      watchTime >= 33
    ) {
      // Trigger verification automatically in background (silent)
      verifyNow(true);
    }
  }, [watchTime, sessionData?.action, status, loading, isWatching, verifyNow]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading task details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 p-6 mt-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/70 border border-white/60 rounded-2xl p-6 shadow-[0_10px_30px_-12px_rgba(251,146,60,0.35)]">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Public Task</h1>

          {status === 'verified' ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-600 font-semibold text-lg">
                {isAlreadyVerified ? 'Task Completed!' : 'Verified!'}
              </p>
              <p className="text-gray-700 mt-2">
                {isAlreadyVerified
                  ? 'You have already completed this task successfully.'
                  : 'Great! Your action has been verified.'
                }
              </p>
              {coins > 0 && (
                <p className="text-gray-800 font-medium mt-1">You earned {coins} coins.</p>
              )}
              <div className="mt-4">
                <a
                  href={`${window.location.origin}/signup${sessionData?.referralCode ? `?referrer_code=${encodeURIComponent(sessionData.referralCode)}` : ''}`}
                  className="inline-block text-white px-6 py-2 rounded-xl font-semibold transition-all bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  {sessionData?.referralCode ? `Login & start earning (Ref: ${sessionData.referralCode})` : 'Login & start earning'}
                </a>
              </div>
            </div>
          ) : sessionData ? (
            <div className="space-y-6">
              {/* Task Details */}
              <div className="border border-white/60 bg-white/50 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-xl ring-4 ring-white/60 ${getActionColor(sessionData.action)}`}>
                    {getActionIcon(sessionData.action)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{sessionData.title}</h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {sessionData.action} • {sessionData.coins} coins
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {sessionData.action === 'view'
                    ? 'Watch the YouTube video for at least 30 seconds, then click Verify Now.'
                    : `Do the task ${sessionData.action} on the YouTube video below, then click Verify Now.`
                  }
                </p>

                {/* Watch Timer for view tasks */}
                {sessionData.action === 'view' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700 font-medium">Watch Time:</span>
                      <span className="text-lg font-bold text-blue-800">
                        {Math.floor(watchTime / 60)}:{(watchTime % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((watchTime / 33) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-blue-600">
                        {claimedSilently ? '✅ Claimed in background' : (watchTime >= 33 ? '✅ Ready to claim!' : `Watch for ${Math.max(0, 30 - watchTime)} more seconds`)}
                      </p>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${isVideoPlaying ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-xs text-gray-600">
                          {isVideoPlaying ? 'Playing' : 'Paused'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* YouTube Video - iframe for view tasks, button for others */}
              {sessionData.action === 'view' ? (
                <div className="space-y-4">
                  {getYouTubeEmbedUrl(sessionData.url) ? (
                    <div className="relative w-full bg-black rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        id="youtube-player-public"
                        key={sessionData.url}
                        className="absolute top-0 left-0 w-full h-full"
                        src={getYouTubeEmbedUrl(sessionData.url)}
                        title={sessionData.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        onLoad={() => {
                          // Setup YouTube API events when iframe loads
                          const videoId = extractYouTubeVideoId(sessionData.url);
                          if (videoId && window.YT && window.YT.Player) {
                            new window.YT.Player('youtube-player-public', {
                              events: {
                                'onStateChange': (event) => {
                                  if (event.data === window.YT.PlayerState.PLAYING) {
                                    handleVideoPlay();
                                  } else if (event.data === window.YT.PlayerState.PAUSED) {
                                    handleVideoPause();
                                  }
                                }
                              }
                            });
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <p className="text-sm text-red-600">Couldn’t load the embedded video.</p>
                      <button
                        onClick={openYouTubeLink}
                        className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Open on YouTube
                      </button>
                    </div>
                  )}
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">
                    Watch the video above for at least 30 seconds to claim your coins.
                    </p>
                    {!isWatching && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                        <p className="text-sm text-yellow-700 mb-2">
                          {isVideoPlaying
                            ? "Timer not started automatically? Click below to start manually."
                            : "Start the video first, then the timer will begin automatically."
                          }
                        </p>
                        <button
                          onClick={() => {
                            if (isVideoPlaying) {
                              handleVideoPlay();
                            }
                          }}
                          disabled={!isVideoPlaying}
                          className={`${isVideoPlaying
                            ? 'bg-yellow-500 hover:bg-yellow-600'
                            : 'bg-gray-400 cursor-not-allowed'
                            } text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                        >
                          {isVideoPlaying ? 'Start Timer Manually' : 'Video Must Be Playing'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={openYouTubeLink}
                  className="w-full text-white px-6 py-3 rounded-xl font-semibold transition-all bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-5 h-5" />
                  Open YouTube Video
                </button>
              )}

              {/* Status Message */}
              {message && (
                <div className={`p-4 rounded-xl ${status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                  status === 'not_verified' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                  {message}
                </div>
              )}

              {/* Verify Button (hidden for view tasks; auto-claim handles it) */}
              {sessionData?.action !== 'view' && (
                <button
                  onClick={verifyNow}
                  disabled={status === 'verifying' || isAlreadyVerified}
                  className={`w-full text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98] ${status === 'verifying' || isAlreadyVerified
                    ? 'bg-gray-400 cursor-not-allowed' :
                    'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600'
                    }`}
                >
                  {isAlreadyVerified
                    ? 'Already Completed'
                    : status === 'verifying'
                      ? 'Verifying...'
                      : 'Verify Now'
                  }
                </button>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-red-600 font-semibold">Session not found or expired</p>
              <p className="text-gray-600 mt-2">Please try the task link again.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicTask;


