import { formattedResponse } from "../../../utils/formatedRes.js";
import { httpCode } from "../../../utils/httpCode.js";
import { uploadImage } from "../../../utils/image_uploader.js";
import freelancerService from "../services/freelancer.service.js";

export const sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const result = await freelancerService.sendOTP(phone);
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
    const result = await freelancerService.verifyOTP(phone, otp);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("OTP verified successfully", result));
  } catch (error) {
    next(error);
  }
};

export const registerFreelancer = async (req, res, next) => {
  try {
    const freelancerId = req.user.userId;
    const result = await freelancerService.create(req.body, freelancerId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer registered successfully", result));
  } catch (error) {
    next(error);
  }
};

export const getFreelancerById = async (req, res, next) => {
  try {
    // Check if it's an authenticated request for own profile
    const freelancerId = req.user ? req.user.userId : req.params.id;
    const result = await freelancerService.getFreelancerById(freelancerId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

export const getFreelancerStatus = async (req, res, next) => {
  try {
    const freelancerId = req.user.userId;
    const result = await freelancerService.getFreelancerStatus(freelancerId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer status fetched successfully", result));
  } catch (error) {
    next(error);
  }
};
// Get public freelancer profile
export const getFreelancerProfile = async (req, res, next) => {
  try {
    const freelancerId = req.params.id;
    const result = await freelancerService.getFreelancerById(freelancerId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer profile fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

export const getFreelancerCount = async (req, res, next) => {
  try {
    const result = await freelancerService.getFreelancerCount();
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer count fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

export const getAllFreelancers = async (req, res, next) => {
  try {
    const result = await freelancerService.getAllFreelancers(req.query);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancers fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

export const updateFreelancer = async (req, res, next) => {
  try {
    const freelancerId = req.user.userId;
    const result = await freelancerService.updateFreelancer(
      freelancerId,
      req.body
    );
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer updated successfully", result));
  } catch (error) {
    next(error);
  }
};


export const updateAadharImage = async (req, res, next) => {
  try {
    const freelancerId = req.user.userId;
    const freeLancer = await freelancerService.getFreelancerById(freelancerId);
    if (freeLancer.aadharImage) {
      await deleteImage(freeLancer.aadharImage);
    }

    const imageUrl = await uploadImage(req.file, req.file.fieldname, `aadhar-image-${freelancerId}.${req.file.originalname.split('.')[1]}`);
    const result = await freelancerService.updateFreelancer(
      freelancerId,
      { "aadharImage": imageUrl }
    );
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer updated successfully", result));
  } catch (error) {
    next(error);
  }
}


export const updatePanImage = async (req, res, next) => {
  try {
       const freeLancer = await freelancerService.getFreelancerById(freelancerId);
    if (freeLancer.panImage) {
      await deleteImage(freeLancer.aadharImage);
    }
    
    const freelancerId = req.user.userId;
    const imageUrl = await uploadImage(req.file, req.file.fieldname, req.file.filename);
    const result = await freelancerService.updateFreelancer(
      freelancerId,
      { "panImage": imageUrl }
    );

    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer updated successfully", result));
  } catch (error) {
    next(error);
  }
}



export const updateProfileImage = async (req, res, next) => {
  try {
    const freelancerId = req.user.userId;
        const freeLancer = await freelancerService.getFreelancerById(freelancerId);
    if (freeLancer.image) {
      await deleteImage(freeLancer.image);
    }
    const imageUrl = await uploadImage(req.file, req.file.fieldname, req.file.filename);
    const result = await freelancerService.updateFreelancer(
      freelancerId,
      { image: imageUrl }
    );
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer updated successfully", result));
  }
  catch (error) {
    next(error);
  }
}

export const deleteFreelancer = async (req, res, next) => {
  try {
    const freelancerId = req.params.id;
    const result = await freelancerService.deleteFreelancer(freelancerId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer deleted successfully", result));
  } catch (error) {
    next(error);
  }
};

export const activateFreelancer = async (req, res, next) => {
  try {
    const { freelancerId } = req.body;
    const result = await freelancerService.activateFreelancer(freelancerId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer activated successfully", result));
  } catch (error) {
    next(error);
  }
};

export const deactivateFreelancer = async (req, res, next) => {
  try {
    const { freelancerId } = req.body;
    const result = await freelancerService.suspendFreelancer(freelancerId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer deactivated successfully", result));
  } catch (error) {
    next(error);
  }
};

export const searchFreelancers = async (req, res, next) => {
  try {
    const result = await freelancerService.searchFreelancer(req.query);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancers searched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get jobs applied by freelancer
export const getAppliedJobs = async (req, res, next) => {
  try {
    const freelancerId = req.user.userId;
    const result = await freelancerService.getAppliedJobs(freelancerId, req.query);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Applied jobs fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get freelancer's application statistics
export const getFreelancerApplicationStats = async (req, res, next) => {
  try {
    const freelancerId = req.user.userId;
    const result = await freelancerService.getApplicationStats(freelancerId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Application statistics fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Check if freelancer has applied to a specific job
export const checkJobApplication = async (req, res, next) => {
  try {
    const freelancerId = req.user.userId;
    const { jobId } = req.params;
    const result = await freelancerService.hasAppliedToJob(freelancerId, jobId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Job application status checked", result));
  } catch (error) {
    next(error);
  }
};
