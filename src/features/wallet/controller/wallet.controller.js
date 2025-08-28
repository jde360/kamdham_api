import { httpCode } from "../../../utils/httpCode.js";
import walletService from "../service/wallet.service.js";

export const getWallet = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const wallet = await walletService.getWallet(userId);
        res.status(200).json({ wallet });
    } catch (error) {
        next(error);
    }
}
export const getAdminWallet = async (req, res, next) => {
    try {
        const wallet = await walletService.getAdminWallet();
        res.status(200).json({ wallet });
    } catch (error) {
        next(error);
    }
}