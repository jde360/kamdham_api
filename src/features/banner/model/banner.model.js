import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Banner title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    image: {
      type: String,
      required: [true, "Banner image is required"],
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
        },
        message: "Please provide a valid image URL",
      },
    },
    link: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: "Please provide a valid URL",
      },
    },
    linkText: {
      type: String,
      default: "Learn More",
      maxlength: [50, "Link text cannot exceed 50 characters"],
    },
    position: {
      type: String,
      enum: {
        values: ["home", "category", "jobs", "services", "footer", "header"],
        message: "Position must be one of: home, category, jobs, services, footer, header",
      },
      required: [true, "Banner position is required"],
    },
    priority: {
      type: Number,
      default: 1,
      min: [1, "Priority must be at least 1"],
      max: [10, "Priority cannot exceed 10"],
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive", "scheduled", "expired"],
        message: "Status must be one of: active, inactive, scheduled, expired",
      },
      default: "inactive",
    },
    targetAudience: {
      type: String,
      enum: {
        values: ["all", "users", "freelancers", "new_users", "premium_users"],
        message: "Target audience must be one of: all, users, freelancers, new_users, premium_users",
      },
      default: "all",
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
      validate: {
        validator: function(v) {
          return !v || !this.startDate || v > this.startDate;
        },
        message: "End date must be after start date",
      },
    },
    clickCount: {
      type: Number,
      default: 0,
      min: [0, "Click count cannot be negative"],
    },
    impressionCount: {
      type: Number,
      default: 0,
      min: [0, "Impression count cannot be negative"],
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for better performance
bannerSchema.index({ position: 1, status: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });
bannerSchema.index({ priority: -1 });
bannerSchema.index({ targetAudience: 1 });

// Virtual for CTR (Click Through Rate)
bannerSchema.virtual("ctr").get(function() {
  if (this.impressionCount === 0) return 0;
  return ((this.clickCount / this.impressionCount) * 100).toFixed(2);
});

// Pre-save middleware to auto-update status based on dates
bannerSchema.pre("save", function(next) {
  const now = new Date();
  
  if (this.startDate && this.endDate) {
    if (now < this.startDate) {
      this.status = "scheduled";
    } else if (now > this.endDate) {
      this.status = "expired";
    } else if (this.status === "scheduled" || this.status === "expired") {
      this.status = "active";
    }
  }
  
  next();
});

// Method to increment click count
bannerSchema.methods.incrementClick = function() {
  this.clickCount += 1;
  return this.save();
};

// Method to increment impression count
bannerSchema.methods.incrementImpression = function() {
  this.impressionCount += 1;
  return this.save();
};

// Static method to get active banners by position
bannerSchema.statics.getActiveBannersByPosition = function(position, targetAudience = "all") {
  const now = new Date();
  const query = {
    position,
    status: "active",
    isVisible: true,
    $or: [
      { targetAudience },
      { targetAudience: "all" }
    ]
  };

  // Add date filters if dates are set
  const dateQuery = {
    $or: [
      { startDate: { $exists: false }, endDate: { $exists: false } },
      { startDate: { $lte: now }, endDate: { $gte: now } },
      { startDate: { $lte: now }, endDate: { $exists: false } },
      { startDate: { $exists: false }, endDate: { $gte: now } }
    ]
  };

  return this.find({ ...query, ...dateQuery })
    .sort({ priority: -1, createdAt: -1 })
    .populate("category", "name")
    .populate("createdBy", "userName");
};

const BannerModel = mongoose.model("Banner", bannerSchema);
export default BannerModel;
