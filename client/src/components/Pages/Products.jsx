import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Eye,
  Filter,
  Grid,
  Heart,
  List,
  Loader2,
  Package,
  Search,
  Star,
  X
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import LoginPrompt from '../UI/LoginPrompt';

const Products = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    featured: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [categories, setCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories/active');
      setCategories(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.featured !== '') params.append('featured', filters.featured);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      params.append('page', pagination.currentPage);
      params.append('limit', pagination.itemsPerPage);

      const response = await api.get(`/api/products/public?${params}`);
      setProducts(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        currentPage: response.data.pagination.currentPage,
        totalPages: response.data.pagination.totalPages,
        totalItems: response.data.pagination.totalItems,
        itemsPerPage: response.data.pagination.itemsPerPage
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.itemsPerPage]);

  useEffect(() => {
    if (filters.category) {
      fetchProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [filters.category, fetchProducts]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      featured: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const hasActiveFilters = filters.search || filters.category || filters.featured !== '';

  if (!user) return <LoginPrompt type="products" />;

  const filteredCategories = categories.filter(category =>
    (category.name || category).toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleCategorySelect = (categoryName) => {
    handleFilterChange('category', categoryName);
    setShowCategoryDropdown(false);
    setCategorySearch('');
  };

  // Show category selection if no category is selected
  if (!filters.category) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-16 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_18px_50px_-22px_rgba(251,146,60,0.45)] p-8 sm:p-10 mb-8 text-center">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-orange-200/50 to-pink-200/40 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-gradient-to-br from-amber-200/40 to-orange-100/50 blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-pink-100 border border-orange-200/60 text-orange-800 text-sm font-extrabold mb-4">
                <Package className="w-4 h-4" />
                Shop
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
                Discover Our Products
              </h1>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-2">
                Explore our curated collection of premium products
              </p>
              <p className="text-sm text-gray-600 max-w-xl mx-auto">
                Select a category to browse — tailored to your needs
              </p>
            </div>
          </div>

          {/* Interactive Category Selector */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/60 p-6 sm:p-8 mb-6">
            <div className="mb-6">
              <label className="block text-lg font-bold text-gray-800 mb-2">
                Choose Your Category
              </label>
              <p className="text-sm text-gray-500">
                Type to search or browse from the quick access options below
              </p>
            </div>

            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search or select a category..."
                  value={categorySearch}
                  onChange={(e) => {
                    setCategorySearch(e.target.value);
                    setShowCategoryDropdown(true);
                  }}
                  onFocus={() => setShowCategoryDropdown(true)}
                  className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                />
                {categorySearch && (
                  <button
                    onClick={() => {
                      setCategorySearch('');
                      setShowCategoryDropdown(false);
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {showCategoryDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowCategoryDropdown(false)}
                  />
                  <div className="absolute z-20 w-full mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="flex justify-center items-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                      </div>
                    ) : filteredCategories.length > 0 ? (
                      <div className="py-2">
                        {filteredCategories.map((category) => (
                          <button
                            key={category._id || category}
                            onClick={() => handleCategorySelect(category.name || category)}
                            className="w-full px-6 py-4 text-left hover:bg-orange-50 transition-colors duration-150 flex items-center justify-between group"
                          >
                            <span className="text-gray-800 font-medium group-hover:text-orange-600">
                              {category.name || category}
                            </span>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-6 py-8 text-center text-gray-500">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                          <Search className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="font-medium text-gray-600 mb-1">No categories found</p>
                        <p className="text-sm text-gray-400">Try a different search term</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            {/* Quick Access - Popular Categories */}
            {categories.length > 0 && !categorySearch && (
              <div className="mt-8 pt-8 border-t border-orange-100/80">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-orange-500" />
                  <p className="text-base font-semibold text-gray-800">Popular Categories</p>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Click on any category to instantly view all available products
                </p>
                <div className="flex flex-wrap gap-3">
                  {categories.slice(0, 6).map((category) => (
                    <button
                      key={category._id || category}
                      onClick={() => handleCategorySelect(category.name || category)}
                      className="px-5 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-orange-500 hover:to-orange-600 hover:text-white text-gray-700 rounded-xl font-semibold transition-all duration-300 text-sm shadow-sm hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      {category.name || category}
                    </button>
                  ))}
                </div>
                {categories.length > 6 && (
                  <p className="text-xs text-gray-400 mt-4 text-center">
                    + {categories.length - 6} more categories available
                  </p>
                )}
              </div>
            )}
          </div>

          {categories.length === 0 && !loading && (
            <div className="text-center py-12 mt-8 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Categories Available</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                We're currently updating our product categories. Please check back soon for exciting new options!
              </p>
            </div>
          )}

          {/* Additional Info Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-800">Premium Quality</h3>
              </div>
              <p className="text-sm text-gray-600">
                All our products are carefully selected to ensure the highest quality standards
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-800">Wide Selection</h3>
              </div>
              <p className="text-sm text-gray-600">
                Browse through hundreds of products across multiple categories
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-800">Best Prices</h3>
              </div>
              <p className="text-sm text-gray-600">
                Competitive pricing with flexible package options to suit your needs
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-16 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/65 backdrop-blur-xl shadow-[0_18px_50px_-22px_rgba(251,146,60,0.55)] p-6 sm:p-8 mb-8 text-center">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-orange-200/40 to-pink-200/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-gradient-to-br from-orange-200/30 to-purple-200/25 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-pink-100 border border-orange-200/60 text-orange-800 text-xs font-extrabold mb-3">
              <Package className="w-3.5 h-3.5" />
              Shop
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Our Products
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
              {filters.category ? `Browsing: ${filters.category}` : 'Discover our curated collection'}
            </p>
            <button
              type="button"
              onClick={() => {
                handleFilterChange('category', '');
                setCategorySearch('');
              }}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/80 border border-orange-200/80 text-orange-800 font-semibold text-sm hover:bg-orange-50 transition-colors shadow-sm"
            >
              <X className="w-4 h-4" />
              Change category
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/60 p-5 sm:p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-orange-200/80 rounded-xl bg-white/80 focus:ring-2 focus:ring-orange-400/50 focus:border-orange-300"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2.5 border border-orange-200/80 rounded-xl bg-white/80 hover:bg-orange-50/80 flex items-center gap-2 transition-colors font-medium text-gray-700"
              >
                <Filter className="w-4 h-4" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex gap-1 p-1 rounded-2xl bg-white/80 border border-orange-200/60 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${viewMode === 'grid'
                  ? 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white shadow-md shadow-orange-500/25'
                  : 'text-gray-600 hover:text-orange-700 hover:bg-orange-50/80'
                  }`}
              >
                <Grid className={`w-5 h-5 ${viewMode === 'grid' ? 'text-white' : ''}`} />
                <span className="text-sm">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${viewMode === 'list'
                  ? 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white shadow-md shadow-orange-500/25'
                  : 'text-gray-600 hover:text-orange-700 hover:bg-orange-50/80'
                  }`}
              >
                <List className={`w-5 h-5 ${viewMode === 'list' ? 'text-white' : ''}`} />
                <span className="text-sm">List</span>
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-orange-100/80">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2.5 border border-orange-200/80 rounded-xl bg-white/80 focus:ring-2 focus:ring-orange-400/50"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category._id || category} value={category.name || category}>
                        {category.name || category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Featured
                  </label>
                  <select
                    value={filters.featured}
                    onChange={(e) => handleFilterChange('featured', e.target.value)}
                    className="w-full px-3 py-2.5 border border-orange-200/80 rounded-xl bg-white/80 focus:ring-2 focus:ring-orange-400/50"
                  >
                    <option value="">All Products</option>
                    <option value="true">Featured Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-');
                      handleFilterChange('sortBy', sortBy);
                      handleFilterChange('sortOrder', sortOrder);
                    }}
                    className="w-full px-3 py-2.5 border border-orange-200/80 rounded-xl bg-white/80 focus:ring-2 focus:ring-orange-400/50"
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="title-asc">Name A-Z</option>
                    <option value="title-desc">Name Z-A</option>
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50/90 backdrop-blur border border-red-200/80 text-red-800 px-4 py-3 rounded-2xl mb-6 flex items-center gap-2 shadow-sm">
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
          <>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6' : 'space-y-4'}>
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  viewMode={viewMode}
                />
              ))}
            </div>

            {products.length === 0 && !loading && (
              <div className="text-center py-14 rounded-3xl border border-white/60 bg-white/60 backdrop-blur-xl">
                <Package className="w-16 h-16 text-orange-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-600 text-sm max-w-md mx-auto">Try adjusting filters or search</p>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-10">
                <div className="inline-flex flex-wrap items-center justify-center gap-2 p-2 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm">
                  <button
                    type="button"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-4 py-2 rounded-xl border border-orange-200/80 text-sm font-semibold text-gray-700 disabled:opacity-45 disabled:cursor-not-allowed hover:bg-orange-50/80 transition-colors"
                  >
                    Previous
                  </button>

                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      type="button"
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`min-w-[2.5rem] px-3 py-2 rounded-xl text-sm font-bold transition-all ${page === pagination.currentPage
                        ? 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white shadow-md shadow-orange-500/20'
                        : 'border border-orange-100 text-gray-700 hover:bg-orange-50/80'
                        }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-4 py-2 rounded-xl border border-orange-200/80 text-sm font-semibold text-gray-700 disabled:opacity-45 disabled:cursor-not-allowed hover:bg-orange-50/80 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, viewMode }) => {
  const [imageError, setImageError] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const pkgCount = product.pricing?.length ?? 0;

  if (viewMode === 'list') {
    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-md border border-white/60 p-5 sm:p-6 hover:shadow-lg hover:border-orange-200/50 transition-all duration-200">
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {product.images && product.images.length > 0 && !imageError ? (
              <img
                src={product.images.find(img => img.isPrimary)?.url || product.images[0].url}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{product.title}</h3>
                <p className="text-gray-600 mb-3 line-clamp-2">{product.description}</p>

                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-100 to-pink-100 text-orange-900 border border-orange-200/50">
                    {product.category?.name || product.category}
                  </span>
                  {product.featured && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-100 to-orange-100 text-orange-900 flex items-center gap-1 border border-orange-200/50">
                      <Star className="w-3 h-3" />
                      Featured
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    {pkgCount} package{pkgCount !== 1 ? 's' : ''} available
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`p-2 rounded-lg transition-colors ${isWishlisted ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
                <Link
                  to={`/products/${product._id}`}
                  className="px-4 py-2.5 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white rounded-xl font-semibold shadow-md shadow-orange-500/20 hover:opacity-95 transition-opacity flex items-center gap-2 text-sm"
                >
                  <Eye className="w-4 h-4" />
                  View details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-md border border-white/60 overflow-hidden hover:shadow-lg hover:border-orange-200/40 transition-all duration-200 group">
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-orange-50/80 to-pink-50/50">
          {product.images && product.images.length > 0 && !imageError ? (
            <img
              src={product.images.find(img => img.isPrimary)?.url || product.images[0].url}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        <div className="absolute top-2 right-2 flex gap-1">
          {product.featured && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500 text-white flex items-center gap-1">
              <Star className="w-3 h-3" />
            </span>
          )}
          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className={`p-1.5 rounded-full transition-colors ${isWishlisted ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600 hover:text-red-500'
              }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">{product.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between mb-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-100 to-pink-100 text-orange-900 border border-orange-200/50 truncate max-w-[55%]">
            {product.category?.name || product.category}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <Package className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-gray-600 truncate">{pkgCount} package{pkgCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {new Date(product.createdAt).toLocaleDateString()}
          </span>
          <Link
            to={`/products/${product._id}`}
            className="px-3 py-2 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-md shadow-orange-500/20 hover:opacity-95 transition-opacity flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4 shrink-0" />
            Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Products; 