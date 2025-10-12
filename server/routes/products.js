import express from 'express';
import fileUpload from 'express-fileupload';
import {
  createProduct,
  getProducts,
  getPublicProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  setPrimaryImage,
  getProductCategories,
  getProductStats
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// File upload middleware
router.use(fileUpload({
  useTempFiles: false,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  abortOnLimit: true
}));

// Public routes
router.get('/public', getPublicProducts);
router.get('/categories', getProductCategories);
router.get('/:id', getProductById);

// Protected admin routes
router.use(protect);
router.use(admin);

router.post('/', createProduct);
router.get('/', getProducts);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.delete('/:productId/images/:imageId', deleteProductImage);
router.patch('/:productId/images/:imageId/primary', setPrimaryImage);
router.get('/stats/overview', getProductStats);

export default router; 