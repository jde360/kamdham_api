import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'senderType',
      required: true,
    },
    senderType: {
      type: String,
      required: true,
      enum: ['User', 'Freelancer'],
    },
    messageType: {
      type: String,
      required: true,
      enum: ['text', 'image', 'file', 'booking', 'system'],
      default: 'text',
    },
    content: {
      type: String,
      required: function() {
        return this.messageType === 'text' || this.messageType === 'system';
      },
    },
    // For image and file messages
    fileUrl: {
      type: String,
      required: function() {
        return this.messageType === 'image' || this.messageType === 'file';
      },
    },
    fileName: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    // For booking-related messages
    bookingData: {
      bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FreelancerServiceApplication",
      },
      action: {
        type: String,
        enum: ['booking_request', 'booking_accepted', 'booking_rejected', 'booking_completed'],
      },
    },
    // Message status
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    // Read status for each participant
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'readBy.userType',
        required: true,
      },
      userType: {
        type: String,
        required: true,
        enum: ['User', 'Freelancer'],
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    }],
    // Reply to another message
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for better query performance
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ isDeleted: 1 });
messageSchema.index({ messageType: 1 });

// Virtual to check if message is read by a specific user
messageSchema.methods.isReadByUser = function(userId) {
  return this.readBy.some(read => read.user.toString() === userId.toString());
};

// Method to mark message as read by a user
messageSchema.methods.markAsRead = async function(userId, userType) {
  if (!this.isReadByUser(userId)) {
    this.readBy.push({
      user: userId,
      userType: userType,
      readAt: new Date()
    });
    await this.save();
  }
  return this;
};

// Method to soft delete a message
messageSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.content = "This message was deleted";
  await this.save();
  return this;
};

// Static method to get messages with pagination
messageSchema.statics.getChatMessages = async function(chatId, page = 1, limit = 50, userId) {
  const skip = (page - 1) * limit;
  
  const messages = await this.find({
    chat: chatId,
    isDeleted: false
  })
  .populate('replyTo', 'content messageType sender senderType createdAt')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);

  // Mark messages as read for the requesting user
  const unreadMessages = messages.filter(msg => 
    msg.sender.toString() !== userId.toString() && 
    !msg.isReadByUser(userId)
  );

  // Mark unread messages as read (this would typically be done in a separate endpoint)
  // For now, we'll just return the messages
  
  return {
    messages: messages.reverse(), // Reverse to show oldest first
    hasMore: messages.length === limit,
    page,
    limit
  };
};

const MessageModel = mongoose.model("Message", messageSchema);
export default MessageModel;
