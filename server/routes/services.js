import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  listActiveServiceConfigs,
  createServiceRequest,
  adminListServiceConfigs,
  adminUpsertServiceConfig,
  adminCreateServiceConfig,
  adminDeleteServiceConfig,
  adminListServiceRequests,
} from "../controllers/servicesController.js";

const router = express.Router();

// User
router.get("/", protect, listActiveServiceConfigs);
router.post("/request", protect, createServiceRequest);

// Admin
router.get("/admin/configs", protect, admin, adminListServiceConfigs);
router.post("/admin/configs", protect, admin, adminCreateServiceConfig);
router.put("/admin/configs/:serviceKey", protect, admin, adminUpsertServiceConfig);
router.delete("/admin/configs/:serviceKey", protect, admin, adminDeleteServiceConfig);
router.get("/admin/requests", protect, admin, adminListServiceRequests);

export default router;

