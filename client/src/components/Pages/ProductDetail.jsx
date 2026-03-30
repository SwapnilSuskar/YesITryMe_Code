import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Layers,
  Loader2,
  Package,
  Phone,
  Share2,
  ShoppingCart,
  Sparkles,
  Star,
  User,
  X,
  ZoomIn
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import {
  groupDistributionForDisplay,
  scaleDistributionPoolToLevels,
} from '../../utils/commissionDistributionPreview';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const addLine = useCartStore((s) => s.addLine);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImageIndex, setGalleryImageIndex] = useState(0);

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
        default:
          break;
      }
    },
    [closeGallery, nextGalleryImage, prevGalleryImage]
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
      quantity: 1
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-16 flex items-center justify-center px-4">
        <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 px-12 py-14 shadow-[0_18px_50px_-22px_rgba(251,146,60,0.45)] backdrop-blur-xl">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-orange-200/50 to-pink-200/40 blur-2xl" />
          <div className="relative mx-auto w-12 h-12">
            <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
          </div>
          <p className="relative mt-5 text-center text-sm font-semibold text-gray-600">Loading product…</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-16 flex items-center justify-center px-4">
        <div className="relative max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-10 text-center shadow-[0_18px_50px_-22px_rgba(251,146,60,0.35)] backdrop-blur-xl">
          <div className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full bg-orange-200/40 blur-2xl" />
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-200/80">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="relative text-xl font-extrabold text-gray-900">Product not found</h2>
          <p className="relative mt-2 text-sm leading-relaxed text-gray-600">
            {error || 'This product does not exist or was removed.'}
          </p>
          <Link
            to="/products"
            className="relative mt-8 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:opacity-95"
          >
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  const imageCount = product.images?.length ?? 0;
  const prices = (product.pricing || [])
    .map((p) => Number(p.price))
    .filter((n) => !Number.isNaN(n) && Number.isFinite(n));
  const fromPrice = prices.length ? Math.min(...prices) : null;
  const displayPrice =
    selectedPricing && !Number.isNaN(Number(selectedPricing.price))
      ? Number(selectedPricing.price)
      : fromPrice;

  const nDist = Number(product.distributionRupeesPerUnit);
  const distributionPoolPerUnit =
    product.distributionEnabled && Number.isFinite(nDist) && nDist > 0
      ? nDist
      : 0;
  const distributionDisplayRows =
    distributionPoolPerUnit <= 0
      ? []
      : groupDistributionForDisplay(
          scaleDistributionPoolToLevels(distributionPoolPerUnit)
        );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-16 pb-28 text-gray-900 lg:pb-14">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <ToastContainer
          position="top-center"
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="colored"
          autoClose={2500}
        />

        <header className="flex flex-wrap items-center justify-between gap-4 pb-8 pt-2">
          <Link
            to="/products"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-orange-700"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/80 bg-white shadow-sm transition group-hover:border-orange-200 group-hover:shadow-md">
              <ArrowLeft className="h-4 w-4" />
            </span>
            <span>Products</span>
          </Link>
          <div className="flex items-center gap-2">
            {product.featured && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-900 shadow-sm">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                Featured
              </span>
            )}
            <span className="hidden rounded-full border border-gray-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-gray-500 shadow-sm sm:inline-block">
              {product.category?.name || product.category}
            </span>
          </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 lg:items-start">
          {/* Gallery */}
          <div className="lg:col-span-7">
            <div className="relative">
              <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-orange-400/25 via-pink-300/20 to-purple-400/25 blur-xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_18px_50px_-22px_rgba(251,146,60,0.35)] backdrop-blur-xl">
                {product.images && product.images.length > 0 ? (
                  <>
                    <div
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openGallery(selectedImageIndex);
                        }
                      }}
                      onClick={() => openGallery(selectedImageIndex)}
                      className="group relative aspect-[4/3] cursor-pointer sm:aspect-[5/4] lg:aspect-[4/3]"
                    >
                      <div
                        className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_40%,rgba(255,237,213,0.85),rgba(255,255,255,0.4)_55%,transparent)]"
                        aria-hidden
                      />
                      <div className="relative flex h-full w-full items-center justify-center p-6 sm:p-10">
                        <img
                          src={product.images[selectedImageIndex]?.url}
                          alt={product.title}
                          className="max-h-full max-w-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition duration-500 ease-out group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-900/0 transition duration-300 group-hover:bg-gray-900/10">
                        <span className="flex translate-y-2 items-center gap-2 rounded-full border border-white/30 bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-800 opacity-0 shadow-lg backdrop-blur-sm transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          <ZoomIn className="h-4 w-4" />
                          Fullscreen
                        </span>
                      </div>
                      {product.images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              prevImage();
                            }}
                            className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200/90 bg-white/95 text-gray-800 shadow-lg backdrop-blur transition hover:scale-105 hover:border-orange-200 active:scale-95"
                            aria-label="Previous image"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              nextImage();
                            }}
                            className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200/90 bg-white/95 text-gray-800 shadow-lg backdrop-blur transition hover:scale-105 hover:border-orange-200 active:scale-95"
                            aria-label="Next image"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>

                    {product.images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto border-t border-orange-100/60 bg-gradient-to-r from-orange-50/40 via-white to-pink-50/30 px-4 py-3 sm:px-5">
                        {product.images.map((image, index) => (
                          <button
                            type="button"
                            key={index}
                            onClick={() => handleImageChange(index)}
                            onDoubleClick={(e) => {
                              e.preventDefault();
                              openGallery(index);
                            }}
                            title="Tap to select · double-tap for fullscreen"
                            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${index === selectedImageIndex
                              ? 'border-orange-500 shadow-md shadow-orange-500/20 ring-2 ring-orange-400/30'
                              : 'border-transparent opacity-75 hover:opacity-100 hover:ring-2 hover:ring-gray-200'
                              }`}
                          >
                            <img
                              src={image.url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 bg-gradient-to-br from-gray-100 to-orange-50/50">
                    <Package className="h-16 w-16 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">No images yet</p>
                  </div>
                )}
              </div>
            </div>

            {(product.description || (product.tags && product.tags.length > 0)) && (
              <div className="mt-6 rounded-3xl border border-white/60 bg-white/70 p-5 shadow-[0_12px_40px_-18px_rgba(251,146,60,0.2)] backdrop-blur-xl sm:p-6">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600/80">About this product</h2>
                {product.description && (
                  <p className="mt-3 max-w-prose text-base leading-relaxed text-gray-600 sm:text-[1.05rem]">
                    {product.description}
                  </p>
                )}
                {product.tags && product.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="rounded-lg border border-orange-100/80 bg-gradient-to-r from-orange-50/80 to-pink-50/50 px-2.5 py-1 text-xs font-semibold text-gray-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Copy + purchase */}
          <div className="lg:col-span-5 lg:sticky lg:top-20">
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/60 bg-gradient-to-r from-orange-100 to-pink-100 px-3 py-1.5 text-xs font-extrabold text-orange-800">
                  <Package className="h-3.5 w-3.5" />
                  Product detail
                </div>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600/90">
                  {product.category?.name || product.category}
                </p>
                <h1 className="mt-2 bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-3xl font-extrabold leading-[1.15] tracking-tight text-transparent sm:text-4xl">
                  {product.title}
                </h1>
                {displayPrice != null && (
                  <div className="mt-5 flex flex-wrap items-end gap-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-gray-500">From</span>
                      <span className="bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-4xl font-black tabular-nums text-transparent sm:text-5xl">
                        ₹{displayPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                    {selectedPricing?.packageName && (
                      <span className="mb-1 rounded-lg border border-orange-200/60 bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-700">
                        {selectedPricing.packageName}
                      </span>
                    )}
                  </div>
                )}
                {Number(product.deliveryCharge) > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    Delivery:{' '}
                    <span className="font-semibold text-gray-800">
                      ₹{Number(product.deliveryCharge).toLocaleString('en-IN')} (flat)
                    </span>{' '}
                    (set by admin; no GST at checkout)
                  </p>
                )}
              </div>

              {product.pricing && product.pricing.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-orange-500" />
                    <h2 className="text-lg font-bold text-gray-900">Choose a package</h2>
                  </div>
                  <ul className="space-y-3">
                    {product.pricing.map((option, index) => {
                      const selected = selectedPricing === option;
                      return (
                        <li key={index}>
                          <button
                            type="button"
                            onClick={() => setSelectedPricing(option)}
                            className={`w-full rounded-2xl border-2 p-4 text-left transition-all duration-200 ${selected
                              ? 'border-orange-500 bg-gradient-to-br from-orange-50/90 via-white to-pink-50/50 shadow-[0_12px_40px_-12px_rgba(234,88,12,0.35)]'
                              : 'border-orange-100/80 bg-white/80 hover:border-orange-300 hover:shadow-md'
                              }`}
                          >
                            <div className="flex gap-4">
                              <div
                                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${selected
                                  ? 'border-orange-500 bg-orange-500 text-white'
                                  : 'border-gray-300 bg-white'
                                  }`}
                              >
                                {selected && <CheckCircle className="h-4 w-4" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-gray-900">{option.packageName}</span>
                                  {option.isPopular && (
                                    <span className="rounded-md bg-gradient-to-r from-orange-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                      Popular
                                    </span>
                                  )}
                                </div>
                                {option.features && option.features.length > 0 && (
                                  <ul className="mt-2 space-y-1.5">
                                    {option.features.map((feature, featureIndex) => (
                                      <li
                                        key={featureIndex}
                                        className="flex items-start gap-2 text-sm text-gray-600"
                                      >
                                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                        <span>{feature}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-2xl font-black tabular-nums text-gray-900">
                                  ₹{option.price}
                                </p>
                                {option.currency && (
                                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                                    {option.currency}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {distributionPoolPerUnit > 0 && distributionDisplayRows.length > 0 && (
                <div className="rounded-3xl border border-orange-200/80 bg-gradient-to-br from-orange-50/90 via-white to-pink-50/40 p-5 shadow-sm backdrop-blur-xl">
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-orange-700">
                    <Layers className="h-5 w-5 text-orange-500" />
                    Commission distribution (120 levels)
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    When your order is <strong>paid and confirmed</strong>,{' '}
                    <strong>
                      ₹
                      {distributionPoolPerUnit.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      per unit
                    </strong>{' '}
                    in your cart line (× quantity) funds this reward pool. Delivery charges are separate.
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {distributionDisplayRows.map((row) => (
                      <div
                        key={row.key}
                        className="flex justify-between gap-3 rounded-xl border border-orange-100/80 bg-white/90 px-3 py-2.5 text-sm"
                      >
                        <span className="text-gray-700">
                          <span className="font-semibold text-gray-900">{row.label}</span>
                          <span className="text-gray-500"> ({row.percentageLabel})</span>
                        </span>
                        <span className="font-bold tabular-nums text-orange-700">
                          ₹
                          {row.amount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50/60 px-3 py-2.5 text-sm font-bold text-orange-900 sm:col-span-2">
                      <span>Total pool (per unit)</span>
                      <span className="tabular-nums">
                        ₹
                        {distributionPoolPerUnit.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-orange-600/90">
                    Specifications
                  </h2>
                  <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between gap-3 rounded-xl border border-orange-100/50 bg-gradient-to-br from-orange-50/40 to-white px-3 py-2.5 text-sm"
                      >
                        <dt className="font-semibold text-gray-700">{key}</dt>
                        <dd className="text-right text-gray-600">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div className="hidden gap-3 lg:grid lg:grid-cols-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/30 transition hover:opacity-95 active:scale-[0.99]"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to cart
                </button>
                <button
                  type="button"
                  onClick={handleContact}
                  className="flex items-center justify-center gap-2 rounded-2xl border-2 border-orange-100/90 bg-white py-3.5 text-sm font-bold text-gray-800 shadow-sm transition hover:border-orange-200 hover:bg-orange-50/50"
                >
                  <Phone className="h-5 w-5 shrink-0 text-orange-600" />
                  Contact
                </button>
                <button
                  type="button"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3.5 text-sm font-bold transition ${isWishlisted
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-orange-100/90 bg-white text-gray-800 hover:bg-orange-50/50'
                    }`}
                >
                  <Heart
                    className={`h-5 w-5 shrink-0 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-500'}`}
                  />
                  {isWishlisted ? 'Saved' : 'Wishlist'}
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="col-span-2 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-orange-200/80 bg-orange-50/30 py-3 text-sm font-semibold text-gray-700 transition hover:border-orange-400 hover:bg-orange-50/60"
                >
                  <Share2 className="h-4 w-4" />
                  Share this product
                </button>
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/70 p-5 text-sm shadow-sm backdrop-blur-xl">
                <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600/80">Details</h2>
                <ul className="mt-4 space-y-3 text-gray-600">
                  <li className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                      <User className="h-4 w-4" />
                    </span>
                    <span>
                      Listed by{' '}
                      <strong className="text-gray-900">
                        {product.createdBy?.name || 'Admin'}
                      </strong>
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <span>{new Date(product.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                  </li>
                  {product.updatedAt && product.updatedAt !== product.createdAt && (
                    <li className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                        <Calendar className="h-4 w-4" />
                      </span>
                      <span>
                        Updated{' '}
                        {new Date(product.updatedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                      </span>
                    </li>
                  )}
                  <li className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                      <Package className="h-4 w-4" />
                    </span>
                    <span>
                      {imageCount} photo{imageCount !== 1 ? 's' : ''}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-orange-100/80 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(251,146,60,0.12)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          {displayPrice != null && (
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total</p>
              <p className="truncate text-xl font-black tabular-nums text-gray-900">
                ₹{displayPrice.toLocaleString('en-IN')}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30"
          >
            <ShoppingCart className="h-5 w-5" />
            Add
          </button>
        </div>
        <div className="mx-auto mt-3 flex max-w-lg justify-center gap-2">
          <button
            type="button"
            onClick={handleContact}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-100/90 bg-white text-gray-700"
            aria-label="Contact"
          >
            <Phone className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setIsWishlisted(!isWishlisted)}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border ${isWishlisted ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-orange-100/90 bg-white text-gray-600'
              }`}
            aria-label="Wishlist"
          >
            <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-100/90 bg-white text-gray-600"
            aria-label="Share"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Gallery lightbox */}
      {isGalleryOpen && product?.images?.length > 0 && (
        <div className="fixed inset-0 z-[100] flex flex-col">
          <button
            type="button"
            aria-label="Close gallery"
            className="absolute inset-0 bg-gray-950/92 backdrop-blur-md"
            onClick={closeGallery}
          />
          <div className="relative z-10 flex h-full min-h-0 flex-col p-3 sm:p-6">
            <div className="flex shrink-0 items-center justify-between gap-3 pb-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white drop-shadow-md">{product.title}</p>
                <p className="text-xs text-gray-400">
                  {galleryImageIndex + 1} / {product.images.length}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadImage();
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20"
                  aria-label="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={closeGallery}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20"
                  aria-label="Close"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              {product.images.length > 1 && (
                <button
                  type="button"
                  onClick={prevGalleryImage}
                  className="absolute left-0 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/25 transition hover:bg-white/20 sm:left-2"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>
              )}
              <div
                className="relative mx-auto flex max-h-full max-w-full items-center justify-center rounded-2xl bg-white/5 p-2 ring-1 ring-white/10 sm:p-4"
                onClick={(e) => e.stopPropagation()}
                role="presentation"
              >
                <img
                  src={product.images[galleryImageIndex]?.url}
                  alt=""
                  className="max-h-[min(70vh,100%)] max-w-full object-contain"
                />
              </div>
              {product.images.length > 1 && (
                <button
                  type="button"
                  onClick={nextGalleryImage}
                  className="absolute right-0 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/25 transition hover:bg-white/20 sm:right-2"
                  aria-label="Next"
                >
                  <ChevronRight className="h-7 w-7" />
                </button>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="flex shrink-0 justify-center gap-2 overflow-x-auto py-4">
                {product.images.map((image, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => setGalleryImageIndex(index)}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2 transition sm:h-16 sm:w-16 ${index === galleryImageIndex
                      ? 'ring-orange-400'
                      : 'ring-transparent opacity-60 hover:opacity-100'
                      }`}
                  >
                    <img src={image.url} alt="" className="h-full w-full object-cover" />
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

export default ProductDetail;
