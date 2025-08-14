import AppError from "../../../utils/error.js";
import { httpCode } from "../../../utils/httpCode.js";
import CategoryModel from "../model/category.model.js";
import FreelancerModel from "../../freelancer/model/freelancer.model.js";
const categoryService = {
    cretateCategory: async (data) => {
        try {
            console.log("Creating category with data:", data);
            const { name, description, requestedBy } = data;
            if (!name || !description) {
                throw AppError("Name and description are required", httpCode.BAD_REQUEST);
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
            if (requestedBy === 'freelancer') {
                query.requestedBy = { $exists: true };
            }
            if (requestedBy === 'admin') {
                query.requestedBy = { $exists: false };
            }

       
     
            console.log("Fetching categories with filter:", query);
            const result = await CategoryModel.find(query)
                .populate("requestedBy", "name email")
                .sort({ createdAt: -1 });
            return result;
        } catch (error) {
            console.log("Error fetching categories:", error);

            throw new AppError(`Failed to fetch categories`, httpCode.INTERNAL_SERVER_ERROR);
        }
    },

    getAllActiveCategories: async () => {
        try {
            const result = await CategoryModel.find({ status: 'active' }).select('name description image')
                .sort({ createdAt: -1 });
            return result;
        } catch (error) {
            throw AppError(`Failed to fetch active categories`, httpCode.INTERNAL_SERVER_ERROR);
        }
    },

    getCategoryById: async (id) => {
        try {
            const result = await CategoryModel.findById(id)
                .populate("requestedBy", "name email");
            if (!result) {
                throw AppError(`Category not found`, httpCode.NOT_FOUND);
            }
            return result;
        } catch (error) {
            throw AppError(`Failed to fetch category`, httpCode.INTERNAL_SERVER_ERROR);
        }
    },



    updateCategory: async (id, data) => {
        try {
            const { name, description, status } = data;
            const result = await CategoryModel.findByIdAndUpdate(
                id,
                { name, description, status },
                { new: true }
            );
            if (!result) {
                throw AppError(`Category not found`, httpCode.NOT_FOUND);
            }
            return result;
        } catch (error) {
            throw AppError(`Failed to update category`, httpCode.INTERNAL_SERVER_ERROR);
        }
    },
    deleteCategory: async (id) => {
        try {
            const result = await CategoryModel.findByIdAndDelete(id);
            if (!result) {
                throw AppError(`Category not found`, httpCode.NOT_FOUND);
            }
            return result;
        } catch (error) {
            throw AppError(`Failed to delete category`, httpCode.INTERNAL_SERVER_ERROR);
        }
    },

}

export default categoryService