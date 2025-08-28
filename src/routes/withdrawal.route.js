import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  createWithdrawalRequest,
  getMyWithdrawalRequests,
  getAllWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  getWithdrawalRequest,
  cancelWithdrawalRequest,
} from "../features/withdrawal/controller/withdrawal.controller.js";

const router = express.Router();

// Freelancer routes
router.post("/", authMiddleware(["freelancer"]), createWithdrawalRequest);
router.get("/my-requests", authMiddleware(["freelancer"]), getMyWithdrawalRequests);
router.patch("/:requestId/cancel", authMiddleware(["freelancer"]), cancelWithdrawalRequest);

// Admin routes
router.get("/admin/all", authMiddleware(["admin"]), getAllWithdrawalRequests);
router.patch("/admin/:requestId/approve", authMiddleware(["admin"]), approveWithdrawalRequest);
router.patch("/admin/:requestId/reject", authMiddleware(["admin"]), rejectWithdrawalRequest);
router.get("/:requestId", authMiddleware(["freelancer", "admin"]), getWithdrawalRequest);

export const WithdrawalRoutes = router;
