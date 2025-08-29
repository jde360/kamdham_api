import RatingReviewModel from "../model/ratingreview.model.js";
import { FreelancerServiceApplicationModel } from "../../freelancerServices/model/freelancerServiceApplication.model.js";
import FreelancerModel from "../../freelancer/model/freelancer.model.js";
import UserModel from "../../user/model/user.model.js";
import AppError from "../../../utils/error.js";
import { httpCode } from "../../../utils/httpCode.js";
import mongoose from "mongoose";

const ratingReviewService = {
  // Create a new rating and review
  createRatingReview: async (reviewData, reviewerId) => {
    try {
      const {
        freelancerId,
        bookingId,
        rating,
        review,
        categoryRatings,
        tags
      } = reviewData;

      // Validate required fields
      if (!freelancerId || !bookingId || !rating) {
        throw new AppError("Freelancer ID, booking ID, and rating are required", httpCode.BAD_REQUEST);
      }

      // Verify the booking exists and belongs to the reviewer
      const booking = await FreelancerServiceApplicationModel.findById(bookingId);
      if (!booking) {
        throw new AppError("Booking not found", httpCode.NOT_FOUND);
      }

      if (booking.client.toString() !== reviewerId.toString()) {
        throw new AppError("You can only review your own bookings", httpCode.FORBIDDEN);
      }

      // Check if booking is completed
      if (booking.status !== "completed") {
        throw new AppError("You can only review completed bookings", httpCode.BAD_REQUEST);
      }

      // Get freelancer info to verify
      const freelancer = await FreelancerModel.findById(freelancerId);
      if (!freelancer) {
        throw new AppError("Freelancer not found", httpCode.NOT_FOUND);
      }

      // Check if review already exists for this booking
      const existingReview = await RatingReviewModel.findOne({ booking: bookingId });
      if (existingReview) {
        throw new AppError("Review already exists for this booking", httpCode.CONFLICT);
      }

      // Create the review
      const newReview = await RatingReviewModel.create({
        freelancer: freelancerId,
        reviewer: reviewerId,
        booking: bookingId,
        rating: rating,
        review: review || "",
        categoryRatings: categoryRatings || {},
        tags: tags || [],
        isVerified: true, // Since it's from a completed booking
        status: "approved" // Auto-approve verified reviews
      });

      // Populate the review with related data
      await newReview.populate([
        { path: 'freelancer', select: 'name image profession' },
        { path: 'reviewer', select: 'name image' },
        { path: 'booking', select: 'bookingAmount scheduledDate status' }
      ]);

      return newReview;
    } catch (error) {
      throw error;
    }
  },

  // Update an existing review
  updateRatingReview: async (reviewId, updateData, reviewerId) => {
    try {
      const { rating, review, categoryRatings, tags } = updateData;

      // Find the review and verify ownership
      const existingReview = await RatingReviewModel.findOne({
        _id: reviewId,
        reviewer: reviewerId
      });

      if (!existingReview) {
        throw new AppError("Review not found or you don't have permission to update it", httpCode.FORBIDDEN);
      }

      // Update the review
      if (rating !== undefined) existingReview.rating = rating;
      if (review !== undefined) existingReview.review = review;
      if (categoryRatings !== undefined) {
        existingReview.categoryRatings = { ...existingReview.categoryRatings, ...categoryRatings };
      }
      if (tags !== undefined) existingReview.tags = tags;

      // Mark as edited
      existingReview.isEdited = true;
      existingReview.editedAt = new Date();

      await existingReview.save();

      // Populate the updated review
      await existingReview.populate([
        { path: 'freelancer', select: 'name image profession' },
        { path: 'reviewer', select: 'name image' },
        { path: 'booking', select: 'bookingAmount scheduledDate status' }
      ]);

      return existingReview;
    } catch (error) {
      throw error;
    }
  },

  // Delete a review (soft delete)
  deleteRatingReview: async (reviewId, reviewerId) => {
    try {
      // Find the review and verify ownership
      const review = await RatingReviewModel.findOne({
        _id: reviewId,
        reviewer: reviewerId
      });

      if (!review) {
        throw new AppError("Review not found or you don't have permission to delete it", httpCode.FORBIDDEN);
      }

      // Soft delete by changing status to hidden
      review.status = "hidden";
      await review.save();

      return { reviewId, deleted: true };
    } catch (error) {
      throw error;
    }
  },

  // Get reviews for a specific freelancer
  getFreelancerReviews: async (freelancerId, page = 1, limit = 10, filters = {}) => {
    try {
      const skip = (page - 1) * limit;
      const { rating, sortBy = 'recent', verified } = filters;

      // Build query
      const query = {
        freelancer: freelancerId,
        status: "approved"
      };

      if (rating) {
        query.rating = rating;
      }

      if (verified !== undefined) {
        query.isVerified = verified;
      }

      // Build sort
      let sort = { createdAt: -1 }; // Default: most recent first
      if (sortBy === 'oldest') {
        sort = { createdAt: 1 };
      } else if (sortBy === 'highest') {
        sort = { rating: -1, createdAt: -1 };
      } else if (sortBy === 'lowest') {
        sort = { rating: 1, createdAt: -1 };
      } else if (sortBy === 'helpful') {
        sort = { helpfulVotes: -1, createdAt: -1 };
      }

      // Get reviews
      const reviews = await RatingReviewModel.find(query)
        .populate('reviewer', 'name image')
        .populate('booking', 'bookingAmount scheduledDate')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      // Get total count
      const totalReviews = await RatingReviewModel.countDocuments(query);

      // Get freelancer's rating summary
      const ratingSummary = await RatingReviewModel.getFreelancerAverageRating(freelancerId);
      const categoryRatings = await RatingReviewModel.getFreelancerCategoryRatings(freelancerId);

      return {
        reviews,
        pagination: {
          page,
          limit,
          totalReviews,
          totalPages: Math.ceil(totalReviews / limit),
          hasNext: page * limit < totalReviews,
          hasPrev: page > 1
        },
        ratingSummary: {
          ...ratingSummary,
          categoryRatings
        }
      };
    } catch (error) {
      throw error;
    }
  },

  // Get reviews by a specific user
  getUserReviews: async (userId, page = 1, limit = 10) => {
    try {
      const skip = (page - 1) * limit;

      const reviews = await RatingReviewModel.find({
        reviewer: userId
      })
      .populate('freelancer', 'name image profession')
      .populate('booking', 'bookingAmount scheduledDate status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

      const totalReviews = await RatingReviewModel.countDocuments({
        reviewer: userId
      });

      return {
        reviews,
        pagination: {
          page,
          limit,
          totalReviews,
          totalPages: Math.ceil(totalReviews / limit),
          hasNext: page * limit < totalReviews,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw error;
    }
  },

  // Get a specific review by ID
  getReviewById: async (reviewId) => {
    try {
      const review = await RatingReviewModel.findById(reviewId)
        .populate('freelancer', 'name image profession')
        .populate('reviewer', 'name image')
        .populate('booking', 'bookingAmount scheduledDate status')
        .populate('adminResponse.respondedBy', 'name');

      if (!review) {
        throw new AppError("Review not found", httpCode.NOT_FOUND);
      }

      return review;
    } catch (error) {
      throw error;
    }
  },

  // Mark review as helpful
  markReviewAsHelpful: async (reviewId, userId) => {
    try {
      const review = await RatingReviewModel.findById(reviewId);
      if (!review) {
        throw new AppError("Review not found", httpCode.NOT_FOUND);
      }

      // Don't allow users to mark their own reviews as helpful
      if (review.reviewer.toString() === userId.toString()) {
        throw new AppError("You cannot mark your own review as helpful", httpCode.BAD_REQUEST);
      }

      await review.markAsHelpful(userId);
      return { reviewId, markedAsHelpful: true, helpfulVotes: review.helpfulVotes };
    } catch (error) {
      throw error;
    }
  },

  // Unmark review as helpful
  unmarkReviewAsHelpful: async (reviewId, userId) => {
    try {
      const review = await RatingReviewModel.findById(reviewId);
      if (!review) {
        throw new AppError("Review not found", httpCode.NOT_FOUND);
      }

      await review.unmarkAsHelpful(userId);
      return { reviewId, unmarkedAsHelpful: true, helpfulVotes: review.helpfulVotes };
    } catch (error) {
      throw error;
    }
  },

  // Add freelancer response to review
  addFreelancerResponse: async (reviewId, freelancerId, responseMessage) => {
    try {
      if (!responseMessage || responseMessage.trim().length === 0) {
        throw new AppError("Response message is required", httpCode.BAD_REQUEST);
      }

      const review = await RatingReviewModel.findOne({
        _id: reviewId,
        freelancer: freelancerId
      });

      if (!review) {
        throw new AppError("Review not found or you don't have permission to respond", httpCode.FORBIDDEN);
      }

      // Add freelancer response
      review.freelancerResponse = {
        message: responseMessage.trim(),
        respondedAt: new Date()
      };

      await review.save();

      await review.populate([
        { path: 'freelancer', select: 'name image profession' },
        { path: 'reviewer', select: 'name image' },
        { path: 'booking', select: 'bookingAmount scheduledDate status' }
      ]);

      return review;
    } catch (error) {
      throw error;
    }
  },

  // Add admin response to review
  addAdminResponse: async (reviewId, adminId, responseMessage) => {
    try {
      if (!responseMessage || responseMessage.trim().length === 0) {
        throw new AppError("Response message is required", httpCode.BAD_REQUEST);
      }

      const review = await RatingReviewModel.findById(reviewId);
      if (!review) {
        throw new AppError("Review not found", httpCode.NOT_FOUND);
      }

      // Add admin response
      review.adminResponse = {
        message: responseMessage.trim(),
        respondedBy: adminId,
        respondedAt: new Date()
      };

      await review.save();

      await review.populate([
        { path: 'freelancer', select: 'name image profession' },
        { path: 'reviewer', select: 'name image' },
        { path: 'booking', select: 'bookingAmount scheduledDate status' },
        { path: 'adminResponse.respondedBy', select: 'name' }
      ]);

      return review;
    } catch (error) {
      throw error;
    }
  },

  // Get platform-wide review statistics
  getReviewStatistics: async () => {
    try {
      const [
        totalReviews,
        averageRating,
        ratingDistribution,
        verifiedReviews,
        recentReviews
      ] = await Promise.all([
        RatingReviewModel.countDocuments({ status: "approved" }),
        RatingReviewModel.aggregate([
          { $match: { status: "approved" } },
          { $group: { _id: null, avgRating: { $avg: "$rating" } } }
        ]),
        RatingReviewModel.aggregate([
          { $match: { status: "approved" } },
          {
            $group: {
              _id: "$rating",
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: -1 } }
        ]),
        RatingReviewModel.countDocuments({ status: "approved", isVerified: true }),
        RatingReviewModel.find({ status: "approved" })
          .populate('freelancer', 'name profession')
          .populate('reviewer', 'name')
          .sort({ createdAt: -1 })
          .limit(5)
      ]);

      // Format rating distribution
      const distributionMap = {
        5: 0, 4: 0, 3: 0, 2: 0, 1: 0
      };
      ratingDistribution.forEach(item => {
        distributionMap[item._id] = item.count;
      });

      return {
        totalReviews,
        averageRating: averageRating[0]?.avgRating ? Math.round(averageRating[0].avgRating * 2) / 2 : 0,
        ratingDistribution: distributionMap,
        verifiedReviews,
        verificationRate: totalReviews > 0 ? Math.round((verifiedReviews / totalReviews) * 100) : 0,
        recentReviews
      };
    } catch (error) {
      throw error;
    }
  },

  // Search reviews
  searchReviews: async (searchQuery, filters = {}, page = 1, limit = 10) => {
    try {
      const skip = (page - 1) * limit;
      const { rating, freelancerId, verified, dateFrom, dateTo } = filters;

      // Build search query
      const query = {
        status: "approved",
        $or: [
          { review: { $regex: searchQuery, $options: 'i' } },
          { tags: { $in: [new RegExp(searchQuery, 'i')] } }
        ]
      };

      // Apply filters
      if (rating) query.rating = rating;
      if (freelancerId) query.freelancer = freelancerId;
      if (verified !== undefined) query.isVerified = verified;
      
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }

      const reviews = await RatingReviewModel.find(query)
        .populate('freelancer', 'name image profession')
        .populate('reviewer', 'name image')
        .populate('booking', 'bookingAmount scheduledDate')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalResults = await RatingReviewModel.countDocuments(query);

      return {
        reviews,
        searchQuery,
        pagination: {
          page,
          limit,
          totalResults,
          totalPages: Math.ceil(totalResults / limit),
          hasNext: page * limit < totalResults,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw error;
    }
  },

  // Get top-rated freelancers
  getTopRatedFreelancers: async (limit = 10) => {
    try {
      const topRated = await RatingReviewModel.aggregate([
        {
          $match: { status: "approved" }
        },
        {
          $group: {
            _id: "$freelancer",
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 }
          }
        },
        {
          $match: {
            totalReviews: { $gte: 5 } // At least 5 reviews
          }
        },
        {
          $sort: {
            averageRating: -1,
            totalReviews: -1
          }
        },
        {
          $limit: limit
        }
      ]);

      // Populate freelancer details
      const freelancerIds = topRated.map(item => item._id);
      const freelancers = await FreelancerModel.find({
        _id: { $in: freelancerIds }
      }).select('name image profession skills');

      // Combine data
      const result = topRated.map(rating => {
        const freelancer = freelancers.find(f => f._id.toString() === rating._id.toString());
        return {
          freelancer,
          averageRating: Math.round(rating.averageRating * 2) / 2,
          totalReviews: rating.totalReviews
        };
      });

      return result;
    } catch (error) {
      throw error;
    }
  }
};

export default ratingReviewService;
