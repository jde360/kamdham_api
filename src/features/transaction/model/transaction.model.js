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
    paymentId: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer",
      required: true,
    },
    txnType: {
      type: String,
      required: true,
      enum: ["debit", "credit"],
      default: "credit",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
const TransactionModel = mongoose.model("Transaction", transactionSchema);
export default TransactionModel;
