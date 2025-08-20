import { formattedResponse } from "../../../utils/formatedRes.js";
import { httpCode } from "../../../utils/httpCode.js";
import categoryService from "../service/category.service.js";

export const createCategory = async (req, res, next) => {
  try {
    let data = req.body;
    if (req.user.userType == "freelancer") {
      data.requestedBy = req.user._id;
    } else {
      data.requestedBy = null;
    }
    const result = await categoryService.cretateCategory(data);
    return res
      .status(httpCode.CREATED)
      .json(formattedResponse("Category created successfully", result));
  } catch (error) {
    next(error);
  }
};
export const getAllCategories = async (req, res, next) => {
  try {
    const result = await categoryService.getAll(req.query);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Categories fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

export const getAllActiveCategories = async (req, res, next) => {
  try {
    const result = await categoryService.getAllActiveCategories();
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Categories fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const result = await categoryService.getCategoryById(req.params.id);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Category fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

export const searchCategories = async (req, res, next) => {
  try {
    const result = await categoryService.searchCategories(req.query);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Categories searched successfully", result));
  } catch (error) {
    next(error);
  }
};

export const searchActiveCategories = async (req, res, next) => {
  try {
    const result = await categoryService.searchActiveCategories(req.query);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Categories searched successfully", result));
  } catch (error) {
    next(error);
  }
};

export const getCategoryStats = async (req, res, next) => {
  try {
    const result = await categoryService.getCategoryStats();
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Category stats fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const result = await categoryService.updateCategory(
      req.params.id,
      req.body
    );
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Category updated successfully", result));
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Category deleted successfully", result));
  } catch (error) {
    next(error);
  }
};
