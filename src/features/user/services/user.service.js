import UserModel from "../model/user.model.js";
import AppError from "../../../utils/error.js";
import { httpCode } from "../../../utils/httpCode.js";
import jwt from "jsonwebtoken";
import { appConfig } from "../../../utils/appConfig.js";
import { generateToken } from "../../../utils/token.config.js";

const userService = {
  generateOTP: () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  sendOTP: async (phone) => {
    try {
      if (!phone) {
        throw new AppError("Phone number is required", httpCode.BAD_REQUEST);
      }
      if (phone.length !== 10) {
        throw new AppError("Invalid phone number", httpCode.BAD_REQUEST);
      }

      const otp = userService.generateOTP();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      let user = await UserModel.findOne({ phone });
      let isNew = false;

      if (!user) {
        user = await UserModel.create({
          name: `User_${phone.slice(-4)}`, // Temporary name
          phone,
          otp,
          otpExpiry,
          isRegistered: false,
        });
      } else {
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();
      }
      console.log(`OTP for ${phone}: ${otp}`);
      return {
        isRegistered: user.isRegistered,
        phone,
        ...(appConfig.FLAVOUR === "development" && { otp }),
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new AppError("Phone number already exists", httpCode.CONFLICT);
      }
      throw error;
    }
  },

  // Verify OTP and login
  verifyOTP: async (phone, otp) => {
    try {
      if (!phone || !otp) {
        throw new AppError("Phone and OTP are required", httpCode.BAD_REQUEST);
      }

      const user = await UserModel.findOne({ phone });

      if (!user) {
        throw new AppError("User not found", httpCode.NOT_FOUND);
      }

      // Check if OTP is valid and not expired
      if (user.otp !== otp) {
        throw new AppError("Invalid OTP", httpCode.BAD_REQUEST);
      }

      if (user.otpExpiry < new Date()) {
        throw new AppError("OTP has expired", httpCode.BAD_REQUEST);
      }

      // Mark as registered on first successful verification
      if (!user.isRegistered) {
        user.isRegistered = true;
      }

      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();

      const token = generateToken(user._id, user.phone, "user");
      return token;
    } catch (error) {
      throw error;
    }
  },

  // Complete user registration
  create: async (userData, userId) => {
    try {
      const { name, email } = userData;

      if (!name) {
        throw new AppError("Name is required", httpCode.BAD_REQUEST);
      }

      const user = await UserModel.findById(userId);

      if (!user) {
        throw new AppError("User not found", httpCode.NOT_FOUND);
      }

      // Check if email is provided and not already taken
      if (email) {
        const existingUser = await UserModel.findOne({
          email,
          _id: { $ne: userId },
        });
        if (existingUser) {
          throw new AppError("Email already exists", httpCode.CONFLICT);
        }
      }
      // Update user information
      user.name = name;
      user.email = email || user.email;
      user.isRegistered = true;
      await user.save();
      return {
        name: user.name,
        phone: user.phone,
        email: user.email,
        image: user.image,
      };
    } catch (error) {
      throw error;
    }
  },

  getUserCount: async () => {
    try {
      const userCount = await UserModel.countDocuments();
      return userCount;
    } catch (error) {
      throw error;
    }
  },
  getUserById: async (id) => {
    try {
      const result = await UserModel.findById(id).select(
        "name email phone image status isRegistered"
      );
      if (!result) {
        throw new AppError(`User not found`, httpCode.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw error;
    }
  },

  updateUser: async (id, data) => {
    try {
      const result = await UserModel.findByIdAndUpdate(id, data, {
        new: true,
      });
      if (!result) {
        throw new AppError(`User not found`, httpCode.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      if (appConfig.FLAVOUR === "production") {
        throw new AppError(
          `You can't delete user in production`,
          httpCode.BAD_REQUEST
        );
      }

      const result = await UserModel.findByIdAndDelete(id);
      if (!result) {
        throw new AppError(`User not found`, httpCode.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw error;
    }
  },

  suspendUser: async (id) => {
    try {
      console.log("Suspending user with ID:", id);
      const result = await UserModel.findByIdAndUpdate(id, {
        status: "suspended",
      });
      if (!result) {
        throw new AppError(`User not found`, httpCode.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw error;
    }
  },

  activateUser: async (id) => {
    try {
      const result = await UserModel.findByIdAndUpdate(id, {
        status: "active",
      });
      if (!result) {
        throw new AppError(`User not found`, httpCode.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw error;
    }
  },

  searchUser: async (query) => {
    try {
      const { name } = query;
      const result = await UserModel.find({
        $or: [{ name: { $regex: name, $options: "i" } }],
      });
      return result;
    } catch (error) {
      throw error;
    }
  },
};

export default userService;
