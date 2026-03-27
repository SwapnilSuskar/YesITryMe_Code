import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Send, Shield, CreditCard, Landmark, LineChart, Sparkles, Briefcase, ChevronRight } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/toast.css';
import api, { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import LoginPrompt from '../UI/LoginPrompt';

const ICON_BY_KEY = {
  insurance: Shield,
  credit_card: CreditCard,
  demat_account: LineChart,
  bank_account: Landmark,
};

const MyServices = () => {
  const { user } = useAuthStore();
  const isAuthed = !!user;

  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    notes: '',
  });

  const selected = useMemo(
    () => configs.find((c) => c.serviceKey === selectedKey) || null,
    [configs, selectedKey],
  );

  const selectedTitle = selected?.title || selected?.serviceKey || 'Service';

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.services.list);
      if (res.data?.success) {
        setConfigs(res.data.data || []);
        if (!selectedKey && (res.data.data || []).length) setSelectedKey(res.data.data[0].serviceKey);
      } else {
        toast.error(res.data?.message || 'Failed to load services');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthed) return;
    fetchConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  const submitRequest = async () => {
    if (!selected) return;
    if (selected.actionType !== 'contact_form') return;
    if (sending) return;
    try {
      setSending(true);
      const payload = { serviceKey: selected.serviceKey, ...form };
      const res = await api.post(API_ENDPOINTS.services.request, payload);
      if (res.data?.success) {
        toast.success('Request submitted. Our team will contact you.');
        setForm({ name: '', mobile: '', email: '', notes: '' });
      } else {
        toast.error(res.data?.message || 'Failed to submit request');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit request');
    } finally {
      setSending(false);
    }
  };

  if (!isAuthed) return <LoginPrompt type="socialEarning" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-20 pb-12 mt-6">
      <ToastContainer position="top-center" newestOnTop closeOnClick pauseOnHover theme="colored" autoClose={2500} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/65 backdrop-blur-xl shadow-[0_18px_50px_-22px_rgba(251,146,60,0.55)] p-6 sm:p-8 mb-6">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-orange-300/40 via-pink-300/35 to-purple-300/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-br from-orange-200/40 via-amber-200/30 to-pink-200/30 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-pink-100 border border-orange-200/60 text-orange-800 text-sm font-extrabold">
              <Sparkles className="w-4 h-4" />
              Personalized services
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600">
              My Services
            </h1>
            <p className="mt-2 text-gray-700 max-w-2xl">
              Select a service to see what to do next. Admin can show a contact form or a direct link depending on the service.
            </p>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm animate-pulse">
              <div className="h-4 w-32 bg-gray-200/70 rounded" />
              <div className="mt-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200/60 rounded-xl" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-8 rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm animate-pulse">
              <div className="h-6 w-48 bg-gray-200/70 rounded" />
              <div className="mt-3 h-4 w-3/4 bg-gray-200/60 rounded" />
              <div className="mt-6 h-40 bg-gray-200/50 rounded-2xl" />
            </div>
          </div>
        ) : configs.length === 0 ? (
          <div className="rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl p-10 text-center shadow-sm">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white shadow-md">
              <Briefcase className="w-7 h-7" />
            </div>
            <div className="mt-4 text-xl font-extrabold text-gray-900">No services available</div>
            <div className="mt-2 text-gray-600">Please check back later.</div>
            <button
              type="button"
              onClick={fetchConfigs}
              className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-white bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-md"
            >
              Refresh
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <aside className="lg:col-span-4">
              <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="font-extrabold text-gray-900">Services</div>
                  <button
                    type="button"
                    onClick={fetchConfigs}
                    className="text-xs font-extrabold text-orange-700 hover:text-orange-800"
                    title="Refresh"
                  >
                    Refresh
                  </button>
                </div>
                <div className="space-y-2">
                  {configs.map((c) => {
                    const Icon = ICON_BY_KEY[c.serviceKey] || Briefcase;
                    const isActive = c.serviceKey === selectedKey;
                    const title = c.title || c.serviceKey;
                    return (
                      <button
                        key={c.serviceKey}
                        type="button"
                        onClick={() => setSelectedKey(c.serviceKey)}
                        className={`w-full text-left px-4 py-3 rounded-2xl border transition flex items-center justify-between gap-3 ${isActive
                            ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white border-orange-200 shadow-md'
                            : 'bg-white/85 text-gray-900 border-white/60 hover:bg-white shadow-sm'
                          }`}
                      >
                        <span className="inline-flex items-center gap-2 min-w-0">
                          <span className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-white/15' : 'bg-gradient-to-br from-orange-100 to-pink-100 border border-orange-200/60'
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-orange-700'}`} />
                          </span>
                          <span className="min-w-0">
                            <span className="block font-extrabold truncate">{title}</span>
                            <span className={`block text-xs font-semibold truncate ${isActive ? 'text-white/85' : 'text-gray-600'}`}>
                              {c.actionType === 'link' ? 'Direct link available' : 'Request a callback'}
                            </span>
                          </span>
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs font-extrabold ${isActive ? 'text-white/90' : 'text-gray-700'
                          }`}
                        >
                          {c.actionType === 'link' ? 'Link' : 'Contact'}
                          <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white/90' : 'text-gray-400'}`} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            <main className="lg:col-span-8">
              <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-500">Selected service</div>
                    <div className="text-2xl font-extrabold text-gray-900 truncate">{selectedTitle}</div>
                    {selected?.message ? (
                      <div className="mt-3 rounded-2xl border border-white/60 bg-white/80 p-4 text-gray-800 whitespace-pre-line">
                        {selected.message}
                      </div>
                    ) : (
                      <div className="mt-3 text-gray-700">Follow the steps below.</div>
                    )}
                  </div>
                </div>

                {selected?.actionType === 'link' ? (
                  <div className="mt-5 rounded-3xl border border-white/60 bg-white/85 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-extrabold text-gray-900">Open link</div>
                        <div className="text-xs text-gray-600 mt-1">You’ll be redirected to the admin-provided page.</div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
                      <a
                        href={selected.linkUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-white ${selected.linkUrl
                            ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-md'
                            : 'bg-gray-400 cursor-not-allowed pointer-events-none'
                          }`}
                      >
                        <ExternalLink className="w-4 h-4" />
                        {selected.linkLabel || 'Open'}
                      </a>
                      {!selected.linkUrl ? (
                        <div className="text-sm text-gray-600">Admin has not set a link yet.</div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-3xl border border-white/60 bg-white/85 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-extrabold text-gray-900">Contact form</div>
                        <div className="text-xs text-gray-600 mt-1">Submit your details. Admin will receive it by email.</div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700">Name</label>
                        <input
                          value={form.name}
                          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                          className="w-full mt-1 px-4 py-2.5 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700">Mobile</label>
                        <input
                          value={form.mobile}
                          onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))}
                          className="w-full mt-1 px-4 py-2.5 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                          placeholder="Your mobile"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-gray-700">Email</label>
                        <input
                          value={form.email}
                          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                          className="w-full mt-1 px-4 py-2.5 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                          placeholder="Your email"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-gray-700">Notes</label>
                        <textarea
                          value={form.notes}
                          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                          rows={4}
                          className="w-full mt-1 px-4 py-2.5 rounded-2xl border border-gray-200 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-orange-200"
                          placeholder="Any details..."
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={submitRequest}
                        disabled={sending}
                        className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-extrabold text-white ${sending
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-md'
                          }`}
                      >
                        <Send className="w-4 h-4" />
                        {sending ? 'Submitting…' : 'Submit request'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyServices;

