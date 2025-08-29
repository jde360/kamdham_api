import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'participants.userType',
          required: true,
        },
        userType: {
          type: String,
          required: true,
          enum: ['User', 'Freelancer'],
        },
        name: {
          type: String,
          required: true,
        },
        image: {
          type: String,
          default: "https://ik.imagekit.io/fqbwqlzwt/kamdham/noImage.png",
        },
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Related to service booking if applicable
    serviceBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreelancerServiceApplication",
      default: null,
    },
    // Unread message counts for each participant
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index for faster queries
chatSchema.index({ "participants.user": 1 });
chatSchema.index({ lastMessageAt: -1 });
chatSchema.index({ isActive: 1 });

// Virtual to get the other participant for a given user
chatSchema.methods.getOtherParticipant = function(userId) {
  return this.participants.find(p => p.user.toString() !== userId.toString());
};

// Static method to find or create a chat between two users
chatSchema.statics.findOrCreateChat = async function(user1Id, user1Type, user1Name, user1Image, user2Id, user2Type, user2Name, user2Image, serviceBookingId = null) {
  // Check if chat already exists between these participants
  let chat = await this.findOne({
    $and: [
      { "participants.user": user1Id },
      { "participants.user": user2Id }
    ]
  }).populate('lastMessage');

  if (!chat) {
    // Create new chat
    chat = await this.create({
      participants: [
        {
          user: user1Id,
          userType: user1Type,
          name: user1Name,
          image: user1Image || "https://ik.imagekit.io/fqbwqlzwt/kamdham/noImage.png"
        },
        {
          user: user2Id,
          userType: user2Type,
          name: user2Name,
          image: user2Image || "https://ik.imagekit.io/fqbwqlzwt/kamdham/noImage.png"
        }
      ],
      serviceBooking: serviceBookingId,
      unreadCounts: {
        [user1Id]: 0,
        [user2Id]: 0
      }
    });
    
    await chat.populate('lastMessage');
  }

  return chat;
};

const ChatModel = mongoose.model("Chat", chatSchema);
export default ChatModel;
