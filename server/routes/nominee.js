import express from 'express';
import { 
  getNominee, 
  createOrUpdateNominee, 
  deleteNominee, 
  getAllNominees 
} from '../controllers/nomineeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get nominee information for a user
router.get('/:userId', protect, getNominee);

// Create or update nominee information
router.post('/:userId', protect, createOrUpdateNominee);

// Delete nominee information
router.delete('/:userId', protect, deleteNominee);

// Get all nominees (Admin only)
router.get('/', protect, getAllNominees);

export default router;
