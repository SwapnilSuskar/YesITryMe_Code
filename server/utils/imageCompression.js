import sharp from 'sharp';

/**
 * Compress and resize image for profile photos
 * @param {Buffer} imageBuffer - Original image buffer
 * @returns {Promise<Buffer>} - Compressed image buffer
 */
export const compressProfilePhoto = async (imageBuffer) => {
  return await sharp(imageBuffer)
    .resize(400, 400, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({
      quality: 80,
      progressive: true
    })
    .toBuffer();
};

/**
 * Compress and resize image for gallery photos
 * @param {Buffer} imageBuffer - Original image buffer
 * @returns {Promise<Buffer>} - Compressed image buffer
 */
export const compressGalleryImage = async (imageBuffer) => {
  return await sharp(imageBuffer)
    .resize(1200, 800, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({
      quality: 85,
      progressive: true
    })
    .toBuffer();
};

/**
 * Compress and resize image for payment proof documents
 * @param {Buffer} imageBuffer - Original image buffer
 * @returns {Promise<Buffer>} - Compressed image buffer
 */
export const compressPaymentProof = async (imageBuffer) => {
  return await sharp(imageBuffer)
    .resize(800, 600, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({
      quality: 80,
      progressive: true
    })
    .toBuffer();
};

/**
 * Compress and resize image for KYC documents
 * @param {Buffer} imageBuffer - Original image buffer
 * @returns {Promise<Buffer>} - Compressed image buffer
 */
export const compressKycDocument = async (imageBuffer) => {
  return await sharp(imageBuffer)
    .resize(1000, 800, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({
      quality: 85,
      progressive: true
    })
    .toBuffer();
};

/**
 * Generic image compression function
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Object} options - Compression options
 * @param {number} options.width - Target width
 * @param {number} options.height - Target height
 * @param {string} options.fit - Resize fit mode ('cover', 'inside', 'fill', etc.)
 * @param {number} options.quality - JPEG quality (1-100)
 * @param {boolean} options.progressive - Use progressive JPEG
 * @returns {Promise<Buffer>} - Compressed image buffer
 */
export const compressImage = async (imageBuffer, options = {}) => {
  const {
    width = 800,
    height = 600,
    fit = 'inside',
    quality = 80,
    progressive = true,
    withoutEnlargement = true
  } = options;

  return await sharp(imageBuffer)
    .resize(width, height, {
      fit,
      withoutEnlargement
    })
    .jpeg({
      quality,
      progressive
    })
    .toBuffer();
};

/**
 * Get image metadata without processing
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Object>} - Image metadata
 */
export const getImageMetadata = async (imageBuffer) => {
  return await sharp(imageBuffer).metadata();
};

/**
 * Validate image file
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<boolean>} - Whether image is valid
 */
export const validateImage = async (imageBuffer) => {
  try {
    const metadata = await getImageMetadata(imageBuffer);
    return metadata.width > 0 && metadata.height > 0;
  } catch (error) {
    return false;
  }
}; 