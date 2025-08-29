import express from "express";
import {
  getUserChats,
  getOrCreateChat,
  getChatMessages,
  getChatById,
  createMessage,
  updateMessage,
  deleteMessage,
  markMessagesAsRead,
  searchMessagesInChat
} from "../features/chat/controllers/chat.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// Chat Management Routes
router.get("/", authMiddleware(["user", "freelancer"]), getUserChats);
router.post("/create", authMiddleware(["user", "freelancer"]), getOrCreateChat);
router.get("/:chatId", authMiddleware(["user", "freelancer"]), getChatById);

// Message Management Routes
router.get("/:chatId/messages", authMiddleware(["user", "freelancer"]), getChatMessages);
router.post("/:chatId/messages", authMiddleware(["user", "freelancer"]), createMessage);
router.put("/messages/:messageId", authMiddleware(["user", "freelancer"]), updateMessage);
router.delete("/messages/:messageId", authMiddleware(["user", "freelancer"]), deleteMessage);

// Message Action Routes
router.post("/:chatId/mark-read", authMiddleware(["user", "freelancer"]), markMessagesAsRead);
router.get("/:chatId/search", authMiddleware(["user", "freelancer"]), searchMessagesInChat);

export const ChatRoutes = router;
