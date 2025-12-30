import express from 'express';
import {
  createCategory,
  getCategories,
  getActiveCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryStats
} from '../controllers/categoryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route - get active categories
router.get('/active', getActiveCategories);

// Protected admin routes
router.use(protect);
router.use(admin);

router.post('/', createCategory);
router.get('/', getCategories);
router.get('/stats', getCategoryStats);
router.get('/:id', getCategoryById);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;

