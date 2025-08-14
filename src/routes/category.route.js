import express from "express";
import  authMiddleware  from "../middlewares/auth.middleware.js";
import { createCategory, getAllCategories } from "../features/category/controller/category.controller.js";
const router = express.Router();
router.post('/', authMiddleware(['admin', 'freelancer']), createCategory);
router.get('/', authMiddleware(['admin']), getAllCategories);
export const CategoryRoutes = router;