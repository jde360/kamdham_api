import { appConfig } from "../../../utils/appConfig.js";
import AppError from "../../../utils/error.js";
import { httpCode } from "../../../utils/httpCode.js";
import JobModel from "../model/job.model.js";

const jobService = {
  create: async (data) => {
    try {
      const {
        postedBy,
        title,
        description,
        requirements,
        duration,
        city,
        state,
        budget,
        venue,
      } = data;
      data.deadLine = Date.now();
      const result = await JobModel.create(data);
      return result;
    } catch (error) {
      throw error;
    }
  },
  getAllJobs: async () => {
    try {
      const result = await JobModel.find()
        .populate("postedBy", "name email phone")
        .populate("category", "name");
      return result;
    } catch (error) {
      throw error;
    }
  },
  getJobsByState: async (state) => {
    try {
      const result = await JobModel.find({ state, status: "active" })
        .sort({ createdAt: -1 })
        .populate("postedBy", "name email phone")
        .populate("category", "name");
      return result;
    } catch (error) {
      throw error;
    }
  },
  getJobsByCity: async (city) => {
    try {
      const result = await JobModel.find({ city, status: "active" })
        .sort({ createdAt: -1 })
        .populate("postedBy", "name email phone")
        .populate("category", "name");
      return result;
    } catch (error) {
      throw error;
    }
  },
  getJobById: async (id) => {
    try {
      const result = await JobModel.findById(id)
        .populate("postedBy", "name email phone")
        .populate("category", "name");
      return result;
    } catch (error) {
      throw error;
    }
  },
  getJobsByUser: async (userId) => {
    try {
      const result = await JobModel.find({ postedBy: userId });
      return result;
    } catch (error) {
      throw error;
    }
  },

  //get by category
  getByCategory: async (category) => {
    try {
      const result = await JobModel.find({ category });
      return result;
    } catch (error) {
      throw error;
    }
  },
  updateJobById: async (id, data) => {
    try {
      const result = await JobModel.findByIdAndUpdate(id, data, {
        new: true,
      });
      if (!result) {
        throw new AppError(`Job not found`, httpCode.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw error;
    }
  },
  deleteJobById: async (id) => {
    try {
      const flavour = appConfig.FLAVOUR;

      if (flavour === "production") {
        throw new AppError(
          `You can't delete job in production`,
          httpCode.BAD_REQUEST
        );
      }

      const result = await JobModel.findByIdAndDelete(id);
      if (!result) {
        throw new AppError(`Job not found`, httpCode.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw error;
    }
  },


  searchJobs: async (query) => {
    try {
      const { title, category } = query;

      if (!title) {
        throw new AppError("Search title is required", httpCode.BAD_REQUEST);
      }
      const result = await JobModel.find({
        title: { $regex: title, $options: "i" },
      })
        .sort({ createdAt: -1 })
        .populate("postedBy", "name email phone")
        .populate("category", "name");
      return result;
    } catch (error) {
      throw error;
    }
  },
};
export default jobService;
