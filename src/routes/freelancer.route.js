import express from "express";
import {
  sendOTP,
  verifyOTP,
  registerFreelancer,
  getFreelancerById,
  getFreelancerProfile,
  getFreelancerCount,
  getAllFreelancers,
  searchFreelancers,
  deactivateFreelancer,
  activateFreelancer,
  updateFreelancer,
  deleteFreelancer,
  getAppliedJobs,
  getFreelancerApplicationStats,
  checkJobApplication,
} from "../features/freelancer/controllers/freelancer.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

router.post("/register", authMiddleware(["freelancer"]), registerFreelancer);

router.get("/profile", authMiddleware(["freelancer"]), getFreelancerById); // Get own profile
router.put("/profile", authMiddleware(["freelancer"]), updateFreelancer); // Update own profile

router.get("/jobs/applied", authMiddleware(["freelancer"]), getAppliedJobs);
router.get(
  "/jobs/stats",
  authMiddleware(["freelancer"]),
  getFreelancerApplicationStats
);
router.get(
  "/jobs/:jobId/check",
  authMiddleware(["freelancer"]),
  checkJobApplication
);

router.get("/", getAllFreelancers);
router.get("/search", searchFreelancers);
router.get("/:id", getFreelancerProfile);

router.get("/stats", authMiddleware(["admin"]), getFreelancerCount);
router.post("/suspend", authMiddleware(["admin"]), deactivateFreelancer);
router.post("/resume", authMiddleware(["admin"]), activateFreelancer);
router.delete(
  "/:id",
  authMiddleware(["freelancer", "admin"]),
  deleteFreelancer
);

export const FreelancerRoutes = router;
