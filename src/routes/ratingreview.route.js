import express from "express";
import {
  createRatingReview,
  updateRatingReview,
  deleteRatingReview,
  getFreelancerReviews,
  getUserReviews,
  getReviewById,
  markReviewAsHelpful,
  unmarkReviewAsHelpful,
  addFreelancerResponse,
  addAdminResponse,
  getReviewStatistics,
  searchReviews,
  getTopRatedFreelancers
} from "../features/ratingreview/controllers/ratingreview.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/freelancer/:freelancerId", getFreelancerReviews);
router.get("/search", searchReviews);
router.get("/top-rated", getTopRatedFreelancers);
router.get("/:reviewId", getReviewById);

// User routes (authentication required)
router.post("/", authMiddleware(["user"]), createRatingReview);
router.put("/:reviewId", authMiddleware(["user"]), updateRatingReview);
router.delete("/:reviewId", authMiddleware(["user"]), deleteRatingReview);
router.get("/user/my-reviews", authMiddleware(["user"]), getUserReviews);

// Helpfulness voting (any authenticated user)
router.post("/:reviewId/helpful", authMiddleware(["user", "freelancer"]), markReviewAsHelpful);
router.delete("/:reviewId/helpful", authMiddleware(["user", "freelancer"]), unmarkReviewAsHelpful);

// Freelancer response routes
router.post("/:reviewId/freelancer-response", authMiddleware(["freelancer"]), addFreelancerResponse);

// Admin routes
router.get("/admin/statistics", authMiddleware(["admin"]), getReviewStatistics);
router.post("/:reviewId/admin-response", authMiddleware(["admin"]), addAdminResponse);

export const RatingReviewRoutes = router;
