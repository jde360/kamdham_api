import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  createBanner,
  deleteBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  getActiveBannersByPosition,
  getBannersByPositions,
  trackBannerClick,
  getBannerAnalytics,
  getBannerPerformance,
  bulkUpdateBannerStatus,
  getAllActiveBanners,
} from "../features/banner/controller/banner.controller.js";

const router = express.Router();

// Admin routes - require admin authentication
router.post("/", authMiddleware(["admin"]), createBanner);
router.get("/admin", authMiddleware(["admin"]), getAllBanners);
router.get("/admin/:id", authMiddleware(["admin"]), getBannerById);
router.put("/:id", authMiddleware(["admin"]), updateBanner);
router.delete("/:id", authMiddleware(["admin"]), deleteBanner);

// Analytics routes - admin only
router.get("/analytics", authMiddleware(["admin"]), getBannerAnalytics);
router.get("/performance/:id", authMiddleware(["admin"]), getBannerPerformance);

// Bulk operations - admin only
router.put("/bulk/status", authMiddleware(["admin"]), bulkUpdateBannerStatus);

// Public routes - no authentication required
router.get("/active", getAllActiveBanners);
router.get("/position/:position", getActiveBannersByPosition);
router.post("/positions", getBannersByPositions);

// Analytics tracking - public endpoint for tracking clicks
router.post("/track/:id/click", trackBannerClick);

export const BannerRoutes = router;
