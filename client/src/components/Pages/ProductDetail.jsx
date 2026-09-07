import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Layers,
  Minus,
  Package,
  Phone,
  Plus,
  Share2,
  ShoppingCart,
  Star,
  User,
  X,
  ZoomIn
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import {
  DEFAULT_DISTRIBUTION_PERCENT,
  buildShopDistributionPreview,
  groupShopDistributionForDisplay,
  shopPoolForLine,
} from '../../utils/commissionDistributionPreview';
import { useFlatDeliveryCharge } from '../../utils/deliveryCharge';
import DeliveryNote from '../Shop/DeliveryNote';
import {
  badge,
  button,
  chip,
  focusRing,
  focusRingOnDark,
  formatAmount,
  formatMoney,
  getPricingSummary,
  resolvePrimaryImage,
  surface,
  transitions,
  type,
} from '../Shop/shopTokens';

const MAX_QUANTITY = 99;

/** Everything a focus trap should be able to land on. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const addLine = useCartStore((s) => s.addLine);
  const flatDeliveryCharge = useFlatDeliveryCharge();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImageIndex, setGalleryImageIndex] = useState(0);
  /* New: feeds the quantity field addLine already accepts. */
  const [quantity, setQuantity] = useState(1);

  const lightboxRef = useRef(null);
  const lightboxCloseRef = useRef(null);
  const galleryOpenerRef = useRef(null);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/products/${id}`);
      setProduct(response.data.data);
      const pricing = response.data.data.pricing;
      if (pricing && pricing.length > 0) {
        setSelectedPricing(pricing[0]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch product details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    setSelectedImageIndex(0);
    setGalleryImageIndex(0);
    setIsGalleryOpen(false);
    setError('');
    setQuantity(1);
  }, [id]);

  const closeGallery = useCallback(() => {
    setIsGalleryOpen(false);
  }, []);

  const nextGalleryImage = useCallback(() => {
    setGalleryImageIndex((prev) => {
      const len = product?.images?.length ?? 0;
      if (!len) return prev;
      return prev === len - 1 ? 0 : prev + 1;
    });
  }, [product?.images]);

  const prevGalleryImage = useCallback(() => {
    setGalleryImageIndex((prev) => {
      const len = product?.images?.length ?? 0;
      if (!len) return prev;
      return prev === 0 ? len - 1 : prev - 1;
    });
  }, [product?.images]);

  /* Keeps Tab and Shift+Tab inside the lightbox while it is open. */
  const trapFocus = useCallback((e) => {
    const root = lightboxRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll(FOCUSABLE)).filter(
      (el) => el.getAttribute('aria-hidden') !== 'true' && el.tabIndex !== -1
    );
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey) {
      if (active === first || !root.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last || !root.contains(active)) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      switch (e.key) {
        case 'Escape':
          closeGallery();
          break;
        case 'ArrowRight':
          nextGalleryImage();
          break;
        case 'ArrowLeft':
          prevGalleryImage();
          break;
        case 'Tab':
          trapFocus(e);
          break;
        default:
          break;
      }
    },
    [closeGallery, nextGalleryImage, prevGalleryImage, trapFocus]
  );

  useEffect(() => {
    if (!isGalleryOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isGalleryOpen, handleKeyDown]);

  /* Move focus into the dialog on open, hand it back to the opener on close. */
  useEffect(() => {
    if (!isGalleryOpen) return undefined;
    const opener = galleryOpenerRef.current;
    (lightboxCloseRef.current || lightboxRef.current)?.focus();
    return () => {
      if (opener && typeof opener.focus === 'function') opener.focus();
    };
  }, [isGalleryOpen]);

  const handleImageChange = (index) => {
    setSelectedImageIndex(index);
  };

  const nextImage = () => {
    if (product && product.images?.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product && product.images?.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  const handleContact = () => {
    toast.info('Contact options (phone, email, or form) can be wired here when ready.');
  };

  const decreaseQuantity = () => setQuantity((q) => Math.max(1, q - 1));
  const increaseQuantity = () => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1));

  const handleAddToCart = () => {
    if (!selectedPricing) {
      toast.error('Please select a package option first.');
      return;
    }
    if (!isAuthenticated) {
      toast.info('Please log in to add items to your cart.');
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    const img =
      product.images?.find((i) => i.isPrimary) || product.images?.[0];
    addLine({
      productId: product._id,
      title: product.title,
      imageUrl: img?.url || '',
      packageName: selectedPricing.packageName,
      unitPrice: Number(selectedPricing.price),
      deliveryChargePerUnit: Number(product.deliveryCharge) || 0,
      quantity
    });
    toast.success('Added to cart');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          text: product?.description,
          url: window.location.href
        });
      } catch (err) {
        if (err?.name !== 'AbortError') {
          try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard');
          } catch {
            toast.error('Could not share or copy link');
          }
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      } catch {
        toast.error('Could not copy link');
      }
    }
  };

  const openGallery = (index) => {
    galleryOpenerRef.current = document.activeElement;
    setGalleryImageIndex(index);
    setIsGalleryOpen(true);
  };

  const downloadImage = async () => {
    if (!product?.images?.[galleryImageIndex]) return;

    try {
      const response = await fetch(product.images[galleryImageIndex].url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${product.title}-image-${galleryImageIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (downloadErr) {
      console.error('Error downloading image:', downloadErr);
      toast.error('Could not download image');
    }
  };

  if (loading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div className={`${surface.page} flex items-center justify-center px-4 pt-16`}>
        <div className={`${surface.card} w-full max-w-md p-8 text-center`}>
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className={type.h2}>Product not found</h1>
          <p className={`${type.body} mt-2`}>
            {error || 'This product does not exist or was removed.'}
          </p>
          <Link to="/products" className={`${button.dark} mt-6`}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const imageCount = images.length;
  const categoryName = product.category?.name || product.category;

  const summary = getPricingSummary(product.pricing);
  const selectedPrice =
    selectedPricing && Number.isFinite(Number(selectedPricing.price))
      ? Number(selectedPricing.price)
      : null;
  const displayPrice = selectedPrice != null ? selectedPrice : summary.min;
  const subtotal = displayPrice != null ? displayPrice * quantity : null;

  // Reward pool is a percentage of what this package actually costs, so it
  // moves with the selected package and the quantity.
  const rawDistPercent = Number(product.distributionPercent);
  const distributionPercent = product.distributionEnabled
    ? (Number.isFinite(rawDistPercent) && rawDistPercent > 0
        ? rawDistPercent
        : DEFAULT_DISTRIBUTION_PERCENT)
    : 0;
  const distributionPoolPerUnit =
    distributionPercent > 0 && displayPrice != null
      ? shopPoolForLine(displayPrice, distributionPercent)
      : 0;
  const distributionPoolTotal =
    distributionPercent > 0 && subtotal != null
      ? shopPoolForLine(subtotal, distributionPercent)
      : 0;
  const distributionSplit =
    distributionPoolTotal > 0 ? buildShopDistributionPreview(distributionPoolTotal) : null;
  const distributionDisplayRows = distributionSplit
    ? groupShopDistributionForDisplay(distributionSplit)
    : [];

  const specEntries =
    product.specifications && typeof product.specifications === 'object'
      ? Object.entries(product.specifications)
      : [];

  return (
    <div className={`${surface.page} pb-28 pt-16 lg:pb-16`}>
      <ToastContainer
        position="top-center"
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
        autoClose={2500}
      />

      <div className={surface.shell}>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="pb-4 pt-5">
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
            <li>
              <Link
                to="/products"
                className={`rounded font-medium hover:text-brand-secondary ${transitions.fast} ${focusRing}`}
              >
                Shop
              </Link>
            </li>
            <li aria-hidden="true" className="text-slate-300">
              /
            </li>
            <li
              aria-current="page"
              className="min-w-0 max-w-[16rem] truncate font-semibold text-slate-800"
            >
              {product.title}
            </li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
          {/* ---------------------------- Left column ---------------------------- */}
          <div className="space-y-6 lg:col-span-7">
            {/* Gallery */}
            <section className={`${surface.card} overflow-hidden`} aria-label="Product images">
              {imageCount > 0 ? (
                <>
                  <div className="relative aspect-[4/3] bg-slate-50">
                    <button
                      type="button"
                      onClick={() => openGallery(selectedImageIndex)}
                      aria-label={`Open full-screen gallery for ${product.title}`}
                      className={`group absolute inset-0 flex h-full w-full items-center justify-center p-6 sm:p-8 ${focusRing}`}
                    >
                      <img
                        src={images[selectedImageIndex]?.url}
                        alt={`${product.title} — image ${selectedImageIndex + 1} of ${imageCount}`}
                        className={`max-h-full max-w-full object-contain group-hover:scale-[1.02] ${transitions.zoom}`}
                      />
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 opacity-0 shadow-sm group-hover:opacity-100 group-focus-visible:opacity-100 ${transitions.base}`}
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                        Expand
                      </span>
                    </button>

                    {imageCount > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            prevImage();
                          }}
                          aria-label="Previous image"
                          className={`absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:text-slate-900 ${transitions.base} ${focusRing}`}
                        >
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            nextImage();
                          }}
                          aria-label="Next image"
                          className={`absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:text-slate-900 ${transitions.base} ${focusRing}`}
                        >
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>

                  {imageCount > 1 && (
                    <div
                      role="group"
                      aria-label="Choose an image"
                      className="flex gap-2 overflow-x-auto border-t border-slate-200 p-3"
                    >
                      {images.map((image, index) => (
                        <button
                          type="button"
                          key={image.publicId || index}
                          onClick={() => handleImageChange(index)}
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            openGallery(index);
                          }}
                          aria-pressed={index === selectedImageIndex}
                          aria-label={`Show image ${index + 1} of ${imageCount}`}
                          title="Click to select · double-click for full screen"
                          className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${transitions.base} ${focusRing} ${
                            index === selectedImageIndex
                              ? 'border-brand-primary'
                              : 'border-slate-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={image.url}
                            alt={`${product.title} thumbnail ${index + 1}`}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 bg-slate-100">
                  <Package className="h-14 w-14 text-slate-300" aria-hidden="true" />
                  <p className={type.muted}>No images yet</p>
                </div>
              )}
            </section>

            {/* About */}
            {(product.description || (product.tags && product.tags.length > 0)) && (
              <section className={`${surface.card} p-5 sm:p-6`} aria-labelledby="about-heading">
                <h2 id="about-heading" className={type.h2}>
                  About this product
                </h2>
                {product.description && (
                  <p className={`${type.body} mt-3 max-w-prose text-[0.95rem]`}>
                    {product.description}
                  </p>
                )}
                {product.tags && product.tags.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <li key={index} className={chip.tag}>
                        #{tag}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* Specifications */}
            {specEntries.length > 0 && (
              <section className={`${surface.card} p-5 sm:p-6`} aria-labelledby="specs-heading">
                <h2 id="specs-heading" className={type.h2}>
                  Specifications
                </h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <tbody>
                      {specEntries.map(([key, value]) => (
                        <tr key={key} className="border-b border-slate-100 last:border-0">
                          <th
                            scope="row"
                            className="w-2/5 py-3 pr-4 text-left align-top font-medium text-slate-500"
                          >
                            {key}
                          </th>
                          <td className="py-3 align-top font-medium text-slate-900">
                            {String(value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Commission distribution preview */}
            {distributionPoolTotal > 0 && distributionDisplayRows.length > 0 && (
              <section className={`${surface.card} p-5 sm:p-6`} aria-labelledby="distribution-heading">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-secondary">
                    <Layers className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 id="distribution-heading" className={type.h2}>
                      Reward distribution
                    </h2>
                    <p className={`${type.muted} mt-0.5`}>
                      Half comes back to you
                    </p>
                  </div>
                </div>

                <p className={`${type.body} mt-4`}>
                  When your order is <strong className="font-semibold text-slate-900">paid and
                  confirmed</strong>, {distributionPercent}% of what you pay &mdash;{' '}
                  <strong className="font-semibold text-slate-900">
                    {formatMoney(distributionPoolTotal, 'INR', 2)}
                  </strong>{' '}
                  &mdash; funds this reward pool, and{' '}
                  <strong className="font-semibold text-slate-900">
                    {formatMoney(distributionSplit.self.amount, 'INR', 2)} of it lands in your own
                    wallet
                  </strong>. Delivery charges are separate.
                </p>

                {quantity > 1 && (
                  <p className={`${surface.inset} mt-3 px-3.5 py-2.5 text-sm text-slate-700`}>
                    That is{' '}
                    <strong className="font-semibold tabular-nums text-slate-900">
                      {formatMoney(distributionPoolPerUnit, 'INR', 2)}
                    </strong>{' '}
                    per unit, across {quantity} units.
                  </p>
                )}

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <caption className="sr-only">
                      Reward pool split, for this order
                    </caption>
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th scope="col" className={`${type.eyebrow} py-2 pr-4 text-left`}>
                          Goes to
                        </th>
                        <th scope="col" className={`${type.eyebrow} py-2 pr-4 text-left`}>
                          Share
                        </th>
                        <th scope="col" className={`${type.eyebrow} py-2 text-right`}>
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {distributionDisplayRows.map((row) => (
                        <tr key={row.key} className="border-b border-slate-100">
                          <th
                            scope="row"
                            className="whitespace-nowrap py-2.5 pr-4 text-left font-medium text-slate-900"
                          >
                            {row.label}
                          </th>
                          <td className="whitespace-nowrap py-2.5 pr-4 text-slate-500">
                            {row.percentageLabel}
                          </td>
                          <td className="whitespace-nowrap py-2.5 text-right font-semibold tabular-nums text-slate-900">
                            {formatMoney(row.amount, 'INR', 2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th scope="row" colSpan={2} className="py-3 pr-4 text-left font-semibold text-slate-900">
                          Total pool
                        </th>
                        <td className="py-3 text-right font-bold tabular-nums text-brand-secondary">
                          {formatMoney(distributionPoolTotal, 'INR', 2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            )}
          </div>

          {/* ---------------------------- Right column --------------------------- */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:px-1 lg:py-1">
              <div className="space-y-5">
                <section className={`${surface.card} p-5 sm:p-6`}>
                  <div className="flex flex-wrap items-center gap-2">
                    {categoryName && <span className={badge.neutral}>{categoryName}</span>}
                    {product.featured && (
                      <span className={badge.featured}>
                        <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                        Featured
                      </span>
                    )}
                  </div>

                  <h1 className={`${type.h1} mt-3`}>{product.title}</h1>

                  {displayPrice != null && (
                    <div className="mt-4">
                      <div className="flex flex-wrap items-baseline gap-2">
                        {selectedPrice == null && (
                          <span className="text-sm font-medium text-slate-500">from</span>
                        )}
                        <span className="text-3xl font-bold tabular-nums text-slate-900">
                          {formatMoney(displayPrice, summary.currency)}
                        </span>
                        {selectedPricing?.packageName && (
                          <span className={badge.accent}>{selectedPricing.packageName}</span>
                        )}
                      </div>
                      <DeliveryNote
                        amount={flatDeliveryCharge}
                        className={`${type.body} mt-2 text-sm`}
                      />
                    </div>
                  )}
                </section>

                {/* Package selector */}
                {product.pricing && product.pricing.length > 0 && (
                  <section className={`${surface.card} p-5 sm:p-6`}>
                    <h2 className={type.h2}>Choose a package</h2>
                    <p className={`${type.muted} mt-1`}>
                      {product.pricing.length} option{product.pricing.length !== 1 ? 's' : ''} available
                    </p>

                    <div
                      role="radiogroup"
                      aria-label="Package options"
                      className="mt-4 space-y-3"
                    >
                      {product.pricing.map((option, index) => (
                        <PackageOption
                          key={index}
                          option={option}
                          selected={selectedPricing === option}
                          onSelect={() => setSelectedPricing(option)}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Buy box */}
                <section className={`${surface.card} p-5 sm:p-6`} aria-label="Add to cart">
                  <div className="flex flex-wrap items-center gap-3">
                    <QuantityStepper
                      quantity={quantity}
                      onDecrease={decreaseQuantity}
                      onIncrease={increaseQuantity}
                      max={MAX_QUANTITY}
                    />
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className={`${button.primary} min-w-0 flex-1`}
                    >
                      <ShoppingCart className="h-5 w-5 shrink-0" aria-hidden="true" />
                      Add to cart
                    </button>
                  </div>

                  {subtotal != null && (
                    <dl className={`${surface.inset} mt-4 divide-y divide-slate-200 px-4 text-sm`}>
                      <div className="flex items-center justify-between gap-3 py-2.5">
                        <dt className="text-slate-600">
                          {formatMoney(displayPrice, summary.currency)} × {quantity}
                        </dt>
                        <dd className="font-semibold tabular-nums text-slate-900">
                          {formatMoney(subtotal, summary.currency)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-2.5">
                        <dt className="min-w-0 text-slate-600">
                          Delivery
                          <span className="block text-xs text-slate-500">
                            Flat, charged once per order
                          </span>
                        </dt>
                        <dd className="font-semibold tabular-nums text-slate-900">
                          {formatMoney(flatDeliveryCharge)}
                        </dd>
                      </div>
                    </dl>
                  )}

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={handleContact}
                      className={`${button.outline} px-2 text-xs sm:text-sm`}
                    >
                      <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Contact
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsWishlisted(!isWishlisted)}
                      aria-pressed={isWishlisted}
                      className={`${button.outline} px-2 text-xs sm:text-sm ${
                        isWishlisted ? 'border-brand-primary text-brand-secondary' : ''
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 shrink-0 ${isWishlisted ? 'fill-current' : ''}`}
                        aria-hidden="true"
                      />
                      {isWishlisted ? 'Saved' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={handleShare}
                      className={`${button.outline} px-2 text-xs sm:text-sm`}
                    >
                      <Share2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Share
                    </button>
                  </div>
                </section>

                {/* Details */}
                <section className={`${surface.card} p-5 sm:p-6`} aria-labelledby="details-heading">
                  <h2 id="details-heading" className={type.h2}>
                    Details
                  </h2>
                  <dl className="mt-4 space-y-3 text-sm">
                    <DetailRow icon={User} label="Listed by">
                      {product.createdBy?.name || 'Admin'}
                    </DetailRow>
                    <DetailRow icon={Calendar} label="Listed on">
                      {new Date(product.createdAt).toLocaleDateString(undefined, {
                        dateStyle: 'long'
                      })}
                    </DetailRow>
                    {product.updatedAt && product.updatedAt !== product.createdAt && (
                      <DetailRow icon={Calendar} label="Last updated">
                        {new Date(product.updatedAt).toLocaleDateString(undefined, {
                          dateStyle: 'long'
                        })}
                      </DetailRow>
                    )}
                    <DetailRow icon={Package} label="Photos">
                      {imageCount} photo{imageCount !== 1 ? 's' : ''}
                    </DetailRow>
                  </dl>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky purchase bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.25)] lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <QuantityStepper
            quantity={quantity}
            onDecrease={decreaseQuantity}
            onIncrease={increaseQuantity}
            max={MAX_QUANTITY}
            compact
          />
          <button
            type="button"
            onClick={handleAddToCart}
            className={`${button.primary} min-w-0 flex-1 px-3 py-2.5`}
          >
            <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">
              Add
              {subtotal != null && (
                <span className="tabular-nums"> · {formatMoney(subtotal, summary.currency)}</span>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Full-screen lightbox */}
      {isGalleryOpen && imageCount > 0 && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${product.title} image gallery`}
          tabIndex={-1}
          className="fixed inset-0 z-[100] flex flex-col focus:outline-none"
        >
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={closeGallery}
            className="absolute inset-0 h-full w-full cursor-default bg-slate-950/95"
          />

          <div className="relative z-10 flex h-full min-h-0 flex-col p-3 sm:p-6">
            <div className="flex shrink-0 items-center justify-between gap-3 pb-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{product.title}</p>
                <p className="text-xs tabular-nums text-slate-400">
                  {galleryImageIndex + 1} / {imageCount}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadImage();
                  }}
                  aria-label="Download this image"
                  className={`flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20 ${transitions.base} ${focusRingOnDark}`}
                >
                  <Download className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  ref={lightboxCloseRef}
                  type="button"
                  onClick={closeGallery}
                  aria-label="Close gallery"
                  className={`flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20 ${transitions.base} ${focusRingOnDark}`}
                >
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              {imageCount > 1 && (
                <button
                  type="button"
                  onClick={prevGalleryImage}
                  aria-label="Previous image"
                  className={`absolute left-0 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/20 sm:left-2 ${transitions.base} ${focusRingOnDark}`}
                >
                  <ChevronLeft className="h-7 w-7" aria-hidden="true" />
                </button>
              )}

              <div className="relative mx-auto flex max-h-full max-w-full items-center justify-center px-14 sm:px-16">
                <img
                  src={images[galleryImageIndex]?.url}
                  alt={`${product.title} — image ${galleryImageIndex + 1} of ${imageCount}`}
                  className="max-h-[min(70vh,100%)] max-w-full object-contain"
                />
              </div>

              {imageCount > 1 && (
                <button
                  type="button"
                  onClick={nextGalleryImage}
                  aria-label="Next image"
                  className={`absolute right-0 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/20 sm:right-2 ${transitions.base} ${focusRingOnDark}`}
                >
                  <ChevronRight className="h-7 w-7" aria-hidden="true" />
                </button>
              )}
            </div>

            {imageCount > 1 && (
              <div
                role="group"
                aria-label="Choose an image"
                className="flex shrink-0 justify-start gap-2 overflow-x-auto py-4 sm:justify-center"
              >
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={image.publicId || index}
                    onClick={() => setGalleryImageIndex(index)}
                    aria-pressed={index === galleryImageIndex}
                    aria-label={`Show image ${index + 1} of ${imageCount}`}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2 sm:h-16 sm:w-16 ${transitions.base} ${focusRingOnDark} ${
                      index === galleryImageIndex
                        ? 'ring-brand-primary'
                        : 'opacity-60 ring-transparent hover:opacity-100'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${product.title} thumbnail ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */

function PackageOption({ option, selected, onSelect }) {
  const price = Number(option.price);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`w-full rounded-2xl border-2 p-4 text-left ${transitions.base} ${focusRing} ${
        selected
          ? 'border-brand-primary bg-brand-primary/5'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${transitions.base} ${
            selected ? 'border-brand-primary bg-brand-primary text-white' : 'border-slate-300 bg-white'
          }`}
        >
          {selected && <Check className="h-3 w-3" strokeWidth={3} />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900">{option.packageName}</span>
            {option.isPopular && <span className={badge.popular}>Popular</span>}
          </div>

          {option.features && option.features.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {option.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span className="min-w-0">{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg font-bold tabular-nums text-slate-900">
            {Number.isFinite(price) ? formatMoney(price, option.currency) : option.price}
          </p>
        </div>
      </div>
    </button>
  );
}

function QuantityStepper({ quantity, onDecrease, onIncrease, max, compact = false }) {
  const size = compact ? 'h-10 w-9' : 'h-11 w-10';
  return (
    <div className="inline-flex shrink-0 items-center rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onDecrease}
        disabled={quantity <= 1}
        aria-label="Decrease quantity"
        className={`${size} flex items-center justify-center rounded-l-xl text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 ${transitions.base} ${focusRing}`}
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <span
        aria-live="polite"
        className={`${compact ? 'w-7' : 'w-9'} text-center text-sm font-semibold tabular-nums text-slate-900`}
      >
        <span className="sr-only">Quantity: </span>
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={quantity >= max}
        aria-label="Increase quantity"
        className={`${size} flex items-center justify-center rounded-r-xl text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 ${transitions.base} ${focusRing}`}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="truncate font-medium text-slate-900">{children}</dd>
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className={`${surface.page} pb-28 pt-16 lg:pb-16`}>
      <p className="sr-only" role="status">
        Loading product
      </p>
      <div className={surface.shell} aria-hidden="true">
        <div className="py-5">
          <div className="h-3 w-48 rounded bg-slate-200" />
        </div>
        <div className="grid animate-pulse gap-8 motion-reduce:animate-none lg:grid-cols-12 lg:gap-10">
          <div className="space-y-6 lg:col-span-7">
            <div className={`${surface.card} overflow-hidden`}>
              <div className="aspect-[4/3] bg-slate-200" />
              <div className="flex gap-2 border-t border-slate-200 p-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="h-16 w-16 shrink-0 rounded-xl bg-slate-200" />
                ))}
              </div>
            </div>
            <div className={`${surface.card} space-y-3 p-6`}>
              <div className="h-5 w-40 rounded bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-100" />
              <div className="h-3 w-5/6 rounded bg-slate-100" />
              <div className="h-3 w-4/6 rounded bg-slate-100" />
            </div>
          </div>
          <div className="space-y-5 lg:col-span-5">
            <div className={`${surface.card} space-y-3 p-6`}>
              <div className="h-5 w-24 rounded-full bg-slate-100" />
              <div className="h-7 w-3/4 rounded bg-slate-200" />
              <div className="h-9 w-40 rounded bg-slate-200" />
              <div className="h-3 w-56 rounded bg-slate-100" />
            </div>
            <div className={`${surface.card} space-y-3 p-6`}>
              <div className="h-5 w-40 rounded bg-slate-200" />
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="h-20 w-full rounded-2xl bg-slate-100" />
              ))}
            </div>
            <div className={`${surface.card} p-6`}>
              <div className="h-11 w-full rounded-xl bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
