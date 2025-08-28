import AppError from "../../../utils/error.js";
import { httpCode } from "../../../utils/httpCode.js";
import AdminModel from "../models/admin.model.js";
import { generateToken } from "../../../utils/token.config.js";
import {
  comparePassword,
  hashPassword,
} from "../../../utils/password.config.js";
import AdminWalletModel from "../../wallet/model/adminWallet.model.js";

const adminService = {
  create: async (data) => {
    try {
      const { userName, password } = data;
      if (!userName || !password) {
        throw new AppError(
          "Username and password are required",
          httpCode.BAD_REQUEST
        );
      }
      // Check if admin already exists
      const existAdmin = await adminService.getByUsername(userName);
      if (existAdmin) {
        throw new AppError("Username already exists", httpCode.BAD_REQUEST);
      }
      const hashedPassword = await hashPassword(password);
      let wallet = await AdminModel.findOne().sort({ createdAt: -1 }).select('wallet');
      if (!wallet) {
        wallet = await AdminWalletModel.create({});
      }
      const admin = await AdminModel.create({
        userName,
        password: hashedPassword,
        wallet: wallet._id
      });
      if (!admin) {
        throw new AppError(
          "Failed to create admin",
          httpCode.INTERNAL_SERVER_ERROR
        );
      }
      const token = generateToken(admin._id, admin.email, "admin");
      return token;
    } catch (error) {
      throw new AppError(
        error.message,
        error.statusCode || httpCode.INTERNAL_SERVER_ERROR
      );
    }
  },

  getByUsername: async (userName) => {
    try {
      const admin = await AdminModel.findOne({ userName: userName });
      return admin;
    } catch (error) {
      throw new AppError(error.message, httpCode.INTERNAL_SERVER_ERROR);
    }
  },

  getById: async (id) => {
    try {
      const admin = await AdminModel.findById(id).select("-password").populate('wallet');
      if (!admin) {
        throw new AppError("Admin not found", httpCode.NOT_FOUND);
      }
      return admin;
    } catch (error) {
      throw new AppError(error.message, httpCode.INTERNAL_SERVER_ERROR);
    }
  },

  getAll: async () => {
    try {
      const admins = await AdminModel.find({}).select("-password").populate('wallet');
      return admins;
    } catch (error) {
      throw new AppError(error.message, httpCode.INTERNAL_SERVER_ERROR);
    }
  },

  update: async (id, data) => {
    try {
      const hashedPassword = await hashPassword(data.password);
      const admin = await AdminModel.findByIdAndUpdate(
        id,
        { password: hashedPassword },
        { new: true }
      ).select("-password");
      if (!admin) {
        throw new AppError("Admin not found", httpCode.NOT_FOUND);
      }
      return admin;
    } catch (error) {
      throw new AppError(error.message, httpCode.INTERNAL_SERVER_ERROR);
    }
  },

  delete: async (id) => {
    try {
      const admin = await AdminModel.findByIdAndDelete(id);
      if (!admin) {
        throw new AppError("Admin not found", httpCode.NOT_FOUND);
      }
      return { message: "Admin deleted successfully" };
    } catch (error) {
      throw new AppError(error.message, httpCode.INTERNAL_SERVER_ERROR);
    }
  },

  login: async (data) => {
    try {
      const { userName, password } = data;
      if (!userName || !password) {
        throw new AppError(
          "Username and password are required",
          httpCode.BAD_REQUEST
        );
      }
      const admin = await AdminModel.findOne({ userName });
      if (!admin) {
        throw new AppError("Admin not found", httpCode.NOT_FOUND);
      }
      const isPasswordValid = await comparePassword(password, admin.password);
      if (!isPasswordValid) {
        throw new AppError("Invalid password", httpCode.UNAUTHORIZED);
      }
      const token = generateToken(admin._id, admin.userName, "admin");
      return token;
    } catch (error) {
      throw new AppError(
        error.message,
        error.statusCode || httpCode.INTERNAL_SERVER_ERROR
      );
    }
  },
};
export default adminService;
