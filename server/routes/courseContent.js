import express from "express";
import {
  getAllCourseContent,
  getCourseContentById,
  createCourseContent,
  updateCourseContent,
  deleteCourseContent,
  getCourseContentByCourseId,
} from "../controllers/courseContentController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route - get course content by courseId (for course detail page)
router.get("/course/:courseId", getCourseContentByCourseId);

// Admin routes
router.get("/", protect, admin, getAllCourseContent);
router.get("/:id", protect, admin, getCourseContentById);
router.post("/", protect, admin, createCourseContent);
router.put("/:id", protect, admin, updateCourseContent);
router.delete("/:id", protect, admin, deleteCourseContent);

export default router;

