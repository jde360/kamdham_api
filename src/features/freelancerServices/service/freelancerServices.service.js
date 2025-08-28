import { appConfig } from "../../../utils/appConfig.js";
import AppError from "../../../utils/error.js";
import { FreeLancerServiceModel } from "../model/freelancerService.model.js";

const freelancerServices = {
    getAll: async (status, keyword) => {
        try {
            let filter = {};
            if (status) {
                filter.status = status;
            }
            if (keyword) {
                filter.title = { $regex: keyword, $options: 'i' }; // Case insensitive search
            }
            const result = await FreeLancerServiceModel.find(
                filter
            )
                .populate({path :"freelancer",
                    select: 'name email phone createdAt'
                })
                .populate({
                    path: "category",
                    select: "name"
                })


            return result;
        } catch (error) {
            throw new AppError(error.message)
        }
    },
    getById: async (id) => {
        try {
            const result = await FreeLancerServiceModel.findById(id)    .populate({path :"freelancer",
                    select: 'name email phone createdAt'
                })
                .populate({
                    path: "category",
                    select: "name"
                });
            return result
        } catch (error) {
            throw new AppError(error.message)
        }
    },
    getByCategory: async (categoryId) => {
        try {
            const result = await FreeLancerServiceModel.find({ category: categoryId })    .populate({path :"freelancer",
                    select: 'name email phone createdAt'
                })
                .populate({
                    path: "category",
                    select: "name"
                });
            return result
        } catch (error) {
            throw new AppError(error.message)
        }
    },
    getByFreelancer: async (freelancerId) => {
        try {
            const result = await FreeLancerServiceModel.find({ freelancer: freelancerId })    .populate({path :"freelancer",
                    select: 'name email phone createdAt'
                })
                .populate({
                    path: "category",
                    select: "name"
                });
            return result
        } catch (error) {
            throw new AppError(error.message)
        }
    },
    create: async (data) => {
        try {
            const result = await FreeLancerServiceModel.create(data);
            return result
        } catch (error) {
            throw new AppError(error.message)
        }
    },
    update: async (id, data) => {
        try {
            const result = await FreeLancerServiceModel.findByIdAndUpdate(id, data, { new: true });
            return result
        } catch (error) {
            throw new AppError(error.message)
        }
    },
    delete: async (id) => {
        try {
            if (appConfig.FLAVOUR === "production") {
                throw new AppError("You can't delete in production mode");
            }
            const result = await FreeLancerServiceModel.findByIdAndDelete(id);
            return result
        } catch (error) {
            throw new AppError(error.message)
        }
    }
}
export default freelancerServices