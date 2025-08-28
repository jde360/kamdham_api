import express from "express";
import {
  getAllFreelancerServices,
  getFreelancerServiceById,
  getFreelancerServicesByCategory,
  getFreelancerServicesByFreelancer,
  createFreelancerService,
  updateFreelancerService,
  deleteFreelancerService,
  updateServiceStatus,
} from "../features/freelancerServices/controllers/freelancerServices.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();
router.get("/", getAllFreelancerServices);
router.get("/:id", getFreelancerServiceById); 
router.get("/category/:categoryId", getFreelancerServicesByCategory);
router.get("/freelancer/:freelancerId", getFreelancerServicesByFreelancer); 
router.post("/", authMiddleware(["freelancer"]), createFreelancerService);
router.put("/:id", authMiddleware(["freelancer", "admin"]), updateFreelancerService);
router.delete("/:id", authMiddleware(["freelancer", "admin"]), deleteFreelancerService); 
router.patch("/:id/status", authMiddleware(["admin"]), updateServiceStatus);
export const FreelancerServicesRoutes = router;
