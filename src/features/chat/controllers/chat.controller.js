import { formattedResponse } from "../../../utils/formatedRes.js";
import { httpCode } from "../../../utils/httpCode.js";
import chatService from "../services/chat.service.js";

// Get all chats for the authenticated user
export const getUserChats = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.role === 'freelancer' ? 'Freelancer' : 'User';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await chatService.getUserChats(userId, userType, page, limit);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Chats fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get or create a chat between two users
export const getOrCreateChat = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.role === 'freelancer' ? 'Freelancer' : 'User';
    const { otherUserId, otherUserType, serviceBookingId } = req.body;

    if (!otherUserId || !otherUserType) {
      return res
        .status(httpCode.BAD_REQUEST)
        .json(formattedResponse("Other user ID and type are required", null));
    }

    const result = await chatService.getOrCreateChat(
      userId, userType, 
      otherUserId, otherUserType, 
      serviceBookingId
    );

    return res
      .status(httpCode.OK)
      .json(formattedResponse("Chat retrieved successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get messages for a specific chat
export const getChatMessages = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.role === 'freelancer' ? 'Freelancer' : 'User';
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const result = await chatService.getChatMessages(chatId, userId, userType, page, limit);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Messages fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get specific chat details
export const getChatById = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.role === 'freelancer' ? 'Freelancer' : 'User';
    const { chatId } = req.params;

    const result = await chatService.getChatById(chatId, userId, userType);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Chat details fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Create a new message in a chat
export const createMessage = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.role === 'freelancer' ? 'Freelancer' : 'User';
    const { chatId } = req.params;
    const messageData = req.body;

    const result = await chatService.createMessage(chatId, userId, userType, messageData);
    return res
      .status(httpCode.CREATED)
      .json(formattedResponse("Message sent successfully", result));
  } catch (error) {
    next(error);
  }
};

// Update a message
export const updateMessage = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.role === 'freelancer' ? 'Freelancer' : 'User';
    const { messageId } = req.params;
    const updateData = req.body;

    const result = await chatService.updateMessage(messageId, userId, userType, updateData);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Message updated successfully", result));
  } catch (error) {
    next(error);
  }
};

// Delete a message
export const deleteMessage = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.role === 'freelancer' ? 'Freelancer' : 'User';
    const { messageId } = req.params;

    const result = await chatService.deleteMessage(messageId, userId, userType);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Message deleted successfully", result));
  } catch (error) {
    next(error);
  }
};

// Mark messages in a chat as read
export const markMessagesAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.role === 'freelancer' ? 'Freelancer' : 'User';
    const { chatId } = req.params;

    const result = await chatService.markMessagesAsRead(chatId, userId, userType);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Messages marked as read", result));
  } catch (error) {
    next(error);
  }
};

// Search messages in a chat
export const searchMessagesInChat = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.role === 'freelancer' ? 'Freelancer' : 'User';
    const { chatId } = req.params;
    const { q: searchQuery } = req.query;

    if (!searchQuery) {
      return res
        .status(httpCode.BAD_REQUEST)
        .json(formattedResponse("Search query is required", null));
    }

    const result = await chatService.searchMessagesInChat(chatId, userId, userType, searchQuery);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Messages searched successfully", result));
  } catch (error) {
    next(error);
  }
};
