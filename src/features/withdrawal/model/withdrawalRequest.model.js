import mongoose from "mongoose";

const withdrawalRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, "Amount must be greater than 0"],
    },
    requestedAmount: {
      type: Number,
      required: true,
    },
     status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected", "processed", "failed", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["bank_transfer", "upi", "paypal", "other"],
    },
    paymentDetails: {
      // Bank details for bank transfer
      bankName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      accountHolderName: { type: String },
      
      // UPI details
      upiId: { type: String },
      
      // PayPal details
      paypalEmail: { type: String },
      
      // Other payment details
      otherDetails: { type: String },
    },
    adminNotes: {
      type: String,
      default: "",
    },
    rejectionReason: {
      type: String,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    processedAt: {
      type: Date,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
    paymentReferenceId: {
      type: String, // Reference ID from payment gateway or bank
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Generate unique request ID
withdrawalRequestSchema.pre("save", async function (next) {
  if (!this.requestId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.requestId = `KDWR-${timestamp}-${random}`;
  }
  next();
});

// Index for better query performance
withdrawalRequestSchema.index({ freelancer: 1, status: 1 });
withdrawalRequestSchema.index({ status: 1, createdAt: -1 });

const WithdrawalRequestModel = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
export default WithdrawalRequestModel;
