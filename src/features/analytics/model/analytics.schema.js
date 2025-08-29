/**
 * Analytics API Response Schemas
 * 
 * This file documents the expected response structures for analytics endpoints.
 * These are not MongoDB models but rather TypeScript-like definitions for API responses.
 */

// Monthly Growth Response Schema
export const MonthlyGrowthSchema = {
  period: {
    startDate: "ISO String",
    endDate: "ISO String"
  },
  freelancerGrowth: [
    {
      year: "Number",
      month: "Number", 
      monthName: "String",
      count: "Number",
      activeFreelancers: "Number",
      registeredFreelancers: "Number"
    }
  ],
  employerGrowth: [
    {
      year: "Number",
      month: "Number",
      monthName: "String", 
      count: "Number",
      activeEmployers: "Number",
      registeredEmployers: "Number"
    }
  ],
  bookingGrowth: [
    {
      year: "Number",
      month: "Number",
      monthName: "String",
      count: "Number",
      revenue: "Number",
      completedBookings: "Number",
      pendingBookings: "Number", 
      acceptedBookings: "Number",
      rejectedBookings: "Number",
      averageBookingValue: "Number"
    }
  ],
  summary: {
    totalFreelancers: "Number",
    totalEmployers: "Number", 
    totalBookings: "Number",
    totalRevenue: "Number"
  }
};

// Overall Stats Response Schema
export const OverallStatsSchema = {
  freelancers: {
    total: "Number",
    active: "Number",
    inactive: "Number"
  },
  employers: {
    total: "Number", 
    active: "Number",
    inactive: "Number"
  },
  bookings: {
    total: "Number",
    completed: "Number",
    pending: "Number"
  },
  revenue: {
    total: "Number",
    average: "Number"
  }
};

// Dashboard Summary Response Schema
export const DashboardSummarySchema = {
  ...OverallStatsSchema,
  growthMetrics: {
    freelancerMonthlyGrowthRate: "Number", // Percentage
    last12Months: MonthlyGrowthSchema
  }
};

// Individual Growth Response Schemas
export const FreelancerGrowthSchema = [
  {
    year: "Number",
    month: "Number",
    monthName: "String",
    count: "Number", 
    activeFreelancers: "Number",
    registeredFreelancers: "Number"
  }
];

export const EmployerGrowthSchema = [
  {
    year: "Number",
    month: "Number", 
    monthName: "String",
    count: "Number",
    activeEmployers: "Number", 
    registeredEmployers: "Number"
  }
];

export const BookingGrowthSchema = [
  {
    year: "Number",
    month: "Number",
    monthName: "String",
    count: "Number",
    revenue: "Number",
    completedBookings: "Number",
    pendingBookings: "Number",
    acceptedBookings: "Number", 
    rejectedBookings: "Number",
    averageBookingValue: "Number"
  }
];
