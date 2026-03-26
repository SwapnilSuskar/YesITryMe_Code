import React, { useEffect, useMemo, useState } from 'react';
import { Trash2, Eye, EyeOff, Upload, Video, BarChart3 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/toast.css';
import api, { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';

const VideoTasks = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [analyticsOpen, setAnalyticsOpen] = useState({});
  const [analyticsByVideoId, setAnalyticsByVideoId] = useState({});
  const [analyticsLoadingByVideoId, setAnalyticsLoadingByVideoId] = useState({});

  const canUpload = useMemo(() => title.trim().length > 0 && !!file && !uploading, [title, file, uploading]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.videoTasks.adminAll);
      if (res.data?.success) setVideos(res.data.data || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const uploadVideo = async (e) => {
    e.preventDefault();
    if (!canUpload) return;
    try {
      setUploading(true);
      const form = new FormData();
      form.append('title', title.trim());
      form.append('description', description.trim());
      form.append('video', file);

      const res = await api.post(API_ENDPOINTS.videoTasks.adminUpload, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        toast.success('Video uploaded');
        setTitle('');
        setDescription('');
        setFile(null);
        await fetchAll();
      } else {
        toast.error(res.data?.message || 'Upload failed');
      }
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (videoId) => {
    try {
      const url = API_ENDPOINTS.videoTasks.adminToggle.replace(':videoId', videoId);
      const res = await api.patch(url);
      if (res.data?.success) {
        setVideos((prev) => prev.map((v) => (v._id === videoId ? res.data.data : v)));
      } else {
        toast.error(res.data?.message || 'Failed to toggle');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to toggle');
    }
  };

  const deleteVideo = async (videoId) => {
    if (!window.confirm('Delete this video? Users will no longer be able to do tasks on it.')) return;
    try {
      const url = API_ENDPOINTS.videoTasks.adminDelete.replace(':videoId', videoId);
      const res = await api.delete(url);
      if (res.data?.success) {
        toast.success('Deleted');
        setVideos((prev) => prev.filter((v) => v._id !== videoId));
      } else {
        toast.error(res.data?.message || 'Failed to delete');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete');
    }
  };

  const fetchAnalytics = async (videoId) => {
    if (!videoId) return;
    if (!isAdmin) return;
    if (analyticsLoadingByVideoId[videoId]) return;
    try {
      setAnalyticsLoadingByVideoId((p) => ({ ...p, [videoId]: true }));
      const url = API_ENDPOINTS.videoTasks.adminAnalytics.replace(':videoId', videoId);
      const res = await api.get(url);
      if (res.data?.success) {
        setAnalyticsByVideoId((p) => ({ ...p, [videoId]: res.data.data }));
      } else {
        toast.error(res.data?.message || 'Failed to load analytics');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load analytics');
    } finally {
      setAnalyticsLoadingByVideoId((p) => ({ ...p, [videoId]: false }));
    }
  };

  const toggleAnalytics = async (videoId) => {
    setAnalyticsOpen((p) => ({ ...p, [videoId]: !p[videoId] }));
    const willOpen = !analyticsOpen[videoId];
    if (willOpen && !analyticsByVideoId[videoId]) {
      await fetchAnalytics(videoId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-20 pb-10">
      <ToastContainer position="top-center" newestOnTop closeOnClick pauseOnHover theme="colored" autoClose={2500} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white/70 border border-white/60 rounded-2xl p-6 shadow-[0_10px_30px_-12px_rgba(251,146,60,0.35)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center ring-4 ring-indigo-100">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Video Tasks</h1>
              <p className="text-sm text-gray-600">Upload videos and enable engagement rewards.</p>
            </div>
          </div>

          <form onSubmit={uploadVideo} className="grid md:grid-cols-3 gap-3 items-start">
            <div className="md:col-span-1">
              <label className="text-xs font-semibold text-gray-700">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 bg-white"
                placeholder="Video title"
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-xs font-semibold text-gray-700">Description (optional)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 bg-white"
                placeholder="Short description"
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-xs font-semibold text-gray-700">Video file</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full mt-1"
                required
              />
              <button
                type="submit"
                disabled={!canUpload}
                className={`mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-white ${
                  canUpload ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600' : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-white/70 border border-white/60 rounded-2xl p-6 shadow-[0_10px_30px_-12px_rgba(59,130,246,0.25)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">All Videos ({videos.length})</h2>
            <button
              onClick={fetchAll}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-600">Loading…</div>
          ) : videos.length === 0 ? (
            <div className="text-center py-10 text-gray-600">No videos uploaded yet.</div>
          ) : (
            <div className="space-y-4">
              {videos.map((v) => (
                <div key={v._id} className="rounded-2xl border border-white/60 bg-white/60 p-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 truncate">{v.title}</div>
                      {v.description ? <div className="text-sm text-gray-600 mt-1">{v.description}</div> : null}
                      <div className="text-xs text-gray-500 mt-2">
                        Status: <span className="font-semibold">{v.isActive ? 'Active' : 'Inactive'}</span>
                        {typeof v.durationSeconds === 'number' ? ` • Duration: ${v.durationSeconds}s` : ''}
                      </div>
                      <div className="mt-3">
                        <video src={v.videoUrl} controls className="w-full max-w-xl rounded-xl border border-gray-200 bg-black" />
                      </div>

                      {isAdmin && analyticsOpen[v._id] ? (
                        <div className="mt-4 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-extrabold text-gray-900 inline-flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-orange-700" />
                              Analytics
                            </div>
                            <button
                              onClick={() => fetchAnalytics(v._id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50"
                              disabled={!!analyticsLoadingByVideoId[v._id]}
                            >
                              {analyticsLoadingByVideoId[v._id] ? 'Loading…' : 'Refresh'}
                            </button>
                          </div>

                          {!analyticsByVideoId[v._id] ? (
                            <div className="mt-2 text-sm text-gray-600">
                              {analyticsLoadingByVideoId[v._id] ? 'Loading analytics…' : 'No analytics loaded.'}
                            </div>
                          ) : (
                            <div className="mt-3 space-y-3">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {Object.entries(analyticsByVideoId[v._id].byAction || {}).map(([k, val]) => (
                                  <div key={k} className="rounded-xl border border-white/60 bg-white/80 p-3">
                                    <div className="text-xs text-gray-600 capitalize">{k}</div>
                                    <div className="text-lg font-extrabold text-gray-900">{val}</div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                                <div className="text-gray-700 font-semibold">
                                  Unique users: <span className="font-extrabold text-gray-900">{analyticsByVideoId[v._id].uniqueUserCount}</span>
                                </div>
                                <div className="text-gray-700 font-semibold">
                                  Total coins given:{' '}
                                  <span className="font-extrabold text-orange-700">{analyticsByVideoId[v._id].totalCoins}</span>
                                </div>
                              </div>
                              <div className="text-xs text-gray-600">
                                Last engagement:{' '}
                                {analyticsByVideoId[v._id].lastEngagementAt
                                  ? new Date(analyticsByVideoId[v._id].lastEngagementAt).toLocaleString()
                                  : '—'}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 md:flex-col md:items-stretch">
                      <button
                        onClick={() => toggleActive(v._id)}
                        className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold ${
                          v.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {v.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {v.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => deleteVideo(v._id)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold bg-red-100 text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>

                      {isAdmin ? (
                        <button
                          onClick={() => toggleAnalytics(v._id)}
                          className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold ${
                            analyticsOpen[v._id] ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <BarChart3 className="w-4 h-4" />
                          {analyticsOpen[v._id] ? 'Hide analysis' : 'View analysis'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoTasks;

