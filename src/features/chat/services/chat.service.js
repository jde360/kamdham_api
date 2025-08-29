import ChatModel from "../model/chat.model.js";
import MessageModel from "../model/message.model.js";
import UserModel from "../../user/model/user.model.js";
import FreelancerModel from "../../freelancer/model/freelancer.model.js";
import AppError from "../../../utils/error.js";
import { httpCode } from "../../../utils/httpCode.js";

const chatService = {
  // Get all chats for a user (both as User and Freelancer)
  getUserChats: async (userId, userType, page = 1, limit = 20) => {
    try {
      const skip = (page - 1) * limit;
      const chats = await ChatModel.find({
        "participants.user": userId,
        "participants.userType": userType,
        isActive: true
      })
      .populate('lastMessage')
      .populate('serviceBooking', 'status bookingAmount scheduledDate')
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit);

      // Transform chats to include other participant info and unread count
      const transformedChats = chats.map(chat => {
        const otherParticipant = chat.getOtherParticipant(userId);
        const unreadCount = chat.unreadCounts.get(userId.toString()) || 0;

        return {
          _id: chat._id,
          otherParticipant: otherParticipant,
          lastMessage: chat.lastMessage,
          lastMessageAt: chat.lastMessageAt,
          unreadCount: unreadCount,
          serviceBooking: chat.serviceBooking,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt
        };
      });

      return {
        chats: transformedChats,
        hasMore: chats.length === limit,
        page,
        limit,
        totalChats: await ChatModel.countDocuments({
          "participants.user": userId,
          "participants.userType": userType,
          isActive: true
        })
      };
    } catch (error) {
      throw error;
    }
  },

  // Get or create a chat between two users
  getOrCreateChat: async (user1Id, user1Type, user2Id, user2Type, serviceBookingId = null) => {
    try {
      // Get user details
      const user1 = user1Type === 'User' 
        ? await UserModel.findById(user1Id).select('name image')
        : await FreelancerModel.findById(user1Id).select('name image');
      
      const user2 = user2Type === 'User'
        ? await UserModel.findById(user2Id).select('name image')
        : await FreelancerModel.findById(user2Id).select('name image');

      if (!user1 || !user2) {
        throw new AppError("One or both users not found", httpCode.NOT_FOUND);
      }

      const chat = await ChatModel.findOrCreateChat(
        user1Id, user1Type, user1.name, user1.image,
        user2Id, user2Type, user2.name, user2.image,
        serviceBookingId
      );

      return chat;
    } catch (error) {
      throw error;
    }
  },

  // Get messages for a specific chat
  getChatMessages: async (chatId, userId, userType, page = 1, limit = 50) => {
    try {
      // Verify user is part of this chat
      const chat = await ChatModel.findOne({
        _id: chatId,
        "participants.user": userId,
        "participants.userType": userType
      });

      if (!chat) {
        throw new AppError("Chat not found or access denied", httpCode.FORBIDDEN);
      }

      const result = await MessageModel.getChatMessages(chatId, page, limit, userId);
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Create a new message
  createMessage: async (chatId, senderId, senderType, messageData) => {
    try {
      const { content, messageType = 'text', fileUrl, fileName, fileSize, replyTo, bookingData } = messageData;

      // Verify sender is part of this chat
      const chat = await ChatModel.findOne({
        _id: chatId,
        "participants.user": senderId,
        "participants.userType": senderType
      });

      if (!chat) {
        throw new AppError("Chat not found or access denied", httpCode.FORBIDDEN);
      }

      // Validate message content based on type
      if (messageType === 'text' && !content) {
        throw new AppError("Content is required for text messages", httpCode.BAD_REQUEST);
      }

      if ((messageType === 'image' || messageType === 'file') && !fileUrl) {
        throw new AppError("File URL is required for file messages", httpCode.BAD_REQUEST);
      }

      // Create the message
      const message = await MessageModel.create({
        chat: chatId,
        sender: senderId,
        senderType: senderType,
        messageType: messageType,
        content: content,
        fileUrl: fileUrl,
        fileName: fileName,
        fileSize: fileSize,
        replyTo: replyTo,
        bookingData: bookingData,
        readBy: [{
          user: senderId,
          userType: senderType,
          readAt: new Date()
        }]
      });

      // Update chat's last message and timestamp
      chat.lastMessage = message._id;
      chat.lastMessageAt = new Date();

      // Update unread count for other participants
      chat.participants.forEach(participant => {
        if (participant.user.toString() !== senderId.toString()) {
          const currentCount = chat.unreadCounts.get(participant.user.toString()) || 0;
          chat.unreadCounts.set(participant.user.toString(), currentCount + 1);
        }
      });

      await chat.save();

      // Populate and return the created message
      await message.populate('replyTo', 'content messageType sender senderType createdAt');
      
      return message;
    } catch (error) {
      throw error;
    }
  },

  // Update a message (only content can be updated)
  updateMessage: async (messageId, userId, userType, updateData) => {
    try {
      const { content } = updateData;

      if (!content) {
        throw new AppError("Content is required for update", httpCode.BAD_REQUEST);
      }

      // Find the message and verify ownership
      const message = await MessageModel.findOne({
        _id: messageId,
        sender: userId,
        senderType: userType,
        isDeleted: false
      });

      if (!message) {
        throw new AppError("Message not found or access denied", httpCode.FORBIDDEN);
      }

      // Only text messages can be edited
      if (message.messageType !== 'text') {
        throw new AppError("Only text messages can be edited", httpCode.BAD_REQUEST);
      }

      // Update the message
      message.content = content;
      message.isEdited = true;
      message.editedAt = new Date();

      await message.save();
      await message.populate('replyTo', 'content messageType sender senderType createdAt');

      return message;
    } catch (error) {
      throw error;
    }
  },

  // Delete a message (soft delete)
  deleteMessage: async (messageId, userId, userType) => {
    try {
      // Find the message and verify ownership
      const message = await MessageModel.findOne({
        _id: messageId,
        sender: userId,
        senderType: userType,
        isDeleted: false
      });

      if (!message) {
        throw new AppError("Message not found or access denied", httpCode.FORBIDDEN);
      }

      // Soft delete the message
      await message.softDelete();

      // If this was the last message in the chat, update the chat's last message
      const chat = await ChatModel.findById(message.chat);
      if (chat && chat.lastMessage && chat.lastMessage.toString() === messageId) {
        // Find the previous message to set as last message
        const previousMessage = await MessageModel.findOne({
          chat: message.chat,
          isDeleted: false,
          _id: { $ne: messageId }
        }).sort({ createdAt: -1 });

        chat.lastMessage = previousMessage ? previousMessage._id : null;
        chat.lastMessageAt = previousMessage ? previousMessage.createdAt : chat.lastMessageAt;
        await chat.save();
      }

      return { messageId, deleted: true };
    } catch (error) {
      throw error;
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (chatId, userId, userType) => {
    try {
      // Verify user is part of this chat
      const chat = await ChatModel.findOne({
        _id: chatId,
        "participants.user": userId,
        "participants.userType": userType
      });

      if (!chat) {
        throw new AppError("Chat not found or access denied", httpCode.FORBIDDEN);
      }

      // Find all unread messages for this user in this chat
      const unreadMessages = await MessageModel.find({
        chat: chatId,
        sender: { $ne: userId },
        isDeleted: false,
        readBy: {
          $not: {
            $elemMatch: {
              user: userId,
              userType: userType
            }
          }
        }
      });

      // Mark all as read
      const bulkOps = unreadMessages.map(message => ({
        updateOne: {
          filter: { _id: message._id },
          update: {
            $push: {
              readBy: {
                user: userId,
                userType: userType,
                readAt: new Date()
              }
            }
          }
        }
      }));

      if (bulkOps.length > 0) {
        await MessageModel.bulkWrite(bulkOps);
      }

      // Reset unread count for this user in the chat
      chat.unreadCounts.set(userId.toString(), 0);
      await chat.save();

      return { markedAsRead: unreadMessages.length };
    } catch (error) {
      throw error;
    }
  },

  // Get chat details by ID
  getChatById: async (chatId, userId, userType) => {
    try {
      const chat = await ChatModel.findOne({
        _id: chatId,
        "participants.user": userId,
        "participants.userType": userType
      })
      .populate('lastMessage')
      .populate('serviceBooking');

      if (!chat) {
        throw new AppError("Chat not found or access denied", httpCode.FORBIDDEN);
      }

      const otherParticipant = chat.getOtherParticipant(userId);
      const unreadCount = chat.unreadCounts.get(userId.toString()) || 0;

      return {
        _id: chat._id,
        otherParticipant: otherParticipant,
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
        unreadCount: unreadCount,
        serviceBooking: chat.serviceBooking,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      };
    } catch (error) {
      throw error;
    }
  },

  // Search messages in a chat
  searchMessagesInChat: async (chatId, userId, userType, searchQuery) => {
    try {
      // Verify user is part of this chat
      const chat = await ChatModel.findOne({
        _id: chatId,
        "participants.user": userId,
        "participants.userType": userType
      });

      if (!chat) {
        throw new AppError("Chat not found or access denied", httpCode.FORBIDDEN);
      }

      const messages = await MessageModel.find({
        chat: chatId,
        isDeleted: false,
        messageType: 'text',
        content: { $regex: searchQuery, $options: 'i' }
      })
      .populate('replyTo', 'content messageType sender senderType createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

      return messages;
    } catch (error) {
      throw error;
    }
  }
};

export default chatService;
