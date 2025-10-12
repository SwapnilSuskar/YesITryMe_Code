import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';

// detail modal is now a separate component

const AiTools = () => {
    const navigate = useNavigate();
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchPublic = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get('/api/ai-tools/public');
            setTools(data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load AI tools');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPublic(); }, []);

    const grouped = tools.reduce((acc, t) => {
        const key = t.category || 'Other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
    }, {});

    return (
        <section className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 py-8 sm:py-12 md:py-16 lg:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6 sm:mb-8 text-center">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-black mb-3 sm:mb-4">
                        <span className="bg-gradient-to-r from-[#FF4E00] to-orange-500 bg-clip-text text-transparent">100 फ्री AI टूल्स</span>
                    </h1>
                    <p className="text-sm sm:text-base md:text-lg text-gray-600">सबसे लोकप्रिय और उपयोगी AI टूल्स, एक जगह।</p>
                </div>
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 mb-6 sm:mb-8 text-red-700 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm sm:text-base">{error}</span>
                        </div>
                    </div>
                )}
                {loading ? (
                    <div className="flex items-center justify-center gap-2 text-gray-600 py-8">
                        <span className="animate-spin inline-block w-5 h-5 border-2 border-orange-300 border-t-[#FF4E00] rounded-full"/>
                        <span className="text-sm sm:text-base">Loading...</span>
                    </div>
                ) : (
                    Object.keys(grouped).sort().map(cat => (
                        <CategorySection key={cat} title={cat} items={grouped[cat]} />
                    ))
                )}
            </div>
        </section>
    );
};

export default AiTools;

const CategorySection = ({ title, items }) => {
  const navigate = useNavigate();
  const openToolDetail = (tool) => {
    const toolName = tool.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    navigate(`/ai-tools/${toolName}`);
  };

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl sm:text-2xl font-bold text-black">{title}</h2>
        <span className="text-xs sm:text-sm text-gray-500 bg-white px-2 sm:px-3 py-1 rounded-full border border-orange-100">{items.length} tools</span>
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-orange-200 shadow-lg bg-white">
        <table className="min-w-full">
          <thead>
            <tr className="bg-orange-50 text-left text-sm text-gray-600">
              <th className="p-3 font-semibold">AI TOOL</th>
              <th className="p-3 font-semibold">LINK</th>
              <th className="p-3 font-semibold">BENEFIT</th>
              <th className="p-3 font-semibold">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t, idx) => (
              <tr key={t._id || idx} className="border-t border-orange-100 hover:bg-orange-50/50 transition-colors">
                <td className="p-3 font-medium text-black">{t.name}</td>
                <td className="p-3">
                    <a 
                        className="text-[#FF4E00] hover:text-orange-600 underline font-medium" 
                        href={t.link} 
                        target="_blank" 
                        rel="noreferrer"
                    >
                        Visit
                    </a>
                </td>
                <td className="p-3 text-gray-700">
                  <span className="line-clamp-1">{t.benefit}</span>
                </td>
                <td className="p-3">
                  <button 
                    onClick={()=>openToolDetail(t)} 
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white text-sm hover:from-orange-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    Quick View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {items.map((t, idx) => (
          <div key={t._id || idx} className="bg-white rounded-xl border border-orange-200 shadow-lg p-4 hover:shadow-xl transition-all duration-200">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-semibold text-black text-sm sm:text-base flex-1">{t.name}</h3>
              <button 
                onClick={()=>openToolDetail(t)} 
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white text-xs sm:text-sm hover:from-orange-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 whitespace-nowrap"
              >
                Quick View
              </button>
            </div>
            <p className="text-gray-700 text-xs sm:text-sm mb-3 line-clamp-2">{t.benefit}</p>
            <div className="flex items-center justify-between">
              <a 
                className="text-[#FF4E00] hover:text-orange-600 underline font-medium text-xs sm:text-sm" 
                href={t.link} 
                target="_blank" 
                rel="noreferrer"
              >
                Visit Tool
              </a>
              <span className="text-xs text-gray-500">Click "Quick View" for details</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


