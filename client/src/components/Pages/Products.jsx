import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  X
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import DeliveryNote from '../Shop/DeliveryNote';
import {
  badge,
  button,
  chip,
  control,
  focusRing,
  formatFromPrice,
  getPricingSummary,
  resolvePrimaryImage,
  surface,
  transitions,
  type
} from '../Shop/shopTokens';
import { useAuthStore } from '../../store/useAuthStore';
import LoginPrompt from '../UI/LoginPrompt';

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

  /* Local UI only: the below-lg filter sheet. Never touches the query. */
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterPanelRef = useRef(null);
  const filterButtonRef = useRef(null);

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

  const closeFilters = useCallback(() => {
    setFiltersOpen(false);
    filterButtonRef.current?.focus();
  }, []);

  /* Sheet behaviour: Escape closes, body scroll locks, focus moves into panel. */
  useEffect(() => {
    if (!filtersOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeFilters();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    filterPanelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [filtersOpen, closeFilters]);

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

  const changeSort = (id) => {
    setSortId(id);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const changePageSize = (size) => {
    setPagination((prev) => ({ ...prev, itemsPerPage: size, currentPage: 1 }));
  };

  const toggleFeatured = () => {
    setFeaturedOnly((v) => !v);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSearchInput('');
    setSearch('');
    setFeaturedOnly(false);
    setSortId('new');
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const startIndex =
    pagination.totalItems === 0 ? 0 : (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
  const endIndex = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems);

  if (!user) return <LoginPrompt type="products" />;

  const activeFilterCount =
    (selectedCategory ? 1 : 0) + (search.trim() ? 1 : 0) + (featuredOnly ? 1 : 0);
  const truncatedSearch = search.length > 24 ? `${search.slice(0, 24)}…` : search;
  const categoryOptions = categories.map((category) => ({
    key: category._id || category.name || category,
    name: category.name || category
  }));

  return (
    <div className={`${surface.page} pb-16 pt-16`}>
      <div className={surface.shell}>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="pb-3 pt-5">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <li>
              <Link
                to="/"
                className={`rounded font-medium hover:text-brand-secondary ${transitions.fast} ${focusRing}`}
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-slate-300">
              /
            </li>
            <li aria-current="page" className="font-semibold text-slate-800">
              Shop
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-6 max-w-2xl">
          <p className={`${type.eyebrow} flex items-center gap-2`}>
            <ShoppingBag className="h-3.5 w-3.5 text-brand-primary" aria-hidden="true" />
            Store
          </p>
          <h1 className={`${type.h1} mt-2`}>Shop all products</h1>
          <p className={`${type.body} mt-2`}>
            Browse by category, compare packages, and open any item for full details and checkout.
          </p>
        </header>

        {/* Sticky filter bar */}
        <div className={`${surface.stickyTop} mb-4`}>
          <div className={`${surface.card} p-3 sm:p-4`}>
            <div className="flex items-center gap-2 sm:gap-3">
              <form onSubmit={applySearch} role="search" className="min-w-0 flex-1">
                <label htmlFor="shop-search" className="sr-only">
                  Search products
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="shop-search"
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search products"
                    className={`${control.input} pl-10 pr-14 sm:pr-24`}
                  />
                  <button
                    type="submit"
                    aria-label="Search products"
                    className={`absolute right-1.5 top-1/2 inline-flex h-8 -translate-y-1/2 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 ${transitions.base} ${focusRing}`}
                  >
                    <Search className="h-3.5 w-3.5 sm:hidden" aria-hidden="true" />
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>
              </form>

              {/* Desktop inline controls */}
              <div className="hidden shrink-0 items-center gap-2 lg:flex">
                <button
                  type="button"
                  onClick={toggleFeatured}
                  aria-pressed={featuredOnly}
                  className={`${chip.base} ${featuredOnly ? chip.on : chip.off}`}
                >
                  <Sparkles
                    className={`h-4 w-4 ${featuredOnly ? 'text-white' : 'text-brand-primary'}`}
                    aria-hidden="true"
                  />
                  Featured
                </button>

                <div className="relative">
                  <label htmlFor="shop-sort" className="sr-only">
                    Sort products
                  </label>
                  <select
                    id="shop-sort"
                    value={sortId}
                    onChange={(e) => changeSort(e.target.value)}
                    className={`${control.select} w-[190px] cursor-pointer`}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className={control.selectCaret} aria-hidden="true" />
                </div>

                <div className="relative">
                  <label htmlFor="shop-per-page" className="sr-only">
                    Products per page
                  </label>
                  <select
                    id="shop-per-page"
                    value={pagination.itemsPerPage}
                    onChange={(e) => changePageSize(Number(e.target.value))}
                    className={`${control.select} w-[104px] cursor-pointer`}
                  >
                    {PAGE_SIZES.map((n) => (
                      <option key={n} value={n}>
                        {n} / page
                      </option>
                    ))}
                  </select>
                  <ChevronDown className={control.selectCaret} aria-hidden="true" />
                </div>
              </div>

              {/* Mobile / tablet trigger */}
              <button
                ref={filterButtonRef}
                type="button"
                onClick={() => setFiltersOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={filtersOpen}
                aria-label={
                  activeFilterCount > 0
                    ? `Filters and sorting, ${activeFilterCount} active`
                    : 'Filters and sorting'
                }
                className={`${button.outline} shrink-0 px-3 lg:hidden`}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-primary px-1.5 text-[11px] font-semibold text-white"
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Desktop category pills */}
            {categoryOptions.length > 0 && (
              <div
                role="group"
                aria-label="Filter by category"
                className="mt-3 hidden flex-wrap items-center gap-2 lg:flex"
              >
                <button
                  type="button"
                  onClick={() => selectCategory('')}
                  aria-pressed={!selectedCategory}
                  className={`${chip.base} ${!selectedCategory ? chip.on : chip.off}`}
                >
                  All products
                </button>
                {categoryOptions.map((category) => {
                  const active = selectedCategory === category.name;
                  return (
                    <button
                      key={category.key}
                      type="button"
                      onClick={() => selectCategory(category.name)}
                      aria-pressed={active}
                      className={`${chip.base} ${active ? chip.on : chip.off}`}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Active filter summary */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <p aria-live="polite" className="text-sm tabular-nums text-slate-600">
            {loading ? (
              ''
            ) : pagination.totalItems === 0 ? (
              'No products found'
            ) : (
              <>
                Showing{' '}
                <span className="font-semibold text-slate-900">
                  {startIndex}–{endIndex}
                </span>{' '}
                of <span className="font-semibold text-slate-900">{pagination.totalItems}</span>{' '}
                products
              </>
            )}
          </p>

          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {search.trim() && (
                <FilterPill
                  label={`Search: “${truncatedSearch}”`}
                  removeLabel={`Clear search ${search}`}
                  onRemove={clearSearch}
                />
              )}
              {selectedCategory && (
                <FilterPill
                  label={selectedCategory}
                  removeLabel={`Clear category filter ${selectedCategory}`}
                  onRemove={() => selectCategory('')}
                />
              )}
              {featuredOnly && (
                <FilterPill
                  label="Featured only"
                  removeLabel="Clear featured only filter"
                  onRemove={toggleFeatured}
                />
              )}
              <button type="button" onClick={clearAllFilters} className={`${button.ghost} px-2 py-1`}>
                Clear all
              </button>
            </div>
          )}
        </div>

        {categories.length === 0 && !loading && (
          <div className={`${surface.inset} mb-5 px-4 py-3 text-sm text-slate-600`}>
            Categories are not set up yet — showing all available products.
          </div>
        )}

        {loading ? (
          <>
            <p className="sr-only" role="status">
              Loading products
            </p>
            <ProductGridSkeleton count={Math.min(pagination.itemsPerPage, 12)} />
          </>
        ) : error ? (
          <div className={`${surface.card} px-6 py-12 text-center`}>
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertCircle className="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 className={type.h2}>We couldn’t load the shop</h2>
            <p className={`${type.body} mx-auto mt-2 max-w-md`}>{error}</p>
            <button
              type="button"
              onClick={() => fetchProducts()}
              className={`${button.dark} mx-auto mt-6`}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className={`${surface.card} px-6 py-14 text-center`}>
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Package className="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 className={type.h2}>No products match your filters</h2>
            <p className={`${type.body} mx-auto mt-2 max-w-md`}>
              Try a different category or search term — or clear everything and start again.
            </p>
            <button type="button" onClick={clearAllFilters} className={`${button.dark} mx-auto mt-6`}>
              Clear all filters
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <PaginationBar
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>

      {/* Mobile filter sheet */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={closeFilters}
            className="absolute inset-0 h-full w-full cursor-default bg-slate-900/50"
          />
          <div
            ref={filterPanelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Filter and sort products"
            tabIndex={-1}
            className="relative flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-[0_-12px_40px_-12px_rgba(15,23,42,0.35)] focus:outline-none"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <h2 className={type.h2}>Filters &amp; sorting</h2>
              <button
                type="button"
                onClick={closeFilters}
                aria-label="Close filters"
                className={`${button.icon} h-9 w-9`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              <section>
                <h3 className={type.eyebrow}>Category</h3>
                <div role="group" aria-label="Filter by category" className="mt-2 space-y-1.5">
                  <SheetOption
                    label="All products"
                    selected={!selectedCategory}
                    onSelect={() => selectCategory('')}
                  />
                  {categoryOptions.map((category) => (
                    <SheetOption
                      key={category.key}
                      label={category.name}
                      selected={selectedCategory === category.name}
                      onSelect={() => selectCategory(category.name)}
                    />
                  ))}
                </div>
              </section>

              <section className="mt-6">
                <h3 className={type.eyebrow}>Sort by</h3>
                <div role="group" aria-label="Sort products" className="mt-2 space-y-1.5">
                  {SORT_OPTIONS.map((opt) => (
                    <SheetOption
                      key={opt.id}
                      label={opt.label}
                      selected={sortId === opt.id}
                      onSelect={() => changeSort(opt.id)}
                    />
                  ))}
                </div>
              </section>

              <section className="mt-6">
                <h3 className={type.eyebrow}>Products per page</h3>
                <div
                  role="group"
                  aria-label="Products per page"
                  className="mt-2 flex flex-wrap items-center gap-2"
                >
                  {PAGE_SIZES.map((n) => {
                    const active = pagination.itemsPerPage === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => changePageSize(n)}
                        aria-pressed={active}
                        className={`${chip.base} ${active ? chip.on : chip.off}`}
                      >
                        {n} per page
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="mt-6">
                <h3 className={type.eyebrow}>Highlights</h3>
                <button
                  type="button"
                  onClick={toggleFeatured}
                  aria-pressed={featuredOnly}
                  className={`mt-2 flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left text-sm font-medium ${transitions.base} ${focusRing} ${
                    featuredOnly
                      ? 'border-brand-primary bg-brand-primary/5 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-brand-primary" aria-hidden="true" />
                    Featured products only
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 ${transitions.base} ${
                      featuredOnly ? 'bg-brand-primary' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`h-5 w-5 rounded-full bg-white shadow-sm ${transitions.base} ${
                        featuredOnly ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </span>
                </button>
              </section>
            </div>

            <div className="sticky bottom-0 flex items-center gap-3 border-t border-slate-200 bg-white px-4 py-3">
              <button type="button" onClick={clearAllFilters} className={`${button.outline} flex-1`}>
                Clear all
              </button>
              <button type="button" onClick={closeFilters} className={`${button.primary} flex-1 py-2.5`}>
                Show results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function FilterPill({ label, removeLabel, onRemove }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={removeLabel}
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 ${transitions.base} ${focusRing}`}
    >
      <span className="truncate">{label}</span>
      <X className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
    </button>
  );
}

function SheetOption({ label, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium ${transitions.base} ${focusRing} ${
        selected
          ? 'border-brand-primary bg-brand-primary/5 text-slate-900'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span className="min-w-0 truncate">{label}</span>
      {selected && <Check className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />}
    </button>
  );
}

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
      aria-label="Pagination"
      className="mt-10 flex flex-col items-center justify-center gap-4 border-t border-slate-200 pt-8 sm:flex-row"
    >
      <p className={`${type.muted} order-2 tabular-nums sm:order-1`}>
        Page {currentPage} of {totalPages}
      </p>
      <div className="order-1 flex flex-wrap items-center justify-center gap-1 sm:order-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${button.outline} px-3`}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </button>

        <div className="hidden items-center gap-1 px-1 sm:flex">
          {pages.map((item, idx) =>
            item === '…' ? (
              <span key={`e-${idx}`} className="select-none px-2 text-sm text-slate-400">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === currentPage ? 'page' : undefined}
                aria-label={`Go to page ${item}`}
                className={`h-10 min-w-[2.5rem] rounded-xl px-2 text-sm font-semibold tabular-nums ${transitions.base} ${focusRing} ${
                  item === currentPage
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
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
          className={`${button.outline} px-3`}
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

function ProductGridSkeleton({ count }) {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4"
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`${surface.card} overflow-hidden animate-pulse motion-reduce:animate-none`}
        >
          <div className="aspect-[4/5] bg-slate-200" />
          <div className="space-y-3 p-4">
            <div className="h-5 w-20 rounded-full bg-slate-100" />
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-5/6 rounded bg-slate-100" />
            <div className="h-6 w-24 rounded bg-slate-200" />
            <div className="h-10 w-full rounded-xl bg-slate-100" />
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
  const priceParts = formatFromPrice(pricing);
  const categoryName = product.category?.name || product.category || 'General';
  const primaryImage = resolvePrimaryImage(product.images);

  const isNew =
    product.createdAt &&
    Date.now() - new Date(product.createdAt).getTime() < 14 * 24 * 60 * 60 * 1000;

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden ${surface.card} ${surface.cardHover} ${transitions.base}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
        {primaryImage?.url && !imageError ? (
          <img
            src={primaryImage.url}
            alt={product.title}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
            className={`h-full w-full object-cover group-hover:scale-105 ${transitions.zoom}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100">
            <Package className="h-12 w-12 text-slate-300" aria-hidden="true" />
            <span className="sr-only">No image available</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3">
          <div className="flex flex-wrap gap-1.5">
            {product.featured && (
              <span className={badge.featured}>
                <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                Featured
              </span>
            )}
            {isNew && !product.featured && <span className={badge.fresh}>New</span>}
          </div>

          <button
            type="button"
            onClick={() => setIsWishlisted(!isWishlisted)}
            aria-pressed={isWishlisted}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`pointer-events-auto relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-sm ${transitions.base} ${focusRing} ${
              isWishlisted
                ? 'border-brand-primary bg-brand-primary text-white'
                : 'border-slate-200 bg-white/95 text-slate-600 hover:border-brand-primary/40 hover:text-brand-primary'
            }`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <span className={`${badge.neutral} max-w-full`}>
          <span className="truncate">{categoryName}</span>
        </span>

        <h3 className={`${type.h3} mt-2 line-clamp-2`}>
          <Link
            to={`/products/${product._id}`}
            className={`rounded after:absolute after:inset-0 after:content-[''] group-hover:text-brand-secondary ${transitions.fast} ${focusRing}`}
          >
            {product.title}
          </Link>
        </h3>

        {product.description && (
          <p className={`${type.body} mt-1.5 line-clamp-2`}>{product.description}</p>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-baseline gap-1.5">
            {priceParts.prefix && (
              <span className="text-xs font-medium text-slate-500">{priceParts.prefix}</span>
            )}
            <span className={`${type.price} text-xl`}>{priceParts.primary}</span>
          </div>
          {priceParts.secondary && (
            <p className={`${type.muted} mt-0.5`}>{priceParts.secondary}</p>
          )}

          <DeliveryNote className="mt-2 text-xs text-slate-500" />

          <Link
            to={`/products/${product._id}`}
            className={`${button.outline} relative z-10 mt-3 w-full group-hover:border-brand-primary group-hover:text-brand-secondary`}
          >
            View details
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default Products;
