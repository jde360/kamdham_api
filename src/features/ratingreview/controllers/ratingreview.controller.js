import { formattedResponse } from "../../../utils/formatedRes.js";
import { httpCode } from "../../../utils/httpCode.js";
import ratingReviewService from "../services/ratingreview.service.js";

// Create a new rating and review
export const createRatingReview = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const reviewData = req.body;

    const result = await ratingReviewService.createRatingReview(reviewData, userId);
    return res
      .status(httpCode.CREATED)
      .json(formattedResponse("Rating and review created successfully", result));
  } catch (error) {
    next(error);
  }
};

// Update an existing review
export const updateRatingReview = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { reviewId } = req.params;
    const updateData = req.body;

    const result = await ratingReviewService.updateRatingReview(reviewId, updateData, userId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Review updated successfully", result));
  } catch (error) {
    next(error);
  }
};

// Delete a review
export const deleteRatingReview = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { reviewId } = req.params;

    const result = await ratingReviewService.deleteRatingReview(reviewId, userId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Review deleted successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get reviews for a specific freelancer
export const getFreelancerReviews = async (req, res, next) => {
  try {
    const { freelancerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      rating: req.query.rating ? parseInt(req.query.rating) : undefined,
      sortBy: req.query.sortBy || 'recent',
      verified: req.query.verified !== undefined ? req.query.verified === 'true' : undefined
    };

    const result = await ratingReviewService.getFreelancerReviews(freelancerId, page, limit, filters);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer reviews fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get reviews by the authenticated user
export const getUserReviews = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await ratingReviewService.getUserReviews(userId, page, limit);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("User reviews fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get a specific review by ID
export const getReviewById = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const result = await ratingReviewService.getReviewById(reviewId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Review fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Mark a review as helpful
export const markReviewAsHelpful = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { reviewId } = req.params;

    const result = await ratingReviewService.markReviewAsHelpful(reviewId, userId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Review marked as helpful", result));
  } catch (error) {
    next(error);
  }
};

// Unmark a review as helpful
export const unmarkReviewAsHelpful = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { reviewId } = req.params;

    const result = await ratingReviewService.unmarkReviewAsHelpful(reviewId, userId);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Review unmarked as helpful", result));
  } catch (error) {
    next(error);
  }
};

// Add freelancer response to a review
export const addFreelancerResponse = async (req, res, next) => {
  try {
    const freelancerId = req.user.userId;
    const { reviewId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res
        .status(httpCode.BAD_REQUEST)
        .json(formattedResponse("Response message is required", null));
    }

    const result = await ratingReviewService.addFreelancerResponse(reviewId, freelancerId, message);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Freelancer response added successfully", result));
  } catch (error) {
    next(error);
  }
};

// Add admin response to a review
export const addAdminResponse = async (req, res, next) => {
  try {
    const adminId = req.user.userId;
    const { reviewId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res
        .status(httpCode.BAD_REQUEST)
        .json(formattedResponse("Response message is required", null));
    }

    const result = await ratingReviewService.addAdminResponse(reviewId, adminId, message);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Admin response added successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get platform-wide review statistics (Admin only)
export const getReviewStatistics = async (req, res, next) => {
  try {
    const result = await ratingReviewService.getReviewStatistics();
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Review statistics fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Search reviews
export const searchReviews = async (req, res, next) => {
  try {
    const { q: searchQuery } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!searchQuery) {
      return res
        .status(httpCode.BAD_REQUEST)
        .json(formattedResponse("Search query is required", null));
    }

    const filters = {
      rating: req.query.rating ? parseInt(req.query.rating) : undefined,
      freelancerId: req.query.freelancerId,
      verified: req.query.verified !== undefined ? req.query.verified === 'true' : undefined,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    const result = await ratingReviewService.searchReviews(searchQuery, filters, page, limit);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Reviews searched successfully", result));
  } catch (error) {
    next(error);
  }
};

// Get top-rated freelancers
export const getTopRatedFreelancers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await ratingReviewService.getTopRatedFreelancers(limit);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Top-rated freelancers fetched successfully", result));
  } catch (error) {
    next(error);
  }
};
