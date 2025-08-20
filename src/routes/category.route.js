import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  createCategory,
  deleteCategory,
  getAllActiveCategories,
  getAllCategories,
  getCategoryById,
  getCategoryStats,
  searchCategories,
  updateCategory,
} from "../features/category/controller/category.controller.js";
const router = express.Router();
router.post("/", authMiddleware(["admin", "freelancer"]), createCategory);
router.get("/", authMiddleware(["admin"]), getAllCategories);
router.get("/active", getAllActiveCategories);
router.get("/search", searchCategories);
router.get("/stats", authMiddleware(["admin"]), getCategoryStats);
router.get(
  "/:id",
  authMiddleware(["admin", "freelancer", "user"]),
  getCategoryById
);

//update
router.put("/:id", authMiddleware(["admin"]), updateCategory);
//delete
router.delete("/:id", authMiddleware(["admin"]), deleteCategory);

export const CategoryRoutes = router;
