import { formattedResponse } from "../../../utils/formatedRes.js";
import { httpCode } from "../../../utils/httpCode.js";
import analyticsService from "../services/analytics.service.js";

// Get monthly growth for current year
export const getCurrentYearGrowth = async (req, res, next) => {
  try {
    const result = await analyticsService.getCurrentYearGrowth();
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Current year growth data fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get monthly growth for last N months
export const getLastNMonthsGrowth = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 12;
    const result = await analyticsService.getLastNMonthsGrowth(months);
    return res
      .status(httpCode.OK)
      .json(formattedResponse(`Last ${months} months growth data fetched successfully`, result));
  } catch (error) {
    next(error);
  }
};

// Get monthly growth for custom date range
export const getCustomRangeGrowth = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res
        .status(httpCode.BAD_REQUEST)
        .json(formattedResponse("Start date and end date are required", null));
    }

    const result = await analyticsService.getMonthlyGrowth(startDate, endDate);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Custom range growth data fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get freelancer monthly growth only
export const getFreelancerGrowth = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res
        .status(httpCode.BAD_REQUEST)
        .json(formattedResponse("Start date and end date are required", null));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const result = await analyticsService.getFreelancerMonthlyGrowth(start, end);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer growth data fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get employer monthly growth only
export const getEmployerGrowth = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res
        .status(httpCode.BAD_REQUEST)
        .json(formattedResponse("Start date and end date are required", null));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const result = await analyticsService.getEmployerMonthlyGrowth(start, end);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Employer growth data fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get booking monthly growth only
export const getBookingGrowth = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res
        .status(httpCode.BAD_REQUEST)
        .json(formattedResponse("Start date and end date are required", null));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const result = await analyticsService.getBookingMonthlyGrowth(start, end);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Booking growth data fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get overall platform statistics
export const getOverallStats = async (req, res, next) => {
  try {
    const result = await analyticsService.getOverallStats();
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Overall platform statistics fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get dashboard summary with key metrics
export const getDashboardSummary = async (req, res, next) => {
  try {
    const [overallStats, last12MonthsGrowth] = await Promise.all([
      analyticsService.getOverallStats(),
      analyticsService.getLastNMonthsGrowth(12)
    ]);

    // Calculate month-over-month growth percentage
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const currentMonthData = last12MonthsGrowth.freelancerGrowth.find(
      item => item.year === currentYear && item.month === currentMonth
    ) || { count: 0 };
    
    const previousMonthData = last12MonthsGrowth.freelancerGrowth.find(
      item => item.year === previousYear && item.month === previousMonth
    ) || { count: 0 };

    const freelancerGrowthRate = previousMonthData.count > 0 
      ? ((currentMonthData.count - previousMonthData.count) / previousMonthData.count * 100)
      : 0;

    const result = {
      ...overallStats,
      growthMetrics: {
        freelancerMonthlyGrowthRate: Math.round(freelancerGrowthRate * 100) / 100,
        last12Months: last12MonthsGrowth
      }
    };

    return res
      .status(httpCode.OK)
      .json(formattedResponse("Dashboard summary fetched successfully", result));
  } catch (error) {
    next(error);
  }
};
