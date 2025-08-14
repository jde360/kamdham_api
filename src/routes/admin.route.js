import express from "express";
import { createAdmin, deleteAdmin, getAdminById, getAllAdmins, loginAdmin, updateAdmin } from "../features/admin/controllers/auth.controller.js";
import  authMiddleware  from "../middlewares/auth.middleware.js";
const router = express.Router();
router.post('/auth', createAdmin);
router.post('/auth/login', loginAdmin);
router.get('/', authMiddleware(['admin']), getAllAdmins);
router.get('/:id', authMiddleware(['admin']), getAdminById);
router.put('/:id', authMiddleware(['admin']), updateAdmin);
router.delete('/:id', authMiddleware(['admin']), deleteAdmin);

export const AdminRoutes = router;