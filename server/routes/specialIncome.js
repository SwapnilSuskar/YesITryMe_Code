import express from "express";
import { getSpecialIncome, setSpecialIncome, getAllUsersWithSpecialIncome, requestSpecialIncomeWithdrawal } from "../controllers/specialIncomeController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
const router = express.Router();

router.get("/:userId", protect, getSpecialIncome);
router.post("/withdraw", protect, requestSpecialIncomeWithdrawal);
router.get("/admin/all", protect, admin, getAllUsersWithSpecialIncome);
router.post("/", protect, admin, setSpecialIncome);

export default router;