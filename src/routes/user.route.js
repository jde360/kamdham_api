import express from "express";
import {
  sendOTP,
  verifyOTP,
  registerUser,
  getUserById,
  getUserCount,
  searchUsers,
  deactivateUser,
  activateUser,
  updateUser,
  deleteUser,
} from "../features/user/controllers/user.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// OTP Authentication Routes (No auth required)
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

// Registration Route (Auth required)
router.post("/register", authMiddleware(["user"]), registerUser);
router.get("/", authMiddleware(["user"]), getUserById);
router.get("/stats", authMiddleware(["admin"]), getUserCount);
router.get("/search", authMiddleware(["admin"]), searchUsers);
router.post("/suspend", authMiddleware(["admin"]), deactivateUser);
router.post("/resume", authMiddleware(["admin"]), activateUser);
router.put("/", authMiddleware(["user"]), updateUser);
router.delete("/:id", authMiddleware(["user", "admin"]), deleteUser);

export const UserRoutes = router;
