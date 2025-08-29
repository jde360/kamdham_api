import UserModel from "../../user/model/user.model.js";
import FreelancerModel from "../../freelancer/model/freelancer.model.js";
import { FreelancerServiceApplicationModel } from "../../freelancerServices/model/freelancerServiceApplication.model.js";
import AppError from "../../../utils/error.js";
import { httpCode } from "../../../utils/httpCode.js";

const analyticsService = {
  // Get monthly growth data for a specific period
  getMonthlyGrowth: async (startDate, endDate) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new AppError("Invalid date format", httpCode.BAD_REQUEST);
      }

      if (start >= end) {
        throw new AppError("Start date must be before end date", httpCode.BAD_REQUEST);
      }

      // Get monthly freelancer registrations
      const freelancerGrowth = await analyticsService.getFreelancerMonthlyGrowth(start, end);
      
      // Get monthly employer (user) registrations
      const employerGrowth = await analyticsService.getEmployerMonthlyGrowth(start, end);
      
      // Get monthly booking statistics
      const bookingGrowth = await analyticsService.getBookingMonthlyGrowth(start, end);

      return {
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        },
        freelancerGrowth,
        employerGrowth,
        bookingGrowth,
        summary: {
          totalFreelancers: freelancerGrowth.reduce((sum, item) => sum + item.count, 0),
          totalEmployers: employerGrowth.reduce((sum, item) => sum + item.count, 0),
          totalBookings: bookingGrowth.reduce((sum, item) => sum + item.count, 0),
          totalRevenue: bookingGrowth.reduce((sum, item) => sum + item.revenue, 0)
        }
      };
    } catch (error) {
      throw error;
    }
  },

  // Get freelancer monthly growth
  getFreelancerMonthlyGrowth: async (startDate, endDate) => {
    try {
      const freelancerStats = await FreelancerModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 },
            activeFreelancers: {
              $sum: {
                $cond: [{ $eq: ["$status", "active"] }, 1, 0]
              }
            },
            registeredFreelancers: {
              $sum: {
                $cond: ["$isRegistered", 1, 0]
              }
            }
          }
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1
          }
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            monthName: {
              $arrayElemAt: [
                ["", "January", "February", "March", "April", "May", "June",
                 "July", "August", "September", "October", "November", "December"],
                "$_id.month"
              ]
            },
            count: 1,
            activeFreelancers: 1,
            registeredFreelancers: 1
          }
        }
      ]);

      return freelancerStats;
    } catch (error) {
      throw error;
    }
  },

  // Get employer (user) monthly growth
  getEmployerMonthlyGrowth: async (startDate, endDate) => {
    try {
      const employerStats = await UserModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 },
            activeEmployers: {
              $sum: {
                $cond: [{ $eq: ["$status", "active"] }, 1, 0]
              }
            },
            registeredEmployers: {
              $sum: {
                $cond: ["$isRegistered", 1, 0]
              }
            }
          }
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1
          }
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            monthName: {
              $arrayElemAt: [
                ["", "January", "February", "March", "April", "May", "June",
                 "July", "August", "September", "October", "November", "December"],
                "$_id.month"
              ]
            },
            count: 1,
            activeEmployers: 1,
            registeredEmployers: 1
          }
        }
      ]);

      return employerStats;
    } catch (error) {
      throw error;
    }
  },

  // Get booking monthly growth
  getBookingMonthlyGrowth: async (startDate, endDate) => {
    try {
      const bookingStats = await FreelancerServiceApplicationModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 },
            revenue: { $sum: "$bookingAmount" },
            completedBookings: {
              $sum: {
                $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
              }
            },
            pendingBookings: {
              $sum: {
                $cond: [{ $eq: ["$status", "pending"] }, 1, 0]
              }
            },
            acceptedBookings: {
              $sum: {
                $cond: [{ $eq: ["$status", "accepted"] }, 1, 0]
              }
            },
            rejectedBookings: {
              $sum: {
                $cond: [{ $eq: ["$status", "rejected"] }, 1, 0]
              }
            }
          }
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1
          }
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            monthName: {
              $arrayElemAt: [
                ["", "January", "February", "March", "April", "May", "June",
                 "July", "August", "September", "October", "November", "December"],
                "$_id.month"
              ]
            },
            count: 1,
            revenue: 1,
            completedBookings: 1,
            pendingBookings: 1,
            acceptedBookings: 1,
            rejectedBookings: 1,
            averageBookingValue: {
              $cond: [
                { $gt: ["$count", 0] },
                { $divide: ["$revenue", "$count"] },
                0
              ]
            }
          }
        }
      ]);

      return bookingStats;
    } catch (error) {
      throw error;
    }
  },

  // Get current year monthly growth (default endpoint)
  getCurrentYearGrowth: async () => {
    try {
      const currentYear = new Date().getFullYear();
      const startDate = new Date(currentYear, 0, 1); // January 1st
      const endDate = new Date(currentYear, 11, 31, 23, 59, 59); // December 31st

      return await analyticsService.getMonthlyGrowth(startDate, endDate);
    } catch (error) {
      throw error;
    }
  },

  // Get last N months growth
  getLastNMonthsGrowth: async (months = 12) => {
    try {
      if (months <= 0 || months > 24) {
        throw new AppError("Months must be between 1 and 24", httpCode.BAD_REQUEST);
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - months);

      return await analyticsService.getMonthlyGrowth(startDate, endDate);
    } catch (error) {
      throw error;
    }
  },

  // Get overall platform statistics
  getOverallStats: async () => {
    try {
      const [
        totalFreelancers,
        activeFreelancers,
        totalEmployers,
        activeEmployers,
        totalBookings,
        completedBookings,
        totalRevenue
      ] = await Promise.all([
        FreelancerModel.countDocuments(),
        FreelancerModel.countDocuments({ status: "active" }),
        UserModel.countDocuments(),
        UserModel.countDocuments({ status: "active" }),
        FreelancerServiceApplicationModel.countDocuments(),
        FreelancerServiceApplicationModel.countDocuments({ status: "completed" }),
        FreelancerServiceApplicationModel.aggregate([
          { $group: { _id: null, total: { $sum: "$bookingAmount" } } }
        ]).then(result => result[0]?.total || 0)
      ]);

      return {
        freelancers: {
          total: totalFreelancers,
          active: activeFreelancers,
          inactive: totalFreelancers - activeFreelancers
        },
        employers: {
          total: totalEmployers,
          active: activeEmployers,
          inactive: totalEmployers - activeEmployers
        },
        bookings: {
          total: totalBookings,
          completed: completedBookings,
          pending: totalBookings - completedBookings
        },
        revenue: {
          total: totalRevenue,
          average: totalBookings > 0 ? totalRevenue / totalBookings : 0
        }
      };
    } catch (error) {
      throw error;
    }
  }
};

export default analyticsService;
