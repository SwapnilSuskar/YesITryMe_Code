import { Download, Image as ImageIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.auth.activeGalleryImages);
      if (response.ok) {
        const data = await response.json();
        setImages(data.images);
      }
    } catch (error) {
      console.error('Error fetching gallery images:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async (imageUrl, imageTitle) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);

      // Get file extension from URL or default to .jpg
      const urlParts = imageUrl.split('.');
      const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1].split('?')[0] : 'jpg';

      // Set filename with original title and extension
      const filename = `${imageTitle.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  const categories = ['all', ...new Set(images.map(img => img.category))];

  const filteredImages = selectedCategory === 'all'
    ? images
    : images.filter(img => img.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8 px-4 mt-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
            <ImageIcon className="text-orange-500" size={40} />
            Gallery
          </h1>
          <p className="text-gray-600 text-lg">Inspiring images from our community</p>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-lg p-2 flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-md font-medium transition-all whitespace-nowrap ${selectedCategory === category
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-orange-500 hover:bg-orange-50'
                  }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Images Grid */}
        {filteredImages.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No images found</p>
            <p className="text-gray-400">Check back later for new gallery content</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredImages.map((image) => (
              <div
                key={image._id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
                onClick={() => setSelectedImage(image)}
              >
                <div className="relative">
                  <img
                    src={image.imageUrl}
                    alt={image.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="inline-block bg-orange-500 text-white text-xs px-2 py-1 rounded">
                      {image.category}
                    </span>
                  </div>
                  {/* Download button overlay */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(image.imageUrl, image.title);
                      }}
                      className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                      title="Download image"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">{image.title}</h3>
                  {image.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">{image.description}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-2">
                    {new Date(image.uploadDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Image Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="relative">
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.title}
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  {/* Download button */}
                  <button
                    onClick={() => downloadImage(selectedImage.imageUrl, selectedImage.title)}
                    className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                    title="Download image"
                  >
                    <Download size={20} />
                  </button>
                  {/* Close button */}
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">{selectedImage.title}</h2>
                  <span className="inline-block bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                    {selectedImage.category}
                  </span>
                </div>
                {selectedImage.description && (
                  <p className="text-gray-600 mb-4">{selectedImage.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-gray-400 text-sm">
                    Uploaded on {new Date(selectedImage.uploadDate).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => downloadImage(selectedImage.imageUrl, selectedImage.title)}
                    className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <Download size={16} />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery; 