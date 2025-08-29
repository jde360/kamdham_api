import express from "express";
import {
  getCurrentYearGrowth,
  getLastNMonthsGrowth,
  getCustomRangeGrowth,
  getFreelancerGrowth,
  getEmployerGrowth,
  getBookingGrowth,
  getOverallStats,
  getDashboardSummary
} from "../features/analytics/controllers/analytics.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// Dashboard summary - combines overall stats with growth metrics
router.get("/dashboard", authMiddleware(["admin"]), getDashboardSummary);

// Overall platform statistics
router.get("/stats", authMiddleware(["admin"]), getOverallStats);

// Monthly growth endpoints
router.get("/growth/current-year", authMiddleware(["admin"]), getCurrentYearGrowth);
router.get("/growth/last-months", authMiddleware(["admin"]), getLastNMonthsGrowth);
router.get("/growth/custom-range", authMiddleware(["admin"]), getCustomRangeGrowth);

// Specific growth endpoints for individual metrics
router.get("/growth/freelancers", authMiddleware(["admin"]), getFreelancerGrowth);
router.get("/growth/employers", authMiddleware(["admin"]), getEmployerGrowth);
router.get("/growth/bookings", authMiddleware(["admin"]), getBookingGrowth);

export const AnalyticsRoutes = router;
