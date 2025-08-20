import { formattedResponse } from "../../../utils/formatedRes.js";
import { httpCode } from "../../../utils/httpCode.js";
import jobApplicationService from "../service/jobApplication.service.js";

// Freelancer applies to a job
export const applyToJob = async (req, res, next) => {
  try {
    const freelancerId = req.user.userId;
    const { jobId, proposedRate } = req.body;

    if (!jobId || !proposedRate) {
      return res.status(httpCode.BAD_REQUEST).json(
        formattedResponse("Job ID and proposed rate are required", null, false)
      );
    }

    const applicationData = {
      jobId,
      freelancerId,
      proposedRate
    };

    const result = await jobApplicationService.applyJob(applicationData);
    return res.status(httpCode.CREATED).json(
      formattedResponse("Application submitted successfully", result)
    );
  } catch (error) {
    next(error);
  }
};

// Get freelancer's job applications
export const getMyApplications = async (req, res, next) => {
  try {
    const freelancerId = req.user.userId;
    const result = await jobApplicationService.getFreelancerApplications(freelancerId, req.query);
    return res.status(httpCode.OK).json(
      formattedResponse("Applications fetched successfully", result)
    );
  } catch (error) {
    next(error);
  }
};

// Get applications for a specific job (for employers)
export const getJobApplications = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { jobId } = req.params;

    const result = await jobApplicationService.getJobApplications(jobId, userId);
    return res.status(httpCode.OK).json(
      formattedResponse("Job applications fetched successfully", result)
    );
  } catch (error) {
    next(error);
  }
};

// Update application status (for employers)
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { applicationId } = req.params;
    const { status, notes, interviewScheduled } = req.body;

    if (!status) {
      return res.status(httpCode.BAD_REQUEST).json(
        formattedResponse("Status is required", null, false)
      );
    }

    const validStatuses = ["applied", "shortlisted", "rejected", "hired"];
    if (!validStatuses.includes(status)) {
      return res.status(httpCode.BAD_REQUEST).json(
        formattedResponse("Invalid status. Valid statuses: " + validStatuses.join(", "), null, false)
      );
    }

    const statusData = { status, notes, interviewScheduled };
    const result = await jobApplicationService.updateApplicationStatus(applicationId, statusData, userId);
    
    return res.status(httpCode.OK).json(
      formattedResponse("Application status updated successfully", result)
    );
  } catch (error) {
    next(error);
  }
};

// Withdraw application (for freelancers)
export const withdrawApplication = async (req, res, next) => {
  try {
    const freelancerId = req.user.userId;
    const { applicationId } = req.params;

    const result = await jobApplicationService.withdrawApplication(applicationId, freelancerId);
    return res.status(httpCode.OK).json(
      formattedResponse("Application withdrawn successfully", result)
    );
  } catch (error) {
    next(error);
  }
};

// Get application details
export const getApplicationById = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.userType;
    const { applicationId } = req.params;

    const result = await jobApplicationService.getApplicationById(applicationId, userId, userType);
    return res.status(httpCode.OK).json(
      formattedResponse("Application details fetched successfully", result)
    );
  } catch (error) {
    next(error);
  }
};

// Get application statistics (for freelancers)
export const getApplicationStats = async (req, res, next) => {
  try {
    const freelancerId = req.user.userId;

    // Use the dedicated summary method from the service
    const stats = await jobApplicationService.getFreelancerApplicationSummary(freelancerId);

    return res.status(httpCode.OK).json(
      formattedResponse("Application statistics fetched successfully", stats)
    );
  } catch (error) {
    next(error);
  }
};

// Get application analytics for employers
export const getApplicationAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { jobId } = req.query;

    const result = await jobApplicationService.getJobApplicationAnalytics(userId, jobId);
    return res.status(httpCode.OK).json(
      formattedResponse("Application analytics fetched successfully", result)
    );
  } catch (error) {
    next(error);
  }
};

// Bulk update application status (for admin operations)
export const bulkUpdateApplicationStatus = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.userType;
    const { applicationIds, status, notes } = req.body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(httpCode.BAD_REQUEST).json(
        formattedResponse("Application IDs array is required", null, false)
      );
    }

    if (!status) {
      return res.status(httpCode.BAD_REQUEST).json(
        formattedResponse("Status is required", null, false)
      );
    }

    const statusData = { status, notes };
    const result = await jobApplicationService.bulkUpdateApplicationStatus(
      applicationIds, 
      statusData, 
      userId, 
      userType
    );
    
    return res.status(httpCode.OK).json(
      formattedResponse("Bulk application status update completed", result)
    );
  } catch (error) {
    next(error);
  }
};
