import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Loader2,
  Package,
  Phone,
  Share2,
  ShoppingCart,
  Star,
  User,
  X,
  ZoomIn
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../config/api';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImageIndex, setGalleryImageIndex] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (isGalleryOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isGalleryOpen]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/products/${id}`);
      setProduct(response.data.data);
      if (response.data.data.pricing.length > 0) {
        setSelectedPricing(response.data.data.pricing[0]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch product details');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (index) => {
    setSelectedImageIndex(index);
  };

  const nextImage = () => {
    if (product && product.images.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product && product.images.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  const handleContact = () => {
    // You can implement contact functionality here
    // For now, we'll just show an alert
    alert('Contact functionality will be implemented here. You can add phone, email, or contact form.');
  };

  const handleBuyNow = () => {
    // Navigate to super-packages route with product info
    navigate('/super-packages', {
      state: {
        productInfo: {
          _id: product._id,
          title: product.title,
          category: product.category,
          description: product.description,
          images: product.images,
          selectedPricing: selectedPricing
        }
      }
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.title,
        text: product?.description,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const openGallery = (index) => {
    setGalleryImageIndex(index);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
  };

  const nextGalleryImage = () => {
    if (product && product.images.length > 0) {
      setGalleryImageIndex((prev) =>
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevGalleryImage = () => {
    if (product && product.images.length > 0) {
      setGalleryImageIndex((prev) =>
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  const handleKeyDown = (e) => {
    if (!isGalleryOpen) return;

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
  };

  const downloadImage = async () => {
    if (!product?.images[galleryImageIndex]) return;

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
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The product you are looking for does not exist.'}</p>
          <Link
            to="/products"
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-12 px-4 mt-12">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            to="/products"
            className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <>
                  <div className="relative h-96 bg-white cursor-pointer group rounded-2xl shadow-lg border border-gray-200 overflow-hidden" onClick={() => openGallery(selectedImageIndex)}>
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <img
                        src={product.images[selectedImageIndex]?.url}
                        alt={product.title}
                        className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105 rounded-xl"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Navigation arrows */}
                    {product.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail images */}
                  {product.images.length > 1 && (
                    <div className="p-4 flex gap-2 overflow-x-auto">
                      {product.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => handleImageChange(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors cursor-pointer group ${index === selectedImageIndex
                            ? 'border-orange-500'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <img
                            src={image.url}
                            alt={`${product.title} ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div
                            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              openGallery(index);
                            }}
                          >
                            <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-96 bg-gray-100 flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {product.category?.name || product.category}
                </span>
                {product.featured && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Featured
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.title}</h1>

              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing Options */}
            {product.pricing && product.pricing.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Pricing Options</h3>
                <div className="space-y-3">
                  {product.pricing.map((option, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedPricing === option
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                      onClick={() => setSelectedPricing(option)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800">{option.packageName}</h4>
                          {option.features && option.features.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {option.features.map((feature, featureIndex) => (
                                <li key={featureIndex} className="flex items-center gap-2 text-sm text-gray-600">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-500">
                            ₹{option.price}
                          </div>
                          <div className="text-sm text-gray-500">{option.currency}</div>
                          {option.isPopular && (
                            <span className="inline-block mt-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">{key}</span>
                      <span className="text-gray-600">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleBuyNow}
                className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Buy Now
              </button>

              <button
                onClick={handleContact}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Contact Seller
              </button>

              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${isWishlisted
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
              </button>

              <button
                onClick={handleShare}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>
            {/* Product Meta */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Listed by: {product.createdBy?.name || 'Admin'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Listed on: {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {product.updatedAt && product.updatedAt !== product.createdAt && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      Updated on: {new Date(product.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {product.images.length} image{product.images.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      {isGalleryOpen && product && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={closeGallery}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Download button */}
            <button
              onClick={downloadImage}
              className="absolute top-4 right-16 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
            >
              <Download className="w-6 h-6" />
            </button>

            {/* Image counter */}
            <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
              {galleryImageIndex + 1} / {product.images.length}
            </div>

            {/* Main image */}
            <div className="relative flex items-center justify-center bg-white min-w-[300px] min-h-[200px] max-w-[90vw] max-h-[70vh] p-4 rounded-2xl shadow-2xl border border-gray-200">
              <img
                src={product.images[galleryImageIndex]?.url}
                alt={`${product.title} - Image ${galleryImageIndex + 1}`}
                className="object-contain max-w-full max-h-[60vh] rounded-xl drop-shadow-lg"
                style={{ background: 'white' }}
              />
            </div>

            {/* Navigation arrows */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={prevGalleryImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-4 rounded-full transition-all duration-300 hover:scale-110"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextGalleryImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-4 rounded-full transition-all duration-300 hover:scale-110"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Thumbnail strip */}
            {product.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black bg-opacity-50 p-2 rounded-lg">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setGalleryImageIndex(index)}
                    className={`w-12 h-12 rounded overflow-hidden border-2 transition-all duration-300 ${index === galleryImageIndex
                      ? 'border-orange-500 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                      }`}
                  >
                    <img
                      src={image.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Click outside to close */}
            <div
              className="absolute inset-0 -z-10"
              onClick={closeGallery}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail; 