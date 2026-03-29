import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Truck
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import LoginPrompt from '../UI/LoginPrompt';

function getPricingSummary(pricing) {
  if (!Array.isArray(pricing) || pricing.length === 0) {
    return { min: null, max: null, currency: 'INR', count: 0 };
  }
  const prices = pricing.map((p) => p.price).filter((n) => typeof n === 'number');
  if (prices.length === 0) {
    return { min: null, max: null, currency: pricing[0]?.currency || 'INR', count: pricing.length };
  }
  const currency = pricing.find((p) => p.currency)?.currency || 'INR';
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    currency,
    count: pricing.length
  };
}

function formatPriceSummary({ min, max, currency }) {
  if (min == null) return 'See options';
  const sym = currency === 'INR' ? '₹' : `${currency} `;
  const a = min === max ? `${sym}${min.toLocaleString('en-IN')}` : `${sym}${min.toLocaleString('en-IN')} – ${sym}${max.toLocaleString('en-IN')}`;
  return `From ${a}`;
}

const SORT_OPTIONS = [
  { id: 'new', label: 'Newest first', sortBy: 'createdAt', sortOrder: 'desc' },
  { id: 'old', label: 'Oldest first', sortBy: 'createdAt', sortOrder: 'asc' },
  { id: 'az', label: 'Name: A → Z', sortBy: 'title', sortOrder: 'asc' },
  { id: 'za', label: 'Name: Z → A', sortBy: 'title', sortOrder: 'desc' }
];

const PAGE_SIZES = [12, 24, 36];

const Products = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortId, setSortId] = useState('new');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  });

  const sortConfig = useMemo(() => SORT_OPTIONS.find((o) => o.id === sortId) || SORT_OPTIONS[0], [sortId]);

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
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('sortBy', sortConfig.sortBy);
      params.append('sortOrder', sortConfig.sortOrder);
      params.append('page', pagination.currentPage);
      params.append('limit', pagination.itemsPerPage);
      if (search.trim()) params.append('search', search.trim());
      if (featuredOnly) params.append('featured', 'true');

      const response = await api.get(`/api/products/public?${params}`);
      setProducts(response.data.data || []);
      setPagination((prev) => ({
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
  }, [
    user,
    selectedCategory,
    pagination.currentPage,
    pagination.itemsPerPage,
    search,
    sortConfig.sortBy,
    sortConfig.sortOrder,
    featuredOnly
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const selectCategory = (name) => {
    setSelectedCategory(name);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const applySearch = (e) => {
    e?.preventDefault();
    setSearch(searchInput.trim());
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const startIndex =
    pagination.totalItems === 0 ? 0 : (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
  const endIndex = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems);

  if (!user) return <LoginPrompt type="products" />;

  const chipBase =
    'shrink-0 snap-start px-3.5 py-2 rounded-full text-sm font-medium border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 active:scale-[0.98]';
  const chipInactive =
    'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-sm';
  const chipActive = 'border-orange-500 bg-orange-50 text-orange-900 shadow-sm ring-1 ring-orange-500/20';

  return (
    <div className="min-h-screen bg-[#f6f7f9] pt-16 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-6">
        {/* Breadcrumbs */}
        <nav className="pt-4 pb-2 text-sm text-slate-500" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/" className="hover:text-orange-600 transition-colors">
                Home
              </Link>
            </li>
            <li className="text-slate-300" aria-hidden>
              /
            </li>
            <li className="text-slate-800 font-medium" aria-current="page">
              Shop
            </li>
          </ol>
        </nav>

        {/* Hero + search */}
        <section className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/90 via-white to-violet-50/40 pointer-events-none" />
          <div className="relative px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12 lg:flex lg:items-end lg:justify-between gap-8">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-700/90 mb-3">
                <ShoppingBag className="w-3.5 h-3.5" />
                Store
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.35rem] font-bold text-slate-900 tracking-tight leading-tight">
                Discover products &amp; plans
              </h1>
              <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                Browse by category, compare options, and open any item for full details and checkout.
              </p>
            </div>
            <form
              onSubmit={applySearch}
              className="mt-6 lg:mt-0 w-full lg:max-w-md flex flex-col sm:flex-row gap-2 shrink-0"
            >
              <label className="sr-only" htmlFor="shop-search">
                Search products
              </label>
              <div className="relative flex-1">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                  aria-hidden
                />
                <input
                  id="shop-search"
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by name or description…"
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              >
                Search
              </button>
            </form>
          </div>
        </section>

        {/* Filters row: categories + sort + featured */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-4 mb-6">
          {categories.length > 0 && (
            <div className="flex-1 min-w-0 rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm">
              <div className="mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</span>
              </div>

              {/* Mobile / tablet: single full-width picker (no horizontal chip strip) */}
              <div className="lg:hidden">
                <label htmlFor="shop-category" className="sr-only">
                  Filter by category
                </label>
                <div className="relative">
                  <select
                    id="shop-category"
                    value={selectedCategory}
                    onChange={(e) => selectCategory(e.target.value)}
                    className="appearance-none w-full pl-3.5 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 cursor-pointer"
                  >
                    <option value="">All products</option>
                    {categories.map((category) => {
                      const name = category.name || category;
                      return (
                        <option key={category._id || name} value={name}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Desktop: chip row */}
              <div
                className="hidden lg:flex flex-wrap gap-2"
                role="tablist"
                aria-label="Product categories"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={!selectedCategory}
                  onClick={() => selectCategory('')}
                  className={`${chipBase} ${!selectedCategory ? chipActive : chipInactive}`}
                >
                  All products
                </button>
                {categories.map((category) => {
                  const name = category.name || category;
                  const active = selectedCategory === name;
                  return (
                    <button
                      type="button"
                      role="tab"
                      key={category._id || name}
                      aria-selected={active}
                      onClick={() => selectCategory(name)}
                      className={`${chipBase} ${active ? chipActive : chipInactive}`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 lg:w-auto shrink-0">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-0.5">Sort</span>
              <div className="relative">
                <select
                  value={sortId}
                  onChange={(e) => {
                    setSortId(e.target.value);
                    setPagination((prev) => ({ ...prev, currentPage: 1 }));
                  }}
                  className="appearance-none w-full sm:w-[200px] pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-0.5">Per page</span>
              <div className="relative">
                <select
                  value={pagination.itemsPerPage}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setPagination((prev) => ({ ...prev, itemsPerPage: n, currentPage: 1 }));
                  }}
                  className="appearance-none w-full sm:w-[100px] pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 cursor-pointer"
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFeaturedOnly((v) => !v);
                setPagination((prev) => ({ ...prev, currentPage: 1 }));
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${featuredOnly
                ? 'border-amber-400 bg-amber-50 text-amber-900 ring-1 ring-amber-400/30'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
                }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              Featured only
            </button>
            {search ? (
              <button
                type="button"
                onClick={clearSearch}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium underline-offset-2 hover:underline"
              >
                Clear search &quot;{search.length > 24 ? `${search.slice(0, 24)}…` : search}&quot;
              </button>
            ) : null}
          </div>
          {!loading && pagination.totalItems > 0 && (
            <p className="text-sm text-slate-600 tabular-nums">
              Showing{' '}
              <span className="font-semibold text-slate-900">
                {startIndex}–{endIndex}
              </span>{' '}
              of <span className="font-semibold text-slate-900">{pagination.totalItems}</span>
            </p>
          )}
        </div>

        {categories.length === 0 && !loading && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Categories are not set up yet — showing all available products.
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 px-4 py-3 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <ProductGridSkeleton count={Math.min(pagination.itemsPerPage, 12)} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {products.length === 0 && !loading && (
              <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-200 bg-white">
                <Package className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No products match</h3>
                <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
                  Try another category, turn off filters, or clear your search.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    selectCategory('');
                    clearSearch();
                    setFeaturedOnly(false);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                  Reset filters
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {pagination.totalPages > 1 && products.length > 0 && (
              <PaginationBar
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

function PaginationBar({ currentPage, totalPages, onPageChange }) {
  const pages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const set = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    const list = [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i < list.length; i++) {
      if (i > 0 && list[i] - list[i - 1] > 1) out.push('…');
      out.push(list[i]);
    }
    return out;
  }, [currentPage, totalPages]);

  return (
    <nav
      className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 pt-8 border-t border-slate-200"
      aria-label="Pagination"
    >
      <p className="text-sm text-slate-500 order-2 sm:order-1">
        Page {currentPage} of {totalPages}
      </p>
      <div className="inline-flex flex-wrap items-center justify-center gap-1 order-1 sm:order-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <div className="hidden sm:flex items-center gap-1 px-1">
          {pages.map((item, idx) =>
            item === '…' ? (
              <span key={`e-${idx}`} className="px-2 text-slate-400 text-sm select-none">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={`min-w-[2.5rem] h-10 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${item === currentPage ? 'bg-slate-900 text-white shadow' : 'text-slate-700 hover:bg-slate-100'
                  }`}
              >
                {item}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}

function ProductGridSkeleton({ count }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm animate-pulse"
        >
          <div className="aspect-[4/5] bg-slate-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-full" />
            <div className="h-3 bg-slate-100 rounded w-5/6" />
            <div className="flex justify-between pt-2">
              <div className="h-6 bg-slate-200 rounded w-24" />
              <div className="h-8 bg-slate-200 rounded-lg w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const ProductCard = ({ product }) => {
  const [imageError, setImageError] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const pricing = getPricingSummary(product.pricing);
  const priceLabel = formatPriceSummary(pricing);
  const categoryName = product.category?.name || product.category || 'General';

  const isNew =
    product.createdAt &&
    Date.now() - new Date(product.createdAt).getTime() < 14 * 24 * 60 * 60 * 1000;

  return (
    <article className="group flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-slate-300/80 transition-all duration-300 overflow-hidden h-full">
      <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
        <Link to={`/products/${product._id}`} className="absolute inset-0 block" tabIndex={-1}>
          <span className="sr-only">View {product.title}</span>
        </Link>
        {product.images && product.images.length > 0 && !imageError ? (
          <img
            src={product.images.find((img) => img.isPrimary)?.url || product.images[0].url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
            <Package className="w-14 h-14 text-slate-300" />
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start gap-2 pointer-events-none">
          <div className="flex flex-wrap gap-1.5">
            {product.featured && (
              <span className="pointer-events-auto inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide bg-amber-500 text-white shadow-sm">
                <Star className="w-3 h-3 fill-white" />
                Featured
              </span>
            )}
            {isNew && !product.featured && (
              <span className="px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide bg-emerald-600 text-white shadow-sm">
                New
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsWishlisted(!isWishlisted);
            }}
            className={`pointer-events-auto p-2 rounded-full shadow-md border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${isWishlisted
              ? 'bg-red-500 border-red-600 text-white'
              : 'bg-white/95 border-slate-200/80 text-slate-600 hover:text-red-500 hover:border-red-200'
              }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Quick overlay CTA on hover — desktop */}
        <Link
          to={`/products/${product._id}`}
          className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden sm:block bg-gradient-to-t from-black/70 via-black/40 to-transparent pt-12"
        >
          <span className="flex w-full items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-semibold shadow-lg hover:bg-slate-50 transition-colors">
            View product
            <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </div>

      <div className="flex flex-col flex-1 p-4 pt-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 line-clamp-1">
          {categoryName}
        </p>
        <Link to={`/products/${product._id}`} className="block group/title">
          <h3 className="text-base font-semibold text-slate-900 leading-snug line-clamp-2 group-hover/title:text-orange-700 transition-colors">
            {product.title}
          </h3>
        </Link>

        {typeof product.deliveryCharge === 'number' && product.deliveryCharge > 0 ? (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden />
            Delivery from ₹{product.deliveryCharge.toLocaleString('en-IN')}
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">Delivery calculated at checkout</p>
        )}

        <p className="text-sm text-slate-600 mt-2 line-clamp-2 flex-1">{product.description}</p>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Price</p>
            <p className="text-lg font-bold text-slate-900 tabular-nums">{priceLabel}</p>
            {pricing.count > 1 && (
              <p className="text-[11px] text-slate-500 mt-0.5">{pricing.count} options</p>
            )}
          </div>
          <Link
            to={`/products/${product._id}`}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
};

export default Products;