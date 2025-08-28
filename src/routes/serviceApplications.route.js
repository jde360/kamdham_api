import express from "express";
import {
  applyForService,
  getFreelancerApplications,
  getClientApplications,
  getApplicationById,
  updateApplicationStatus,
  withdrawApplication,
  getFreelancerApplicationStats,
  getClientApplicationStats,
  getAllApplications,
  getApplicationAnalytics,
  completeService,
  updatePaymentStatus
} from "../features/freelancerServices/controllers/serviceApplications.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// Client/User routes
router.post("/", authMiddleware(["user"]), applyForService);
router.get("/my-applications", authMiddleware(["user"]), getClientApplications); 
router.get("/my-applications/stats", authMiddleware(["user"]), getClientApplicationStats); 
router.patch("/:id/withdraw", authMiddleware(["user"]), withdrawApplication); 
router.patch("/:id/payment-status", authMiddleware(["user"]), updatePaymentStatus); 

// Freelancer routes
router.get("/freelancer/applications", authMiddleware(["freelancer"]), getFreelancerApplications);
router.get("/freelancer/stats", authMiddleware(["freelancer"]), getFreelancerApplicationStats); 
router.patch("/:id/status", authMiddleware(["freelancer"]), updateApplicationStatus); 
router.patch("/:id/complete", authMiddleware(["freelancer"]), completeService);

// Shared routes (Client, Freelancer, Admin)
router.get("/:id", authMiddleware(["user", "freelancer", "admin"]), getApplicationById); // Get application by ID

// Admin-only routes
router.get("/", authMiddleware(["admin"]), getAllApplications); // Get all applications
router.get("/admin/analytics", authMiddleware(["admin"]), getApplicationAnalytics); // Get application analytics

export const ServiceApplicationsRoutes = router;
