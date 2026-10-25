import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { storyCardRateLimit } from "../middleware/rateLimiter.js";
import { getTransactionStoryCard } from "../controllers/storyCardController.js";

const router = express.Router();

router.get("/transaction/:txId", protect, storyCardRateLimit, getTransactionStoryCard);

export default router;
