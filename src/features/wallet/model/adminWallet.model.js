import mongoose from "mongoose";
const adminWalletSchema = new mongoose.Schema({
    totalEarnings: { type: Number, required: true, default: 0.0 },
    totalWithdrawals: { type: Number, required: true, default: 0.0 },
    currentBalance: { type: Number, required: true, default: 0.0 },
    transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }]
}, {
    timestamps: true,
    versionKey: false
});
 const AdminWalletModel = mongoose.model("AdminWallet", adminWalletSchema);
 export default AdminWalletModel