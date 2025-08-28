import { formattedResponse } from "../../../utils/formatedRes.js";
import { httpCode } from "../../../utils/httpCode.js";
import freelancerServices from "../service/freelancerServices.service.js";

// Get all freelancer services
export const getAllFreelancerServices = async (req, res, next) => {
  try {
    const { status, keyword } = req.query;
    const result = await freelancerServices.getAll(status, keyword);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer services fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get freelancer service by ID
export const getFreelancerServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await freelancerServices.getById(id);
    if (!result) {
      return res
        .status(httpCode.NOT_FOUND)
        .json(formattedResponse("Freelancer service not found", null));
    }
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer service fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get freelancer services by category
export const getFreelancerServicesByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const result = await freelancerServices.getByCategory(categoryId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer services by category fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get freelancer services by freelancer ID
export const getFreelancerServicesByFreelancer = async (req, res, next) => {
  try {
    const { freelancerId } = req.params;
    const result = await freelancerServices.getByFreelancer(freelancerId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer services by freelancer fetched successfully", result));
  } catch (error) {
    next(error);
  }
};



// Create new freelancer service
export const createFreelancerService = async (req, res, next) => {
  try {
    const freelancerId = req.user.userId;
    const serviceData = {
      ...req.body,
      freelancer: freelancerId
    };
    const result = await freelancerServices.create(serviceData);
    return res
      .status(httpCode.CREATED)
      .json(formattedResponse("Freelancer service created successfully", result));
  } catch (error) {
    next(error);
  }
};

// Update freelancer service
export const updateFreelancerService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const freelancerId = req.user.userId;
    
    // First check if the service exists and belongs to the freelancer
    const existingService = await freelancerServices.getById(id);
    if (!existingService) {
      return res
        .status(httpCode.NOT_FOUND)
        .json(formattedResponse("Freelancer service not found", null));
    }
    
    // Check if the service belongs to the authenticated freelancer (unless admin)
    if (req.user.role !== 'admin' && existingService.freelancer._id.toString() !== freelancerId) {
      return res
        .status(httpCode.FORBIDDEN)
        .json(formattedResponse("You can only update your own services", null));
    }
    
    const result = await freelancerServices.update(id, req.body);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer service updated successfully", result));
  } catch (error) {
    next(error);
  }
};

// Delete freelancer service
export const deleteFreelancerService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const freelancerId = req.user.userId;
    
    // First check if the service exists and belongs to the freelancer
    const existingService = await freelancerServices.getById(id);
    if (!existingService) {
      return res
        .status(httpCode.NOT_FOUND)
        .json(formattedResponse("Freelancer service not found", null));
    }
    
    // Check if the service belongs to the authenticated freelancer (unless admin)
    if (req.user.userType !== 'admin' && existingService.freelancer._id.toString() !== freelancerId) {
      return res
        .status(httpCode.FORBIDDEN)
        .json(formattedResponse("You can only delete your own services", null));
    }
    
    const result = await freelancerServices.delete(id);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer service deleted successfully", result));
  } catch (error) {
    next(error);
  }
};

// Update service status (admin only)
export const updateServiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'inactive', 'suspend'].includes(status)) {
      return res
        .status(httpCode.BAD_REQUEST)
        .json(formattedResponse("Invalid status. Must be 'active', 'inactive', or 'suspend'", null));
    }
    
    const result = await freelancerServices.update(id, { status });
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Service status updated successfully", result));
  } catch (error) {
    next(error);
  }
};
