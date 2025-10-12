import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/authMiddleware.js";
import {
  getUserMLMLevel,
  updateMLMLevel,
  getTeamStructure,
  getUsersByMLMLevel,
  getMLMStats
} from "../controllers/mlmController.js";

const router = express.Router();

// User routes
router.get("/level", protect, getUserMLMLevel);
router.post("/update-level", protect, updateMLMLevel);
router.get("/team-structure", protect, getTeamStructure);

// Admin routes
router.get("/users/:level", protect, admin, getUsersByMLMLevel);
router.get("/stats", protect, admin, getMLMStats);

export default router;