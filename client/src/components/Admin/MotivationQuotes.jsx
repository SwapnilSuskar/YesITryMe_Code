import { AlertCircle, Eye, EyeOff, Image, Loader2, Plus, Quote, Trash2, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api, { API_ENDPOINTS } from "../../config/api";

const MotivationQuotes = () => {
    const location = useLocation();
    const [motivationQuotes, setMotivationQuotes] = useState([]);
    const [quotesLoading, setQuotesLoading] = useState(true);
    const [showQuoteForm, setShowQuoteForm] = useState(false);
    const [quoteForm, setQuoteForm] = useState({
        quote: "",
        author: "",
        category: "general",
        image: null
    });
    const [quoteSubmitting, setQuoteSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageError, setImageError] = useState('');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        const fetchMotivationQuotes = async () => {
            setQuotesLoading(true);
            try {
                const response = await api.get(API_ENDPOINTS.admin.motivationQuotes);
                setMotivationQuotes(response.data.quotes || []);
            } catch (err) {
                console.error("Failed to fetch motivation quotes:", err);
            } finally {
                setQuotesLoading(false);
            }
        };
        fetchMotivationQuotes();
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setImageError('Please select a valid image file (JPEG, PNG, WebP)');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setImageError('Image size should be less than 5MB. Your image will be automatically compressed.');
            return;
        }

        setImageError('');
        setFormError('');
        setQuoteForm(prev => ({ ...prev, image: file }));

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setQuoteForm(prev => ({ ...prev, image: null }));
        setImagePreview(null);
        setImageError('');
    };

    const validateForm = () => {
        // At least one of quote text or image must be provided
        if (!quoteForm.quote.trim() && !quoteForm.image) {
            setFormError('Please provide either a quote text or an image (or both)');
            return false;
        }

        // If quote text is provided, author is required
        if (quoteForm.quote.trim() && !quoteForm.author.trim()) {
            setFormError('Author is required when providing quote text');
            return false;
        }

        setFormError('');
        return true;
    };

    const handleUploadQuote = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setQuoteSubmitting(true);
        try {
            const formData = new FormData();

            // Only add quote and author if quote text is provided
            if (quoteForm.quote.trim()) {
                formData.append('quote', quoteForm.quote.trim());
                formData.append('author', quoteForm.author.trim());
            }

            formData.append('category', quoteForm.category);
            if (quoteForm.image) {
                formData.append('image', quoteForm.image);
            }

            const response = await api.post(API_ENDPOINTS.admin.motivationQuotes, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setMotivationQuotes(prev => [response.data.quote, ...prev]);
            setQuoteForm({ quote: "", author: "", category: "general", image: null });
            setImagePreview(null);
            setShowQuoteForm(false);
            alert("Motivation content uploaded successfully!");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to upload content");
        } finally {
            setQuoteSubmitting(false);
        }
    };

    const handleToggleQuoteStatus = async (id) => {
        try {
            const response = await api.patch(`${API_ENDPOINTS.admin.motivationQuotes}/${id}/toggle`);
            setMotivationQuotes(prev => prev.map(q => q._id === id ? response.data.quote : q));
        } catch (err) {
            alert(err.response?.data?.message || "Failed to toggle quote status");
        }
    };

    const handleDeleteQuote = async (id) => {
        // Using window.confirm to avoid linter issues
        if (!window.confirm("Are you sure you want to delete this content?")) return;
        try {
            await api.delete(`${API_ENDPOINTS.admin.motivationQuotes}/${id}`);
            setMotivationQuotes(prev => prev.filter(q => q._id !== id));
            alert("Content deleted successfully!");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete content");
        }
    };

    const activeQuotes = motivationQuotes.filter(q => q.isActive).length;
    const imageOnlyQuotes = motivationQuotes.filter(q => !q.quote && q.imageUrl).length;
    const textOnlyQuotes = motivationQuotes.filter(q => q.quote && !q.imageUrl).length;

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col items-center py-12 px-4 pt-20 overflow-x-hidden">
            {/* Blurred Gradient Blobs */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-[#FF4E00] to-orange-500 rounded-full blur-3xl opacity-20 z-0" />
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20 z-0" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-pink-400 to-red-400 rounded-full blur-3xl opacity-20 z-0" />

            <div className="w-full max-w-4xl relative z-10">
                {/* Header with stats */}
                <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 p-8 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-800 drop-shadow-lg flex items-center gap-3">
                            <Quote className="w-10 h-10 text-orange-500" /> Motivation Content
                        </h1>
                        <p className="text-gray-600 mt-2 text-sm">Upload quotes, images, or both to inspire your users.</p>
                    </div>
                    <div className="flex gap-4 flex-wrap">
                        <div className="bg-white/90 backdrop-blur rounded-2xl px-4 py-3 flex flex-col items-center shadow border border-orange-100">
                            <span className="text-lg font-bold text-[#FF4E00]">{motivationQuotes.length}</span>
                            <span className="text-xs text-gray-600">Total</span>
                        </div>
                        <div className="bg-white/90 backdrop-blur rounded-2xl px-4 py-3 flex flex-col items-center shadow border border-orange-100">
                            <span className="text-lg font-bold text-green-500">{activeQuotes}</span>
                            <span className="text-xs text-gray-600">Active</span>
                        </div>
                        <div className="bg-white/90 backdrop-blur rounded-2xl px-4 py-3 flex flex-col items-center shadow border border-blue-100">
                            <span className="text-lg font-bold text-blue-500">{imageOnlyQuotes}</span>
                            <span className="text-xs text-gray-600">Images</span>
                        </div>
                        <div className="bg-white/90 backdrop-blur rounded-2xl px-4 py-3 flex flex-col items-center shadow border border-purple-100">
                            <span className="text-lg font-bold text-purple-500">{textOnlyQuotes}</span>
                            <span className="text-xs text-gray-600">Text Only</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 p-2 mb-8">
                    <div className="flex gap-2">
                        <Link
                            to="/admin"
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${location.pathname === "/admin"
                                ? "bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white shadow-lg"
                                : "text-gray-600 hover:text-[#FF4E00] hover:bg-orange-50"
                                }`}
                        >
                            <User className="w-5 h-5" />
                            User Management
                        </Link>
                        <Link
                            to="/admin/quotes"
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${location.pathname === "/admin/quotes"
                                ? "bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white shadow-lg"
                                : "text-gray-600 hover:text-[#FF4E00] hover:bg-orange-50"
                                }`}
                        >
                            <Quote className="w-5 h-5" />
                            Motivation Content
                        </Link>
                    </div>
                </div>

                {/* Motivation Quote Section */}
                <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 p-8 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Quote className="w-6 h-6 text-orange-500" />
                            Upload Motivation Content
                        </h2>
                        <button
                            onClick={() => setShowQuoteForm(!showQuoteForm)}
                            className="bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Upload Content
                        </button>
                    </div>

                    {/* Quote Upload Form */}
                    {showQuoteForm && (
                        <form onSubmit={handleUploadQuote} className="bg-white/90 backdrop-blur rounded-xl p-6 mb-6 border border-orange-100">
                            {/* Form Error */}
                            {formError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                                    <AlertCircle size={16} />
                                    {formError}
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                {/* Left Column - Text Content */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Quote Text <span className="text-gray-500">(Optional if image is provided)</span>
                                        </label>
                                        <textarea
                                            value={quoteForm.quote}
                                            onChange={(e) => {
                                                setQuoteForm(prev => ({ ...prev, quote: e.target.value }));
                                                setFormError('');
                                            }}
                                            className="w-full p-3 rounded-xl bg-white/80 backdrop-blur border border-orange-200 focus:outline-none focus:ring-2 focus:ring-[#FF4E00] resize-none"
                                            rows="4"
                                            placeholder="Enter the motivation quote (optional if uploading an image)..."
                                            maxLength="500"
                                        />
                                    </div>
                                    {quoteForm.quote.trim() && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Author <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={quoteForm.author}
                                                onChange={(e) => {
                                                    setQuoteForm(prev => ({ ...prev, author: e.target.value }));
                                                    setFormError('');
                                                }}
                                                className="w-full p-3 rounded-xl bg-white/80 backdrop-blur border border-orange-200 focus:outline-none focus:ring-2 focus:ring-[#FF4E00]"
                                                placeholder="Quote author (required when providing quote text)"
                                                maxLength="100"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                                        <select
                                            value={quoteForm.category}
                                            onChange={(e) => setQuoteForm(prev => ({ ...prev, category: e.target.value }))}
                                            className="w-full p-3 rounded-xl bg-white/80 backdrop-blur border border-orange-200 focus:outline-none focus:ring-2 focus:ring-[#FF4E00]"
                                        >
                                            <option value="general">General</option>
                                            <option value="success">Success</option>
                                            <option value="motivation">Motivation</option>
                                            <option value="leadership">Leadership</option>
                                            <option value="perseverance">Perseverance</option>
                                            <option value="business">Business</option>
                                            <option value="mindset">Mindset</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Right Column - Image Upload */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Motivation Image <span className="text-gray-500">(Optional if quote text is provided)</span>
                                        </label>
                                        <div className="border-2 border-dashed border-orange-200 rounded-xl p-6 text-center hover:border-orange-300 transition-colors relative">
                                            {imagePreview ? (
                                                <div className="relative">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        className="w-full h-48 object-cover rounded-lg mb-3"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={removeImage}
                                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition z-10"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="cursor-pointer" onClick={() => document.getElementById('image-upload').click()}>
                                                    <Image className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                                                    <p className="text-gray-600 mb-2">Click to upload an image</p>
                                                    <p className="text-xs text-gray-500">JPEG, PNG, WebP (max 5MB)</p>
                                                </div>
                                            )}
                                            <input
                                                id="image-upload"
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                onChange={handleImageChange}
                                                className="hidden"
                                                disabled={quoteSubmitting}
                                            />
                                        </div>
                                        {imageError && (
                                            <p className="text-red-500 text-xs mt-2">{imageError}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-2">
                                            💡 Images are automatically compressed for better performance
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Upload Guidelines */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <h4 className="font-semibold text-blue-800 mb-2">📝 Upload Guidelines:</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• You can upload <strong>quote text only</strong>, <strong>image only</strong>, or <strong>both</strong></li>
                                    <li>• If uploading quote text, author name is required</li>
                                    <li>• Images are automatically optimized for better performance</li>
                                    <li>• Choose appropriate categories to organize your content</li>
                                </ul>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={quoteSubmitting}
                                    className="bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {quoteSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {quoteSubmitting ? "Uploading..." : "Upload Content"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowQuoteForm(false);
                                        setQuoteForm({ quote: "", author: "", category: "general", image: null });
                                        setImagePreview(null);
                                        setImageError('');
                                        setFormError('');
                                    }}
                                    className="bg-gray-500 text-white px-6 py-2 rounded-xl hover:bg-gray-600 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Content List */}
                    <div className="space-y-4">
                        {quotesLoading ? (
                            <div className="text-center text-gray-700 py-8">Loading content...</div>
                        ) : motivationQuotes.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">No motivation content uploaded yet.</div>
                        ) : (
                            motivationQuotes.map((quote) => (
                                <div key={quote._id} className="bg-white/90 backdrop-blur rounded-xl p-4 border border-orange-100">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            {quote.imageUrl && (
                                                <div className="mb-3">
                                                    <img
                                                        src={quote.imageUrl}
                                                        alt="Motivation"
                                                        className="w-full max-w-xs h-32 object-cover rounded-lg"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            {quote.quote && (
                                                <p className="text-gray-800 font-medium mb-2">"{quote.quote}"</p>
                                            )}
                                            {quote.author && (
                                                <p className="text-sm text-gray-600">— {quote.author}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">{quote.category}</span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(quote.uploadDate).toLocaleDateString()}
                                                </span>
                                                {quote.isActive && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                                                )}
                                                {quote.imageUrl && !quote.quote && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Image Only</span>
                                                )}
                                                {quote.quote && !quote.imageUrl && (
                                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Text Only</span>
                                                )}
                                                {quote.quote && quote.imageUrl && (
                                                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Mixed</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => handleToggleQuoteStatus(quote._id)}
                                                className={`p-2 rounded-lg transition-all ${quote.isActive
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                title={quote.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                {quote.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteQuote(quote._id)}
                                                className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MotivationQuotes; 