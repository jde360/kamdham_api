import AppError from "../../../utils/error.js";
import { formattedResponse } from "../../../utils/formatedRes.js";
import { httpCode } from "../../../utils/httpCode.js";
import serviceApplications from "../service/serviceApplications.service.js";

// Apply for a freelancer service (Client/User)
export const applyForService = async (req, res, next) => {
  try {
    const clientId = req.user.userId;
    const { serviceId, paymentType, bookingAmount, scheduledDate, scheduledTime, additionalNotes } = req.body;
    const applicationData = {
      service: serviceId,
      client: clientId,
      paymentType,
      bookingAmount,
      scheduledDate,
      scheduledTime,
      additionalNotes: additionalNotes || "",
    };
    const result = await serviceApplications.create(applicationData);
    return res
      .status(httpCode.CREATED)
      .json(formattedResponse("Service application submitted successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get all applications for a freelancer's services (Freelancer)
export const getFreelancerApplications = async (req, res, next) => {
  try {
    const freelancerId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const result = await serviceApplications.getByFreelancer(freelancerId, status, parseInt(page), parseInt(limit));
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer applications fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get all applications made by a client (Client/User)
export const getClientApplications = async (req, res, next) => {
  try {
    const clientId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const result = await serviceApplications.getByClient(clientId, status, parseInt(page), parseInt(limit));
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Your applications fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get application by ID
export const getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userType = req.user.userType;

    const result = await serviceApplications.getById(id);
    if (!result) {
      return res
        .status(httpCode.NOT_FOUND)
        .json(formattedResponse("Application not found", null));
    }

    // Check if user has permission to view this application
    const isClient = result.client._id.toString() === userId;
    const isFreelancer = result.service.freelancer._id.toString() === userId;
    const isAdmin = userType === 'admin';

    if (!isClient && !isFreelancer && !isAdmin) {
      return res
        .status(httpCode.FORBIDDEN)
        .json(formattedResponse("You don't have permission to view this application", null));
    }

    return res
      .status(httpCode.OK)
      .json(formattedResponse("Application fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Update application status (Freelancer only for their services)
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, freelancerNotes } = req.body;
    const freelancerId = req.user.userId;

    // Validate status
    if (!['accepted', 'rejected', 'hired', 'completed'].includes(status)) {
      return res
        .status(httpCode.BAD_REQUEST)
        .json(formattedResponse("Invalid status. Must be 'accepted', 'rejected', 'hired', or 'completed'", null));
    }

    const result = await serviceApplications.updateStatus(id, status, freelancerId, freelancerNotes);
    if (!result.success) {
      return res
        .status(httpCode.BAD_REQUEST)
        .json(formattedResponse(result.message, null));
    }

    return res
      .status(httpCode.OK)
      .json(formattedResponse("Application status updated successfully", result.data));
  } catch (error) {
    next(error);
  }
};
export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const clientId = req.user.userId;
    const { paymentStatus, txnId } = req.body;
    // Validate status
    if (!["completed", "failed", "refunded", "cancelled"].includes(paymentStatus)) {
      throw new AppError("Invalid payment status. Must be 'pay after service', 'completed', 'failed', 'refunded', or 'cancelled'", httpCode.BAD_REQUEST);
    }
    const result = await serviceApplications.updatePaymentStatus(id, clientId, paymentStatus, txnId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Payment status updated successfully", result));
  } catch (error) {
    next(error);
  }
};

// Withdraw application (Client only)
export const withdrawApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const clientId = req.user.userId;
    const result = await serviceApplications.withdraw(id, clientId);
    if (!result.success) {
      return res
        .status(httpCode.BAD_REQUEST)
        .json(formattedResponse(result.message, null));
    }

    return res
      .status(httpCode.OK)
      .json(formattedResponse("Application withdrawn successfully", result.data));
  } catch (error) {
    next(error);
  }
};

// Get application statistics for freelancer
export const getFreelancerApplicationStats = async (req, res, next) => {
  try {
    const freelancerId = req.user.userId;
    const result = await serviceApplications.getFreelancerStats(freelancerId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Application statistics fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get application statistics for client
export const getClientApplicationStats = async (req, res, next) => {
  try {
    const clientId = req.user.userId;
    const result = await serviceApplications.getClientStats(clientId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Application statistics fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get all applications (Admin only)
export const getAllApplications = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const result = await serviceApplications.getAll(status, parseInt(page), parseInt(limit), sortBy, sortOrder);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("All applications fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get application analytics (Admin only)
export const getApplicationAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await serviceApplications.getAnalytics(startDate, endDate);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Application analytics fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Complete service (Mark as completed by freelancer)
export const completeService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const freelancerId = req.user.userId;
    const { completionNotes } = req.body;
    const result = await serviceApplications.completeService(id, freelancerId, completionNotes);
    if (!result.success) {
      return res
        .status(httpCode.BAD_REQUEST)
        .json(formattedResponse(result.message, null));
    }

    return res
      .status(httpCode.OK)
      .json(formattedResponse("Service marked as completed successfully", result.data));
  } catch (error) {
    next(error);
  }
};
