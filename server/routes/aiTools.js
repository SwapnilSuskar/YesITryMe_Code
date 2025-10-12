import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  createAiTool,
  getAiTools,
  getPublicAiTools,
  getAiToolById,
  updateAiTool,
  deleteAiTool,
} from "../controllers/aiToolController.js";

const router = express.Router();

// Public
router.get("/public", getPublicAiTools);

// Admin protected
router.use(protect, admin);
router.post("/", createAiTool);
router.get("/", getAiTools);
router.get("/:id", getAiToolById);
router.put("/:id", updateAiTool);
router.delete("/:id", deleteAiTool);

export default router;
