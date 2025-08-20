import JobModel from "../model/job.model.js";
import JobApplicationModel from "../model/jobApplication.model.js";
import AppError from "../../../utils/error.js";
import { httpCode } from "../../../utils/httpCode.js";

const jobApplicationService = {
  applyJob: async (applicationData) => {
    try {
      const { jobId, freelancerId, proposedRate } = applicationData;

      // Validate required fields
      if (!jobId || !freelancerId || !proposedRate) {
        throw new AppError(
          `Job ID, freelancer ID, and proposed rate are required`,
          httpCode.BAD_REQUEST
        );
      }

      const job = await JobModel.findOne({ _id: jobId, status: "active" });
      if (!job) {
        throw new AppError(
          `Job not found or no longer active`,
          httpCode.NOT_FOUND
        );
      }

      // Check if freelancer already applied
      const existingApplication = await JobApplicationModel.findOne({
        job: jobId,
        freelancer: freelancerId,
      });

      if (existingApplication) {
        throw new AppError(
          `You have already applied for this job`,
          httpCode.BAD_REQUEST
        );
      }

      // Create job application
      const application = await JobApplicationModel.create({
        job: jobId,
        freelancer: freelancerId,
        proposedRate,
        statusHistory: [
          {
            status: "applied",
            changedBy: freelancerId,
            changedByModel: "Freelancer",
            notes: "Initial application submitted",
          },
        ],
      });

      // Update job's applicant array
      await JobModel.findByIdAndUpdate(jobId, {
        $addToSet: { applicant: freelancerId },
      });

      return application;
    } catch (error) {
      throw error;
    }
  },

  // Get all applications for a specific job (for employers)
  getJobApplications: async (jobId, userId) => {
    try {
      // Verify job belongs to the user
      const job = await JobModel.findOne({ _id: jobId, postedBy: userId });
      if (!job) {
        throw new AppError(
          `Job not found or access denied`,
          httpCode.FORBIDDEN
        );
      }

      const applications = await JobApplicationModel.find({ job: jobId })
        .populate(
          "freelancer",
          "name phone email profession skills image rating state city"
        )
        .populate({
          path: "freelancer",
          populate: {
            path: "category",
            select: "name",
          },
        })
        .sort({ appliedAt: -1 });

      return {
        job: {
          _id: job._id,
          title: job.title,
          description: job.description,
          budget: job.budget,
          duration: job.duration,
          totalApplications: applications.length,
        },
        applications,
      };
    } catch (error) {
      throw error;
    }
  },

  // Get applications by freelancer
  getFreelancerApplications: async (freelancerId, query = {}) => {
    try {
      const {
        status,
        page = 1,
        limit = 10,
        sortBy = "appliedAt",
        sortOrder = "desc",
      } = query;
      let filter = { freelancer: freelancerId };

      if (status) {
        filter.status = status;
      }

      const skip = (page - 1) * limit;
      const sort = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      const applications = await JobApplicationModel.find(filter)
        .populate({
          path: "job",
          select:
            "title description budget duration city state status postedBy category deadLine",
          populate: [
            {
              path: "postedBy",
              select: "name email phone",
            },
            {
              path: "category",
              select: "name",
            },
          ],
        })
        .sort(sort)
        .skip(skip)
        .limit(Number(limit));

      const total = await JobApplicationModel.countDocuments(filter);

      return {
        applications,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: Number(limit),
        },
        summary: await jobApplicationService.getFreelancerApplicationSummary(
          freelancerId
        ),
      };
    } catch (error) {
      throw error;
    }
  },

  // Get freelancer application summary/statistics
  getFreelancerApplicationSummary: async (freelancerId) => {
    try {
      const applications = await JobApplicationModel.find({
        freelancer: freelancerId,
      });

      const summary = {
        total: applications.length,
        applied: applications.filter((app) => app.status === "applied").length,
        shortlisted: applications.filter((app) => app.status === "shortlisted")
          .length,
        hired: applications.filter((app) => app.status === "hired").length,
        rejected: applications.filter((app) => app.status === "rejected")
          .length,
        withdrawn: applications.filter((app) => app.status === "withdrawn")
          .length,
      };

      // Calculate success rates
      summary.hireRate =
        summary.total > 0
          ? ((summary.hired / summary.total) * 100).toFixed(2)
          : 0;
      summary.shortlistRate =
        summary.total > 0
          ? ((summary.shortlisted / summary.total) * 100).toFixed(2)
          : 0;
      summary.responseRate =
        summary.total > 0
          ? (
              ((summary.shortlisted + summary.rejected + summary.hired) /
                summary.total) *
              100
            ).toFixed(2)
          : 0;

      // Get recent activity
      const recentApplications = applications
        .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
        .slice(0, 5)
        .map((app) => ({
          jobTitle: app.job?.title || "Unknown Job",
          status: app.status,
          appliedAt: app.appliedAt,
          lastUpdated: app.lastUpdated,
        }));

      summary.recentActivity = recentApplications;

      return summary;
    } catch (error) {
      throw error;
    }
  },

  // Update application status (for employers)
  updateApplicationStatus: async (applicationId, statusData, userId) => {
    try {
      const { status, notes } = statusData;

      const application = await JobApplicationModel.findById(
        applicationId
      ).populate("job", "postedBy title");

      if (!application) {
        throw new AppError(`Application not found`, httpCode.NOT_FOUND);
      }

      // Verify the user owns the job
      if (application.job.postedBy.toString() !== userId) {
        throw new AppError(`Access denied`, httpCode.FORBIDDEN);
      }

      // Validate status transition
      const validTransitions = {
        applied: ["shortlisted", "rejected"],
        shortlisted: ["hired", "rejected"],
        rejected: [], // Final state
        hired: [], // Final state
        withdrawn: [], // Final state
      };

      if (!validTransitions[application.status].includes(status)) {
        throw new AppError(
          `Invalid status transition from ${application.status} to ${status}`,
          httpCode.BAD_REQUEST
        );
      }

      // Update application
      application.status = status;
      application.employerNotes = notes || application.employerNotes;

      // Add to status history
      application.statusHistory.push({
        status,
        changedBy: userId,
        changedByModel: "User",
        notes: notes || `Status changed to ${status}`,
      });

      await application.save();

      // If hired or shortlisted, update job's shortListed array
      if (status === "shortlisted" || status === "hired") {
        await JobModel.findByIdAndUpdate(application.job._id, {
          $addToSet: { shortListed: application.freelancer },
        });
      }

      // If rejected after being shortlisted, remove from shortListed array
      if (
        status === "rejected" &&
        application.statusHistory.some((h) => h.status === "shortlisted")
      ) {
        await JobModel.findByIdAndUpdate(application.job._id, {
          $pull: { shortListed: application.freelancer },
        });
      }

      const result = await JobApplicationModel.findById(application._id)
        .populate("job", "title description budget duration city state")
        .populate("freelancer", "name phone email profession skills image");

      return result;
    } catch (error) {
      throw error;
    }
  },

  // Withdraw application (for freelancers)
  withdrawApplication: async (applicationId, freelancerId) => {
    try {
      const application = await JobApplicationModel.findOne({
        _id: applicationId,
        freelancer: freelancerId,
      });

      if (!application) {
        throw new AppError(`Application not found`, httpCode.NOT_FOUND);
      }

      if (application.status === "withdrawn") {
        throw new AppError(
          `Application already withdrawn`,
          httpCode.BAD_REQUEST
        );
      }

      // Don't allow withdrawal if already hired
      if (application.status === "hired") {
        throw new AppError(
          `Cannot withdraw application after being hired`,
          httpCode.BAD_REQUEST
        );
      }

      application.status = "withdrawn";
      application.statusHistory.push({
        status: "withdrawn",
        changedBy: freelancerId,
        changedByModel: "Freelancer",
        notes: "Application withdrawn by freelancer",
      });

      await application.save();

      // Remove from job's applicant and shortListed arrays
      await JobModel.findByIdAndUpdate(application.job, {
        $pull: {
          applicant: freelancerId,
          shortListed: freelancerId,
        },
      });

      return application;
    } catch (error) {
      throw error;
    }
  },

  // Get application details
  getApplicationById: async (applicationId, userId, userType) => {
    try {
      const application = await JobApplicationModel.findById(applicationId)
        .populate({
          path: "job",
          select:
            "title description budget duration city state postedBy category deadLine",
          populate: [
            {
              path: "postedBy",
              select: "name email phone",
            },
            {
              path: "category",
              select: "name",
            },
          ],
        })
        .populate(
          "freelancer",
          "name phone email profession skills image rating state city"
        );

      if (!application) {
        throw new AppError(`Application not found`, httpCode.NOT_FOUND);
      }

      // Check access rights
      const isFreelancer =
        userType === "freelancer" &&
        application.freelancer._id.toString() === userId;
      const isEmployer =
        userType === "user" &&
        application.job.postedBy._id.toString() === userId;
      const isAdmin = userType === "admin";

      if (!isFreelancer && !isEmployer && !isAdmin) {
        throw new AppError(`Access denied`, httpCode.FORBIDDEN);
      }

      return application;
    } catch (error) {
      throw error;
    }
  },

  // Check if freelancer has applied to a specific job
  hasAppliedToJob: async (freelancerId, jobId) => {
    try {
      const application = await JobApplicationModel.findOne({
        freelancer: freelancerId,
        job: jobId,
      });

      return {
        hasApplied: !!application,
        application: application
          ? {
              id: application._id,
              status: application.status,
              appliedAt: application.appliedAt,
              proposedRate: application.proposedRate,
              lastUpdated: application.lastUpdated,
            }
          : null,
      };
    } catch (error) {
      throw error;
    }
  },

  // Get applications by status (for analytics)
  getApplicationsByStatus: async (filters = {}) => {
    try {
      const { status, jobId, freelancerId, startDate, endDate } = filters;
      let matchQuery = {};

      if (status) matchQuery.status = status;
      if (jobId) matchQuery.job = jobId;
      if (freelancerId) matchQuery.freelancer = freelancerId;
      if (startDate || endDate) {
        matchQuery.appliedAt = {};
        if (startDate) matchQuery.appliedAt.$gte = new Date(startDate);
        if (endDate) matchQuery.appliedAt.$lte = new Date(endDate);
      }

      const applications = await JobApplicationModel.find(matchQuery)
        .populate("job", "title budget duration")
        .populate("freelancer", "name profession")
        .sort({ appliedAt: -1 });

      return applications;
    } catch (error) {
      throw error;
    }
  },

  // Get application analytics for employers
  getJobApplicationAnalytics: async (userId, jobId = null) => {
    try {
      let jobFilter = { postedBy: userId };
      if (jobId) {
        jobFilter._id = jobId;
      }

      const jobs = await JobModel.find(jobFilter).select("_id");
      const jobIds = jobs.map((job) => job._id);

      const applications = await JobApplicationModel.find({
        job: { $in: jobIds },
      });

      const analytics = {
        totalApplications: applications.length,
        statusBreakdown: {
          applied: applications.filter((app) => app.status === "applied")
            .length,
          shortlisted: applications.filter(
            (app) => app.status === "shortlisted"
          ).length,
          hired: applications.filter((app) => app.status === "hired").length,
          rejected: applications.filter((app) => app.status === "rejected")
            .length,
          withdrawn: applications.filter((app) => app.status === "withdrawn")
            .length,
        },
        averageProposedRate: 0,
        applicationTrends: {},
      };

      // Calculate average proposed rate
      if (applications.length > 0) {
        const totalRate = applications.reduce(
          (sum, app) => sum + app.proposedRate,
          0
        );
        analytics.averageProposedRate = (
          totalRate / applications.length
        ).toFixed(2);
      }

      // Calculate conversion rates
      analytics.conversionRates = {
        applicationToShortlist:
          analytics.totalApplications > 0
            ? (
                (analytics.statusBreakdown.shortlisted /
                  analytics.totalApplications) *
                100
              ).toFixed(2)
            : 0,
        shortlistToHire:
          analytics.statusBreakdown.shortlisted > 0
            ? (
                (analytics.statusBreakdown.hired /
                  analytics.statusBreakdown.shortlisted) *
                100
              ).toFixed(2)
            : 0,
        overallHireRate:
          analytics.totalApplications > 0
            ? (
                (analytics.statusBreakdown.hired /
                  analytics.totalApplications) *
                100
              ).toFixed(2)
            : 0,
      };

      return analytics;
    } catch (error) {
      throw error;
    }
  },

  // Bulk update application status (for admin operations)
  bulkUpdateApplicationStatus: async (
    applicationIds,
    statusData,
    userId,
    userType
  ) => {
    try {
      if (userType !== "admin" && userType !== "user") {
        throw new AppError(
          `Insufficient permissions for bulk operations`,
          httpCode.FORBIDDEN
        );
      }

      const results = [];

      for (const applicationId of applicationIds) {
        try {
          const result = await jobApplicationService.updateApplicationStatus(
            applicationId,
            statusData,
            userId
          );
          results.push({ applicationId, success: true, data: result });
        } catch (error) {
          results.push({
            applicationId,
            success: false,
            error: error.message,
          });
        }
      }

      return {
        totalProcessed: applicationIds.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };
    } catch (error) {
      throw error;
    }
  },
};

export default jobApplicationService;
