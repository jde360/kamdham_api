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
  },

  {
    timestamps: true,
    versionKey: false,
  }
);
const WalletModel = mongoose.model("wallet", walletSchema);
export default WalletModel;
