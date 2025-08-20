import { formattedResponse } from "../../../utils/formatedRes.js";
import { httpCode } from "../../../utils/httpCode.js";
import userService from "../services/user.service.js";

export const sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;

    const result = await userService.sendOTP(phone);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("OTP sent successfully", result));
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const result = await userService.verifyOTP(phone, otp);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("OTP verified successfully", result));
  } catch (error) {
    next(error);
  }
};

export const registerUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await userService.create(req.body, userId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("User registered successfully", result));
  } catch (error) {
    next(error);
  }
};
export const getUserById = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await userService.getUserById(userId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("User fetched successfully", result));
  } catch (error) {
    next(error);
  }
};
export const getUserCount = async (req, res, next) => {
  try {
    const result = await userService.getUserCount();
    return res
      .status(httpCode.OK)
      .json(formattedResponse("User count fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const result = await userService.getAllUsers();
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Users fetched successfully", result));
  } catch (error) {
    next(error);
  }
};
export const updateUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await userService.updateUser(userId, req.body);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("User updated successfully", result));
  } catch (error) {
    next(error);
  }
};
export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const result = await userService.deleteUser(userId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("User deleted successfully", result));
  } catch (error) {
    next(error);
  }
};

export const activateUser = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const result = await userService.activateUser(userId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("User activated successfully", result));
  } catch (error) {
    next(error);
  }
};
export const deactivateUser = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const result = await userService.suspendUser(userId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("User deactivated successfully", result));
  } catch (error) {
    next(error);
  }
};
export const searchUsers = async (req, res, next) => {
  try {
    const result = await userService.searchUser(req.query);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Users searched successfully", result));
  } catch (error) {
    next(error);
  }
};
