import express from 'express';
import { 
  getUserFunds, 
  addFundsToUser, 
  deductFundsFromUser, 
  getAllUsersWithFunds, 
  getFundsSummary,
  requestFundWithdrawal
} from '../controllers/fundsController.js';
import { admin, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);
// router.use(admin);

// Get funds for a specific user
router.get('/user/:userId', getUserFunds);

// User fund withdrawal request
router.post('/withdraw', requestFundWithdrawal);

// Admin routes
router.post('/admin/add', addFundsToUser);
router.post('/admin/deduct', deductFundsFromUser);
router.get('/admin/users', getAllUsersWithFunds);
router.get('/admin/summary', getFundsSummary);

export default router; 