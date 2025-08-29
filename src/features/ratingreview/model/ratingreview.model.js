import mongoose from "mongoose";

const ratingReviewSchema = new mongoose.Schema(
  {
    // Who is being rated (the freelancer)
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer",
      required: true,
    },
    // Who is giving the rating (the client/user)
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Related booking/service application
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreelancerServiceApplication",
      required: true,
    },
    // Rating out of 5
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: function(value) {
          return Number.isInteger(value) || (value * 2) % 1 === 0; // Allow integers and half ratings
        },
        message: "Rating must be an integer or half value between 1 and 5"
      }
    },
    // Written review (optional)
    review: {
      type: String,
      maxlength: 1000,
      trim: true,
      default: "",
    },
    // Category-specific ratings (optional detailed breakdown)
    categoryRatings: {
      communication: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      quality: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      timeliness: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      professionalism: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      valueForMoney: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
    },
    // Status of the review
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "hidden"],
      default: "approved",
    },
    // Whether this review is verified (from actual completed booking)
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Admin response to the review (if any)
    adminResponse: {
      message: {
        type: String,
        maxlength: 500,
        trim: true,
        default: "",
      },
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      respondedAt: {
        type: Date,
        default: null,
      },
    },
    // Freelancer response to the review
    freelancerResponse: {
      message: {
        type: String,
        maxlength: 500,
        trim: true,
        default: "",
      },
      respondedAt: {
        type: Date,
        default: null,
      },
    },
    // Helpfulness votes from other users
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    // Users who voted this review as helpful
    helpfulBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    // Whether the review is edited
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    // Tags for the review
    tags: [{
      type: String,
      lowercase: true,
      trim: true,
    }],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for better performance
ratingReviewSchema.index({ freelancer: 1, createdAt: -1 });
ratingReviewSchema.index({ reviewer: 1 });
ratingReviewSchema.index({ booking: 1 });
ratingReviewSchema.index({ rating: 1 });
ratingReviewSchema.index({ status: 1 });
ratingReviewSchema.index({ isVerified: 1 });

// Ensure one review per booking
ratingReviewSchema.index({ booking: 1 }, { unique: true });

// Virtual for overall category rating average
ratingReviewSchema.virtual('averageCategoryRating').get(function() {
  const ratings = this.categoryRatings;
  const validRatings = Object.values(ratings).filter(rating => rating !== null && rating !== undefined);
  
  if (validRatings.length === 0) return null;
  
  const sum = validRatings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / validRatings.length) * 2) / 2; // Round to nearest 0.5
});

// Static method to get freelancer's average rating
ratingReviewSchema.statics.getFreelancerAverageRating = async function(freelancerId) {
  const result = await this.aggregate([
    {
      $match: {
        freelancer: new mongoose.Types.ObjectId(freelancerId),
        status: "approved"
      }
    },
    {
      $group: {
        _id: "$freelancer",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: {
            $switch: {
              branches: [
                { case: { $eq: ["$rating", 5] }, then: "5star" },
                { case: { $eq: ["$rating", 4] }, then: "4star" },
                { case: { $eq: ["$rating", 3] }, then: "3star" },
                { case: { $eq: ["$rating", 2] }, then: "2star" },
                { case: { $eq: ["$rating", 1] }, then: "1star" }
              ],
              default: "other"
            }
          }
        }
      }
    }
  ]);

  if (result.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {
        "5star": 0,
        "4star": 0,
        "3star": 0,
        "2star": 0,
        "1star": 0
      }
    };
  }

  const data = result[0];
  
  // Count rating distribution
  const distribution = {
    "5star": 0,
    "4star": 0,
    "3star": 0,
    "2star": 0,
    "1star": 0
  };

  data.ratingDistribution.forEach(rating => {
    if (distribution[rating] !== undefined) {
      distribution[rating]++;
    }
  });

  return {
    averageRating: Math.round(data.averageRating * 2) / 2, // Round to nearest 0.5
    totalReviews: data.totalReviews,
    ratingDistribution: distribution
  };
};

// Static method to get category-wise average ratings
ratingReviewSchema.statics.getFreelancerCategoryRatings = async function(freelancerId) {
  const result = await this.aggregate([
    {
      $match: {
        freelancer: new mongoose.Types.ObjectId(freelancerId),
        status: "approved"
      }
    },
    {
      $group: {
        _id: "$freelancer",
        avgCommunication: { $avg: "$categoryRatings.communication" },
        avgQuality: { $avg: "$categoryRatings.quality" },
        avgTimeliness: { $avg: "$categoryRatings.timeliness" },
        avgProfessionalism: { $avg: "$categoryRatings.professionalism" },
        avgValueForMoney: { $avg: "$categoryRatings.valueForMoney" },
      }
    }
  ]);

  if (result.length === 0) {
    return {
      communication: null,
      quality: null,
      timeliness: null,
      professionalism: null,
      valueForMoney: null,
    };
  }

  const data = result[0];
  return {
    communication: data.avgCommunication ? Math.round(data.avgCommunication * 2) / 2 : null,
    quality: data.avgQuality ? Math.round(data.avgQuality * 2) / 2 : null,
    timeliness: data.avgTimeliness ? Math.round(data.avgTimeliness * 2) / 2 : null,
    professionalism: data.avgProfessionalism ? Math.round(data.avgProfessionalism * 2) / 2 : null,
    valueForMoney: data.avgValueForMoney ? Math.round(data.avgValueForMoney * 2) / 2 : null,
  };
};

// Method to mark review as helpful
ratingReviewSchema.methods.markAsHelpful = async function(userId) {
  if (!this.helpfulBy.includes(userId)) {
    this.helpfulBy.push(userId);
    this.helpfulVotes += 1;
    await this.save();
  }
  return this;
};

// Method to unmark review as helpful
ratingReviewSchema.methods.unmarkAsHelpful = async function(userId) {
  const index = this.helpfulBy.indexOf(userId);
  if (index > -1) {
    this.helpfulBy.splice(index, 1);
    this.helpfulVotes -= 1;
    await this.save();
  }
  return this;
};

const RatingReviewModel = mongoose.model("RatingReview", ratingReviewSchema);
export default RatingReviewModel;
