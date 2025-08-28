import mongoose from "mongoose";
const walletSchema = new mongoose.Schema(
  {
    balance: {
      type: Number,
      default: 0.0,
    },
    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer",
      required: true,
      unique: true,
    },
  },

  {
    timestamps: true,
    versionKey: false,
  }
);
const WalletModel = mongoose.model("Wallet", walletSchema);
export default WalletModel;
