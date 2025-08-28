import TransactionModel from "../model/transaction.model.js";

const transactionService = {
    createTransaction: async (transactionData) => {
        try {
            const {
                amount,
                platformFee = amount * 0.1,
                paymentId,
                status,
                user,
                admin,
                freelancer,
                txnType,
            } = transactionData;

            const tnxId = `TNXKD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const transaction = await TransactionModel.create({
                tnxId,
                amount: amount - platformFee,
                platformFee,
                paymentId,
                status,
                user,
                admin,
                freelancer,
                txnType,
            });
            return transaction;
        } catch (error) {
            throw new Error("Error creating transaction: " + error.message);
        }
    },
    getByTnxId: async (tnxId) => {
        try {
            console.log("Fetching transaction with tnxId:", tnxId);
            const res = await TransactionModel.findOne({ tnxId });
            return res;
        } catch (error) {
            throw new Error("Error fetching transaction by tnxId: " + error.message);
        }
    },

    updateStatusByTnxId: async (tnxId, status) => {
        try {
            const validStatuses = ["pending", "completed", "failed", "refunded", "cancelled"];
            if (!validStatuses.includes(status)) {
                throw new Error("Invalid status value");
            }
            const res = await TransactionModel.findOneAndUpdate(
                { tnxId },
                { status },
                { new: true }
            );
            return res;
        } catch (error) {
            throw new Error("Error updating transaction status: " + error.message);
        }
    }

};
export default transactionService;