import express from "express";
import { sendContactQuery } from "../controllers/contactController.js";
const router = express.Router();

router.post("/send", sendContactQuery);

export default router;
