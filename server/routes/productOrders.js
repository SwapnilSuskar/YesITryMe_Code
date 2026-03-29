import express from "express";
import fileUpload from "express-fileupload";
import { protect } from "../middleware/authMiddleware.js";
import {
  createProductOrder,
  submitProductOrderPayment,
  getMyProductOrders,
  getMyProductOrderById,
} from "../controllers/productOrderController.js";

const router = express.Router();

router.use(protect);

router.post("/", createProductOrder);

router.use(
  fileUpload({
    useTempFiles: false,
    limits: { fileSize: 10 * 1024 * 1024 },
    abortOnLimit: true,
  })
);

router.post("/:id/payment-proof", submitProductOrderPayment);

router.get("/mine", getMyProductOrders);
router.get("/:id", getMyProductOrderById);

export default router;
