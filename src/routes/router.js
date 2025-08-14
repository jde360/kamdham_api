import express from "express";
import { AdminRoutes } from "./admin.route.js";
import { CategoryRoutes } from "./category.route.js";
const router = express.Router();
router.use('/admin',AdminRoutes);
router.use('/category', CategoryRoutes);
export default router;