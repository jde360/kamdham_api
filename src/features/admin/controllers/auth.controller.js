import { formattedResponse } from "../../../utils/formatedRes.js";
import { httpCode } from "../../../utils/httpCode.js";
import adminService from "../services/admin.service.js";

export const createAdmin = async (req, res, next) => {
  try {
    const token = await adminService.create(req.body);
    return res
      .status(httpCode.CREATED)
      .json(formattedResponse("Admin created successfully", token));
  } catch (error) {
    next(error);
  }
};
export const getAllAdmins = async (req, res, next) => {
  try {
    console.log("Fetching all admins");
    const admins = await adminService.getAll();
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Admins fetched successfully", admins));
  } catch (error) {
    next(error);
  }
};

export const getAdminById = async (req, res, next) => {
  try {
    const admin = await adminService.getById(req.params.id);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Admin fetched successfully", admin));
  } catch (error) {
    next(error);
  }
};
export const updateAdmin = async (req, res, next) => {
  try {
    const admin = await adminService.update(req.params.id, req.body);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("password updated successfully", admin));
  } catch (error) {
    next(error);
  }
};
export const deleteAdmin = async (req, res, next) => {
  try {
    const admin = await adminService.delete(req.params.id);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Admin deleted successfully", admin));
  } catch (error) {
    next(error);
  }
};

export const loginAdmin = async (req, res, next) => {
  try {
    const token = await adminService.login(req.body);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Login successful", { token }));
  } catch (error) {
    next(error);
  }
};
