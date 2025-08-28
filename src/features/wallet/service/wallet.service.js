import AdminWalletModel from "../model/adminWallet.model.js";
import WalletModel from "../model/wallet.model.js";

const walletService = {
    getWallet: async (userId) => {
        try {
            const wallet = await WalletModel.findOne({ freelancer: userId }).populate('transactions');
            return wallet;
        } catch (error) {
            throw error;
        }
    },

    createWallet: async (userId) => {
        const existingWallet = await WalletModel.findOne({ freelancer: userId });
        if (existingWallet) {
            return existingWallet._id.toString();
        }
        const newWallet = await WalletModel.create({ freelancer: userId });
        return newWallet._id.toString();
    },
    getAdminWallet: async () => {
        try {
            const wallet = await AdminWalletModel.findOne().populate('transactions');
            return wallet;
        } catch (error) {
            throw error;
        }
    },
};
export default walletService;