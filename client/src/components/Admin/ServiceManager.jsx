import React, { useEffect, useMemo, useState } from 'react';
import { Save, Link2, PhoneCall, RefreshCw, Plus, Trash2, X } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/toast.css';
import api, { API_ENDPOINTS } from '../../config/api';

const ServiceManager = () => {
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState({});
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [openRequest, setOpenRequest] = useState(null);
  const [savingKey, setSavingKey] = useState('');
  const [creating, setCreating] = useState(false);
  const [newService, setNewService] = useState({
    serviceKey: '',
    title: '',
    actionType: 'contact_form',
    linkLabel: '',
    linkUrl: '',
    message: '',
    isActive: true,
  });

  const configKeys = useMemo(
    () => Object.keys(configs).sort((a, b) => a.localeCompare(b)),
    [configs],
  );

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.services.adminConfigs);
      if (res.data?.success) {
        const map = {};
        (res.data.data || []).forEach((c) => { map[c.serviceKey] = c; });
        setConfigs(map);
      } else {
        toast.error(res.data?.message || 'Failed to load configs');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load configs');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await api.get(API_ENDPOINTS.services.adminRequests);
      if (res.data?.success) {
        setRequests(res.data.data || []);
      } else {
        toast.error(res.data?.message || 'Failed to load requests');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load requests');
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
    fetchRequests();
  }, []);

  const update = (key, patch) => {
    setConfigs((p) => ({ ...p, [key]: { ...p[key], ...patch } }));
  };

  const save = async (key) => {
    const cfg = configs[key];
    if (!cfg) return;
    try {
      setSavingKey(key);
      const url = API_ENDPOINTS.services.adminConfigByKey.replace(':serviceKey', key);
      const body = {
        title: cfg.title,
        actionType: cfg.actionType,
        linkUrl: cfg.linkUrl || '',
        linkLabel: cfg.linkLabel || '',
        message: cfg.message || '',
        isActive: !!cfg.isActive,
      };
      const res = await api.put(url, body);
      if (res.data?.success) {
        toast.success('Saved');
        update(key, res.data.data);
      } else {
        toast.error(res.data?.message || 'Failed to save');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally {
      setSavingKey('');
    }
  };

  const create = async () => {
    if (creating) return;
    const key = newService.serviceKey.trim();
    const title = newService.title.trim();
    if (!key) return toast.error('serviceKey is required');
    if (!/^[a-z0-9_]+$/.test(key)) return toast.error('serviceKey must be lowercase letters/numbers/underscore');
    if (!title) return toast.error('title is required');
    try {
      setCreating(true);
      const body = {
        serviceKey: key,
        title,
        actionType: newService.actionType,
        linkLabel: newService.linkLabel,
        linkUrl: newService.linkUrl,
        message: newService.message,
        isActive: !!newService.isActive,
      };
      const res = await api.post(API_ENDPOINTS.services.adminCreate, body);
      if (res.data?.success) {
        toast.success('Service created');
        setConfigs((p) => ({ ...p, [key]: res.data.data }));
        setNewService({
          serviceKey: '',
          title: '',
          actionType: 'contact_form',
          linkLabel: '',
          linkUrl: '',
          message: '',
          isActive: true,
        });
      } else {
        toast.error(res.data?.message || 'Failed to create');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const remove = async (key) => {
    if (!key) return;
    if (!window.confirm(`Delete service "${key}"?`)) return;
    try {
      const url = API_ENDPOINTS.services.adminDelete.replace(':serviceKey', key);
      const res = await api.delete(url);
      if (res.data?.success) {
        toast.success('Service deleted');
        setConfigs((p) => {
          const next = { ...p };
          delete next[key];
          return next;
        });
      } else {
        toast.error(res.data?.message || 'Failed to delete');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-20 pb-10">
      <ToastContainer position="top-center" newestOnTop closeOnClick pauseOnHover theme="colored" autoClose={2500} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white/70 border border-white/60 rounded-2xl p-6 shadow-[0_10px_30px_-12px_rgba(251,146,60,0.35)]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Services Config</h1>
              <p className="text-sm text-gray-600">Decide what users see for each service.</p>
            </div>
            <button
              onClick={() => {
                fetchConfigs();
                fetchRequests();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 ${(loading || requestsLoading) ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-600">Loading…</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/60 bg-white/60 p-5">
                <div className="font-extrabold text-gray-900">Create new service</div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Service key</label>
                    <input
                      value={newService.serviceKey}
                      onChange={(e) => setNewService((p) => ({ ...p, serviceKey: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 bg-white"
                      placeholder="e.g. loan, mutual_fund"
                    />
                    <div className="text-[11px] text-gray-500 mt-1">Only lowercase letters/numbers/underscore.</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Title</label>
                    <input
                      value={newService.title}
                      onChange={(e) => setNewService((p) => ({ ...p, title: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 bg-white"
                      placeholder="Display title"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Action</label>
                    <select
                      value={newService.actionType}
                      onChange={(e) => setNewService((p) => ({ ...p, actionType: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 bg-white"
                    >
                      <option value="contact_form">Contact form</option>
                      <option value="link">Link</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 mt-6 md:mt-0">
                    <input
                      id="new-active"
                      type="checkbox"
                      checked={!!newService.isActive}
                      onChange={(e) => setNewService((p) => ({ ...p, isActive: e.target.checked }))}
                    />
                    <label htmlFor="new-active" className="text-sm font-semibold text-gray-700">Active</label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-gray-700">Message (optional)</label>
                    <textarea
                      value={newService.message}
                      onChange={(e) => setNewService((p) => ({ ...p, message: e.target.value }))}
                      rows={2}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 bg-white resize-none"
                    />
                  </div>
                  {newService.actionType === 'link' ? (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-gray-700">Link label</label>
                        <input
                          value={newService.linkLabel}
                          onChange={(e) => setNewService((p) => ({ ...p, linkLabel: e.target.value }))}
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 bg-white"
                          placeholder="Open"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700">Link URL</label>
                        <input
                          value={newService.linkUrl}
                          onChange={(e) => setNewService((p) => ({ ...p, linkUrl: e.target.value }))}
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 bg-white"
                          placeholder="https://..."
                        />
                      </div>
                    </>
                  ) : null}
                </div>

                <div className="mt-4">
                  <button
                    onClick={create}
                    disabled={creating}
                    className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-white ${
                      creating
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    {creating ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </div>

              {configKeys.map((key) => {
                const cfg = configs[key] || { serviceKey: key };
                return (
                  <div key={key} className="rounded-2xl border border-white/60 bg-white/60 p-5">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-600 mb-1">Service key</div>
                        <div className="font-extrabold text-gray-900">{key}</div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-gray-700">Title</label>
                            <input
                              value={cfg.title || ''}
                              onChange={(e) => update(key, { title: e.target.value })}
                              className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-700">Action</label>
                            <select
                              value={cfg.actionType || 'contact_form'}
                              onChange={(e) => update(key, { actionType: e.target.value })}
                              className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 bg-white"
                            >
                              <option value="contact_form">Contact form</option>
                              <option value="link">Link</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-gray-700">Message (optional)</label>
                            <textarea
                              value={cfg.message || ''}
                              onChange={(e) => update(key, { message: e.target.value })}
                              rows={3}
                              className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 bg-white resize-none"
                              placeholder="Shown to user on My Services page"
                            />
                          </div>
                          {cfg.actionType === 'link' ? (
                            <>
                              <div>
                                <label className="text-xs font-semibold text-gray-700">Link label</label>
                                <input
                                  value={cfg.linkLabel || ''}
                                  onChange={(e) => update(key, { linkLabel: e.target.value })}
                                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 bg-white"
                                  placeholder="Open"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-700">Link URL</label>
                                <input
                                  value={cfg.linkUrl || ''}
                                  onChange={(e) => update(key, { linkUrl: e.target.value })}
                                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 bg-white"
                                  placeholder="https://..."
                                />
                              </div>
                            </>
                          ) : null}
                          <div className="md:col-span-2 flex items-center gap-2">
                            <input
                              id={`${key}-active`}
                              type="checkbox"
                              checked={!!cfg.isActive}
                              onChange={(e) => update(key, { isActive: e.target.checked })}
                            />
                            <label htmlFor={`${key}-active`} className="text-sm font-semibold text-gray-700">
                              Active (visible to users)
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="flex md:flex-col gap-2 md:items-stretch">
                        <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold bg-white border border-gray-200 text-gray-800">
                          {cfg.actionType === 'link' ? <Link2 className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
                          {cfg.actionType === 'link' ? 'Link' : 'Contact'}
                        </div>
                        <button
                          onClick={() => save(key)}
                          disabled={savingKey === key}
                          className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-extrabold text-white ${
                            savingKey === key
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600'
                          }`}
                        >
                          <Save className="w-4 h-4" />
                          {savingKey === key ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={() => remove(key)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-extrabold bg-red-100 text-red-800 hover:bg-red-200"
                          title="Delete service"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 bg-white/70 border border-white/60 rounded-2xl p-6 shadow-[0_10px_30px_-12px_rgba(59,130,246,0.25)]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Service Requests</h2>
              <p className="text-sm text-gray-600">Submissions from users appear here (no email needed).</p>
            </div>
            <div className="text-sm font-semibold text-gray-700">Total: {requests.length}</div>
          </div>

          {requestsLoading ? (
            <div className="text-center py-10 text-gray-600">Loading requests…</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-10 text-gray-600">No requests submitted yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-white/80 border border-white/60">
                    <th className="text-left px-3 py-2 font-bold text-gray-700">Submitted</th>
                    <th className="text-left px-3 py-2 font-bold text-gray-700">Service</th>
                    <th className="text-left px-3 py-2 font-bold text-gray-700">User ID</th>
                    <th className="text-left px-3 py-2 font-bold text-gray-700">Name</th>
                    <th className="text-left px-3 py-2 font-bold text-gray-700">Mobile</th>
                    <th className="text-left px-3 py-2 font-bold text-gray-700">Email</th>
                    <th className="text-left px-3 py-2 font-bold text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r._id} className="border-b border-white/60 bg-white/60 hover:bg-white/80">
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-900 font-semibold whitespace-nowrap">{r.serviceKey || '—'}</td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.userId || '—'}</td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.name || '—'}</td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.mobile || '—'}</td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.email || '—'}</td>
                      <td className="px-3 py-2 text-gray-700 min-w-[260px] max-w-[520px]">
                        {r.notes ? (
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-gray-700 break-words line-clamp-2">{r.notes}</div>
                            <button
                              type="button"
                              onClick={() => setOpenRequest(r)}
                              className="flex-shrink-0 px-3 py-1 rounded-lg text-xs font-extrabold bg-white border border-gray-200 hover:bg-gray-50"
                            >
                              View
                            </button>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {openRequest ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpenRequest(null)}
              role="button"
              tabIndex={0}
            />
            <div className="relative w-full max-w-2xl rounded-2xl border border-white/60 bg-white/90 backdrop-blur-xl shadow-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-600">Service request</div>
                  <div className="text-lg font-extrabold text-gray-900 truncate">
                    {openRequest.serviceKey || 'Service'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {openRequest.createdAt ? new Date(openRequest.createdAt).toLocaleString() : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenRequest(null)}
                  className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-white/60 bg-white/80 p-3">
                  <div className="text-xs text-gray-600 font-semibold">User ID</div>
                  <div className="font-extrabold text-gray-900 break-words">{openRequest.userId || '—'}</div>
                </div>
                <div className="rounded-xl border border-white/60 bg-white/80 p-3">
                  <div className="text-xs text-gray-600 font-semibold">Name</div>
                  <div className="font-extrabold text-gray-900 break-words">{openRequest.name || '—'}</div>
                </div>
                <div className="rounded-xl border border-white/60 bg-white/80 p-3">
                  <div className="text-xs text-gray-600 font-semibold">Mobile</div>
                  <div className="font-extrabold text-gray-900 break-words">{openRequest.mobile || '—'}</div>
                </div>
                <div className="rounded-xl border border-white/60 bg-white/80 p-3">
                  <div className="text-xs text-gray-600 font-semibold">Email</div>
                  <div className="font-extrabold text-gray-900 break-words">{openRequest.email || '—'}</div>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-white/60 bg-white/80 p-4">
                <div className="text-xs font-semibold text-gray-600">Notes</div>
                <div className="mt-2 text-sm text-gray-900 whitespace-pre-wrap break-words max-h-[50vh] overflow-auto">
                  {openRequest.notes || '—'}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard?.writeText) {
                      navigator.clipboard.writeText(openRequest.notes || '');
                      toast.success('Notes copied');
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-extrabold bg-white border border-gray-200 hover:bg-gray-50"
                >
                  Copy notes
                </button>
                <button
                  type="button"
                  onClick={() => setOpenRequest(null)}
                  className="px-4 py-2 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ServiceManager;

