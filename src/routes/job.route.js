import express from "express";
import {
  createJob,
  deleteJob,
  getAllJobs,
  getByCategory,
  getJobById,
  getJobsByCity,
  getJobsByState,
  getJobsByUser,
  searchJobs,
  updateJob,
} from "../features/jobs/controller/job.controller.js";
import {
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
  getApplicationById,
  getApplicationStats,
  getApplicationAnalytics,
  bulkUpdateApplicationStatus,
} from "../features/jobs/controller/jobApplication.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
const router = express.Router();

// Job CRUD routes
router.post("/", authMiddleware(["user"]), createJob);
router.get("/", authMiddleware(["admin"]), getAllJobs);
router.get("/user/:userId", getJobsByUser);
router.get("/state/:state", getJobsByState);
router.get("/city/:city", getJobsByCity);
router.get("/category/:cid", getByCategory);
router.get("/search", searchJobs);
router.get("/category", getByCategory);
router.delete("/:id", authMiddleware(["admin", "user"]), deleteJob);
router.put("/:id", updateJob);
router.get("/:id", getJobById);

// Job Application routes
// Freelancer routes
router.post("/apply", authMiddleware(["freelancer"]), applyToJob);
router.get(
  "/applications/my",
  authMiddleware(["freelancer"]),
  getMyApplications
);
router.get(
  "/applications/stats",
  authMiddleware(["freelancer"]),
  getApplicationStats
);
router.patch(
  "/applications/:applicationId/withdraw",
  authMiddleware(["freelancer"]),
  withdrawApplication
);

// Employer routes [User]
router.get(
  "/:jobId/applications",
  authMiddleware(["user"]),
  getJobApplications
);
router.patch(
  "/applications/:applicationId/status",
  authMiddleware(["user"]),
  updateApplicationStatus
);
router.get(
  "/applications/analytics",
  authMiddleware(["user"]),
  getApplicationAnalytics
);

// Admin routes
router.patch(
  "/applications/bulk-update",
  authMiddleware(["admin", "user"]),
  bulkUpdateApplicationStatus
);

// Common routes
router.get(
  "/applications/:applicationId",
  authMiddleware(["freelancer", "user", "admin"]),
  getApplicationById
);

export const JobRoute = router;
