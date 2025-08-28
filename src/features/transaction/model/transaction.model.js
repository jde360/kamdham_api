import mongoose from "mongoose";
const transactionSchema = new mongoose.Schema(
  {
    tnxId: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    
      platformFee: {
        type: Number,
        required: true,
        default: 0.0,
      },
    paymentId: {
      type: String,
      default: "",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed", "refunded", "cancelled"],
      default: "pending",
    },
    txnType: {
      type: String,
      required: true,
      enum: ["debit", "credit"],
      default: "credit",
    },
    transactionType: {
      type: String,
      enum: ["job_payment", "service_payment", "withdrawal", "refund", "platform_fee"],
      default: "job_payment",
    },
    description: {
      type: String,
      default: "",
    },
    withdrawalRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WithdrawalRequest",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
const TransactionModel = mongoose.model("Transaction", transactionSchema);
export default TransactionModel;
