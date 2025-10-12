import {
  AlertCircle,
  Calendar,
  Edit,
  Grid,
  Image as ImageIcon,
  List,
  Loader2,
  Package,
  Plus,
  Search,
  Star,
  Trash2,
  X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import api from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';

const ProductManager = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stats, setStats] = useState({});
  const [viewMode, setViewMode] = useState('grid');

  // File input ref and selected files state
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    pricing: [{ packageName: '', price: '', currency: 'INR', features: [''], isPopular: false }],
    tags: [''],
    specifications: {},
    status: 'draft',
    featured: false
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    featured: ''
  });

  const categories = [
    'Educational Courses',
    'Electronic Products',
    'Financial Products',
    'Subscription-Based Digital Products',
    'Utility Services',
    'Shopping Products',
    'Daily Usable Products'
  ];

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.featured !== '') params.append('featured', filters.featured);

      const response = await api.get(`/api/products?${params}`);
      setProducts(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/products/stats/overview');
      setStats(response.data.data || {});
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();

      // Add basic fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('featured', formData.featured);

      // Filter out empty pricing options and tags before sending
      const validPricing = formData.pricing.filter(option =>
        option.packageName && option.packageName.trim() !== '' &&
        option.price !== null && option.price !== undefined && option.price !== ''
      );

      // Validate that at least one pricing option is provided
      if (validPricing.length === 0) {
        setError('At least one pricing option with package name and price is required');
        setLoading(false);
        return;
      }

      const validTags = formData.tags.filter(tag => tag.trim() !== '');

      // Add complex fields as JSON strings
      formDataToSend.append('pricing', JSON.stringify(validPricing));
      formDataToSend.append('tags', JSON.stringify(validTags));
      formDataToSend.append('specifications', JSON.stringify(formData.specifications));

      // Add images
      const imageFiles = fileInputRef.current?.files;
      if (imageFiles && imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          formDataToSend.append('images', imageFiles[i]);
        }
      } else {
      }
      if (editingProduct) {
        await api.put(`/api/products/${editingProduct._id}`, formDataToSend);
      } else {
        await api.post('/api/products', formDataToSend);
      }

      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/api/products/${productId}`);
      fetchProducts();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      category: product.category,
      pricing: product.pricing.length > 0 ? product.pricing : [{ packageName: '', price: '', currency: 'INR', features: [''], isPopular: false }],
      tags: product.tags.length > 0 ? product.tags : [''],
      specifications: product.specifications || {},
      status: product.status,
      featured: product.featured
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      pricing: [{ packageName: '', price: '', currency: 'INR', features: [''], isPopular: false }],
      tags: [''],
      specifications: {},
      status: 'draft',
      featured: false
    });
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredProducts = products.filter(product => {
    const searchMatch = !filters.search ||
      product.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      product.description.toLowerCase().includes(filters.search.toLowerCase());

    const categoryMatch = !filters.category || product.category === filters.category;
    const statusMatch = !filters.status || product.status === filters.status;
    const featuredMatch = filters.featured === '' || product.featured === (filters.featured === 'true');

    return searchMatch && categoryMatch && statusMatch && featuredMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-12 px-4 mt-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-800 flex items-center gap-3">
                <Package className="w-10 h-10 text-orange-500" />
                Product Manager
              </h1>
              <p className="text-gray-600 mt-2">Manage your product catalog with ease</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/90 backdrop-blur rounded-xl p-4 text-center shadow border border-orange-100">
              <div className="text-2xl font-bold text-orange-500">{stats.total || 0}</div>
              <div className="text-sm text-gray-600">Total Products</div>
            </div>
            <div className="bg-white/90 backdrop-blur rounded-xl p-4 text-center shadow border border-green-100">
              <div className="text-2xl font-bold text-green-500">{stats.active || 0}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="bg-white/90 backdrop-blur rounded-xl p-4 text-center shadow border border-blue-100">
              <div className="text-2xl font-bold text-blue-500">{stats.featured || 0}</div>
              <div className="text-sm text-gray-600">Featured</div>
            </div>
            <div className="bg-white/90 backdrop-blur rounded-xl p-4 text-center shadow border border-purple-100">
              <div className="text-2xl font-bold text-purple-500">{stats.draft || 0}</div>
              <div className="text-sm text-gray-600">Draft</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={filters.featured}
                onChange={(e) => setFilters(prev => ({ ...prev, featured: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Products</option>
                <option value="true">Featured Only</option>
                <option value="false">Non-Featured</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Products Grid/List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDelete}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No products found</h3>
            <p className="text-gray-500">Create your first product to get started</p>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
            resetForm();
          }}
          editingProduct={editingProduct}
          categories={categories}
          loading={loading}
          fileInputRef={fileInputRef}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
        />
      )}
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, onEdit, onDelete, viewMode }) => {
  const [imageError, setImageError] = useState(false);

  if (viewMode === 'list') {
    return (
      <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {product.images && product.images.length > 0 && !imageError ? (
              <img
                src={product.images.find(img => img.isPrimary)?.url || product.images[0].url}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 truncate">{product.title}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-green-100 text-green-800' :
                      product.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    {product.status}
                  </span>
                  {product.featured && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Featured
                    </span>
                  )}
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {product.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onEdit(product)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(product._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                {product.pricing.length} package{product.pricing.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <ImageIcon className="w-4 h-4" />
                {product.images.length} images
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(product.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-200">
      <div className="h-48 bg-gray-100 relative">
        {product.images && product.images.length > 0 && !imageError ? (
          <img
            src={product.images.find(img => img.isPrimary)?.url || product.images[0].url}
            alt={product.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}

        <div className="absolute top-2 right-2 flex gap-1">
          {product.featured && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500 text-white flex items-center gap-1">
              <Star className="w-3 h-3" />
            </span>
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-green-500 text-white' :
              product.status === 'draft' ? 'bg-yellow-500 text-white' :
                'bg-red-500 text-white'
            }`}>
            {product.status}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">{product.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between mb-3">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {product.category}
          </span>
          <div className="flex items-center gap-1">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{product.pricing.length} package{product.pricing.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {new Date(product.createdAt).toLocaleDateString()}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(product)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(product._id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Product Form Component
const ProductForm = ({
  formData,
  setFormData,
  onSubmit,
  onClose,
  editingProduct,
  categories,
  loading,
  fileInputRef,
  selectedFiles,
  setSelectedFiles
}) => {
  const addPricingOption = () => {
    setFormData(prev => ({
      ...prev,
      pricing: [...prev.pricing, { packageName: '', price: '', currency: 'INR', features: [''], isPopular: false }]
    }));
  };

  const removePricingOption = (index) => {
    setFormData(prev => ({
      ...prev,
      pricing: prev.pricing.filter((_, i) => i !== index)
    }));
  };

  const updatePricingOption = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      pricing: prev.pricing.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const addFeature = (pricingIndex) => {
    setFormData(prev => ({
      ...prev,
      pricing: prev.pricing.map((option, i) =>
        i === pricingIndex
          ? { ...option, features: [...option.features, ''] }
          : option
      )
    }));
  };

  const removeFeature = (pricingIndex, featureIndex) => {
    setFormData(prev => ({
      ...prev,
      pricing: prev.pricing.map((option, i) =>
        i === pricingIndex
          ? { ...option, features: option.features.filter((_, fi) => fi !== featureIndex) }
          : option
      )
    }));
  };

  const updateFeature = (pricingIndex, featureIndex, value) => {
    setFormData(prev => ({
      ...prev,
      pricing: prev.pricing.map((option, i) =>
        i === pricingIndex
          ? {
            ...option,
            features: option.features.map((feature, fi) =>
              fi === featureIndex ? value : feature
            )
          }
          : option
      )
    }));
  };

  const addTag = () => {
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, '']
    }));
  };

  const removeTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const updateTag = (index, value) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.map((tag, i) => i === index ? value : tag)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          {/* Pricing Options */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Package Options *
              </label>
              <button
                type="button"
                onClick={addPricingOption}
                className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
              >
                Add Package
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              At least one package option with package name and price is required.
            </p>

            {formData.pricing.map((option, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">Package {index + 1}</h4>
                    {formData.pricing.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePricingOption(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Name *
                    </label>
                    <input
                      type="text"
                      value={option.packageName}
                      onChange={(e) => updatePricingOption(index, 'packageName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price *
                    </label>
                    <input
                      type="number"
                      value={option.price}
                      onChange={(e) => updatePricingOption(index, 'price', parseFloat(e.target.value) || '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={option.currency}
                      onChange={(e) => updatePricingOption(index, 'currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id={`popular-${index}`}
                    checked={option.isPopular}
                    onChange={(e) => updatePricingOption(index, 'isPopular', e.target.checked)}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor={`popular-${index}`} className="ml-2 text-sm font-medium text-gray-700">
                    Mark as Popular
                  </label>
                </div>

                {/* Features */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Features
                    </label>
                    <button
                      type="button"
                      onClick={() => addFeature(index)}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                      Add Feature
                    </button>
                  </div>

                  {option.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, featureIndex, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter feature description"
                      />
                      {option.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeature(index, featureIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Tags
              </label>
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                Add Tag
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => updateTag(index, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter tag"
                  />
                  {formData.tags.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Status and Featured */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="featured" className="ml-2 text-sm font-medium text-gray-700">
                Featured Product
              </label>
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                const files = Array.from(e.target.files);
                setSelectedFiles(files);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            {selectedFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-green-600 font-medium">
                  {selectedFiles.length} image(s) selected:
                </p>
                <ul className="text-sm text-gray-600 mt-1">
                  {selectedFiles.map((file, index) => (
                    <li key={index}>• {file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Upload multiple images. The first image will be set as primary.
            </p>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductManager; 