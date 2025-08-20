import AppError from "../../../utils/error.js";
import { httpCode } from "../../../utils/httpCode.js";
import CategoryModel from "../model/category.model.js";
import FreelancerModel from "../../freelancer/model/freelancer.model.js";
import { appConfig } from "../../../utils/appConfig.js";
const categoryService = {
  createCategory: async (data) => {
    try {
      const { name, description, requestedBy } = data;
      if (!name || !description) {
        throw AppError(
          "Name and description are required",
          httpCode.BAD_REQUEST
        );
      }
      const result = await CategoryModel.create({
        name,
        description,
        requestedBy,
      });
      return result;
    } catch (error) {
      throw AppError(`Failed to create category`, httpCode.BAD_REQUEST);
    }
  },
  getAll: async (filter) => {
    try {
      let query = {};
      const { status, requestedBy } = filter;
      if (status) {
        query.status = status;
      }
      if (requestedBy === "freelancer") {
        query.requestedBy = { $ne: null };
      }
      if (requestedBy === "admin") {
        query.requestedBy = null;
      }
      console.log("Fetching categories with filter:", query);
      const result = await CategoryModel.find(query)
        .populate("requestedBy", "name email")
        .sort({ createdAt: -1 });
      return result;
    } catch (error) {
      console.log("Error fetching categories:", error);
      throw error;
    }
  },

  getAllActiveCategories: async () => {
    try {
      const result = await CategoryModel.find({ status: "active" })
        .select("name description image")
        .sort({ createdAt: -1 });
      return result;
    } catch (error) {
      throw error;
    }
  },

  getCategoryById: async (id) => {
    try {
      const result = await CategoryModel.findById(id).populate(
        "requestedBy",
        "name email"
      );
      if (!result) {
        throw new AppError(`Category not found`, httpCode.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw error;
    }
  },

  updateCategory: async (id, data) => {
    try {
      if (Object.keys(data).length === 0) {
        throw new AppError("No data provided", httpCode.BAD_REQUEST);
      }
      const { name, description, status } = data;
      const result = await CategoryModel.findByIdAndUpdate(
        id,
        { name, description, status },
        { new: true }
      );
      if (!result) {
        throw new AppError(`Category not found`, httpCode.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw error;
    }
  },

  searchCategories: async (query) => {
    try {
      const { name } = query;
      if (!name) {
        throw AppError("Search name is required", httpCode.BAD_REQUEST);
      }
      const result = await CategoryModel.find({
        name: { $regex: name, $options: "i" },
      })
        .select("name description image")
        .sort({ createdAt: -1 });
      return result;
    } catch (error) {
      throw AppError(
        "Failed to search categories",
        httpCode.INTERNAL_SERVER_ERROR
      );
    }
  },

  searchActiveCategories: async (query) => {
    try {
      const { name } = query;
      if (!name) {
        throw AppError("Search name is required", httpCode.BAD_REQUEST);
      }
      const result = await CategoryModel.find({
        name: { $regex: name, $options: "i" },
        status: "active",
      })
        .select("name description image")
        .sort({ createdAt: -1 });
      return result;
    } catch (error) {
      throw AppError(
        "Failed to search categories",
        httpCode.INTERNAL_SERVER_ERROR
      );
    }
  },

  getCategoryStats: async () => {
    try {
      const [total, active, inactive, pending] = await Promise.all([
        CategoryModel.countDocuments(),
        CategoryModel.countDocuments({ status: "active" }),
        CategoryModel.countDocuments({ status: "inactive" }),
        CategoryModel.countDocuments({ requestedBy: { $ne: null } }),
      ]);

      return {
        total,
        active,
        inactive,
        pending,
      };
    } catch (error) {
      throw AppError(
        "Failed to get category stats",
        httpCode.INTERNAL_SERVER_ERROR
      );
    }
  },

  deleteCategory: async (id) => {
    try {
      if (appConfig.FLAVOUR === "production") {
        throw new AppError(
          `You can't delete category in production`,
          httpCode.BAD_REQUEST
        );
      }
      const result = await CategoryModel.findByIdAndDelete(id);
      if (!result) {
        throw new AppError(`Category not found`, httpCode.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw error;
    }
  },
};

export default categoryService;
