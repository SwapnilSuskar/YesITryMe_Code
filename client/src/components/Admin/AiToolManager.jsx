import { useEffect, useState } from 'react';
import api from '../../config/api';

const AiToolManager = () => {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ search: '', category: '', isActive: '' });
  const [form, setForm] = useState({ name: '', link: '', benefit: '', category: '', isActive: true });

  const fetchTools = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { ...filters };
      const { data } = await api.get('/api/ai-tools', { params });
      setTools(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load AI tools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTools(); }, [filters]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/api/ai-tools/${editing._id}`, form);
      } else {
        await api.post('/api/ai-tools', form);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', link: '', benefit: '', category: '', isActive: true });
      fetchTools();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this AI tool?')) return;
    try {
      await api.delete(`/api/ai-tools/${id}`);
      fetchTools();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const startEdit = (t) => {
    setEditing(t);
    setForm({ name: t.name, link: t.link, benefit: t.benefit, category: t.category, isActive: t.isActive });
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-orange-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-black">
              <span className="bg-gradient-to-r from-[#FF4E00] to-orange-500 bg-clip-text text-transparent">AI Tools Manager</span>
            </h2>
            <button 
              onClick={() => { 
                setShowForm(true); 
                setEditing(null); 
                setForm({ name: '', link: '', benefit: '', category: '', isActive: true }); 
              }} 
              className="bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Add Tool
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <input 
              className="border border-orange-200 p-3 rounded-xl focus:ring-2 focus:ring-[#FF4E00] focus:border-[#FF4E00] outline-none transition-all duration-200" 
              placeholder="Search tools..." 
              value={filters.search} 
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))} 
            />
            <input 
              className="border border-orange-200 p-3 rounded-xl focus:ring-2 focus:ring-[#FF4E00] focus:border-[#FF4E00] outline-none transition-all duration-200" 
              placeholder="Category filter" 
              value={filters.category} 
              onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))} 
            />
            <select 
              className="border border-orange-200 p-3 rounded-xl focus:ring-2 focus:ring-[#FF4E00] focus:border-[#FF4E00] outline-none transition-all duration-200" 
              value={filters.isActive} 
              onChange={(e) => setFilters(f => ({ ...f, isActive: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <button 
              onClick={fetchTools} 
              className="border-2 border-[#FF4E00] text-[#FF4E00] p-3 rounded-xl font-semibold hover:bg-[#FF4E00] hover:text-white transition-all duration-200"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-600">
                <span className="animate-spin inline-block w-6 h-6 border-2 border-orange-300 border-t-[#FF4E00] rounded-full"/>
                Loading AI tools...
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-orange-200 shadow-lg">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-orange-50">
                    <th className="p-4 text-left font-semibold text-gray-700 border-b border-orange-200">AI TOOL</th>
                    <th className="p-4 text-left font-semibold text-gray-700 border-b border-orange-200">LINK</th>
                    <th className="p-4 text-left font-semibold text-gray-700 border-b border-orange-200">BENEFIT</th>
                    <th className="p-4 text-left font-semibold text-gray-700 border-b border-orange-200">CATEGORY</th>
                    <th className="p-4 text-left font-semibold text-gray-700 border-b border-orange-200">STATUS</th>
                    <th className="p-4 text-left font-semibold text-gray-700 border-b border-orange-200">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {tools.map((t, idx) => (
                    <tr key={t._id || idx} className="border-b border-orange-100 hover:bg-orange-50/50 transition-colors">
                      <td className="p-4 font-medium text-black">{t.name}</td>
                      <td className="p-4">
                        <a 
                          className="text-[#FF4E00] hover:text-orange-600 underline font-medium" 
                          href={t.link} 
                          target="_blank" 
                          rel="noreferrer"
                        >
                          Visit
                        </a>
                      </td>
                      <td className="p-4 text-gray-700">
                        <span className="line-clamp-2">{t.benefit}</span>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                          {t.category || 'Other'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          t.isActive 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {t.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => startEdit(t)} 
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => onDelete(t._id)} 
                            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl shadow-2xl border border-orange-100 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-black">
                    {editing ? 'Edit AI Tool' : 'Add New AI Tool'}
                  </h3>
                  <button 
                    onClick={() => { setShowForm(false); setEditing(null); }} 
                    className="text-gray-500 hover:text-[#FF4E00] transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tool Name</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full border border-orange-200 p-3 rounded-xl focus:ring-2 focus:ring-[#FF4E00] focus:border-[#FF4E00] outline-none transition-all duration-200" 
                      value={form.name} 
                      onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tool Link</label>
                    <input 
                      type="url" 
                      required 
                      className="w-full border border-orange-200 p-3 rounded-xl focus:ring-2 focus:ring-[#FF4E00] focus:border-[#FF4E00] outline-none transition-all duration-200" 
                      value={form.link} 
                      onChange={(e) => setForm(f => ({ ...f, link: e.target.value }))} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Benefits</label>
                    <textarea 
                      required 
                      rows={4}
                      className="w-full border border-orange-200 p-3 rounded-xl focus:ring-2 focus:ring-[#FF4E00] focus:border-[#FF4E00] outline-none transition-all duration-200" 
                      value={form.benefit} 
                      onChange={(e) => setForm(f => ({ ...f, benefit: e.target.value }))} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full border border-orange-200 p-3 rounded-xl focus:ring-2 focus:ring-[#FF4E00] focus:border-[#FF4E00] outline-none transition-all duration-200" 
                      value={form.category} 
                      onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} 
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="isActive"
                      className="w-4 h-4 text-[#FF4E00] border-orange-300 rounded focus:ring-[#FF4E00] focus:ring-2" 
                      checked={form.isActive} 
                      onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))} 
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-4">
                    <button 
                      type="submit" 
                      className="flex-1 bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      {editing ? 'Update Tool' : 'Add Tool'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setShowForm(false); setEditing(null); }} 
                      className="flex-1 border-2 border-orange-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-orange-50 hover:border-[#FF4E00] hover:text-[#FF4E00] transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiToolManager;


