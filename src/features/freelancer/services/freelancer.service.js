import FreelancerModel from "../model/freelancer.model.js";
import AppError from "../../../utils/error.js";
import { httpCode } from "../../../utils/httpCode.js";
import { generateToken } from "../../../utils/token.config.js";
import { appConfig } from "../../../utils/appConfig.js";
import jobApplicationService from "../../jobs/service/jobApplication.service.js";
import WalletModel from "../../wallet/model/wallet.model.js";
import walletService from "../../wallet/service/wallet.service.js";

const freelancerService = {
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

      const otp = freelancerService.generateOTP();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      let freelancer = await FreelancerModel.findOne({ phone });

      if (!freelancer) {
        freelancer = await FreelancerModel.create({
          name: `Freelancer_${phone.slice(-4)}`, // Temporary name
          phone,
          otp,
          otpExpiry,
        });
      } else {
        freelancer.otp = otp;
        freelancer.otpExpiry = otpExpiry;
        await freelancer.save();
      }

      console.log(`OTP for freelancer ${phone}: ${otp}`);
      return {
        isRegistered: freelancer.isRegistered,
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

  verifyOTP: async (phone, otp) => {
    try {
      if (!phone || !otp) {
        throw new AppError("Phone and OTP are required", httpCode.BAD_REQUEST);
      }

      const freelancer = await FreelancerModel.findOne({ phone });

      if (!freelancer) {
        throw new AppError("Freelancer not found", httpCode.NOT_FOUND);
      }

      // Check if OTP is valid and not expired
      if (freelancer.otp !== otp) {
        throw new AppError("Invalid OTP", httpCode.BAD_REQUEST);
      }

      if (freelancer.otpExpiry < new Date()) {
        throw new AppError("OTP has expired", httpCode.BAD_REQUEST);
      }

      freelancer.otp = undefined;
      freelancer.otpExpiry = undefined;
      await freelancer.save();

      const token = generateToken(
        freelancer._id,
        freelancer.phone,
        "freelancer"
      );
      return { token, isRegistered: freelancer.isRegistered };
    } catch (error) {
      throw error;
    }
  },

  create: async (freelancerData, freelancerId) => {
    try {
      const {
        name,
        email,
        profession,
        summary,
        pricePerHr,
        category,
        skills,
        languages,
        state,
        city,
        pan,
        aadhaar
      } = freelancerData;

      if (!name) {
        throw new AppError("Name is required", httpCode.BAD_REQUEST);
      }

      const freelancer = await FreelancerModel.findById(freelancerId);
      if (freelancer.isRegistered) {
        throw new AppError("You are already registered", httpCode.CONFLICT);
      }
      if (!freelancer) {
        throw new AppError("Freelancer not found", httpCode.NOT_FOUND);
      }

      // Check if email is provided and not already taken
      if (email) {
        const existingFreelancer = await FreelancerModel.findOne({
          email,
          _id: { $ne: freelancerId },
        });
        if (existingFreelancer) {
          throw new AppError("Email already exists", httpCode.CONFLICT);
        }
      }

      // Update freelancer information
      freelancer.name = name;
      freelancer.email = email || freelancer.email;
      freelancer.profession = profession || freelancer.profession;
      freelancer.summary = summary || freelancer.summary;
      freelancer.pricePerHr = pricePerHr || freelancer.pricePerHr;
      freelancer.category = category || freelancer.category;
      freelancer.skills = skills || freelancer.skills;
      freelancer.languages = languages || freelancer.languages;
      freelancer.state = state || freelancer.state;
      freelancer.city = city || freelancer.city;
      freelancer.pan = pan || freelancer.pan;
      freelancer.aadhaar = aadhaar || freelancer.aadhaar
      freelancer.isRegistered = true;
      await freelancer.save();
      const wallet = await walletService.createWallet(freelancer._id);
      freelancer.wallet = wallet;
      await freelancer.save();
      return {
        name: freelancer.name,
        phone: freelancer.phone,
        email: freelancer.email,
        profession: freelancer.profession,
        summary: freelancer.summary,
        pricePerHr: freelancer.pricePerHr,
        skills: freelancer.skills,
        languages: freelancer.languages,
        status: freelancer.status,
        image: freelancer.image,
      };
    } catch (error) {
      throw error;
    }
  },

  getFreelancerCount: async () => {
    try {
      const freelancerCount = await FreelancerModel.countDocuments();
      return freelancerCount;
    } catch (error) {
      throw error;
    }
  },

  getFreelancerById: async (id) => {
    try {
      const result = await FreelancerModel.findById(id)
        .populate({
          path: "category",
          select: "name",
        }).populate({
          path: "wallet",
          select: "balance",
        })
        .select(
          "-isRegistered -status -createdAt -updatedAt"
        )

      if (!result) {
        throw new AppError(`Freelancer not found`, httpCode.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw error;
    }
  },

  getFreelancerStatus: async (id) => {
    try {
      const result = await FreelancerModel.findById(id)
        .populate({
          path: "category",
          select: "name",
        }).populate({
          path: "wallet",
          select: "balance",
        })
        .select(
          "-isRegistered -status -createdAt -updatedAt"
        )

      if (!result) {
        throw new AppError(`Freelancer not found`, httpCode.NOT_FOUND);
      }

      if (result == 'inactive' && result.panImage == '') {
        throw new AppError(`PAN Image not found`, httpCode.NOT_FOUND);
      }

      if (result == 'inactive' && result.aadharImage == '') {
        throw new AppError(`Aadhar Image not found`, httpCode.NOT_FOUND);
      }

      if (result == 'inactive') {
        throw new AppError(`Freelancer is not approved`, httpCode.BAD_REQUEST);
      }
      return 'active';
    } catch (error) {
      throw error;
    }
  },

  getAllFreelancers: async (query) => {
    try {
      const {
        page = 1,
        limit = 10,
        skills,
        minPrice,
        maxPrice,
        city,
        state,
        status,
        sortBy = "createdAt",
      } = query;

      let filter = {};

      if (skills) {
        filter.skills = { $in: skills.split(",") };
      }
      if (minPrice && maxPrice) {
        filter.pricePerHr = {
          $gte: Number(`${minPrice}`),
          $lte: Number(`${maxPrice}`),
        };
      } else if (minPrice) {
        filter.pricePerHr = { $gte: Number(`${minPrice}`) };
      } else if (maxPrice) {
        filter.pricePerHr = { $lte: Number(`${maxPrice}`) };
      }
      if (city) {
        filter.city = { $regex: city, $options: "i" };
      }
      if (state) {
        filter.state = { $regex: state, $options: "i" };
      }

      const skip = (page - 1) * limit;
      const sort = {};
      sort[sortBy] = -1;

      const freelancers = await FreelancerModel.find(filter)
        .populate("category", "name")
        .select(
          "name phone profession summary pricePerHr skills languages image rating state city"
        )
        .sort(sort)
        .skip(skip)
        .limit(Number(limit));

      const total = await FreelancerModel.countDocuments(filter);

      return {
        freelancers,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: Number(limit),
        },
      };
    } catch (error) {
      throw error;
    }
  },

  updateFreelancer: async (id, data) => {
    try {
      const result = await FreelancerModel.findByIdAndUpdate(id, data, {
        new: true,
      }).populate("category", "name");

      if (!result) {
        throw new AppError(`Freelancer not found`, httpCode.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw error;
    }
  },

  deleteFreelancer: async (id) => {
    try {
      if (appConfig.FLAVOUR === "production") {
        throw new AppError(
          `You can't delete freelancer in production`,
          httpCode.BAD_REQUEST
        );
      }

      const result = await FreelancerModel.findByIdAndDelete(id);
      if (!result) {
        throw new AppError(`Freelancer not found`, httpCode.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw error;
    }
  },

  suspendFreelancer: async (id) => {
    try {
      console.log("Suspending freelancer with ID:", id);
      const result = await FreelancerModel.findByIdAndUpdate(id, {
        status: "suspend",
      });
      if (!result) {
        throw new AppError(`Freelancer not found`, httpCode.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw error;
    }
  },

  activateFreelancer: async (id) => {
    try {
      const result = await FreelancerModel.findByIdAndUpdate(id, {
        status: "active",
      });
      if (!result) {
        throw new AppError(`Freelancer not found`, httpCode.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw error;
    }
  },

  searchFreelancer: async (query) => {
    try {
      const { name, skills, profession } = query;
      let searchFilter = { status: "active", isRegistered: true };

      if (name || skills || profession) {
        searchFilter.$or = [];

        if (name) {
          searchFilter.$or.push({ name: { $regex: name, $options: "i" } });
        }
        if (profession) {
          searchFilter.$or.push({
            profession: { $regex: profession, $options: "i" },
          });
        }
        if (skills) {
          searchFilter.$or.push({ skills: { $in: skills.split(",") } });
        }
      }

      const result = await FreelancerModel.find(searchFilter)
        .populate("category", "name")
        .select(
          "name phone profession summary pricePerHr skills languages image rating state city"
        );

      return result;
    } catch (error) {
      throw error;
    }
  },

  // Get jobs applied by freelancer with application status
  getAppliedJobs: async (freelancerId, query = {}) => {
    try {
      return await jobApplicationService.getFreelancerApplications(
        freelancerId,
        query
      );
    } catch (error) {
      throw error;
    }
  },

  // Get freelancer's application statistics
  getApplicationStats: async (freelancerId) => {
    try {
      return await jobApplicationService.getFreelancerApplicationSummary(
        freelancerId
      );
    } catch (error) {
      throw error;
    }
  },

  // Check if freelancer has applied to a specific job
  hasAppliedToJob: async (freelancerId, jobId) => {
    try {
      return await jobApplicationService.hasAppliedToJob(freelancerId, jobId);
    } catch (error) {
      throw error;
    }
  },
};

export default freelancerService;
