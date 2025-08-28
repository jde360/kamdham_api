import express from "express";
const router = express.Router();
import authMiddleware from "../middlewares/auth.middleware.js";
import { getAdminWallet, getWallet } from "../features/wallet/controller/wallet.controller.js";
router.get("/", authMiddleware(["freelancer"]), getWallet);
router.get("/admin", authMiddleware(["admin"]), getAdminWallet);
export const WalletRoutes = router;